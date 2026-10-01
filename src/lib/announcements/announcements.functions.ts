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
      .select("id, title, body, audience, organization_id, pinned, published_at, expires_at, created_by, created_at")
      .order("pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(100);
    if (error) fail("list", error);
    return data ?? [];
  });

const createSchema = z.object({
  title: z.string().min(2).max(160),
  body: z.string().min(2).max(4000),
  audience: z.enum(["all", "organization", "members", "tutors", "org_admins"]),
  organization_id: z.string().uuid().optional().nullable(),
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
    let orgId = data.organization_id ?? null;
    if (!isSuper) {
      if (data.audience !== "organization") {
        throw new Error("Only super admins can post non-organization announcements");
      }
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("owner_user_id")
        .eq("id", data.organization_id)
        .maybeSingle();
      if (data.organization_id && org?.owner_user_id === userId) {
        orgId = data.organization_id;
      } else {
        const { data: ownedOrg } = await supabaseAdmin
          .from("organizations")
          .select("id")
          .eq("owner_user_id", userId)
          .maybeSingle();
        if (!ownedOrg) throw new Error("No organization is assigned to this account.");
        orgId = ownedOrg.id;
      }
    }
    const { data: created, error } = await supabaseAdmin
      .from("announcements")
      .insert({
        title: data.title,
        body: data.body,
        audience: data.audience,
        organization_id: orgId,
        pinned: data.pinned ?? false,
        expires_at: data.expires_at || null,
        created_by: userId,
      })
      .select()
      .single();
    if (error) fail("create", error);
    return created;
  });

const updateSchema = createSchema.extend({ id: z.string().uuid() });

export const updateAnnouncement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => updateSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const roles = await getRoles(supabase, userId);
    const { data: existing, error: readError } = await supabaseAdmin
      .from("announcements")
      .select("created_by, organization_id")
      .eq("id", data.id)
      .maybeSingle();
    if (readError) fail("update.read", readError);
    if (!existing) throw new Error("Announcement not found");
    if (roles.includes("super_admin")) {
      // Super admins can edit every announcement.
    } else if (existing.created_by !== userId) {
      throw new Error("Forbidden");
    }
    const { data: updated, error } = await supabaseAdmin
      .from("announcements")
      .update({
        title: data.title,
        body: data.body,
        audience: data.audience,
        organization_id: data.organization_id ?? existing.organization_id,
        pinned: data.pinned ?? false,
        expires_at: data.expires_at || null,
      })
      .eq("id", data.id)
      .select()
      .single();
    if (error) fail("update", error);
    return updated;
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