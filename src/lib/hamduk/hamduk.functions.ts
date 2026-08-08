import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyChessProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getLink } = await import("./sync.server");
    const { userId } = context;

    const link = await getLink(userId);
    if (!link) return { link: null, rating: null, games: [] as any[] };

    const [{ data: rating }, { data: games }] = await Promise.all([
      supabaseAdmin
        .from("hamduk_ratings")
        .select("hamduk_username, classical_rating, country, breakdown, synced_at")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin
        .from("hamduk_games")
        .select("game_id, white, black, time_control, variant, result, end_reason, rated, moves, white_rating_delta, black_rating_delta, played_at")
        .eq("user_id", userId)
        .order("played_at", { ascending: false })
        .limit(25),
    ]);

    return { link, rating: rating ?? null, games: games ?? [] };
  });

export const linkChessAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        username: z
          .string()
          .trim()
          .min(2)
          .max(40)
          .regex(/^[A-Za-z0-9_.-]+$/, "Usernames can only contain letters, numbers, dots, dashes and underscores."),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fail, syncMember } = await import("./sync.server");
    const { rateLimit } = await import("@/lib/cache/redis.server");
    const { userId } = context;

    await rateLimit(userId, { name: "hamduk-link", limit: 10, windowSeconds: 60 });

    const { error } = await supabaseAdmin.from("hamduk_accounts").upsert(
      { user_id: userId, hamduk_username: data.username, link_status: "pending" },
      { onConflict: "user_id" },
    );
    if (error) fail("link", error);

    try {
      const result = await syncMember(userId, data.username);
      return { ok: true, ...result };
    } catch (e) {
      fail("link.sync", e);
    }
  });

export const unlinkChessAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("hamduk_games").delete().eq("user_id", context.userId);
    await supabaseAdmin.from("hamduk_ratings").delete().eq("user_id", context.userId);
    await supabaseAdmin.from("hamduk_accounts").delete().eq("user_id", context.userId);
    return { ok: true };
  });

export const syncMyChessData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { fail, getLink, syncMember } = await import("./sync.server");
    const { rateLimit } = await import("@/lib/cache/redis.server");
    const { userId } = context;

    await rateLimit(userId, { name: "hamduk-sync", limit: 6, windowSeconds: 60 });

    const link = await getLink(userId);
    if (!link) throw new Error("Link your Hamduk Chess username first.");
    try {
      return { ok: true, ...(await syncMember(userId, link.hamduk_username)) };
    } catch (e) {
      fail("sync", e);
    }
  });

/* ---------- embeds (board / puzzles / leaderboard) ---------- */

export const listChessEmbeds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("hamduk_embeds")
      .select("id, kind, label, embed_url, config, expires_at, created_at")
      .order("created_at", { ascending: false });
    if (error) {
      const { fail } = await import("./sync.server");
      fail("listEmbeds", error);
    }
    return data ?? [];
  });

export const createChessEmbed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        kind: z.enum(["board", "puzzle", "leaderboard", "analysis"]),
        label: z.string().trim().min(2).max(80),
        config: z.record(z.string(), z.any()).default({}),
        ttl_hours: z.number().int().min(1).max(8760).default(720),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fail, isSuperAdmin } = await import("./sync.server");
    const { createEmbedToken } = await import("./hamduk.server");

    if (!(await isSuperAdmin(context.supabase, context.userId))) throw new Error("Forbidden");

    try {
      const token = await createEmbedToken(data.kind, data.config, data.ttl_hours);
      const { data: row, error } = await supabaseAdmin
        .from("hamduk_embeds")
        .insert({
          kind: data.kind,
          label: data.label,
          token: token.token,
          embed_url: token.embed_url,
          iframe_html: token.iframe,
          config: data.config,
          expires_at: token.expires_at,
          created_by: context.userId,
        })
        .select("id, kind, label, embed_url, expires_at")
        .single();
      if (error) fail("createEmbed.save", error);
      return row;
    } catch (e) {
      fail("createEmbed", e);
    }
  });

export const deleteChessEmbed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isSuperAdmin } = await import("./sync.server");
    const { revokeEmbedToken } = await import("./hamduk.server");

    if (!(await isSuperAdmin(context.supabase, context.userId))) throw new Error("Forbidden");

    const { data: row } = await supabaseAdmin
      .from("hamduk_embeds")
      .select("token")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.token) {
      try {
        await revokeEmbedToken(row.token);
      } catch (e) {
        console.warn("[hamduk.revokeEmbed]", e);
      }
    }
    await supabaseAdmin.from("hamduk_embeds").delete().eq("id", data.id);
    return { ok: true };
  });

/* ---------- admin: integration status, member sync, webhooks ---------- */

export const getIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isSuperAdmin } = await import("./sync.server");
    if (!(await isSuperAdmin(context.supabase, context.userId))) throw new Error("Forbidden");

    const configured =
      Boolean(process.env["HAMDUK_CHESS_API_KEY"]) && Boolean(process.env["HAMDUK_CHESS_API_BASE_URL"]);

    const [{ data: accounts }, { data: webhooks }, { data: events }] = await Promise.all([
      supabaseAdmin
        .from("hamduk_accounts")
        .select("user_id, hamduk_username, link_status, last_synced_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseAdmin
        .from("hamduk_webhooks")
        .select("id, remote_id, url, events, disabled, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("hamduk_webhook_events")
        .select("id, event, signature_valid, received_at, payload")
        .order("received_at", { ascending: false })
        .limit(25),
    ]);

    const ids = (accounts ?? []).map((a: any) => a.user_id);
    let names: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", ids);
      for (const p of profs ?? []) names[p.id] = p.full_name;
    }

    return {
      configured,
      accounts: (accounts ?? []).map((a: any) => ({ ...a, full_name: names[a.user_id] ?? "Unknown" })),
      webhooks: webhooks ?? [],
      events: events ?? [],
    };
  });

export const syncAllChessAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isSuperAdmin, syncMember } = await import("./sync.server");
    const { invalidate } = await import("@/lib/cache/redis.server");
    if (!(await isSuperAdmin(context.supabase, context.userId))) throw new Error("Forbidden");

    const { data: accounts } = await supabaseAdmin
      .from("hamduk_accounts")
      .select("user_id, hamduk_username")
      .limit(100);

    let synced = 0;
    const failed: string[] = [];
    for (const a of accounts ?? []) {
      try {
        await syncMember(a.user_id, a.hamduk_username);
        synced += 1;
      } catch {
        failed.push(a.hamduk_username);
      }
    }
    await invalidate("leaderboard:top100");
    return { synced, failed };
  });

export const registerChessWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        url: z.string().url().max(500),
        events: z.array(z.string().min(3).max(60)).min(1).max(20),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { fail, isSuperAdmin } = await import("./sync.server");
    const { registerRemoteWebhook } = await import("./hamduk.server");
    if (!(await isSuperAdmin(context.supabase, context.userId))) throw new Error("Forbidden");

    try {
      const res = await registerRemoteWebhook(data.url, data.events);
      const { error } = await supabaseAdmin.from("hamduk_webhooks").insert({
        remote_id: res.webhook.id,
        url: res.webhook.url,
        events: res.webhook.events,
        signing_secret: res.signing_secret,
      });
      if (error) fail("registerWebhook.save", error);
      return { ok: true };
    } catch (e) {
      fail("registerWebhook", e);
    }
  });

export const deleteChessWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { isSuperAdmin } = await import("./sync.server");
    const { deleteRemoteWebhook } = await import("./hamduk.server");
    if (!(await isSuperAdmin(context.supabase, context.userId))) throw new Error("Forbidden");

    const { data: row } = await supabaseAdmin
      .from("hamduk_webhooks")
      .select("remote_id")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.remote_id) {
      try {
        await deleteRemoteWebhook(row.remote_id);
      } catch (e) {
        console.warn("[hamduk.deleteWebhook]", e);
      }
    }
    await supabaseAdmin.from("hamduk_webhooks").delete().eq("id", data.id);
    return { ok: true };
  });