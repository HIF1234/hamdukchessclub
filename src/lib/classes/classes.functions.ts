import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function fail(scope: string, error: unknown): never {
  console.error(`[classes.${scope}]`, error);
  throw new Error("Something went wrong. Please try again.");
}

async function loadRoles(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as string);
}

const idSchema = z.object({ class_id: z.string().uuid() });

/** Super admin, the class's own tutor, or the owner of the organization it belongs to. */
async function canManageClass(
  supabase: any,
  userId: string,
  cls: { tutor_id: string | null; organization_id: string | null },
) {
  const roles = await loadRoles(supabase, userId);
  if (roles.includes("super_admin")) return true;
  if (cls.tutor_id === userId) return true;
  if (!cls.organization_id) return false;
  const { data: org } = await supabaseAdmin
    .from("organizations")
    .select("owner_user_id")
    .eq("id", cls.organization_id)
    .maybeSingle();
  return org?.owner_user_id === userId;
}

/**
 * A class manager's view of their students' progress on the main app (play.chess) --
 * tutorials and the Course path. Both tables live in `public`, not `club`; the main app's
 * identity is the same `auth.users` row this app uses (one shared Supabase project), so a
 * plain user_id lookup across schemas works. Gated the same way getClassDetail gates its
 * participant list: only once canManageClass confirms this caller runs the class.
 */
export const getClassProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: cls, error: clsError } = await supabase
      .from("classes")
      .select("tutor_id, organization_id")
      .eq("id", data.class_id)
      .maybeSingle();
    if (clsError) fail("getClassProgress.class", clsError);
    if (!cls) throw new Error("Class not found");
    if (!(await canManageClass(supabase, userId, cls))) {
      throw new Error("Only this class's tutor or organization owner can view student progress.");
    }

    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from("class_enrollments")
      .select("user_id")
      .eq("class_id", data.class_id);
    if (enrollError) fail("getClassProgress.enrollments", enrollError);
    const studentIds = [...new Set((enrollments ?? []).map((e: any) => e.user_id as string))];
    if (studentIds.length === 0) return { students: [] };

    const publicDb = (supabaseAdmin as any).schema("public");
    const [{ data: profiles }, { data: tutorialRows }, { data: courseRows }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, full_name, email").in("id", studentIds),
      publicDb
        .from("user_tutorial_progress")
        .select("user_id, tutorial_id, completed")
        .in("user_id", studentIds),
      publicDb
        .from("user_course_progress")
        .select("user_id, unit_id, completed_at")
        .in("user_id", studentIds),
    ]);

    const students = studentIds.map((id) => {
      const profile = (profiles ?? []).find((p: any) => p.id === id);
      return {
        id,
        full_name: profile?.full_name ?? "Unknown",
        email: profile?.email ?? "",
        tutorials_completed: (tutorialRows ?? []).filter(
          (t: any) => t.user_id === id && t.completed,
        ).length,
        course_units_completed: (courseRows ?? []).filter(
          (c: any) => c.user_id === id && c.completed_at,
        ).length,
      };
    });
    return { students };
  });

export const getClassDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: cls, error } = await supabase
      .from("classes")
      .select(
        "id, title, description, level, status, starts_at, ends_at, capacity, tutor_id, organization_id, meeting_url, resources, session_notes, attendance_taken_at, created_by",
      )
      .eq("id", data.class_id)
      .maybeSingle();
    if (error) fail("getClassDetail", error);
    if (!cls) throw new Error("Class not found");

    const canManage = await canManageClass(supabase, userId, cls);

    const client = canManage ? supabaseAdmin : supabase;
    const { data: enrollments } = await client
      .from("class_enrollments")
      .select("id, user_id, attended, enrolled_at")
      .eq("class_id", data.class_id);

    let participants: Array<{
      id: string;
      full_name: string;
      email: string;
      attended: boolean;
      enrollment_id: string;
    }> = [];
    if (canManage && enrollments && enrollments.length > 0) {
      const ids = enrollments.map((e: any) => e.user_id);
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      participants = (profs ?? []).map((p: any) => {
        const en = enrollments.find((e: any) => e.user_id === p.id)!;
        return {
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          attended: !!en.attended,
          enrollment_id: en.id,
        };
      });
    }

    const enrolledMe = (enrollments ?? []).some((e: any) => e.user_id === userId);
    return {
      class: cls,
      participants,
      enrolled_count: enrollments?.length ?? 0,
      enrolled_me: enrolledMe,
      can_manage: canManage,
    };
  });

export const updateClassNotes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ class_id: z.string().uuid(), notes: z.string().max(20000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("classes")
      .update({ session_notes: data.notes })
      .eq("id", data.class_id);
    if (error) fail("updateClassNotes", error);
    return { ok: true };
  });

export const updateMeetingUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        class_id: z.string().uuid(),
        meeting_url: z.string().url().max(500).or(z.literal("")),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("classes")
      .update({ meeting_url: data.meeting_url || null })
      .eq("id", data.class_id);
    if (error) fail("updateMeetingUrl", error);
    return { ok: true };
  });

const resourceSchema = z.object({
  class_id: z.string().uuid(),
  label: z.string().min(1).max(140),
  url: z.string().url().max(500),
});

export const addClassResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => resourceSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: cls, error: rerr } = await supabase
      .from("classes")
      .select("resources")
      .eq("id", data.class_id)
      .maybeSingle();
    if (rerr) fail("addClassResource.read", rerr);
    const list = Array.isArray(cls?.resources) ? (cls!.resources as any[]) : [];
    const next = [
      ...list,
      { label: data.label, url: data.url, added_at: new Date().toISOString() },
    ];
    const { error } = await supabase
      .from("classes")
      .update({ resources: next })
      .eq("id", data.class_id);
    if (error) fail("addClassResource", error);
    return { ok: true };
  });

export const removeClassResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ class_id: z.string().uuid(), index: z.number().int().min(0).max(100) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: cls, error: rerr } = await supabase
      .from("classes")
      .select("resources")
      .eq("id", data.class_id)
      .maybeSingle();
    if (rerr) fail("removeClassResource.read", rerr);
    const list = Array.isArray(cls?.resources) ? (cls!.resources as any[]) : [];
    const next = list.filter((_, i) => i !== data.index);
    const { error } = await supabase
      .from("classes")
      .update({ resources: next })
      .eq("id", data.class_id);
    if (error) fail("removeClassResource", error);
    return { ok: true };
  });

export const setAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        class_id: z.string().uuid(),
        entries: z
          .array(z.object({ enrollment_id: z.string().uuid(), attended: z.boolean() }))
          .min(1)
          .max(500),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    for (const e of data.entries) {
      const { error } = await supabase
        .from("class_enrollments")
        .update({ attended: e.attended })
        .eq("id", e.enrollment_id)
        .eq("class_id", data.class_id);
      if (error) fail("setAttendance", error);
    }
    await supabase
      .from("classes")
      .update({ attendance_taken_at: new Date().toISOString() })
      .eq("id", data.class_id);
    return { ok: true };
  });
