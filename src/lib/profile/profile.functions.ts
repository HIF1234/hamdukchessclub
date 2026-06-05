import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error("Could not load profile.");
    return data;
  });

const updateSchema = z.object({
  full_name: z.string().min(1).max(120),
  phone: z.string().max(40).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  chess_goals: z.string().max(500).optional().nullable(),
  timezone: z.string().max(80).optional().nullable(),
  language: z.string().max(20).optional().nullable(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone ?? null,
        location: data.location ?? null,
        bio: data.bio ?? null,
        chess_goals: data.chess_goals ?? null,
        timezone: data.timezone ?? undefined,
        language: data.language ?? undefined,
      })
      .eq("id", userId);
    if (error) throw new Error("Could not save profile.");
    return { ok: true };
  });

// GDPR-style export: collect every row that belongs to the caller across
// the user-facing tables and return a single JSON blob.
export const exportMyData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const [profile, roles, payments, enrollments, participants, notifications, schools] = await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabaseAdmin.from("user_roles").select("role, created_at").eq("user_id", userId),
      supabaseAdmin.from("payments").select("*").eq("user_id", userId),
      supabaseAdmin.from("class_enrollments").select("*").eq("user_id", userId),
      supabaseAdmin.from("tournament_participants").select("*").eq("user_id", userId),
      supabaseAdmin.from("notifications").select("*").eq("user_id", userId),
      supabaseAdmin.from("schools").select("*").eq("owner_user_id", userId),
    ]);
    return {
      exported_at: new Date().toISOString(),
      profile: profile.data,
      roles: roles.data ?? [],
      payments: payments.data ?? [],
      class_enrollments: enrollments.data ?? [],
      tournament_participants: participants.data ?? [],
      notifications: notifications.data ?? [],
      schools_owned: schools.data ?? [],
    };
  });

// Soft-delete request: marks the account suspended and writes an audit
// entry. A real deletion runs out-of-band by an admin.
export const requestAccountDeletion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ account_state: "suspended" })
      .eq("id", userId);
    if (error) throw new Error("Could not submit deletion request.");
    await supabaseAdmin.from("audit_log").insert({
      user_id: userId,
      action: "account.deletion_requested",
      target_type: "profile",
      target_id: userId,
    });
    return { ok: true };
  });