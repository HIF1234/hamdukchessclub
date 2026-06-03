import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Puzzle, Swords, Bot } from "lucide-react";

export const Route = createFileRoute("/_authenticated/play")({
  head: () => ({ meta: [{ title: "Play & Puzzles — Hamduk Chess Club" }] }),
  component: PlayPage,
});

function PlayPage() {
  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Play & Puzzles</p>
        <h1 className="mt-2 font-display text-4xl">Sharpen your game</h1>
        <p className="mt-2 text-muted-foreground">Casual play, daily puzzles and bot training. Hook in your preferred chess board provider here.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <PlayCard
          icon={<Swords className="h-6 w-6 text-primary" />}
          title="Casual play"
          body="Quick games with other members. Board API plug-in point — connect a Lichess study, chess.com embed or your own widget."
          actionLabel="Open board"
        />
        <PlayCard
          icon={<Puzzle className="h-6 w-6 text-primary" />}
          title="Daily puzzles"
          body="Tactics, endgames and motifs. Wire a puzzle API (Lichess /api/puzzle/daily, ChessTempo) to swap the placeholder."
          actionLabel="Get today's puzzle"
        />
        <PlayCard
          icon={<Bot className="h-6 w-6 text-primary" />}
          title="Bot training"
          body="Practise against engine levels. Stockfish.js or a hosted analysis API can be mounted here."
          actionLabel="Play a bot"
        />
      </div>

      <Card className="mt-8 p-8 text-center">
        <Badge variant="outline" className="mb-3">Plug-in point</Badge>
        <h2 className="font-display text-2xl">Board provider not configured</h2>
        <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
          This area renders the chess board widget once a provider is connected. Drop your board component or iframe URL into <code className="text-primary">src/routes/_authenticated/play.tsx</code>.
        </p>
      </Card>
    </DashboardShell>
  );
}

function PlayCard({ icon, title, body, actionLabel }: { icon: React.ReactNode; title: string; body: string; actionLabel: string }) {
  return (
    <Card className="p-5 flex flex-col">
      <div>{icon}</div>
      <h3 className="mt-3 font-display text-xl">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground flex-1">{body}</p>
      <Button variant="secondary" size="sm" className="mt-4 self-start" disabled>
        <ExternalLink className="h-4 w-4 mr-1" />{actionLabel}
      </Button>
    </Card>
  );
}