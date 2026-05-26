import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2.5 group ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full group-hover:bg-primary/60 transition-colors" />
        <svg viewBox="0 0 32 32" className="relative h-8 w-8 text-primary" fill="currentColor" aria-hidden="true">
          <path d="M16 2 L20 8 L18 10 L22 14 L20 16 L23 22 L9 22 L12 16 L10 14 L14 10 L12 8 Z M8 24 L24 24 L25 28 L7 28 Z" />
        </svg>
      </div>
      <div className="leading-none">
        <div className="font-display text-xl tracking-tight">Hamduk</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Chess Club</div>
      </div>
    </Link>
  );
}