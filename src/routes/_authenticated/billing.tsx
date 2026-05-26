import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth/auth-context";
import { getPlans } from "@/lib/payments/plans.functions";
import { initializePayment } from "@/lib/payments/paystack.functions";
import { toast } from "sonner";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Choose a plan — Hamduk Chess Club" }] }),
  component: BillingPage,
});

function formatNaira(kobo: number) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);
}

function BillingPage() {
  const { roles, signOut } = useAuth();
  const navigate = useNavigate();
  const fetchPlans = useServerFn(getPlans);
  const initPay = useServerFn(initializePayment);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  const audience: "school" | "member" = roles.includes("school_admin") ? "school" : "member";

  const { data: plans, isLoading } = useQuery({
    queryKey: ["plans"],
    queryFn: () => fetchPlans(),
  });

  const filtered = (plans ?? []).filter((p) => p.audience === audience);

  async function handleSelect(planId: string) {
    try {
      setBusyPlan(planId);
      const res = await initPay({ data: { planId } });
      window.location.href = res.authorizationUrl;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start payment");
      setBusyPlan(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
          <Logo />
          <Button variant="ghost" size="sm" onClick={async () => { await signOut(); void navigate({ to: "/login" }); }}>Sign out</Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-primary">Membership</p>
          <h1 className="mt-2 font-display text-5xl">Choose your <em className="text-primary not-italic">plan</em></h1>
          <p className="mt-3 text-muted-foreground max-w-xl mx-auto">Unlock classes, tournaments, puzzles, and the full Hamduk experience. Pay securely with Paystack.</p>
        </div>

        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading plans…</div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {filtered.map((p, idx) => {
              const features = Array.isArray(p.features) ? (p.features as string[]) : [];
              const popular = idx === 1;
              return (
                <Card key={p.id} className={`p-8 relative flex flex-col ${popular ? "border-primary shadow-elegant" : ""}`}>
                  {popular && <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most popular</Badge>}
                  <h3 className="font-display text-2xl">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1 min-h-[2.5em]">{p.description}</p>
                  <div className="mt-6 mb-6">
                    <span className="font-display text-5xl">{formatNaira(p.price_kobo)}</span>
                    <span className="text-muted-foreground text-sm">/{p.interval}</span>
                  </div>
                  <ul className="space-y-2 text-sm flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex gap-2"><Check className="size-4 text-primary mt-0.5 shrink-0" /><span>{f}</span></li>
                    ))}
                  </ul>
                  <Button
                    className="mt-8 w-full"
                    variant={popular ? "default" : "outline"}
                    disabled={busyPlan !== null}
                    onClick={() => handleSelect(p.id)}
                  >
                    {busyPlan === p.id ? "Redirecting…" : `Choose ${p.name}`}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">Payments are processed securely by Paystack. You can cancel anytime from your profile.</p>
      </main>
    </div>
  );
}