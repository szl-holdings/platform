import React, { useState } from "react";
import { GitMerge, CheckCircle, AlertTriangle, Clock, Activity, Shield, Target, ChevronDown, ChevronRight, Lock, Zap } from "lucide-react";
import { DIRECTIVES, type Directive, type DirectiveLayer } from "@/lib/strategic-data";
import { ClassificationBadge } from "@/components/classification-badge";
import { cn } from "@/lib/utils";

const DOMAIN_CONFIG = {
  SECURITY: { color: "#ef4444" },
  OPERATIONAL: { color: "#fb923c" },
  STRATEGIC: { color: "#c9a227" },
  COMPLIANCE: { color: "#a78bfa" },
};

const STATUS_CONFIG = {
  ISSUED: { color: "#60a5fa", label: "ISSUED", icon: Zap },
  IN_PROGRESS: { color: "#facc15", label: "IN PROGRESS", icon: Activity },
  BLOCKED: { color: "#ef4444", label: "BLOCKED", icon: AlertTriangle },
  COMPLETE: { color: "#4ade80", label: "COMPLETE", icon: CheckCircle },
  OVERDUE: { color: "#ef4444", label: "OVERDUE", icon: Clock },
};

const PRIORITY_CONFIG = {
  P1: { color: "#ef4444", label: "PRIORITY 1" },
  P2: { color: "#fb923c", label: "PRIORITY 2" },
  P3: { color: "#94a3b8", label: "PRIORITY 3" },
};

function LayerProgressRow({ layer, index }: { layer: DirectiveLayer; index: number }) {
  const statusCfg = STATUS_CONFIG[layer.status];
  const StatusIcon = statusCfg.icon;
  const hasBlockers = layer.blockers.length > 0;

  return (
    <div className={cn("relative flex gap-3 pb-4 last:pb-0")}>
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 font-mono text-[10px] font-bold"
          style={{
            background: `${statusCfg.color}20`,
            border: `2px solid ${statusCfg.color}60`,
            color: statusCfg.color,
          }}>
          {index + 1}
        </div>
        {index < 4 && <div className="flex-1 w-0.5 mt-1" style={{ backgroundColor: "rgba(255,255,255,0.05)", minHeight: "12px" }} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div>
            <span className="text-xs font-semibold text-slate-200">{layer.org}</span>
            <div className="text-[10px] text-slate-500">{layer.role}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusIcon className="w-3.5 h-3.5" style={{ color: statusCfg.color }} />
            <span className="font-mono text-[9px] tracking-widest" style={{ color: statusCfg.color }}>{statusCfg.label}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-1.5">
          <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${layer.progress}%`, backgroundColor: statusCfg.color, opacity: 0.7 }} />
          </div>
          <span className="font-mono text-[10px] text-slate-400 flex-shrink-0">{layer.progress}%</span>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-600">
          <span>{layer.assignee}</span>
          <span>{layer.lastUpdate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>

        {hasBlockers && (
          <div className="mt-1.5 space-y-1">
            {layer.blockers.map((blocker, bi) => (
              <div key={bi} className="flex items-start gap-1.5 rounded px-2 py-1 bg-red-950/30 border border-red-900/30">
                <AlertTriangle className="w-2.5 h-2.5 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="text-[10px] text-red-300">{blocker}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ComplianceGauge({ progress }: { progress: number }) {
  const color = progress >= 80 ? "#4ade80" : progress >= 50 ? "#facc15" : progress >= 25 ? "#fb923c" : "#ef4444";
  const circumference = 2 * Math.PI * 24;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
        <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
        <circle cx="28" cy="28" r="24" fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 4px ${color}50)`, transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-sm font-bold leading-none" style={{ color }}>{progress}%</span>
      </div>
    </div>
  );
}

function DirectiveCard({ directive }: { directive: Directive }) {
  const [expanded, setExpanded] = useState(false);
  const domainCfg = DOMAIN_CONFIG[directive.domain];
  const statusCfg = STATUS_CONFIG[directive.status];
  const priorityCfg = PRIORITY_CONFIG[directive.priority];
  const StatusIcon = statusCfg.icon;
  const daysLeft = Math.ceil((directive.dueDate.getTime() - Date.now()) / 86400000);
  const blockedLayers = directive.layers.filter((l) => l.blockers.length > 0).length;

  return (
    <div className="imperial-card rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left hover:bg-white/2 transition-all">
        <div className="flex items-start gap-3">
          <ComplianceGauge progress={directive.overallProgress} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="font-display text-sm tracking-[0.08em] font-bold text-slate-200 leading-tight">{directive.title}</span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <StatusIcon className="w-3.5 h-3.5" style={{ color: statusCfg.color }} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border"
                style={{ color: priorityCfg.color, borderColor: `${priorityCfg.color}30`, background: `${priorityCfg.color}10` }}>
                {directive.priority}
              </span>
              <span className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border"
                style={{ color: domainCfg.color, borderColor: `${domainCfg.color}30`, background: `${domainCfg.color}10` }}>
                {directive.domain}
              </span>
              <ClassificationBadge classification={directive.classification} size="xs" />
              <span className="text-[10px] text-slate-500 font-mono">{daysLeft > 0 ? `${daysLeft}d remaining` : "OVERDUE"}</span>
            </div>
            <div className="flex items-center gap-4 mt-1.5 text-[10px] text-slate-500">
              <span>Issued by {directive.issuedBy}</span>
              {blockedLayers > 0 && (
                <span className="text-orange-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {blockedLayers} layer{blockedLayers > 1 ? "s" : ""} blocked
                </span>
              )}
            </div>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">{directive.summary}</p>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded p-2.5 bg-white/3 text-center">
              <div className="text-[10px] text-slate-500 mb-1">Issued</div>
              <div className="font-mono text-xs text-slate-300">
                {directive.issuedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
            <div className="rounded p-2.5 bg-white/3 text-center">
              <div className="text-[10px] text-slate-500 mb-1">Due Date</div>
              <div className="font-mono text-xs" style={{ color: daysLeft < 30 ? "#fb923c" : "#94a3b8" }}>
                {directive.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div className="rounded p-2.5 bg-white/3 text-center">
              <div className="text-[10px] text-slate-500 mb-1">Overall Progress</div>
              <div className="font-mono text-xs font-bold" style={{ color: directive.overallProgress >= 80 ? "#4ade80" : "#facc15" }}>
                {directive.overallProgress}%
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <GitMerge className="w-3.5 h-3.5" style={{ color: "#c9a227" }} />
              <span className="font-display text-[10px] tracking-[0.12em] gold-text uppercase">Execution Cascade</span>
            </div>
            <div className="border-l border-white/8 pl-3 space-y-0">
              {directive.layers.map((layer, i) => (
                <LayerProgressRow key={i} layer={layer} index={i} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DirectiveCascade() {
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const filtered = activeDomain ? DIRECTIVES.filter((d) => d.domain === activeDomain) : DIRECTIVES;
  const activeCount = DIRECTIVES.filter((d) => d.status === "IN_PROGRESS").length;
  const completedCount = DIRECTIVES.filter((d) => d.status === "COMPLETE").length;
  const blockedLayers = DIRECTIVES.flatMap((d) => d.layers).filter((l) => l.blockers.length > 0).length;
  const avgProgress = Math.round(DIRECTIVES.filter((d) => d.status !== "COMPLETE").reduce((a, d) => a + d.overallProgress, 0) / DIRECTIVES.filter((d) => d.status !== "COMPLETE").length);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <GitMerge className="w-5 h-5" style={{ color: "#c9a227" }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Directive Cascade Engine
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Senate-issued directives tracked through organizational layers — status rollup · blocker identification · compliance verification
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Directives", value: activeCount, color: "#facc15", icon: Activity },
          { label: "Completed", value: completedCount, color: "#4ade80", icon: CheckCircle },
          { label: "Avg Progress", value: `${avgProgress}%`, color: "#c9a227", icon: Target },
          { label: "Blocked Layers", value: blockedLayers, color: blockedLayers > 0 ? "#ef4444" : "#4ade80", icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="imperial-card rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-3.5 h-3.5" style={{ color }} />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
            </div>
            <div className="font-mono text-xl font-bold" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {blockedLayers > 0 && (
        <div className="rounded-lg p-3 border border-red-900/50 bg-red-950/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse flex-shrink-0" />
            <div>
              <span className="font-display text-xs tracking-[0.12em] text-red-400 uppercase font-bold">Execution Blockers Detected</span>
              <div className="text-[10px] text-red-300 mt-0.5">
                {blockedLayers} organizational layer{blockedLayers > 1 ? "s" : ""} reporting blockers. Senate review recommended.
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {[null, "SECURITY", "OPERATIONAL", "STRATEGIC", "COMPLIANCE"].map((domain) => (
          <button
            key={domain || "all"}
            onClick={() => setActiveDomain(domain)}
            className="px-3 py-1 rounded-full font-mono text-[10px] tracking-widest border transition-all"
            style={{
              color: domain ? DOMAIN_CONFIG[domain as keyof typeof DOMAIN_CONFIG].color : "#c9a227",
              borderColor: activeDomain === domain ? (domain ? DOMAIN_CONFIG[domain as keyof typeof DOMAIN_CONFIG].color : "#c9a227") : "rgba(255,255,255,0.1)",
              background: activeDomain === domain ? (domain ? `${DOMAIN_CONFIG[domain as keyof typeof DOMAIN_CONFIG].color}15` : "rgba(201,162,39,0.1)") : "transparent",
            }}
          >
            {domain || "ALL DIRECTIVES"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((directive) => (
          <DirectiveCard key={directive.id} directive={directive} />
        ))}
      </div>
    </div>
  );
}
