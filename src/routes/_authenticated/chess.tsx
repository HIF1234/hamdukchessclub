import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyChessProfile, listChessEmbeds } from "@/lib/hamduk/hamduk.functions";

export const Route = createFileRoute("/_authenticated/chess")({
  head: () => ({
    meta: [
      { title: "My Chess — Hamduk Chess Club" },
      { name: "description", content: "Your Hamduk Chess rating, recent games and club training boards." },
      { property: "og:title", content: "My Chess — Hamduk Chess Club" },
      { property: "og:description", content: "Your Hamduk Chess rating, recent games and club training boards." },
    ],
  }),
  component: ChessPage,
});

function ChessPage() {
  const load = useServerFn(getMyChessProfile);
  const loadEmbeds = useServerFn(listChessEmbeds);

  const { data, isLoading } = useQuery({ queryKey: ["hamduk", "me"], queryFn: () => load() });
  const { data: embeds } = useQuery({ queryKey: ["hamduk", "embeds"], queryFn: () => loadEmbeds() });

  const ratings = data?.ratings ?? [];
  const games = data?.games ?? [];
  const headline = ratings[0];

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Hamduk Chess</p>
        <h1 className="mt-2 font-display text-4xl">My chess</h1>
        <p className="mt-2 text-muted-foreground">
          Ratings, games and training boards -- the same account you play with on play.chess.hamduk.com.ng.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Best category</p>
                <p className="mt-1 font-display text-2xl">
                  {headline ? `${headline.time_control} · ${headline.variant}` : "No rated games yet"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Rating</p>
                <p className="font-display text-4xl">{headline?.rating ?? "—"}</p>
              </div>
            </div>
          </Card>

          <Tabs defaultValue="ratings">
            <TabsList>
              <TabsTrigger value="ratings">Ratings</TabsTrigger>
              <TabsTrigger value="games">Recent games</TabsTrigger>
              <TabsTrigger value="boards">Boards &amp; puzzles</TabsTrigger>
            </TabsList>

            <TabsContent value="ratings" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ratings.length ? (
                  ratings.map((b: any, i: number) => (
                    <Card key={i} className="p-5">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">
                        {b.time_control} · {b.variant}
                      </p>
                      <p className="mt-1 font-display text-3xl">{b.rating}</p>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {b.games_played} games · {b.wins}W / {b.losses}L / {b.draws}D
                      </p>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground">No rating breakdown yet.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="games" className="mt-4">
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">White</th>
                      <th className="px-4 py-3 text-left">Black</th>
                      <th className="px-4 py-3 text-left">Time</th>
                      <th className="px-4 py-3 text-left">Result</th>
                      <th className="px-4 py-3 text-right">Moves</th>
                    </tr>
                  </thead>
                  <tbody>
                    {games.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                          No rated games yet.
                        </td>
                      </tr>
                    )}
                    {games.map((g: any) => (
                      <tr key={g.game_id} className="border-t border-border/40">
                        <td className="px-4 py-3 text-muted-foreground">
                          {g.played_at ? new Date(g.played_at).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-4 py-3">{g.white}</td>
                        <td className="px-4 py-3">{g.black}</td>
                        <td className="px-4 py-3 text-muted-foreground">{g.time_control}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{g.result ?? "—"}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{g.moves ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </TabsContent>

            <TabsContent value="boards" className="mt-4">
              {embeds && embeds.length > 0 ? (
                <div className="space-y-6">
                  {embeds.map((e: any) => (
                    <Card key={e.id} className="overflow-hidden">
                      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
                        <p className="font-medium">{e.label}</p>
                        <Badge variant="secondary" className="capitalize">
                          {e.kind}
                        </Badge>
                      </div>
                      <iframe
                        src={e.embed_url}
                        title={e.label}
                        className="h-[560px] w-full border-0"
                        allow="clipboard-write"
                      />
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6">
                  <p className="text-muted-foreground">
                    No boards or puzzles have been published yet. A club admin can add them from the
                    Integrations page.
                  </p>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DashboardShell>
  );
}
