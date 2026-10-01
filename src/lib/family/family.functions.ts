import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function fail(scope: string, error: unknown): never {
  console.error(`[family.${scope}]`, error);
  throw new Error("Something went wrong. Please try again.");
}

/** Throws unless the caller is a guardian of this child -- every function below that reads a
 *  child's data calls this first. Vision §11: the parent/guardian dashboard only ever shows
 *  data for a child the org admin has explicitly linked the caller to. */
async function assertGuardianOf(guardianId: string, childId: string) {
  const { data } = await supabaseAdmin
    .from("guardian_links")
    .select("id")
    .eq("guardian_user_id", guardianId)
    .eq("child_user_id", childId)
    .maybeSingle();
  if (!data) throw new Error("You're not a guardian of this child.");
}

export const listMyChildren = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: links, error } = await supabaseAdmin
      .from("guardian_links")
      .select("child_user_id, organization_id")
      .eq("guardian_user_id", context.userId);
    if (error) fail("listMyChildren.links", error);
    if (!links || links.length === 0) return [];

    const childIds = links.map((l) => l.child_user_id);
    const orgIds = Array.from(new Set(links.map((l) => l.organization_id)));
    const [{ data: profiles }, { data: orgs }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, avatar_url, chess_rating, membership_level, account_state").in("id", childIds),
      supabaseAdmin.from("organizations").select("id, name").in("id", orgIds),
    ]);
    const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
    const orgNameById: Record<string, string> = {};
    for (const o of orgs ?? []) orgNameById[o.id] = o.name;

    return links.map((l) => {
      const p = profileById.get(l.child_user_id);
      return {
        child_user_id: l.child_user_id,
        full_name: p?.full_name ?? "Unknown",
        avatar_url: p?.avatar_url ?? null,
        chess_rating: p?.chess_rating ?? null,
        membership_level: p?.membership_level ?? null,
        account_state: p?.account_state ?? null,
        organization_name: orgNameById[l.organization_id] ?? "Unknown",
      };
    });
  });

export const getChildOverview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ child_user_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertGuardianOf(context.userId, data.child_user_id);
    const childId = data.child_user_id;

    const [{ data: profile }, { data: enrollments }, { data: participants }] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name, avatar_url, chess_rating, membership_level, account_state").eq("id", childId).maybeSingle(),
      supabaseAdmin.from("class_enrollments").select("class_id, attended, enrolled_at").eq("user_id", childId),
      supabaseAdmin.from("tournament_participants").select("tournament_id, registered_at").eq("user_id", childId),
    ]);
    if (!profile) throw new Error("Child profile not found");

    const classIds = (enrollments ?? []).map((e) => e.class_id);
    const tournamentIds = (participants ?? []).map((p) => p.tournament_id);
    const [{ data: classes }, { data: tournaments }] = await Promise.all([
      classIds.length
        ? supabaseAdmin.from("classes").select("id, title, starts_at, status").in("id", classIds)
        : Promise.resolve({ data: [] as { id: string; title: string; starts_at: string; status: string }[] }),
      tournamentIds.length
        ? supabaseAdmin.from("tournaments").select("id, name, starts_at, status").in("id", tournamentIds)
        : Promise.resolve({ data: [] as { id: string; name: string; starts_at: string; status: string }[] }),
    ]);
    const classById: Record<string, { id: string; title: string; starts_at: string; status: string }> = {};
    for (const c of classes ?? []) classById[c.id] = c;

    const now = Date.now();
    const upcomingClasses = (classes ?? [])
      .filter((c) => ["scheduled", "in_progress"].includes(c.status) && new Date(c.starts_at).getTime() >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
    const upcomingTournaments = (tournaments ?? [])
      .filter((t) => ["registration_open", "in_progress"].includes(t.status) && new Date(t.starts_at).getTime() >= now)
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

    const pastAttendance = (enrollments ?? [])
      .map((e) => ({ class_title: classById[e.class_id]?.title ?? "Unknown class", attended: e.attended, enrolled_at: e.enrolled_at }))
      .sort((a, b) => new Date(b.enrolled_at).getTime() - new Date(a.enrolled_at).getTime())
      .slice(0, 10);

    return {
      profile,
      upcoming_classes: upcomingClasses,
      upcoming_tournaments: upcomingTournaments,
      recent_attendance: pastAttendance,
      classes_total: (enrollments ?? []).length,
      classes_attended: (enrollments ?? []).filter((e) => e.attended).length,
    };
  });
