import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { rateLimit } from "@/lib/cache/redis.server";

function fail(scope: string, error: unknown): never {
  console.error(`[messages.${scope}]`, error);
  throw new Error("Something went wrong. Please try again.");
}

export type MessageRow = {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
  sender_name?: string | null;
  recipient_name?: string | null;
};

// Inbox: latest message per counterpart, with their name + unread count.
export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data, error } = await supabaseAdmin
      .from("messages")
      .select("id, sender_id, recipient_id, subject, body, read_at, created_at")
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) fail("listConversations", error);
    const items = data ?? [];

    type Conv = {
      otherId: string;
      lastMessage: typeof items[number];
      unread: number;
    };
    const byOther = new Map<string, Conv>();
    for (const m of items) {
      const otherId = m.sender_id === userId ? m.recipient_id : m.sender_id;
      const existing = byOther.get(otherId);
      const isUnread = m.recipient_id === userId && !m.read_at;
      if (!existing) {
        byOther.set(otherId, { otherId, lastMessage: m, unread: isUnread ? 1 : 0 });
      } else if (isUnread) {
        existing.unread += 1;
      }
    }

    const otherIds = Array.from(byOther.keys());
    let nameMap = new Map<string, string>();
    if (otherIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name")
        .in("id", otherIds);
      nameMap = new Map((profs ?? []).map((p) => [p.id as string, (p.full_name as string) ?? "Member"]));
    }

    const conversations = Array.from(byOther.values())
      .map((c) => ({
        otherId: c.otherId,
        otherName: nameMap.get(c.otherId) ?? "Member",
        lastMessage: c.lastMessage,
        unread: c.unread,
      }))
      .sort((a, b) => b.lastMessage.created_at.localeCompare(a.lastMessage.created_at));

    return { conversations, totalUnread: conversations.reduce((s, c) => s + c.unread, 0) };
  });

export const getConversation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ otherId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: rows, error } = await supabaseAdmin
      .from("messages")
      .select("id, sender_id, recipient_id, subject, body, read_at, created_at")
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${data.otherId}),and(sender_id.eq.${data.otherId},recipient_id.eq.${userId})`,
      )
      .order("created_at", { ascending: true })
      .limit(500);
    if (error) fail("getConversation", error);

    const { data: other } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name")
      .eq("id", data.otherId)
      .maybeSingle();

    // Mark received messages as read
    await supabaseAdmin
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", userId)
      .eq("sender_id", data.otherId)
      .is("read_at", null);

    return { other, messages: rows ?? [] };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      recipientId: z.string().uuid(),
      subject: z.string().max(200).optional(),
      body: z.string().min(1).max(5000),
    }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { userId } = context;
    if (data.recipientId === userId) throw new Error("You cannot message yourself.");
    await rateLimit(userId, { name: "msg-send", limit: 30, windowSeconds: 60 });

    const { data: recipient } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", data.recipientId)
      .maybeSingle();
    if (!recipient) throw new Error("Recipient not found.");

    const { data: row, error } = await supabaseAdmin
      .from("messages")
      .insert({
        sender_id: userId,
        recipient_id: data.recipientId,
        subject: data.subject ?? null,
        body: data.body,
      })
      .select("id, created_at")
      .single();
    if (error || !row) fail("send", error);

    // Drop a notification in the recipient's inbox
    await supabaseAdmin.from("notifications").insert({
      user_id: data.recipientId,
      kind: "message",
      title: "New message",
      body: data.body.slice(0, 140),
      link: `/messages?u=${userId}`,
    });

    await supabaseAdmin.from("audit_log").insert({
      user_id: userId,
      action: "message.sent",
      target_type: "message",
      target_id: row!.id,
    });

    return { ok: true, id: row!.id };
  });

// Directory of users the caller can message. Members can DM tutors + admins.
// Tutors/admins can DM anyone (capped to 100 by name match).
export const listMessageContacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ q: z.string().max(80).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const { userId } = context;
    const { data: roleRows } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", userId);
    const roles = (roleRows ?? []).map((r) => r.role as string);
    const isStaff = roles.some((r) => ["super_admin", "school_admin", "tutor"].includes(r));

    let query = supabaseAdmin
      .from("profiles")
      .select("id, full_name, membership_level")
      .neq("id", userId)
      .eq("account_state", "active")
      .order("full_name", { ascending: true })
      .limit(100);
    if (data.q) query = query.ilike("full_name", `%${data.q}%`);

    const { data: profs, error } = await query;
    if (error) fail("listContacts", error);

    if (isStaff) return profs ?? [];

    // Members: restrict to people who hold a staff role
    const ids = (profs ?? []).map((p) => p.id as string);
    if (!ids.length) return [];
    const { data: staffRoles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("user_id", ids)
      .in("role", ["super_admin", "school_admin", "tutor"]);
    const staffIds = new Set((staffRoles ?? []).map((r) => r.user_id as string));
    return (profs ?? []).filter((p) => staffIds.has(p.id as string));
  });