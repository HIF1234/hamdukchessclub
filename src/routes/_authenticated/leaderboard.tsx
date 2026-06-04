import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getLeaderboard } from "@/lib/leaderboard/leaderboard.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Hamduk Chess Club" }] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const fetch = useServerFn(getLeaderboard);
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetch(),
  });

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Leaderboard</p>
        <h1 className="mt-2 font-display text-4xl">Top players</h1>
        <p className="mt-2 text-muted-foreground">Ranked by club chess rating.</p>
      </div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 w-16">#</th>
              <th className="text-left px-4 py-3">Player</th>
              <th className="text-left px-4 py-3">Level</th>
              <th className="text-left px-4 py-3">Location</th>
              <th className="text-right px-4 py-3">Rating</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((p, idx) => (
              <tr key={p.id} className="border-t border-border/40">
                <td className="px-4 py-3 text-muted-foreground">
                  {idx < 3 ? (
                    <Trophy
                      className={`h-4 w-4 ${
                        idx === 0
                          ? "text-yellow-400"
                          : idx === 1
                            ? "text-zinc-300"
                            : "text-amber-600"
                      }`}
                    />
                  ) : (
                    idx + 1
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{p.full_name}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="capitalize">
                    {p.membership_level}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{p.location ?? "—"}</td>
                <td className="px-4 py-3 text-right font-display text-lg">
                  {p.chess_rating}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </DashboardShell>
  );
}