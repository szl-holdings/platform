import { PREDICTIONS, DRIFT_EVENTS, formatCurrency, getSeverityColor } from "@workspace/shared-ui/core-observability-data";
import { AlertTriangle, ArrowRight, ShieldAlert, Target } from "lucide-react";

const SCENARIOS = [
  {
    id: "sc-001",
    title: "Q1 Revenue Miss — Contract Approval Delays Cascade",
    probability: 72,
    severity: "critical" as const,
    impact: 2800000,
    drivers: ["Legal capacity at 94%", "48h SLA breach on Northgate", "Q1 close window closing", "Alloy retry pending"],
    mitigations: ["Parallel CFO approval path", "CEO-to-VP escalation", "Contract scope reduction to accelerate"],
    correlation_id: "gf-2026-q1-001",
    time_horizon: "6 days",
    linked_predictions: ["pred-001"],
  },
  {
    id: "sc-002",
    title: "Top-Customer Churn Wave — Competitive Displacement",
    probability: 61,
    severity: "high" as const,
    impact: 1840000,
    drivers: ["TechCorp NPS -42 pts", "GlobalCorp at risk (competitor renewal)", "CS team overloaded", "No exec engagement planned"],
    mitigations: ["CEO-to-CEO outreach for TechCorp", "Retention offer approval at 30%", "Dedicated CSM reassignment"],
    correlation_id: "corr-churn-techcorp",
    time_horizon: "30 days",
    linked_predictions: ["pred-003"],
  },
  {
    id: "sc-003",
    title: "Vendor Onboarding Bottleneck — Procurement Gap Risk",
    probability: 84,
    severity: "high" as const,
    impact: 780000,
    drivers: ["6 blocked vendor workflows", "No compliance step owner", "6-day backlog already forming", "Team reorg gap unresolved"],
    mitigations: ["Temp resource assignment to compliance step", "Fast-track low-risk vendors through alternative path", "Escalate to CPO"],
    correlation_id: "corr-vendor-apex",
    time_horizon: "14 days",
    linked_predictions: ["pred-002"],
  },
];

export default function RiskScenario() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <AlertTriangle className="w-4 h-4" style={{ color: "#8b5cf6" }} />
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "#6366f1" }}>Alloy · Risk Scenario Planning</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Risk Scenario Planning</h1>
        <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Multi-variable risk models with mitigation strategies and Alloy confidence scores.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Scenarios", value: SCENARIOS.length, color: "#8b5cf6" },
          { label: "Highest Probability", value: `${Math.max(...SCENARIOS.map(s => s.probability))}%`, color: "#ef4444" },
          { label: "Total Value at Risk", value: formatCurrency(SCENARIOS.reduce((s, sc) => s + sc.impact, 0)), color: "#f59e0b" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border p-4" style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}>
            <div className="text-[10px] font-medium mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>{c.label}</div>
            <div className="text-2xl font-bold" style={{ color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {SCENARIOS.map(sc => {
          const probColor = sc.probability >= 75 ? "#ef4444" : sc.probability >= 60 ? "#f97316" : "#f59e0b";
          return (
            <div key={sc.id} className="rounded-xl border p-5" style={{ borderColor: "rgba(139,92,246,0.15)", background: "rgba(139,92,246,0.03)" }}>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded" style={{
                      color: getSeverityColor(sc.severity),
                      background: `${getSeverityColor(sc.severity)}15`,
                      border: `1px solid ${getSeverityColor(sc.severity)}30`,
                    }}>{sc.severity}</span>
                    <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.4)" }}>Horizon: {sc.time_horizon}</span>
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">{sc.title}</div>
                </div>
                <div className="shrink-0 text-center">
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                      <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                      <circle cx="32" cy="32" r="26" fill="none" stroke={probColor} strokeWidth="6"
                        strokeDasharray={`${(sc.probability / 100) * 163.4} 163.4`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-bold" style={{ color: probColor }}>{sc.probability}%</span>
                    </div>
                  </div>
                  <div className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>probability</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#ef4444" }}>Risk Drivers</div>
                  <div className="space-y-1">
                    {sc.drivers.map((d, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                        <span style={{ color: "#ef4444" }}>↑</span> {d}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#10b981" }}>Mitigation Options</div>
                  <div className="space-y-1">
                    {sc.mitigations.map((m, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                        <span style={{ color: "#10b981" }}>→</span> {m}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                <span className="text-sm font-bold" style={{ color: "#f59e0b" }}>{formatCurrency(sc.impact)}</span>
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>value at risk</span>
                <div className="flex gap-2 ml-auto">
                  <a href="/lyte-command-center/escalation" className="text-[9px] px-2.5 py-1 rounded font-medium hover:opacity-80 flex items-center gap-1" style={{ color: "#f59e0b", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                    Escalate in Lyte <ArrowRight className="w-3 h-3" />
                  </a>
                  <a href="/alloy/" className="text-[9px] px-2.5 py-1 rounded font-medium hover:opacity-80 flex items-center gap-1" style={{ color: "#00d4ff", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}>
                    Execute Mitigation <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
