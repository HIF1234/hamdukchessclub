import { createFileRoute, Outlet, redirect, useNavigate, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth/auth-context";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { loading, isAuthenticated, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }
  if (!isAuthenticated) {
    throw redirect({ to: "/login" });
  }

  // Allowed routes inside the locked-account zone
  const allowedWhileLocked = ["/onboarding", "/billing"];
  const isAllowed = allowedWhileLocked.some((p) => location.pathname.startsWith(p));

  const state = profile?.account_state;
  const needsOnboarding = profile && !profile.onboarding_completed;

  if (state && state !== "active" && !isAllowed) {
    // Route members to wizard first, then billing
    if (state === "pending_payment") {
      throw redirect({ to: needsOnboarding ? "/onboarding" : "/billing" });
    }
    return (
      <LockedState
        state={state}
        onSignOut={async () => { await signOut(); void navigate({ to: "/login" }); }}
        onCta={() => {
          if (state === "expired") void navigate({ to: "/billing" });
        }}
      />
    );
  }

  return <Outlet />;
}

function LockedState({ state, onSignOut, onCta }: { state: string; onSignOut: () => void; onCta: () => void }) {
  const copy: Record<string, { title: string; body: string; cta: string }> = {
    unverified: { title: "Verify your email", body: "Click the link we sent to your inbox to activate your account.", cta: "Resend verification" },
    pending_payment: { title: "Complete your membership", body: "Choose a plan and complete payment to unlock your dashboard.", cta: "Choose a plan" },
    expired: { title: "Your membership has expired", body: "Renew now to regain full access to classes, tournaments, and play.", cta: "Renew membership" },
    suspended: { title: "Your account is suspended", body: "Contact a club admin to discuss reactivation.", cta: "Contact admin" },
  };
  const c = copy[state] ?? copy.pending_payment;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0" style={{ background: "var(--gradient-hero)" }} aria-hidden="true" />
      <div className="relative max-w-md text-center">
        <Logo className="justify-center" />
        <h1 className="mt-10 font-display text-4xl text-foreground">{c.title}</h1>
        <p className="mt-4 text-muted-foreground">{c.body}</p>
        <div className="mt-8 flex flex-col gap-2">
          <Button size="lg" className="w-full" onClick={onCta} disabled={state === "unverified" || state === "suspended"}>{c.cta}</Button>
          <Button variant="ghost" onClick={onSignOut}>Sign out</Button>
        </div>
      </div>
    </div>
  );
}