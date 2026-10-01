import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listCoachApplications, decideCoachApplication } from "@/lib/coaching/coaching.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/coach-applications")({
  head: () => ({ meta: [{ title: "Coach applications — Hamduk Chess Club" }] }),
  component: CoachApplicationsPage,
});

function CoachApplicationsPage() {
  const qc = useQueryClient();
  const fetchApps = useServerFn(listCoachApplications);
  const { data, isLoading, error } = useQuery({ queryKey: ["coach-applications"], queryFn: () => fetchApps() });

  const decide = useServerFn(decideCoachApplication);
  const decideMut = useMutation({
    mutationFn: (input: { application_id: string; approve: boolean }) => decide({ data: input }),
    onSuccess: (_res, input) => {
      toast.success(input.approve ? "Coach verified" : "Application rejected");
      void qc.invalidateQueries({ queryKey: ["coach-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = (data ?? []).filter((a) => a.status === "pending");
  const decided = (data ?? []).filter((a) => a.status !== "pending");

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Hamduk-verified coaches</p>
        <h1 className="mt-2 font-display text-4xl">Coach applications</h1>
        <p className="mt-2 text-muted-foreground">Review tutors applying for the platform-wide verified badge.</p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}

      <div className="space-y-4">
        {pending.length === 0 && !isLoading && (
          <Card className="p-6 text-muted-foreground">No pending applications.</Card>
        )}
        {pending.map((a) => (
          <Card key={a.id} className="p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-medium">{a.full_name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Submitted {new Date(a.submitted_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={decideMut.isPending}
                  onClick={() => decideMut.mutate({ application_id: a.id, approve: true })}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={decideMut.isPending}
                  onClick={() => decideMut.mutate({ application_id: a.id, approve: false })}
                >
                  Reject
                </Button>
              </div>
            </div>
            <p className="mt-3 text-sm whitespace-pre-wrap">{a.bio}</p>
            {a.specialties.length > 0 && (
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {a.specialties.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      {decided.length > 0 && (
        <Card className="overflow-hidden mt-6">
          <div className="p-6 pb-0">
            <h2 className="font-medium">Past decisions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-4">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((a) => (
                  <tr key={a.id} className="border-t border-border/40">
                    <td className="px-4 py-3 font-medium">{a.full_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={a.status === "approved" ? "default" : "secondary"}>{a.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </DashboardShell>
  );
}
