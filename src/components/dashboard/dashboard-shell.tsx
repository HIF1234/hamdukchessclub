import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAuth, type AppRole } from "@/lib/auth/auth-context";
import { UpgradeNudge } from "@/components/dashboard/upgrade-nudge";
import {
  LayoutDashboard,
  Users,
  School,
  GraduationCap,
  Trophy,
  CreditCard,
  Bell,
  Settings,
  ShieldCheck,
  BarChart3,
  MessageSquare,
  BookOpen,
  Medal,
  Calendar as CalendarIcon,
  Swords,
  Plug,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  roles?: AppRole[]; // visible to these roles; undefined = all
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/classes", label: "Classes", icon: BookOpen },
  { to: "/tournaments", label: "Tournaments", icon: Trophy },
  { to: "/chess", label: "My chess", icon: Swords },
  { to: "/leaderboard", label: "Leaderboard", icon: Medal },
  { to: "/calendar", label: "Calendar", icon: CalendarIcon },
  { to: "/members", label: "Members", icon: Users, roles: ["super_admin", "school_admin"] },
  { to: "/schools", label: "Schools", icon: School, roles: ["super_admin"] },
  { to: "/tutors", label: "Tutors", icon: GraduationCap, roles: ["super_admin", "school_admin"] },
  { to: "/analytics", label: "Analytics", icon: BarChart3, roles: ["super_admin", "school_admin"] },
  { to: "/audit", label: "Audit log", icon: ShieldCheck, roles: ["super_admin"] },
  { to: "/integrations", label: "Integrations", icon: Plug, roles: ["super_admin"] },
  { to: "/announcements", label: "Announcements", icon: MessageSquare },
  { to: "/messages", label: "Messages", icon: MessageSquare },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const { profile, roles, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV.filter((i) => !i.roles || i.roles.some((r) => roles.includes(r)));
  const primaryRole = roles[0] ?? "member";

  return (
    <div className="min-h-screen bg-background relative">
      <div className="pointer-events-none fixed inset-0 opacity-60" style={{ background: "var(--gradient-hero)" }} aria-hidden />

      {/* Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-64 flex-col border-r border-border/50 bg-sidebar/80 backdrop-blur z-20">
        <div className="h-16 flex items-center px-6 border-b border-border/50">
          <Logo />
        </div>
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {items.map((item) => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-primary/15 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/50 p-4">
          <div className="text-sm font-medium truncate">{profile?.full_name}</div>
          <div className="text-xs text-muted-foreground capitalize">{primaryRole.replace("_", " ")}</div>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start"
            onClick={async () => {
              await signOut();
              void navigate({ to: "/login" });
            }}
          >
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-20 border-b border-border/50 backdrop-blur bg-background/80">
        <div className="flex items-center justify-between px-4 h-14">
          <Logo />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setMobileOpen((v) => !v)} aria-expanded={mobileOpen}>Menu</Button>
            <Button variant="ghost" size="sm" onClick={async () => { await signOut(); void navigate({ to: "/login" }); }}>Sign out</Button>
          </div>
        </div>
        {mobileOpen && <nav className="border-t border-border/50 px-3 py-3 space-y-1">{items.map((item) => { const Icon = item.icon; return <Link key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"><Icon className="h-4 w-4" />{item.label}</Link>; })}</nav>}
      </header>

      <main className="lg:pl-64 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">{children}</div>
      </main>
      <UpgradeNudge />
    </div>
  );
}