import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { AvatarUploader } from "@/components/uploads/avatar-uploader";
import {
  getMyProfile,
  updateMyProfile,
  exportMyData,
  requestAccountDeletion,
} from "@/lib/profile/profile.functions";
import { toast } from "sonner";
import { Download, Trash2, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Hamduk Chess Club" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { roles, refresh, signOut, user } = useAuth();
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const save = useServerFn(updateMyProfile);
  const exportFn = useServerFn(exportMyData);
  const deleteFn = useServerFn(requestAccountDeletion);

  const { data, isLoading, refetch } = useQuery({ queryKey: ["my-profile"], queryFn: () => fetchProfile() });

  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    location: "",
    bio: "",
    chess_goals: "",
    timezone: "",
    language: "en",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setForm({
        full_name: data.full_name ?? "",
        phone: data.phone ?? "",
        location: data.location ?? "",
        bio: data.bio ?? "",
        chess_goals: data.chess_goals ?? "",
        timezone: data.timezone ?? "UTC",
        language: data.language ?? "en",
      });
    }
  }, [data]);

  async function handleSave() {
    try {
      setSaving(true);
      await save({ data: form });
      await refresh();
      toast.success("Profile saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function handleExport() {
    try {
      const blob = await exportFn();
      const json = JSON.stringify(blob, null, 2);
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `hamduk-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Your data export has downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not export");
    }
  }

  async function handleDelete() {
    if (!confirm("Request account deletion? You will be signed out and your access suspended pending review.")) return;
    try {
      await deleteFn({});
      toast.success("Deletion requested. An admin will follow up.");
      await signOut();
      void navigate({ to: "/login" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not submit");
    }
  }

  return (
    <DashboardShell>
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-primary">Account</p>
        <h1 className="mt-2 font-display text-4xl">Settings</h1>
        <div className="mt-3 flex gap-2 flex-wrap">
          {roles.map((r) => (
            <Badge key={r} variant="secondary" className="capitalize">{r.replace("_", " ")}</Badge>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-display text-xl mb-4">Profile</h2>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="space-y-4">
              {user ? (
                <AvatarUploader
                  userId={user.id}
                  currentUrl={(data as { avatar_url?: string | null } | null)?.avatar_url ?? null}
                  fallback={form.full_name || "U"}
                  onUploaded={async () => {
                    await refetch();
                    await refresh();
                  }}
                />
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="full_name">Full name</Label>
                <Input id="full_name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea id="bio" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goals">Chess goals</Label>
                <Textarea id="goals" rows={2} value={form.chess_goals} onChange={(e) => setForm({ ...form, chess_goals: e.target.value })} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tz">Timezone</Label>
                  <Input id="tz" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lang">Language</Label>
                  <Input id="lang" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
                </div>
              </div>
              <div className="pt-2">
                <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="size-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-display text-lg">Two-factor auth</h3>
                <p className="text-xs text-muted-foreground mt-1">Coming soon. Add a TOTP app to secure your account.</p>
                <Button size="sm" variant="outline" className="mt-3" disabled>Set up 2FA</Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <Download className="size-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-display text-lg">Export your data</h3>
                <p className="text-xs text-muted-foreground mt-1">Download a JSON copy of everything we store about you.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={handleExport}>Download JSON</Button>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-destructive/30">
            <div className="flex items-start gap-3">
              <Trash2 className="size-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h3 className="font-display text-lg">Delete account</h3>
                <p className="text-xs text-muted-foreground mt-1">Suspends your account immediately and notifies admins for permanent removal.</p>
                <Button size="sm" variant="destructive" className="mt-3" onClick={handleDelete}>Request deletion</Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}