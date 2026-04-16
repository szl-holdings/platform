import type { ElementType, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Radio, Brain, Shield, Lock, Cpu, ArrowUpRight } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { API_BASE } from "./constants";

export function StatusDot({ status }: { status: string }) {
  const color = status === "healthy" ? "bg-emerald-500" : status === "degraded" ? "bg-amber-500" : status === "operational" ? "bg-emerald-500" : "bg-red-500";
  return (
    <span className={cn("inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 animate-pulse", color)} />
  );
}

export function SectionCard({ title, icon: Icon, color, children, className }: {
  title: string;
  icon: ElementType;
  color: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
        <Icon className={cn("w-3.5 h-3.5", color)} />
        <span className="text-xs font-semibold text-foreground">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function TimeAgo({ ts }: { ts: string | number | null | undefined }) {
  if (!ts) return <span className="text-muted-foreground/50">—</span>;
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  const diffMs = Date.now() - d.getTime();
  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return <span className="text-muted-foreground">{secs}s ago</span>;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return <span className="text-muted-foreground">{mins}m ago</span>;
  const hrs = Math.floor(mins / 60);
  return <span className="text-muted-foreground">{hrs}h ago</span>;
}

export function ConfidenceBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-muted-foreground/50 text-[10px]">—</span>;
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400";
  return <span className={cn("text-[10px] font-mono font-medium", color)}>{pct}%</span>;
}

export function ControlTowerStatusBar() {
  const { data, isLoading } = useQuery<{ data: Record<string, unknown> }>({
    queryKey: ["ct-status"],
    queryFn: () => fetch(`${API_BASE}/control-tower/status`).then(r => r.json()),
    refetchInterval: 30000,
  });

  const status = data?.data as Record<string, unknown> | undefined;
  const ct = status?.controlTower as Record<string, unknown> | undefined;
  const sense = status?.sense as Record<string, unknown> | undefined;
  const decide = status?.decide as Record<string, unknown> | undefined;
  const govern = status?.govern as Record<string, unknown> | undefined;

  const kpis = [
    { label: "Total Signals", value: sense ? String(sense.totalSignalsPublished ?? 0) : "—", icon: Radio, color: "text-sky-400" },
    { label: "Agents Registered", value: decide ? String(decide.registeredAgents ?? 0) : "—", icon: Cpu, color: "text-violet-400" },
    { label: "Decisions Journaled", value: decide ? String(decide.totalDecisionsJournaled ?? 0) : "—", icon: Brain, color: "text-fuchsia-400" },
    { label: "Compliance Score", value: govern ? `${govern.overallComplianceScore}` : "—", icon: Shield, color: "text-emerald-400" },
    { label: "Audit Entries", value: govern ? String(govern.totalAuditEntries ?? 0) : "—", icon: Lock, color: "text-amber-400" },
  ];

  return (
    <div className="bg-card/80 border border-border rounded-xl px-4 py-3 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-foreground">AI Control Tower</span>
          <span className="text-[10px] text-muted-foreground font-mono bg-muted/30 px-1.5 py-0.5 rounded">
            {ct ? String(ct.status ?? "—") : isLoading ? "loading…" : "—"}
          </span>
        </div>
        <Link href="/command-center" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
          <ArrowUpRight className="w-3 h-3" />
          Command Center
        </Link>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {kpis.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Icon className={cn("w-3 h-3", color)} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
            <p className={cn("text-base font-bold font-mono", color)}>{isLoading ? "…" : value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
