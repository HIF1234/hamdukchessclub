import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function fail(scope: string, error: unknown): never {
  console.error(`[coaching.${scope}]`, error);
  throw new Error("Something went wrong. Please try again.");
}

async function getRoles(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as string);
}

/** My own verification status and latest application, if I'm a tutor. */
export const getMyCoachStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getRoles(context.supabase, context.userId);
    if (!roles.includes("tutor")) return null;
    const [{ data: profile }, { data: application }] = await Promise.all([
      supabaseAdmin.from("profiles").select("coach_verified, coach_verified_at, coach_bio, coach_specialties").eq("id", context.userId).maybeSingle(),
      supabaseAdmin
        .from("coach_applications")
        .select("id, status, bio, specialties, submitted_at, review_note")
        .eq("user_id", context.userId)
        .order("submitted_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    return {
      verified: profile?.coach_verified ?? false,
      verified_at: profile?.coach_verified_at ?? null,
      bio: profile?.coach_bio ?? null,
      specialties: profile?.coach_specialties ?? [],
      application: application ?? null,
    };
  });

const specialtiesSchema = z.array(z.string().trim().min(1).max(40)).max(10);

export const submitCoachApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ bio: z.string().trim().min(20).max(2000), specialties: specialtiesSchema }).parse(d))
  .handler(async ({ context, data }) => {
    const roles = await getRoles(context.supabase, context.userId);
    if (!roles.includes("tutor")) throw new Error("Only tutors can apply for verification.");
    const { error } = await supabaseAdmin.from("coach_applications").insert({
      user_id: context.userId,
      bio: data.bio,
      specialties: data.specialties,
    });
    if (error) {
      if (error.message.includes("duplicate") || error.message.includes("coach_applications_one_pending")) {
        throw new Error("You already have a pending application.");
      }
      fail("submitCoachApplication", error);
    }
    return { ok: true };
  });

// SUPER ADMIN REVIEW QUEUE
export const listCoachApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const roles = await getRoles(context.supabase, context.userId);
    if (!roles.includes("super_admin")) throw new Error("Forbidden");
    const { data, error } = await supabaseAdmin
      .from("coach_applications")
      .select("id, user_id, bio, specialties, status, submitted_at, review_note")
      .order("status", { ascending: true }) // pending (alphabetically first) surfaces on top
      .order("submitted_at", { ascending: false })
      .limit(200);
    if (error) fail("listCoachApplications", error);
    const ids = Array.from(new Set((data ?? []).map((a) => a.user_id)));
    let names: Record<string, string> = {};
    if (ids.length) {
      const { data: profs } = await supabaseAdmin.from("profiles").select("id, full_name, email").in("id", ids);
      for (const p of profs ?? []) names[p.id] = p.full_name;
    }
    return (data ?? []).map((a) => ({ ...a, full_name: names[a.user_id] ?? "Unknown" }));
  });

export const decideCoachApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ application_id: z.string().uuid(), approve: z.boolean(), note: z.string().max(500).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const roles = await getRoles(context.supabase, context.userId);
    if (!roles.includes("super_admin")) throw new Error("Forbidden");
    const { data: application, error: findErr } = await supabaseAdmin
      .from("coach_applications")
      .select("id, user_id, bio, specialties, status")
      .eq("id", data.application_id)
      .maybeSingle();
    if (findErr || !application) throw new Error("Application not found");
    if (application.status !== "pending") throw new Error("This application was already decided.");

    const { error: decideErr } = await supabaseAdmin
      .from("coach_applications")
      .update({
        status: data.approve ? "approved" : "rejected",
        review_note: data.note ?? null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", application.id);
    if (decideErr) fail("decideCoachApplication.application", decideErr);

    if (data.approve) {
      const { error: profErr } = await supabaseAdmin
        .from("profiles")
        .update({
          coach_verified: true,
          coach_verified_at: new Date().toISOString(),
          coach_verified_by: context.userId,
          coach_bio: application.bio,
          coach_specialties: application.specialties,
        })
        .eq("id", application.user_id);
      if (profErr) fail("decideCoachApplication.profile", profErr);
    }
    return { ok: true };
  });
