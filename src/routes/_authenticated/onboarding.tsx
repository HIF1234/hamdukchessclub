import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth/auth-context";
import { saveOnboarding, upsertSchool } from "@/lib/onboarding/onboarding.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Hamduk Chess Club" }] }),
  component: OnboardingWizard,
});

type MemberForm = {
  full_name: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  location: string;
  bio: string;
  chess_rating: number;
  membership_level: "beginner" | "intermediate" | "advanced";
  chess_goals: string;
  timezone: string;
  language: string;
};

type SchoolForm = {
  name: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  student_count: number;
};

function OnboardingWizard() {
  const { profile, roles, refresh } = useAuth();
  const navigate = useNavigate();
  const save = useServerFn(saveOnboarding);
  const saveSchool = useServerFn(upsertSchool);
  const isSchool = roles.includes("school_admin");

  const totalSteps = isSchool ? 3 : 4;
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";

  const [member, setMember] = useState<MemberForm>({
    full_name: profile?.full_name ?? "",
    phone: "",
    date_of_birth: "",
    gender: "",
    location: "",
    bio: "",
    chess_rating: profile?.chess_rating ?? 800,
    membership_level: profile?.membership_level ?? "beginner",
    chess_goals: "",
    timezone: tz || "UTC",
    language: "en",
  });

  const [school, setSchool] = useState<SchoolForm>({
    name: "",
    contact_person: profile?.full_name ?? "",
    contact_email: profile?.email ?? "",
    contact_phone: "",
    address: "",
    student_count: 30,
  });

  async function persist(nextStep: number, completed = false) {
    setSubmitting(true);
    try {
      await save({
        data: {
          ...member,
          chess_rating: Number(member.chess_rating) || 800,
          onboarding_step: nextStep,
          onboarding_completed: completed,
        },
      });
      if (isSchool && nextStep >= 2) {
        await saveSchool({ data: { ...school, student_count: Number(school.student_count) || 0 } });
      }
      await refresh();
      setStep(nextStep);
      if (completed) {
        toast.success("Profile saved");
        void navigate({ to: "/billing" });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <div className="max-w-2xl mx-auto">
        <Logo className="justify-center" />
        <div className="mt-10 text-center">
          <p className="text-xs uppercase tracking-widest text-primary">Step {step} of {totalSteps}</p>
          <h1 className="mt-2 font-display text-4xl">Welcome to the club</h1>
          <p className="mt-2 text-muted-foreground">A few quick details to set up your account.</p>
          <Progress value={(step / totalSteps) * 100} className="mt-6" />
        </div>

        <Card className="mt-8 p-8">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl">Personal info</h2>
              <Field label="Full name">
                <Input value={member.full_name} onChange={(e) => setMember({ ...member, full_name: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone">
                  <Input value={member.phone} onChange={(e) => setMember({ ...member, phone: e.target.value })} placeholder="+234…" />
                </Field>
                <Field label="Date of birth">
                  <Input type="date" value={member.date_of_birth} onChange={(e) => setMember({ ...member, date_of_birth: e.target.value })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Gender">
                  <Select value={member.gender} onValueChange={(v) => setMember({ ...member, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Location">
                  <Input value={member.location} onChange={(e) => setMember({ ...member, location: e.target.value })} placeholder="City, country" />
                </Field>
              </div>
            </div>
          )}

          {step === 2 && !isSchool && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl">Chess profile</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Current rating">
                  <Input type="number" value={member.chess_rating} onChange={(e) => setMember({ ...member, chess_rating: Number(e.target.value) })} />
                </Field>
                <Field label="Level">
                  <Select value={member.membership_level} onValueChange={(v: MemberForm["membership_level"]) => setMember({ ...member, membership_level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="What are your chess goals?">
                <Textarea value={member.chess_goals} onChange={(e) => setMember({ ...member, chess_goals: e.target.value })} rows={3} placeholder="Compete in tournaments, reach 1500 rating, improve openings…" />
              </Field>
              <Field label="Short bio (optional)">
                <Textarea value={member.bio} onChange={(e) => setMember({ ...member, bio: e.target.value })} rows={2} />
              </Field>
            </div>
          )}

          {step === 2 && isSchool && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl">School details</h2>
              <Field label="School name">
                <Input value={school.name} onChange={(e) => setSchool({ ...school, name: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Contact person">
                  <Input value={school.contact_person} onChange={(e) => setSchool({ ...school, contact_person: e.target.value })} />
                </Field>
                <Field label="Contact phone">
                  <Input value={school.contact_phone} onChange={(e) => setSchool({ ...school, contact_phone: e.target.value })} />
                </Field>
              </div>
              <Field label="Contact email">
                <Input type="email" value={school.contact_email} onChange={(e) => setSchool({ ...school, contact_email: e.target.value })} />
              </Field>
              <Field label="Address">
                <Textarea value={school.address} onChange={(e) => setSchool({ ...school, address: e.target.value })} rows={2} />
              </Field>
              <Field label="Approx. student count">
                <Input type="number" value={school.student_count} onChange={(e) => setSchool({ ...school, student_count: Number(e.target.value) })} />
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-display text-2xl">Preferences</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Timezone">
                  <Input value={member.timezone} onChange={(e) => setMember({ ...member, timezone: e.target.value })} />
                </Field>
                <Field label="Language">
                  <Select value={member.language} onValueChange={(v) => setMember({ ...member, language: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="ar">العربية</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <p className="text-sm text-muted-foreground">You can change these anytime from your profile.</p>
            </div>
          )}

          {step === 4 && !isSchool && (
            <div className="space-y-3">
              <h2 className="font-display text-2xl">Review</h2>
              <Summary k="Name" v={member.full_name} />
              <Summary k="Phone" v={member.phone || "—"} />
              <Summary k="Location" v={member.location || "—"} />
              <Summary k="Rating" v={String(member.chess_rating)} />
              <Summary k="Level" v={member.membership_level} />
              <Summary k="Goals" v={member.chess_goals || "—"} />
              <p className="pt-4 text-sm text-muted-foreground">Next, choose a plan to unlock the club.</p>
            </div>
          )}

          <div className="mt-8 flex justify-between gap-3">
            <Button variant="ghost" disabled={step === 1 || submitting} onClick={() => setStep((s) => s - 1)}>Back</Button>
            {step < totalSteps ? (
              <Button disabled={submitting} onClick={() => persist(step + 1)}>{submitting ? "Saving…" : "Continue"}</Button>
            ) : (
              <Button disabled={submitting} onClick={() => persist(totalSteps, true)}>{submitting ? "Saving…" : "Finish & choose plan"}</Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Summary({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/50 pb-2">
      <span className="text-muted-foreground text-sm">{k}</span>
      <span className="text-sm">{v}</span>
    </div>
  );
}