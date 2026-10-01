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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";
import { getIntegrationStatus, listChessEmbeds, createChessEmbed, deleteChessEmbed } from "@/lib/hamduk/hamduk.functions";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — Hamduk Chess Club" },
      { name: "description", content: "Manage the Hamduk Chess API connection and published boards/puzzles." },
      { property: "og:title", content: "Integrations — Hamduk Chess Club" },
      { property: "og:description", content: "Manage the Hamduk Chess API connection and published boards/puzzles." },
    ],
  }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const qc = useQueryClient();
  const status = useServerFn(getIntegrationStatus);
  const loadEmbeds = useServerFn(listChessEmbeds);
  const addEmbed = useServerFn(createChessEmbed);
  const removeEmbed = useServerFn(deleteChessEmbed);

  const { data, isLoading, error } = useQuery({
    queryKey: ["hamduk", "status"],
    queryFn: () => status(),
    retry: false,
  });
  const { data: embeds } = useQuery({ queryKey: ["hamduk", "embeds"], queryFn: () => loadEmbeds() });

  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<"board" | "puzzle" | "leaderboard" | "game">("puzzle");

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["hamduk"] });
  };

  const embedMut = useMutation({
    mutationFn: () => addEmbed({ data: { kind, label: label.trim(), config: {}, ttl_hours: 720 } }),
    onSuccess: () => {
      toast.success("Embed created.");
      setLabel("");
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const embedDelMut = useMutation({
    mutationFn: (id: string) => removeEmbed({ data: { id } }),
    onSuccess: () => {
      toast.success("Embed removed.");
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) {
    return (
      <DashboardShell>
        <Card className="p-6">
          <p className="text-muted-foreground">This page is only available to club super admins.</p>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Integrations</p>
        <h1 className="mt-2 font-display text-4xl">Hamduk Chess platform</h1>
        <p className="mt-2 text-muted-foreground">
          Connection health and published boards/puzzles. Ratings and games are read directly from the
          shared platform account now -- there's nothing to link or sync.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {data && (
        <div className="space-y-6">
          <Card className="p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">API connection</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={data.configured ? "default" : "destructive"}>
                {data.configured ? "Configured" : "Missing credentials"}
              </Badge>
              <Badge variant={data.webhookConfigured ? "default" : "secondary"}>
                {data.webhookConfigured ? "Webhook secret set" : "No webhook secret"}
              </Badge>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-display text-xl">Publish a widget</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Creates a signed embed token on Hamduk Chess and shows it to members under My chess.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="embed-label">Label</Label>
                <Input
                  id="embed-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Daily puzzle"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="embed-kind">Kind</Label>
                <Select value={kind} onValueChange={(value) => setKind(value as typeof kind)}>
                  <SelectTrigger id="embed-kind"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="puzzle">Puzzle</SelectItem><SelectItem value="board">Board</SelectItem><SelectItem value="leaderboard">Leaderboard</SelectItem><SelectItem value="game">Live game</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  disabled={label.trim().length < 2 || embedMut.isPending}
                  onClick={() => embedMut.mutate()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {embedMut.isPending ? "Creating…" : "Create"}
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {(embeds ?? []).map((e: any) => (
              <Card key={e.id} className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{e.label}</p>
                    <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{e.kind}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Expires {e.expires_at ? new Date(e.expires_at).toLocaleDateString() : "never"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={embedDelMut.isPending}
                    onClick={() => embedDelMut.mutate(e.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
            {(embeds ?? []).length === 0 && (
              <p className="text-muted-foreground">No widgets published yet.</p>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
