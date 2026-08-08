import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchGames, fetchRating, lastRateInfo } from "./hamduk.server";

export function fail(scope: string, error: unknown): never {
  console.error(`[hamduk.${scope}]`, error);
  if (error instanceof Error && error.message === "NOT_LINKED") {
    throw new Error(
      "This Hamduk Chess account isn't linked to the club yet. An admin needs to link it on the Hamduk side before ratings and games can sync.",
    );
  }
  if (error instanceof Error && error.message.startsWith("Hamduk Chess")) throw error;
  throw new Error("Something went wrong. Please try again.");
}

export async function isSuperAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).some((r: any) => r.role === "super_admin");
}

export async function getLink(userId: string) {
  const { data } = await supabaseAdmin
    .from("hamduk_accounts")
    .select("id, hamduk_username, link_status, last_synced_at, admin_note")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

// Pull rating + recent games from Hamduk and cache them locally.
// Polling model — game.completed / rating.changed webhooks don't fire yet.
export async function syncMember(userId: string, username: string) {
  const rating = await fetchRating(username);

  await supabaseAdmin.from("hamduk_ratings").upsert(
    {
      user_id: userId,
      hamduk_username: rating.username,
      classical_rating: rating.classical_rating ?? null,
      country: rating.country ?? null,
      breakdown: rating.ratings ?? [],
      synced_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  // Mirror the Hamduk rating onto the club profile so the club leaderboard stays in sync.
  if (typeof rating.classical_rating === "number") {
    await supabaseAdmin
      .from("profiles")
      .update({ chess_rating: rating.classical_rating })
      .eq("id", userId);
  }

  let gameCount = 0;
  try {
    const { games } = await fetchGames(username, 50);
    gameCount = games.length;
    if (games.length > 0) {
      await supabaseAdmin.from("hamduk_games").upsert(
        games.map((g) => ({
          user_id: userId,
          game_id: g.game_id,
          white: g.white,
          black: g.black,
          time_control: g.time_control,
          variant: g.variant,
          status: g.status,
          result: g.result,
          end_reason: g.end_reason,
          rated: g.rated,
          moves: g.moves,
          pgn: g.pgn,
          white_rating_delta: g.white_rating_delta,
          black_rating_delta: g.black_rating_delta,
          played_at: g.ended_at ?? g.created_at,
        })),
        { onConflict: "user_id,game_id" },
      );
    }
  } catch (e) {
    console.warn("[hamduk.sync.games]", e);
  }

  await supabaseAdmin
    .from("hamduk_accounts")
    .update({ link_status: "linked", last_synced_at: new Date().toISOString() })
    .eq("user_id", userId);

  return { rating: rating.classical_rating ?? null, games: gameCount, rate: lastRateInfo() };
}