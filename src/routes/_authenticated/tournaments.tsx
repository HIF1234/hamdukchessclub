import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listTournaments, createTournament, registerForTournament } from "@/lib/admin/management.functions";
import { useAuth } from "@/lib/auth/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tournaments")({
  head: () => ({ meta: [{ title: "Tournaments — Hamduk Chess Club" }] }),
  component: TournamentsPage,
});

function TournamentsPage() {
  const { roles } = useAuth();
  const canCreate = roles.includes("super_admin") || roles.includes("school_admin");
  const fetchT = useServerFn(listTournaments);
  const register = useServerFn(registerForTournament);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["tournaments"], queryFn: () => fetchT() });

  const regMut = useMutation({
    mutationFn: (tournament_id: string) => register({ data: { tournament_id } }),
    onSuccess: () => { toast.success("Registered"); qc.invalidateQueries({ queryKey: ["tournaments"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Tournaments</p>
          <h1 className="mt-2 font-display text-4xl">Compete</h1>
          <p className="mt-2 text-muted-foreground">Open tournaments and upcoming events.</p>
        </div>
        {canCreate && <CreateTournamentDialog />}
      </div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((t) => (
          <Card key={t.id} className="p-5 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <Trophy className="h-5 w-5 text-primary/70" />
              <Badge variant="secondary" className="capitalize">{t.format.replace("_", " ")}</Badge>
            </div>
            <Link to="/tournaments/$tournamentId" params={{ tournamentId: t.id }} className="mt-3 font-display text-xl hover:text-primary">
              {t.name}
            </Link>
            {t.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{t.description}</p>}
            <div className="mt-3 text-xs text-muted-foreground">{new Date(t.starts_at).toLocaleString()}</div>
            <div className="mt-1 text-xs text-muted-foreground">{t.rounds} rounds{t.max_participants ? ` · max ${t.max_participants}` : ""}</div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground capitalize">{t.status.replace("_", " ")}</span>
              <div className="flex gap-2">
                <Link to="/tournaments/$tournamentId" params={{ tournamentId: t.id }}>
                  <Button size="sm" variant="ghost">Open</Button>
                </Link>
                <Button size="sm" variant="secondary" disabled={regMut.isPending || t.status !== "registration_open"} onClick={() => regMut.mutate(t.id)}>
                  Register
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <p className="text-muted-foreground col-span-full">No tournaments yet.</p>}
      </div>
    </DashboardShell>
  );
}

function CreateTournamentDialog() {
  const createFn = useServerFn(createTournament);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<"swiss" | "round_robin" | "knockout" | "arena">("swiss");
  const [startsAt, setStartsAt] = useState("");
  const [rounds, setRounds] = useState("5");
  const [maxP, setMaxP] = useState("32");

  const mut = useMutation({
    mutationFn: () => createFn({ data: { name, description: description || undefined, format, starts_at: new Date(startsAt).toISOString(), rounds: Number(rounds), max_participants: Number(maxP) } }),
    onSuccess: () => {
      toast.success("Tournament created");
      qc.invalidateQueries({ queryKey: ["tournaments"] });
      setOpen(false);
      setName(""); setDescription(""); setStartsAt("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />New tournament</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create tournament</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="name">Name</Label><Input id="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="desc">Description</Label><Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="swiss">Swiss</SelectItem>
                  <SelectItem value="round_robin">Round robin</SelectItem>
                  <SelectItem value="knockout">Knockout</SelectItem>
                  <SelectItem value="arena">Arena</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="rounds">Rounds</Label><Input id="rounds" type="number" min={1} value={rounds} onChange={(e) => setRounds(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="maxp">Max participants</Label><Input id="maxp" type="number" min={2} value={maxP} onChange={(e) => setMaxP(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="starts">Starts at</Label><Input id="starts" type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></div>
          </div>
          <Button type="submit" className="w-full" disabled={mut.isPending}>{mut.isPending ? "Creating…" : "Create"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}