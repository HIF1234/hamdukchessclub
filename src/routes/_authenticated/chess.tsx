import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Link2, Unlink } from "lucide-react";
import {
  getMyChessProfile,
  linkChessAccount,
  syncMyChessData,
  unlinkChessAccount,
  listChessEmbeds,
} from "@/lib/hamduk/hamduk.functions";

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
  const qc = useQueryClient();
  const load = useServerFn(getMyChessProfile);
  const loadEmbeds = useServerFn(listChessEmbeds);
  const link = useServerFn(linkChessAccount);
  const unlink = useServerFn(unlinkChessAccount);
  const sync = useServerFn(syncMyChessData);

  const [username, setUsername] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["hamduk", "me"], queryFn: () => load() });
  const { data: embeds } = useQuery({ queryKey: ["hamduk", "embeds"], queryFn: () => loadEmbeds() });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["hamduk", "me"] });

  const linkMut = useMutation({
    mutationFn: () => link({ data: { username: username.trim() } }),
    onSuccess: () => {
      toast.success("Hamduk Chess account linked and synced.");
      setUsername("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const syncMut = useMutation({
    mutationFn: () => sync(),
    onSuccess: () => {
      toast.success("Chess data refreshed.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unlinkMut = useMutation({
    mutationFn: () => unlink(),
    onSuccess: () => {
      toast.success("Account unlinked.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rating = data?.rating;

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Hamduk Chess</p>
        <h1 className="mt-2 font-display text-4xl">My chess</h1>
        <p className="mt-2 text-muted-foreground">
          Ratings, games and training boards served by the Hamduk Chess platform.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && !data?.link && (
        <Card className="max-w-xl p-6">
          <h2 className="font-display text-2xl">Link your Hamduk Chess account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the username you play with on Hamduk Chess. We'll pull in your rating and recent games.
          </p>
          <div className="mt-4 space-y-2">
            <Label htmlFor="hamduk-username">Hamduk Chess username</Label>
            <Input
              id="hamduk-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. adaobi_k"
            />
          </div>
          <Button
            className="mt-4"
            disabled={username.trim().length < 2 || linkMut.isPending}
            onClick={() => linkMut.mutate()}
          >
            <Link2 className="mr-2 h-4 w-4" />
            {linkMut.isPending ? "Linking…" : "Link account"}
          </Button>
        </Card>
      )}

      {data?.link && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Linked account</p>
                <p className="mt-1 font-display text-2xl">{data.link.hamduk_username}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {data.link.link_status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {data.link.last_synced_at
                      ? `Synced ${new Date(data.link.last_synced_at).toLocaleString()}`
                      : "Not synced yet"}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Classical</p>
                <p className="font-display text-4xl">{rating?.classical_rating ?? "—"}</p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" size="sm" disabled={syncMut.isPending} onClick={() => syncMut.mutate()}>
                <RefreshCw className={`mr-2 h-4 w-4 ${syncMut.isPending ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" disabled={unlinkMut.isPending} onClick={() => unlinkMut.mutate()}>
                <Unlink className="mr-2 h-4 w-4" />
                Unlink
              </Button>
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
                {(rating?.breakdown as any[] | undefined)?.length ? (
                  (rating!.breakdown as any[]).map((b, i) => (
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
                    {data.games.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                          No games synced yet.
                        </td>
                      </tr>
                    )}
                    {data.games.map((g: any) => (
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