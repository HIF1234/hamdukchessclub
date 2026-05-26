import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const memberSchema = z.object({
  full_name: z.string().min(1).max(120),
  phone: z.string().max(40).optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  gender: z.string().max(40).optional().nullable(),
  location: z.string().max(120).optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  chess_rating: z.number().int().min(0).max(3500).optional(),
  membership_level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  chess_goals: z.string().max(500).optional().nullable(),
  timezone: z.string().max(80).optional().nullable(),
  language: z.string().max(20).optional().nullable(),
  onboarding_step: z.number().int().min(0).max(10),
  onboarding_completed: z.boolean().optional(),
});

export const saveOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => memberSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        full_name: data.full_name,
        phone: data.phone ?? null,
        date_of_birth: data.date_of_birth || null,
        gender: data.gender ?? null,
        location: data.location ?? null,
        bio: data.bio ?? null,
        chess_rating: data.chess_rating ?? undefined,
        membership_level: data.membership_level ?? undefined,
        chess_goals: data.chess_goals ?? null,
        timezone: data.timezone ?? undefined,
        language: data.language ?? undefined,
        onboarding_step: data.onboarding_step,
        onboarding_completed: data.onboarding_completed ?? false,
      })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const schoolSchema = z.object({
  name: z.string().min(1).max(200),
  contact_person: z.string().max(120).optional().nullable(),
  contact_email: z.string().email().optional().nullable(),
  contact_phone: z.string().max(40).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  student_count: z.number().int().min(0).max(100000).optional(),
});

export const upsertSchool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => schoolSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: existing } = await supabaseAdmin
      .from("schools")
      .select("id")
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from("schools")
        .update({
          name: data.name,
          contact_person: data.contact_person ?? null,
          contact_email: data.contact_email ?? null,
          contact_phone: data.contact_phone ?? null,
          address: data.address ?? null,
          student_count: data.student_count ?? null,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { schoolId: existing.id };
    }

    const { data: created, error } = await supabaseAdmin
      .from("schools")
      .insert({
        name: data.name,
        owner_user_id: userId,
        contact_person: data.contact_person ?? null,
        contact_email: data.contact_email ?? null,
        contact_phone: data.contact_phone ?? null,
        address: data.address ?? null,
        student_count: data.student_count ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { schoolId: created.id };
  });