import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listSchools, toggleSchoolSuspension } from "@/lib/admin/management.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/schools")({
  head: () => ({ meta: [{ title: "Schools — Hamduk Chess Club" }] }),
  component: SchoolsPage,
});

function SchoolsPage() {
  const fetchSchools = useServerFn(listSchools);
  const { data, isLoading, error } = useQuery({ queryKey: ["schools"], queryFn: () => fetchSchools() });
  const qc = useQueryClient();
  const toggle = useServerFn(toggleSchoolSuspension);
  const toggleMut = useMutation({ mutationFn: (input: { school_id: string; suspended: boolean }) => toggle({ data: input }), onSuccess: () => { toast.success("School updated"); void qc.invalidateQueries({ queryKey: ["schools"] }); }, onError: (e: Error) => toast.error(e.message) });
  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Schools</p>
        <h1 className="mt-2 font-display text-4xl">Partner schools</h1>
        <p className="mt-2 text-muted-foreground">Every school running chess programs with the club.</p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">School</th>
                <th className="text-left px-4 py-3">Contact</th>
                <th className="text-left px-4 py-3">Tier</th>
                <th className="text-left px-4 py-3">Subscription</th>
                <th className="text-left px-4 py-3">Students</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {error && <tr><td colSpan={6} className="px-4 py-8 text-center text-destructive">{(error as Error).message}</td></tr>}
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
                  <td className="px-4 py-3 text-muted-foreground">{s.contact_email ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">{s.program_tier ?? "—"}</td>
                  <td className="px-4 py-3"><Badge variant={s.subscription_status === "active" ? "default" : "secondary"}>{s.subscription_status}</Badge></td>
                   <td className="px-4 py-3">{s.student_count ?? "—"}</td>
                   <td className="px-4 py-3"><Button size="sm" variant="outline" disabled={toggleMut.isPending} onClick={() => toggleMut.mutate({ school_id: s.id, suspended: !s.is_suspended })}>{s.is_suspended ? "Unsuspend" : "Suspend"}</Button></td>
                </tr>
              ))}
              {data?.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No schools yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardShell>
  );
}