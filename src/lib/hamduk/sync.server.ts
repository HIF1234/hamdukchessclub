// Club accounts and Hamduk Chess (play.chess.hamduk.com.ng) accounts are the same auth.users
// row now -- there's no more "link your account" sync to do. Ratings and games are read
// directly from the shared project's public.ratings/public.games (see hamduk.functions.ts'
// getMyChessProfile). What's left here are the generic helpers still used by the embeds
// feature and the tournament/class-session API bridge.

export function fail(scope: string, error: unknown): never {
  console.error(`[hamduk.${scope}]`, error);
  if (error instanceof Error && error.message.startsWith("Hamduk Chess")) throw error;
  throw new Error("Something went wrong. Please try again.");
}

export async function isSuperAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).some((r: any) => r.role === "super_admin");
}