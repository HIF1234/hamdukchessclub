import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAuditLog } from "@/lib/analytics/analytics.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "Audit log — Hamduk Chess Club" }] }),
  component: AuditPage,
});

function AuditPage() {
  const fetch = useServerFn(getAuditLog);
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-log"],
    queryFn: () => fetch(),
  });

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Audit log</p>
        <h1 className="mt-2 font-display text-4xl">Activity trail</h1>
        <p className="mt-2 text-muted-foreground">Recent privileged actions across the platform.</p>
      </div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">When</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Target</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((r) => (
                <tr key={r.id} className="border-t border-border/40 align-top">
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{r.action}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.target_type ? `${r.target_type}` : "—"}
                    {r.target_id ? ` · ${r.target_id.slice(0, 8)}…` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {r.user_id ? r.user_id.slice(0, 8) + "…" : "system"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[280px] truncate">
                    {r.metadata ? JSON.stringify(r.metadata) : "—"}
                  </td>
                </tr>
              ))}
              {data && data.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">No activity yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardShell>
  );
}