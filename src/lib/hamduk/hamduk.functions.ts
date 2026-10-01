import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PlatformRating = {
  time_control: string;
  variant: string;
  rating: number;
  games_played: number;
  wins: number;
  losses: number;
  draws: number;
};

type PlatformGame = {
  id: string;
  white_id: string;
  black_id: string;
  time_control: string;
  variant: string;
  result: string | null;
  end_reason: string | null;
  rated: boolean;
  ply: number;
  ended_at: string | null;
  created_at: string;
};

// Ratings and games are read straight from the platform's own tables -- club.chess and
// play.chess share one auth.users now, so there's no "link your account" step: a club
// member's chess history is just their chess history. The generated Database type is scoped
// to the "club" schema only, so these cross-schema reads (and their row shapes) are typed by
// hand instead.
export const getMyChessProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { userId } = context;
    const pub = (supabaseAdmin as any).schema("public");

    const [{ data: ratings }, { data: games }]: [{ data: PlatformRating[] | null }, { data: PlatformGame[] | null }] = await Promise.all([
      pub
        .from("ratings")
        .select("time_control, variant, rating, games_played, wins, losses, draws")
        .eq("user_id", userId)
        .order("rating", { ascending: false }),
      pub
        .from("games")
        .select(
          "id, white_id, black_id, time_control, variant, result, end_reason, rated, ply, white_rating_delta, black_rating_delta, ended_at, created_at",
        )
        .or(`white_id.eq.${userId},black_id.eq.${userId}`)
        .eq("status", "completed")
        .order("ended_at", { ascending: false })
        .limit(25),
    ]);

    const opponentIds = Array.from(
      new Set((games ?? []).flatMap((g: any) => [g.white_id, g.black_id])),
    );
    let names: Record<string, string> = {};
    if (opponentIds.length) {
      const { data: profs } = await pub.from("profiles").select("id, username").in("id", opponentIds);
      for (const p of (profs ?? []) as any[]) names[p.id] = p.username;
    }

    return {
      ratings: ratings ?? [],
      games: (games ?? []).map((g: any) => ({
        game_id: g.id,
        white: names[g.white_id] ?? "—",
        black: names[g.black_id] ?? "—",
        time_control: g.time_control,
        variant: g.variant,
        result: g.result,
        end_reason: g.end_reason,
        rated: g.rated,
        moves: g.ply,
        played_at: g.ended_at ?? g.created_at,
      })),
    };
  });

/* ---------- embeds (board / puzzles / leaderboard) ---------- */

export const listChessEmbeds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("embeds")
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
        // Must match EMBED_KINDS on the platform (play.chess.hamduk.com.ng's /embed/{kind}/{token}
        // route only knows these four); it rejects anything else with a 400.
        kind: z.enum(["board", "puzzle", "leaderboard", "game"]),
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
        .from("embeds")
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
      .from("embeds")
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
    await supabaseAdmin.from("embeds").delete().eq("id", data.id);
    return { ok: true };
  });

/* ---------- admin: integration status ---------- */

// "Configured" just means the API key/base URL needed for embeds and the tournament/class
// sync calls are set -- there's no more account-linking status to report since ratings/games
// are read directly (see getMyChessProfile above), and webhook delivery now verifies against
// a single static secret instead of a DB-registered list (see /api/public/hamduk-webhook).
export const getIntegrationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { isSuperAdmin } = await import("./sync.server");
    if (!(await isSuperAdmin(context.supabase, context.userId))) throw new Error("Forbidden");

    const configured =
      Boolean(process.env["HAMDUK_CHESS_API_KEY"]) && Boolean(process.env["HAMDUK_CHESS_API_BASE_URL"]);
    const webhookConfigured = Boolean(process.env["HAMDUK_CHESS_WEBHOOK_SECRET"]);

    return { configured, webhookConfigured };
  });