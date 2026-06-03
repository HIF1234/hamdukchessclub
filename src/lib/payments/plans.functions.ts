import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPlans = createServerFn({ method: "GET" }).handler(async () => {
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