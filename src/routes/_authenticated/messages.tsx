import { useState, useMemo } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  listConversations,
  getConversation,
  sendMessage,
  listMessageContacts,
} from "@/lib/messages/messages.functions";
import { MessageSquare, Send, Search, Plus } from "lucide-react";
import { toast } from "sonner";

const searchSchema = z.object({ u: z.string().uuid().optional() });

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Messages — Hamduk Chess Club" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { u: activeId } = useSearch({ from: "/_authenticated/messages" });
  const [selectedId, setSelectedId] = useState<string | null>(activeId ?? null);
  const [composeOpen, setComposeOpen] = useState(false);

  const qc = useQueryClient();
  const fetchConvs = useServerFn(listConversations);
  const fetchConv = useServerFn(getConversation);
  const send = useServerFn(sendMessage);

  const { data: convData } = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: () => fetchConvs(),
    refetchInterval: 15_000,
  });
  const conversations = convData?.conversations ?? [];
  const currentId = selectedId ?? conversations[0]?.otherId ?? null;

  const { data: convo } = useQuery({
    queryKey: ["messages", "thread", currentId],
    queryFn: () => fetchConv({ data: { otherId: currentId! } }),
    enabled: !!currentId,
    refetchInterval: 10_000,
  });

  const [draft, setDraft] = useState("");
  const sendMut = useMutation({
    mutationFn: (vars: { recipientId: string; body: string }) =>
      send({ data: { recipientId: vars.recipientId, body: vars.body } }),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send"),
  });

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Conversations</p>
          <h1 className="mt-2 font-display text-4xl">Messages</h1>
          <p className="text-sm text-muted-foreground mt-2">Direct messages with tutors, admins and the club.</p>
        </div>
        <Button onClick={() => setComposeOpen(true)}><Plus className="size-4 mr-2" /> New message</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        <Card className="p-2 max-h-[70vh] overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              <MessageSquare className="size-6 mx-auto mb-2 opacity-60" />
              No conversations yet.
            </div>
          ) : (
            conversations.map((c) => {
              const active = c.otherId === currentId;
              return (
                <button
                  key={c.otherId}
                  onClick={() => setSelectedId(c.otherId)}
                  className={`w-full text-left rounded-md px-3 py-2 mb-1 transition-colors ${
                    active ? "bg-primary/10 border border-primary/30" : "hover:bg-sidebar-accent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium truncate">{c.otherName}</div>
                    {c.unread > 0 && <Badge className="bg-primary text-primary-foreground">{c.unread}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{c.lastMessage.body}</div>
                </button>
              );
            })
          )}
        </Card>

        <Card className="flex flex-col max-h-[70vh]">
          {!currentId ? (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground">
              Select a conversation, or start a new one.
            </div>
          ) : (
            <>
              <div className="border-b border-border/50 px-4 py-3">
                <div className="font-medium">{convo?.other?.full_name ?? "Conversation"}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(convo?.messages ?? []).map((m) => {
                  const mine = m.sender_id !== currentId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                        <div className="whitespace-pre-wrap break-words">{m.body}</div>
                        <div className={`text-[10px] mt-1 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {new Date(m.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                className="border-t border-border/50 p-3 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!draft.trim() || !currentId) return;
                  sendMut.mutate({ recipientId: currentId, body: draft.trim() });
                }}
              >
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  rows={2}
                  className="resize-none"
                />
                <Button type="submit" disabled={!draft.trim() || sendMut.isPending}>
                  <Send className="size-4" />
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>

      {composeOpen && (
        <ComposeDialog
          onClose={() => setComposeOpen(false)}
          onPick={(id) => {
            setSelectedId(id);
            setComposeOpen(false);
          }}
        />
      )}
    </DashboardShell>
  );
}

function ComposeDialog({ onClose, onPick }: { onClose: () => void; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const fetchContacts = useServerFn(listMessageContacts);
  const { data } = useQuery({
    queryKey: ["messages", "contacts", q],
    queryFn: () => fetchContacts({ data: { q: q || undefined } }),
  });
  const items = useMemo(() => data ?? [], [data]);

  return (
    <div className="fixed inset-0 z-50 bg-background/70 backdrop-blur grid place-items-center p-4" onClick={onClose}>
      <Card className="w-full max-w-md p-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-xl">Start a conversation</h2>
        <p className="text-xs text-muted-foreground mt-1">Members can message tutors and admins. Staff can message anyone.</p>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name…" className="pl-9" />
        </div>
        <div className="mt-3 max-h-72 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">No matching contacts.</div>
          ) : (
            items.map((p) => (
              <button
                key={p.id as string}
                onClick={() => onPick(p.id as string)}
                className="w-full text-left px-3 py-2 rounded-md hover:bg-sidebar-accent"
              >
                <div className="font-medium">{(p.full_name as string) ?? "Member"}</div>
                {p.membership_level && <div className="text-xs text-muted-foreground capitalize">{p.membership_level as string}</div>}
              </button>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}