import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  getMyOrgJoinSettings,
  regenerateJoinCode,
  setJoinPolicy,
  listMembershipRequests,
  decideMembershipRequest,
} from "@/lib/organizations/organizations.functions";
import { listMembers, listGuardianLinks, linkGuardian, unlinkGuardian } from "@/lib/admin/management.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/organization")({
  head: () => ({ meta: [{ title: "My organization — Hamduk Chess Club" }] }),
  component: MyOrganizationPage,
});

const POLICY_LABEL: Record<string, string> = {
  auto: "Auto-approve",
  admin_approval: "Require my approval",
  parent_approval: "Require parent approval",
  disabled: "Disabled (no self-join)",
};

function MyOrganizationPage() {
  const qc = useQueryClient();

  const fetchSettings = useServerFn(getMyOrgJoinSettings);
  const { data: settings, isLoading } = useQuery({
    queryKey: ["org-join-settings"],
    queryFn: () => fetchSettings(),
  });

  const fetchRequests = useServerFn(listMembershipRequests);
  const { data: requests } = useQuery({
    queryKey: ["org-membership-requests"],
    queryFn: () => fetchRequests(),
    enabled: !!settings,
  });

  const regenerate = useServerFn(regenerateJoinCode);
  const regenerateMut = useMutation({
    mutationFn: () => regenerate(),
    onSuccess: () => {
      toast.success("New join code generated");
      void qc.invalidateQueries({ queryKey: ["org-join-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const policy = useServerFn(setJoinPolicy);
  const policyMut = useMutation({
    mutationFn: (join_policy: "auto" | "admin_approval" | "parent_approval" | "disabled") =>
      policy({ data: { join_policy } }),
    onSuccess: () => {
      toast.success("Join policy updated");
      void qc.invalidateQueries({ queryKey: ["org-join-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const decide = useServerFn(decideMembershipRequest);
  const decideMut = useMutation({
    mutationFn: (input: { membership_id: string; approve: boolean }) => decide({ data: input }),
    onSuccess: () => {
      toast.success("Request updated");
      void qc.invalidateQueries({ queryKey: ["org-membership-requests"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fetchMembers = useServerFn(listMembers);
  const { data: members } = useQuery({ queryKey: ["members"], queryFn: () => fetchMembers(), enabled: !!settings });
  const fetchLinks = useServerFn(listGuardianLinks);
  const { data: links } = useQuery({ queryKey: ["guardian-links"], queryFn: () => fetchLinks(), enabled: !!settings });
  const [guardianId, setGuardianId] = useState("");
  const [childId, setChildId] = useState("");
  const link = useServerFn(linkGuardian);
  const linkMut = useMutation({
    mutationFn: () => link({ data: { guardian_user_id: guardianId, child_user_id: childId } }),
    onSuccess: () => {
      toast.success("Linked");
      setGuardianId("");
      setChildId("");
      void qc.invalidateQueries({ queryKey: ["guardian-links"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const unlink = useServerFn(unlinkGuardian);
  const unlinkMut = useMutation({
    mutationFn: (link_id: string) => unlink({ data: { link_id } }),
    onSuccess: () => {
      toast.success("Unlinked");
      void qc.invalidateQueries({ queryKey: ["guardian-links"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <DashboardShell>
        <p className="text-muted-foreground">Loading…</p>
      </DashboardShell>
    );
  }

  if (!settings) {
    return (
      <DashboardShell>
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-primary">My organization</p>
          <h1 className="mt-2 font-display text-4xl">My organization</h1>
        </div>
        <Card className="p-6 text-muted-foreground">
          You don't own an organization yet. This page is for organization admins.
        </Card>
      </DashboardShell>
    );
  }

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const decided = (requests ?? []).filter((r) => r.status !== "pending");

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">My organization</p>
        <h1 className="mt-2 font-display text-4xl">{settings.name}</h1>
        <p className="mt-2 text-muted-foreground">
          Share your join code so members can add this organization to their account.
        </p>
      </div>

      <Card className="p-6 mb-6">
        <h2 className="font-medium mb-4">Join code</h2>
        <div className="flex flex-wrap items-center gap-4">
          <code className="rounded-md bg-secondary/40 px-4 py-2 text-lg font-mono tracking-widest">
            {settings.join_code}
          </code>
          <Button
            size="sm"
            variant="outline"
            disabled={regenerateMut.isPending}
            onClick={() => regenerateMut.mutate()}
          >
            Generate new code
          </Button>
        </div>

        <div className="mt-6">
          <p className="text-sm font-medium mb-2">When someone joins with this code</p>
          <Select
            value={settings.join_policy}
            onValueChange={(v) => policyMut.mutate(v as "auto" | "admin_approval" | "parent_approval" | "disabled")}
          >
            <SelectTrigger className="w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(POLICY_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-6 pb-0">
          <h2 className="font-medium">Pending requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm mt-4">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Member</th>
                <th className="text-left px-4 py-3">Requested</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No pending requests.
                  </td>
                </tr>
              )}
              {pending.map((r) => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium">{r.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(r.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Button
                      size="sm"
                      disabled={decideMut.isPending}
                      onClick={() => decideMut.mutate({ membership_id: r.id, approve: true })}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={decideMut.isPending}
                      onClick={() => decideMut.mutate({ membership_id: r.id, approve: false })}
                    >
                      Reject
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {decided.length > 0 && (
        <Card className="overflow-hidden mt-6">
          <div className="p-6 pb-0">
            <h2 className="font-medium">Recent decisions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-4">
              <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Member</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {decided.map((r) => (
                  <tr key={r.id} className="border-t border-border/40">
                    <td className="px-4 py-3 font-medium">{r.full_name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={r.status === "approved" ? "default" : "secondary"}>{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="p-6 mt-6">
        <h2 className="font-medium mb-1">Guardian links</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Link a parent/guardian member to the child they should see activity for. Both people
          must already be members of this organization.
        </p>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (guardianId && childId) linkMut.mutate();
          }}
        >
          <div className="flex-1 min-w-48">
            <label className="text-xs text-muted-foreground">Guardian</label>
            <Select value={guardianId} onValueChange={setGuardianId}>
              <SelectTrigger>
                <SelectValue placeholder="Select member…" />
              </SelectTrigger>
              <SelectContent>
                {(members ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="text-xs text-muted-foreground">Child</label>
            <Select value={childId} onValueChange={setChildId}>
              <SelectTrigger>
                <SelectValue placeholder="Select member…" />
              </SelectTrigger>
              <SelectContent>
                {(members ?? []).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={linkMut.isPending || !guardianId || !childId}>
            Link
          </Button>
        </form>

        {(links ?? []).length > 0 && (
          <ul className="mt-5 space-y-2 text-sm">
            {links!.map((l) => (
              <li key={l.id} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
                <span>
                  <span className="font-medium">{l.guardian_name}</span> is guardian of{" "}
                  <span className="font-medium">{l.child_name}</span>
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={unlinkMut.isPending}
                  onClick={() => unlinkMut.mutate(l.id)}
                >
                  Unlink
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </DashboardShell>
  );
}
