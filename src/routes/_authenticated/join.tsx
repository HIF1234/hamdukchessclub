import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { joinOrganizationByCode, listMyMemberships } from "@/lib/organizations/organizations.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/join")({
  head: () => ({ meta: [{ title: "Join organization — Hamduk Chess Club" }] }),
  component: JoinPage,
});

function JoinPage() {
  const [code, setCode] = useState("");
  const qc = useQueryClient();

  const fetchMemberships = useServerFn(listMyMemberships);
  const { data: memberships } = useQuery({
    queryKey: ["my-memberships"],
    queryFn: () => fetchMemberships(),
  });

  const join = useServerFn(joinOrganizationByCode);
  const joinMut = useMutation({
    mutationFn: (input: { code: string }) => join({ data: input }),
    onSuccess: (res) => {
      toast.success(
        res.status === "approved"
          ? `You've joined ${res.organization_name}.`
          : `Request sent to ${res.organization_name} — pending approval.`,
      );
      setCode("");
      void qc.invalidateQueries({ queryKey: ["my-memberships"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Join organization</p>
        <h1 className="mt-2 font-display text-4xl">Join an organization</h1>
        <p className="mt-2 text-muted-foreground">
          Enter a join code from your school, club, or academy to add it to your account. You can
          belong to more than one.
        </p>
      </div>

      <Card className="p-6 mb-6">
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim()) joinMut.mutate({ code: code.trim() });
          }}
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. HCC-CHESS-82F4"
            className="max-w-xs uppercase tracking-widest font-mono"
          />
          <Button type="submit" disabled={joinMut.isPending || !code.trim()}>
            Join
          </Button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="font-medium">Your organizations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm mt-4">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Organization</th>
                <th className="text-left px-4 py-3">Role</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(memberships ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    You haven't joined an organization yet.
                  </td>
                </tr>
              )}
              {(memberships ?? []).map((m) => (
                <tr key={m.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium">{m.organization_name}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{m.role_in_org ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        m.status === "approved" ? "default" : m.status === "pending" ? "secondary" : "outline"
                      }
                    >
                      {m.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardShell>
  );
}
