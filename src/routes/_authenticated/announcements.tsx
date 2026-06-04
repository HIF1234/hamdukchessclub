import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  listAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} from "@/lib/announcements/announcements.functions";
import { useAuth } from "@/lib/auth/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Megaphone, Pin, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/announcements")({
  head: () => ({ meta: [{ title: "Announcements — Hamduk Chess Club" }] }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  const { roles, userId } = useAuth();
  const canPost = roles.includes("super_admin") || roles.includes("school_admin");
  const isSuper = roles.includes("super_admin");
  const fetchList = useServerFn(listAnnouncements);
  const del = useServerFn(deleteAnnouncement);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: () => fetchList(),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Announcement removed");
      qc.invalidateQueries({ queryKey: ["announcements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Announcements</p>
          <h1 className="mt-2 font-display text-4xl">Club bulletin</h1>
          <p className="mt-2 text-muted-foreground">News, reminders and important updates.</p>
        </div>
        {canPost && <NewAnnouncementDialog isSuper={isSuper} />}
      </div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      <div className="space-y-4">
        {data?.map((a) => {
          const mine = a.created_by === userId;
          return (
            <Card key={a.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {a.pinned ? (
                    <Pin className="h-4 w-4 text-primary" />
                  ) : (
                    <Megaphone className="h-4 w-4 text-primary/70" />
                  )}
                  <h2 className="font-display text-xl">{a.title}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {a.audience.replace("_", " ")}
                  </Badge>
                  {(isSuper || mine) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteMut.mutate(a.id)}
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap text-foreground/90">{a.body}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {new Date(a.published_at).toLocaleString()}
              </p>
            </Card>
          );
        })}
        {data && data.length === 0 && (
          <p className="text-muted-foreground">No announcements yet.</p>
        )}
      </div>
    </DashboardShell>
  );
}

function NewAnnouncementDialog({ isSuper }: { isSuper: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<
    "all" | "school" | "members" | "tutors" | "school_admins"
  >(isSuper ? "all" : "school");
  const [pinned, setPinned] = useState(false);
  const create = useServerFn(createAnnouncement);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () =>
      create({
        data: {
          title,
          body,
          audience,
          pinned,
        },
      }),
    onSuccess: () => {
      toast.success("Announcement posted");
      qc.invalidateQueries({ queryKey: ["announcements"] });
      setOpen(false);
      setTitle("");
      setBody("");
      setPinned(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" /> New announcement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New announcement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="body">Message</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
            />
          </div>
          {isSuper && (
            <div>
              <Label>Audience</Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="members">Members</SelectItem>
                  <SelectItem value="tutors">Tutors</SelectItem>
                  <SelectItem value="school_admins">School admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Checkbox
              id="pinned"
              checked={pinned}
              onCheckedChange={(v) => setPinned(Boolean(v))}
            />
            <Label htmlFor="pinned">Pin to top</Label>
          </div>
          <Button
            className="w-full"
            disabled={!title || !body || mut.isPending}
            onClick={() => mut.mutate()}
          >
            {mut.isPending ? "Posting…" : "Post announcement"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}