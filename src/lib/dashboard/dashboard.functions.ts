import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RoleStats = {
  members?: { total: number; active: number; pendingPayment: number; expired: number };
  organizations?: { total: number; activeSubs: number };
  payments?: { totalKobo: number; last30Kobo: number; successCount: number };
  myOrg?: { id: string; name: string; studentCount: number | null } | null;
  myOrgMembers?: number;
  myOrgClasses?: number;
  tutor?: { classesThisWeek: number; students: number };
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
    }

    if (roles.includes("org_admin")) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id, name, student_count")
        .eq("owner_user_id", userId)
        .maybeSingle();
      out.myOrg = org
        ? { id: org.id, name: org.name, studentCount: org.student_count }
        : null;
      if (org) {
        const { count } = await supabase
          .from("organization_memberships")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", org.id);
        out.myOrgMembers = count ?? 0;
        const { count: classCount } = await supabase.from("classes").select("id", { count: "exact", head: true }).eq("organization_id", org.id).in("status", ["scheduled", "in_progress"]);
        out.myOrgClasses = classCount ?? 0;
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
      out.tutor = { classesThisWeek: classes?.length ?? 0, students };
    }

    return out;
  });