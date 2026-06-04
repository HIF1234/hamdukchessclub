import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function fail(scope: string, error: unknown): never {
  console.error(`[announcements.${scope}]`, error);
  throw new Error("Something went wrong. Please try again.");
}

async function getRoles(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.role as string);
}

export const listAnnouncements = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, body, audience, school_id, pinned, published_at, expires_at, created_by, created_at")
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(100);
    if (error) fail("list", error);
    return data ?? [];
  });

const createSchema = z.object({
  title: z.string().min(2).max(160),
  body: z.string().min(2).max(4000),
  audience: z.enum(["all", "school", "members", "tutors", "school_admins"]),
  school_id: z.string().uuid().optional().nullable(),
  pinned: z.boolean().optional(),
  expires_at: z.string().optional().nullable(),
});

export const createAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => createSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const roles = await getRoles(supabase, userId);
    const isSuper = roles.includes("super_admin");
    if (!isSuper) {
      if (data.audience !== "school" || !data.school_id) {
        throw new Error("Only super admins can post non-school announcements");
      }
      const { data: school } = await supabaseAdmin
        .from("schools")
        .select("owner_user_id")
        .eq("id", data.school_id)
        .maybeSingle();
      if (!school || school.owner_user_id !== userId) {
        throw new Error("Forbidden");
      }
    }
    const { data: created, error } = await supabaseAdmin
      .from("announcements")
      .insert({
        title: data.title,
        body: data.body,
        audience: data.audience,
        school_id: data.school_id ?? null,
        pinned: data.pinned ?? false,
        expires_at: data.expires_at || null,
        created_by: userId,
      })
      .select()
      .single();
    if (error) fail("create", error);
    return created;
  });

export const deleteAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("announcements").delete().eq("id", data.id);
    if (error) fail("delete", error);
    return { ok: true };
  });