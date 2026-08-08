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
import { RefreshCw, Trash2, Plus } from "lucide-react";
import {
  getIntegrationStatus,
  syncAllChessAccounts,
  listChessEmbeds,
  createChessEmbed,
  deleteChessEmbed,
  registerChessWebhook,
  deleteChessWebhook,
} from "@/lib/hamduk/hamduk.functions";

export const Route = createFileRoute("/_authenticated/integrations")({
  head: () => ({
    meta: [
      { title: "Integrations — Hamduk Chess Club" },
      { name: "description", content: "Manage the Hamduk Chess API connection, member sync, embeds and webhooks." },
      { property: "og:title", content: "Integrations — Hamduk Chess Club" },
      { property: "og:description", content: "Manage the Hamduk Chess API connection, member sync, embeds and webhooks." },
    ],
  }),
  component: IntegrationsPage,
});

const EVENT_OPTIONS = ["tournament.round_complete", "class.session_started"];

function IntegrationsPage() {
  const qc = useQueryClient();
  const status = useServerFn(getIntegrationStatus);
  const syncAll = useServerFn(syncAllChessAccounts);
  const loadEmbeds = useServerFn(listChessEmbeds);
  const addEmbed = useServerFn(createChessEmbed);
  const removeEmbed = useServerFn(deleteChessEmbed);
  const addHook = useServerFn(registerChessWebhook);
  const removeHook = useServerFn(deleteChessWebhook);

  const { data, isLoading, error } = useQuery({
    queryKey: ["hamduk", "status"],
    queryFn: () => status(),
    retry: false,
  });
  const { data: embeds } = useQuery({ queryKey: ["hamduk", "embeds"], queryFn: () => loadEmbeds() });

  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<"board" | "puzzle" | "leaderboard" | "analysis">("puzzle");
  const [hookUrl, setHookUrl] = useState("");
  const [hookEvents, setHookEvents] = useState<string[]>(EVENT_OPTIONS);

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: ["hamduk"] });
  };

  const syncMut = useMutation({
    mutationFn: () => syncAll(),
    onSuccess: (r: any) => {
      toast.success(`Synced ${r.synced} account(s)${r.failed?.length ? `, ${r.failed.length} failed` : ""}.`);
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

  const hookMut = useMutation({
    mutationFn: () => addHook({ data: { url: hookUrl.trim(), events: hookEvents } }),
    onSuccess: () => {
      toast.success("Webhook registered.");
      setHookUrl("");
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const hookDelMut = useMutation({
    mutationFn: (id: string) => removeHook({ data: { id } }),
    onSuccess: () => {
      toast.success("Webhook removed.");
      refreshAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const webhookEndpoint =
    typeof window !== "undefined" ? `${window.location.origin}/api/public/hamduk-webhook` : "";

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
          Connection health, member rating sync, published boards and webhook delivery.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {data && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">API connection</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant={data.configured ? "default" : "destructive"}>
                    {data.configured ? "Configured" : "Missing credentials"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {data.accounts.length} linked member account(s)
                  </span>
                </div>
              </div>
              <Button size="sm" disabled={syncMut.isPending} onClick={() => syncMut.mutate()}>
                <RefreshCw className={`mr-2 h-4 w-4 ${syncMut.isPending ? "animate-spin" : ""}`} />
                Sync all ratings
              </Button>
            </div>
          </Card>

          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="members">Linked members</TabsTrigger>
              <TabsTrigger value="embeds">Boards &amp; puzzles</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-4">
              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">Member</th>
                      <th className="px-4 py-3 text-left">Hamduk username</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Last synced</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.accounts.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                          No members have linked a Hamduk Chess account yet.
                        </td>
                      </tr>
                    )}
                    {data.accounts.map((a: any) => (
                      <tr key={a.user_id} className="border-t border-border/40">
                        <td className="px-4 py-3 font-medium">{a.full_name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{a.hamduk_username}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="capitalize">
                            {a.link_status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {a.last_synced_at ? new Date(a.last_synced_at).toLocaleString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </TabsContent>

            <TabsContent value="embeds" className="mt-4 space-y-4">
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
                    <select
                      id="embed-kind"
                      value={kind}
                      onChange={(e) => setKind(e.target.value as typeof kind)}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value="puzzle">Puzzle</option>
                      <option value="board">Board</option>
                      <option value="leaderboard">Leaderboard</option>
                      <option value="analysis">Analysis</option>
                    </select>
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
            </TabsContent>

            <TabsContent value="webhooks" className="mt-4 space-y-4">
              <Card className="p-6">
                <h2 className="font-display text-xl">Register a webhook</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Point Hamduk Chess at this app's receiver so tournament rounds and live class sessions
                  update automatically.
                </p>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="hook-url">Receiver URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="hook-url"
                      value={hookUrl}
                      onChange={(e) => setHookUrl(e.target.value)}
                      placeholder={webhookEndpoint || "https://…/api/public/hamduk-webhook"}
                    />
                    <Button variant="outline" onClick={() => setHookUrl(webhookEndpoint)}>
                      Use this app
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {EVENT_OPTIONS.map((ev) => (
                    <label key={ev} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={hookEvents.includes(ev)}
                        onChange={(e) =>
                          setHookEvents((prev) =>
                            e.target.checked ? [...prev, ev] : prev.filter((x) => x !== ev),
                          )
                        }
                      />
                      <code className="text-xs">{ev}</code>
                    </label>
                  ))}
                </div>
                <Button
                  className="mt-4"
                  disabled={!hookUrl.trim() || hookEvents.length === 0 || hookMut.isPending}
                  onClick={() => hookMut.mutate()}
                >
                  {hookMut.isPending ? "Registering…" : "Register webhook"}
                </Button>
              </Card>

              <Card className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">URL</th>
                      <th className="px-4 py-3 text-left">Events</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.webhooks.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">
                          No webhooks registered.
                        </td>
                      </tr>
                    )}
                    {data.webhooks.map((w: any) => (
                      <tr key={w.id} className="border-t border-border/40">
                        <td className="px-4 py-3 break-all">{w.url}</td>
                        <td className="px-4 py-3 text-muted-foreground">{(w.events ?? []).join(", ")}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={hookDelMut.isPending}
                            onClick={() => hookDelMut.mutate(w.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              <Card className="p-6">
                <h2 className="font-display text-xl">Recent deliveries</h2>
                <div className="mt-4 space-y-3">
                  {data.events.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nothing received yet.</p>
                  )}
                  {data.events.map((ev: any) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between border-b border-border/40 pb-2 text-sm"
                    >
                      <code className="text-xs">{ev.event}</code>
                      <span className="text-xs text-muted-foreground">
                        {new Date(ev.received_at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </DashboardShell>
  );
}