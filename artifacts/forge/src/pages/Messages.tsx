import { AppShell } from "@/components/layout/AppShell";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { portalApi, type MessagesResponse, type MessageThread } from "@/lib/api";
import { Send, Shield, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Messages() {
  const qc = useQueryClient();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const { data: listData } = useQuery<MessagesResponse>({
    queryKey: ["forge-portal", "messages"],
    queryFn: () => portalApi.getMessages(),
    retry: 1,
  });

  const threads = listData?.threads ?? [];
  const totalUnread = listData?.totalUnread ?? 0;
  const activeThreadId = selectedThreadId ?? threads[0]?.id ?? null;

  const { data: threadData } = useQuery<MessageThread>({
    queryKey: ["forge-portal", "thread", activeThreadId],
    queryFn: () => portalApi.getThread(activeThreadId!),
    enabled: !!activeThreadId,
    retry: 1,
  });

  const replyMutation = useMutation({
    mutationFn: (content: string) => portalApi.replyToThread(activeThreadId!, content),
    onSuccess: () => {
      setDraft("");
      qc.invalidateQueries({ queryKey: ["forge-portal", "messages"] });
      qc.invalidateQueries({ queryKey: ["forge-portal", "thread", activeThreadId] });
    },
  });

  const sendMessage = () => {
    if (!draft.trim() || !activeThreadId) return;
    replyMutation.mutate(draft.trim());
  };

  const messages = threadData?.messages ?? [];

  return (
    <AppShell title="Secure Messaging" subtitle="Private communication with your SZL relationship team">
      <div className="p-6 max-w-5xl mx-auto flex gap-4" style={{ height: "calc(100vh - 72px)" }}>

        {/* Thread list */}
        <div className="w-64 flex-shrink-0 space-y-2 overflow-y-auto">
          <div className="forge-eyebrow mb-3 flex items-center gap-2">
            Threads
            {totalUnread > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[0.625rem] font-700 text-white" style={{ background: "var(--color-forge-primary)" }}>{totalUnread}</span>
            )}
          </div>
          {threads.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedThreadId(t.id)}
              className={cn("w-full text-left forge-card-elevated p-3 transition-all")}
              style={{
                borderColor: activeThreadId === t.id ? "var(--color-forge-primary)" : undefined,
                boxShadow: activeThreadId === t.id ? "0 0 0 2px var(--color-forge-primary-muted)" : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className="text-xs font-600 leading-tight" style={{ color: "var(--color-forge-text)" }}>{t.subject}</span>
                {t.unreadCount > 0 && (
                  <span className="w-4 h-4 rounded-full text-[0.5rem] font-700 text-white flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-forge-primary)" }}>{t.unreadCount}</span>
                )}
              </div>
              {t.lastMessage && (
                <p className="text-[0.6875rem] line-clamp-2" style={{ color: "var(--color-forge-text-muted)" }}>{t.lastMessage.content}</p>
              )}
            </button>
          ))}
        </div>

        {/* Active thread */}
        <div className="forge-card-elevated flex-1 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
          {/* Thread header */}
          <div className="px-5 py-4 border-b flex items-center gap-3" style={{ borderColor: "var(--color-forge-border)" }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-700" style={{ background: "var(--color-forge-primary)" }}>SZ</div>
            <div>
              <div className="text-sm font-600" style={{ color: "var(--color-forge-text)", fontFamily: "var(--font-display)" }}>
                {threadData?.subject ?? "Select a thread"}
              </div>
              <div className="text-xs flex items-center gap-1.5" style={{ color: "var(--color-forge-success)" }}>
                <Shield className="w-3 h-3" />
                End-to-end encrypted · Full audit trail
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={cn("flex gap-3 animate-fade-in", msg.isClient ? "flex-row-reverse" : "flex-row")}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-700 flex-shrink-0 self-end"
                  style={{ background: msg.isClient ? "var(--color-forge-gold)" : "var(--color-forge-primary)" }}
                >
                  {msg.from.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className={cn("max-w-[70%] space-y-1", msg.isClient ? "items-end" : "items-start")} style={{ display: "flex", flexDirection: "column" }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {!msg.isClient && (
                      <span className="text-xs font-600" style={{ color: "var(--color-forge-text)" }}>{msg.from}</span>
                    )}
                    <span className="text-[0.6875rem]" style={{ color: "var(--color-forge-text-faint)", fontFamily: "var(--font-mono)" }}>
                      {new Date(msg.timestamp).toLocaleString()}
                    </span>
                    {!msg.read && !msg.isClient && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-forge-primary)" }} />
                    )}
                  </div>
                  <div className={msg.isClient ? "forge-msg-outbound" : "forge-msg-inbound"}>{msg.content}</div>
                  {msg.isClient && (
                    <div className="flex items-center gap-1 self-end text-[0.625rem]" style={{ color: "var(--color-forge-text-faint)" }}>
                      <CheckCheck className="w-3 h-3" style={{ color: "var(--color-forge-primary)" }} />
                      Delivered
                    </div>
                  )}
                  {!msg.isClient && (
                    <div className="text-[0.625rem]" style={{ color: "var(--color-forge-text-faint)" }}>{msg.fromRole}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div className="p-4 border-t" style={{ borderColor: "var(--color-forge-border)" }}>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <textarea
                  className="forge-input resize-none"
                  rows={3}
                  placeholder="Write a message to your SZL relationship team..."
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); sendMessage(); }
                  }}
                  disabled={!activeThreadId}
                />
                <div className="flex items-center gap-2 mt-1.5">
                  <Shield className="w-3 h-3" style={{ color: "var(--color-forge-success)" }} />
                  <span className="text-[0.625rem]" style={{ color: "var(--color-forge-text-faint)" }}>Encrypted · Cmd+Enter to send</span>
                </div>
              </div>
              <button
                className="forge-btn-primary flex-shrink-0"
                onClick={sendMessage}
                disabled={!draft.trim() || !activeThreadId || replyMutation.isPending}
                style={{ opacity: draft.trim() && activeThreadId ? 1 : 0.5, cursor: draft.trim() && activeThreadId ? "pointer" : "not-allowed" }}
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
