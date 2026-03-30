import { Ticket, Clock, AlertTriangle, CheckCircle, User, ArrowUp, Filter, Plus } from "lucide-react";
import { useState } from "react";

interface TicketItem {
  id: string;
  subject: string;
  client: string;
  priority: "critical" | "high" | "medium" | "low";
  status: "open" | "in-progress" | "waiting" | "resolved";
  assignee: string;
  created: string;
  slaDeadline: string;
  slaStatus: "on-track" | "at-risk" | "breached";
  category: string;
}

const tickets: TicketItem[] = [
  { id: "TKT-4521", subject: "Email server migration - Phase 2", client: "Meridian Corp", priority: "high", status: "in-progress", assignee: "James K.", created: "2h ago", slaDeadline: "2h remaining", slaStatus: "at-risk", category: "Infrastructure" },
  { id: "TKT-4520", subject: "VPN connectivity intermittent failures", client: "Atlas Industries", priority: "critical", status: "open", assignee: "Unassigned", created: "45m ago", slaDeadline: "1h remaining", slaStatus: "at-risk", category: "Network" },
  { id: "TKT-4519", subject: "New workstation setup for 5 employees", client: "Vertex Labs", priority: "low", status: "in-progress", assignee: "Sarah M.", created: "1d ago", slaDeadline: "6h remaining", slaStatus: "on-track", category: "Endpoint" },
  { id: "TKT-4518", subject: "HIPAA compliance audit preparation", client: "Pinnacle Health", priority: "high", status: "in-progress", assignee: "David R.", created: "2d ago", slaDeadline: "1d remaining", slaStatus: "on-track", category: "Compliance" },
  { id: "TKT-4517", subject: "Ransomware alert investigation", client: "NovaTech", priority: "critical", status: "in-progress", assignee: "James K.", created: "1h ago", slaDeadline: "30m remaining", slaStatus: "breached", category: "Security" },
  { id: "TKT-4516", subject: "Office 365 license renewal", client: "Greenfield Education", priority: "medium", status: "waiting", assignee: "Sarah M.", created: "3d ago", slaDeadline: "2d remaining", slaStatus: "on-track", category: "Licensing" },
  { id: "TKT-4515", subject: "Backup failure on primary NAS", client: "Horizon Logistics", priority: "high", status: "open", assignee: "Unassigned", created: "4h ago", slaDeadline: "4h remaining", slaStatus: "on-track", category: "Backup" },
  { id: "TKT-4514", subject: "Network switch replacement — Building C", client: "Meridian Corp", priority: "medium", status: "resolved", assignee: "David R.", created: "5d ago", slaDeadline: "Completed", slaStatus: "on-track", category: "Network" },
];

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
};

const slaColors: Record<string, string> = {
  "on-track": "text-emerald-400",
  "at-risk": "text-amber-400",
  breached: "text-red-400",
};

export default function Tickets() {
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);
  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in-progress").length;
  const breachedCount = tickets.filter(t => t.slaStatus === "breached").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Service Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">Ticket management with SLA tracking</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Open", count: openCount, icon: AlertTriangle, color: "text-blue-400" },
          { label: "In Progress", count: inProgressCount, icon: Clock, color: "text-violet-400" },
          { label: "SLA Breached", count: breachedCount, icon: AlertTriangle, color: "text-red-400" },
          { label: "Resolved Today", count: 7, icon: CheckCircle, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div>
              <div className="text-xl font-display font-bold">{s.count}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {["all", "open", "in-progress", "waiting", "resolved"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>
            {f === "all" ? "All" : f.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.map((ticket) => (
            <div key={ticket.id} className="p-4 hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{ticket.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${prioColors[ticket.priority]}`}>
                    {ticket.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusColors[ticket.status]}`}>
                    {ticket.status.replace("-", " ")}
                  </span>
                </div>
                <span className={`text-xs font-medium flex items-center gap-1 ${slaColors[ticket.slaStatus]}`}>
                  <Clock className="w-3 h-3" /> {ticket.slaDeadline}
                </span>
              </div>
              <p className="text-sm font-medium">{ticket.subject}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">{ticket.client} · {ticket.category}</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="w-3 h-3" /> {ticket.assignee}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
