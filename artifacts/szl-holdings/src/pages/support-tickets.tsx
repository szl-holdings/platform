import { useStandardQuery } from "@szl-holdings/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { m } from "framer-motion";
import { Plus, Clock, CheckCircle2, AlertCircle, RefreshCw, MessageSquare, type LucideIcon } from "lucide-react";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@szl-holdings/replit-auth-web";

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
  orgId: number | null;
  userId: number | null;
  assignedToName: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  open: { label: "Open", color: "hsl(192,72%,48%)", icon: MessageSquare },
  in_progress: { label: "In Progress", color: "hsl(45,90%,55%)", icon: RefreshCw },
  waiting_on_customer: { label: "Awaiting Your Reply", color: "hsl(260,60%,62%)", icon: Clock },
  resolved: { label: "Resolved", color: "hsl(142,60%,50%)", icon: CheckCircle2 },
  closed: { label: "Closed", color: "hsl(210,5%,40%)", icon: CheckCircle2 },
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "hsl(210,5%,45%)",
  medium: "hsl(45,80%,52%)",
  high: "hsl(25,90%,55%)",
  urgent: "hsl(0,72%,55%)",
};

export default function SupportTicketsPage() {
  const __pageMeta = usePageMeta({ title: "My Tickets — SZL Holdings Support", description: "View and manage your support requests." });

  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, refetch } = useStandardQuery({
    queryKey: ["support-tickets", statusFilter],
    queryFn: async () => {
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const res = await fetch(`${API}/support/tickets${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load tickets");
      return res.json() as Promise<{ tickets: SupportTicket[] }>;
    },
    enabled: !!user,
  });

  const tickets = data?.tickets ?? [];

  if (!user) {
    return (
    <>
      {__pageMeta}
        <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
          <SiteNav />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 200px)", flexDirection: "column", gap: "1.25rem", textAlign: "center", padding: "6rem 1.5rem 4rem" }}>
            <AlertCircle size={32} style={{ color: "hsl(210,5%,40%)" }} />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "hsl(38,12%,88%)" }}>Sign in to view your tickets</h2>
            <p style={{ fontSize: "14px", color: "hsl(210,5%,50%)" }}>You need to be signed in to view your support history.</p>
            <a href="/api/auth/login" style={{ display: "inline-flex", alignItems: "center", padding: "0.75rem 1.5rem", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "hsl(210,12%,6%)", background: "hsl(210,8%,88%)", textDecoration: "none" }}>
              Sign in
            </a>
          </div>
          <SiteFooter />
        </div>
          </>
  );
  }

  return (
    <div style={{ minHeight: "100vh", background: "hsl(210,12%,5%)" }}>
      <SiteNav />
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "7rem 1.5rem 4rem" }}>
        <m.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "hsl(210,5%,42%)", marginBottom: "0.5rem" }}>Support</p>
              <h1 style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.02em", color: "hsl(38,12%,94%)" }}>My Tickets</h1>
            </div>
            <Link href="/support/submit" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "hsl(210,12%,6%)", background: "hsl(210,8%,88%)", textDecoration: "none" }}>
              <Plus size={14} /> New request
            </Link>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
            {["", "open", "in_progress", "waiting_on_customer", "resolved", "closed"].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: "0.4rem 0.875rem", borderRadius: "20px", fontSize: "12px", fontWeight: 500, border: "1px solid", cursor: "pointer", transition: "all 0.15s", background: statusFilter === s ? "hsla(0,0%,100%,0.08)" : "transparent", color: statusFilter === s ? "hsl(38,12%,88%)" : "hsl(210,5%,48%)", borderColor: statusFilter === s ? "hsla(0,0%,100%,0.18)" : "hsla(0,0%,100%,0.08)" }}>
                {s === "" ? "All" : STATUS_CONFIG[s]?.label ?? s}
              </button>
            ))}
            <button onClick={() => refetch()} style={{ marginLeft: "auto", padding: "0.4rem 0.875rem", borderRadius: "20px", fontSize: "12px", background: "transparent", border: "1px solid hsla(0,0%,100%,0.08)", color: "hsl(210,5%,45%)", cursor: "pointer" }}>
              <RefreshCw size={11} style={{ display: "inline", marginRight: "4px" }} />Refresh
            </button>
          </div>

          {isLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: "90px", borderRadius: "8px", background: "hsla(0,0%,100%,0.03)", border: "1px solid hsla(0,0%,100%,0.05)" }} />
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: "4rem", textAlign: "center" }}>
              <MessageSquare size={32} style={{ color: "hsl(210,5%,32%)", margin: "0 auto 1rem" }} />
              <p style={{ fontSize: "15px", fontWeight: 600, color: "hsl(38,12%,72%)", marginBottom: "0.5rem" }}>No tickets yet</p>
              <p style={{ fontSize: "13px", color: "hsl(210,5%,45%)", marginBottom: "1.5rem" }}>Submit a support request and it'll appear here.</p>
              <Link href="/support/submit" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.75rem 1.25rem", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "hsl(210,12%,6%)", background: "hsl(210,8%,88%)", textDecoration: "none" }}>
                <Plus size={13} /> Submit a request
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {tickets.map((ticket, i: number) => {
                const statusInfo = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.open;
                const StatusIcon = statusInfo.icon;
                return (
                  <m.div key={ticket.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Link href={`/support/tickets/${ticket.id}`} style={{ display: "block", padding: "1.25rem", borderRadius: "8px", background: "hsla(0,0%,100%,0.025)", border: "1px solid hsla(0,0%,100%,0.07)", textDecoration: "none", transition: "all 0.2s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.04)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.12)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "hsla(0,0%,100%,0.025)"; (e.currentTarget as HTMLElement).style.borderColor = "hsla(0,0%,100%,0.07)"; }}>
                      <div style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: "1rem" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginBottom: "0.375rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "hsl(192,72%,48%)", fontWeight: 600 }}>{ticket.ticketRef}</span>
                            <span style={{ fontSize: "10px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: PRIORITY_COLORS[ticket.priority] }}>{ticket.priority}</span>
                            <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", color: "hsl(210,5%,42%)" }}>{ticket.category?.replace(/_/g, " ")}</span>
                          </div>
                          <h3 style={{ fontSize: "14px", fontWeight: 600, color: "hsl(38,12%,88%)", marginBottom: "0.25rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ticket.subject}</h3>
                          <p style={{ fontSize: "12px", color: "hsl(210,5%,45%)" }}>
                            Submitted {new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0, padding: "0.375rem 0.75rem", borderRadius: "20px", background: `${statusInfo.color}12`, border: `1px solid ${statusInfo.color}25` }}>
                          <StatusIcon size={11} style={{ color: statusInfo.color }} />
                          <span style={{ fontSize: "11px", fontWeight: 600, color: statusInfo.color }}>{statusInfo.label}</span>
                        </div>
                      </div>
                    </Link>
                  </m.div>
                );
              })}
            </div>
          )}
        </m.div>
      </main>
      <SiteFooter />
    </div>
  );
}
