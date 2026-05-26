import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { useState } from "react";
import { toast } from "sonner";

export function GoogleButton({ label = "Continue with Google" }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin + "/auth/callback",
      });
      if (result.error) {
        toast.error(result.error.message || "Google sign-in failed");
        setLoading(false);
        return;
      }
      if (result.redirected) return; // browser redirect
      window.location.href = "/dashboard";
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Google sign-in failed");
      setLoading(false);
    }
  };

  return (
    <Button type="button" variant="outline" className="w-full" onClick={handle} disabled={loading}>
      <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1Z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.98.66-2.24 1.06-3.72 1.06-2.87 0-5.3-1.94-6.16-4.54H2.18v2.85A11 11 0 0 0 12 23Z"/>
        <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.05H2.18A11 11 0 0 0 1 12c0 1.78.42 3.46 1.18 4.95l3.66-2.85Z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.65l3.15-3.15C17.45 2.1 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.85C6.7 7.32 9.13 5.38 12 5.38Z"/>
      </svg>
      {loading ? "Redirecting…" : label}
    </Button>
  );
}