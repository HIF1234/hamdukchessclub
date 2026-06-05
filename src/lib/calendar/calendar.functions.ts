import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type CalendarEvent = {
  id: string;
  kind: "class" | "tournament";
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  url: string;
  location: string | null;
};

// Returns the events the caller should see on their personal calendar:
// classes they're enrolled in (or tutor for, or own the school of) and
// tournaments they're registered for (or own the school of). Admins see all.
export const getMyCalendar = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    const { data: rolesData } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userId);
    const roles = (rolesData ?? []).map((r) => r.role as string);
    const isSuper = roles.includes("super_admin");

    // Collect class IDs the user is enrolled in
    const { data: enroll } = await supabaseAdmin
      .from("class_enrollments").select("class_id").eq("user_id", userId);
    const enrolledClassIds = (enroll ?? []).map((e) => e.class_id as string);

    // Schools the user owns
    const { data: ownedSchools } = await supabaseAdmin
      .from("schools").select("id").eq("owner_user_id", userId);
    const ownedSchoolIds = (ownedSchools ?? []).map((s) => s.id as string);

    // Classes: super admin all; otherwise tutor's or owner's or enrolled
    let classesQuery = supabaseAdmin
      .from("classes")
      .select("id, title, description, starts_at, ends_at, meeting_url, status, school_id, tutor_id")
      .neq("status", "cancelled")
      .order("starts_at", { ascending: true });
    if (!isSuper) {
      const orParts: string[] = [`tutor_id.eq.${userId}`];
      if (enrolledClassIds.length) orParts.push(`id.in.(${enrolledClassIds.join(",")})`);
      if (ownedSchoolIds.length) orParts.push(`school_id.in.(${ownedSchoolIds.join(",")})`);
      classesQuery = classesQuery.or(orParts.join(","));
    }
    const { data: classes } = await classesQuery;

    // Tournaments the user is registered for
    const { data: regs } = await supabaseAdmin
      .from("tournament_participants").select("tournament_id").eq("user_id", userId);
    const regIds = (regs ?? []).map((r) => r.tournament_id as string);

    let tournamentsQuery = supabaseAdmin
      .from("tournaments")
      .select("id, name, description, starts_at, ends_at, status, school_id")
      .neq("status", "cancelled")
      .order("starts_at", { ascending: true });
    if (!isSuper) {
      const orParts: string[] = [];
      if (regIds.length) orParts.push(`id.in.(${regIds.join(",")})`);
      if (ownedSchoolIds.length) orParts.push(`school_id.in.(${ownedSchoolIds.join(",")})`);
      if (orParts.length === 0) {
        // Nothing the user can see — short-circuit
        return {
          events: ((classes ?? []) as Array<{ id: string; title: string; description: string | null; starts_at: string; ends_at: string | null; meeting_url: string | null }>).map((c): CalendarEvent => ({
            id: c.id,
            kind: "class",
            title: c.title,
            description: c.description,
            starts_at: c.starts_at,
            ends_at: c.ends_at,
            url: `/classes/${c.id}`,
            location: c.meeting_url ?? null,
          })),
        };
      }
      tournamentsQuery = tournamentsQuery.or(orParts.join(","));
    }
    const { data: tournaments } = await tournamentsQuery;

    const events: CalendarEvent[] = [
      ...((classes ?? []) as Array<{ id: string; title: string; description: string | null; starts_at: string; ends_at: string | null; meeting_url: string | null }>).map((c): CalendarEvent => ({
        id: c.id,
        kind: "class",
        title: c.title,
        description: c.description,
        starts_at: c.starts_at,
        ends_at: c.ends_at,
        url: `/classes/${c.id}`,
        location: c.meeting_url ?? null,
      })),
      ...((tournaments ?? []) as Array<{ id: string; name: string; description: string | null; starts_at: string; ends_at: string | null }>).map((t): CalendarEvent => ({
        id: t.id,
        kind: "tournament",
        title: t.name,
        description: t.description,
        starts_at: t.starts_at,
        ends_at: t.ends_at,
        url: `/tournaments/${t.id}`,
        location: null,
      })),
    ].sort((a, b) => a.starts_at.localeCompare(b.starts_at));

    return { events };
  });
