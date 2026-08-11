import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { recordLoginEvent } from "@/lib/account/account.functions";
import { Logo } from "@/components/brand/logo";

export const Route = createFileRoute("/auth/callback")({
  component: CallbackPage,
});

function CallbackPage() {
  const navigate = useNavigate();
  useEffect(() => {
    // Supabase handles the token exchange via detectSessionInUrl; just wait briefly then route.
    const t = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        void recordLoginEvent({ data: { method: "google" } }).catch(() => {});
        void navigate({ to: "/dashboard" });
      }
      else void navigate({ to: "/login" });
    }, 600);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
      <Logo />
      <div className="text-sm text-muted-foreground">Completing sign-in…</div>
      <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 bg-primary animate-pulse" />
      </div>
    </div>
  );
}