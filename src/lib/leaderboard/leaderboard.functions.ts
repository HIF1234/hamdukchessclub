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
      // club.profiles.chess_rating is dead -- nothing has written to it since the account-link
      // sync bridge to play.chess was removed, so it no longer reflects anyone's real rating.
      // The actual rating lives in play's public.ratings (one row per time control/variant);
      // this ranks by each member's best rating across all of them, same as the "My chess"
      // page and the member dashboard already do via getMyChessProfile.
      const { data: profiles, error: pErr } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, membership_level, location")
        .eq("account_state", "active")
        .limit(500);
      if (pErr) fail("get.profiles", pErr);
      const ids = (profiles ?? []).map((p) => p.id);
      if (ids.length === 0) return [];

      const pub = (supabaseAdmin as any).schema("public");
      const { data: ratings, error: rErr } = await pub
        .from("ratings")
        .select("user_id, rating")
        .in("user_id", ids);
      if (rErr) fail("get.ratings", rErr);

      const bestByUser: Record<string, number> = {};
      for (const r of (ratings ?? []) as { user_id: string; rating: number }[]) {
        if (bestByUser[r.user_id] === undefined || r.rating > bestByUser[r.user_id]) {
          bestByUser[r.user_id] = r.rating;
        }
      }

      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      return Object.entries(bestByUser)
        .map(([id, chess_rating]) => {
          const p = byId.get(id)!;
          return { id, full_name: p.full_name, membership_level: p.membership_level, location: p.location, chess_rating };
        })
        .sort((a, b) => b.chess_rating - a.chess_rating)
        .slice(0, 100);
    });
  });