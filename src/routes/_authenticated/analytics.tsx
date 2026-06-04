import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAnalytics } from "@/lib/analytics/analytics.functions";
import { Card } from "@/components/ui/card";
import { BarChart3, Users, BookOpen, Trophy, Banknote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics — Hamduk Chess Club" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const fetch = useServerFn(getAnalytics);
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetch(),
  });

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Analytics</p>
        <h1 className="mt-2 font-display text-4xl">Club at a glance</h1>
        <p className="mt-2 text-muted-foreground">Signups, revenue and program activity.</p>
      </div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      {data && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Stat icon={Users} label="Members" value={data.totals.members} sub={`${data.totals.activeMembers} active`} />
            <Stat icon={BookOpen} label="Classes" value={data.totals.classes} />
            <Stat icon={Trophy} label="Tournaments" value={data.totals.tournaments} />
            <Stat icon={Banknote} label="Revenue (NGN)" value={data.totals.revenueNgn.toLocaleString()} />
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <ChartCard title="Signups (14d)" buckets={data.signups} />
            <ChartCard title="Revenue NGN (14d)" buckets={data.revenue} />
          </div>
          <Card className="mt-4 p-5">
            <h3 className="font-display text-lg mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Members by level
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <LevelBar label="Beginner" value={data.byLevel.beginner} total={data.totals.members} />
              <LevelBar label="Intermediate" value={data.byLevel.intermediate} total={data.totals.members} />
              <LevelBar label="Advanced" value={data.byLevel.advanced} total={data.totals.members} />
            </div>
          </Card>
        </>
      )}
    </DashboardShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-primary/70" />
      </div>
      <p className="mt-3 font-display text-3xl">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </Card>
  );
}

function ChartCard({ title, buckets }: { title: string; buckets: { label: string; value: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.value));
  return (
    <Card className="p-5">
      <h3 className="font-display text-lg mb-4">{title}</h3>
      <div className="flex items-end gap-2 h-40">
        {buckets.map((b) => (
          <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-primary/40 rounded-t"
              style={{ height: `${(b.value / max) * 100}%`, minHeight: b.value > 0 ? "4px" : "1px" }}
              title={`${b.label}: ${b.value}`}
            />
            <span className="text-[10px] text-muted-foreground">{b.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LevelBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-muted-foreground">{value} · {pct}%</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}