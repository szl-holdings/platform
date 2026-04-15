import React, { useState } from "react";
import { Sliders, DollarSign, Users, Cpu, Clock, TrendingUp, AlertTriangle, Lock, BarChart3 } from "lucide-react";
import { RESOURCE_POOLS, type ResourcePool, type ResourceAllocation } from "@/lib/strategic-data";
import { cn } from "@/lib/utils";

const CATEGORY_CONFIG = {
  CAPITAL: { icon: DollarSign, color: "#c9a227", label: "Capital" },
  PERSONNEL: { icon: Users, color: "#60a5fa", label: "Personnel" },
  TECHNOLOGY: { icon: Cpu, color: "#a78bfa", label: "Technology" },
  TIME: { icon: Clock, color: "#4ade80", label: "Time" },
};

const PRIORITY_CONFIG = {
  P1: { color: "#ef4444", label: "P1 — Critical" },
  P2: { color: "#fb923c", label: "P2 — High" },
  P3: { color: "#94a3b8", label: "P3 — Normal" },
};

function ImpactScoreGauge({ score }: { score: number }) {
  const color = score >= 85 ? "#4ade80" : score >= 70 ? "#facc15" : "#fb923c";
  const circumference = 2 * Math.PI * 16;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-10 h-10">
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle cx="18" cy="18" r="16" fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-mono text-[9px] font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}

function AllocationRow({ alloc, total, unit }: { alloc: ResourceAllocation; total: number; unit: string }) {
  const pct = (alloc.amount / total) * 100;
  const priorityConfig = PRIORITY_CONFIG[alloc.priority];
  const formatAmount = (amount: number) => {
    if (unit === "$") return `$${amount >= 1000000 ? `${(amount / 1000000).toFixed(1)}M` : `${(amount / 1000).toFixed(0)}K`}`;
    return `${amount} ${unit}`;
  };

  return (
    <div className="rounded-lg p-3 border border-white/5 bg-white/2 hover:border-gold/20 transition-all">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200 truncate">{alloc.initiative}</span>
            {alloc.locked && <Lock className="w-3 h-3 text-slate-600 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded border"
              style={{ color: priorityConfig.color, borderColor: `${priorityConfig.color}30`, background: `${priorityConfig.color}10` }}>
              {alloc.priority}
            </span>
            {alloc.roi > 0 && (
              <span className="text-[10px] text-slate-500 font-mono">ROI {alloc.roi}x</span>
            )}
          </div>
        </div>
        <ImpactScoreGauge score={alloc.impactScore} />
        <div className="text-right flex-shrink-0">
          <div className="font-mono text-sm font-bold text-slate-200">{formatAmount(alloc.amount)}</div>
          <div className="text-[10px] text-slate-500 font-mono">{pct.toFixed(0)}%</div>
        </div>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: priorityConfig.color, opacity: 0.7 }} />
      </div>
    </div>
  );
}

function PoolCard({ pool }: { pool: ResourcePool }) {
  const cfg = CATEGORY_CONFIG[pool.category];
  const Icon = cfg.icon;
  const allocated = pool.allocations.reduce((a, al) => a + al.amount, 0);
  const utilization = (allocated / pool.total) * 100;
  const formatVal = (v: number) => {
    if (pool.unit === "$") return `$${v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : `${(v / 1000).toFixed(0)}K`}`;
    return `${v} ${pool.unit}`;
  };

  const utilizationColor = utilization > 95 ? "#ef4444" : utilization > 80 ? "#fb923c" : "#4ade80";
  const sortedAllocs = [...pool.allocations].sort((a, b) => b.impactScore - a.impactScore);

  return (
    <div className="imperial-card rounded-lg p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: `${cfg.color}15`, border: `1px solid ${cfg.color}40` }}>
            <Icon className="w-5 h-5" style={{ color: cfg.color }} />
          </div>
          <div>
            <div className="font-display text-sm tracking-[0.12em] font-bold" style={{ color: cfg.color }}>{pool.name}</div>
            <div className="text-[10px] text-slate-500">{cfg.label} Pool</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-base font-bold" style={{ color: utilizationColor }}>{utilization.toFixed(0)}%</div>
          <div className="text-[10px] text-slate-500">utilized</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded p-2.5 bg-white/3 text-center">
          <div className="font-mono text-sm font-bold text-slate-200">{formatVal(pool.total)}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Total</div>
        </div>
        <div className="rounded p-2.5 bg-white/3 text-center">
          <div className="font-mono text-sm font-bold" style={{ color: cfg.color }}>{formatVal(allocated)}</div>
          <div className="text-[9px] text-slate-500 mt-0.5">Allocated</div>
        </div>
        <div className="rounded p-2.5 bg-white/3 text-center">
          <div className="font-mono text-sm font-bold" style={{ color: pool.total - allocated > 0 ? "#4ade80" : "#ef4444" }}>
            {formatVal(pool.total - allocated)}
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">Available</div>
        </div>
      </div>

      <div className="h-2 rounded-full overflow-hidden bg-white/5 flex mb-4">
        {sortedAllocs.map((a) => (
          <div key={a.initiative}
            className="h-full"
            style={{
              width: `${(a.amount / pool.total) * 100}%`,
              backgroundColor: PRIORITY_CONFIG[a.priority].color,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      <div className="space-y-2">
        {sortedAllocs.map((alloc) => (
          <AllocationRow key={alloc.initiative} alloc={alloc} total={pool.total} unit={pool.unit} />
        ))}
      </div>
    </div>
  );
}

function TradeOffMatrix() {
  const initiatives = ["CORTEX Platform", "Terra AI", "Vessels Expansion", "Aegis Legal", "Security"];
  const scores = [
    [94, 88, 62, 74, 85],
    [88, 92, 71, 78, 82],
    [82, 85, 68, 76, 89],
    [78, 80, 65, 88, 78],
  ];
  const resources = ["Capital", "Personnel", "Technology", "Time"];

  return (
    <div className="imperial-card rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4" style={{ color: "#c9a227" }} />
        <span className="font-display text-xs tracking-[0.15em] gold-text uppercase">Impact Trade-Off Matrix</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] font-mono">
          <thead>
            <tr>
              <th className="text-left text-slate-500 pb-2 pr-3">Resource →</th>
              {initiatives.map((init) => (
                <th key={init} className="text-center text-slate-500 pb-2 px-1 font-normal" style={{ maxWidth: "80px" }}>
                  <span className="truncate block" style={{ maxWidth: "70px" }}>{init}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.map((res, ri) => (
              <tr key={res}>
                <td className="text-slate-400 py-1.5 pr-3 whitespace-nowrap">{res}</td>
                {scores[ri].map((score, ci) => {
                  const color = score >= 85 ? "#4ade80" : score >= 70 ? "#facc15" : "#fb923c";
                  return (
                    <td key={ci} className="text-center py-1.5 px-1">
                      <span className="px-2 py-0.5 rounded font-bold" style={{ color, background: `${color}15` }}>{score}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-[10px] text-slate-600 flex items-center gap-4">
        <span className="flex items-center gap-1"><span style={{ color: "#4ade80" }}>●</span> High impact (85+)</span>
        <span className="flex items-center gap-1"><span style={{ color: "#facc15" }}>●</span> Medium (70–84)</span>
        <span className="flex items-center gap-1"><span style={{ color: "#fb923c" }}>●</span> Lower (&lt;70)</span>
      </div>
    </div>
  );
}

export default function ResourceOptimizer() {
  const [activePool, setActivePool] = useState<string | null>(null);
  const displayPools = activePool ? RESOURCE_POOLS.filter((p) => p.id === activePool) : RESOURCE_POOLS;
  const totalAllocated = RESOURCE_POOLS[0].allocations.reduce((a, al) => a + al.amount, 0);
  const highImpact = RESOURCE_POOLS.flatMap((p) => p.allocations).filter((a) => a.impactScore >= 85).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Sliders className="w-5 h-5" style={{ color: "#c9a227" }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Resource Allocation Optimizer
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Visual allocation across capital, personnel, technology & time — constraint modeling · impact scoring · trade-off analysis
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Capital Allocated", value: `$${(totalAllocated / 1000000).toFixed(1)}M`, color: "#c9a227", icon: DollarSign },
          { label: "High-Impact Items", value: highImpact, color: "#4ade80", icon: TrendingUp },
          { label: "Resource Pools", value: RESOURCE_POOLS.length, color: "#60a5fa", icon: Sliders },
          { label: "Locked Allocations", value: RESOURCE_POOLS.flatMap((p) => p.allocations).filter((a) => a.locked).length, color: "#fb923c", icon: Lock },
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

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActivePool(null)}
          className={cn("px-3 py-1 rounded-full font-mono text-[10px] tracking-widest border transition-all",
            !activePool ? "border-gold/50 bg-gold/10 text-gold" : "border-white/10 text-slate-400")}
        >ALL POOLS</button>
        {RESOURCE_POOLS.map((pool) => {
          const cfg = CATEGORY_CONFIG[pool.category];
          return (
            <button key={pool.id} onClick={() => setActivePool(pool.id === activePool ? null : pool.id)}
              className="px-3 py-1 rounded-full font-mono text-[10px] tracking-widest border transition-all"
              style={{
                color: cfg.color,
                borderColor: activePool === pool.id ? cfg.color : "rgba(255,255,255,0.1)",
                background: activePool === pool.id ? `${cfg.color}15` : "transparent",
              }}>
              {pool.category}
            </button>
          );
        })}
      </div>

      <TradeOffMatrix />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {displayPools.map((pool) => (
          <PoolCard key={pool.id} pool={pool} />
        ))}
      </div>
    </div>
  );
}
