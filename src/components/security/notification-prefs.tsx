import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/account/account.functions";

const EVENTS: { key: keyof NotificationPrefs["email"]; label: string }[] = [
  { key: "class_reminders", label: "Class reminders" },
  { key: "tournament_alerts", label: "Tournament alerts" },
  { key: "payment_due", label: "Payment due" },
  { key: "results", label: "Results" },
  { key: "announcements", label: "Announcements" },
  { key: "messages", label: "Messages" },
];

const CHANNELS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: "in_app", label: "In-app" },
  { key: "email", label: "Email" },
  { key: "sms", label: "SMS" },
];

const FALLBACK: NotificationPrefs = {
  email: { class_reminders: true, tournament_alerts: true, payment_due: true, results: true, announcements: true, messages: true },
  in_app: { class_reminders: true, tournament_alerts: true, payment_due: true, results: true, announcements: true, messages: true },
  sms: { class_reminders: false, tournament_alerts: false, payment_due: false, results: false, announcements: false, messages: false },
};

export function NotificationPrefsPanel() {
  const load = useServerFn(getNotificationPrefs);
  const save = useServerFn(updateNotificationPrefs);
  const { data } = useQuery({ queryKey: ["notification-prefs"], queryFn: () => load() });
  const [prefs, setPrefs] = useState<NotificationPrefs>(FALLBACK);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setPrefs({ ...FALLBACK, ...data });
  }, [data]);

  const toggle = (channel: keyof NotificationPrefs, event: keyof NotificationPrefs["email"]) =>
    setPrefs((p) => ({ ...p, [channel]: { ...p[channel], [event]: !p[channel][event] } }));

  async function onSave() {
    try {
      setSaving(true);
      await save({ data: prefs });
      toast.success("Notification preferences saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wider text-muted-foreground">
              <th className="text-left font-normal pb-2">Event</th>
              {CHANNELS.map((c) => (
                <th key={c.key} className="pb-2 font-normal px-3">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((ev) => (
              <tr key={ev.key} className="border-t border-border/60">
                <td className="py-2.5 pr-3">{ev.label}</td>
                {CHANNELS.map((c) => (
                  <td key={c.key} className="py-2.5 px-3 text-center">
                    <Switch
                      checked={prefs[c.key][ev.key]}
                      onCheckedChange={() => toggle(c.key, ev.key)}
                      aria-label={`${ev.label} via ${c.label}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        SMS delivery activates once the club's SMS provider is connected.
      </p>
      <Button size="sm" onClick={onSave} disabled={saving}>{saving ? "Saving…" : "Save preferences"}</Button>
    </div>
  );
}
