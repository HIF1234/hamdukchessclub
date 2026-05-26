import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/auth-context";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Hamduk Chess Club" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const roleLabel = roles[0] ? roles[0].replace("_", " ") : "member";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur sticky top-0 z-10 bg-background/80">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{profile?.full_name}</div>
              <div className="text-xs text-muted-foreground capitalize">{roleLabel}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); void navigate({ to: "/login" }); }}>Sign out</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-widest text-primary">Welcome back</p>
          <h1 className="mt-2 font-display text-5xl">Hello, <em className="text-primary not-italic">{profile?.full_name?.split(" ")[0] ?? "player"}</em>.</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">Your dashboard is ready. The full feature set — classes, tournaments, live classroom, leaderboard, and chess play — rolls in over the coming phases.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <StatCard label="Chess rating" value={String(profile?.chess_rating ?? "—")} hint="Updated after each game" />
          <StatCard label="Level" value={profile?.membership_level ?? "—"} hint="Beginner · Intermediate · Advanced" />
          <StatCard label="Account" value="Active" hint="All features unlocked" />
        </div>

        <Card className="mt-10 p-8 border-dashed">
          <h2 className="font-display text-2xl mb-2">Phase 1 shipped ✓</h2>
          <p className="text-sm text-muted-foreground">
            Auth (signup, login, Google, password reset, email verify), RBAC schema, profile + roles + schools + audit log,
            locked-dashboard state, and design system are live. Next up: onboarding wizard and Paystack integration.
          </p>
        </Card>
      </main>
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Card className="p-6">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-4xl capitalize">{value}</div>
      <div className="mt-3 text-xs text-muted-foreground">{hint}</div>
    </Card>
  );
}