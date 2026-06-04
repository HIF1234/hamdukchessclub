import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function fail(scope: string, error: unknown): never {
  console.error(`[analytics.${scope}]`, error);
  throw new Error("Something went wrong. Please try again.");
}

async function getRoles(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as string);
}

export type AnalyticsBucket = { label: string; value: number };

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const roles = await getRoles(supabase, userId);
    if (!roles.includes("super_admin") && !roles.includes("school_admin")) {
      throw new Error("Forbidden");
    }

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const [profilesRes, classesRes, tournamentsRes, paymentsRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("created_at, account_state, membership_level"),
      supabaseAdmin.from("classes").select("starts_at, status"),
      supabaseAdmin.from("tournaments").select("status"),
      supabaseAdmin.from("payments").select("amount_kobo, status, paid_at").eq("status", "success"),
    ]);
    if (profilesRes.error) fail("profiles", profilesRes.error);
    if (classesRes.error) fail("classes", classesRes.error);
    if (tournamentsRes.error) fail("tournaments", tournamentsRes.error);
    if (paymentsRes.error) fail("payments", paymentsRes.error);

    const profiles = profilesRes.data ?? [];
    const classes = classesRes.data ?? [];
    const tournaments = tournamentsRes.data ?? [];
    const payments = paymentsRes.data ?? [];

    // Member signups per day (last 14 days)
    const signups: AnalyticsBucket[] = [];
    for (let i = 13; i >= 0; i--) {
      const start = now - (i + 1) * day;
      const end = now - i * day;
      const count = profiles.filter((p) => {
        const t = p.created_at ? new Date(p.created_at).getTime() : 0;
        return t >= start && t < end;
      }).length;
      const d = new Date(end - day);
      signups.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, value: count });
    }

    // Revenue per day (last 14 days) in NGN (kobo / 100)
    const revenue: AnalyticsBucket[] = [];
    for (let i = 13; i >= 0; i--) {
      const start = now - (i + 1) * day;
      const end = now - i * day;
      const sum = payments
        .filter((p) => p.paid_at && new Date(p.paid_at).getTime() >= start && new Date(p.paid_at).getTime() < end)
        .reduce((s, p) => s + (p.amount_kobo ?? 0), 0);
      const d = new Date(end - day);
      revenue.push({ label: `${d.getMonth() + 1}/${d.getDate()}`, value: Math.round(sum / 100) });
    }

    const byLevel = {
      beginner: profiles.filter((p) => p.membership_level === "beginner").length,
      intermediate: profiles.filter((p) => p.membership_level === "intermediate").length,
      advanced: profiles.filter((p) => p.membership_level === "advanced").length,
    };

    return {
      totals: {
        members: profiles.length,
        activeMembers: profiles.filter((p) => p.account_state === "active").length,
        classes: classes.length,
        tournaments: tournaments.length,
        revenueNgn: Math.round(payments.reduce((s, p) => s + (p.amount_kobo ?? 0), 0) / 100),
      },
      signups,
      revenue,
      byLevel,
    };
  });

export const getAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const roles = await getRoles(supabase, userId);
    if (!roles.includes("super_admin")) throw new Error("Forbidden");
    const { data, error } = await supabaseAdmin
      .from("audit_log")
      .select("id, user_id, action, target_type, target_id, metadata, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) fail("audit", error);
    return data ?? [];
  });