import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function fail(scope: string, error: unknown): never {
  console.error(`[tournaments.${scope}]`, error);
  throw new Error("Something went wrong. Please try again.");
}

async function loadRoles(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as string);
}

type Pairing = {
  id: string;
  round_id: string;
  board: number;
  white_user_id: string | null;
  black_user_id: string | null;
  result: string | null;
};

function scoreFor(p: Pairing, userId: string): number {
  if (!p.result) return 0;
  if (p.result === "bye" && p.white_user_id === userId) return 1;
  if (p.result === "1/2-1/2" && (p.white_user_id === userId || p.black_user_id === userId)) return 0.5;
  if (p.result === "1-0" && p.white_user_id === userId) return 1;
  if (p.result === "0-1" && p.black_user_id === userId) return 1;
  return 0;
}

export const getTournamentDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tournament_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: t, error } = await supabase
      .from("tournaments")
      .select("id, name, description, format, status, starts_at, ends_at, max_participants, rounds, school_id, created_by")
      .eq("id", data.tournament_id)
      .maybeSingle();
    if (error) fail("getTournamentDetail", error);
    if (!t) throw new Error("Tournament not found");

    const roles = await loadRoles(supabase, userId);
    const isSuper = roles.includes("super_admin");
    let isSchoolOwner = false;
    if (t.school_id) {
      const { data: s } = await supabaseAdmin.from("schools").select("owner_user_id").eq("id", t.school_id).maybeSingle();
      isSchoolOwner = s?.owner_user_id === userId;
    }
    const canManage = isSuper || isSchoolOwner;

    const { data: participants } = await supabase
      .from("tournament_participants")
      .select("id, user_id, seed, score, rank, registered_at")
      .eq("tournament_id", data.tournament_id);

    const userIds = (participants ?? []).map((p: any) => p.user_id);
    let profiles: Record<string, { full_name: string; chess_rating: number | null }> = {};
    if (userIds.length > 0) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, chess_rating")
        .in("id", userIds);
      for (const p of profs ?? []) profiles[p.id] = { full_name: p.full_name, chess_rating: p.chess_rating };
    }

    const { data: rounds } = await supabase
      .from("tournament_rounds")
      .select("id, round_number, status")
      .eq("tournament_id", data.tournament_id)
      .order("round_number", { ascending: true });

    const { data: pairings } = await supabase
      .from("tournament_pairings")
      .select("id, round_id, board, white_user_id, black_user_id, result")
      .eq("tournament_id", data.tournament_id)
      .order("board", { ascending: true });

    const standings = (participants ?? []).map((p: any) => {
      const points = (pairings ?? []).reduce((s: number, pr: any) => s + scoreFor(pr as Pairing, p.user_id), 0);
      return {
        user_id: p.user_id,
        full_name: profiles[p.user_id]?.full_name ?? "Unknown",
        chess_rating: profiles[p.user_id]?.chess_rating ?? null,
        points,
      };
    }).sort((a, b) => b.points - a.points || (b.chess_rating ?? 0) - (a.chess_rating ?? 0));

    const registeredMe = (participants ?? []).some((p: any) => p.user_id === userId);

    return {
      tournament: t,
      can_manage: canManage,
      registered_me: registeredMe,
      participants: (participants ?? []).map((p: any) => ({
        ...p,
        full_name: profiles[p.user_id]?.full_name ?? "Unknown",
        chess_rating: profiles[p.user_id]?.chess_rating ?? null,
      })),
      rounds: rounds ?? [],
      pairings: (pairings ?? []).map((p: any) => ({
        ...p,
        white_name: p.white_user_id ? profiles[p.white_user_id]?.full_name ?? "—" : "—",
        black_name: p.black_user_id ? profiles[p.black_user_id]?.full_name ?? "BYE" : "BYE",
      })),
      standings,
    };
  });

// Simple Swiss / knockout pairing for next round
export const generateNextRound = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tournament_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const roles = await loadRoles(supabase, userId);
    const isSuper = roles.includes("super_admin");

    const { data: t } = await supabase
      .from("tournaments")
      .select("id, format, school_id, status, rounds")
      .eq("id", data.tournament_id)
      .maybeSingle();
    if (!t) throw new Error("Tournament not found");

    if (!isSuper) {
      const { data: s } = await supabaseAdmin.from("schools").select("owner_user_id").eq("id", t.school_id ?? "00000000-0000-0000-0000-000000000000").maybeSingle();
      if (s?.owner_user_id !== userId) throw new Error("Forbidden");
    }

    const { data: existing } = await supabase
      .from("tournament_rounds")
      .select("round_number")
      .eq("tournament_id", data.tournament_id)
      .order("round_number", { ascending: false })
      .limit(1);
    const nextRoundNumber = (existing?.[0]?.round_number ?? 0) + 1;
    if (t.rounds && nextRoundNumber > t.rounds) throw new Error("All rounds played");

    const { data: participants } = await supabaseAdmin
      .from("tournament_participants")
      .select("user_id")
      .eq("tournament_id", data.tournament_id);
    const players = (participants ?? []).map((p: any) => p.user_id);
    if (players.length < 2) throw new Error("Need at least 2 participants");

    const { data: priorPairings } = await supabaseAdmin
      .from("tournament_pairings")
      .select("white_user_id, black_user_id, result")
      .eq("tournament_id", data.tournament_id);

    // compute scores
    const score: Record<string, number> = Object.fromEntries(players.map((p) => [p, 0]));
    const played = new Set<string>(); // "a|b"
    for (const pr of priorPairings ?? []) {
      const w = pr.white_user_id as string | null;
      const b = pr.black_user_id as string | null;
      if (w && b) {
        played.add([w, b].sort().join("|"));
      }
      if (w && pr.result === "bye") score[w] = (score[w] ?? 0) + 1;
      if (pr.result === "1/2-1/2" && w && b) { score[w] += 0.5; score[b] += 0.5; }
      if (pr.result === "1-0" && w) score[w] = (score[w] ?? 0) + 1;
      if (pr.result === "0-1" && b) score[b] = (score[b] ?? 0) + 1;
    }

    // For knockout — only advance players with non-losing prior result; for swiss/round-robin use all
    let pool = [...players];
    if (t.format === "knockout" && (priorPairings?.length ?? 0) > 0) {
      const advancing = new Set<string>();
      for (const pr of priorPairings ?? []) {
        if (pr.result === "1-0" && pr.white_user_id) advancing.add(pr.white_user_id);
        if (pr.result === "0-1" && pr.black_user_id) advancing.add(pr.black_user_id);
        if (pr.result === "bye" && pr.white_user_id) advancing.add(pr.white_user_id);
      }
      pool = players.filter((p) => advancing.has(p));
      if (pool.length < 2) throw new Error("Knockout has a winner — no further rounds");
    }

    // Sort by score desc (Swiss) or keep order (knockout/round_robin)
    if (t.format === "swiss") pool.sort((a, b) => (score[b] ?? 0) - (score[a] ?? 0));

    // Pair top-half vs bottom-half style for swiss; sequential for others. Avoid rematches when possible.
    const pairings: Array<{ white: string | null; black: string | null; result: string | null }> = [];
    const used = new Set<string>();
    for (let i = 0; i < pool.length; i++) {
      const a = pool[i];
      if (used.has(a)) continue;
      let partner: string | null = null;
      for (let j = i + 1; j < pool.length; j++) {
        const b = pool[j];
        if (used.has(b)) continue;
        const key = [a, b].sort().join("|");
        if (!played.has(key)) { partner = b; break; }
      }
      if (!partner) {
        for (let j = i + 1; j < pool.length; j++) {
          const b = pool[j];
          if (!used.has(b)) { partner = b; break; }
        }
      }
      used.add(a);
      if (partner) {
        used.add(partner);
        pairings.push({ white: a, black: partner, result: null });
      } else {
        pairings.push({ white: a, black: null, result: "bye" });
      }
    }

    const { data: round, error: rerr } = await supabaseAdmin
      .from("tournament_rounds")
      .insert({ tournament_id: data.tournament_id, round_number: nextRoundNumber, status: "in_progress" })
      .select()
      .single();
    if (rerr) fail("generateNextRound.round", rerr);

    const rows = pairings.map((p, idx) => ({
      tournament_id: data.tournament_id,
      round_id: round!.id,
      board: idx + 1,
      white_user_id: p.white,
      black_user_id: p.black,
      result: p.result,
    }));
    const { error: perr } = await supabaseAdmin.from("tournament_pairings").insert(rows);
    if (perr) fail("generateNextRound.pairings", perr);

    if (t.status === "registration_open") {
      await supabaseAdmin.from("tournaments").update({ status: "in_progress" }).eq("id", data.tournament_id);
    }

    return { ok: true, round_number: nextRoundNumber };
  });

export const recordResult = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    pairing_id: z.string().uuid(),
    result: z.enum(["1-0", "0-1", "1/2-1/2", "bye"]),
  }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("tournament_pairings")
      .update({ result: data.result })
      .eq("id", data.pairing_id);
    if (error) fail("recordResult", error);
    return { ok: true };
  });

export const completeTournament = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tournament_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("tournaments")
      .update({ status: "completed", ends_at: new Date().toISOString() })
      .eq("id", data.tournament_id);
    if (error) fail("completeTournament", error);
    return { ok: true };
  });