import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/notifications/notifications.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Hamduk Chess Club" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const fetchList = useServerFn(listNotifications);
  const markRead = useServerFn(markNotificationRead);
  const markAll = useServerFn(markAllNotificationsRead);
  const del = useServerFn(deleteNotification);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchList(),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["notifications"] });
  const readMut = useMutation({
    mutationFn: (id: string) => markRead({ data: { id } }),
    onSuccess: refresh,
  });
  const allMut = useMutation({
    mutationFn: () => markAll(),
    onSuccess: () => { toast.success("All marked read"); refresh(); },
  });
  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: refresh,
  });

  return (
    <DashboardShell>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Notifications</p>
          <h1 className="mt-2 font-display text-4xl">Inbox</h1>
          <p className="mt-2 text-muted-foreground">
            {data ? `${data.unread} unread` : "Loading…"}
          </p>
        </div>
        {data && data.unread > 0 && (
          <Button variant="outline" onClick={() => allMut.mutate()}>
            <Check className="h-4 w-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      <div className="space-y-3">
        {data?.items.map((n) => (
          <Card
            key={n.id}
            className={`p-4 flex items-start gap-3 ${
              !n.read_at ? "border-primary/40 bg-primary/5" : ""
            }`}
          >
            <Bell className="h-5 w-5 text-primary/70 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium">{n.title}</h3>
                <span className="text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString()}
                </span>
              </div>
              {n.body && (
                <p className="text-sm text-muted-foreground mt-1">{n.body}</p>
              )}
              {n.link && (
                <a
                  href={n.link}
                  className="text-sm text-primary hover:underline mt-1 inline-block"
                >
                  Open →
                </a>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {!n.read_at && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => readMut.mutate(n.id)}
                  aria-label="Mark read"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => delMut.mutate(n.id)}
                aria-label="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
        {data && data.items.length === 0 && (
          <p className="text-muted-foreground">You're all caught up.</p>
        )}
      </div>
    </DashboardShell>
  );
}