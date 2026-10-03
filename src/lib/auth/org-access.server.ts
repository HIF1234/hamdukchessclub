import { supabaseAdmin } from "@/integrations/supabase/client.server";

/** The org this caller administers: the billing owner, or an approved org_admin membership
 *  (M0, product spec FND-6/7 -- multi-admin per org). If they administer more than one (owner
 *  of one, org_admin of another), this picks owned-first -- a full org switcher (spec FND-1)
 *  is a separate, not-yet-built piece; this is the interim single-org-context behavior the
 *  rest of the admin pages already assume. Throws if they administer none. */
export async function requireAdminOrgId(userId: string): Promise<string> {
  const { data: owned } = await supabaseAdmin.from("organizations").select("id").eq("owner_user_id", userId).maybeSingle();
  if (owned) return owned.id;
  const { data: membership } = await supabaseAdmin
    .from("organization_memberships")
    .select("organization_id")
    .eq("user_id", userId)
    .eq("role_in_org", "org_admin")
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();
  if (!membership) throw new Error("You don't administer any organization.");
  return membership.organization_id;
}

/** True if this caller administers this specific org -- the owner, or an approved org_admin
 *  membership there. Use this (not requireAdminOrgId) when the org is already known from the
 *  request and you just need to authorize it. */
export async function isOrgAdminOf(userId: string, organizationId: string): Promise<boolean> {
  const { data: owned } = await supabaseAdmin
    .from("organizations")
    .select("id")
    .eq("id", organizationId)
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (owned) return true;
  const { data: membership } = await supabaseAdmin
    .from("organization_memberships")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("role_in_org", "org_admin")
    .eq("status", "approved")
    .maybeSingle();
  return !!membership;
}
