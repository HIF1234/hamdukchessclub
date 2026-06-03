import { supabaseAdmin } from "@/integrations/supabase/client.server";

const PAYSTACK_API = "https://api.paystack.co";

function secret() {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return key;
}

export async function paystackInitialize(args: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  const res = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: args.email,
      amount: args.amountKobo,
      reference: args.reference,
      callback_url: args.callbackUrl,
      metadata: args.metadata,
    }),
  });
  const json = (await res.json()) as {
    status: boolean;
    message: string;
    data?: { authorization_url: string; access_code: string; reference: string };
  };
  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message || "Failed to initialize payment");
  }
  return json.data;
}

export async function paystackVerify(reference: string) {
  const res = await fetch(`${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret()}` },
  });
  const json = (await res.json()) as {
    status: boolean;
    message: string;
    data?: {
      status: string;
      reference: string;
      amount: number;
      currency: string;
      paid_at: string | null;
      metadata: Record<string, unknown> | null;
      customer: { email: string };
    };
  };
  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message || "Verification failed");
  }
  return json.data;
}

/**
 * Apply a successful payment: set payment to success, activate member account,
 * extend membership_expires_at by plan interval.
 */
export async function applySuccessfulPayment(reference: string) {
  const { data: payment, error: payErr } = await supabaseAdmin
    .from("payments")
    .select("id, user_id, plan_id, status, amount_kobo")
    .eq("reference", reference)
    .maybeSingle();
  if (payErr) {
    console.error("[payments.apply.lookup]", payErr);
    throw new Error("Could not process payment. Please contact support.");
  }
  if (!payment) throw new Error("Payment not found");
  if (payment.status === "success") return { alreadyApplied: true };

  const { data: plan, error: planErr } = await supabaseAdmin
    .from("plans")
    .select("id, interval, audience, tier")
    .eq("id", payment.plan_id)
    .single();
  if (planErr) {
    console.error("[payments.apply.plan]", planErr);
    throw new Error("Could not process payment. Please contact support.");
  }

  const now = new Date();
  const expiresAt = new Date(now);
  if (plan.interval === "monthly") expiresAt.setMonth(expiresAt.getMonth() + 1);
  else if (plan.interval === "quarterly") expiresAt.setMonth(expiresAt.getMonth() + 3);
  else if (plan.interval === "yearly") expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  else expiresAt.setFullYear(expiresAt.getFullYear() + 100); // one_time

  await supabaseAdmin
    .from("payments")
    .update({ status: "success", paid_at: now.toISOString() })
    .eq("id", payment.id);

  if (plan.audience === "member") {
    await supabaseAdmin
      .from("profiles")
      .update({
        account_state: "active",
        membership_expires_at: expiresAt.toISOString(),
        selected_plan_id: plan.id,
        membership_level: plan.tier as "beginner" | "intermediate" | "advanced",
      })
      .eq("id", payment.user_id);
  } else {
    // school plan — activate user too, school record managed elsewhere
    await supabaseAdmin
      .from("profiles")
      .update({ account_state: "active", membership_expires_at: expiresAt.toISOString() })
      .eq("id", payment.user_id);
  }

  return { alreadyApplied: false };
}