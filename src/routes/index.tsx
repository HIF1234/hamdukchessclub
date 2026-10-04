import { createFileRoute, Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { BookOpen, Trophy, Users, Medal } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Hamduk Chess Club" }] }),
  component: LandingPage,
});

function LandingPage() {
  const { loading, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "var(--gradient-hero)" }} aria-hidden="true" />
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />

      <header className="relative flex items-center justify-between px-6 py-6 sm:px-10">
        <Logo />
        <nav className="flex items-center gap-2">
          {!loading && isAuthenticated ? (
            <Link to="/dashboard">
              <Button>Go to dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link to="/signup">
                <Button>Create account</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="relative px-6 sm:px-10">
        <div className="max-w-3xl mx-auto text-center py-16 sm:py-24">
          <h1 className="font-display text-5xl sm:text-7xl leading-[1.05] text-foreground">
            Where minds<br />
            <em className="text-primary not-italic">meet the board.</em>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
            The members-only home of Hamduk Chess Club — classes, tournaments, ratings, and your community of players, all in one place.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3 flex-wrap">
            {!loading && isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="lg">Go to dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/signup">
                  <Button size="lg">Create your account</Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline">Sign in</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-20">
          <FeatureCard icon={BookOpen} title="Classes" body="Structured lessons with real tutors, scheduled around your week." />
          <FeatureCard icon={Trophy} title="Tournaments" body="Swiss-paired club and school tournaments, online and over the board." />
          <FeatureCard icon={Medal} title="Ratings" body="A real rating that follows you across every game you play." />
          <FeatureCard icon={Users} title="Community" body="One club, every school — all under a single Hamduk Chess account." />
        </div>
      </main>

      <footer className="relative px-6 sm:px-10 py-8 text-center text-xs text-muted-foreground/60 uppercase tracking-widest">
        © Hamduk Chess Club
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/60 p-6 text-left">
      <Icon className="h-5 w-5 text-primary" />
      <h3 className="mt-3 font-display text-lg">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
