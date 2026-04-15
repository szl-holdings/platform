import { Ticket, Clock, AlertTriangle, CheckCircle, User, Plus, Sparkles, Loader2, X, ChevronRight, MessageCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ExportButton } from "@szl-holdings/shared-ui/data-export";
import { CommentThread, ActivityFeed } from "@szl-holdings/shared-ui/collaboration";
import { Skeleton } from "@szl-holdings/shared-ui/ui/skeleton";
import { toast } from "@szl-holdings/shared-ui/ui/sonner";
import { apiFetch } from "@szl-holdings/shared-ui";

const API_BASE = "/api";

interface TicketItem {
  id: number;
  ticketNumber: string;
  subject: string;
  clientName: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in-progress" | "waiting" | "resolved" | "closed";
  assigneeName: string;
  createdAt: string;
  slaDeadline: string;
  slaStatus: "on-track" | "at-risk" | "breached";
  category: string;
  description?: string;
  aiTriage?: string;
}

interface TicketsResponse {
  tickets: TicketItem[];
  total: number;
}

const prioColors: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-500/10 text-blue-400",
  "in-progress": "bg-violet-500/10 text-violet-400",
  waiting: "bg-amber-500/10 text-amber-400",
  resolved: "bg-emerald-500/10 text-emerald-400",
  closed: "bg-muted text-muted-foreground",
};

const slaColors: Record<string, string> = {
  "on-track": "text-emerald-400",
  "at-risk": "text-amber-400",
  breached: "text-red-400",
};

function formatSlaDeadline(deadline: string | null): string {
  if (!deadline) return "No SLA";
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff < 0) return "Breached";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d remaining`;
  if (hours > 0) return `${hours}h remaining`;
  return `${mins}m remaining`;
}

function NewTicketModal({ onClose, onCreated }: { onClose: () => void; onCreated: (ticket: TicketItem) => void }) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [priority, setPriority] = useState<"critical" | "high" | "medium" | "low">("medium");
  const [category, setCategory] = useState("General");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    setSubmitting(true);
    try {
      const data = await apiFetch<{ ticket: TicketItem }>("/msp/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, description, clientName, priority, category }),
      });
      toast.success(`Ticket ${data.ticket.ticketNumber} created`);

      try {
        const triageRes = await fetch(`${API_BASE}/intelligence/ai/ticket-triage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ subject, client: clientName, category, description }),
        });
        if (triageRes.ok) {
          const triageData = await triageRes.json();
          const triage = triageData.data?.triage ?? triageData.triage;
          if (triage) {
            await apiFetch(`/msp/tickets/${data.ticket.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ aiTriage: triage }),
            });
            toast.success("AI triage completed automatically");
          }
        }
      } catch {
        // AI triage failure is non-fatal
      }

      onCreated(data.ticket);
      onClose();
    } catch (err) {
      toast.error("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-xl w-full max-w-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">New Ticket</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Subject *</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} required className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Brief description of the issue" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Client</label>
            <input value={clientName} onChange={e => setClientName(e.target.value)} className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Client name" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as typeof priority)} className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Category</label>
              <input value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary" placeholder="Network, Security, etc" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 text-sm bg-muted rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary resize-none" placeholder="Detailed description..." />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button type="submit" disabled={submitting || !subject.trim()} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…</> : <><Plus className="w-3.5 h-3.5" /> Create & Auto-Triage</>}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" /> AI triage runs automatically on ticket creation
          </p>
        </form>
      </div>
    </div>
  );
}

export default function Tickets() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [triageResults, setTriageResults] = useState<Record<number, { triage: string; loading: boolean; error?: string }>>({});
  const [showNewTicket, setShowNewTicket] = useState(false);

  const { data, isLoading, refetch } = useQuery<TicketsResponse>({
    queryKey: ["msp-tickets", filter],
    queryFn: () => apiFetch<TicketsResponse>(`/msp/tickets${filter !== "all" ? `?status=${filter}` : ""}`),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const tickets = data?.tickets ?? [];
  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in-progress").length;
  const breachedCount = tickets.filter(t => t.slaStatus === "breached").length;
  const resolvedToday = tickets.filter(t => t.status === "resolved").length;

  const triageTicket = async (ticket: TicketItem) => {
    setTriageResults(prev => ({ ...prev, [ticket.id]: { triage: "", loading: true } }));
    try {
      const res = await fetch(`${API_BASE}/intelligence/ai/ticket-triage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          subject: ticket.subject,
          client: ticket.clientName,
          category: ticket.category,
          description: ticket.description || `Status: ${ticket.status}, Priority: ${ticket.priority}, SLA Status: ${ticket.slaStatus}, Assignee: ${ticket.assigneeName}`,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      const triage = d.data?.triage ?? d.triage ?? "No triage returned";
      setTriageResults(prev => ({ ...prev, [ticket.id]: { triage, loading: false } }));

      await apiFetch(`/msp/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiTriage: triage }),
      });
    } catch (err) {
      setTriageResults(prev => ({
        ...prev,
        [ticket.id]: { triage: "", loading: false, error: err instanceof Error ? err.message : "Triage failed" },
      }));
    }
  };

  const closeTicket = async (ticket: TicketItem) => {
    try {
      await apiFetch(`/msp/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      toast.success(`Ticket ${ticket.ticketNumber} resolved`);
      queryClient.invalidateQueries({ queryKey: ["msp-tickets"] });
      setSelectedTicket(null);
    } catch {
      toast.error("Failed to update ticket");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {showNewTicket && (
        <NewTicketModal
          onClose={() => setShowNewTicket(false)}
          onCreated={() => { queryClient.invalidateQueries({ queryKey: ["msp-tickets"] }); }}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Service Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">Ticket management with SLA tracking and AI triage</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            data={tickets.map(t => ({
              ID: t.ticketNumber,
              Subject: t.subject,
              Client: t.clientName,
              Priority: t.priority,
              Status: t.status,
              Assignee: t.assigneeName,
              "SLA Status": t.slaStatus,
              Category: t.category,
            }))}
            options={{ filename: "service-desk-tickets", title: "Service Desk Tickets", accentColor: "#3b82f6" }}
          />
          <button
            onClick={() => refetch()}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowNewTicket(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Ticket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
        ) : (
          [
            { label: "Open", count: openCount, icon: AlertTriangle, color: "text-blue-400" },
            { label: "In Progress", count: inProgressCount, icon: Clock, color: "text-violet-400" },
            { label: "SLA Breached", count: breachedCount, icon: AlertTriangle, color: "text-red-400" },
            { label: "Resolved", count: resolvedToday, icon: CheckCircle, color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <div className="text-xl font-display font-bold">{s.count}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-center gap-2">
        {["all", "open", "in-progress", "waiting", "resolved"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
            {f === "all" ? "All" : f.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-1 gap-6 ${selectedTicket ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
        <div className={`rounded-xl border border-border bg-card overflow-hidden ${selectedTicket ? "lg:col-span-2" : "lg:col-span-2"}`}>
          {isLoading ? (
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-16" /></div>)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No tickets found</div>
          ) : (
            <div className="divide-y divide-border">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className={`p-4 transition-colors cursor-pointer ${selectedTicket?.id === ticket.id ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/30"}`}
                  onClick={() => setSelectedTicket(selectedTicket?.id === ticket.id ? null : ticket)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${prioColors[ticket.priority]}`}>
                        {ticket.priority}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[ticket.status]}`}>
                        {ticket.status.replace("-", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium flex items-center gap-1 ${slaColors[ticket.slaStatus]}`}>
                        <Clock className="w-3 h-3" /> {ticket.slaDeadline ? formatSlaDeadline(ticket.slaDeadline) : ticket.slaStatus}
                      </span>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${selectedTicket?.id === ticket.id ? "rotate-90" : ""}`} />
                    </div>
                  </div>
                  <p className="text-sm font-medium">{ticket.subject}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{ticket.clientName || "Unknown"} · {ticket.category}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" /> {ticket.assigneeName || "Unassigned"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedTicket && (
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-xs text-muted-foreground">{selectedTicket.ticketNumber}</p>
                <p className="font-semibold text-sm mt-1">{selectedTicket.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{selectedTicket.clientName || "Unknown"} · {selectedTicket.category}</p>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${prioColors[selectedTicket.priority]}`}>{selectedTicket.priority}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[selectedTicket.status]}`}>{selectedTicket.status.replace("-", " ")}</span>
              <span className={`text-xs font-medium flex items-center gap-1 ${slaColors[selectedTicket.slaStatus]}`}><Clock className="w-3 h-3" />{formatSlaDeadline(selectedTicket.slaDeadline)}</span>
            </div>

            {selectedTicket.description && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs text-muted-foreground">{selectedTicket.description}</div>
            )}

            {selectedTicket.status !== "resolved" && selectedTicket.status !== "closed" && (
              <button
                onClick={() => closeTicket(selectedTicket)}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
              >
                Mark Resolved
              </button>
            )}

            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" /> AI Triage
                </h3>
                <button
                  onClick={() => triageTicket(selectedTicket)}
                  disabled={triageResults[selectedTicket.id]?.loading}
                  className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {triageResults[selectedTicket.id]?.loading ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</>
                  ) : (
                    <><Sparkles className="w-3 h-3" /> {triageResults[selectedTicket.id] ? "Re-triage" : "Run AI Triage"}</>
                  )}
                </button>
              </div>

              {selectedTicket.aiTriage && !triageResults[selectedTicket.id] && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  <div className="flex items-center gap-1 mb-2 text-[10px] text-muted-foreground">
                    <Sparkles className="w-3 h-3 text-primary" /> Saved AI Triage
                  </div>
                  {selectedTicket.aiTriage}
                </div>
              )}

              {!triageResults[selectedTicket.id] && !selectedTicket.aiTriage && (
                <p className="text-xs text-muted-foreground text-center py-6 bg-muted/30 rounded-lg">
                  Click "Run AI Triage" to get priority analysis, root cause hypotheses, and recommended actions.
                </p>
              )}

              {triageResults[selectedTicket.id]?.error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-xs text-red-400">{triageResults[selectedTicket.id].error}</p>
                </div>
              )}

              {triageResults[selectedTicket.id]?.triage && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                  <div className="flex items-center gap-1 mb-2 text-[10px] text-muted-foreground">
                    <Sparkles className="w-3 h-3 text-primary" /> MSP Ops AI
                  </div>
                  {triageResults[selectedTicket.id].triage}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {selectedTicket ? (
            <CommentThread
              entityType="ticket"
              entityId={selectedTicket.ticketNumber}
              title={`${selectedTicket.ticketNumber} Discussion`}
              collapsible={false}
            />
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 text-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Select a ticket to view its discussion thread</p>
            </div>
          )}
          <ActivityFeed entityType="ticket" title="Team Activity" limit={6} compact />
        </div>
      </div>
    </div>
  );
}
