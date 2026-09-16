import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getDashboardStats, type RoleStats } from "@/lib/dashboard/dashboard.functions";
import { Trophy, Users, School, CreditCard, GraduationCap, BookOpen, Sparkles } from "lucide-react";
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

  const primaryRole = roles.includes("super_admin")
    ? "super_admin"
    : roles.includes("school_admin")
    ? "school_admin"
    : roles.includes("tutor")
    ? "tutor"
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
      {primaryRole === "school_admin" && <SchoolAdminView stats={stats} />}
      {primaryRole === "tutor" && <TutorView />}
      {primaryRole === "member" && <MemberView />}
    </DashboardShell>
  );
}

function hour() {
  return new Date().getHours();
}

function tagline(role: string) {
  switch (role) {
    case "super_admin":
      return "Club-wide overview — members, schools, payments, and operations at a glance.";
    case "school_admin":
      return "Your school's home base — manage students, classes, and your subscription.";
    case "tutor":
      return "Your teaching dashboard — upcoming classes, students, and resources.";
    default:
      return "Classes, tournaments, ratings, and your community of players — all in one place.";
  }
}

function formatNaira(kobo: number) {
  return "₦" + (kobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 0 });
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

function SuperAdminView({ stats }: { stats?: RoleStats }) {
  const m = stats?.members;
  const s = stats?.schools;
  const p = stats?.payments;
  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total members" value={m ? String(m.total) : "—"} hint={m ? `${m.active} active` : ""} icon={Users} />
        <StatCard label="Schools" value={s ? String(s.total) : "—"} hint={s ? `${s.activeSubs} on active plans` : ""} icon={School} />
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
           <h3 className="font-display text-xl mb-1">Operations</h3>
           <p className="text-sm text-muted-foreground mb-4">Open a workspace to manage the club.</p>
          <div className="flex gap-2 flex-wrap">
             <Link to="/members"><Badge>Member mgmt</Badge></Link>
             <Link to="/schools"><Badge>School mgmt</Badge></Link>
             <Link to="/tutors"><Badge>Tutors</Badge></Link>
             <Link to="/classes"><Badge>Classes</Badge></Link>
             <Link to="/tournaments"><Badge>Tournaments</Badge></Link>
          </div>
        </Card>
      </div>
    </>
  );
}

function SchoolAdminView({ stats }: { stats?: RoleStats }) {
  const school = stats?.mySchool;
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="My school" value={school?.name ?? "Not set up"} icon={School} />
        <StatCard label="Students enrolled" value={String(stats?.mySchoolMembers ?? 0)} hint={school?.studentCount ? `Capacity: ${school.studentCount}` : ""} icon={Users} />
         <StatCard label="Active classes" value={String(stats?.mySchoolClasses ?? 0)} hint="Scheduled or in progress" icon={BookOpen} />
      </div>
       <Card className="p-6 mt-6">
        <h3 className="font-display text-xl mb-1">Your school workspace</h3>
         <p className="text-sm text-muted-foreground">Enrol students, schedule classes, and track progress from your school workspace.</p>
      </Card>
    </>
  );
}

function TutorView({ stats }: { stats?: RoleStats }) {
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-4">
         <StatCard label="Active classes" value={String(stats?.tutor?.classesThisWeek ?? 0)} icon={BookOpen} />
         <StatCard label="Students" value={String(stats?.tutor?.students ?? 0)} icon={GraduationCap} />
         <StatCard label="Teaching tools" value="Ready" hint="Attendance and notes" icon={Sparkles} />
      </div>
      <Card className="p-6 mt-6">
        <h3 className="font-display text-xl mb-1">Tutor workspace</h3>
         <p className="text-sm text-muted-foreground">Your class schedule, attendance, and session notes are available from Classes.</p>
      </Card>
    </>
  );
}

function MemberView() {
  const { profile } = useAuth();
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard label="Chess rating" value={String(profile?.chess_rating ?? "—")} hint="Updated after each game" icon={Trophy} />
        <StatCard label="Level" value={profile?.membership_level ?? "—"} hint="Beginner · Intermediate · Advanced" icon={Sparkles} />
        <StatCard label="Membership" value="Active" hint="All features unlocked" icon={CreditCard} />
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

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-border/60 bg-secondary/40 px-3 py-1 text-xs">{children}</span>;
}