import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listOrganizations, toggleOrgSuspension } from "@/lib/admin/management.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/organizations")({
  head: () => ({ meta: [{ title: "Organizations — Hamduk Chess Club" }] }),
  component: OrganizationsPage,
});

function OrganizationsPage() {
  const fetchOrgs = useServerFn(listOrganizations);
  const { data, isLoading, error } = useQuery({ queryKey: ["organizations"], queryFn: () => fetchOrgs() });
  const qc = useQueryClient();
  const toggle = useServerFn(toggleOrgSuspension);
  const toggleMut = useMutation({ mutationFn: (input: { organization_id: string; suspended: boolean }) => toggle({ data: input }), onSuccess: () => { toast.success("Organization updated"); void qc.invalidateQueries({ queryKey: ["organizations"] }); }, onError: (e: Error) => toast.error(e.message) });
  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Organizations</p>
        <h1 className="mt-2 font-display text-4xl">Organizations</h1>
        <p className="mt-2 text-muted-foreground">Every school, club or academy running chess programs on the platform.</p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Organization</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Contact</th>
                <th className="text-left px-4 py-3">Tier</th>
                <th className="text-left px-4 py-3">Subscription</th>
                <th className="text-left px-4 py-3">Students</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {error && <tr><td colSpan={7} className="px-4 py-8 text-center text-destructive">{(error as Error).message}</td></tr>}
              {data?.map((s) => (
                <tr key={s.id} className="border-t border-border/40 hover:bg-secondary/20">
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-3">
                      {(s as { logo_url?: string | null }).logo_url ? (
                        <img src={(s as { logo_url?: string | null }).logo_url ?? undefined} alt="" className="size-8 rounded object-cover" />
                      ) : (
                        <div className="size-8 rounded bg-secondary/60" />
                      )}
                      <span>{s.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize">{(s as { type?: string }).type ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.contact_email ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{s.program_tier ?? "—"}</td>
                  <td className="px-4 py-3"><Badge variant={s.subscription_status === "active" ? "default" : "secondary"}>{s.subscription_status}</Badge></td>
                   <td className="px-4 py-3">{s.student_count ?? "—"}</td>
                   <td className="px-4 py-3"><Button size="sm" variant="outline" disabled={toggleMut.isPending} onClick={() => toggleMut.mutate({ organization_id: s.id, suspended: !s.is_suspended })}>{s.is_suspended ? "Unsuspend" : "Suspend"}</Button></td>
                </tr>
              ))}
              {data?.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No organizations yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardShell>
  );
}
