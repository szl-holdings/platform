import { useState } from "react";
import { Link, useParams } from "wouter";
import { m } from "framer-motion";
import { ArrowLeft, Send, Clock, CheckCircle2, RefreshCw, MessageSquare, AlertCircle } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useQueryClient } from "@tanstack/react-query";
import { useStandardMutation, useStandardQuery } from "@szl-holdings/api-client-react";
import { useAuth } from "@szl-holdings/replit-auth-web";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
const API = `${BASE}/api`;

interface SupportTicket {
  id: number;
  ticketRef: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  submitterName: string;
  submitterEmail: string;
  assignedToName: string | null;
  orgId: number | null;
  userId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface TicketComment {
  id: number;
  ticketId: number;
  authorId: number | null;
  authorName: string;
  authorRole: "customer" | "agent" | "admin";
  body: string;
  isInternal: boolean;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open: { label: "Open", color: "hsl(192,72%,48%)" },
  in_progress: { label: "In Progress", color: "hsl(45,90%,55%)" },
  waiting_on_customer: { label: "Awaiting Your Reply", color: "hsl(260,60%,62%)" },
  resolved: { label: "Resolved", color: "hsl(142,60%,50%)" },
  closed: { label: "Closed", color: "hsl(210,5%,40%)" },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "hsl(210,5%,45%)",
  medium: "hsl(45,80%,52%)",
  high: "hsl(25,90%,55%)",
  urgent: "hsl(0,72%,55%)",
};

export default function SupportTicketDetailPage() {
  usePageMeta({ title: "Ticket — SZL Holdings Support" });

  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");

  const { data, isLoading, error } = useStandardQuery({
    queryKey: ["support-ticket", id],
    queryFn: async () => {
      const res = await fetch(`${API}/support/tickets/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load ticket");
      return res.json() as Promise<{ ticket: SupportTicket; comments: TicketComment[] }>;
    },
    enabled: !!user && !!id,
  });

  const addCommentMutation = useStandardMutation({
    mutationFn: async (body: string) => {
      const res = await fetch(`${API}/support/tickets/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ body }),
      });
      if (!res.ok) throw new Error("Failed to submit reply");
      return res.json();
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["support-ticket", id] });
      toast.success("Reply submitted.");
    },
    onError: () => {
      toast.error("Failed to submit reply. Please try again.");
    },
  });

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    const text = reply.trim();
    if (!text || text.length < 5) {
      toast.error("Please enter a reply.");
      return;
    }
    addCommentMutation.mutate(text);
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
        <SiteNav />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 200px)", flexDirection: "column", gap: "1rem", padding: "6rem 1.5rem 4rem", textAlign: "center" }}>
          <AlertCircle size={32} style={{ color: "hsl(210,5%,40%)" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "hsl(38,12%,88%)" }}>Sign in to view this ticket</h2>
          <a href="/api/auth/login" style={{ display: "inline-flex", alignItems: "center", padding: "0.75rem 1.5rem", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "hsl(210,12%,6%)", background: "hsl(210,8%,88%)", textDecoration: "none" }}>Sign in</a>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const ticket = data?.ticket;
  const comments = data?.comments ?? [];
  const statusInfo = ticket ? (STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG["open"]) : null;

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main style={{ maxWidth: "780px", margin: "0 auto", padding: "7rem 1.5rem 4rem" }}>
        <Link href="/support/tickets" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "hsl(210,5%,45%)", textDecoration: "none", marginBottom: "2rem" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(38,12%,72%)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "hsl(210,5%,45%)"; }}>
          <ArrowLeft size={12} /> All tickets
        </Link>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: "80px", borderRadius: "8px", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.05)" }} />
            ))}
          </div>
        ) : error || !ticket ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <AlertCircle size={32} style={{ color: "hsl(0,60%,50%)", margin: "0 auto 1rem" }} />
            <p style={{ color: "hsl(210,5%,50%)", fontSize: "14px" }}>Ticket not found or access denied.</p>
            <Link href="/support/tickets" style={{ display: "inline-block", marginTop: "1rem", fontSize: "13px", color: "hsl(192,72%,48%)", textDecoration: "none" }}>← Back to my tickets</Link>
          </div>
        ) : (
          <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div style={{ padding: "1.5rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.08)", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                <div>
                  <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "hsl(192,72%,48%)", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>{ticket.ticketRef}</span>
                  <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "hsl(38,12%,94%)", letterSpacing: "-0.01em" }}>{ticket.subject}</h1>
                </div>
                {statusInfo && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.375rem 0.875rem", borderRadius: "20px", background: `${statusInfo.color}12`, border: `1px solid ${statusInfo.color}25`, flexShrink: 0 }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: statusInfo.color }}>{statusInfo.label}</span>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
                {[
                  { label: "Priority", value: ticket.priority, color: PRIORITY_COLORS[ticket.priority] },
                  { label: "Category", value: ticket.category?.replace(/_/g, " "), color: "hsl(210,5%,55%)" },
                  { label: "Submitted", value: new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), color: "hsl(210,5%,55%)" },
                ].map((item) => (
                  <div key={item.label}>
                    <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "hsl(210,5%,38%)", display: "block", marginBottom: "0.25rem" }}>{item.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: item.color, textTransform: "capitalize" }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: "1rem", borderRadius: "6px", background: "hsla(0,0%,100%,0.02)", border: "1px solid hsla(0,0%,100%,0.05)" }}>
                <p style={{ fontSize: "13px", color: "hsl(210,5%,42%)", fontWeight: 600, marginBottom: "0.5rem" }}>Original description</p>
                <p style={{ fontSize: "14px", lineHeight: "1.7", color: "hsl(210,5%,56%)", whiteSpace: "pre-wrap" }}>{ticket.description}</p>
              </div>
            </div>

            {comments.length > 0 && (
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,72%)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>Conversation</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {comments.map((comment) => {
                    const isAgent = comment.authorRole === "agent" || comment.authorRole === "admin";
                    return (
                      <div key={comment.id} style={{ padding: "1rem 1.25rem", borderRadius: "8px", background: isAgent ? "hsla(192,72%,48%,0.04)" : "hsla(0,0%,100%,0.025)", border: `1px solid ${isAgent ? "hsla(192,72%,48%,0.14)" : "hsla(0,0%,100%,0.06)"}` }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.625rem", flexWrap: "wrap", gap: "0.25rem" }}>
                          <span style={{ fontSize: "12px", fontWeight: 600, color: isAgent ? "hsl(192,72%,55%)" : "hsl(38,12%,75%)" }}>
                            {isAgent ? "Support Team" : comment.authorName}
                          </span>
                          <span style={{ fontSize: "11px", color: "hsl(210,5%,40%)" }}>
                            {new Date(comment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p style={{ fontSize: "14px", lineHeight: "1.7", color: "hsl(210,5%,58%)", whiteSpace: "pre-wrap", margin: 0 }}>{comment.body}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {ticket.status !== "closed" && ticket.status !== "resolved" && (
              <div style={{ padding: "1.25rem", borderRadius: "10px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)" }}>
                <h2 style={{ fontSize: "13px", fontWeight: 700, color: "hsl(38,12%,72%)", marginBottom: "1rem" }}>Add a reply</h2>
                <form onSubmit={handleReply}>
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write your reply…"
                    rows={5}
                    style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: "6px", background: "hsla(0,0%,100%,0.04)", border: "1px solid hsla(0,0%,100%,0.1)", color: "hsl(38,12%,88%)", fontSize: "14px", outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", marginBottom: "0.875rem" }}
                    maxLength={5000}
                  />
                  <button type="submit" disabled={addCommentMutation.isPending} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "0.75rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "hsl(210,12%,6%)", background: addCommentMutation.isPending ? "hsl(210,5%,40%)" : "hsl(210,8%,88%)", border: "none", cursor: addCommentMutation.isPending ? "not-allowed" : "pointer" }}>
                    <Send size={13} />
                    {addCommentMutation.isPending ? "Sending…" : "Send reply"}
                  </button>
                </form>
              </div>
            )}

            {(ticket.status === "closed" || ticket.status === "resolved") && (
              <div style={{ padding: "1.25rem", borderRadius: "10px", background: "hsla(142,60%,50%,0.04)", border: "1px solid hsla(142,60%,50%,0.14)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <CheckCircle2 size={16} style={{ color: "hsl(142,60%,50%)", flexShrink: 0 }} />
                <p style={{ fontSize: "13px", color: "hsl(210,5%,55%)", margin: 0 }}>
                  This ticket has been {ticket.status}. Need more help? <Link href="/support/submit" style={{ color: "hsl(192,72%,48%)", textDecoration: "none" }}>Submit a new request.</Link>
                </p>
              </div>
            )}
          </m.div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
