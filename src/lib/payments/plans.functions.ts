import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cached, invalidate } from "@/lib/cache/redis.server";

export const getPlans = createServerFn({ method: "GET" }).handler(async () => {
  return cached("plans:active", 300, async () => {
    const { data, error } = await supabaseAdmin
      .from("plans")
      .select("id, slug, name, description, audience, tier, price_kobo, currency, interval, features, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) {
      console.error("[plans.get]", error);
      throw new Error("Could not load plans. Please try again.");
    }
    return data ?? [];
  });
});

// Lets a member skip paid plans and continue on a free tier. We mark the
// account as active so the locked-state wrapper releases the dashboard.
// Payment can still be initiated later from the billing page.
export const optInFreeTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ account_state: "active" })
      .eq("id", userId);
    if (error) {
      console.error("[plans.optInFreeTier]", error);
      throw new Error("Could not switch to the free tier. Please try again.");
    }
    await invalidate("plans:active");
    return { ok: true };
  });