import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAuth } from "@/lib/auth/auth-context";
import { AvatarUploader } from "@/components/uploads/avatar-uploader";
import { TotpSettings } from "@/components/security/totp-settings";
import { NotificationPrefsPanel } from "@/components/security/notification-prefs";
import { LoginHistory } from "@/components/security/login-history";
import {
  ChangeEmailForm,
  ChangePasswordForm,
  SignOutOtherDevices,
} from "@/components/security/account-security";
import {
  getMyProfile,
  updateMyProfile,
  exportMyData,
  requestAccountDeletion,
} from "@/lib/profile/profile.functions";
import { listMyMemberships, joinOrganizationByCode } from "@/lib/organizations/organizations.functions";
import { listMyChildren } from "@/lib/family/family.functions";
import { getMyCoachStatus, submitCoachApplication } from "@/lib/coaching/coaching.functions";
import { toast } from "sonner";
import { Download, Trash2, ShieldCheck, Bell, KeyRound, Mail, History, Building2, Users, Award } from "lucide-react";

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

  const qc = useQueryClient();
  const fetchMemberships = useServerFn(listMyMemberships);
  const { data: memberships } = useQuery({ queryKey: ["my-memberships"], queryFn: () => fetchMemberships() });
  const join = useServerFn(joinOrganizationByCode);
  const [joinCode, setJoinCode] = useState("");
  const joinMut = useMutation({
    mutationFn: (code: string) => join({ data: { code } }),
    onSuccess: (res) => {
      toast.success(
        res.status === "approved" ? `You've joined ${res.organization_name}.` : `Request sent to ${res.organization_name} — pending approval.`,
      );
      setJoinCode("");
      void qc.invalidateQueries({ queryKey: ["my-memberships"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fetchChildren = useServerFn(listMyChildren);
  const { data: children } = useQuery({ queryKey: ["my-children"], queryFn: () => fetchChildren() });

  const isTutor = roles.includes("tutor");
  const fetchCoachStatus = useServerFn(getMyCoachStatus);
  const { data: coachStatus } = useQuery({ queryKey: ["my-coach-status"], queryFn: () => fetchCoachStatus(), enabled: isTutor });
  const [coachBio, setCoachBio] = useState("");
  const [coachSpecialties, setCoachSpecialties] = useState("");
  const applyCoach = useServerFn(submitCoachApplication);
  const applyCoachMut = useMutation({
    mutationFn: () =>
      applyCoach({
        data: {
          bio: coachBio.trim(),
          specialties: coachSpecialties.split(",").map((s) => s.trim()).filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("Application submitted");
      void qc.invalidateQueries({ queryKey: ["my-coach-status"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

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

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-start gap-3">
            <Bell className="size-5 text-primary mt-0.5" />
            <div className="flex-1">
              <h2 className="font-display text-xl">Notification preferences</h2>
              <p className="text-xs text-muted-foreground mt-1">Choose how you hear about each kind of club activity.</p>
              <div className="mt-4"><NotificationPrefsPanel /></div>
            </div>
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <div className="flex items-start gap-3">
            <History className="size-5 text-primary mt-0.5" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl">Sign-in activity</h2>
                  <p className="text-xs text-muted-foreground mt-1">Recent sign-ins on your account, newest first.</p>
                </div>
                <SignOutOtherDevices />
              </div>
              <div className="mt-4"><LoginHistory /></div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {(children ?? []).length > 0 && (
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <Users className="size-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-display text-lg">Family</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    You're linked as a guardian for {children!.length === 1 ? "one child" : `${children!.length} children`}.
                  </p>
                  <Link to="/family">
                    <Button size="sm" variant="outline" className="mt-3">
                      View classes &amp; tournaments
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {isTutor && coachStatus && (
            <Card className="p-6">
              <div className="flex items-start gap-3">
                <Award className="size-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg">Hamduk-verified coach</h3>
                    {coachStatus.verified && <Badge>Verified</Badge>}
                  </div>
                  {coachStatus.verified ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Verified {coachStatus.verified_at ? new Date(coachStatus.verified_at).toLocaleDateString() : ""}. This badge shows wherever you're listed as a tutor.
                    </p>
                  ) : coachStatus.application?.status === "pending" ? (
                    <p className="text-xs text-muted-foreground mt-1">Your application is pending review.</p>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground mt-1">
                        Apply for a platform-wide verified badge, shown wherever you're listed as a tutor.
                      </p>
                      {coachStatus.application?.status === "rejected" && (
                        <p className="text-xs text-destructive mt-2">
                          Previous application wasn't approved{coachStatus.application.review_note ? `: ${coachStatus.application.review_note}` : "."}
                        </p>
                      )}
                      <div className="mt-3 space-y-2">
                        <Textarea
                          value={coachBio}
                          onChange={(e) => setCoachBio(e.target.value)}
                          rows={3}
                          placeholder="Tell us about your coaching experience and credentials…"
                        />
                        <Input
                          value={coachSpecialties}
                          onChange={(e) => setCoachSpecialties(e.target.value)}
                          placeholder="Specialties, comma separated (e.g. openings, endgames)"
                        />
                        <Button
                          size="sm"
                          disabled={applyCoachMut.isPending || coachBio.trim().length < 20}
                          onClick={() => applyCoachMut.mutate()}
                        >
                          Submit application
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <Building2 className="size-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-display text-lg">Organizations</h3>
                <p className="text-xs text-muted-foreground mt-1">You're automatically a Hamduk Chess Club member. Add another school, club, or academy with a join code.</p>
                {(memberships ?? []).length > 0 && (
                  <ul className="mt-3 space-y-1.5 text-sm">
                    {memberships!.map((m) => (
                      <li key={m.id} className="flex items-center justify-between">
                        <span>{m.organization_name}</span>
                        <Badge variant={m.status === "approved" ? "default" : m.status === "pending" ? "secondary" : "outline"} className="text-xs">{m.status}</Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (joinCode.trim()) joinMut.mutate(joinCode.trim());
                  }}
                >
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Join code"
                    className="h-9 font-mono uppercase tracking-widest text-sm"
                  />
                  <Button type="submit" size="sm" disabled={joinMut.isPending || !joinCode.trim()}>Join</Button>
                </form>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <Mail className="size-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-display text-lg">Change email</h3>
                <div className="mt-3"><ChangeEmailForm currentEmail={user?.email ?? ""} /></div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <KeyRound className="size-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-display text-lg">Change password</h3>
                <div className="mt-3"><ChangePasswordForm email={user?.email ?? ""} /></div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="size-5 text-primary mt-0.5" />
              <div className="flex-1">
                <h3 className="font-display text-lg">Two-factor auth</h3>
                <div className="mt-3"><TotpSettings /></div>
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