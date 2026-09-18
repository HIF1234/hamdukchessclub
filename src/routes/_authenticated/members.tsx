import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listMembers, updateMemberState } from "@/lib/admin/management.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/members")({
  head: () => ({ meta: [{ title: "Members — Hamduk Chess Club" }] }),
  component: MembersPage,
});

function MembersPage() {
  const { roles } = useAuth();
  const fetchMembers = useServerFn(listMembers);
  const { data, isLoading, error } = useQuery({
    queryKey: ["members"],
    queryFn: () => fetchMembers(),
  });
  const qc = useQueryClient();
  const updateState = useServerFn(updateMemberState);
  const stateMut = useMutation({ mutationFn: (input: { user_id: string; account_state: "active" | "suspended" | "expired" }) => updateState({ data: input }), onSuccess: () => { toast.success("Member updated"); void qc.invalidateQueries({ queryKey: ["members"] }); }, onError: (e: Error) => toast.error(e.message) });

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Members</p>
        <h1 className="mt-2 font-display text-4xl">Club roster</h1>
        <p className="mt-2 text-muted-foreground">All registered members, their state and rating.</p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">State</th>
                <th className="text-left px-4 py-3">Level</th>
                <th className="text-left px-4 py-3">Rating</th>
                 <th className="text-left px-4 py-3">Member since</th>
                 <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>
              )}
              {error && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-destructive">{(error as Error).message}</td></tr>
              )}
              {data?.map((m) => (
                <tr key={m.id} className="border-t border-border/40 hover:bg-secondary/20">
                  <td className="px-4 py-3 font-medium">{m.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                  <td className="px-4 py-3"><Badge variant={m.account_state === "active" ? "default" : "secondary"}>{m.account_state}</Badge></td>
                  <td className="px-4 py-3 capitalize">{m.membership_level ?? "—"}</td>
                  <td className="px-4 py-3">{m.chess_rating ?? "—"}</td>
                   <td className="px-4 py-3 text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</td>
                   <td className="px-4 py-3">{m.account_state === "suspended" ? <Button size="sm" variant="outline" disabled={stateMut.isPending} onClick={() => stateMut.mutate({ user_id: m.id, account_state: "active" })}>Reactivate</Button> : <Button size="sm" variant="outline" disabled={stateMut.isPending || (roles.includes("school_admin") && m.account_state !== "active")} onClick={() => stateMut.mutate({ user_id: m.id, account_state: "suspended" })}>Suspend</Button>}</td>
                </tr>
              ))}
              {data?.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No members yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardShell>
  );
}