import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listClasses, createClass, enrollInClass } from "@/lib/admin/management.functions";
import { useAuth } from "@/lib/auth/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/classes")({
  head: () => ({ meta: [{ title: "Classes — Hamduk Chess Club" }] }),
  component: ClassesPage,
});

function ClassesPage() {
  const { roles } = useAuth();
  const canCreate = roles.includes("super_admin") || roles.includes("school_admin");
  const fetchClasses = useServerFn(listClasses);
  const enroll = useServerFn(enrollInClass);
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ["classes"], queryFn: () => fetchClasses() });

  const enrollMut = useMutation({
    mutationFn: (class_id: string) => enroll({ data: { class_id } }),
    onSuccess: () => { toast.success("Enrolled in class"); qc.invalidateQueries({ queryKey: ["classes"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Classes</p>
          <h1 className="mt-2 font-display text-4xl">Upcoming sessions</h1>
          <p className="mt-2 text-muted-foreground">Browse scheduled chess classes and enrol.</p>
        </div>
        {canCreate && <CreateClassDialog />}
      </div>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{(error as Error).message}</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((c) => (
          <Card key={c.id} className="p-5 flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <BookOpen className="h-5 w-5 text-primary/70" />
              <Badge variant="secondary" className="capitalize">{c.level.replace("_", " ")}</Badge>
            </div>
            <h3 className="mt-3 font-display text-xl">{c.title}</h3>
            {c.description && <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
            <div className="mt-3 text-xs text-muted-foreground">{new Date(c.starts_at).toLocaleString()}</div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-muted-foreground capitalize">{c.status.replace("_", " ")}</span>
              <Button size="sm" variant="secondary" disabled={enrollMut.isPending} onClick={() => enrollMut.mutate(c.id)}>
                Enrol
              </Button>
            </div>
          </Card>
        ))}
        {data?.length === 0 && <p className="text-muted-foreground col-span-full">No classes scheduled.</p>}
      </div>
    </DashboardShell>
  );
}

function CreateClassDialog() {
  const createFn = useServerFn(createClass);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced" | "all_levels">("all_levels");
  const [startsAt, setStartsAt] = useState("");
  const [capacity, setCapacity] = useState("20");

  const mut = useMutation({
    mutationFn: () => createFn({ data: { title, description: description || undefined, level, starts_at: new Date(startsAt).toISOString(), capacity: Number(capacity) } }),
    onSuccess: () => {
      toast.success("Class created");
      qc.invalidateQueries({ queryKey: ["classes"] });
      setOpen(false);
      setTitle(""); setDescription(""); setStartsAt("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />New class</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Schedule a class</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mut.mutate(); }} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="title">Title</Label><Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="desc">Description</Label><Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_levels">All levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="cap">Capacity</Label><Input id="cap" type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="starts">Starts at</Label><Input id="starts" type="datetime-local" required value={startsAt} onChange={(e) => setStartsAt(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={mut.isPending}>{mut.isPending ? "Creating…" : "Create class"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}