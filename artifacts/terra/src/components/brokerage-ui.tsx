import { cn } from "@workspace/shared-ui/utils";
import { AlertTriangle, CheckCircle, Clock, TrendingUp, Shield, Zap, XCircle } from "lucide-react";

export function RiskBadge({ level, className }: { level: "low" | "medium" | "high" | "critical"; className?: string }) {
  const cfg = {
    low: { label: "Low Risk", cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    medium: { label: "Medium Risk", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    high: { label: "High Risk", cls: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    critical: { label: "Critical", cls: "bg-red-600/15 text-red-400 border-red-500/20" },
  }[level];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wide", cfg.cls, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

export function ConfidenceBadge({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(value * 100);
  const cls = pct >= 80 ? "bg-emerald-500/10 text-emerald-400" : pct >= 60 ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400";
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold", cls, className)}>
      {pct}% confidence
    </span>
  );
}

export function ApprovalChip({ approved, label, className }: { approved: boolean; label?: string; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide",
      approved ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400",
      className
    )}>
      {approved ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {label ?? (approved ? "Approved" : "Pending Approval")}
    </span>
  );
}

export function ProbabilityBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(value * 100);
  const color = pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : pct >= 30 ? "bg-orange-500" : "bg-rose-500";
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex justify-between text-[10px]">
        <span className="text-terra-text-muted">Close Probability</span>
        <span className={cn("font-bold", pct >= 75 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-rose-400")}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-terra-border rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function DealHealthCard({ score, className }: { score: number; className?: string }) {
  const color = score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-rose-400";
  const bg = score >= 75 ? "bg-emerald-500/10" : score >= 50 ? "bg-amber-500/10" : "bg-rose-500/10";
  const ring = score >= 75 ? "border-emerald-500/30" : score >= 50 ? "border-amber-500/30" : "border-rose-500/30";
  return (
    <div className={cn("flex flex-col items-center justify-center w-14 h-14 rounded-xl border", bg, ring, className)}>
      <span className={cn("text-xl font-display font-bold", color)}>{score}</span>
      <span className="text-[8px] text-terra-text-muted uppercase tracking-wide">Health</span>
    </div>
  );
}

export function StageBadge({ stage, className }: { stage: string; className?: string }) {
  const stageColors: Record<string, string> = {
    lead: "bg-slate-500/10 text-slate-400",
    qualified: "bg-blue-500/10 text-blue-400",
    showing: "bg-cyan-500/10 text-cyan-400",
    "offer-drafted": "bg-indigo-500/10 text-indigo-400",
    "offer-submitted": "bg-violet-500/10 text-violet-400",
    negotiation: "bg-purple-500/10 text-purple-400",
    accepted: "bg-fuchsia-500/10 text-fuchsia-400",
    "attorney-review": "bg-pink-500/10 text-pink-400",
    inspection: "bg-rose-500/10 text-rose-400",
    financing: "bg-orange-500/10 text-orange-400",
    appraisal: "bg-amber-500/10 text-amber-400",
    "under-contract": "bg-lime-500/10 text-lime-400",
    "clear-to-close": "bg-emerald-500/10 text-emerald-400",
    closed: "bg-terra-primary/10 text-terra-primary",
    "lost-stalled": "bg-terra-text-muted/10 text-terra-text-muted",
    new: "bg-slate-500/10 text-slate-400",
    engaged: "bg-blue-500/10 text-blue-400",
    nurtured: "bg-amber-500/10 text-amber-400",
    hot: "bg-rose-500/10 text-rose-400",
    inactive: "bg-terra-text-muted/10 text-terra-text-muted",
    converted: "bg-emerald-500/10 text-emerald-400",
    active: "bg-emerald-500/10 text-emerald-400",
    pending: "bg-amber-500/10 text-amber-400",
    "under-contract-l": "bg-violet-500/10 text-violet-400",
    expired: "bg-terra-text-muted/10 text-terra-text-muted",
    withdrawn: "bg-rose-500/10 text-rose-400",
    sold: "bg-terra-primary/10 text-terra-primary",
  };
  const label = stage.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide", stageColors[stage] ?? "bg-slate-500/10 text-slate-400", className)}>
      {label}
    </span>
  );
}

export function StatusIndicator({ status, label, className }: { status: "success" | "error" | "warning" | "info" | "pending"; label?: string; className?: string }) {
  const cfg = {
    success: { icon: CheckCircle, cls: "text-emerald-400", dot: "bg-emerald-400" },
    error: { icon: XCircle, cls: "text-rose-400", dot: "bg-rose-400" },
    warning: { icon: AlertTriangle, cls: "text-amber-400", dot: "bg-amber-400" },
    info: { icon: Shield, cls: "text-blue-400", dot: "bg-blue-400" },
    pending: { icon: Clock, cls: "text-terra-text-muted", dot: "bg-terra-text-muted" },
  }[status];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", cfg.cls, className)}>
      <Icon className="w-3.5 h-3.5" />
      {label && <span>{label}</span>}
    </span>
  );
}

export function WorkflowTraceView({ steps, compact = false }: {
  steps: { label: string; status: "pending" | "in-progress" | "complete" | "overdue" | "blocked"; owner?: string; dueDate?: string }[];
  compact?: boolean;
}) {
  const statusConfig = {
    complete: { color: "bg-emerald-500", text: "text-emerald-400", label: "Complete" },
    "in-progress": { color: "bg-blue-500", text: "text-blue-400", label: "In Progress" },
    pending: { color: "bg-terra-text-muted", text: "text-terra-text-muted", label: "Pending" },
    overdue: { color: "bg-rose-500", text: "text-rose-400", label: "Overdue" },
    blocked: { color: "bg-amber-500", text: "text-amber-400", label: "Blocked" },
  };
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const cfg = statusConfig[step.status];
        const isLast = i === steps.length - 1;
        return (
          <div key={i} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={cn("w-3 h-3 rounded-full flex-shrink-0 mt-0.5", cfg.color)} />
              {!isLast && <div className={cn("w-0.5 flex-1 mt-1", step.status === "complete" ? "bg-emerald-500/30" : "bg-terra-border")} />}
            </div>
            <div className={cn("pb-3", isLast && "pb-0")}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-terra-text">{step.label}</span>
                <span className={cn("text-[10px] font-semibold", cfg.text)}>{cfg.label}</span>
              </div>
              {!compact && (step.owner || step.dueDate) && (
                <p className="text-[10px] text-terra-text-muted mt-0.5">
                  {step.owner && <span>{step.owner}</span>}
                  {step.owner && step.dueDate && <span> · </span>}
                  {step.dueDate && <span>Due {step.dueDate}</span>}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ActionQueue({ items, className }: {
  items: { label: string; assignee: string; due: string; priority: "low" | "medium" | "high" | "critical"; entityLabel: string }[];
  className?: string;
}) {
  const priorityConfig = {
    low: "border-l-terra-text-muted",
    medium: "border-l-amber-500",
    high: "border-l-rose-500",
    critical: "border-l-red-500",
  };
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item, i) => (
        <div key={i} className={cn("flex items-start gap-3 p-3 rounded-lg bg-terra-surface border border-terra-border border-l-2", priorityConfig[item.priority])}>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-terra-text truncate">{item.label}</p>
            <p className="text-[10px] text-terra-text-muted mt-0.5">{item.entityLabel} · {item.assignee}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-terra-text-muted">Due</p>
            <p className="text-[10px] font-semibold text-terra-text">{item.due}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AuditPanel({ entries, className }: {
  entries: { date: string; by: string; action: string }[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-3 text-xs">
          <div className="flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-terra-primary/40 flex-shrink-0 mt-0.5" />
            {i < entries.length - 1 && <div className="w-px flex-1 bg-terra-border mt-1" />}
          </div>
          <div className="pb-2">
            <p className="text-terra-text">{entry.action}</p>
            <p className="text-[10px] text-terra-text-muted mt-0.5">{entry.by} · {new Date(entry.date).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AgentAvatar({ name, avatar, className }: { name: string; avatar: string; className?: string }) {
  return (
    <div className={cn("w-8 h-8 rounded-full bg-gradient-to-br from-terra-primary to-terra-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0", className)}>
      {avatar}
    </div>
  );
}

export function RecommendationPanel({ recommendation, confidence, category, className }: {
  recommendation: string;
  confidence: number;
  category: "pricing" | "action" | "risk" | "intelligence";
  className?: string;
}) {
  const catConfig = {
    pricing: { icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    action: { icon: Zap, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    risk: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    intelligence: { icon: Shield, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
  }[category];
  const Icon = catConfig.icon;
  return (
    <div className={cn("flex gap-3 p-3 rounded-xl border", catConfig.bg, className)}>
      <Icon className={cn("w-4 h-4 flex-shrink-0 mt-0.5", catConfig.color)} />
      <div className="flex-1">
        <p className="text-xs text-terra-text leading-relaxed">{recommendation}</p>
        <ConfidenceBadge value={confidence} className="mt-2" />
      </div>
    </div>
  );
}

export function KPIStrip({ metrics }: {
  metrics: { label: string; value: string | number; sub?: string; alert?: boolean; trend?: "up" | "down" | "flat" }[]
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
      {metrics.map((m, i) => (
        <div key={i} className={cn(
          "rounded-xl border p-4 bg-terra-surface/50",
          m.alert ? "border-rose-500/30 bg-rose-500/5" : "border-terra-border"
        )}>
          <p className="text-[10px] text-terra-text-muted uppercase tracking-wider font-medium">{m.label}</p>
          <p className={cn("text-2xl font-display font-bold mt-1", m.alert ? "text-rose-400" : "text-terra-text")}>{m.value}</p>
          {m.sub && <p className="text-[10px] text-terra-text-muted mt-1">{m.sub}</p>}
        </div>
      ))}
    </div>
  );
}

export function PropertyDrawer({ listing, onClose }: {
  listing: { address: string; price: number; status: string; dom: number; agentName: string; riskLevel: string; riskFlags: string[] };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-terra-bg-secondary border-l border-terra-border shadow-2xl z-50 overflow-y-auto p-6">
      <button onClick={onClose} className="absolute top-4 right-4 text-terra-text-muted hover:text-terra-text">×</button>
      <h2 className="font-display font-bold text-terra-text mb-1">{listing.address}</h2>
      <p className="text-terra-text-secondary text-sm mb-4">${(listing.price / 1e6).toFixed(2)}M · {listing.dom} DOM</p>
      <div className="flex gap-2 mb-4">
        <StageBadge stage={listing.status} />
        <RiskBadge level={listing.riskLevel as any} />
      </div>
      <div className="space-y-2">
        {listing.riskFlags.map((flag, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/5 border border-rose-500/20 rounded-lg p-2">
            <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
            {flag}
          </div>
        ))}
      </div>
    </div>
  );
}

export function formatCurrency(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
