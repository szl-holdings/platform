import React, { useState } from "react";
import { Sword, GitBranch, TrendingUp, TrendingDown, AlertTriangle, Activity, ChevronDown, ChevronRight, BarChart3, Target } from "lucide-react";
import { WARGAME_SCENARIOS, type Scenario, type ScenarioBranch } from "@/lib/strategic-data";
import { cn } from "@/lib/utils";

const DOMAIN_CONFIG = {
  MARKET: { color: "#60a5fa", label: "Market" },
  SECURITY: { color: "#ef4444", label: "Security" },
  OPERATIONAL: { color: "#fb923c", label: "Operational" },
  LEGAL: { color: "#a78bfa", label: "Legal" },
};

function ImpactBar({ label, value }: { label: string; value: number }) {
  const pct = Math.abs(value);
  const color = value >= 0 ? "#4ade80" : value > -20 ? "#facc15" : value > -50 ? "#fb923c" : "#ef4444";
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-slate-500">{label}</span>
        <span className="font-mono" style={{ color }}>{value > 0 ? "+" : ""}{value}%</span>
      </div>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function BranchNode({ branch, depth = 0 }: { branch: ScenarioBranch; depth?: number }) {
  const [open, setOpen] = useState(depth === 0);
  const pct = Math.round(branch.probability * 100);
  const hasChildren = branch.children && branch.children.length > 0;
  const impactAvg = (branch.impact.financial + branch.impact.operational + branch.impact.strategic + branch.impact.legal) / 4;
  const nodeColor = impactAvg >= 0 ? "#4ade80" : impactAvg > -15 ? "#facc15" : impactAvg > -40 ? "#fb923c" : "#ef4444";

  return (
    <div style={{ marginLeft: depth > 0 ? "24px" : "0" }}>
      <div className={cn("border rounded-lg mb-2 overflow-hidden", depth === 0 ? "border-white/10" : "border-white/6")}
        style={{ background: depth === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.015)" }}>
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/3 transition-all"
        >
          {hasChildren ? (
            open ? <ChevronDown className="w-3 h-3 text-slate-500 flex-shrink-0" /> : <ChevronRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
          ) : (
            <Target className="w-3 h-3 flex-shrink-0" style={{ color: nodeColor }} />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-200">{branch.label}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 truncate">{branch.outcome}</div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-[10px] font-mono px-2 py-0.5 rounded border"
              style={{ color: nodeColor, borderColor: `${nodeColor}30`, background: `${nodeColor}10` }}>
              {pct}%
            </div>
          </div>
        </button>
        {open && (
          <div className="px-3 pb-3 pt-1 border-t border-white/5">
            <div className="grid grid-cols-2 gap-2 mb-2">
              <ImpactBar label="Financial" value={branch.impact.financial} />
              <ImpactBar label="Operational" value={branch.impact.operational} />
              <ImpactBar label="Strategic" value={branch.impact.strategic} />
              <ImpactBar label="Legal" value={branch.impact.legal} />
            </div>
          </div>
        )}
      </div>
      {open && hasChildren && (
        <div className="ml-2 border-l border-white/5 pl-2">
          {branch.children!.map((child) => (
            <BranchNode key={child.id} branch={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function MonteCarloViz({ scenario }: { scenario: Scenario }) {
  const bars = 20;
  const range = scenario.bestCase - scenario.worstCase;
  const expectedPct = ((scenario.expectedValue - scenario.worstCase) / range) * 100;

  return (
    <div className="imperial-card rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4" style={{ color: "#c9a227" }} />
        <span className="font-display text-xs tracking-[0.12em] gold-text uppercase">Monte Carlo Distribution</span>
      </div>
      <div className="flex items-end gap-0.5 h-16 mb-2">
        {Array.from({ length: bars }).map((_, i) => {
          const pos = i / bars;
          const heightPct = Math.exp(-0.5 * Math.pow((pos - 0.5) * 3, 2)) * 100;
          const isExpected = Math.abs(pos - expectedPct / 100) < 0.08;
          return (
            <div key={i} className="flex-1 rounded-t-sm transition-all"
              style={{
                height: `${heightPct}%`,
                backgroundColor: isExpected ? "#c9a227" : pos < 0.3 ? "#ef444440" : pos > 0.7 ? "#4ade8040" : "rgba(255,255,255,0.1)",
              }}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-red-400">${(scenario.worstCase / 1000000).toFixed(1)}M worst</span>
        <span className="text-yellow-400">${(scenario.expectedValue / 1000000).toFixed(1)}M expected</span>
        <span className="text-green-400">${(scenario.bestCase / 1000000).toFixed(1)}M best</span>
      </div>
      <div className="mt-3 rounded p-2 bg-white/3 border border-white/5 text-center">
        <span className="text-[10px] text-slate-500 font-mono">MONTE CARLO PROBABILITY OF ACTIVATION: </span>
        <span className="font-mono text-sm font-bold" style={{ color: scenario.monteCarloPct > 50 ? "#ef4444" : scenario.monteCarloPct > 25 ? "#fb923c" : "#facc15" }}>
          {scenario.monteCarloPct}%
        </span>
      </div>
    </div>
  );
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const [expanded, setExpanded] = useState(false);
  const domain = DOMAIN_CONFIG[scenario.domain];

  return (
    <div className="imperial-card rounded-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left hover:bg-white/2 transition-all">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded flex-shrink-0 flex items-center justify-center"
            style={{ background: `${domain.color}15`, border: `1px solid ${domain.color}40` }}>
            <Sword className="w-4 h-4" style={{ color: domain.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className="font-semibold text-sm text-slate-200">{scenario.name}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border"
                  style={{ color: domain.color, borderColor: `${domain.color}30`, background: `${domain.color}10` }}>
                  {scenario.domain}
                </span>
                <span className="px-2 py-0.5 rounded font-mono text-[9px] tracking-widest border"
                  style={{ color: scenario.status === "ACTIVE" ? "#ef4444" : "#94a3b8", borderColor: scenario.status === "ACTIVE" ? "#ef444430" : "#94a3b820", background: scenario.status === "ACTIVE" ? "#ef444410" : "rgba(255,255,255,0.03)" }}>
                  {scenario.status}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-slate-500">Trigger: {scenario.trigger}</div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-orange-400" />
                <span className="text-[10px] font-mono text-orange-400">{scenario.monteCarloPct}% probability</span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-3 h-3 text-red-400" />
                <span className="text-[10px] font-mono text-red-400">${(scenario.worstCase / 1000000).toFixed(1)}M worst case</span>
              </div>
            </div>
          </div>
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">{scenario.description}</p>

          <MonteCarloViz scenario={scenario} />

          <div>
            <div className="flex items-center gap-2 mb-3">
              <GitBranch className="w-3.5 h-3.5" style={{ color: "#c9a227" }} />
              <span className="font-display text-[10px] tracking-[0.12em] gold-text uppercase">Decision Branches</span>
            </div>
            {scenario.branches.map((branch) => (
              <BranchNode key={branch.id} branch={branch} depth={0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Wargaming() {
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const filtered = activeDomain ? WARGAME_SCENARIOS.filter((s) => s.domain === activeDomain) : WARGAME_SCENARIOS;
  const activeCount = WARGAME_SCENARIOS.filter((s) => s.status === "ACTIVE").length;
  const avgProbability = Math.round(WARGAME_SCENARIOS.reduce((a, s) => a + s.monteCarloPct, 0) / WARGAME_SCENARIOS.length);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Sword className="w-5 h-5" style={{ color: "#c9a227" }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Wargaming & Decision Theater
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Multi-branch scenario engine — Monte Carlo simulation · Decision tree modeling · Cascading outcome analysis
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Active Scenarios", value: activeCount, color: "#ef4444", icon: Sword },
          { label: "Avg Probability", value: `${avgProbability}%`, color: "#fb923c", icon: Activity },
          { label: "Worst Case Exposure", value: "$7.3M", color: "#ef4444", icon: TrendingDown },
          { label: "Scenarios Modeled", value: WARGAME_SCENARIOS.length, color: "#c9a227", icon: GitBranch },
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
        {[null, "MARKET", "SECURITY", "OPERATIONAL", "LEGAL"].map((domain) => (
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
            {domain || "ALL DOMAINS"}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((scenario) => (
          <ScenarioCard key={scenario.id} scenario={scenario} />
        ))}
      </div>
    </div>
  );
}
