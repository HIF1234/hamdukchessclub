import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { applySuccessfulPayment } from "@/lib/payments/paystack.server";

export const Route = createFileRoute("/api/public/paystack-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.PAYSTACK_SECRET_KEY;
        if (!secret) return new Response("Server misconfigured", { status: 500 });

        const signature = request.headers.get("x-paystack-signature");
        const body = await request.text();
        if (!signature) return new Response("Missing signature", { status: 401 });

        const expected = createHmac("sha512", secret).update(body).digest("hex");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: { event: string; data: { reference: string; status: string } };
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        if (payload.event === "charge.success" && payload.data?.status === "success") {
          try {
            await applySuccessfulPayment(payload.data.reference);
          } catch (e) {
            console.error("Failed to apply payment", e);
            // Persist raw event for audit
            await supabaseAdmin.from("audit_log").insert({
              action: "paystack.webhook.error",
              target_type: "payment",
              target_id: payload.data.reference,
              metadata: { error: String(e) },
            });
            return new Response("Internal error", { status: 500 });
          }
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});