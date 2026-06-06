import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHost } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { rateLimit } from "@/lib/cache/redis.server";
import {
  paystackInitialize,
  paystackVerify,
  applySuccessfulPayment,
} from "./paystack.server";

export const initializePayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ planId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId, claims } = context;

    // Prevent rapid checkout spamming (max 5 inits per user per minute).
    await rateLimit(userId, { name: "pay-init", limit: 5, windowSeconds: 60 });

    // Use admin client and self-heal: if profile is missing for any reason,
    // create it from the verified JWT claims so checkout never blocks.
    let { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      const email = (claims.email as string | undefined) ?? "";
      const fullName =
        ((claims.user_metadata as { full_name?: string; name?: string } | undefined)?.full_name) ??
        ((claims.user_metadata as { full_name?: string; name?: string } | undefined)?.name) ??
        (email ? email.split("@")[0] : "Member");
      const { data: created, error: insErr } = await supabaseAdmin
        .from("profiles")
        .insert({ id: userId, email, full_name: fullName, account_state: "pending_payment" })
        .select("email, full_name")
        .single();
      if (insErr || !created) throw new Error("Could not prepare your profile. Please refresh and try again.");
      profile = created;
    }

    const { data: plan, error: planErr } = await supabaseAdmin
      .from("plans")
      .select("id, price_kobo, name")
      .eq("id", data.planId)
      .eq("is_active", true)
      .single();
    if (planErr || !plan) throw new Error("Plan not available");

    const reference = `hcc_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
    const host = getRequestHost();
    const proto = host.includes("localhost") ? "http" : "https";
    const callbackUrl = `${proto}://${host}/payment/callback`;

    const init = await paystackInitialize({
      email: profile.email,
      amountKobo: plan.price_kobo,
      reference,
      callbackUrl,
      metadata: { user_id: userId, plan_id: plan.id, plan_name: plan.name },
    });

    await supabaseAdmin.from("payments").insert({
      user_id: userId,
      plan_id: plan.id,
      reference,
      amount_kobo: plan.price_kobo,
      status: "initialized",
      authorization_url: init.authorization_url,
    });

    return { authorizationUrl: init.authorization_url, reference };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ reference: z.string().min(8) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    // Confirm payment belongs to caller
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("user_id, status")
      .eq("reference", data.reference)
      .maybeSingle();
    if (!payment || payment.user_id !== userId) throw new Error("Payment not found");

    const verified = await paystackVerify(data.reference);
    if (verified.status !== "success") {
      await supabaseAdmin
        .from("payments")
        .update({ status: verified.status === "abandoned" ? "abandoned" : "failed", raw: JSON.parse(JSON.stringify(verified)) })
        .eq("reference", data.reference);
      return { success: false, status: verified.status };
    }

    await applySuccessfulPayment(data.reference);
    return { success: true };
  });