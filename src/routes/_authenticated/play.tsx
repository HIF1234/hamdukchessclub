import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Puzzle, Swords, Trophy, Gamepad2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { listChessEmbeds } from "@/lib/hamduk/hamduk.functions";

export const Route = createFileRoute("/_authenticated/play")({
  head: () => ({ meta: [{ title: "Play & Puzzles — Hamduk Chess Club" }] }),
  component: PlayPage,
});

const KIND_META = {
  board: { icon: Swords, label: "Board" },
  puzzle: { icon: Puzzle, label: "Puzzle" },
  leaderboard: { icon: Trophy, label: "Leaderboard" },
  game: { icon: Gamepad2, label: "Live game" },
} as const;

type Embed = {
  id: string;
  kind: keyof typeof KIND_META;
  label: string;
  embed_url: string;
  expires_at: string | null;
};

function PlayPage() {
  const { roles } = useAuth();
  const isAdmin = roles.includes("super_admin");
  const load = useServerFn(listChessEmbeds);
  const { data: embeds, isLoading } = useQuery({
    queryKey: ["hamduk", "embeds"],
    queryFn: () => load() as Promise<Embed[]>,
  });

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Play & Puzzles</p>
        <h1 className="mt-2 font-display text-4xl">Sharpen your game</h1>
        <p className="mt-2 text-muted-foreground">
          Hamduk Chess, right here — boards, puzzles and the club leaderboard, powered by play.chess.hamduk.com.ng.
        </p>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-muted-foreground">Loading…</Card>
      ) : embeds && embeds.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {embeds.map((e) => {
            const meta = KIND_META[e.kind] ?? KIND_META.board;
            const Icon = meta.icon;
            return (
              <Card key={e.id} className="overflow-hidden">
                <div className="flex items-center gap-2 p-4 pb-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-display text-lg">{e.label}</span>
                  <Badge variant="outline" className="ml-auto">{meta.label}</Badge>
                </div>
                <iframe
                  src={e.embed_url}
                  title={e.label}
                  loading="lazy"
                  style={{ width: "100%", aspectRatio: "1 / 1", border: 0 }}
                />
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Badge variant="outline" className="mb-3">Nothing set up yet</Badge>
          <h2 className="font-display text-2xl">No play widgets configured</h2>
          {isAdmin ? (
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Create a board, puzzle, leaderboard or live-game widget on{" "}
              <Link to="/integrations" className="text-primary underline">
                Integrations
              </Link>{" "}
              to show it to every member here.
            </p>
          ) : (
            <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
              Ask a club admin to set up play widgets under Integrations.
            </p>
          )}
        </Card>
      )}
    </DashboardShell>
  );
}
