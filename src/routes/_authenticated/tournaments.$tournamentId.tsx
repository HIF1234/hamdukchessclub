import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  getTournamentDetail, generateNextRound, recordResult, completeTournament,
} from "@/lib/tournaments/tournaments.functions";
import { registerForTournament } from "@/lib/admin/management.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trophy, Users, Swords, BarChart3, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tournaments/$tournamentId")({
  head: () => ({ meta: [{ title: "Tournament — Hamduk Chess Club" }] }),
  component: TournamentDetailPage,
});

function TournamentDetailPage() {
  const { tournamentId } = useParams({ from: "/_authenticated/tournaments/$tournamentId" });
  const fetchDetail = useServerFn(getTournamentDetail);
  const register = useServerFn(registerForTournament);
  const nextRound = useServerFn(generateNextRound);
  const complete = useServerFn(completeTournament);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: () => fetchDetail({ data: { tournament_id: tournamentId } }),
  });

  const inv = () => qc.invalidateQueries({ queryKey: ["tournament", tournamentId] });

  const regMut = useMutation({
    mutationFn: () => register({ data: { tournament_id: tournamentId } }),
    onSuccess: () => { toast.success("Registered"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const roundMut = useMutation({
    mutationFn: () => nextRound({ data: { tournament_id: tournamentId } }),
    onSuccess: (r) => { toast.success(`Round ${r.round_number} generated`); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const completeMut = useMutation({
    mutationFn: () => complete({ data: { tournament_id: tournamentId } }),
    onSuccess: () => { toast.success("Tournament marked complete"); inv(); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <Link to="/tournaments" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> All tournaments
      </Link>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      {data && (
        <>
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary">Tournament</p>
              <h1 className="mt-2 font-display text-4xl">{data.tournament.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">{data.tournament.format.replace("_", " ")}</Badge>
                <Badge variant="outline" className="capitalize">{data.tournament.status.replace("_", " ")}</Badge>
                <span className="text-sm text-muted-foreground">{new Date(data.tournament.starts_at).toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">· {data.participants.length} registered</span>
              </div>
            </div>
            <div className="flex gap-2">
              {!data.registered_me && data.tournament.status === "registration_open" && (
                <Button onClick={() => regMut.mutate()} disabled={regMut.isPending}>Register</Button>
              )}
              {data.can_manage && data.tournament.status !== "completed" && (
                <Button variant="secondary" onClick={() => roundMut.mutate()} disabled={roundMut.isPending}>
                  {roundMut.isPending ? "Pairing…" : "Generate next round"}
                </Button>
              )}
              {data.can_manage && data.tournament.status === "in_progress" && (
                <Button variant="outline" onClick={() => completeMut.mutate()} disabled={completeMut.isPending}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />Complete
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue="standings" className="w-full">
            <TabsList className="mb-4 flex-wrap h-auto">
              <TabsTrigger value="standings"><BarChart3 className="h-4 w-4 mr-1" />Standings</TabsTrigger>
              <TabsTrigger value="rounds"><Swords className="h-4 w-4 mr-1" />Rounds</TabsTrigger>
              <TabsTrigger value="participants"><Users className="h-4 w-4 mr-1" />Participants</TabsTrigger>
              <TabsTrigger value="about"><Trophy className="h-4 w-4 mr-1" />About</TabsTrigger>
            </TabsList>

            <TabsContent value="standings">
              <Card className="p-6">
                <h2 className="font-display text-2xl mb-4">Standings</h2>
                {data.standings.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No participants yet.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="text-left text-muted-foreground">
                      <tr><th className="py-2">#</th><th>Player</th><th>Rating</th><th className="text-right">Points</th></tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {data.standings.map((s, i) => (
                        <tr key={s.user_id}>
                          <td className="py-2 w-10 text-muted-foreground">{i + 1}</td>
                          <td>{s.full_name}</td>
                          <td className="text-muted-foreground">{s.chess_rating ?? "—"}</td>
                          <td className="text-right font-medium">{s.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="rounds">
              {data.rounds.length === 0 ? (
                <Card className="p-6 text-sm text-muted-foreground">No rounds yet. {data.can_manage && "Click \"Generate next round\" to pair players."}</Card>
              ) : (
                <div className="space-y-4">
                  {data.rounds.map((r) => {
                    const pairings = data.pairings.filter((p) => p.round_id === r.id);
                    return (
                      <Card key={r.id} className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-display text-xl">Round {r.round_number}</h3>
                          <Badge variant="outline" className="capitalize">{r.status.replace("_", " ")}</Badge>
                        </div>
                        <table className="w-full text-sm">
                          <thead className="text-left text-muted-foreground">
                            <tr><th className="py-2 w-10">#</th><th>White</th><th>Black</th><th className="text-right">Result</th></tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {pairings.map((p) => (
                              <PairingRow key={p.id} pairing={p} canManage={data.can_manage} onChange={inv} />
                            ))}
                          </tbody>
                        </table>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="participants">
              <Card className="p-6">
                {data.participants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No participants yet.</p>
                ) : (
                  <ul className="divide-y divide-border/40">
                    {data.participants.map((p) => (
                      <li key={p.id} className="py-3 flex items-center justify-between">
                        <span>{p.full_name}</span>
                        <span className="text-xs text-muted-foreground">Rating {p.chess_rating ?? "—"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="about">
              <Card className="p-6 space-y-3">
                <p className="text-muted-foreground">{data.tournament.description || "No description."}</p>
                <p className="text-sm text-muted-foreground">{data.tournament.rounds ?? "—"} rounds · max {data.tournament.max_participants ?? "—"} players</p>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardShell>
  );
}

function PairingRow({ pairing, canManage, onChange }: {
  pairing: { id: string; board: number; white_name: string; black_name: string; result: string | null };
  canManage: boolean;
  onChange: () => void;
}) {
  const fn = useServerFn(recordResult);
  const mut = useMutation({
    mutationFn: (result: "1-0" | "0-1" | "1/2-1/2" | "bye") =>
      fn({ data: { pairing_id: pairing.id, result } }),
    onSuccess: () => { toast.success("Result saved"); onChange(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <tr>
      <td className="py-2 text-muted-foreground">{pairing.board}</td>
      <td>{pairing.white_name}</td>
      <td>{pairing.black_name}</td>
      <td className="text-right">
        {canManage ? (
          <Select value={pairing.result ?? ""} onValueChange={(v) => mut.mutate(v as any)}>
            <SelectTrigger className="w-32 ml-auto h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1-0">1 – 0</SelectItem>
              <SelectItem value="0-1">0 – 1</SelectItem>
              <SelectItem value="1/2-1/2">½ – ½</SelectItem>
              <SelectItem value="bye">Bye</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className="text-muted-foreground">{pairing.result ?? "—"}</span>
        )}
      </td>
    </tr>
  );
}