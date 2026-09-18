import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  getClassDetail, updateClassNotes, updateMeetingUrl,
  addClassResource, removeClassResource, setAttendance,
} from "@/lib/classes/classes.functions";
import { enrollInClass, unenrollFromClass } from "@/lib/admin/management.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ExternalLink, Trash2, Video, BookOpen, Users, FileText, Puzzle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/classes/$classId")({
  head: () => ({ meta: [{ title: "Class — Hamduk Chess Club" }] }),
  component: ClassDetailPage,
});

function ClassDetailPage() {
  const { classId } = useParams({ from: "/_authenticated/classes/$classId" });
  const fetchDetail = useServerFn(getClassDetail);
  const enroll = useServerFn(enrollInClass);
  const unenroll = useServerFn(unenrollFromClass);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => fetchDetail({ data: { class_id: classId } }),
  });

  const enrollMut = useMutation({
    mutationFn: () => enroll({ data: { class_id: classId } }),
    onSuccess: () => { toast.success("Enrolled"); qc.invalidateQueries({ queryKey: ["class", classId] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const unenrollMut = useMutation({
    mutationFn: () => unenroll({ data: { class_id: classId } }),
    onSuccess: () => { toast.success("You left the class"); qc.invalidateQueries({ queryKey: ["class", classId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <Link to="/classes" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4 mr-1" /> All classes
      </Link>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      {data && (
        <>
          <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary">Class</p>
              <h1 className="mt-2 font-display text-4xl">{data.class.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="capitalize">{data.class.level.replace("_", " ")}</Badge>
                <Badge variant="outline" className="capitalize">{data.class.status.replace("_", " ")}</Badge>
                <span className="text-sm text-muted-foreground">{new Date(data.class.starts_at).toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">· {data.enrolled_count} enrolled</span>
              </div>
            </div>
            {!data.enrolled_me && !data.can_manage && (
              <Button onClick={() => enrollMut.mutate()} disabled={enrollMut.isPending}>Enrol</Button>
            )}
             {data.enrolled_me && <Button variant="outline" onClick={() => unenrollMut.mutate()} disabled={unenrollMut.isPending}>{unenrollMut.isPending ? "Leaving…" : "Leave class"}</Button>}
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-4 flex-wrap h-auto">
              <TabsTrigger value="overview"><BookOpen className="h-4 w-4 mr-1" />Overview</TabsTrigger>
              <TabsTrigger value="live"><Puzzle className="h-4 w-4 mr-1" />Live classroom</TabsTrigger>
              <TabsTrigger value="resources"><FileText className="h-4 w-4 mr-1" />Resources</TabsTrigger>
              {data.can_manage && <TabsTrigger value="attendance"><Users className="h-4 w-4 mr-1" />Attendance</TabsTrigger>}
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="p-6 space-y-3">
                <h2 className="font-display text-2xl">About this class</h2>
                <p className="text-muted-foreground">{data.class.description || "No description provided."}</p>
                {data.class.ends_at && (
                  <p className="text-sm text-muted-foreground">Ends: {new Date(data.class.ends_at).toLocaleString()}</p>
                )}
                <p className="text-sm text-muted-foreground">Capacity: {data.class.capacity ?? "—"}</p>
              </Card>
            </TabsContent>

            <TabsContent value="live">
              <LiveClassroom
                classId={classId}
                meetingUrl={data.class.meeting_url}
                canManage={data.can_manage}
                canJoin={data.enrolled_me || data.can_manage}
              />
            </TabsContent>

            <TabsContent value="resources">
              <ResourcesPanel
                classId={classId}
                canManage={data.can_manage}
                resources={Array.isArray(data.class.resources) ? (data.class.resources as any[]) : []}
              />
            </TabsContent>

            {data.can_manage && (
              <TabsContent value="attendance">
                <AttendancePanel
                  classId={classId}
                  participants={data.participants}
                  takenAt={data.class.attendance_taken_at}
                />
              </TabsContent>
            )}

            <TabsContent value="notes">
              <NotesPanel
                classId={classId}
                canManage={data.can_manage}
                initial={data.class.session_notes ?? ""}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </DashboardShell>
  );
}

function LiveClassroom({ classId, meetingUrl, canManage, canJoin }: {
  classId: string; meetingUrl: string | null; canManage: boolean; canJoin: boolean;
}) {
  const update = useServerFn(updateMeetingUrl);
  const qc = useQueryClient();
  const [url, setUrl] = useState(meetingUrl ?? "");
  const mut = useMutation({
    mutationFn: () => update({ data: { class_id: classId, meeting_url: url } }),
    onSuccess: () => { toast.success("Meeting link saved"); qc.invalidateQueries({ queryKey: ["class", classId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-6 space-y-5">
      <div>
        <h2 className="font-display text-2xl flex items-center gap-2"><Video className="h-5 w-5 text-primary" /> Live classroom</h2>
        <p className="text-sm text-muted-foreground mt-1">
          This is the plug-in point for the chess board / video provider. Paste an external meeting link (Zoom, Meet, Lichess study) or wire a board API here.
        </p>
      </div>

      {canJoin ? (
        <div className="rounded-lg border border-border/60 bg-card/50 aspect-video flex items-center justify-center text-center p-6">
          {meetingUrl ? (
            <a href={meetingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline">
              <ExternalLink className="h-4 w-4" /> Open meeting in new tab
            </a>
          ) : (
            <div className="text-muted-foreground text-sm">
              <Puzzle className="h-10 w-10 mx-auto mb-3 text-primary/60" />
              Board API plug-in point. No meeting URL configured yet.
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Enrol in this class to join the live session.</p>
      )}

      {canManage && (
        <form
          onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
          className="space-y-3 pt-3 border-t border-border/40"
        >
          <Label htmlFor="meeting-url">Meeting URL</Label>
          <Input id="meeting-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://meet.google.com/…" />
          <Button type="submit" size="sm" disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Save link"}</Button>
        </form>
      )}
    </Card>
  );
}

function ResourcesPanel({ classId, canManage, resources }: {
  classId: string; canManage: boolean; resources: any[];
}) {
  const addFn = useServerFn(addClassResource);
  const rmFn = useServerFn(removeClassResource);
  const qc = useQueryClient();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const add = useMutation({
    mutationFn: () => addFn({ data: { class_id: classId, label, url } }),
    onSuccess: () => { toast.success("Resource added"); setLabel(""); setUrl(""); qc.invalidateQueries({ queryKey: ["class", classId] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const rm = useMutation({
    mutationFn: (index: number) => rmFn({ data: { class_id: classId, index } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["class", classId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-6 space-y-5">
      <h2 className="font-display text-2xl">Resources</h2>
      {resources.length === 0 && <p className="text-sm text-muted-foreground">No resources shared yet.</p>}
      <ul className="space-y-2">
        {resources.map((r, i) => (
          <li key={i} className="flex items-center justify-between gap-2 p-3 rounded-md border border-border/50">
            <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline truncate">
              <ExternalLink className="h-4 w-4" /> {r.label}
            </a>
            {canManage && (
              <Button size="sm" variant="ghost" onClick={() => rm.mutate(i)}><Trash2 className="h-4 w-4" /></Button>
            )}
          </li>
        ))}
      </ul>
      {canManage && (
        <form onSubmit={(e) => { e.preventDefault(); add.mutate(); }} className="space-y-3 pt-3 border-t border-border/40">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-2"><Label htmlFor="r-label">Label</Label><Input id="r-label" required value={label} onChange={(e) => setLabel(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="r-url">URL</Label><Input id="r-url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} /></div>
          </div>
          <Button type="submit" size="sm" disabled={add.isPending}>{add.isPending ? "Adding…" : "Add resource"}</Button>
        </form>
      )}
    </Card>
  );
}

function AttendancePanel({ classId, participants, takenAt }: {
  classId: string; participants: Array<{ id: string; full_name: string; email: string; attended: boolean; enrollment_id: string }>; takenAt: string | null;
}) {
  const saveFn = useServerFn(setAttendance);
  const qc = useQueryClient();
  const [state, setState] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const s: Record<string, boolean> = {};
    for (const p of participants) s[p.enrollment_id] = p.attended;
    setState(s);
  }, [participants]);

  const mut = useMutation({
    mutationFn: () => saveFn({ data: {
      class_id: classId,
      entries: Object.entries(state).map(([enrollment_id, attended]) => ({ enrollment_id, attended })),
    } }),
    onSuccess: () => { toast.success("Attendance saved"); qc.invalidateQueries({ queryKey: ["class", classId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Attendance</h2>
          {takenAt && <p className="text-xs text-muted-foreground mt-1">Last saved {new Date(takenAt).toLocaleString()}</p>}
        </div>
        <Button size="sm" onClick={() => mut.mutate()} disabled={mut.isPending || participants.length === 0}>
          {mut.isPending ? "Saving…" : "Save attendance"}
        </Button>
      </div>
      {participants.length === 0 ? (
        <p className="text-sm text-muted-foreground">No enrolled participants yet.</p>
      ) : (
        <ul className="divide-y divide-border/40">
          {participants.map((p) => (
            <li key={p.enrollment_id} className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{p.full_name}</div>
                <div className="text-xs text-muted-foreground">{p.email}</div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={!!state[p.enrollment_id]}
                  onCheckedChange={(v) => setState((s) => ({ ...s, [p.enrollment_id]: !!v }))}
                />
                Present
              </label>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function NotesPanel({ classId, canManage, initial }: { classId: string; canManage: boolean; initial: string }) {
  const fn = useServerFn(updateClassNotes);
  const qc = useQueryClient();
  const [notes, setNotes] = useState(initial);
  useEffect(() => setNotes(initial), [initial]);
  const mut = useMutation({
    mutationFn: () => fn({ data: { class_id: classId, notes } }),
    onSuccess: () => { toast.success("Notes saved"); qc.invalidateQueries({ queryKey: ["class", classId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="p-6 space-y-4">
      <h2 className="font-display text-2xl">Session notes</h2>
      {canManage ? (
        <>
          <Textarea rows={12} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was covered, key positions, homework…" />
          <Button size="sm" onClick={() => mut.mutate()} disabled={mut.isPending}>{mut.isPending ? "Saving…" : "Save notes"}</Button>
        </>
      ) : (
        <div className="whitespace-pre-wrap text-sm text-muted-foreground">{notes || "Notes will appear here after the session."}</div>
      )}
    </Card>
  );
}