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
    let memberIds: string[] | null = null;
    if (!roles.includes("super_admin")) {
      const { data: school } = await supabaseAdmin.from("schools").select("id").eq("owner_user_id", userId).maybeSingle();
      if (!school) return [];
      const { data: memberships, error: membershipError } = await supabase
        .from("school_memberships")
        .select("user_id")
        .eq("school_id", school.id);
      if (membershipError) fail("listMembers.memberships", membershipError);
      memberIds = (memberships ?? []).map((membership) => membership.user_id);
      if (memberIds.length === 0) return [];
    }
    const client = roles.includes("super_admin") ? supabaseAdmin : supabaseAdmin;
    let query = client
      .from("profiles")
      .select("id, full_name, email, account_state, membership_level, chess_rating, membership_expires_at, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (memberIds) query = query.in("id", memberIds);
    const { data, error } = await query;
    if (error) fail("listMembers", error);
    return data ?? [];
  });

export const updateMemberState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid(), account_state: z.enum(["active", "suspended", "expired"]) }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const roles = await getRoles(supabase, userId);
    if (!roles.includes("super_admin") && !roles.includes("school_admin")) throw new Error("Forbidden");
    if (roles.includes("school_admin") && !roles.includes("super_admin")) {
      const { data: school } = await supabaseAdmin.from("schools").select("id").eq("owner_user_id", userId).maybeSingle();
      const { data: membership } = school ? await supabase.from("school_memberships").select("id").eq("school_id", school.id).eq("user_id", data.user_id).maybeSingle() : { data: null };
      if (!membership) throw new Error("You can only manage members in your school.");
    }
    const { error } = await supabaseAdmin.from("profiles").update({ account_state: data.account_state }).eq("id", data.user_id);
    if (error) fail("updateMemberState", error);
    return { ok: true };
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

export const toggleSchoolSuspension = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ school_id: z.string().uuid(), suspended: z.boolean() }).parse(d))
  .handler(async ({ context, data }) => {
    const roles = await getRoles(context.supabase, context.userId);
    if (!roles.includes("super_admin")) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("schools").update({ is_suspended: data.suspended, suspended_reason: data.suspended ? "Suspended by an administrator" : null }).eq("id", data.school_id);
    if (error) fail("toggleSchoolSuspension", error);
    return { ok: true };
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
    const { data: cls, error: classError } = await supabase
      .from("classes")
      .select("capacity, status")
      .eq("id", data.class_id)
      .maybeSingle();
    if (classError) fail("enrollInClass.read", classError);
    if (!cls) throw new Error("Class not found");
    if (cls.status === "cancelled" || cls.status === "completed") throw new Error("This class is no longer open for enrolment.");
    const { count, error: countError } = await supabase
      .from("class_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("class_id", data.class_id);
    if (countError) fail("enrollInClass.count", countError);
    if (cls.capacity !== null && (count ?? 0) >= cls.capacity) throw new Error("This class is full.");
    const { error } = await supabase
      .from("class_enrollments")
      .insert({ class_id: data.class_id, user_id: userId });
    if (error) fail("enrollInClass", error);
    return { ok: true };
  });

export const unenrollFromClass = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ class_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("class_enrollments").delete().eq("class_id", data.class_id).eq("user_id", context.userId);
    if (error) fail("unenrollFromClass", error);
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
    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("max_participants, status")
      .eq("id", data.tournament_id)
      .maybeSingle();
    if (tournamentError) fail("registerForTournament.read", tournamentError);
    if (!tournament) throw new Error("Tournament not found");
    if (tournament.status !== "registration_open") throw new Error("Registration is closed.");
    const { count, error: countError } = await supabase
      .from("tournament_participants")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", data.tournament_id);
    if (countError) fail("registerForTournament.count", countError);
    if (tournament.max_participants !== null && (count ?? 0) >= tournament.max_participants) throw new Error("This tournament is full.");
    const { error } = await supabase
      .from("tournament_participants")
      .insert({ tournament_id: data.tournament_id, user_id: userId });
    if (error) fail("registerForTournament", error);
    return { ok: true };
  });

export const withdrawFromTournament = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ tournament_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("tournament_participants").delete().eq("tournament_id", data.tournament_id).eq("user_id", context.userId);
    if (error) fail("withdrawFromTournament", error);
    return { ok: true };
  });