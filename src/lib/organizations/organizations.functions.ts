import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function fail(scope: string, error: unknown): never {
  console.error(`[organizations.${scope}]`, error);
  throw new Error("Something went wrong. Please try again.");
}

async function getRoles(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as string);
}

/** The org this user owns, or null. Super admins don't implicitly own one. */
async function myOwnedOrg(userId: string) {
  const { data } = await supabaseAdmin
    .from("organizations")
    .select("id, name, join_code, join_policy")
    .eq("owner_user_id", userId)
    .maybeSingle();
  return data;
}

function randomCode(len: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I -- easy to read aloud/type
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function slugPrefix(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
  return initials || "ORG";
}

/** My own organization's join settings (org admins only), generating a code on first call. */
export const getMyOrgJoinSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const org = await myOwnedOrg(context.userId);
    if (!org) return null;
    if (org.join_code) return org;

    // First time: generate a unique code. Collisions are astronomically unlikely at this
    // length, but retry a few times defensively since join_code is UNIQUE.
    const prefix = slugPrefix(org.name);
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = `${prefix}-CHESS-${randomCode(4)}`;
      const { data: updated, error } = await supabaseAdmin
        .from("organizations")
        .update({ join_code: code })
        .eq("id", org.id)
        .select("id, name, join_code, join_policy")
        .maybeSingle();
      if (!error && updated) return updated;
      if (error && !error.message.includes("duplicate")) fail("getMyOrgJoinSettings", error);
    }
    fail("getMyOrgJoinSettings", new Error("Could not generate a unique join code"));
  });

export const regenerateJoinCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const org = await myOwnedOrg(context.userId);
    if (!org) throw new Error("You don't own an organization.");
    const prefix = slugPrefix(org.name);
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = `${prefix}-CHESS-${randomCode(4)}`;
      const { data: updated, error } = await supabaseAdmin
        .from("organizations")
        .update({ join_code: code })
        .eq("id", org.id)
        .select("join_code")
        .maybeSingle();
      if (!error && updated) return updated;
      if (error && !error.message.includes("duplicate")) fail("regenerateJoinCode", error);
    }
    fail("regenerateJoinCode", new Error("Could not generate a unique join code"));
  });

export const setJoinPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ join_policy: z.enum(["auto", "admin_approval", "parent_approval", "disabled"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const org = await myOwnedOrg(context.userId);
    if (!org) throw new Error("You don't own an organization.");
    const { error } = await supabaseAdmin
      .from("organizations")
      .update({ join_policy: data.join_policy })
      .eq("id", org.id);
    if (error) fail("setJoinPolicy", error);
    return { ok: true };
  });

/** Pending (and recent approved/rejected) join requests for the org I own. */
export const listMembershipRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const org = await myOwnedOrg(context.userId);
    if (!org) return [];
    const { data, error } = await supabaseAdmin
      .from("organization_memberships")
      .select("id, user_id, role_in_org, status, joined_at, approved_at")
      .eq("organization_id", org.id)
      .order("joined_at", { ascending: false })
      .limit(200);
    if (error) fail("listMembershipRequests", error);
    const ids = (data ?? []).map((m) => m.user_id);
    let names: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name, email").in("id", ids);
      for (const p of profs ?? []) names[p.id] = p.full_name;
    }
    return (data ?? []).map((m) => ({ ...m, full_name: names[m.user_id] ?? "Unknown" }));
  });

export const decideMembershipRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ membership_id: z.string().uuid(), approve: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const org = await myOwnedOrg(context.userId);
    if (!org) throw new Error("You don't own an organization.");
    const { error } = await supabaseAdmin
      .from("organization_memberships")
      .update({
        status: data.approve ? "approved" : "rejected",
        approved_by: context.userId,
        approved_at: new Date().toISOString(),
      })
      .eq("id", data.membership_id)
      .eq("organization_id", org.id); // can only decide requests for your own org
    if (error) fail("decideMembershipRequest", error);
    return { ok: true };
  });

/** Member-facing: join an organization by its code. */
export const joinOrganizationByCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ code: z.string().trim().min(3).max(40) }).parse(d))
  .handler(async ({ context, data }) => {
    const code = data.code.toUpperCase();
    const { data: org, error: orgErr } = await supabaseAdmin
      .from("organizations")
      .select("id, name, join_policy")
      .eq("join_code", code)
      .maybeSingle();
    if (orgErr) fail("joinOrganizationByCode.lookup", orgErr);
    if (!org) throw new Error("That code doesn't match any organization. Double-check it and try again.");
    if (org.join_policy === "disabled") {
      throw new Error(`${org.name} isn't accepting new members through a join code right now.`);
    }

    const { data: existing } = await supabaseAdmin
      .from("organization_memberships")
      .select("id, status")
      .eq("organization_id", org.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (existing) {
      if (existing.status === "approved") throw new Error(`You're already a member of ${org.name}.`);
      if (existing.status === "pending") throw new Error(`Your request to join ${org.name} is already pending approval.`);
    }

    // auto -> approved immediately. admin_approval / parent_approval -> pending until an org
    // admin (or, in future, a parent) decides. The two approval types share one "pending"
    // state for now; who's expected to act on it is a product/UI distinction, not a DB one.
    const status = org.join_policy === "auto" ? "approved" : "pending";
    const { error: insertErr } = existing
      ? await supabaseAdmin.from("organization_memberships").update({ status }).eq("id", existing.id)
      : await supabaseAdmin.from("organization_memberships").insert({
          organization_id: org.id,
          user_id: context.userId,
          status,
        });
    if (insertErr) fail("joinOrganizationByCode.insert", insertErr);

    return { ok: true, organization_name: org.name, status };
  });

/** My own membership requests, so I can see what's pending/approved/rejected. */
export const listMyMemberships = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await supabaseAdmin
      .from("organization_memberships")
      .select("id, status, role_in_org, joined_at, organizations(name)")
      .eq("user_id", context.userId)
      .order("joined_at", { ascending: false });
    if (error) fail("listMyMemberships", error);
    return (data ?? []).map((m: any) => ({
      id: m.id,
      status: m.status,
      role_in_org: m.role_in_org,
      joined_at: m.joined_at,
      organization_name: m.organizations?.name ?? "Unknown",
    }));
  });
