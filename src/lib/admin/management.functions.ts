import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function fail(scope: string, error: unknown): never {
  console.error(`[admin.${scope}]`, error);
  throw new Error("Something went wrong. Please try again.");
}

async function getRoles(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as string);
}

// MEMBERS
export const listMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const roles = await getRoles(supabase, userId);
    if (!roles.includes("super_admin") && !roles.includes("school_admin")) {
      throw new Error("Forbidden");
    }
    const client = roles.includes("super_admin") ? supabaseAdmin : supabase;
    const { data, error } = await client
      .from("profiles")
      .select("id, full_name, email, account_state, membership_level, chess_rating, membership_expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) fail("listMembers", error);
    return data ?? [];
  });

// SCHOOLS
export const listSchools = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const roles = await getRoles(supabase, userId);
    if (!roles.includes("super_admin")) throw new Error("Forbidden");
    const { data, error } = await supabaseAdmin
      .from("schools")
      .select("id, name, contact_email, contact_person, student_count, subscription_status, program_tier, is_suspended, created_at")
      .order("created_at", { ascending: false });
    if (error) fail("listSchools", error);
    return data ?? [];
  });

// TUTORS — users with tutor role
export const listTutors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const roles = await getRoles(supabase, userId);
    if (!roles.includes("super_admin") && !roles.includes("school_admin")) {
      throw new Error("Forbidden");
    }
    const { data: tutorRoleRows, error: tutorErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "tutor");
    if (tutorErr) fail("listTutors.roles", tutorErr);
    const ids = (tutorRoleRows ?? []).map((r) => r.user_id);
    if (ids.length === 0) return [];
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, chess_rating, created_at")
      .in("id", ids);
    if (error) fail("listTutors", error);
    return data ?? [];
  });

// CLASSES
export const listClasses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("classes")
      .select("id, title, description, tutor_id, school_id, level, status, starts_at, ends_at, capacity")
      .order("starts_at", { ascending: true })
      .limit(200);
    if (error) fail("listClasses", error);
    return data ?? [];
  });

const createClassSchema = z.object({
  title: z.string().min(2).max(140),
  description: z.string().max(2000).optional(),
  level: z.enum(["beginner", "intermediate", "advanced", "all_levels"]),
  starts_at: z.string().min(1),
  ends_at: z.string().optional(),
  capacity: z.number().int().min(1).max(500).optional(),
  school_id: z.string().uuid().optional(),
  tutor_id: z.string().uuid().optional(),
});

export const createClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createClassSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const roles = await getRoles(supabase, userId);
    if (!roles.includes("super_admin") && !roles.includes("school_admin")) {
      throw new Error("Forbidden");
    }
    const { data: created, error } = await supabase
      .from("classes")
      .insert({ ...data, created_by: userId })
      .select()
      .single();
    if (error) fail("createClass", error);
    return created;
  });

export const enrollInClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ class_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("class_enrollments")
      .insert({ class_id: data.class_id, user_id: userId });
    if (error) fail("enrollInClass", error);
    return { ok: true };
  });

// TOURNAMENTS
export const listTournaments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("tournaments")
      .select("id, name, description, format, status, starts_at, ends_at, max_participants, rounds, school_id")
      .order("starts_at", { ascending: true })
      .limit(200);
    if (error) fail("listTournaments", error);
    return data ?? [];
  });

const createTournamentSchema = z.object({
  name: z.string().min(2).max(140),
  description: z.string().max(2000).optional(),
  format: z.enum(["swiss", "round_robin", "knockout", "arena"]),
  starts_at: z.string().min(1),
  ends_at: z.string().optional(),
  max_participants: z.number().int().min(2).max(1000).optional(),
  rounds: z.number().int().min(1).max(50).optional(),
  school_id: z.string().uuid().optional(),
});

export const createTournament = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createTournamentSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const roles = await getRoles(supabase, userId);
    if (!roles.includes("super_admin") && !roles.includes("school_admin")) {
      throw new Error("Forbidden");
    }
    const { data: created, error } = await supabase
      .from("tournaments")
      .insert({ ...data, status: "registration_open", created_by: userId })
      .select()
      .single();
    if (error) fail("createTournament", error);
    return created;
  });

export const registerForTournament = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tournament_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("tournament_participants")
      .insert({ tournament_id: data.tournament_id, user_id: userId });
    if (error) fail("registerForTournament", error);
    return { ok: true };
  });