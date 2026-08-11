import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CHANNELS = ["email", "in_app", "sms"] as const;
const EVENTS = [
  "class_reminders",
  "tournament_alerts",
  "payment_due",
  "results",
  "announcements",
  "messages",
] as const;

export type NotificationChannel = (typeof CHANNELS)[number];
export type NotificationEvent = (typeof EVENTS)[number];
export type NotificationPrefs = Record<NotificationChannel, Record<NotificationEvent, boolean>>;

const eventShape = z.object(
  Object.fromEntries(EVENTS.map((e) => [e, z.boolean()])) as Record<NotificationEvent, z.ZodBoolean>,
);
const prefsSchema = z.object({
  email: eventShape,
  in_app: eventShape,
  sms: eventShape,
});

export const getNotificationPrefs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("notification_prefs")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) {
      console.error("[account.getNotificationPrefs]", error);
      throw new Error("Could not load notification preferences.");
    }
    return (data?.notification_prefs ?? null) as NotificationPrefs | null;
  });

export const updateNotificationPrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => prefsSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ notification_prefs: data })
      .eq("id", context.userId);
    if (error) {
      console.error("[account.updateNotificationPrefs]", error);
      throw new Error("Could not save notification preferences.");
    }
    return { ok: true };
  });

/* ---------- sign-in activity ---------- */

function parseAgent(ua: string) {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Safari\//.test(ua)
          ? "Safari"
          : /Firefox\//.test(ua)
            ? "Firefox"
            : "Unknown browser";
  const device = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Macintosh/.test(ua)
        ? "Mac"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown device";
  return { browser, device };
}

export const recordLoginEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ method: z.enum(["password", "google", "recovery", "mfa"]).default("password") }).parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const ua = request.headers.get("user-agent") ?? "";
    const ip =
      request.headers.get("cf-connecting-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      null;
    const location =
      [request.headers.get("cf-ipcity"), request.headers.get("cf-ipcountry")].filter(Boolean).join(", ") ||
      null;
    const { browser, device } = parseAgent(ua);

    const { error } = await supabaseAdmin.from("login_events").insert({
      user_id: context.userId,
      email: (context.claims as { email?: string } | null)?.email ?? null,
      success: true,
      method: data.method,
      ip_address: ip,
      user_agent: ua.slice(0, 400) || null,
      device,
      browser,
      location,
    });
    if (error) console.error("[account.recordLoginEvent]", error);
    return { ok: true };
  });

export const listLoginHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("login_events")
      .select("id, success, method, ip_address, device, browser, location, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) {
      console.error("[account.listLoginHistory]", error);
      throw new Error("Could not load sign-in history.");
    }
    return data ?? [];
  });
