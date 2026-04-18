import { useState, useMemo } from "react";
import { Shield, Brain, ChevronDown, ChevronUp, Play, AlertTriangle, CheckCircle2, XCircle, ArrowUpRight } from "lucide-react";
import {
  decisionRecommendations, simulationScenarios,
  type DecisionRecommendation, type SimulationScenarioDisplay,
} from "@/data/seed";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { runSimulation, simulationConfidenceLabel, formatCurrencyImpact, SIMULATION_ENGINE_VERSION } from "@workspace/simulation";
import { submitApprovalAction, getApprovalForRecommendation, type ApprovalVerdict } from "@/data/approvals";

const URGENCY_CONFIG = {
  critical: { color: "text-red-400", bg: "bg-red-500/8", border: "border-red-500/25", label: "CRITICAL" },
  urgent: { color: "text-orange-400", bg: "bg-orange-500/8", border: "border-orange-500/25", label: "URGENT" },
  moderate: { color: "text-amber-400", bg: "bg-amber-500/8", border: "border-amber-500/25", label: "MODERATE" },
  routine: { color: "text-sky-400", bg: "bg-sky-500/8", border: "border-sky-500/25", label: "ROUTINE" },
};

const POLICY_CONFIG: Record<string, string> = {
  cleared: "text-emerald-400",
  conditional: "text-amber-400",
  blocked: "text-red-400",
  flagged: "text-orange-400",
  pending: "text-sky-400",
};

const FRESHNESS_CONFIG: Record<string, { color: string; dot: string; label: string }> = {
  live:    { color: "text-emerald-400", dot: "bg-emerald-400", label: "LIVE" },
  recent:  { color: "text-amber-400",   dot: "bg-amber-400",   label: "RECENT" },
  stale:   { color: "text-orange-400",  dot: "bg-orange-400",  label: "STALE" },
  expired: { color: "text-red-400",     dot: "bg-red-400",     label: "EXPIRED" },
};

function buildSimRequest(rec: DecisionRecommendation, scenario: SimulationScenarioDisplay) {
  return {
    recommendationId: rec.id,
    entityId: rec.id,
    entityType: "recommendation",
    domain: "acquisition",
    action: {
      id: scenario.id,
      type: "execute_recommendation" as const,
      recommendationId: rec.id,
    },
    context: {
      urgency: rec.urgency,
      baseConfidence: scenario.projected.confidence,
      scenarioName: scenario.name,
      scenarioDescription: scenario.description,
      primaryMetricLabel: "Close Probability",
      primaryMetricBefore: scenario.projected.closeProbability * 0.5,
      primaryMetricAfter: scenario.projected.closeProbability,
      primaryMetricUnit: "%",
      daysToRecovery: scenario.projected.daysToRecovery,
      estimatedValueCapture: scenario.projected.revenueCapture,
      riskIfNotTaken: scenario.downstreamEffects.filter(e => e.magnitude === "high").map(e => e.effect).join("; "),
      downstreamEffects: scenario.downstreamEffects.map(e => ({
        entityLabel: e.entity,
        entityType: "entity",
        effect: e.effect,
        magnitude: e.magnitude,
      })),
    },
  };
}

function SimPanel({ scenarios, rec, onClose }: { scenarios: SimulationScenarioDisplay[]; rec: DecisionRecommendation; onClose: () => void }) {
  const recScenarios = scenarios.filter(s => s.recommendationId === rec.id);
  const [selected, setSelected] = useState(recScenarios.find(s => s.highlight)?.id ?? recScenarios[0]?.id);
  const active = recScenarios.find(s => s.id === selected);

  const liveResult = useMemo(() => {
    if (!active) return null;
    return runSimulation(buildSimRequest(rec, active));
  }, [active, rec]);

  const chartData = recScenarios.map(s => ({
    name: s.name.split(" ").slice(0, 2).join(" "),
    probability: Math.round(s.projected.closeProbability * 100),
    fill: s.highlight ? "#f59e0b" : "#6b7280",
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-[hsl(220_30%_5%)] border border-amber-500/20 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Play className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-100">Simulation Panel</p>
              <p className="text-[10px] text-amber-400/40">Live projections via @workspace/simulation v{SIMULATION_ENGINE_VERSION} — preview effects before action</p>
            </div>
          </div>
          <button onClick={onClose} className="text-amber-400/40 hover:text-amber-300 transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 shrink-0 border-r border-amber-500/10 overflow-y-auto p-4 space-y-2">
            <p className="text-[9px] font-mono text-amber-400/30 uppercase tracking-wider mb-3">Scenarios</p>
            {recScenarios.map(s => (
              <button
                key={s.id}
                onClick={() => setSelected(s.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selected === s.id
                    ? "border-amber-500/30 bg-amber-500/10"
                    : "border-amber-500/10 bg-amber-500/3 hover:border-amber-500/20"
                }`}
              >
                <p className="text-xs font-semibold text-amber-100 leading-tight">{s.name}</p>
                <p className="text-[10px] text-amber-400/50 mt-1">{Math.round(s.projected.closeProbability * 100)}% close probability</p>
                {s.highlight && <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border text-amber-400 bg-amber-500/8 border-amber-500/20 mt-1 inline-block">RECOMMENDED</span>}
              </button>
            ))}
          </div>

          {active && liveResult && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <h3 className="text-base font-semibold text-amber-100">{active.name}</h3>
                <p className="text-xs text-amber-100/60 mt-1">{active.description}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="cockpit-panel p-4">
                  <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Close Probability</p>
                  <p className={`text-xl font-mono font-bold ${active.projected.closeProbability >= 0.6 ? "text-emerald-400" : active.projected.closeProbability >= 0.4 ? "text-amber-400" : "text-red-400"}`}>
                    {Math.round(active.projected.closeProbability * 100)}%
                  </p>
                  <p className="text-[9px] text-amber-400/40 mt-1">Projected by simulation engine</p>
                </div>
                <div className="cockpit-panel p-4">
                  <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Days to Recovery</p>
                  <p className={`text-xl font-mono font-bold ${active.projected.daysToRecovery <= 5 ? "text-emerald-400" : active.projected.daysToRecovery <= 14 ? "text-amber-400" : "text-orange-400"}`}>
                    {active.projected.daysToRecovery > 0 ? `${active.projected.daysToRecovery}d` : "None"}
                  </p>
                  <p className="text-[9px] text-amber-400/40 mt-1">estimated time to action</p>
                </div>
                <div className="cockpit-panel p-4">
                  <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-1">Value Capture</p>
                  <p className={`text-xl font-mono font-bold ${active.projected.revenueCapture >= 3000000 ? "text-emerald-400" : active.projected.revenueCapture > 0 ? "text-amber-400" : "text-red-400"}`}>
                    {active.projected.revenueCapture > 0 ? formatCurrencyImpact(active.projected.revenueCapture) : "$0"}
                  </p>
                  <p className="text-[9px] text-amber-400/40 mt-1">projected capture</p>
                </div>
              </div>

              <div className="cockpit-panel p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[9px] font-mono text-amber-400/40 uppercase">Engine Confidence Assessment</p>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                    liveResult.projectedOutcome.confidence >= 0.85 ? "text-emerald-400 bg-emerald-500/8 border-emerald-500/20" :
                    liveResult.projectedOutcome.confidence >= 0.70 ? "text-amber-400 bg-amber-500/8 border-amber-500/20" :
                    "text-orange-400 bg-orange-500/8 border-orange-500/20"
                  }`}>
                    {simulationConfidenceLabel(liveResult.projectedOutcome.confidence)} — {Math.round(liveResult.projectedOutcome.confidence * 100)}%
                  </span>
                </div>
                <p className="text-xs text-amber-100/60 leading-relaxed">{liveResult.projectedOutcome.confidenceReason}</p>
              </div>

              <div className="cockpit-panel p-4">
                <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-3">Scenario Comparison — Close Probability</p>
                <ResponsiveContainer width="100%" height={80}>
                  <BarChart data={chartData} barSize={28} margin={{ left: 0, right: 0, top: 0, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#92400e" }} axisLine={false} tickLine={false} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: "#0c1117", border: "1px solid #78350f", borderRadius: 6, fontSize: 11 }} formatter={(v: number) => [`${v}%`, "Close Probability"]} />
                    <Bar dataKey="probability" radius={[3, 3, 0, 0]}>
                      {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {liveResult.downstreamEffects.length > 0 && (
                <div className="cockpit-panel p-4">
                  <p className="text-[9px] font-mono text-amber-400/40 uppercase mb-3">Downstream Effects</p>
                  <div className="space-y-2">
                    {liveResult.downstreamEffects.map((eff, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 mt-0.5 ${
                          eff.magnitude === "high" ? "text-red-400 bg-red-500/8 border-red-500/20" :
                          eff.magnitude === "medium" ? "text-orange-400 bg-orange-500/8 border-orange-500/20" :
                          "text-amber-400/60 bg-amber-500/5 border-amber-500/15"
                        }`}>{eff.magnitude.toUpperCase()}</span>
                        <div>
                          <p className="text-xs font-medium text-amber-100">{eff.entityLabel}</p>
                          <p className="text-[10px] text-amber-100/60 leading-snug">{eff.effect}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {liveResult.riskIfNotTaken && (
                <div className="rounded bg-red-500/5 border border-red-500/15 p-3">
                  <p className="text-[9px] font-mono text-red-400/50 mb-1.5">RISK IF NOT TAKEN</p>
                  <p className="text-xs text-amber-100/60 leading-relaxed">{liveResult.riskIfNotTaken}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[9px] font-mono text-amber-400/30">Simulation ID: {liveResult.id}</span>
                <span className="text-[9px] font-mono text-amber-400/20">·</span>
                <span className="text-[9px] font-mono text-amber-400/30">Engine v{liveResult.engineVersion}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RecCard({ rec }: { rec: DecisionRecommendation }) {
  const [expanded, setExpanded] = useState(rec.urgency === "critical");
  const [simOpen, setSimOpen] = useState(false);
  const [localApproval, setLocalApproval] = useState<{ verdict: ApprovalVerdict; proofRef: string } | null>(() => {
    const existing = getApprovalForRecommendation(rec.id);
    return existing ? { verdict: existing.verdict, proofRef: existing.proofRef } : null;
  });

  const urgCfg = URGENCY_CONFIG[rec.urgency];
  const polColor = POLICY_CONFIG[rec.policyState] ?? "text-amber-400/40";
  const freshCfg = FRESHNESS_CONFIG[rec.freshness] ?? FRESHNESS_CONFIG["recent"];
  const relScenarios = simulationScenarios.filter(s => s.recommendationId === rec.id);

  function handleApprove() {
    const bestScenario = relScenarios.find(s => s.highlight) ?? relScenarios[0];
    let simulationId: string | undefined;
    if (bestScenario) {
      const simResult = runSimulation(buildSimRequest(rec, bestScenario));
      simulationId = simResult.id;
    }
    const action = submitApprovalAction(rec.id, "approved", { simulationId, note: "Approved via Decision Center" });
    setLocalApproval({ verdict: "approved", proofRef: action.proofRef });
  }

  function handleReject() {
    const action = submitApprovalAction(rec.id, "rejected", { note: "Rejected via Decision Center" });
    setLocalApproval({ verdict: "rejected", proofRef: action.proofRef });
  }

  function handleEscalate() {
    const action = submitApprovalAction(rec.id, "escalated", { note: "Escalated via Decision Center for executive review" });
    setLocalApproval({ verdict: "escalated", proofRef: action.proofRef });
  }

  const approvalDisplay = localApproval ?? (() => {
    const s = rec.approvalState;
    if (s === "approved") return { verdict: "approved" as ApprovalVerdict, proofRef: "" };
    if (s === "rejected") return { verdict: "rejected" as ApprovalVerdict, proofRef: "" };
    if (s === "escalated") return { verdict: "escalated" as ApprovalVerdict, proofRef: "" };
    return null;
  })();

  return (
    <>
      {simOpen && <SimPanel scenarios={simulationScenarios} rec={rec} onClose={() => setSimOpen(false)} />}
      <div className={`cockpit-panel border ${urgCfg.border} ${rec.urgency === "critical" ? "border-l-2" : ""}`}>
        <div className="flex items-start gap-3 p-5 cursor-pointer hover:bg-amber-500/3 transition-colors" onClick={() => setExpanded(v => !v)}>
          <div className={`w-9 h-9 rounded flex items-center justify-center shrink-0 mt-0.5 ${urgCfg.bg} border ${urgCfg.border}`}>
            <Brain className={`w-4.5 h-4.5 ${urgCfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <p className="text-sm font-semibold text-amber-100">{rec.title}</p>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${urgCfg.color} ${urgCfg.bg} ${urgCfg.border}`}>{urgCfg.label}</span>
                {approvalDisplay && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                    approvalDisplay.verdict === "approved" ? "text-emerald-400 bg-emerald-500/8 border-emerald-500/20" :
                    approvalDisplay.verdict === "rejected" ? "text-red-400 bg-red-500/8 border-red-500/20" :
                    "text-orange-400 bg-orange-500/8 border-orange-500/20"
                  }`}>{approvalDisplay.verdict.toUpperCase()}</span>
                )}
                {expanded ? <ChevronUp className="w-3.5 h-3.5 text-amber-400/40" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-400/40" />}
              </div>
            </div>
            <p className="text-xs text-amber-100/60 leading-snug">{rec.summary}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400/50">
                Confidence: {Math.round(rec.confidence * 100)}%
              </span>
              <span className={`text-[10px] font-mono ${polColor}`}>Policy: {rec.policyState}</span>
              <span className={`flex items-center gap-1 text-[10px] font-mono ${freshCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${freshCfg.dot} shrink-0`} />
                {freshCfg.label}
              </span>
              <span className="text-[10px] font-mono text-amber-400/30">Priority: {rec.priority}/100</span>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="px-5 pb-5 space-y-4 border-t border-amber-500/10 pt-4">
            <div className="rounded bg-amber-500/4 border border-amber-500/12 p-3">
              <p className="text-[9px] font-mono text-amber-400/40 mb-1">REASONING</p>
              <p className="text-xs text-amber-100/70 leading-relaxed">{rec.reasoning}</p>
            </div>

            <div>
              <p className="text-[9px] font-mono text-amber-400/40 mb-2">EVIDENCE CHAIN ({rec.evidence.length} items)</p>
              <div className="space-y-1.5">
                {rec.evidence.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded bg-amber-500/3 border border-amber-500/10">
                    <Shield className="w-3 h-3 text-amber-400/40 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-mono text-amber-400/50">{ev.label}</p>
                      <p className="text-xs text-amber-100/75 mt-0.5">{ev.value}</p>
                      {ev.source && <p className="text-[9px] text-amber-400/30 mt-0.5">Source: {ev.source}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded bg-emerald-500/5 border border-emerald-500/15 p-3">
                <p className="text-[9px] font-mono text-emerald-400/50 mb-2">PROJECTED IMPACT (IF ACTED)</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-amber-400/50">{rec.projectedImpact.primaryMetricLabel}</span>
                    <span className="text-emerald-400 font-mono">{Math.round(rec.projectedImpact.primaryMetricBefore * 100)}% → {Math.round(rec.projectedImpact.primaryMetricAfter * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-amber-400/50">Days to recovery</span>
                    <span className="text-emerald-400 font-mono">{rec.projectedImpact.daysToRecovery}d</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-amber-400/50">Value capture</span>
                    <span className="text-emerald-400 font-mono">{formatCurrencyImpact(rec.projectedImpact.estimatedValueCapture)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-amber-400/50">Projection confidence</span>
                    <span className="text-emerald-400 font-mono">{Math.round(rec.projectedImpact.confidenceInProjection * 100)}%</span>
                  </div>
                </div>
              </div>
              <div className="rounded bg-red-500/5 border border-red-500/15 p-3">
                <p className="text-[9px] font-mono text-red-400/50 mb-2">PROJECTED RISK (IF IGNORED)</p>
                <p className="text-[10px] text-amber-100/60 leading-relaxed mb-2">{rec.projectedRisk.ifIgnored}</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-amber-400/50">Loss probability</span>
                    <span className="text-red-400 font-mono">{Math.round(rec.projectedRisk.probabilityOfLoss * 100)}%</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-amber-400/50">Time to no-return</span>
                    <span className="text-red-400 font-mono">{rec.projectedRisk.timeToPointOfNoReturn}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded bg-amber-500/4 border border-amber-500/12 p-3">
              <p className="text-[9px] font-mono text-amber-400/40 mb-2">BUSINESS IMPACT</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-amber-400/50">Financial exposure</span>
                  <span className="text-orange-400 font-mono">{formatCurrencyImpact(rec.businessImpact.financialExposureUsd)}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-amber-400/50">Affected entities</span>
                  <span className="text-amber-300 font-mono">{rec.businessImpact.affectedEntities}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-amber-400/50">Reputational risk</span>
                  <span className="text-amber-300 font-mono">{rec.businessImpact.reputationalRisk}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-amber-400/50">Suggested owner</span>
                  <span className="text-amber-300 font-mono truncate">{rec.suggestedOwner}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-amber-400/50">Data freshness</span>
                  <span className={`font-mono flex items-center gap-1 ${freshCfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${freshCfg.dot}`} />
                    {freshCfg.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
              {approvalDisplay ? (
                <div className={`flex items-center gap-2 px-3.5 py-2 rounded-md border text-xs font-medium ${
                  approvalDisplay.verdict === "approved" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                  approvalDisplay.verdict === "rejected" ? "bg-red-500/10 border-red-500/20 text-red-400" :
                  "bg-orange-500/10 border-orange-500/20 text-orange-400"
                }`}>
                  {approvalDisplay.verdict === "approved" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {approvalDisplay.verdict === "rejected" && <XCircle className="w-3.5 h-3.5" />}
                  {approvalDisplay.verdict === "escalated" && <ArrowUpRight className="w-3.5 h-3.5" />}
                  <span>{approvalDisplay.verdict === "approved" ? "Approved — routed to inbox" : approvalDisplay.verdict === "rejected" ? "Rejected — action logged" : "Escalated — pending executive"}</span>
                  {approvalDisplay.proofRef && <span className="text-[9px] opacity-50 font-mono">{approvalDisplay.proofRef}</span>}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {relScenarios.length > 0 && (
                    <button
                      onClick={() => setSimOpen(true)}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-medium hover:bg-amber-500/15 transition-colors"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Simulate ({relScenarios.length})
                    </button>
                  )}
                  <button
                    onClick={handleApprove}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/15 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-500/8 border border-red-500/15 text-red-400/70 text-xs font-medium hover:bg-red-500/12 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <button
                    onClick={handleEscalate}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-orange-500/8 border border-orange-500/15 text-orange-400/70 text-xs font-medium hover:bg-orange-500/12 transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Escalate
                  </button>
                </div>
              )}
              <span className="proof-badge">
                <Shield className="w-2 h-2" />
                {rec.proofRef}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function DecisionCenterPage() {
  const critical = decisionRecommendations.filter(r => r.urgency === "critical" || r.urgency === "urgent");
  const rest = decisionRecommendations.filter(r => r.urgency !== "critical" && r.urgency !== "urgent");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-amber-100 font-display">Decision Center</h1>
          <p className="text-xs text-amber-400/50 mt-0.5">{decisionRecommendations.length} active recommendations — sorted by urgency · Approve routes to local inbox with proof chain</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-red-500/20 bg-red-500/5">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-[10px] text-red-400/80 font-mono">{critical.length} critical</span>
          </div>
        </div>
      </div>

      {critical.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-amber-400/30 uppercase tracking-widest">Critical / Urgent</p>
          {critical.map(rec => <RecCard key={rec.id} rec={rec} />)}
        </div>
      )}

      {rest.length > 0 && (
        <div className="space-y-3">
          <p className="text-[9px] font-mono text-amber-400/30 uppercase tracking-widest">Moderate / Routine</p>
          {rest.map(rec => <RecCard key={rec.id} rec={rec} />)}
        </div>
      )}
    </div>
  );
}
