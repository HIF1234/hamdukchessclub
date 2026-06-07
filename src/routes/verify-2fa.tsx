import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand/logo";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";

export const Route = createFileRoute("/verify-2fa")({
  head: () => ({ meta: [{ title: "Two-factor verification — Hamduk Chess Club" }] }),
  component: Verify2FAPage,
});

function Verify2FAPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        void navigate({ to: "/login" });
        return;
      }
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === aal?.nextLevel) {
        void navigate({ to: "/dashboard" });
        return;
      }
      const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
      if (fErr) { setError(fErr.message); return; }
      const totp = factors.totp.find((f) => f.status === "verified");
      if (!totp) { void navigate({ to: "/dashboard" }); return; }
      setFactorId(totp.id);
      const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (cErr) { setError(cErr.message); return; }
      setChallengeId(ch.id);
    })();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || !challengeId) return;
    try {
      setBusy(true);
      setError(null);
      const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
      if (error) throw error;
      await refresh();
      toast.success("Verified");
      void navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background">
      <Logo />
      <form onSubmit={submit} className="mt-10 w-full max-w-sm space-y-5">
        <div>
          <h1 className="font-display text-3xl">Two-factor verification</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            autoFocus
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={busy || code.length < 6}>
          {busy ? "Verifying…" : "Verify"}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={signOut}>Sign out</Button>
      </form>
    </div>
  );
}