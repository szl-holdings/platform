import { motion } from "framer-motion";
import { User, CheckCircle2, Clock, Wrench, BarChart3 } from "lucide-react";
import { cn } from "@szl-holdings/shared-ui/utils";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@szl-holdings/shared-ui/ui/skeleton";
import { technicians as fallbackTechnicians, type Technician } from "@/data/seed-data";
import { apiFetch } from "@szl-holdings/shared-ui";

interface ApiTechnician {
  id: number;
  name: string;
  role: string;
  email: string;
  phone?: string | null;
  status: "available" | "on-site" | "traveling" | "off-duty";
  specializations?: string[] | null;
  activeTickets?: number | null;
  resolvedToday?: number | null;
  avgResponseTime?: string | null;
  utilization?: number | null;
  currentTask?: string | null;
  avatar?: string | null;
  certifications?: string[] | null;
}

const statusConfig: Record<string, { color: string; label: string; textColor: string }> = {
  available: { color: "bg-emerald-400", label: "Available", textColor: "text-emerald-400" },
  busy: { color: "bg-red-400", label: "Busy", textColor: "text-red-400" },
  "on-call": { color: "bg-amber-400", label: "On-Call", textColor: "text-amber-400" },
  "on-site": { color: "bg-amber-400", label: "On-Site", textColor: "text-amber-400" },
  traveling: { color: "bg-blue-400", label: "Traveling", textColor: "text-blue-400" },
  off: { color: "bg-zinc-500", label: "Off Duty", textColor: "text-zinc-400" },
  "off-duty": { color: "bg-zinc-500", label: "Off Duty", textColor: "text-zinc-400" },
};

function TechnicianCard({ tech, index }: { tech: Technician | ApiTechnician; index: number }) {
  const statusKey = tech.status in statusConfig ? tech.status : "off";
  const status = statusConfig[statusKey] ?? statusConfig.off;
  const specializations = tech.specializations ?? [];
  const activeTickets = tech.activeTickets ?? 0;
  const resolvedToday = tech.resolvedToday ?? 0;
  const avgResponseTime = tech.avgResponseTime ?? "—";
  const utilization = tech.utilization ?? 0;
  const currentTask = tech.currentTask ?? "No active task";
  const avatar = tech.avatar ?? tech.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2);

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
            {avatar}
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
          <p className="text-lg font-display font-bold text-foreground">{activeTickets}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-lg font-display font-bold text-emerald-400">{resolvedToday}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Resolved</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <p className="text-lg font-display font-bold text-cyan-400">{avgResponseTime}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg Resp</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-muted-foreground">Utilization</span>
          <span className={cn("text-xs font-semibold", utilization >= 80 ? "text-red-400" : utilization >= 50 ? "text-amber-400" : "text-emerald-400")}>{utilization}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", utilization >= 80 ? "bg-red-400" : utilization >= 50 ? "bg-amber-400" : "bg-emerald-400")} style={{ width: `${utilization}%` }} />
        </div>
      </div>

      {specializations.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Specializations</p>
          <div className="flex flex-wrap gap-1">
            {specializations.map((s: string) => (
              <span key={s} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Current Task</p>
        <p className="text-xs text-foreground">{currentTask}</p>
      </div>
    </motion.div>
  );
}

export default function TechniciansPage() {
  const { data, isLoading } = useQuery<{ technicians: ApiTechnician[] }>({
    queryKey: ["msp-technicians"],
    queryFn: () => apiFetch<{ technicians: ApiTechnician[] }>("/msp/technicians"),
    staleTime: 60000,
    retry: 1,
  });

  const technicians: (Technician | ApiTechnician)[] = (data?.technicians && data.technicians.length > 0)
    ? data.technicians
    : fallbackTechnicians;

  const available = technicians.filter(t => t.status === "available").length;
  const busy = technicians.filter(t => t.status === "busy" || t.status === "on-site" || t.status === "traveling").length;
  const totalResolved = technicians.reduce((s, t) => s + (t.resolvedToday ?? 0), 0);
  const activeTechs = technicians.filter(t => t.status !== "off" && t.status !== "off-duty");
  const avgUtilization = activeTechs.length > 0
    ? Math.round(activeTechs.reduce((s, t) => s + (t.utilization ?? 0), 0) / activeTechs.length)
    : 0;

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

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {technicians.map((tech, i) => (
            <TechnicianCard key={tech.id} tech={tech} index={i} />
          ))}
        </div>
      )}

      <div className="glass-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Team Workload Distribution</h2>
        <div className="space-y-3">
          {technicians.filter(t => t.status !== "off" && t.status !== "off-duty").map(tech => (
            <div key={tech.id} className="flex items-center gap-4">
              <div className="w-32 text-sm text-foreground truncate">{tech.name}</div>
              <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden flex">
                <div className="h-full bg-red-400/80" style={{ width: `${(tech.activeTickets ?? 0) * 8}%` }} title="Active tickets" />
                <div className="h-full bg-emerald-400/80" style={{ width: `${(tech.resolvedToday ?? 0) * 5}%` }} title="Resolved today" />
                <div className="h-full bg-primary/40" style={{ width: `${Math.max(0, (tech.utilization ?? 0) - (tech.activeTickets ?? 0) * 8 - (tech.resolvedToday ?? 0) * 5)}%` }} title="Other work" />
              </div>
              <div className="w-12 text-right text-xs font-mono text-muted-foreground">{tech.utilization ?? 0}%</div>
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
