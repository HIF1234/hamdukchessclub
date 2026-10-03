import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RoleStats = {
  members?: { total: number; active: number; pendingPayment: number; expired: number };
  organizations?: { total: number; activeSubs: number };
  payments?: { totalKobo: number; last30Kobo: number; successCount: number };
  recentSignups?: { id: string; full_name: string; created_at: string }[];
  myOrg?: { id: string; name: string; studentCount: number | null; joinCode: string | null } | null;
  myOrgMembers?: number;
  myOrgClasses?: number;
  pendingRequests?: { id: string; full_name: string; joined_at: string }[];
  tutor?: {
    classesThisWeek: number;
    students: number;
    needsAttendance: { id: string; title: string; starts_at: string }[];
    myStudents: { id: string; full_name: string; last_session_at: string }[];
  };
};

export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<RoleStats> => {
    const { supabase, userId } = context;

    // What roles does the caller hold?
    const { data: rolesRows } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const roles = (rolesRows ?? []).map((r) => r.role as string);
    const out: RoleStats = {};

    if (roles.includes("super_admin")) {
      const [profilesRes, orgsRes, paymentsRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("account_state", { count: "exact" }),
        supabaseAdmin.from("organizations").select("subscription_status", { count: "exact" }),
        supabaseAdmin.from("payments").select("amount_kobo, status, paid_at").eq("status", "success"),
      ]);
      const profiles = profilesRes.data ?? [];
      const orgs = orgsRes.data ?? [];
      const payments = paymentsRes.data ?? [];
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      out.members = {
        total: profiles.length,
        active: profiles.filter((p) => p.account_state === "active").length,
        pendingPayment: profiles.filter((p) => p.account_state === "pending_payment").length,
        expired: profiles.filter((p) => p.account_state === "expired").length,
      };
      out.organizations = {
        total: orgs.length,
        activeSubs: orgs.filter((s) => s.subscription_status === "active").length,
      };
      out.payments = {
        totalKobo: payments.reduce((s, p) => s + (p.amount_kobo ?? 0), 0),
        last30Kobo: payments
          .filter((p) => p.paid_at && new Date(p.paid_at).getTime() >= cutoff)
          .reduce((s, p) => s + (p.amount_kobo ?? 0), 0),
        successCount: payments.length,
      };
      const { data: recentSignups } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
      out.recentSignups = recentSignups ?? [];
    }

    if (roles.includes("org_admin")) {
      // join_code is deliberately excluded from the authenticated column grant on
      // organizations (admin-only field), so it has to come through the service-role client.
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("id, name, student_count, join_code")
        .eq("owner_user_id", userId)
        .maybeSingle();
      out.myOrg = org
        ? { id: org.id, name: org.name, studentCount: org.student_count, joinCode: org.join_code }
        : null;
      if (org) {
        const { count } = await supabase
          .from("organization_memberships")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", org.id);
        out.myOrgMembers = count ?? 0;
        const { count: classCount } = await supabase.from("classes").select("id", { count: "exact", head: true }).eq("organization_id", org.id).in("status", ["scheduled", "in_progress"]);
        out.myOrgClasses = classCount ?? 0;
        const { data: pending } = await supabaseAdmin
          .from("organization_memberships")
          .select("id, user_id, joined_at")
          .eq("organization_id", org.id)
          .eq("status", "pending")
          .order("joined_at", { ascending: false })
          .limit(5);
        const ids = (pending ?? []).map((p) => p.user_id);
        let names: Record<string, string> = {};
        if (ids.length) {
          const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", ids);
          for (const p of profs ?? []) names[p.id] = p.full_name;
        }
        out.pendingRequests = (pending ?? []).map((p) => ({ id: p.id, full_name: names[p.user_id] ?? "Unknown", joined_at: p.joined_at }));
      }
    }

    if (roles.includes("tutor")) {
      const { data: classes } = await supabase.from("classes").select("id").eq("tutor_id", userId).in("status", ["scheduled", "in_progress"]);
      const classIds = (classes ?? []).map((c) => c.id);
      let students = 0;
      if (classIds.length) {
        const { data: enrollments } = await supabase.from("class_enrollments").select("user_id").in("class_id", classIds);
        students = new Set((enrollments ?? []).map((e) => e.user_id)).size;
      }

      // Past classes the tutor hasn't marked attendance for yet.
      const { data: needsAttendance } = await supabase
        .from("classes")
        .select("id, title, starts_at")
        .eq("tutor_id", userId)
        .lt("starts_at", new Date().toISOString())
        .is("attendance_taken_at", null)
        .order("starts_at", { ascending: false })
        .limit(10);

      // Every student across all of this tutor's classes (not just upcoming), with the date
      // of their most recent session, so a tutor can see who they haven't taught in a while.
      const { data: allMyClasses } = await supabase.from("classes").select("id, starts_at").eq("tutor_id", userId);
      const startsById: Record<string, string> = {};
      for (const c of allMyClasses ?? []) startsById[c.id] = c.starts_at;
      const allClassIds = Object.keys(startsById);
      let myStudents: { id: string; full_name: string; last_session_at: string }[] = [];
      if (allClassIds.length) {
        const { data: allEnrollments } = await supabase.from("class_enrollments").select("user_id, class_id").in("class_id", allClassIds);
        const lastByUser: Record<string, string> = {};
        for (const e of allEnrollments ?? []) {
          const d = startsById[e.class_id];
          if (!lastByUser[e.user_id] || new Date(d) > new Date(lastByUser[e.user_id])) lastByUser[e.user_id] = d;
        }
        const studentIds = Object.keys(lastByUser);
        if (studentIds.length) {
          const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", studentIds);
          myStudents = (profs ?? [])
            .map((p) => ({ id: p.id, full_name: p.full_name, last_session_at: lastByUser[p.id] }))
            .sort((a, b) => new Date(b.last_session_at).getTime() - new Date(a.last_session_at).getTime())
            .slice(0, 10);
        }
      }

      out.tutor = { classesThisWeek: classes?.length ?? 0, students, needsAttendance: needsAttendance ?? [], myStudents };
    }

    return out;
  });