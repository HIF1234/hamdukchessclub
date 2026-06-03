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

export const getClassDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => idSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: cls, error } = await supabase
      .from("classes")
      .select("id, title, description, level, status, starts_at, ends_at, capacity, tutor_id, school_id, meeting_url, resources, session_notes, attendance_taken_at, created_by")
      .eq("id", data.class_id)
      .maybeSingle();
    if (error) fail("getClassDetail", error);
    if (!cls) throw new Error("Class not found");

    const roles = await loadRoles(supabase, userId);
    const isSuper = roles.includes("super_admin");
    const isTutor = cls.tutor_id === userId;
    let isSchoolOwner = false;
    if (cls.school_id) {
      const { data: s } = await supabaseAdmin
        .from("schools")
        .select("owner_user_id")
        .eq("id", cls.school_id)
        .maybeSingle();
      isSchoolOwner = s?.owner_user_id === userId;
    }
    const canManage = isSuper || isTutor || isSchoolOwner;

    const client = canManage ? supabaseAdmin : supabase;
    const { data: enrollments } = await client
      .from("class_enrollments")
      .select("id, user_id, attended, enrolled_at")
      .eq("class_id", data.class_id);

    let participants: Array<{ id: string; full_name: string; email: string; attended: boolean; enrollment_id: string }> = [];
    if (canManage && enrollments && enrollments.length > 0) {
      const ids = enrollments.map((e: any) => e.user_id);
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      participants = (profs ?? []).map((p: any) => {
        const en = enrollments.find((e: any) => e.user_id === p.id)!;
        return { id: p.id, full_name: p.full_name, email: p.email, attended: !!en.attended, enrollment_id: en.id };
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
  .inputValidator((d) => z.object({ class_id: z.string().uuid(), notes: z.string().max(20000) }).parse(d))
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
  .inputValidator((d) => z.object({ class_id: z.string().uuid(), meeting_url: z.string().url().max(500).or(z.literal("")) }).parse(d))
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
    const next = [...list, { label: data.label, url: data.url, added_at: new Date().toISOString() }];
    const { error } = await supabase
      .from("classes")
      .update({ resources: next })
      .eq("id", data.class_id);
    if (error) fail("addClassResource", error);
    return { ok: true };
  });

export const removeClassResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ class_id: z.string().uuid(), index: z.number().int().min(0).max(100) }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: cls, error: rerr } = await supabase
      .from("classes").select("resources").eq("id", data.class_id).maybeSingle();
    if (rerr) fail("removeClassResource.read", rerr);
    const list = Array.isArray(cls?.resources) ? (cls!.resources as any[]) : [];
    const next = list.filter((_, i) => i !== data.index);
    const { error } = await supabase.from("classes").update({ resources: next }).eq("id", data.class_id);
    if (error) fail("removeClassResource", error);
    return { ok: true };
  });

export const setAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    class_id: z.string().uuid(),
    entries: z.array(z.object({ enrollment_id: z.string().uuid(), attended: z.boolean() })).min(1).max(500),
  }).parse(d))
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