import { useState, useEffect } from "react";
import { Brain, TrendingUp, Clock, AlertTriangle, Target, Activity, Shield, ChevronRight } from "lucide-react";

const ACCENT = "#ef4444";
const PURPLE = "#8b5cf6";
const DS = {
  surface: "rgba(255,255,255,0.025)",
  border: "rgba(255,255,255,0.06)",
  text: { primary: "rgba(255,255,255,0.88)", secondary: "rgba(255,255,255,0.5)", muted: "rgba(255,255,255,0.25)" },
};

interface ThreatPrediction {
  id: string;
  threatType: string;
  adversaryGroup?: string;
  currentStage: string;
  predictedNextStage: string;
  timeToNextStageHours: number;
  confidencePct: number;
  blastRadiusTrend: number[];
  businessImpactUsd: number;
  mitigationWindow: number;
  severity: "critical" | "high" | "medium";
  recommendedActions: string[];
}

interface CapacityRisk {
  asset: string;
  assetType: "endpoint" | "network" | "identity" | "cloud";
  riskScore: number;
  trend: number[];
  primaryRisk: string;
  hoursToBreach: number;
}

const SEED_PREDICTIONS: ThreatPrediction[] = [
  {
    id: "tp1", threatType: "Advanced Persistent Threat",
    adversaryGroup: "APT29 (Cozy Bear)", currentStage: "C2 Established",
    predictedNextStage: "Data Staging & Exfiltration",
    timeToNextStageHours: 2.4, confidencePct: 89, severity: "critical",
    blastRadiusTrend: [20, 28, 38, 51, 65, 78, 85, 91],
    businessImpactUsd: 340000, mitigationWindow: 140,
    recommendedActions: ["Terminate C2 channel immediately", "Audit data access logs for staging activity", "Isolate high-value data repositories", "Engage IR team"],
  },
  {
    id: "tp2", threatType: "Ransomware Campaign",
    currentStage: "Defense Evasion", predictedNextStage: "Volume Encryption Attempt",
    timeToNextStageHours: 0.8, confidencePct: 94, severity: "critical",
    blastRadiusTrend: [30, 45, 62, 78, 88, 93, 96, 98],
    businessImpactUsd: 890000, mitigationWindow: 48,
    recommendedActions: ["Disable vssadmin across all endpoints", "Enforce read-only backup volumes", "Activate ransomware playbook Omega", "Notify all clients immediately"],
  },
  {
    id: "tp3", threatType: "Credential Campaign",
    currentStage: "Reconnaissance", predictedNextStage: "Exploitation Attempt",
    timeToNextStageHours: 8.5, confidencePct: 71, severity: "high",
    blastRadiusTrend: [8, 12, 17, 23, 31, 40, 51, 63],
    businessImpactUsd: 95000, mitigationWindow: 510,
    recommendedActions: ["Enforce MFA across all tenants", "Block observed source IP ranges", "Alert identity team"],
  },
];

const CAPACITY_RISKS: CapacityRisk[] = [
  { asset: "Azure AD Identity Pool", assetType: "identity", riskScore: 82, trend: [55, 62, 68, 74, 78, 80, 82], primaryRisk: "MFA bypass rate exceeding threshold", hoursToBreach: 4.2 },
  { asset: "Perimeter Firewall — WAN", assetType: "network", riskScore: 61, trend: [40, 44, 48, 52, 56, 59, 61], primaryRisk: "Connection table nearing capacity", hoursToBreach: 14.0 },
  { asset: "EDR Coverage — Laptops", assetType: "endpoint", riskScore: 73, trend: [60, 63, 66, 69, 71, 72, 73], primaryRisk: "17 endpoints missing agent update", hoursToBreach: 8.5 },
  { asset: "SIEM Log Ingestion", assetType: "cloud", riskScore: 44, trend: [35, 36, 38, 40, 41, 43, 44], primaryRisk: "Approaching daily ingest quota", hoursToBreach: 22.0 },
];

function SparkLine({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = 100, h = 32, w = 100;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polygon points={areaPoints} fill={`${color}15`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {data.length > 0 && (
        <circle cx={w} cy={h - (data[data.length - 1]! / max) * h} r="3" fill={color} />
      )}
    </svg>
  );
}

export default function PredictiveIntelligence() {
  const [predictions, setPredictions] = useState<ThreatPrediction[]>(SEED_PREDICTIONS);
  const [capacityRisks, setCapacityRisks] = useState<CapacityRisk[]>(CAPACITY_RISKS);
  const [tab, setTab] = useState<"threats" | "capacity" | "impact">("threats");

  useEffect(() => {
    const t = setInterval(() => {
      setPredictions(prev => prev.map(p => ({
        ...p,
        timeToNextStageHours: Math.max(0.1, p.timeToNextStageHours - 0.01),
        blastRadiusTrend: [...p.blastRadiusTrend.slice(-7), Math.min(100, p.blastRadiusTrend[p.blastRadiusTrend.length - 1]! + Math.random() * 1.5)],
        mitigationWindow: Math.max(0, p.mitigationWindow - 0.5),
      })));
      setCapacityRisks(prev => prev.map(r => ({
        ...r,
        riskScore: Math.min(99, r.riskScore + Math.random() * 0.2),
        hoursToBreach: Math.max(0.1, r.hoursToBreach - 0.01),
      })));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const criticalPredictions = predictions.filter(p => p.severity === "critical").length;
  const minMitigationWindow = Math.min(...predictions.map(p => p.mitigationWindow));
  const totalImpact = predictions.reduce((s, p) => s + p.businessImpactUsd, 0);

  const TABS = [
    { id: "threats" as const, label: "Threat Trajectory" },
    { id: "capacity" as const, label: "Security Capacity Risk" },
    { id: "impact" as const, label: "Impact Forecasting" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-3.5 h-3.5" style={{ color: PURPLE }} />
          <span className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: PURPLE }}>Aegis · Predictive Intelligence</span>
          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold animate-pulse" style={{ background: "rgba(139,92,246,0.15)", color: PURPLE }}>FORECASTING ACTIVE</span>
        </div>
        <h1 className="text-xl font-bold text-white">Security Predictive Intelligence</h1>
        <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Threat trajectory prediction with confidence intervals, capacity exhaustion forecasting, business impact modeling, and proactive alerts before problems materialize.</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Threat Trajectories", value: predictions.length.toString(), color: PURPLE },
          { label: "Critical Trajectories", value: criticalPredictions.toString(), color: ACCENT, pulse: criticalPredictions > 0 },
          { label: "Min Mitigation Window", value: `${minMitigationWindow.toFixed(0)}min`, color: minMitigationWindow < 120 ? ACCENT : "#f59e0b" },
          { label: "Projected Impact", value: `$${(totalImpact / 1000000).toFixed(2)}M`, color: "#d4a054" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4 text-center" style={{ borderColor: `${c.color}20`, background: `${c.color}06` }}>
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span className="text-2xl font-bold font-mono" style={{ color: c.color }}>{c.value}</span>
              {(c as { pulse?: boolean }).pulse && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: c.color }} />}
            </div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 text-xs font-medium transition-colors" style={{ color: tab === t.id ? "white" : "rgba(255,255,255,0.4)", borderBottom: tab === t.id ? `2px solid ${PURPLE}` : "2px solid transparent" }}>{t.label}</button>
        ))}
      </div>

      {tab === "threats" && (
        <div className="space-y-4">
          {predictions.map(p => {
            const sc = p.severity === "critical" ? ACCENT : p.severity === "high" ? "#f97316" : "#f59e0b";
            return (
              <div key={p.id} className="rounded-xl border p-5" style={{ borderColor: `${sc}20`, background: `${sc}04` }}>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${sc}15`, color: sc }}>{p.severity}</span>
                      {p.adversaryGroup && <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(139,92,246,0.12)", color: PURPLE }}>{p.adversaryGroup}</span>}
                    </div>
                    <div className="text-sm font-bold text-white">{p.threatType}</div>
                    <div className="mt-1 flex items-center gap-3 text-[10px]" style={{ color: DS.text.muted }}>
                      <span className="font-mono">{p.currentStage}</span>
                      <ChevronRight className="w-3 h-3 shrink-0" />
                      <span className="font-mono text-white/60">{p.predictedNextStage}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold font-mono" style={{ color: sc }}>{p.confidencePct}%</div>
                    <div className="text-[9px]" style={{ color: DS.text.muted }}>confidence</div>
                    <div className="mt-1 text-[10px] font-mono" style={{ color: p.timeToNextStageHours < 2 ? sc : "#f59e0b" }}>⏱ {p.timeToNextStageHours.toFixed(1)}h</div>
                  </div>
                </div>

                <div className="flex items-center gap-6 mb-4">
                  <div>
                    <div className="text-[9px] mb-1" style={{ color: DS.text.muted }}>Blast Radius Trajectory</div>
                    <SparkLine data={p.blastRadiusTrend} color={sc} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 flex-1">
                    {[
                      { label: "Business Impact", value: `$${(p.businessImpactUsd / 1000).toFixed(0)}k`, color: "#d4a054" },
                      { label: "Mitigation Window", value: `${p.mitigationWindow.toFixed(0)}min`, color: p.mitigationWindow < 120 ? ACCENT : "#f59e0b" },
                    ].map(m => (
                      <div key={m.label} className="p-2 rounded-lg text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                        <div className="text-sm font-bold font-mono" style={{ color: m.color }}>{m.value}</div>
                        <div className="text-[8px]" style={{ color: DS.text.muted }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: DS.text.muted }}>Recommended Immediate Actions</div>
                  <div className="flex flex-wrap gap-1">
                    {p.recommendedActions.map(a => (
                      <span key={a} className="text-[9px] px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>{a}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "capacity" && (
        <div className="space-y-4">
          {capacityRisks.map(r => {
            const riskColor = r.riskScore > 75 ? ACCENT : r.riskScore > 55 ? "#f59e0b" : "#6b8f71";
            const typeColors = { endpoint: "#3b82f6", network: "#8b5cf6", identity: ACCENT, cloud: "#14b8a6" };
            const tc = typeColors[r.assetType];
            return (
              <div key={r.asset} className="rounded-xl border p-4" style={{ borderColor: `${riskColor}20`, background: `${riskColor}04` }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${tc}15`, color: tc }}>{r.assetType}</span>
                      <div className="text-xs font-bold text-white">{r.asset}</div>
                    </div>
                    <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>{r.primaryRisk}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold font-mono" style={{ color: riskColor }}>{r.riskScore.toFixed(0)}</div>
                    <div className="text-[9px] font-mono" style={{ color: DS.text.muted }}>breach in {r.hoursToBreach.toFixed(1)}h</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${r.riskScore}%`, background: riskColor }} />
                  </div>
                  <SparkLine data={r.trend} color={riskColor} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "impact" && (
        <div className="space-y-4">
          <div className="rounded-xl border p-5" style={{ borderColor: DS.border, background: DS.surface }}>
            <div className="text-xs font-bold text-white mb-4">3-Scenario Business Impact Model</div>
            <div className="space-y-4">
              {[
                { label: "Optimistic (all threats contained within 1h)", impact: 45000, color: "#6b8f71", probability: 28 },
                { label: "Base (current trajectory, 4-6h resolution)", impact: 420000, color: "#f59e0b", probability: 49 },
                { label: "Worst Case (threats escalate, 24h+ resolution)", impact: 2100000, color: ACCENT, probability: 23 },
              ].map(s => (
                <div key={s.label} className="p-4 rounded-xl" style={{ background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] text-white/70">{s.label}</div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px]" style={{ color: DS.text.muted }}>P{s.probability}</span>
                      <span className="text-sm font-bold font-mono" style={{ color: s.color }}>${(s.impact / 1000).toFixed(0)}k</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full" style={{ width: `${s.probability / 60 * 100}%`, background: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border p-4" style={{ borderColor: DS.border, background: DS.surface }}>
            <div className="text-[10px] font-bold text-white mb-3">Executive Risk Summary</div>
            <div className="space-y-2 text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              <p>🔴 <strong className="text-white/80">Expected Value (probability-weighted)</strong>: ~$580k total business impact if current threats continue unmitigated</p>
              <p>⏱ <strong className="text-white/80">Minimum mitigation window</strong>: {minMitigationWindow.toFixed(0)} minutes before ransomware campaign enters encryption phase</p>
              <p>🟢 <strong className="text-white/80">ROI on immediate containment</strong>: Every minute of action saves ~$12k in projected breach cost</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
