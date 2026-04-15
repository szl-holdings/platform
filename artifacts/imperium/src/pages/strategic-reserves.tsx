import React, { useState } from "react";
import { Package, DollarSign, Users, Cpu, AlertTriangle, TrendingDown, Clock, RefreshCw, ChevronDown, ChevronRight } from "lucide-react";
import { STRATEGIC_RESERVES, type ReserveCategory } from "@/lib/strategic-data";
import { cn } from "@/lib/utils";

const TYPE_CONFIG = {
  FINANCIAL: { color: "#c9a227", icon: DollarSign },
  PERSONNEL: { color: "#60a5fa", icon: Users },
  EQUIPMENT: { color: "#4ade80", icon: Package },
  DIGITAL: { color: "#a78bfa", icon: Cpu },
};

const STATUS_CONFIG = {
  HEALTHY: { color: "#4ade80", label: "HEALTHY" },
  WATCH: { color: "#fb923c", label: "WATCH" },
  DEPLETED: { color: "#ef4444", label: "DEPLETED" },
};

function RunwayGauge({ days }: { days: number }) {
  const maxDays = 365;
  const pct = Math.min((days / maxDays) * 100, 100);
  const color = days > 120 ? "#4ade80" : days > 60 ? "#facc15" : days > 30 ? "#fb923c" : "#ef4444";
  const label = days > 120 ? "SECURE" : days > 60 ? "WATCH" : days > 30 ? "CRITICAL" : "DEPLETED";

  return (
    <div className="text-center">
      <div className="relative w-16 h-16 mx-auto mb-2">
        <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
          <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={2 * Math.PI * 28}
            strokeDashoffset={2 * Math.PI * 28 * (1 - pct / 100)}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-sm font-bold leading-tight" style={{ color }}>
            {days > 365 ? "∞" : days}
          </span>
          <span className="text-[8px] text-slate-600 leading-tight">days</span>
        </div>
      </div>
      <span className="font-mono text-[9px] tracking-widest" style={{ color }}>{label}</span>
    </div>
  );
}

function DrawdownBar({ scenario, reserve }: { scenario: { name: string; impact: number; duration: string }; reserve: ReserveCategory }) {
  const cfg = TYPE_CONFIG[reserve.type];
  return (
    <div className="rounded p-2.5 bg-white/3 border border-white/5">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-slate-300">{scenario.name}</span>
        <span className="font-mono text-[10px]" style={{ color: scenario.impact > 50 ? "#ef4444" : scenario.impact > 30 ? "#fb923c" : "#facc15" }}>
          -{scenario.impact}%
        </span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden mb-1">
        <div className="h-full rounded-full"
          style={{ width: `${scenario.impact}%`, backgroundColor: scenario.impact > 50 ? "#ef4444" : scenario.impact > 30 ? "#fb923c" : "#facc15" }} />
      </div>
      <div className="text-[9px] text-slate-600 font-mono">{scenario.duration} drawdown</div>
    </div>
  );
}

function ReserveCard({ reserve }: { reserve: ReserveCategory }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[reserve.type];
  const Icon = cfg.icon;
  const statusCfg = STATUS_CONFIG[reserve.status];
  const utilizationPct = (reserve.committed / reserve.total) * 100;

  const formatVal = (v: number) => {
    if (reserve.unit === "$") return `$${v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`}`;
    return `${v} ${reserve.unit}`;
  };

  return (
    <div className="imperial-card rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left hover:bg-white/2 transition-all">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
            style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}40` }}>
            <Icon className="w-5 h-5" style={{ color: cfg.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="font-semibold text-sm text-slate-200">{reserve.name}</span>
              <span className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border flex-shrink-0"
                style={{ color: statusCfg.color, borderColor: `${statusCfg.color}30`, background: `${statusCfg.color}10` }}>
                {statusCfg.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-500 mb-2">
              <span>{reserve.type} RESERVE</span>
              <span>{utilizationPct.toFixed(0)}% committed</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all"
                style={{ width: `${utilizationPct}%`, backgroundColor: utilizationPct > 80 ? "#ef4444" : utilizationPct > 60 ? "#fb923c" : cfg.color, opacity: 0.8 }} />
            </div>
          </div>
          <RunwayGauge days={reserve.runwayDays} />
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded p-3 text-center bg-white/3">
              <div className="font-mono text-sm font-bold text-slate-200">{formatVal(reserve.total)}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Total Capacity</div>
            </div>
            <div className="rounded p-3 text-center bg-white/3">
              <div className="font-mono text-sm font-bold" style={{ color: cfg.color }}>{formatVal(reserve.available)}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Available</div>
            </div>
            <div className="rounded p-3 text-center bg-white/3">
              <div className="font-mono text-sm font-bold text-slate-400">{formatVal(reserve.committed)}</div>
              <div className="text-[9px] text-slate-500 mt-0.5">Committed</div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-3.5 h-3.5" style={{ color: "#c9a227" }} />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">Drawdown Scenarios</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {reserve.drawdownScenarios.map((scenario, i) => (
                <DrawdownBar key={i} scenario={scenario} reserve={reserve} />
              ))}
            </div>
          </div>

          <div className="rounded-lg p-3 border"
            style={{ background: "rgba(201,162,39,0.04)", borderColor: "rgba(201,162,39,0.15)" }}>
            <div className="flex items-start gap-2">
              <RefreshCw className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" style={{ color: "#c9a227" }} />
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">Replenishment Plan</div>
                <div className="text-xs text-slate-300 leading-relaxed">{reserve.replenishmentPlan}</div>
                {reserve.replenishmentDays > 0 && (
                  <div className="text-[10px] text-slate-500 mt-1 font-mono">SLA: {reserve.replenishmentDays}-day activation</div>
                )}
                {reserve.replenishmentDays === 0 && (
                  <div className="text-[10px] text-green-400 mt-1 font-mono">IMMEDIATE — auto-scaling enabled</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StrategicReserves() {
  const watchCount = STRATEGIC_RESERVES.filter((r) => r.status === "WATCH").length;
  const depletedCount = STRATEGIC_RESERVES.filter((r) => r.status === "DEPLETED").length;
  const avgRunway = Math.round(STRATEGIC_RESERVES.filter((r) => r.runwayDays < 365).reduce((a, r) => a + r.runwayDays, 0) / STRATEGIC_RESERVES.length);
  const totalFinancial = STRATEGIC_RESERVES.filter((r) => r.type === "FINANCIAL").reduce((a, r) => a + r.available, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Package className="w-5 h-5" style={{ color: "#c9a227" }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Strategic Reserve Dashboard
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Reserve capacity tracking — drawdown scenarios · replenishment timelines · runway analysis across all reserve types
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Reserve Categories", value: STRATEGIC_RESERVES.length, color: "#c9a227", icon: Package },
          { label: "Financial Available", value: `$${(totalFinancial / 1000000).toFixed(1)}M`, color: "#4ade80", icon: DollarSign },
          { label: "Under Watch", value: watchCount, color: watchCount > 0 ? "#fb923c" : "#4ade80", icon: AlertTriangle },
          { label: "Avg Runway", value: `${avgRunway}d`, color: avgRunway > 90 ? "#4ade80" : "#fb923c", icon: Clock },
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

      {(watchCount > 0 || depletedCount > 0) && (
        <div className="rounded-lg p-3 border border-orange-900/50 bg-orange-950/20">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 animate-pulse flex-shrink-0" />
            <div>
              <span className="font-display text-xs tracking-[0.12em] text-orange-400 uppercase font-bold">Reserve Status Alert</span>
              <div className="text-[10px] text-orange-300 mt-0.5">
                {watchCount} reserve{watchCount > 1 ? "s" : ""} at WATCH status — replenishment recommended.
                {depletedCount > 0 && ` ${depletedCount} DEPLETED — immediate action required.`}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {STRATEGIC_RESERVES.map((reserve) => (
          <ReserveCard key={reserve.id} reserve={reserve} />
        ))}
      </div>
    </div>
  );
}
