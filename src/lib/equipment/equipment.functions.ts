import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function fail(scope: string, error: unknown): never {
  console.error(`[equipment.${scope}]`, error);
  throw new Error("Something went wrong. Please try again.");
}

/** Org this caller can manage equipment for: the owner, or a role_in_org of
 *  equipment_manager/staff (staff is read-only -- checked per-function below). */
async function myEquipmentOrgId(userId: string): Promise<{ id: string; canManage: boolean }> {
  const { data: owned } = await supabaseAdmin.from("organizations").select("id").eq("owner_user_id", userId).maybeSingle();
  if (owned) return { id: owned.id, canManage: true };
  const { data: membership } = await supabaseAdmin
    .from("organization_memberships")
    .select("organization_id, role_in_org")
    .eq("user_id", userId)
    .in("role_in_org", ["equipment_manager", "staff", "org_admin"])
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();
  if (!membership) throw new Error("You don't manage equipment for any organization.");
  return { id: membership.organization_id, canManage: membership.role_in_org === "equipment_manager" || membership.role_in_org === "org_admin" };
}

/** Minimal roster for the "check out to" picker -- intentionally not the full listMembers
 *  admin view, since an equipment_manager who isn't also an org_admin shouldn't need that
 *  broader power just to record who has a chess set. */
export const listOrgMembersForEquipment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { id: orgId } = await myEquipmentOrgId(context.userId);
    const { data: memberships } = await supabaseAdmin
      .from("organization_memberships")
      .select("user_id")
      .eq("organization_id", orgId);
    const ids = (memberships ?? []).map((m) => m.user_id);
    if (ids.length === 0) return [];
    const { data, error } = await supabaseAdmin.from("profiles").select("id, full_name").in("id", ids).order("full_name");
    if (error) fail("listOrgMembersForEquipment", error);
    return data ?? [];
  });

export const listEquipment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { id: orgId } = await myEquipmentOrgId(context.userId);
    const { data, error } = await supabaseAdmin
      .from("equipment")
      .select("id, name, category, condition, quantity_total, quantity_available, location, notes, created_at")
      .eq("organization_id", orgId)
      .order("name", { ascending: true });
    if (error) fail("listEquipment", error);
    return data ?? [];
  });

const equipmentSchema = z.object({
  name: z.string().trim().min(1).max(140),
  category: z.enum(["board", "clock", "pieces", "books", "other"]),
  condition: z.enum(["new", "good", "fair", "poor"]),
  quantity_total: z.number().int().min(0).max(10000),
  location: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const createEquipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => equipmentSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { id: orgId, canManage } = await myEquipmentOrgId(context.userId);
    if (!canManage) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("equipment").insert({
      organization_id: orgId,
      name: data.name,
      category: data.category,
      condition: data.condition,
      quantity_total: data.quantity_total,
      quantity_available: data.quantity_total,
      location: data.location ?? null,
      notes: data.notes ?? null,
    });
    if (error) fail("createEquipment", error);
    return { ok: true };
  });

export const updateEquipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => equipmentSchema.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { id: orgId, canManage } = await myEquipmentOrgId(context.userId);
    if (!canManage) throw new Error("Forbidden");
    const { data: current } = await supabaseAdmin.from("equipment").select("quantity_total, quantity_available").eq("id", data.id).eq("organization_id", orgId).maybeSingle();
    if (!current) throw new Error("Equipment not found");
    // Keep quantity_available consistent if the total changed (e.g. some were lost/retired).
    const delta = data.quantity_total - current.quantity_total;
    const newAvailable = Math.max(0, Math.min(data.quantity_total, current.quantity_available + delta));
    const { error } = await supabaseAdmin
      .from("equipment")
      .update({
        name: data.name,
        category: data.category,
        condition: data.condition,
        quantity_total: data.quantity_total,
        quantity_available: newAvailable,
        location: data.location ?? null,
        notes: data.notes ?? null,
      })
      .eq("id", data.id)
      .eq("organization_id", orgId);
    if (error) fail("updateEquipment", error);
    return { ok: true };
  });

export const deleteEquipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { id: orgId, canManage } = await myEquipmentOrgId(context.userId);
    if (!canManage) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("equipment").delete().eq("id", data.id).eq("organization_id", orgId);
    if (error) fail("deleteEquipment", error);
    return { ok: true };
  });

export const listCheckouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { id: orgId } = await myEquipmentOrgId(context.userId);
    const { data, error } = await supabaseAdmin
      .from("equipment_checkouts")
      .select("id, equipment_id, checked_out_to, quantity, checked_out_at, due_at, returned_at")
      .eq("organization_id", orgId)
      .is("returned_at", null)
      .order("checked_out_at", { ascending: false });
    if (error) fail("listCheckouts", error);
    const equipmentIds = Array.from(new Set((data ?? []).map((c) => c.equipment_id)));
    const userIds = Array.from(new Set((data ?? []).map((c) => c.checked_out_to)));
    const [{ data: items }, { data: profs }] = await Promise.all([
      equipmentIds.length ? supabaseAdmin.from("equipment").select("id, name").in("id", equipmentIds) : Promise.resolve({ data: [] as { id: string; name: string }[] }),
      userIds.length ? supabaseAdmin.from("profiles").select("id, full_name").in("id", userIds) : Promise.resolve({ data: [] as { id: string; full_name: string }[] }),
    ]);
    const itemName: Record<string, string> = {};
    for (const i of items ?? []) itemName[i.id] = i.name;
    const userName: Record<string, string> = {};
    for (const p of profs ?? []) userName[p.id] = p.full_name;
    return (data ?? []).map((c) => ({
      ...c,
      equipment_name: itemName[c.equipment_id] ?? "Unknown",
      checked_out_to_name: userName[c.checked_out_to] ?? "Unknown",
    }));
  });

export const checkOutEquipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ equipment_id: z.string().uuid(), checked_out_to: z.string().uuid(), quantity: z.number().int().min(1).max(10000), due_at: z.string().optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { id: orgId, canManage } = await myEquipmentOrgId(context.userId);
    if (!canManage) throw new Error("Forbidden");
    const { data: item } = await supabaseAdmin.from("equipment").select("quantity_available").eq("id", data.equipment_id).eq("organization_id", orgId).maybeSingle();
    if (!item) throw new Error("Equipment not found");
    if (item.quantity_available < data.quantity) throw new Error("Not enough available to check out.");
    const { error: coErr } = await supabaseAdmin.from("equipment_checkouts").insert({
      equipment_id: data.equipment_id,
      organization_id: orgId,
      checked_out_to: data.checked_out_to,
      quantity: data.quantity,
      checked_out_by: context.userId,
      due_at: data.due_at ?? null,
    });
    if (coErr) fail("checkOutEquipment.checkout", coErr);
    const { error: eqErr } = await supabaseAdmin
      .from("equipment")
      .update({ quantity_available: item.quantity_available - data.quantity })
      .eq("id", data.equipment_id);
    if (eqErr) fail("checkOutEquipment.equipment", eqErr);
    return { ok: true };
  });

export const returnEquipment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ checkout_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { id: orgId, canManage } = await myEquipmentOrgId(context.userId);
    if (!canManage) throw new Error("Forbidden");
    const { data: checkout } = await supabaseAdmin
      .from("equipment_checkouts")
      .select("id, equipment_id, quantity, returned_at")
      .eq("id", data.checkout_id)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!checkout) throw new Error("Checkout not found");
    if (checkout.returned_at) throw new Error("Already returned");
    const { data: item } = await supabaseAdmin.from("equipment").select("quantity_available, quantity_total").eq("id", checkout.equipment_id).maybeSingle();
    if (!item) throw new Error("Equipment not found");
    const { error: retErr } = await supabaseAdmin
      .from("equipment_checkouts")
      .update({ returned_at: new Date().toISOString() })
      .eq("id", checkout.id);
    if (retErr) fail("returnEquipment.checkout", retErr);
    const { error: eqErr } = await supabaseAdmin
      .from("equipment")
      .update({ quantity_available: Math.min(item.quantity_total, item.quantity_available + checkout.quantity) })
      .eq("id", checkout.equipment_id);
    if (eqErr) fail("returnEquipment.equipment", eqErr);
    return { ok: true };
  });
