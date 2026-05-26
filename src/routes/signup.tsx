import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

const schema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(100),
  email: z.string().email("Enter a valid email").max(255),
  password: z.string().min(8, "Min 8 characters").max(72),
  role: z.enum(["member", "school_admin"]),
});

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create your account — Hamduk Chess Club" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [full_name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"member" | "school_admin">("member");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse({ full_name, email, password, role });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[String(i.path[0])] = i.message; });
      setErrors(errs);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: parsed.data.full_name, role: parsed.data.role },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Check your email to verify your account");
    void navigate({ to: "/verify-email", search: { email: parsed.data.email } });
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Two minutes to set up. A lifetime of games."
      footer={<>Already a member? <Link to="/login" className="text-primary hover:underline">Sign in</Link></>}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" value={full_name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" autoComplete="name" />
          {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <div className="space-y-2">
          <Label>I am signing up as</Label>
          <RadioGroup value={role} onValueChange={(v) => setRole(v as "member" | "school_admin")} className="grid grid-cols-2 gap-2">
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="member" id="r-member" className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">Member</div>
                <div className="text-xs text-muted-foreground">Play, learn, compete</div>
              </div>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:border-primary transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <RadioGroupItem value="school_admin" id="r-school" className="mt-0.5" />
              <div>
                <div className="text-sm font-medium">School</div>
                <div className="text-xs text-muted-foreground">Enroll students</div>
              </div>
            </label>
          </RadioGroup>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Creating…" : "Create account"}</Button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <GoogleButton label="Sign up with Google" />
    </AuthShell>
  );
}