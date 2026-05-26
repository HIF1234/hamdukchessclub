import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (s) => ({ email: typeof s.email === "string" ? s.email : "" }),
  head: () => ({ meta: [{ title: "Verify your email — Hamduk Chess Club" }] }),
  component: VerifyPage,
});

function VerifyPage() {
  const { email } = Route.useSearch();
  const [sending, setSending] = useState(false);

  const resend = async () => {
    if (!email) { toast.error("No email on file — sign in to resend"); return; }
    setSending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${window.location.origin}/auth/callback` } });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Verification email re-sent");
  };

  return (
    <AuthShell
      title="Check your inbox"
      subtitle={email ? `We sent a verification link to ${email}.` : "We sent you a verification link."}
      footer={<><Link to="/login" className="text-primary hover:underline">Back to sign in</Link></>}
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
          Click the link in the email to activate your account. The link is valid for 24 hours.
        </div>
        <Button onClick={resend} variant="outline" className="w-full" disabled={sending}>{sending ? "Sending…" : "Resend verification email"}</Button>
      </div>
    </AuthShell>
  );
}