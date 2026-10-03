import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-context";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardStats, type RoleStats } from "@/lib/dashboard/dashboard.functions";
import { listClasses, listTournaments } from "@/lib/admin/management.functions";
import { listAnnouncements } from "@/lib/announcements/announcements.functions";
import { getMyChessProfile } from "@/lib/hamduk/hamduk.functions";
import { listMyChildren, getChildOverview } from "@/lib/family/family.functions";
import { Trophy, Users, Building2, CreditCard, GraduationCap, BookOpen, Sparkles, KeyRound, UserCheck, Megaphone, Baby, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Hamduk Chess Club" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, roles } = useAuth();
  const fetchStats = useServerFn(getDashboardStats);
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats", roles.join(",")],
    queryFn: () => fetchStats(),
    staleTime: 30_000,
  });

  const fetchClasses = useServerFn(listClasses);
  const { data: classes } = useQuery({ queryKey: ["classes"], queryFn: () => fetchClasses(), staleTime: 30_000 });
  const fetchTournaments = useServerFn(listTournaments);
  const { data: tournaments } = useQuery({ queryKey: ["tournaments"], queryFn: () => fetchTournaments(), staleTime: 30_000 });
  const fetchAnnouncements = useServerFn(listAnnouncements);
  const { data: announcements } = useQuery({ queryKey: ["announcements"], queryFn: () => fetchAnnouncements(), staleTime: 30_000 });

  const fetchChildren = useServerFn(listMyChildren);
  const { data: children } = useQuery({ queryKey: ["my-children"], queryFn: () => fetchChildren(), staleTime: 30_000 });

  const primaryRole = roles.includes("super_admin")
    ? "super_admin"
    : roles.includes("org_admin")
    ? "org_admin"
    : roles.includes("tutor")
    ? "tutor"
    : (children ?? []).length > 0
    ? "parent"
    : "member";

  const firstName = profile?.full_name?.split(" ")[0] ?? "player";
  const greeting = hour() < 12 ? "Good morning" : hour() < 18 ? "Good afternoon" : "Good evening";

  return (
    <DashboardShell>
      <div className="mb-10">
        <p className="text-xs uppercase tracking-widest text-primary">{greeting}</p>
        <h1 className="mt-2 font-display text-4xl sm:text-5xl">
          Hello, <em className="text-primary not-italic">{firstName}</em>.
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">{tagline(primaryRole)}</p>
      </div>

      {primaryRole === "super_admin" && <SuperAdminView stats={stats} />}
      {primaryRole === "org_admin" && <OrgAdminView stats={stats} classes={classes} tournaments={tournaments} />}
      {primaryRole === "tutor" && <TutorView stats={stats} classes={classes} myId={profile?.id} />}
      {primaryRole === "parent" && <ParentView children={children ?? []} />}
      {primaryRole === "member" && <MemberView classes={classes} tournaments={tournaments} />}

      <AnnouncementsCard announcements={announcements} />
    </DashboardShell>
  );
}

function hour() {
  return new Date().getHours();
}

function tagline(role: string) {
  switch (role) {
    case "super_admin":
      return "Club-wide overview — members, organizations, payments, and operations at a glance.";
    case "org_admin":
      return "Your organization's home base — manage members, classes, and join requests.";
    case "tutor":
      return "Your teaching dashboard — upcoming classes, students, and resources.";
    case "parent":
      return "Your children's classes, tournaments, and attendance — all in one place.";
    default:
      return "Classes, tournaments, ratings, and your community of players — all in one place.";
  }
}

function formatNaira(kobo: number) {
  return "₦" + (kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 });
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: sameYear ? undefined : "numeric" }) +
    " · " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function upcoming<T extends { starts_at: string; status: string }>(items: T[] | undefined, activeStatuses: string[], n: number) {
  const now = Date.now();
  return (items ?? [])
    .filter((i) => activeStatuses.includes(i.status) && new Date(i.starts_at).getTime() >= now)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, n);
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function StatCard({ label, value, hint, icon: Icon }: { label: string; value: string; hint?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <Card className="p-6 relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
        {Icon && <Icon className="h-4 w-4 text-primary/70" />}
      </div>
      <div className="mt-3 font-display text-4xl">{value}</div>
      {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function AnnouncementsCard({ announcements }: { announcements?: { id: string; title: string; body: string; published_at: string; pinned: boolean }[] }) {
  const items = (announcements ?? []).slice(0, 3);
  if (items.length === 0) return null;
  return (
    <Card className="p-6 mt-6">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="h-4 w-4 text-primary/70" />
        <h3 className="font-display text-xl">Announcements</h3>
      </div>
      <ul className="space-y-3">
        {items.map((a) => (
          <li key={a.id} className="border-t border-border/40 pt-3 first:border-0 first:pt-0">
            <div className="flex items-center gap-2">
              {a.pinned && <Badge variant="secondary">Pinned</Badge>}
              <span className="font-medium text-sm">{a.title}</span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{a.body}</p>
            <p className="mt-1 text-xs text-muted-foreground">{new Date(a.published_at).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
      <Link to="/announcements" className="mt-4 inline-block text-xs text-primary hover:underline">View all announcements →</Link>
    </Card>
  );
}

function UpcomingList({
  title,
  icon: Icon,
  classes,
  tournaments,
  emptyLabel,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  classes: { id: string; title: string; starts_at: string }[];
  tournaments: { id: string; name: string; starts_at: string }[];
  emptyLabel: string;
}) {
  const rows = [
    ...classes.map((c) => ({ kind: "Class" as const, id: c.id, label: c.title, starts_at: c.starts_at })),
    ...tournaments.map((t) => ({ kind: "Tournament" as const, id: t.id, label: t.name, starts_at: t.starts_at })),
  ].sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-primary/70" />
        <h3 className="font-display text-xl">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) =>
            r.kind === "Class" ? (
              <li key={`class-${r.id}`}>
                <Link to="/classes/$classId" params={{ classId: r.id }} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2 text-sm hover:bg-secondary/60">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary">{r.kind}</Badge>
                    {r.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatWhen(r.starts_at)}</span>
                </Link>
              </li>
            ) : (
              <li key={`tournament-${r.id}`}>
                <Link to="/tournaments/$tournamentId" params={{ tournamentId: r.id }} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2 text-sm hover:bg-secondary/60">
                  <span className="flex items-center gap-2">
                    <Badge variant="secondary">{r.kind}</Badge>
                    {r.label}
                  </span>
                  <span className="text-xs text-muted-foreground">{formatWhen(r.starts_at)}</span>
                </Link>
              </li>
            ),
          )}
        </ul>
      )}
    </Card>
  );
}

function SuperAdminView({ stats }: { stats?: RoleStats }) {
  const m = stats?.members;
  const s = stats?.organizations;
  const p = stats?.payments;
  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total members" value={m ? String(m.total) : "—"} hint={m ? `${m.active} active` : ""} icon={Users} />
        <StatCard label="Organizations" value={s ? String(s.total) : "—"} hint={s ? `${s.activeSubs} on active plans` : ""} icon={Building2} />
        <StatCard label="Revenue (all time)" value={p ? formatNaira(p.totalKobo) : "—"} hint={`${p?.successCount ?? 0} successful payments`} icon={CreditCard} />
        <StatCard label="Revenue (30d)" value={p ? formatNaira(p.last30Kobo) : "—"} hint="Last 30 days" icon={Sparkles} />
      </div>
       <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card className="p-6">
          <h3 className="font-display text-xl mb-1">Membership health</h3>
          <p className="text-sm text-muted-foreground mb-4">Account-state breakdown across all members.</p>
          <ul className="space-y-2 text-sm">
            <Row label="Active" value={m?.active ?? 0} tone="primary" />
            <Row label="Pending payment" value={m?.pendingPayment ?? 0} />
            <Row label="Expired" value={m?.expired ?? 0} tone="muted" />
          </ul>
        </Card>
        <Card className="p-6">
          <h3 className="font-display text-xl mb-1">Recent signups</h3>
          <p className="text-sm text-muted-foreground mb-4">The newest people on the platform.</p>
          {(stats?.recentSignups ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No signups yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats!.recentSignups!.map((su) => (
                <li key={su.id} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
                  <span>{su.full_name}</span>
                  <span className="text-xs text-muted-foreground">{new Date(su.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card className="p-6 mt-6">
        <h3 className="font-display text-xl mb-1">Operations</h3>
        <p className="text-sm text-muted-foreground mb-4">Open a workspace to manage the club.</p>
        <div className="flex gap-2 flex-wrap">
          <Link to="/members"><NavBadge>Member mgmt</NavBadge></Link>
          <Link to="/organizations"><NavBadge>Organization mgmt</NavBadge></Link>
          <Link to="/tutors"><NavBadge>Tutors</NavBadge></Link>
          <Link to="/classes"><NavBadge>Classes</NavBadge></Link>
          <Link to="/tournaments"><NavBadge>Tournaments</NavBadge></Link>
        </div>
      </Card>
    </>
  );
}

function OrgAdminView({
  stats,
  classes,
  tournaments,
}: {
  stats?: RoleStats;
  classes?: { id: string; title: string; starts_at: string; status: string; organization_id: string | null }[];
  tournaments?: { id: string; name: string; starts_at: string; status: string; organization_id: string | null }[];
}) {
  const org = stats?.myOrg;
  const pending = stats?.pendingRequests ?? [];
  const orgClasses = upcoming((classes ?? []).filter((c) => c.organization_id === org?.id), ["scheduled", "in_progress"], 3);
  const orgTournaments = upcoming((tournaments ?? []).filter((t) => t.organization_id === org?.id), ["registration_open", "in_progress"], 3);

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My organization" value={org?.name ?? "Not set up"} icon={Building2} />
        <StatCard label="Members" value={String(stats?.myOrgMembers ?? 0)} hint={org?.studentCount ? `Capacity: ${org.studentCount}` : ""} icon={Users} />
        <StatCard label="Active classes" value={String(stats?.myOrgClasses ?? 0)} hint="Scheduled or in progress" icon={BookOpen} />
        <StatCard label="Pending requests" value={String(pending.length)} hint="Waiting for your approval" icon={UserCheck} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound className="h-4 w-4 text-primary/70" />
            <h3 className="font-display text-xl">Join code</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Share this so members can add your organization to their account.</p>
          {org?.joinCode ? (
            <code className="rounded-md bg-secondary/40 px-4 py-2 text-lg font-mono tracking-widest inline-block">{org.joinCode}</code>
          ) : (
            <p className="text-sm text-muted-foreground">No code yet — generate one on the organization page.</p>
          )}
          <div className="mt-4">
            <Link to="/organization"><Button variant="secondary" size="sm">Manage join settings</Button></Link>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="h-4 w-4 text-primary/70" />
            <h3 className="font-display text-xl">Pending requests</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">People waiting to join your organization.</p>
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing pending.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {pending.slice(0, 3).map((p) => (
                <li key={p.id} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
                  <span>{p.full_name}</span>
                  <span className="text-xs text-muted-foreground">{new Date(p.joined_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Link to="/organization"><Button variant="secondary" size="sm">Review requests</Button></Link>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <UpcomingList
          title="Up next for your organization"
          icon={Trophy}
          classes={orgClasses}
          tournaments={orgTournaments}
          emptyLabel="Nothing scheduled yet."
        />
      </div>
    </>
  );
}

function TutorView({
  stats,
  classes,
  myId,
}: {
  stats?: RoleStats;
  classes?: { id: string; title: string; starts_at: string; status: string; tutor_id: string | null }[];
  myId?: string;
}) {
  const myClasses = (classes ?? []).filter((c) => c.tutor_id === myId);
  const todayClasses = upcoming(myClasses, ["scheduled", "in_progress"], 50).filter((c) => isToday(c.starts_at));
  const laterClasses = upcoming(myClasses, ["scheduled", "in_progress"], 50).filter((c) => !isToday(c.starts_at)).slice(0, 5);
  const needsAttendance = stats?.tutor?.needsAttendance ?? [];
  const myStudents = stats?.tutor?.myStudents ?? [];

  return (
    <>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Active classes" value={String(stats?.tutor?.classesThisWeek ?? 0)} icon={BookOpen} />
        <StatCard label="Students" value={String(stats?.tutor?.students ?? 0)} icon={GraduationCap} />
        <StatCard
          label="Needs attendance"
          value={String(needsAttendance.length)}
          hint={needsAttendance.length > 0 ? "Past classes awaiting attendance" : "All caught up"}
          icon={CheckCircle2}
        />
      </div>

      <Card className="p-6 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-primary/70" />
          <h3 className="font-display text-xl">Today's schedule</h3>
        </div>
        {todayClasses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing scheduled for today.</p>
        ) : (
          <ul className="space-y-2">
            {todayClasses.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2 text-sm">
                <span>{c.title}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{formatWhen(c.starts_at)}</span>
                  <Link to="/classes/$classId" params={{ classId: c.id }}>
                    <Button size="sm">Start class</Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {needsAttendance.length > 0 && (
        <Card className="p-6 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-4 w-4 text-primary/70" />
            <h3 className="font-display text-xl">Needs attendance</h3>
          </div>
          <ul className="space-y-2">
            {needsAttendance.map((c) => (
              <li key={c.id}>
                <Link to="/classes/$classId" params={{ classId: c.id }} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2 text-sm hover:bg-secondary/60">
                  <span>{c.title}</span>
                  <span className="text-xs text-muted-foreground">{formatWhen(c.starts_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-primary/70" />
            <h3 className="font-display text-xl">Coming up</h3>
          </div>
          {laterClasses.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing else scheduled. New classes you teach will show up here.</p>
          ) : (
            <ul className="space-y-2">
              {laterClasses.map((c) => (
                <li key={c.id}>
                  <Link to="/classes/$classId" params={{ classId: c.id }} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2 text-sm hover:bg-secondary/60">
                    <span>{c.title}</span>
                    <span className="text-xs text-muted-foreground">{formatWhen(c.starts_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-4 w-4 text-primary/70" />
            <h3 className="font-display text-xl">Your students</h3>
          </div>
          {myStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">Students you've taught will show up here.</p>
          ) : (
            <ul className="space-y-2">
              {myStudents.map((s) => (
                <li key={s.id} className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2 text-sm">
                  <span>{s.full_name}</span>
                  <span className="text-xs text-muted-foreground">Last session {new Date(s.last_session_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

function ParentView({
  children,
}: {
  children: { child_user_id: string; full_name: string; organization_name: string; account_state: string | null }[];
}) {
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Children" value={String(children.length)} hint={children.length === 1 ? "Linked to your account" : "Linked to your account"} icon={Baby} />
        <StatCard
          label="Active"
          value={String(children.filter((c) => c.account_state === "active").length)}
          hint="Membership in good standing"
          icon={CheckCircle2}
        />
        <StatCard
          label="Organizations"
          value={String(new Set(children.map((c) => c.organization_name)).size)}
          hint="Schools and clubs your children attend"
          icon={Building2}
        />
      </div>

      <div className="mt-6 space-y-4">
        {children.map((child) => (
          <ParentChildCard key={child.child_user_id} childUserId={child.child_user_id} name={child.full_name} orgName={child.organization_name} accountState={child.account_state} />
        ))}
      </div>

      <Card className="p-6 mt-6">
        <h3 className="font-display text-xl mb-2">Need the full picture?</h3>
        <p className="text-sm text-muted-foreground">
          Attendance history, every upcoming class and tournament, and per-child detail live on the Family page.
        </p>
        <div className="mt-4">
          <Link to="/family"><Button variant="secondary" size="sm">Go to Family</Button></Link>
        </div>
      </Card>
    </>
  );
}

function ParentChildCard({
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
    staleTime: 30_000,
  });

  const nextClass = overview?.upcoming_classes?.[0];
  const nextTournament = overview?.upcoming_tournaments?.[0];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-display text-xl">{name}</h3>
          <p className="text-sm text-muted-foreground">{orgName}</p>
        </div>
        {accountState && <Badge variant={accountState === "active" ? "default" : "secondary"}>{accountState}</Badge>}
      </div>

      {isLoading && <p className="mt-3 text-sm text-muted-foreground">Loading…</p>}

      {overview && (
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <div className="rounded-md bg-secondary/40 px-3 py-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Next class</p>
            <p className="text-sm mt-1">{nextClass ? `${nextClass.title} · ${formatWhen(nextClass.starts_at)}` : "Nothing scheduled"}</p>
          </div>
          <div className="rounded-md bg-secondary/40 px-3 py-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Next tournament</p>
            <p className="text-sm mt-1">{nextTournament ? `${nextTournament.name} · ${formatWhen(nextTournament.starts_at)}` : "None registered"}</p>
          </div>
          <div className="rounded-md bg-secondary/40 px-3 py-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Attendance</p>
            <p className="text-sm mt-1">{overview.classes_attended} / {overview.classes_total} classes</p>
          </div>
        </div>
      )}
    </Card>
  );
}

function MemberView({
  classes,
  tournaments,
}: {
  classes?: { id: string; title: string; starts_at: string; status: string }[];
  tournaments?: { id: string; name: string; starts_at: string; status: string }[];
}) {
  const fetchChess = useServerFn(getMyChessProfile);
  const { data: chess } = useQuery({ queryKey: ["my-chess-profile"], queryFn: () => fetchChess(), staleTime: 30_000 });
  const topRating = chess?.ratings?.[0];

  const myClasses = upcoming(classes, ["scheduled", "in_progress"], 3);
  const myTournaments = upcoming(tournaments, ["registration_open", "in_progress"], 3);

  return (
    <>
      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard
          label="Chess rating"
          value={topRating ? String(topRating.rating) : "Unrated"}
          hint={topRating ? `${topRating.variant} · ${topRating.time_control}` : "Play a rated game to get started"}
          icon={Trophy}
        />
        <StatCard label="Games played" value={String(chess?.games?.length ?? 0)} hint="Most recent 25" icon={Sparkles} />
      </div>

      <div className="mt-6">
        <UpcomingList
          title="Up next"
          icon={BookOpen}
          classes={myClasses}
          tournaments={myTournaments}
          emptyLabel="No upcoming classes or tournaments yet — browse what's on."
        />
      </div>

      <Card className="p-6 mt-6">
        <h3 className="font-display text-xl mb-2">Welcome to the club</h3>
        <p className="text-sm text-muted-foreground">Classes, tournaments, casual play, and puzzles roll out in the next phases. Your membership keeps everything in one place.</p>
        <div className="mt-4 flex gap-2">
          <Link to="/classes"><Button variant="secondary" size="sm">Browse classes</Button></Link>
          <Link to="/tournaments"><Button variant="secondary" size="sm">Upcoming tournaments</Button></Link>
        </div>
      </Card>
    </>
  );
}

function Row({ label, value, tone }: { label: string; value: number; tone?: "primary" | "muted" }) {
  return (
    <li className="flex items-center justify-between rounded-md bg-secondary/40 px-3 py-2">
      <span className={tone === "muted" ? "text-muted-foreground" : ""}>{label}</span>
      <span className={`font-display text-lg ${tone === "primary" ? "text-primary" : ""}`}>{value}</span>
    </li>
  );
}

function NavBadge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs hover:bg-secondary/60 transition-colors">{children}</span>;
}
