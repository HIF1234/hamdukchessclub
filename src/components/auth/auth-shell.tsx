import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="min-h-screen flex items-stretch bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: "var(--gradient-hero)" }}
        aria-hidden="true"
      />
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />

      {/* Left brand panel */}
      <aside className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative border-r border-border/50">
        <Logo />
        <div className="relative">
          <h1 className="font-display text-6xl leading-[1.05] text-foreground">
            Where minds<br />
            <em className="text-primary not-italic">meet the board.</em>
          </h1>
          <p className="mt-6 text-muted-foreground max-w-md">
            The members-only home of Hamduk Chess Club — classes, tournaments, ratings, and your community of players, all in one place.
          </p>
        </div>
        <div className="text-xs text-muted-foreground/60 uppercase tracking-widest">© Hamduk Chess Club</div>
      </aside>

      {/* Right form panel */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex justify-center"><Logo /></div>
          <div className="mb-8">
            <h2 className="font-display text-3xl text-foreground">{title}</h2>
            {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}