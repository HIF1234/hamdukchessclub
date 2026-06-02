import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type RoleStats = {
  members?: { total: number; active: number; pendingPayment: number; expired: number };
  schools?: { total: number; activeSubs: number };
  payments?: { totalKobo: number; last30Kobo: number; successCount: number };
  mySchool?: { id: string; name: string; studentCount: number | null } | null;
  mySchoolMembers?: number;
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
      const [profilesRes, schoolsRes, paymentsRes] = await Promise.all([
        supabaseAdmin.from("profiles").select("account_state", { count: "exact" }),
        supabaseAdmin.from("schools").select("subscription_status", { count: "exact" }),
        supabaseAdmin.from("payments").select("amount_kobo, status, paid_at").eq("status", "success"),
      ]);
      const profiles = profilesRes.data ?? [];
      const schools = schoolsRes.data ?? [];
      const payments = paymentsRes.data ?? [];
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      out.members = {
        total: profiles.length,
        active: profiles.filter((p) => p.account_state === "active").length,
        pendingPayment: profiles.filter((p) => p.account_state === "pending_payment").length,
        expired: profiles.filter((p) => p.account_state === "expired").length,
      };
      out.schools = {
        total: schools.length,
        activeSubs: schools.filter((s) => s.subscription_status === "active").length,
      };
      out.payments = {
        totalKobo: payments.reduce((s, p) => s + (p.amount_kobo ?? 0), 0),
        last30Kobo: payments
          .filter((p) => p.paid_at && new Date(p.paid_at).getTime() >= cutoff)
          .reduce((s, p) => s + (p.amount_kobo ?? 0), 0),
        successCount: payments.length,
      };
    }

    if (roles.includes("school_admin")) {
      const { data: school } = await supabase
        .from("schools")
        .select("id, name, student_count")
        .eq("owner_user_id", userId)
        .maybeSingle();
      out.mySchool = school ?? null;
      if (school) {
        const { count } = await supabase
          .from("school_memberships")
          .select("id", { count: "exact", head: true })
          .eq("school_id", school.id);
        out.mySchoolMembers = count ?? 0;
      }
    }

    return out;
  });