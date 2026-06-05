import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getMyCalendar, type CalendarEvent } from "@/lib/calendar/calendar.functions";
import { buildIcs } from "@/lib/calendar/ics";
import { Calendar as CalendarIcon, Download, Trophy, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — Hamduk Chess Club" }] }),
  component: CalendarPage,
});

function formatWhen(starts: string, ends: string | null) {
  const s = new Date(starts);
  const fmtDate = s.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const fmtTime = s.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const end = ends ? new Date(ends).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : null;
  return `${fmtDate} · ${fmtTime}${end ? ` – ${end}` : ""}`;
}

function groupByDay(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    const key = new Date(ev.starts_at).toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ev);
  }
  return Array.from(map.entries());
}

function CalendarPage() {
  const fetchCalendar = useServerFn(getMyCalendar);
  const { data, isLoading } = useQuery({
    queryKey: ["my-calendar"],
    queryFn: () => fetchCalendar(),
    staleTime: 60_000,
  });

  const events = data?.events ?? [];
  const upcoming = events.filter((e) => new Date(e.starts_at) >= new Date(Date.now() - 24 * 3600 * 1000));
  const grouped = groupByDay(upcoming);

  function downloadIcs() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const ics = buildIcs(events, origin);
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `hamduk-calendar-${new Date().toISOString().slice(0, 10)}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Schedule</p>
          <h1 className="mt-2 font-display text-4xl">Calendar</h1>
          <p className="text-sm text-muted-foreground mt-2">Your classes and tournaments in one place. Subscribe in Google, Apple or Outlook by importing the .ics file.</p>
        </div>
        <Button onClick={downloadIcs} disabled={!events.length}>
          <Download className="size-4 mr-2" />
          Export .ics
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Loading…</Card>
      ) : grouped.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarIcon className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-4 font-display text-xl">Nothing on the calendar</h3>
          <p className="text-sm text-muted-foreground mt-1">Enrol in a class or register for a tournament and it'll show up here.</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
                {new Date(day).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
              </h2>
              <div className="space-y-3">
                {items.map((ev) => (
                  <Card key={`${ev.kind}-${ev.id}`} className="p-4 flex items-start gap-4 hover:border-primary/40 transition-colors">
                    <div className={`rounded-md p-2 ${ev.kind === "class" ? "bg-primary/15 text-primary" : "bg-secondary/40 text-foreground"}`}>
                      {ev.kind === "class" ? <BookOpen className="size-4" /> : <Trophy className="size-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link to={ev.url} className="font-medium hover:text-primary truncate">{ev.title}</Link>
                        <Badge variant="outline" className="capitalize">{ev.kind}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{formatWhen(ev.starts_at, ev.ends_at)}</p>
                      {ev.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ev.description}</p>}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}