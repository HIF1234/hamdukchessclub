import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

interface Factor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status: string;
}

export function TotpSettings() {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loading, setLoading] = useState(true);
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadFactors() {
    setLoading(true);
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp ?? []) as Factor[]);
    setLoading(false);
  }

  useEffect(() => { void loadFactors(); }, []);

  const verified = factors.find((f) => f.status === "verified");

  async function startEnroll() {
    try {
      setBusy(true);
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Authenticator ${new Date().toLocaleDateString()}`,
      });
      if (error) throw error;
      setEnroll({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start 2FA setup");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnroll() {
    if (!enroll || code.length < 6) return;
    try {
      setBusy(true);
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: enroll.factorId });
      if (cErr) throw cErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: enroll.factorId,
        challengeId: challenge.id,
        code,
      });
      if (vErr) throw vErr;
      toast.success("Two-factor auth enabled");
      setEnroll(null);
      setCode("");
      await loadFactors();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  async function cancelEnroll() {
    if (!enroll) return;
    await supabase.auth.mfa.unenroll({ factorId: enroll.factorId });
    setEnroll(null);
    setCode("");
  }

  async function disable(id: string) {
    if (!confirm("Disable two-factor authentication?")) return;
    try {
      setBusy(true);
      const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
      if (error) throw error;
      toast.success("2FA disabled");
      await loadFactors();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not disable");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-xs text-muted-foreground">Loading…</p>;

  if (verified) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1"><ShieldCheck className="size-3" /> Enabled</Badge>
          <span className="text-xs text-muted-foreground">{verified.friendly_name ?? "Authenticator"}</span>
        </div>
        <p className="text-xs text-muted-foreground">You'll be prompted for a 6-digit code on every sign-in.</p>
        <Button size="sm" variant="outline" onClick={() => disable(verified.id)} disabled={busy}>
          <ShieldOff className="size-4 mr-2" /> Disable 2FA
        </Button>
      </div>
    );
  }

  if (enroll) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Scan this QR with Google Authenticator, Authy, or any TOTP app, then enter the 6-digit code below.
        </p>
        <div className="flex justify-center bg-white p-3 rounded-md">
          <img src={enroll.qr} alt="TOTP QR code" className="size-40" />
        </div>
        <div className="text-center text-[11px] text-muted-foreground break-all font-mono">
          Can't scan? Enter key: <span className="text-foreground">{enroll.secret}</span>
        </div>
        <div className="space-y-2">
          <Label htmlFor="totp-code">Verification code</Label>
          <Input
            id="totp-code"
            inputMode="numeric"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={verifyEnroll} disabled={busy || code.length < 6}>Verify & enable</Button>
          <Button size="sm" variant="ghost" onClick={cancelEnroll} disabled={busy}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Add an authenticator app for stronger account security.</p>
      <Button size="sm" variant="outline" onClick={startEnroll} disabled={busy}>Set up 2FA</Button>
    </div>
  );
}