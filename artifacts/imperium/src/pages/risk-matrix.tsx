import React, { useState } from "react";
import { AlertTriangle, Network, TrendingDown, Shield, Activity, ChevronDown, ChevronRight, ArrowRight, Eye } from "lucide-react";
import { RISK_NODES, type RiskNode } from "@/lib/strategic-data";
import { cn } from "@/lib/utils";

const DOMAIN_CONFIG = {
  MARKET: { color: "#60a5fa", label: "Market" },
  OPERATIONAL: { color: "#fb923c", label: "Operational" },
  SECURITY: { color: "#ef4444", label: "Security" },
  LEGAL: { color: "#a78bfa", label: "Legal" },
  FINANCIAL: { color: "#c9a227", label: "Financial" },
  REPUTATIONAL: { color: "#4ade80", label: "Reputational" },
};

const STATUS_CONFIG = {
  ACTIVE: { color: "#ef4444", label: "ACTIVE" },
  MONITORING: { color: "#facc15", label: "MONITORING" },
  MITIGATED: { color: "#4ade80", label: "MITIGATED" },
  ACCEPTED: { color: "#94a3b8", label: "ACCEPTED" },
};

function getRiskColor(score: number): string {
  if (score >= 80) return "#ef4444";
  if (score >= 65) return "#fb923c";
  if (score >= 50) return "#facc15";
  return "#4ade80";
}

function getRiskLabel(score: number): string {
  if (score >= 80) return "CRITICAL";
  if (score >= 65) return "HIGH";
  if (score >= 50) return "MEDIUM";
  return "LOW";
}

function HeatMap() {
  const cells = RISK_NODES.map((r) => ({
    id: r.id,
    x: Math.round(r.likelihood * 10),
    y: Math.round(r.impact * 10),
    label: r.title.split(" — ")[0].split(" ").slice(0, 2).join(" "),
    color: r.color,
    score: r.riskScore,
  }));

  return (
    <div className="imperial-card rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4" style={{ color: "#c9a227" }} />
        <span className="font-display text-xs tracking-[0.15em] gold-text uppercase">Risk Heat Map</span>
      </div>
      <div className="relative" style={{ paddingBottom: "55%" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 110 65">
          <defs>
            <linearGradient id="heatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(74,222,128,0.12)" />
              <stop offset="50%" stopColor="rgba(251,146,60,0.12)" />
              <stop offset="100%" stopColor="rgba(239,68,68,0.12)" />
            </linearGradient>
            <linearGradient id="heatGradV" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(239,68,68,0.08)" />
            </linearGradient>
          </defs>

          <rect x="10" y="2" width="95" height="55" fill="url(#heatGrad)" rx="2" />
          <rect x="10" y="2" width="95" height="55" fill="url(#heatGradV)" rx="2" />

          {[0, 25, 50, 75, 100].map((v) => {
            const x = 10 + (v / 100) * 95;
            return (
              <g key={v}>
                <line x1={x} y1="2" x2={x} y2="57" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                <text x={x} y="62" textAnchor="middle" fontSize="2.5" fill="rgba(148,163,184,0.5)" fontFamily="monospace">{v}%</text>
              </g>
            );
          })}
          {[0, 25, 50, 75, 100].map((v) => {
            const y = 57 - (v / 100) * 55;
            return (
              <g key={v}>
                <line x1="10" y1={y} x2="105" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                <text x="7" y={y + 1} textAnchor="end" fontSize="2.5" fill="rgba(148,163,184,0.5)" fontFamily="monospace">{v}%</text>
              </g>
            );
          })}

          {cells.map((cell) => {
            const cx = 10 + (cell.x / 10) * 95;
            const cy = 57 - (cell.y / 10) * 55;
            return (
              <g key={cell.id}>
                <circle cx={cx} cy={cy} r="3.5" fill={`${cell.color}30`} stroke={cell.color} strokeWidth="0.8">
                  <animate attributeName="r" values="3.5;4.5;3.5" dur="3s" repeatCount="indefinite" />
                </circle>
                <text x={cx} y={cy + 0.5} textAnchor="middle" dominantBaseline="middle"
                  fontSize="2" fill={cell.color} fontFamily="monospace" fontWeight="bold">
                  {cell.score}
                </text>
              </g>
            );
          })}

          <text x="57" y="65" textAnchor="middle" fontSize="3" fill="rgba(148,163,184,0.4)" fontFamily="monospace">LIKELIHOOD →</text>
          <text x="3" y="32" textAnchor="middle" fontSize="3" fill="rgba(148,163,184,0.4)" fontFamily="monospace"
            transform="rotate(-90, 3, 32)">IMPACT →</text>
        </svg>
      </div>
      <div className="flex justify-between text-[9px] font-mono text-slate-600 mt-1">
        <span className="text-green-400">LOW RISK</span>
        <span className="text-orange-400">MEDIUM</span>
        <span className="text-red-400">CRITICAL RISK</span>
      </div>
    </div>
  );
}

function DependencyArrow({ from, to }: { from: RiskNode; to: RiskNode | undefined }) {
  if (!to) return null;
  return (
    <div className="flex items-center gap-1 text-[10px] text-slate-500">
      <span className="truncate max-w-[100px]" style={{ color: from.color }}>{from.title.split(" — ")[0]}</span>
      <ArrowRight className="w-3 h-3 flex-shrink-0 text-slate-600" />
      <span className="truncate max-w-[100px]" style={{ color: to.color }}>{to.title.split(" — ")[0]}</span>
    </div>
  );
}

function RiskCard({ risk, allRisks, selected, onSelect }: {
  risk: RiskNode; allRisks: RiskNode[]; selected: boolean; onSelect: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const domainCfg = DOMAIN_CONFIG[risk.domain];
  const statusCfg = STATUS_CONFIG[risk.status];
  const riskColor = getRiskColor(risk.riskScore);
  const riskLabel = getRiskLabel(risk.riskScore);
  const dependents = allRisks.filter((r) => r.affectedBy.includes(risk.id));
  const dependencies = risk.dependencies.map((id) => allRisks.find((r) => r.id === id)).filter(Boolean) as RiskNode[];

  return (
    <div className={cn("rounded-lg overflow-hidden border transition-all", selected ? "border-gold/40" : "border-white/8")}
      style={{ background: selected ? "rgba(201,162,39,0.04)" : "rgba(10,13,26,0.95)" }}>
      <div className="flex items-start gap-3 p-3 cursor-pointer hover:bg-white/2 transition-all"
        onClick={() => { onSelect(); setExpanded(!expanded); }}>
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: riskColor, boxShadow: `0 0 6px ${riskColor}60` }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <span className="text-xs font-semibold text-slate-200">{risk.title}</span>
            <span className="font-mono text-sm font-bold flex-shrink-0" style={{ color: riskColor }}>{risk.riskScore}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-1.5 py-0.5 rounded font-mono text-[8px] tracking-widest border"
              style={{ color: domainCfg.color, borderColor: `${domainCfg.color}30`, background: `${domainCfg.color}10` }}>
              {risk.domain}
            </span>
            <span className="px-1.5 py-0.5 rounded font-mono text-[8px] tracking-widest border"
              style={{ color: riskColor, borderColor: `${riskColor}30`, background: `${riskColor}10` }}>
              {riskLabel}
            </span>
            <span className="px-1.5 py-0.5 rounded font-mono text-[8px] tracking-widest border"
              style={{ color: statusCfg.color, borderColor: `${statusCfg.color}30`, background: `${statusCfg.color}10` }}>
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-[9px] text-slate-600 font-mono">
            <span>L: {Math.round(risk.likelihood * 100)}%</span>
            <span>I: {Math.round(risk.impact * 100)}%</span>
            {dependencies.length > 0 && <span className="text-orange-400">⟹ {dependencies.length} dependency</span>}
            {dependents.length > 0 && <span className="text-red-400">⟸ {dependents.length} affected</span>}
          </div>
        </div>
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-1" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-1" />}
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-white/5 pt-2 space-y-3">
          <p className="text-[11px] text-slate-400 leading-relaxed">{risk.description}</p>

          <div className="rounded p-2.5 border" style={{ background: "rgba(201,162,39,0.04)", borderColor: "rgba(201,162,39,0.15)" }}>
            <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1">Mitigation</div>
            <div className="text-[11px] text-slate-300 leading-relaxed">{risk.mitigation}</div>
          </div>

          {dependencies.length > 0 && (
            <div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">Triggers (if this risk fires):</div>
              <div className="space-y-1">
                {dependencies.map((dep) => (
                  <DependencyArrow key={dep.id} from={risk} to={dep} />
                ))}
              </div>
            </div>
          )}

          {dependents.length > 0 && (
            <div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-wider mb-1.5">This risk is triggered by:</div>
              <div className="space-y-1">
                {dependents.map((dep) => (
                  <DependencyArrow key={dep.id} from={dep} to={risk} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DominoChain() {
  const chains = [
    { title: "Security Breach Cascade", nodes: ["risk-002", "risk-004", "risk-006", "risk-008"] },
    { title: "Infrastructure Failure Chain", nodes: ["risk-001", "risk-003", "risk-005", "risk-006"] },
  ];

  return (
    <div className="imperial-card rounded-lg p-4">
      <div className="flex items-center gap-2 mb-4">
        <Network className="w-4 h-4" style={{ color: "#c9a227" }} />
        <span className="font-display text-xs tracking-[0.15em] gold-text uppercase">Domino Effect Chains</span>
      </div>
      <div className="space-y-4">
        {chains.map((chain) => {
          const chainNodes = chain.nodes.map((id) => RISK_NODES.find((r) => r.id === id)).filter(Boolean) as RiskNode[];
          return (
            <div key={chain.title}>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">{chain.title}</div>
              <div className="flex items-center gap-1 flex-wrap">
                {chainNodes.map((node, i) => (
                  <React.Fragment key={node.id}>
                    <div className="flex items-center gap-1 px-2 py-1 rounded border text-[10px]"
                      style={{ borderColor: `${node.color}30`, background: `${node.color}10`, color: node.color }}>
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: node.color }} />
                      <span className="truncate max-w-[80px]">{node.title.split(" — ")[0].split(" ").slice(0, 2).join(" ")}</span>
                    </div>
                    {i < chainNodes.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-600 flex-shrink-0" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RiskMatrix() {
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [activeDomain, setActiveDomain] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  const filtered = RISK_NODES.filter((r) => {
    if (activeDomain && r.domain !== activeDomain) return false;
    if (activeStatus && r.status !== activeStatus) return false;
    return true;
  });

  const sortedRisks = [...filtered].sort((a, b) => b.riskScore - a.riskScore);
  const criticalCount = RISK_NODES.filter((r) => r.riskScore >= 80).length;
  const activeCount = RISK_NODES.filter((r) => r.status === "ACTIVE").length;
  const avgScore = Math.round(RISK_NODES.reduce((a, r) => a + r.riskScore, 0) / RISK_NODES.length);
  const cascadeLinks = RISK_NODES.reduce((a, r) => a + r.dependencies.length, 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Network className="w-5 h-5" style={{ color: "#c9a227" }} />
          <h1 className="font-display text-lg tracking-[0.2em] gold-text gold-glow font-bold uppercase">
            Risk Interdependency Matrix
          </h1>
        </div>
        <p className="text-xs text-slate-500 ml-8">
          Cross-domain risk mapping — cascading domino effects · systemic vulnerability identification · dependency chains
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Critical Risks", value: criticalCount, color: "#ef4444", icon: AlertTriangle },
          { label: "Active Risks", value: activeCount, color: "#fb923c", icon: Activity },
          { label: "Avg Risk Score", value: avgScore, color: getRiskColor(avgScore), icon: TrendingDown },
          { label: "Cascade Links", value: cascadeLinks, color: "#a78bfa", icon: Network },
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

      <HeatMap />
      <DominoChain />

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setActiveDomain(null)}
          className={cn("px-3 py-1 rounded-full font-mono text-[10px] tracking-widest border transition-all",
            !activeDomain ? "border-gold/50 bg-gold/10 text-gold" : "border-white/10 text-slate-400")}>
          ALL DOMAINS
        </button>
        {Object.entries(DOMAIN_CONFIG).map(([domain, cfg]) => (
          <button key={domain} onClick={() => setActiveDomain(activeDomain === domain ? null : domain)}
            className="px-3 py-1 rounded-full font-mono text-[10px] tracking-widest border transition-all"
            style={{
              color: cfg.color,
              borderColor: activeDomain === domain ? cfg.color : "rgba(255,255,255,0.1)",
              background: activeDomain === domain ? `${cfg.color}15` : "transparent",
            }}>
            {domain}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["ACTIVE", "MONITORING", "MITIGATED", "ACCEPTED"].map((status) => {
          const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
          return (
            <button key={status} onClick={() => setActiveStatus(activeStatus === status ? null : status)}
              className="px-3 py-1 rounded-full font-mono text-[10px] tracking-widest border transition-all"
              style={{
                color: cfg.color,
                borderColor: activeStatus === status ? cfg.color : "rgba(255,255,255,0.1)",
                background: activeStatus === status ? `${cfg.color}15` : "transparent",
              }}>
              {cfg.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sortedRisks.map((risk) => (
          <RiskCard
            key={risk.id}
            risk={risk}
            allRisks={RISK_NODES}
            selected={selectedRisk === risk.id}
            onSelect={() => setSelectedRisk(selectedRisk === risk.id ? null : risk.id)}
          />
        ))}
      </div>
    </div>
  );
}
