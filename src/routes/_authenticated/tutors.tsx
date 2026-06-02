import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { listTutors } from "@/lib/admin/management.functions";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/tutors")({
  head: () => ({ meta: [{ title: "Tutors — Hamduk Chess Club" }] }),
  component: TutorsPage,
});

function TutorsPage() {
  const fetchTutors = useServerFn(listTutors);
  const { data, isLoading, error } = useQuery({ queryKey: ["tutors"], queryFn: () => fetchTutors() });
  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Tutors</p>
        <h1 className="mt-2 font-display text-4xl">Coaching team</h1>
        <p className="mt-2 text-muted-foreground">Every tutor available to teach club members and school students.</p>
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Rating</th>
                <th className="text-left px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {error && <tr><td colSpan={4} className="px-4 py-8 text-center text-destructive">{(error as Error).message}</td></tr>}
              {data?.map((t) => (
                <tr key={t.id} className="border-t border-border/40 hover:bg-secondary/20">
                  <td className="px-4 py-3 font-medium">{t.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.email}</td>
                  <td className="px-4 py-3">{t.chess_rating ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {data?.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No tutors yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardShell>
  );
}