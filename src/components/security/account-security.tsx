import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || email === currentEmail) {
      toast.error("Enter a different email address");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/auth/callback` },
    );
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Confirm the link we sent to your new address to finish the change");
    setEmail("");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-muted-foreground">Current: {currentEmail}</p>
      <div className="space-y-2">
        <Label htmlFor="new-email">New email</Label>
        <Input id="new-email" type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} placeholder="you@example.com" />
      </div>
      <Button size="sm" type="submit" disabled={busy}>{busy ? "Sending…" : "Send verification"}</Button>
    </form>
  );
}

export function ChangePasswordForm({ email }: { email: string }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) return void toast.error("New password must be at least 8 characters");
    if (next !== confirm) return void toast.error("New passwords do not match");
    setBusy(true);
    // Re-authenticate with the current password before allowing the change.
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: current });
    if (signInError) {
      setBusy(false);
      return void toast.error("Your current password is incorrect");
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Password updated");
    setCurrent("");
    setNext("");
    setConfirm("");
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="cur-pw">Current password</Label>
        <Input id="cur-pw" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-pw">New password</Label>
        <Input id="new-pw" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cnf-pw">Confirm new password</Label>
        <Input id="cnf-pw" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </div>
      <Button size="sm" type="submit" disabled={busy}>{busy ? "Updating…" : "Update password"}</Button>
    </form>
  );
}

export function SignOutOtherDevices() {
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    const { error } = await supabase.auth.signOut({ scope: "others" });
    setBusy(false);
    if (error) return void toast.error(error.message);
    toast.success("Signed out of all other devices");
  }
  return (
    <Button size="sm" variant="outline" onClick={run} disabled={busy}>
      {busy ? "Revoking…" : "Sign out other devices"}
    </Button>
  );
}
