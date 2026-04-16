import React, { useState } from "react";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";

const ACCENT = "#8b7ac8";

interface TrustMetric {
  id: string;
  label: string;
  value: string | number;
  delta?: number;
  trend: "up" | "down" | "stable";
  isGoodWhenHigh: boolean;
  unit?: string;
  color: string;
  description: string;
}

interface DomainTrustRow {
  domain: string;
  icon: string;
  color: string;
  acceptanceRate: number;
  overrideRate: number;
  executionSuccessRate: number;
  falsePositiveRate: number;
  policyViolationRate: number;
  avgTimeToTriage: string;
  avgTimeToDecision: string;
  avgTimeToRemediation: string;
  tokenCostPerOutcome: number;
  businessValueProtected: string;
  regressionRate: number;
  trend: "improving" | "stable" | "degrading";
}

interface IncidentRecord {
  id: string;
  domain: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  agentDecision: string;
  outcome: "accepted" | "overridden" | "escalated" | "failed";
  timeToTriage: string;
  policyViolation: boolean;
  falsePositive: boolean;
  timestamp: string;
}

const TRUST_METRICS: TrustMetric[] = [
  { id: "acceptance-rate", label: "Recommendation Acceptance Rate", value: "84.2%", delta: 2.1, trend: "up", isGoodWhenHigh: true, color: "#22c55e", description: "% of agent recommendations accepted without operator override in the last 30 days" },
  { id: "override-rate", label: "Operator Override Rate", value: "15.8%", delta: -2.1, trend: "down", isGoodWhenHigh: false, color: "#f59e0b", description: "% of agent decisions manually overridden by human operators" },
  { id: "execution-success", label: "Execution Success Rate", value: "97.3%", delta: 0.4, trend: "up", isGoodWhenHigh: true, color: "#22c55e", description: "% of autonomous agent executions that completed without system error or rollback" },
  { id: "triage-time", label: "Avg Time to Triage", value: "4m 12s", delta: -18, trend: "down", isGoodWhenHigh: false, unit: "sec", color: "#0ea5e9", description: "Average time from alert ingestion to agent classification and priority assignment" },
  { id: "decision-time", label: "Avg Time to Decision", value: "9m 44s", delta: -32, trend: "down", isGoodWhenHigh: false, unit: "sec", color: "#0ea5e9", description: "Average time from triage to recommended action (excluding human approval wait)" },
  { id: "remediation-time", label: "Avg Time to Remediation", value: "38m 17s", delta: -240, trend: "down", isGoodWhenHigh: false, unit: "sec", color: "#0ea5e9", description: "Average end-to-end time from alert to confirmed resolution" },
  { id: "business-value", label: "Business Value Protected", value: "$4.2M", delta: 14.3, trend: "up", isGoodWhenHigh: true, color: "#a855f7", description: "Estimated financial value protected by autonomous agent actions this quarter (avoided losses + recoveries)" },
  { id: "false-positive-rate", label: "False Positive Rate", value: "3.1%", delta: -0.8, trend: "down", isGoodWhenHigh: false, color: "#22c55e", description: "% of agent-flagged incidents that were subsequently cleared as non-issues by analysts" },
  { id: "policy-violation", label: "Policy Violation Rate", value: "0.4%", delta: 0.1, trend: "up", isGoodWhenHigh: false, color: "#f97316", description: "% of agent actions that triggered a policy guardrail or were flagged for compliance review" },
  { id: "regression-rate", label: "Agent Regression Rate", value: "2.8%", delta: -0.6, trend: "down", isGoodWhenHigh: false, color: "#22c55e", description: "% of eval suite re-runs that showed a measurable performance regression vs baseline" },
  { id: "token-cost", label: "Token Cost per Outcome", value: "$0.0087", delta: -8.2, trend: "down", isGoodWhenHigh: false, color: "#22c55e", description: "Average token spend per successful autonomous outcome (resolved incident, completed action)" },
];

const DOMAIN_ROWS: DomainTrustRow[] = [
  {
    domain: "Aegis Security",
    icon: "⚔",
    color: "#ef4444",
    acceptanceRate: 0.81,
    overrideRate: 0.19,
    executionSuccessRate: 0.974,
    falsePositiveRate: 0.042,
    policyViolationRate: 0.008,
    avgTimeToTriage: "2m 44s",
    avgTimeToDecision: "7m 18s",
    avgTimeToRemediation: "28m 45s",
    tokenCostPerOutcome: 0.0124,
    businessValueProtected: "$1.8M",
    regressionRate: 0.032,
    trend: "stable",
  },
  {
    domain: "Vessels Maritime",
    icon: "⚓",
    color: "#0ea5e9",
    acceptanceRate: 0.88,
    overrideRate: 0.12,
    executionSuccessRate: 0.982,
    falsePositiveRate: 0.018,
    policyViolationRate: 0.002,
    avgTimeToTriage: "5m 10s",
    avgTimeToDecision: "11m 30s",
    avgTimeToRemediation: "42m 18s",
    tokenCostPerOutcome: 0.0072,
    businessValueProtected: "$940K",
    regressionRate: 0.021,
    trend: "improving",
  },
  {
    domain: "Terra Real Estate",
    icon: "⬢",
    color: "#22c55e",
    acceptanceRate: 0.86,
    overrideRate: 0.14,
    executionSuccessRate: 0.968,
    falsePositiveRate: 0.022,
    policyViolationRate: 0.003,
    avgTimeToTriage: "6m 22s",
    avgTimeToDecision: "12m 40s",
    avgTimeToRemediation: "48m 10s",
    tokenCostPerOutcome: 0.0061,
    businessValueProtected: "$780K",
    regressionRate: 0.019,
    trend: "improving",
  },
  {
    domain: "Prism Counsel",
    icon: "⚖",
    color: "#a855f7",
    acceptanceRate: 0.79,
    overrideRate: 0.21,
    executionSuccessRate: 0.951,
    falsePositiveRate: 0.051,
    policyViolationRate: 0.009,
    avgTimeToTriage: "3m 55s",
    avgTimeToDecision: "8m 22s",
    avgTimeToRemediation: "31m 40s",
    tokenCostPerOutcome: 0.0109,
    businessValueProtected: "$680K",
    regressionRate: 0.041,
    trend: "degrading",
  },
];

const RECENT_INCIDENTS: IncidentRecord[] = [
  { id: "INC-2025-19841", domain: "aegis", type: "Threat Triage", severity: "critical", agentDecision: "Escalate to SOC-T2 + isolate endpoints", outcome: "accepted", timeToTriage: "1m 32s", policyViolation: false, falsePositive: false, timestamp: "2025-04-16T08:14:00Z" },
  { id: "INC-2025-19833", domain: "vessels", type: "Route Optimization", severity: "high", agentDecision: "Divert via Cape of Good Hope", outcome: "overridden", timeToTriage: "4m 18s", policyViolation: false, falsePositive: false, timestamp: "2025-04-16T07:48:00Z" },
  { id: "INC-2025-19821", domain: "prism", type: "Compliance Alert", severity: "medium", agentDecision: "File SAR within 72h window", outcome: "escalated", timeToTriage: "3m 05s", policyViolation: false, falsePositive: false, timestamp: "2025-04-16T06:22:00Z" },
  { id: "INC-2025-19814", domain: "aegis", type: "Anomaly Detection", severity: "low", agentDecision: "Flag for analyst review", outcome: "accepted", timeToTriage: "2m 44s", policyViolation: false, falsePositive: true, timestamp: "2025-04-16T05:11:00Z" },
  { id: "INC-2025-19798", domain: "terra", type: "Valuation Alert", severity: "high", agentDecision: "Trigger re-appraisal workflow", outcome: "accepted", timeToTriage: "5m 58s", policyViolation: false, falsePositive: false, timestamp: "2025-04-15T22:40:00Z" },
  { id: "INC-2025-19784", domain: "aegis", type: "Policy Check", severity: "critical", agentDecision: "Export blocked — policy violation", outcome: "failed", timeToTriage: "0m 48s", policyViolation: true, falsePositive: false, timestamp: "2025-04-15T20:14:00Z" },
];

const TREND_COLORS = { improving: "#22c55e", stable: "#64748b", degrading: "#ef4444" };
const OUTCOME_COLORS = { accepted: "#22c55e", overridden: "#f59e0b", escalated: "#0ea5e9", failed: "#ef4444" };

function MetricCard({ metric }: { metric: TrustMetric }) {
  const deltaPositive = metric.trend === "up" ? metric.isGoodWhenHigh : !metric.isGoodWhenHigh;
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{metric.label}</span>
        {metric.delta !== undefined && (
          <span style={{ fontSize: 10, color: deltaPositive ? "#22c55e" : "#ef4444", flexShrink: 0, marginLeft: 6 }}>
            {metric.trend === "up" ? "▲" : "▼"} {Math.abs(metric.delta)}{metric.unit ?? "%"}
          </span>
        )}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: metric.color }}>{metric.value}</div>
      <div style={{ fontSize: 10, color: "#475569", marginTop: 4, lineHeight: 1.4 }}>{metric.description.slice(0, 60)}…</div>
    </div>
  );
}

export default function TrustConsole() {
  const [activeView, setActiveView] = useState<"overview" | "domains" | "incidents">("overview");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");

  const filteredIncidents = selectedDomain === "all" ? RECENT_INCIDENTS : RECENT_INCIDENTS.filter(i => i.domain === selectedDomain);

  const overallHealth = {
    acceptanceRate: DOMAIN_ROWS.reduce((s, d) => s + d.acceptanceRate, 0) / DOMAIN_ROWS.length,
    executionSuccess: DOMAIN_ROWS.reduce((s, d) => s + d.executionSuccessRate, 0) / DOMAIN_ROWS.length,
    falsePositive: DOMAIN_ROWS.reduce((s, d) => s + d.falsePositiveRate, 0) / DOMAIN_ROWS.length,
    degradingDomains: DOMAIN_ROWS.filter(d => d.trend === "degrading").length,
  };

  return (
    <div style={{ background: "#080c14", minHeight: "100vh", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={ACCENT} />

      <div style={{ maxWidth: 1300, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0" }}>Trust Console</span>
            <span style={{ fontSize: 11, color: overallHealth.degradingDomains > 0 ? "#f59e0b" : "#22c55e", background: overallHealth.degradingDomains > 0 ? "#f59e0b18" : "#22c55e18", padding: "2px 10px", borderRadius: 20, border: `1px solid ${overallHealth.degradingDomains > 0 ? "#f59e0b40" : "#22c55e40"}`, fontWeight: 600 }}>
              {overallHealth.degradingDomains > 0 ? `⚠ ${overallHealth.degradingDomains} DOMAIN${overallHealth.degradingDomains > 1 ? "S" : ""} DEGRADING` : "✓ SYSTEMS HEALTHY"}
            </span>
          </div>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
            Production trust dashboard — recommendation quality, autonomous action safety, failure modes, and agent regression history across all domains.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Acceptance Rate", value: `${(overallHealth.acceptanceRate * 100).toFixed(1)}%`, color: "#22c55e", sub: "Cross-domain avg" },
            { label: "Execution Success", value: `${(overallHealth.executionSuccess * 100).toFixed(1)}%`, color: "#22c55e", sub: "Last 30 days" },
            { label: "False Positive Rate", value: `${(overallHealth.falsePositive * 100).toFixed(1)}%`, color: "#f59e0b", sub: "Cross-domain avg" },
            { label: "Domains Degrading", value: overallHealth.degradingDomains, color: overallHealth.degradingDomains > 0 ? "#ef4444" : "#22c55e", sub: "Trend vs prior period" },
          ].map(m => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 2 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 4, width: "fit-content" }}>
          {(["overview", "domains", "incidents"] as const).map(v => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              style={{
                background: activeView === v ? ACCENT : "transparent",
                color: activeView === v ? "#fff" : "#64748b",
                border: "none",
                borderRadius: 6,
                padding: "7px 18px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {v === "overview" ? "All Metrics" : v === "domains" ? "By Domain" : "Incidents"}
            </button>
          ))}
        </div>

        {activeView === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {TRUST_METRICS.map(m => <MetricCard key={m.id} metric={m} />)}
          </div>
        )}

        {activeView === "domains" && (
          <div>
            {DOMAIN_ROWS.map(row => (
              <div key={row.domain} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 18, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${row.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{row.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>{row.domain}</div>
                    <div style={{ fontSize: 11, color: TREND_COLORS[row.trend], fontWeight: 600 }}>
                      {row.trend === "improving" ? "▲ Improving" : row.trend === "degrading" ? "▼ Degrading" : "→ Stable"}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: 13, color: "#22c55e", fontWeight: 700 }}>{row.businessValueProtected} protected</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
                  {[
                    { label: "Acceptance", value: `${(row.acceptanceRate * 100).toFixed(0)}%`, good: row.acceptanceRate >= 0.8 },
                    { label: "Override", value: `${(row.overrideRate * 100).toFixed(0)}%`, good: row.overrideRate <= 0.15 },
                    { label: "Exec Success", value: `${(row.executionSuccessRate * 100).toFixed(1)}%`, good: row.executionSuccessRate >= 0.95 },
                    { label: "False Pos", value: `${(row.falsePositiveRate * 100).toFixed(1)}%`, good: row.falsePositiveRate <= 0.04 },
                    { label: "Policy Viol", value: `${(row.policyViolationRate * 100).toFixed(1)}%`, good: row.policyViolationRate <= 0.005 },
                    { label: "Regression", value: `${(row.regressionRate * 100).toFixed(1)}%`, good: row.regressionRate <= 0.03 },
                  ].map(m => (
                    <div key={m.label}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: m.good ? "#22c55e" : "#ef4444" }}>{m.value}</div>
                      <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{m.label}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {[
                    { label: "Time to Triage", value: row.avgTimeToTriage },
                    { label: "Time to Decision", value: row.avgTimeToDecision },
                    { label: "Time to Remediation", value: row.avgTimeToRemediation },
                    { label: "Cost / Outcome", value: `$${row.tokenCostPerOutcome.toFixed(4)}` },
                  ].map(m => (
                    <div key={m.label} style={{ fontSize: 11, color: "#94a3b8" }}>
                      <span style={{ color: "#475569" }}>{m.label}: </span>
                      <span style={{ fontWeight: 600 }}>{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === "incidents" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["all", "aegis", "vessels", "terra", "prism"].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDomain(d)}
                  style={{
                    background: selectedDomain === d ? ACCENT : "rgba(255,255,255,0.05)",
                    color: selectedDomain === d ? "#fff" : "#94a3b8",
                    border: "none",
                    borderRadius: 5,
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 100px 1fr 80px 80px 80px 140px", gap: 8, padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 4 }}>
              {["ID", "Domain", "Severity", "Type", "Agent Decision", "Outcome", "Triage", "Flags", "Time"].map(h => (
                <div key={h} style={{ fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
              ))}
            </div>

            {filteredIncidents.map(inc => (
              <div key={inc.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 100px 1fr 80px 80px 80px 140px", gap: 8, padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                <div style={{ fontSize: 11, color: "#64748b", fontFamily: "monospace" }}>{inc.id}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>{inc.domain}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: inc.severity === "critical" ? "#ef4444" : inc.severity === "high" ? "#f97316" : inc.severity === "medium" ? "#f59e0b" : "#64748b", textTransform: "uppercase" }}>{inc.severity}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{inc.type}</div>
                <div style={{ fontSize: 11, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inc.agentDecision}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: OUTCOME_COLORS[inc.outcome], textTransform: "uppercase" }}>{inc.outcome}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{inc.timeToTriage}</div>
                <div style={{ display: "flex", gap: 4 }}>
                  {inc.policyViolation && <span style={{ fontSize: 9, color: "#ef4444", background: "#ef444420", padding: "1px 5px", borderRadius: 3 }}>POL</span>}
                  {inc.falsePositive && <span style={{ fontSize: 9, color: "#f59e0b", background: "#f59e0b20", padding: "1px 5px", borderRadius: 3 }}>FP</span>}
                  {!inc.policyViolation && !inc.falsePositive && <span style={{ fontSize: 9, color: "#22c55e" }}>✓</span>}
                </div>
                <div style={{ fontSize: 11, color: "#475569" }}>{new Date(inc.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
