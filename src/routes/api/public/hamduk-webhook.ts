import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function verify(body: string, header: string | null, secret: string | undefined): boolean {
  if (!header || !secret) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const provided = header.replace(/^sha256=/, "");
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Verifies against a single static secret (HAMDUK_CHESS_WEBHOOK_SECRET) instead of a
// DB-registered list -- the dynamic multi-webhook registration this used to support
// (hamduk_webhooks) was retired along with the rest of the account-linking bridge; one
// static secret, configured once on both sides, is enough for the two events this handles.
export const Route = createFileRoute("/api/public/hamduk-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const signature =
          request.headers.get("x-hamduk-signature") ?? request.headers.get("x-signature");
        const secret = process.env["HAMDUK_CHESS_WEBHOOK_SECRET"];

        if (!verify(body, signature, secret)) return new Response("Invalid signature", { status: 401 });

        let payload: { event?: string; data?: Record<string, any> };
        try {
          payload = JSON.parse(body);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const event = payload.event ?? "unknown";

        try {
          if (event === "tournament.round_complete") {
            const remoteId = payload.data?.["tournament_id"] as string | undefined;
            const round = payload.data?.["round"] as number | undefined;
            if (remoteId) {
              await supabaseAdmin.from("audit_log").insert({
                action: "hamduk.tournament.round_complete",
                target_type: "tournament",
                target_id: remoteId,
                metadata: { round, standings: payload.data?.["standings"] ?? null },
              });
            }
          }

          if (event === "class.session_started") {
            const sessionId = payload.data?.["session_id"] as string | undefined;
            const classId = payload.data?.["class_id"] as string | undefined;
            const joinUrl = payload.data?.["join_url"] as string | undefined;
            if (classId && joinUrl) {
              await supabaseAdmin.from("classes").update({ meeting_url: joinUrl }).eq("id", classId);
              const { data: enrolled } = await supabaseAdmin
                .from("class_enrollments")
                .select("user_id")
                .eq("class_id", classId);
              if (enrolled?.length) {
                await supabaseAdmin.from("notifications").insert(
                  enrolled.map((e: any) => ({
                    user_id: e.user_id,
                    kind: "class",
                    title: "Your class session is live",
                    body: "The tutor has started the session. Join now.",
                    link: `/classes/${classId}`,
                    metadata: { session_id: sessionId ?? null },
                  })),
                );
              }
            }
          }
        } catch (e) {
          console.error("[hamduk-webhook] handler failed", e);
          return new Response("Internal error", { status: 500 });
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});