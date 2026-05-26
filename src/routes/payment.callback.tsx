import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { verifyPayment } from "@/lib/payments/paystack.functions";
import { useAuth } from "@/lib/auth/auth-context";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/payment/callback")({
  validateSearch: (s: Record<string, unknown>) => ({
    reference: (s.reference as string) || (s.trxref as string) || "",
  }),
  head: () => ({ meta: [{ title: "Verifying payment — Hamduk Chess Club" }] }),
  component: PaymentCallback,
});

function PaymentCallback() {
  const { reference } = useSearch({ from: "/payment/callback" });
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const verify = useServerFn(verifyPayment);
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setMessage("Missing payment reference.");
      return;
    }
    void (async () => {
      try {
        const res = await verify({ data: { reference } });
        if (res.success) {
          await refresh();
          setStatus("success");
          setTimeout(() => void navigate({ to: "/dashboard" }), 1500);
        } else {
          setStatus("failed");
          setMessage(`Payment ${res.status}.`);
        }
      } catch (e) {
        setStatus("failed");
        setMessage(e instanceof Error ? e.message : "Verification failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reference]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-md w-full text-center">
        <Logo className="justify-center" />
        <h1 className="mt-10 font-display text-4xl">
          {status === "verifying" && "Verifying your payment…"}
          {status === "success" && "Payment confirmed"}
          {status === "failed" && "Payment not confirmed"}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {status === "verifying" && "Just a moment while we confirm the transaction with Paystack."}
          {status === "success" && "Your membership is now active. Redirecting you to the dashboard…"}
          {status === "failed" && (message || "Something went wrong while confirming your payment.")}
        </p>
        {status === "failed" && (
          <div className="mt-8 flex flex-col gap-2">
            <Button onClick={() => void navigate({ to: "/billing" })}>Back to plans</Button>
          </div>
        )}
      </div>
    </div>
  );
}