import type { CalendarEvent } from "./calendar.functions";

function icsDate(d: string | null | undefined): string {
  if (!d) return "";
  return new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function icsEscape(s: string | null | undefined): string {
  return (s ?? "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildIcs(events: CalendarEvent[], originUrl: string): string {
  const now = icsDate(new Date().toISOString());
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hamduk Chess Club//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Hamduk Chess Club",
  ];
  for (const ev of events) {
    const dtstart = icsDate(ev.starts_at);
    const dtend = icsDate(ev.ends_at || ev.starts_at);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.kind}-${ev.id}@hamduk`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${icsEscape(`[${ev.kind === "class" ? "Class" : "Tournament"}] ${ev.title}`)}`,
      `DESCRIPTION:${icsEscape(ev.description ?? "")}`,
      `URL:${originUrl}${ev.url}`,
      ...(ev.location ? [`LOCATION:${icsEscape(ev.location)}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}