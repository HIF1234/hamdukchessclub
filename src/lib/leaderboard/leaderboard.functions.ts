import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { cached } from "@/lib/cache/redis.server";

function fail(scope: string, error: unknown): never {
  console.error(`[leaderboard.${scope}]`, error);
  throw new Error("Something went wrong. Please try again.");
}

export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    return cached("leaderboard:top100", 120, async () => {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, chess_rating, membership_level, location")
        .eq("account_state", "active")
        .order("chess_rating", { ascending: false })
        .limit(100);
      if (error) fail("get", error);
      return data ?? [];
    });
  });