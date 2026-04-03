import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter, AlertTriangle, Clock, User, ArrowUp, ArrowDown, Minus, CheckCircle2, Circle, Pause, Timer, Plus } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { tickets, type Ticket } from "@/data/mock-data";

function formatTimeRemaining(deadline: string, breached: boolean): { text: string; urgency: "breached" | "critical" | "warning" | "ok" } {
  if (breached) return { text: "BREACHED", urgency: "breached" };
  const now = new Date("2026-03-29T09:00:00Z");
  const end = new Date(deadline);
  const diffMs = end.getTime() - now.getTime();
  if (diffMs <= 0) return { text: "BREACHED", urgency: "breached" };
  const hours = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  if (hours === 0) return { text: `${mins}m remaining`, urgency: "critical" };
  if (hours < 4) return { text: `${hours}h ${mins}m remaining`, urgency: "warning" };
  return { text: `${hours}h ${mins}m remaining`, urgency: "ok" };
}

const urgencyStyles = {
  breached: "text-red-400 bg-red-500/10 border-red-500/20",
  critical: "text-red-400 bg-red-500/10 border-red-500/20 animate-pulse",
  warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  ok: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const priorityConfig = {
  critical: { icon: ArrowUp, color: "text-red-400 bg-red-500/10 border-red-500/20", label: "Critical" },
  high: { icon: ArrowUp, color: "text-orange-400 bg-orange-500/10 border-orange-500/20", label: "High" },
  medium: { icon: Minus, color: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "Medium" },
  low: { icon: ArrowDown, color: "text-blue-400 bg-blue-500/10 border-blue-500/20", label: "Low" },
};

const statusConfig = {
  open: { icon: Circle, color: "text-blue-400", label: "Open" },
  "in-progress": { icon: Timer, color: "text-amber-400", label: "In Progress" },
  waiting: { icon: Pause, color: "text-purple-400", label: "Waiting" },
  resolved: { icon: CheckCircle2, color: "text-emerald-400", label: "Resolved" },
  closed: { icon: CheckCircle2, color: "text-muted-foreground", label: "Closed" },
};

function TicketCard({ ticket, index }: { ticket: Ticket; index: number }) {
  const priority = priorityConfig[ticket.priority];
  const status = statusConfig[ticket.status];
  const PriorityIcon = priority.icon;
  const StatusIcon = status.icon;
  const isTerminal = ticket.status === "resolved" || ticket.status === "closed";
  const sla = isTerminal ? null : formatTimeRemaining(ticket.slaDeadline, ticket.slaBreached);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="group glass-card rounded-xl p-5 hover:border-primary/30 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground">{ticket.id}</span>
          {sla && (
            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border", urgencyStyles[sla.urgency])}>
              <Timer className="w-3 h-3" /> {sla.text}
            </span>
          )}
          {isTerminal && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-muted-foreground bg-muted/30 border border-border/30">
              SLA Met
            </span>
          )}
        </div>
        <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", priority.color)}>
          <PriorityIcon className="w-3 h-3" /> {priority.label}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{ticket.title}</h3>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{ticket.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("inline-flex items-center gap-1 text-xs font-medium", status.color)}>
            <StatusIcon className="w-3.5 h-3.5" /> {status.label}
          </span>
          <span className="text-xs text-muted-foreground">{ticket.client}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <User className="w-3 h-3" /> {ticket.assignee}
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" /> {ticket.lastUpdate}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function ServiceDeskPage() {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = tickets
    .filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.client.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()))
    .filter(t => priorityFilter === "all" || t.priority === priorityFilter)
    .filter(t => statusFilter === "all" || t.status === statusFilter);

  const criticalCount = tickets.filter(t => t.priority === "critical" && t.status !== "resolved" && t.status !== "closed").length;
  const breachedCount = tickets.filter(t => t.slaBreached).length;
  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in-progress").length;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Service Desk</h1>
          <p className="text-sm text-muted-foreground mt-1">SLA-tracked ticket queue with priority escalation and technician assignment</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Critical Tickets", value: criticalCount.toString(), color: "text-red-400", icon: AlertTriangle },
          { label: "SLA Breached", value: breachedCount.toString(), color: "text-orange-400", icon: Clock },
          { label: "Open / Unassigned", value: openCount.toString(), color: "text-blue-400", icon: Circle },
          { label: "In Progress", value: inProgressCount.toString(), color: "text-amber-400", icon: Timer },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <p className={cn("text-3xl font-display font-bold mt-2", stat.color)}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {["all", "critical", "high", "medium", "low"].map(p => (
            <button key={p} onClick={() => setPriorityFilter(p)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", priorityFilter === p ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              {p === "all" ? "All Priority" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {["all", "open", "in-progress", "waiting"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors", statusFilter === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              {s === "all" ? "All Status" : s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.map((ticket, i) => (
          <TicketCard key={ticket.id} ticket={ticket} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">No tickets match your filters</div>
        )}
      </div>
    </div>
  );
}
