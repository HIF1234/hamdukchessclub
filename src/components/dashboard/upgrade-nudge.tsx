import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { supabase } from "@/integrations/supabase/client";

// Subtle reminder that appears bottom-left a few seconds after the user
// lands on the dashboard, but only for members who haven't paid yet.
export function UpgradeNudge() {
  const { profile, user, roles } = useAuth();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { data: hasPayment } = useQuery({
    queryKey: ["has-payment", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("status", "success");
      return (count ?? 0) > 0;
    },
  });

  useEffect(() => {
    if (sessionStorage.getItem("upgrade-nudge-dismissed")) {
      setDismissed(true);
      return;
    }
    const t = setTimeout(() => setShow(true), 8000);
    return () => clearTimeout(t);
  }, []);

  if (dismissed || !show) return null;
  if (!profile || profile.account_state !== "active") return null;
  // Hide for admins and tutors — they don't pay.
  if (roles.includes("super_admin") || roles.includes("tutor")) return null;
  if (hasPayment) return null;

  return (
    <div className="fixed bottom-4 left-4 z-30 max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur shadow-elegant p-4">
        <button
          aria-label="Dismiss"
          onClick={() => {
            sessionStorage.setItem("upgrade-nudge-dismissed", "1");
            setDismissed(true);
          }}
          className="absolute top-2 right-2 text-muted-foreground/60 hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-primary/15 text-primary p-2">
            <Sparkles className="size-4" />
          </div>
          <div>
            <p className="text-sm font-medium">Unlock the full club</p>
            <p className="text-xs text-muted-foreground mt-0.5">Upgrade to access classes, tournaments and tutor sessions.</p>
            <Link to="/billing" className="mt-2 inline-block text-xs text-primary hover:underline">See plans →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}