import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listMyChildren, getChildOverview } from "@/lib/family/family.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Trophy, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/family")({
  head: () => ({ meta: [{ title: "Family — Hamduk Chess Club" }] }),
  component: FamilyPage,
});

function FamilyPage() {
  const fetchChildren = useServerFn(listMyChildren);
  const { data: children, isLoading } = useQuery({ queryKey: ["my-children"], queryFn: () => fetchChildren() });

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Family</p>
        <h1 className="mt-2 font-display text-4xl">Your children</h1>
        <p className="mt-2 text-muted-foreground">
          Classes, tournaments, and attendance for the children linked to your account.
        </p>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {!isLoading && (children ?? []).length === 0 && (
        <Card className="p-6 text-muted-foreground">
          No children are linked to your account yet. Ask your organization's admin to link you
          as a guardian.
        </Card>
      )}

      <div className="space-y-6">
        {children?.map((child) => <ChildCard key={child.child_user_id} childUserId={child.child_user_id} name={child.full_name} orgName={child.organization_name} accountState={child.account_state} />)}
      </div>
    </DashboardShell>
  );
}

function ChildCard({
  childUserId,
  name,
  orgName,
  accountState,
}: {
  childUserId: string;
  name: string;
  orgName: string;
  accountState: string | null;
}) {
  const fetchOverview = useServerFn(getChildOverview);
  const { data: overview, isLoading } = useQuery({
    queryKey: ["child-overview", childUserId],
    queryFn: () => fetchOverview({ data: { child_user_id: childUserId } }),
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-display text-2xl">{name}</h2>
          <p className="text-sm text-muted-foreground">{orgName}</p>
        </div>
        {accountState && <Badge variant={accountState === "active" ? "default" : "secondary"}>{accountState}</Badge>}
      </div>

      {isLoading && <p className="mt-4 text-sm text-muted-foreground">Loading…</p>}

      {overview && (
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4 text-primary/70" />
              <h3 className="font-medium text-sm">Upcoming classes</h3>
            </div>
            {overview.upcoming_classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {overview.upcoming_classes.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
                    <span>{c.title}</span>
                    <span className="text-xs text-muted-foreground">{new Date(c.starts_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-2 mb-2 mt-5">
              <Trophy className="h-4 w-4 text-primary/70" />
              <h3 className="font-medium text-sm">Upcoming tournaments</h3>
            </div>
            {overview.upcoming_tournaments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing scheduled.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {overview.upcoming_tournaments.map((t) => (
                  <li key={t.id} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
                    <span>{t.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(t.starts_at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-primary/70" />
              <h3 className="font-medium text-sm">
                Attendance ({overview.classes_attended}/{overview.classes_total})
              </h3>
            </div>
            {overview.recent_attendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No class history yet.</p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {overview.recent_attendance.map((a, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
                    <span>{a.class_title}</span>
                    <Badge variant={a.attended ? "default" : "secondary"}>{a.attended ? "Attended" : "Missed"}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
