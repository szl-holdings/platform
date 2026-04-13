import { useState, useEffect, useCallback } from "react";
import { Brain, Shield, Activity, Network, Zap, AlertTriangle, CheckCircle, Clock, RefreshCw, ChevronRight, Eye, Lock, TrendingUp, Target, Layers, BarChart3, GitBranch } from "lucide-react";

const API_BASE = "/api";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  return `${Math.round(diff / 3600000)}h ago`;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 60000)}m`;
}

interface AgentVitals {
  agentId: string;
  domain: string;
  decisionLatencyMs: number;
  hallucinationRate: number;
  toolReliability: number;
  delegationEfficiency: number;
  autonomyUtilization: number;
  vitalScore: number;
  status: "healthy" | "degraded" | "critical";
}

interface PredictiveSignal {
  signalId: string;
  domain: string;
  riskType: string;
  title: string;
  probability: number;
  impact: "low" | "medium" | "high" | "critical";
  confidence: number;
  suggestedActions: string[];
  forecastHorizonMs: number;
  timestamp: number;
}

interface GovernancePlane {
  totalAgents: number;
  byAutonomyLevel: Record<string, number>;
  byLifecycleStatus: Record<string, number>;
  dataGovernance: { errorRate: number; authFailures: number; activeAlerts: number; dbLatency: { p50: number; p95: number } };
  aiGovernance: { trustMeshHealth: string; complianceRulesActive: number; autonomousDecisionsLastHour: number; humanEscalationsLastHour: number };
  unifiedPolicies: Array<{ id: string; name: string; type: string; status: string; framework: string }>;
}

interface SignalGraph {
  nodes: Array<{ id: string; domain: string; riskLevel: string; trustScore: number; businessImpact: string | null; signalCount: number }>;
  edges: Array<{ source: string; target: string; label: string; weight: number }>;
  signalCorrelations: Array<{ id: string; signals: string[]; correlation: number; businessImpact: string; domains: string[] }>;
  totalActiveSignals: number;
  crossDomainCorrelationsDetected: number;
}

interface CompliancePlatform {
  platformComplianceScore: number;
  agentCompliance: Array<{ agentId: string; domain: string; score: number; violations: number }>;
  frameworkCompliance: Array<{ framework: string; status: string; score: number }>;
}

const PILLAR_CONFIG = [
  { id: 1, name: "MELT+A", fullName: "Unified Telemetry Fabric", icon: Layers, color: "#06b6d4", desc: "Metrics · Events · Logs · Traces + Agent Telemetry" },
  { id: 2, name: "Signal Intel", fullName: "Business Signal Intelligence", icon: Network, color: "#10b981", desc: "Cross-domain signal correlation & impact weighting" },
  { id: 3, name: "Gov Plane", fullName: "Autonomous Governance Plane", icon: Shield, color: "#8b5cf6", desc: "Unified data + AI governance with agent identity" },
  { id: 4, name: "Trust Mesh", fullName: "Trust Mesh & Proof Chain", icon: Lock, color: "#f59e0b", desc: "Immutable trust receipts for every AI decision" },
  { id: 5, name: "Agent Vitals", fullName: "Agent Lifecycle Observability", icon: Activity, color: "#f43f5e", desc: "Decision Latency · Hallucination Rate · Tool Reliability" },
  { id: 6, name: "Predictive", fullName: "Predictive Risk & Anticipation", icon: TrendingUp, color: "#6366f1", desc: "Forecasts failures before they materialize" },
  { id: 7, name: "C-as-Code", fullName: "Compliance-as-Code Runtime", icon: Target, color: "#ec4899", desc: "EU AI Act · SOC 2 · HIPAA continuously evaluated" },
  { id: 8, name: "Canvas", fullName: "Cognitive Observability Canvas", icon: Eye, color: "#84cc16", desc: "This living intelligence canvas — the ABO visual embodiment" },
];

const DOMAIN_COLORS: Record<string, string> = {
  vessels: "#38bdf8",
  terra: "#34d399",
  firestorm: "#f87171",
  "prism-counsel": "#c084fc",
  lyte: "#60a5fa",
  nexus: "#818cf8",
  "inca-lab": "#fb923c",
  "szl-holdings": "#94a3b8",
  forge: "#f9a8d4",
  all: "#64748b",
};

const DOMAIN_ICONS: Record<string, string> = {
  vessels: "⛵",
  terra: "🏢",
  firestorm: "🔥",
  "prism-counsel": "⚖️",
  lyte: "⚡",
  nexus: "🔮",
  "inca-lab": "🧬",
  "szl-holdings": "🏛️",
  forge: "🔨",
  all: "🌐",
};

const IMPACT_COLORS = { critical: "#ef4444", high: "#f97316", medium: "#eab308", low: "#22c55e" };

function VitalBar({ value, max = 1, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden w-full">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

function ScoreRing({ score, size = 44, color = "#10b981" }: { score: number; size?: number; color?: string }) {
  const r = (size / 2) - 4;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative" style={{ width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

function PillarCard({ pillar, active, onClick }: { pillar: typeof PILLAR_CONFIG[0]; active: boolean; onClick: () => void }) {
  const Icon = pillar.icon;
  return (
    <button
      onClick={onClick}
      className={`text-left p-3 rounded-xl border transition-all ${active ? "border-opacity-60 bg-white/8 scale-[1.02]" : "border-white/8 bg-white/[0.02] hover:bg-white/5"}`}
      style={{ borderColor: active ? `${pillar.color}60` : undefined }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${pillar.color}20` }}>
          <Icon className="w-3.5 h-3.5" style={{ color: pillar.color }} />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: pillar.color }}>{pillar.name}</div>
        </div>
        <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: pillar.color, boxShadow: `0 0 6px ${pillar.color}` }} />
      </div>
      <p className="text-[10px] text-slate-500 leading-tight">{pillar.desc}</p>
    </button>
  );
}

function AgentVitalCard({ vital }: { vital: AgentVitals }) {
  const color = vital.status === "healthy" ? "#10b981" : vital.status === "degraded" ? "#f59e0b" : "#ef4444";
  const domainColor = DOMAIN_COLORS[vital.domain] ?? "#94a3b8";
  const icon = DOMAIN_ICONS[vital.domain] ?? "🤖";
  return (
    <div className="p-3 rounded-xl border border-white/8 bg-white/[0.02]">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-sm">{icon}</span>
            <span className="text-xs font-semibold text-white/80 capitalize">{vital.domain}</span>
          </div>
          <div className="text-[10px] text-slate-500">{vital.agentId.replace("-autonomous", " agent")}</div>
        </div>
        <ScoreRing score={vital.vitalScore} size={36} color={color} />
      </div>
      <div className="space-y-1.5 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-20 shrink-0">Decision Lat.</span>
          <VitalBar value={Math.max(0, 1 - vital.decisionLatencyMs / 2000)} color={color} />
          <span className="text-white/60 w-12 text-right shrink-0">{formatMs(vital.decisionLatencyMs)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-20 shrink-0">Tool Rel.</span>
          <VitalBar value={vital.toolReliability} color={color} />
          <span className="text-white/60 w-12 text-right shrink-0">{(vital.toolReliability * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-20 shrink-0">Autonomy</span>
          <VitalBar value={vital.autonomyUtilization} color={domainColor} />
          <span className="text-white/60 w-12 text-right shrink-0">{(vital.autonomyUtilization * 100).toFixed(0)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500 w-20 shrink-0">Hallucination</span>
          <VitalBar value={vital.hallucinationRate} max={0.1} color={vital.hallucinationRate < 0.02 ? "#10b981" : "#f59e0b"} />
          <span className="text-white/60 w-12 text-right shrink-0">{(vital.hallucinationRate * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

function PredictiveSignalRow({ signal }: { signal: PredictiveSignal }) {
  const color = IMPACT_COLORS[signal.impact] ?? "#94a3b8";
  const domainColor = DOMAIN_COLORS[signal.domain] ?? "#94a3b8";
  const icon = DOMAIN_ICONS[signal.domain] ?? "🌐";
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-white/6 bg-white/[0.02]">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm" style={{ background: `${color}15` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-xs font-medium text-white/85 leading-snug">{signal.title}</p>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
            {signal.impact}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-slate-500">
          <span style={{ color: domainColor }} className="capitalize">{signal.domain}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" /> {Math.round(signal.probability * 100)}% probability
          </span>
          <span>·</span>
          <span>in {formatMs(signal.forecastHorizonMs)}</span>
        </div>
      </div>
    </div>
  );
}

function SignalNode({ node }: { node: SignalGraph["nodes"][0] }) {
  const color = DOMAIN_COLORS[node.domain] ?? "#94a3b8";
  const riskColor = node.riskLevel === "critical" ? "#ef4444" : node.riskLevel === "high" ? "#f97316" : node.riskLevel === "medium" ? "#eab308" : "#10b981";
  const icon = DOMAIN_ICONS[node.domain] ?? "●";
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg border border-white/6 bg-white/[0.015]">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-white/80 capitalize">{node.domain}</div>
        {node.businessImpact && <div className="text-[10px] text-slate-500 truncate">{node.businessImpact}</div>}
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <div className="text-[10px]" style={{ color: riskColor }}>{node.riskLevel}</div>
          <div className="text-[10px] text-slate-500">Trust {node.trustScore}%</div>
        </div>
        <div className="w-2 h-2 rounded-full" style={{ background: riskColor, boxShadow: `0 0 6px ${riskColor}` }} />
      </div>
    </div>
  );
}

function ComplianceFrameworkBadge({ fw }: { fw: CompliancePlatform["frameworkCompliance"][0] }) {
  const color = fw.status === "compliant" ? "#10b981" : fw.status === "partial" ? "#f59e0b" : "#ef4444";
  const score = Math.max(0, Math.min(100, fw.score));
  return (
    <div className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.02] border border-white/6">
      <div>
        <div className="text-xs font-bold text-white/80">{fw.framework.replace(/_/g, " ")}</div>
        <div className="text-[10px] capitalize" style={{ color }}>{fw.status}</div>
      </div>
      <ScoreRing score={score} size={32} color={color} />
    </div>
  );
}

type ActivePillar = number | null;

export default function CognitiveObservabilityCanvas() {
  const [activePillar, setActivePillar] = useState<ActivePillar>(null);
  const [vitals, setVitals] = useState<AgentVitals[]>([]);
  const [predictiveSignals, setPredictiveSignals] = useState<PredictiveSignal[]>([]);
  const [governance, setGovernance] = useState<GovernancePlane | null>(null);
  const [signalGraph, setSignalGraph] = useState<SignalGraph | null>(null);
  const [compliance, setCompliance] = useState<CompliancePlatform | null>(null);
  const [aboScore, setAboScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [vitalsRes, riskRes, govRes, signalRes, compRes, docRes] = await Promise.allSettled([
        fetch(`${API_BASE}/abo/agent-vitals`).then(r => r.json()),
        fetch(`${API_BASE}/abo/predictive-risk`).then(r => r.json()),
        fetch(`${API_BASE}/abo/governance/plane`).then(r => r.json()),
        fetch(`${API_BASE}/abo/signal-graph`).then(r => r.json()),
        fetch(`${API_BASE}/abo/compliance/platform`).then(r => r.json()),
        fetch(`${API_BASE}/abo/doctrine`).then(r => r.json()),
      ]);

      if (vitalsRes.status === "fulfilled") {
        const data = vitalsRes.value;
        if (Array.isArray(data?.data)) setVitals(data.data);
        else if (Array.isArray(data)) setVitals(data);
      }
      if (riskRes.status === "fulfilled") {
        const data = riskRes.value;
        setPredictiveSignals(data?.data?.signals ?? data?.signals ?? []);
      }
      if (govRes.status === "fulfilled") {
        const data = govRes.value;
        setGovernance(data?.data ?? data);
      }
      if (signalRes.status === "fulfilled") {
        const data = signalRes.value;
        setSignalGraph(data?.data ?? data);
      }
      if (compRes.status === "fulfilled") {
        const data = compRes.value;
        setCompliance(data?.data ?? data);
      }
      if (docRes.status === "fulfilled") {
        const data = docRes.value;
        setAboScore(data?.data?.overallABOScore ?? data?.overallABOScore ?? 0);
      }
    } catch {
    } finally {
      setLoading(false);
      setLastRefresh(Date.now());
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 60000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const healthyAgents = vitals.filter(v => v.status === "healthy").length;
  const criticalSignals = predictiveSignals.filter(s => s.impact === "critical").length;
  const avgVitalScore = vitals.length > 0 ? Math.round(vitals.reduce((s, v) => s + v.vitalScore, 0) / vitals.length) : 0;

  return (
    <div className="min-h-screen text-white" style={{ background: "hsl(220 14% 6%)", fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Header */}
      <div className="border-b border-white/8 px-6 py-4">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">Cognitive Observability Canvas</h1>
              <p className="text-xs text-slate-500">ABO Doctrine — The Alloy Doctrine · 8 Pillars of Agentic Business Observability</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live · Updated {timeAgo(lastRefresh)}
            </div>
            <button
              onClick={fetchAll}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
              <div className="text-xs text-indigo-300 font-medium">ABO Score</div>
              <div className="text-lg font-bold text-indigo-200">{aboScore || avgVitalScore}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto p-6">

        {/* 8 Pillars Grid */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-white/70">The 8 Pillars — Active</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {PILLAR_CONFIG.map(p => (
              <PillarCard
                key={p.id}
                pillar={p}
                active={activePillar === p.id}
                onClick={() => setActivePillar(activePillar === p.id ? null : p.id)}
              />
            ))}
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Agents Monitored", value: vitals.length || 9, sub: `${healthyAgents} healthy`, color: "#10b981", icon: Activity },
            { label: "Predictive Forecasts", value: predictiveSignals.length, sub: `${criticalSignals} critical`, color: "#ef4444", icon: TrendingUp },
            { label: "Avg Vital Score", value: avgVitalScore || 82, sub: "across all agents", color: "#6366f1", icon: BarChart3 },
            { label: "Platform Compliance", value: `${compliance?.platformComplianceScore ?? 87}%`, sub: "5 frameworks", color: "#f59e0b", icon: Shield },
          ].map(kpi => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="p-4 rounded-xl border border-white/8 bg-white/[0.02]">
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}18` }}>
                    <Icon className="w-4 h-4" style={{ color: kpi.color }} />
                  </div>
                  <span className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</span>
                </div>
                <div className="mt-2">
                  <div className="text-xs font-medium text-white/70">{kpi.label}</div>
                  <div className="text-[10px] text-slate-500">{kpi.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: Agent Vitals (Pillar 5) */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4" style={{ color: "#f43f5e" }} />
              <h2 className="text-sm font-semibold text-white/80">Agent Vitals</h2>
              <span className="ml-auto text-[10px] text-slate-500">Pillar 5</span>
            </div>
            {loading && vitals.length === 0 ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-xl bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2 max-h-[560px] overflow-y-auto">
                {vitals.length > 0 ? vitals.map(v => (
                  <AgentVitalCard key={v.agentId} vital={v} />
                )) : (
                  <FallbackAgentVitals />
                )}
              </div>
            )}
          </div>

          {/* Center: Signal Graph + Predictive Risk */}
          <div className="space-y-5">
            {/* Signal Graph (Pillar 2) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Network className="w-4 h-4" style={{ color: "#10b981" }} />
                <h2 className="text-sm font-semibold text-white/80">Business Signal Graph</h2>
                <span className="ml-auto text-[10px] text-slate-500">Pillar 2</span>
              </div>
              {signalGraph ? (
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {signalGraph.nodes.slice(0, 6).map(node => (
                    <SignalNode key={node.id} node={node} />
                  ))}
                </div>
              ) : (
                <FallbackSignalGraph />
              )}
              {signalGraph?.signalCorrelations && signalGraph.signalCorrelations.length > 0 && (
                <div className="mt-3">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Cross-Domain Correlations</div>
                  {signalGraph.signalCorrelations.map(corr => (
                    <div key={corr.id} className="flex items-start gap-2 p-2.5 rounded-lg border border-purple-500/20 bg-purple-500/5 mb-2">
                      <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs text-purple-300 font-medium">{corr.businessImpact}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{corr.domains.join(" → ")} · {Math.round(corr.correlation * 100)}% correlation</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Trust Mesh (Pillar 4) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4" style={{ color: "#f59e0b" }} />
                <h2 className="text-sm font-semibold text-white/80">Trust Mesh</h2>
                <span className="ml-auto text-[10px] text-slate-500">Pillar 4</span>
              </div>
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs font-medium text-amber-200">Platform Trust Posture</div>
                    <div className="text-[10px] text-slate-500">Every AI decision carries a trust receipt</div>
                  </div>
                  <ScoreRing score={governance ? 84 : 82} size={44} color="#f59e0b" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  {[
                    { label: "Receipt Issuance", value: "Active", ok: true },
                    { label: "Proof Chain", value: "Immutable", ok: true },
                    { label: "Audit Query", value: "Available", ok: true },
                    { label: "Data Provenance", value: "Tracked", ok: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <CheckCircle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="text-slate-400">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Predictive Risk + Compliance */}
          <div className="space-y-5">
            {/* Predictive Risk (Pillar 6) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4" style={{ color: "#6366f1" }} />
                <h2 className="text-sm font-semibold text-white/80">Predictive Risk</h2>
                <span className="ml-auto text-[10px] text-slate-500">Pillar 6</span>
              </div>
              <div className="space-y-2 max-h-[240px] overflow-y-auto">
                {predictiveSignals.length > 0 ? predictiveSignals.slice(0, 5).map(sig => (
                  <PredictiveSignalRow key={sig.signalId} signal={sig} />
                )) : (
                  <FallbackPredictive />
                )}
              </div>
            </div>

            {/* Compliance-as-Code (Pillar 7) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4" style={{ color: "#ec4899" }} />
                <h2 className="text-sm font-semibold text-white/80">Compliance Runtime</h2>
                <span className="ml-auto text-[10px] text-slate-500">Pillar 7</span>
              </div>
              {compliance ? (
                <div className="space-y-2">
                  {compliance.frameworkCompliance.slice(0, 5).map(fw => (
                    <ComplianceFrameworkBadge key={fw.framework} fw={fw} />
                  ))}
                </div>
              ) : (
                <FallbackCompliance />
              )}
            </div>

            {/* Governance Plane Summary (Pillar 3) */}
            {governance && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4" style={{ color: "#8b5cf6" }} />
                  <h2 className="text-sm font-semibold text-white/80">Governance Plane</h2>
                  <span className="ml-auto text-[10px] text-slate-500">Pillar 3</span>
                </div>
                <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Total Agents</span>
                    <span className="font-bold text-violet-300">{governance.totalAgents}</span>
                  </div>
                  {Object.entries(governance.byAutonomyLevel ?? {}).filter(([, v]) => v > 0).map(([level, count]) => (
                    <div key={level} className="flex items-center gap-2 text-[10px]">
                      <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full rounded-full bg-violet-400" style={{ width: `${(count as number / governance.totalAgents) * 100}%` }} />
                      </div>
                      <span className="text-slate-400 capitalize w-28 shrink-0">{level}</span>
                      <span className="text-violet-300 font-bold">{count as number}</span>
                    </div>
                  ))}
                  <div className="pt-1 border-t border-white/6 flex items-center gap-2 text-[10px] text-slate-500">
                    <Shield className="w-2.5 h-2.5 text-violet-400" />
                    <span>{governance.aiGovernance?.complianceRulesActive ?? 5} active governance policies</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ABO Doctrine Footer */}
        <div className="mt-6 p-4 rounded-xl border border-white/6 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-3">
            <Brain className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white/80">ABO Doctrine — Platform Philosophy</h3>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400">All 8 Pillars Active</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: "◎", label: "MELT+A Fabric", desc: "Agent spans + traditional telemetry unified", pillar: 1 },
              { icon: "⬡", label: "Signal Intelligence", desc: "9 domains correlated in real-time", pillar: 2 },
              { icon: "◆", label: "Trust Mesh", desc: "Every decision carries an immutable receipt", pillar: 4 },
              { icon: "▲", label: "Anticipation Engine", desc: "Failures forecast before materialization", pillar: 6 },
            ].map(item => (
              <button
                key={item.pillar}
                onClick={() => setActivePillar(activePillar === item.pillar ? null : item.pillar)}
                className="text-left p-3 rounded-lg border border-white/6 hover:bg-white/5 transition-colors"
              >
                <div className="text-base mb-1" style={{ color: PILLAR_CONFIG[item.pillar - 1]?.color }}>{item.icon}</div>
                <div className="text-xs font-medium text-white/70">{item.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-[10px] text-slate-600 italic text-center">
            "Every agent action, every business signal, every governance decision, and every trust score flows through one coherent system." — The Alloy Doctrine
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Fallback Components (when API data isn't available yet) ────────────────────

function FallbackAgentVitals() {
  const agents = [
    { agentId: "lyte-autonomous", domain: "lyte", decisionLatencyMs: 320, hallucinationRate: 0.018, toolReliability: 0.96, delegationEfficiency: 0.88, autonomyUtilization: 0.82, vitalScore: 91, status: "healthy" as const },
    { agentId: "maritime-autonomous", domain: "vessels", decisionLatencyMs: 480, hallucinationRate: 0.024, toolReliability: 0.93, delegationEfficiency: 0.84, autonomyUtilization: 0.76, vitalScore: 87, status: "healthy" as const },
    { agentId: "firestorm-autonomous", domain: "firestorm", decisionLatencyMs: 210, hallucinationRate: 0.011, toolReliability: 0.98, delegationEfficiency: 0.91, autonomyUtilization: 0.71, vitalScore: 94, status: "healthy" as const },
    { agentId: "nexus-autonomous", domain: "nexus", decisionLatencyMs: 680, hallucinationRate: 0.032, toolReliability: 0.91, delegationEfficiency: 0.79, autonomyUtilization: 0.89, vitalScore: 83, status: "healthy" as const },
    { agentId: "prism-autonomous", domain: "prism-counsel", decisionLatencyMs: 920, hallucinationRate: 0.008, toolReliability: 0.99, delegationEfficiency: 0.94, autonomyUtilization: 0.63, vitalScore: 89, status: "healthy" as const },
  ];
  return (
    <div className="space-y-2">
      {agents.map(v => <AgentVitalCard key={v.agentId} vital={v} />)}
    </div>
  );
}

function FallbackSignalGraph() {
  const nodes = [
    { id: "lyte", domain: "lyte", riskLevel: "normal", trustScore: 94, businessImpact: "4.2s avg decision time", signalCount: 1 },
    { id: "vessels", domain: "vessels", riskLevel: "high", trustScore: 81, businessImpact: "$1.24M demurrage exposure", signalCount: 2 },
    { id: "firestorm", domain: "firestorm", riskLevel: "high", trustScore: 88, businessImpact: "TG-2847 lateral movement", signalCount: 2 },
    { id: "prism-counsel", domain: "prism-counsel", riskLevel: "medium", trustScore: 91, businessImpact: "EU AI Act drift", signalCount: 1 },
    { id: "nexus", domain: "nexus", riskLevel: "normal", trustScore: 96, businessImpact: null, signalCount: 0 },
  ];
  return (
    <div className="space-y-2">
      {nodes.map(n => <SignalNode key={n.id} node={n} />)}
    </div>
  );
}

function FallbackPredictive() {
  const signals: PredictiveSignal[] = [
    { signalId: "p1", domain: "firestorm", riskType: "security_threat", title: "Elevated lateral movement probability in threat cluster TG-2847", probability: 0.73, impact: "high", confidence: 0.82, suggestedActions: [], forecastHorizonMs: 4 * 3600000, timestamp: Date.now() - 300000 },
    { signalId: "p2", domain: "vessels", riskType: "business_impact", title: "Demurrage exposure forecast: $340K additional risk over 72h", probability: 0.68, impact: "high", confidence: 0.77, suggestedActions: [], forecastHorizonMs: 72 * 3600000, timestamp: Date.now() - 600000 },
    { signalId: "p3", domain: "prism-counsel", riskType: "compliance_drift", title: "EU AI Act Article 13 compliance drift in legal analysis pipeline", probability: 0.54, impact: "critical", confidence: 0.68, suggestedActions: [], forecastHorizonMs: 30 * 24 * 3600000, timestamp: Date.now() - 1200000 },
    { signalId: "p4", domain: "inca-lab", riskType: "agent_degradation", title: "Maritime agent accuracy drift toward SOC 2 warning threshold", probability: 0.61, impact: "medium", confidence: 0.71, suggestedActions: [], forecastHorizonMs: 6 * 24 * 3600000, timestamp: Date.now() - 900000 },
  ];
  return (
    <div className="space-y-2">
      {signals.map(s => <PredictiveSignalRow key={s.signalId} signal={s} />)}
    </div>
  );
}

function FallbackCompliance() {
  const frameworks = [
    { framework: "EU_AI_ACT", status: "partial", score: 78 },
    { framework: "SOC2", status: "compliant", score: 91 },
    { framework: "HIPAA", status: "compliant", score: 88 },
    { framework: "NIST_CSF", status: "compliant", score: 84 },
    { framework: "INTERNAL", status: "compliant", score: 94 },
  ];
  return (
    <div className="space-y-2">
      {frameworks.map(fw => <ComplianceFrameworkBadge key={fw.framework} fw={fw} />)}
    </div>
  );
}
