import { motion } from "framer-motion";
import { User, CheckCircle2, Clock, Phone, Wrench, AlertTriangle, BarChart3 } from "lucide-react";
import { cn } from "@workspace/shared-ui/utils";
import { technicians, type Technician } from "@/data/mock-data";

const statusConfig = {
  available: { color: "bg-emerald-400", label: "Available", textColor: "text-emerald-400" },
  busy: { color: "bg-red-400", label: "Busy", textColor: "text-red-400" },
  "on-call": { color: "bg-amber-400", label: "On-Call", textColor: "text-amber-400" },
  off: { color: "bg-zinc-500", label: "Off Duty", textColor: "text-zinc-400" },
};

function TechnicianCard({ tech, index }: { tech: Technician; index: number }) {
  const status = statusConfig[tech.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="glass-card rounded-xl p-5 hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start gap-4 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-sm">
            {tech.avatar}
          </div>
          <div className={cn("absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-card", status.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{tech.name}</h3>
          <p className="text-xs text-muted-foreground">{tech.role}</p>
          <span className={cn("text-xs font-medium", status.textColor)}>{status.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-lg font-display font-bold text-foreground">{tech.activeTickets}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-lg font-display font-bold text-emerald-400">{tech.resolvedToday}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Resolved</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-lg font-display font-bold text-cyan-400">{tech.avgResponseTime}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Resp</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Utilization</span>
          <span className={cn("text-xs font-semibold", tech.utilization >= 80 ? "text-red-400" : tech.utilization >= 50 ? "text-amber-400" : "text-emerald-400")}>{tech.utilization}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", tech.utilization >= 80 ? "bg-red-400" : tech.utilization >= 50 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${tech.utilization}%` }} />
        </div>
      </div>

      <div className="mb-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Specializations</p>
        <div className="flex flex-wrap gap-1">
          {tech.specializations.map(s => (
            <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">{s}</span>
          ))}
        </div>
      </div>

      <div className="pt-3 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current Task</p>
        <p className="text-xs text-foreground">{tech.currentTask}</p>
      </div>
    </motion.div>
  );
}

export default function TechniciansPage() {
  const available = technicians.filter(t => t.status === "available").length;
  const busy = technicians.filter(t => t.status === "busy").length;
  const totalResolved = technicians.reduce((s, t) => s + t.resolvedToday, 0);
  const avgUtilization = Math.round(technicians.filter(t => t.status !== "off").reduce((s, t) => s + t.utilization, 0) / technicians.filter(t => t.status !== "off").length);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Technician Dispatch</h1>
        <p className="text-sm text-muted-foreground mt-1">Utilization, active ticket load, certifications, and dispatch availability</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Available", value: available.toString(), color: "text-emerald-400", icon: CheckCircle2 },
          { label: "Busy / Assigned", value: busy.toString(), color: "text-red-400", icon: Wrench },
          { label: "Resolved Today", value: totalResolved.toString(), color: "text-cyan-400", icon: BarChart3 },
          { label: "Avg Utilization", value: `${avgUtilization}%`, color: avgUtilization >= 70 ? "text-amber-400" : "text-emerald-400", icon: Clock },
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {technicians.map((tech, i) => (
          <TechnicianCard key={tech.id} tech={tech} index={i} />
        ))}
      </div>

      <div className="glass-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Team Workload Distribution</h2>
        <div className="space-y-3">
          {technicians.filter(t => t.status !== "off").map(tech => (
            <div key={tech.id} className="flex items-center gap-4">
              <div className="w-32 text-sm text-foreground truncate">{tech.name}</div>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden flex">
                <div className="h-full bg-red-400/80" style={{ width: `${tech.activeTickets * 8}%` }} title="Active tickets" />
                <div className="h-full bg-emerald-400/80" style={{ width: `${tech.resolvedToday * 5}%` }} title="Resolved today" />
                <div className="h-full bg-primary/40" style={{ width: `${Math.max(0, tech.utilization - tech.activeTickets * 8 - tech.resolvedToday * 5)}%` }} title="Other work" />
              </div>
              <div className="w-12 text-right text-xs font-mono text-muted-foreground">{tech.utilization}%</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-6 mt-4 pt-3 border-t border-border/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-3 rounded bg-red-400/80" /> Active Tickets</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-3 rounded bg-emerald-400/80" /> Resolved Today</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-3 h-3 rounded bg-primary/40" /> Other Work</div>
        </div>
      </div>
    </div>
  );
}
