import React, { useState } from "react";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";

const ACCENT = "#8b7ac8";

interface EvalSuiteConfig {
  id: string;
  name: string;
  domain: string;
  totalCases: number;
  redTeamCases: number;
  strategies: string[];
  description: string;
}

interface EvalReport {
  suiteId: string;
  suiteName: string;
  strategy: string;
  model: string;
  runAt: string;
  totalCases: number;
  passed: number;
  failed: number;
  passRate: number;
  avgScore: number;
  f1Score: number;
  policyComplianceRate: number;
  overrideRate: number;
  avgLatencyMs: number;
  avgCostUsd: number;
  hasRegression: boolean;
  regressionSeverity: "none" | "minor" | "major" | "critical";
}

interface BenchmarkEntry {
  suite: string;
  strategy: string;
  passRate: number;
  f1Score: number;
  overrideRate: number;
  costPerOutcome: number;
  date: string;
}

const EVAL_SUITES: EvalSuiteConfig[] = [
  {
    id: "pulse-ranking",
    name: "Signal Ranking Accuracy",
    domain: "pulse",
    totalCases: 42,
    redTeamCases: 8,
    strategies: ["gpt-4o-base", "gpt-4o-finetuned", "claude-3-5-sonnet"],
    description: "Evaluates ranking quality for multi-domain signals including priority ordering and escalation confidence.",
  },
  {
    id: "soc-triage",
    name: "SOC Triage Decision Quality",
    domain: "aegis",
    totalCases: 28,
    redTeamCases: 5,
    strategies: ["gpt-4o-base", "gpt-4o-rlhf", "claude-3-5-sonnet"],
    description: "Precision/recall on threat classification and escalation routing decisions against labeled SOC ground truths.",
  },
  {
    id: "policy-compliance",
    name: "Policy Compliance & Safety",
    domain: "cross-domain",
    totalCases: 55,
    redTeamCases: 20,
    strategies: ["gpt-4o-base", "gpt-4o-finetuned"],
    description: "Red-team battery: prompt injection, unsafe tool execution, tenant isolation, policy bypass, and data export abuse.",
  },
  {
    id: "artifact-generation",
    name: "Artifact Generation Quality",
    domain: "cross-domain",
    totalCases: 35,
    redTeamCases: 0,
    strategies: ["gpt-4o-base", "gpt-4o-finetuned", "claude-3-5-sonnet"],
    description: "Evaluates completeness, accuracy, and usefulness scores for executive reports, runbooks, and risk briefs.",
  },
  {
    id: "hallucination-guard",
    name: "Hallucination & Calibration",
    domain: "cross-domain",
    totalCases: 30,
    redTeamCases: 0,
    strategies: ["gpt-4o-base", "gpt-4o-finetuned"],
    description: "Tests agent refusal accuracy and confidence calibration when insufficient data is available.",
  },
];

const HISTORICAL_REPORTS: EvalReport[] = [
  {
    suiteId: "soc-triage",
    suiteName: "SOC Triage Decision Quality",
    strategy: "gpt-4o-finetuned",
    model: "gpt-4o-2024-11-20",
    runAt: "2025-04-14T08:00:00Z",
    totalCases: 28,
    passed: 25,
    failed: 3,
    passRate: 0.893,
    avgScore: 0.876,
    f1Score: 0.884,
    policyComplianceRate: 0.964,
    overrideRate: 0.107,
    avgLatencyMs: 342,
    avgCostUsd: 0.00087,
    hasRegression: false,
    regressionSeverity: "none",
  },
  {
    suiteId: "pulse-ranking",
    suiteName: "Signal Ranking Accuracy",
    strategy: "gpt-4o-base",
    model: "gpt-4o-2024-08-06",
    runAt: "2025-04-13T16:30:00Z",
    totalCases: 42,
    passed: 34,
    failed: 8,
    passRate: 0.810,
    avgScore: 0.793,
    f1Score: 0.802,
    policyComplianceRate: 0.952,
    overrideRate: 0.190,
    avgLatencyMs: 412,
    avgCostUsd: 0.00064,
    hasRegression: true,
    regressionSeverity: "minor",
  },
  {
    suiteId: "policy-compliance",
    suiteName: "Policy Compliance & Safety",
    strategy: "gpt-4o-finetuned",
    model: "gpt-4o-2024-11-20",
    runAt: "2025-04-12T10:00:00Z",
    totalCases: 55,
    passed: 53,
    failed: 2,
    passRate: 0.964,
    avgScore: 0.951,
    f1Score: 0.960,
    policyComplianceRate: 0.982,
    overrideRate: 0.036,
    avgLatencyMs: 198,
    avgCostUsd: 0.00032,
    hasRegression: false,
    regressionSeverity: "none",
  },
];

const BENCHMARK_HISTORY: BenchmarkEntry[] = [
  { suite: "SOC Triage", strategy: "gpt-4o-finetuned", passRate: 0.893, f1Score: 0.884, overrideRate: 0.107, costPerOutcome: 0.00087, date: "Apr 14" },
  { suite: "SOC Triage", strategy: "gpt-4o-base", passRate: 0.821, f1Score: 0.809, overrideRate: 0.179, costPerOutcome: 0.00064, date: "Apr 10" },
  { suite: "SOC Triage", strategy: "claude-3-5-sonnet", passRate: 0.857, f1Score: 0.849, overrideRate: 0.143, costPerOutcome: 0.00112, date: "Apr 8" },
  { suite: "Signal Ranking", strategy: "gpt-4o-finetuned", passRate: 0.882, f1Score: 0.871, overrideRate: 0.118, costPerOutcome: 0.00053, date: "Apr 14" },
  { suite: "Signal Ranking", strategy: "gpt-4o-base", passRate: 0.810, f1Score: 0.802, overrideRate: 0.190, costPerOutcome: 0.00039, date: "Apr 13" },
];

function RegressionBadge({ severity }: { severity: EvalReport["regressionSeverity"] }) {
  const map: Record<string, { color: string; label: string }> = {
    none: { color: "#22c55e", label: "✓ No regression" },
    minor: { color: "#f59e0b", label: "⚠ Minor regression" },
    major: { color: "#f97316", label: "▲ Major regression" },
    critical: { color: "#ef4444", label: "✕ Critical regression" },
  };
  const { color, label } = map[severity] ?? map.none;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}18`, padding: "2px 8px", borderRadius: 4, border: `1px solid ${color}40` }}>{label}</span>
  );
}

export default function EvalLab() {
  const [activeTab, setActiveTab] = useState<"suites" | "results" | "benchmarks">("suites");
  const [selectedSuite, setSelectedSuite] = useState<EvalSuiteConfig | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [reports, setReports] = useState<EvalReport[]>(HISTORICAL_REPORTS);

  async function handleRunEval(suite: EvalSuiteConfig, strategy: string) {
    setRunningId(`${suite.id}-${strategy}`);
    await new Promise(r => setTimeout(r, 2200 + Math.random() * 1800));
    const passed = Math.floor(suite.totalCases * (0.75 + Math.random() * 0.22));
    const newReport: EvalReport = {
      suiteId: suite.id,
      suiteName: suite.name,
      strategy,
      model: strategy.includes("claude") ? "claude-3-5-sonnet-20241022" : "gpt-4o-2024-11-20",
      runAt: new Date().toISOString(),
      totalCases: suite.totalCases,
      passed,
      failed: suite.totalCases - passed,
      passRate: passed / suite.totalCases,
      avgScore: 0.72 + Math.random() * 0.24,
      f1Score: 0.70 + Math.random() * 0.26,
      policyComplianceRate: 0.90 + Math.random() * 0.09,
      overrideRate: 0.05 + Math.random() * 0.18,
      avgLatencyMs: Math.floor(180 + Math.random() * 350),
      avgCostUsd: parseFloat((0.0003 + Math.random() * 0.001).toFixed(6)),
      hasRegression: Math.random() < 0.2,
      regressionSeverity: Math.random() < 0.15 ? "minor" : "none",
    };
    setReports(prev => [newReport, ...prev]);
    setRunningId(null);
  }

  const tabs = [
    { id: "suites", label: "Eval Suites" },
    { id: "results", label: `Results (${reports.length})` },
    { id: "benchmarks", label: "Benchmarks" },
  ] as const;

  return (
    <div style={{ background: "#080c14", minHeight: "100vh", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={ACCENT} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0" }}>Eval Lab</span>
            <span style={{ fontSize: 11, color: "#0ea5e9", background: "#0ea5e920", padding: "2px 10px", borderRadius: 20, border: "1px solid #0ea5e940", fontWeight: 600 }}>BETA</span>
          </div>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
            Run evaluations across strategies, models, and orchestration configs. Track precision, recall, usefulness, policy compliance, override rates, and regressions over time.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total Eval Cases", value: EVAL_SUITES.reduce((s, x) => s + x.totalCases, 0), color: ACCENT },
            { label: "Red-Team Cases", value: EVAL_SUITES.reduce((s, x) => s + x.redTeamCases, 0), color: "#ef4444" },
            { label: "Avg Pass Rate", value: `${(reports.reduce((s, r) => s + r.passRate, 0) / (reports.length || 1) * 100).toFixed(1)}%`, color: "#22c55e" },
            { label: "Suites w/ Regression", value: reports.filter(r => r.hasRegression).length, color: "#f59e0b" },
            { label: "Strategies Compared", value: new Set(reports.map(r => r.strategy)).size, color: "#0ea5e9" },
          ].map(m => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 4, width: "fit-content" }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                background: activeTab === t.id ? ACCENT : "transparent",
                color: activeTab === t.id ? "#fff" : "#64748b",
                border: "none",
                borderRadius: 6,
                padding: "7px 18px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "suites" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
            <div>
              {EVAL_SUITES.map(suite => (
                <div
                  key={suite.id}
                  onClick={() => setSelectedSuite(suite)}
                  style={{
                    background: selectedSuite?.id === suite.id ? `${ACCENT}10` : "rgba(255,255,255,0.03)",
                    border: selectedSuite?.id === suite.id ? `1px solid ${ACCENT}50` : "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 10,
                    padding: "16px 18px",
                    marginBottom: 10,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 4 }}>{suite.name}</div>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 10px", lineHeight: 1.5 }}>{suite.description}</p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 11, color: "#94a3b8" }}>
                        <span>{suite.totalCases} cases</span>
                        {suite.redTeamCases > 0 && <span style={{ color: "#ef4444" }}>⚔ {suite.redTeamCases} red-team</span>}
                        <span style={{ color: "#8b7ac8" }}>{suite.strategies.length} strategies</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: "#0ea5e9", background: "#0ea5e915", padding: "2px 8px", borderRadius: 4, marginLeft: 12, flexShrink: 0 }}>{suite.domain.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 14 }}>Run Evaluation</div>
                {selectedSuite ? (
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>{selectedSuite.name}</div>
                    <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5, marginBottom: 14 }}>{selectedSuite.description}</p>
                    <div style={{ fontSize: 12, color: "#475569", marginBottom: 12 }}>Select strategy to evaluate:</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selectedSuite.strategies.map(strategy => (
                        <button
                          key={strategy}
                          disabled={!!runningId}
                          onClick={() => handleRunEval(selectedSuite, strategy)}
                          style={{
                            background: runningId === `${selectedSuite.id}-${strategy}` ? `${ACCENT}40` : "rgba(255,255,255,0.06)",
                            border: `1px solid ${runningId === `${selectedSuite.id}-${strategy}` ? ACCENT : "rgba(255,255,255,0.1)"}`,
                            borderRadius: 7,
                            padding: "10px 14px",
                            color: "#e2e8f0",
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: runningId ? "not-allowed" : "pointer",
                            textAlign: "left",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{strategy}</span>
                          {runningId === `${selectedSuite.id}-${strategy}` ? (
                            <span style={{ color: ACCENT, fontSize: 11 }}>Running…</span>
                          ) : (
                            <span style={{ color: ACCENT, fontSize: 11 }}>▶ Run</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: "#475569", textAlign: "center", padding: "20px 0" }}>Select an eval suite to run</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "results" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 70px 70px 70px 80px 80px 120px", gap: 8, padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 6 }}>
              {["Suite / Strategy", "Model", "Pass%", "F1", "Policy", "Override", "Latency", "Status"].map(h => (
                <div key={h} style={{ fontSize: 10, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</div>
              ))}
            </div>
            {reports.map((r, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 70px 70px 70px 80px 80px 120px", gap: 8, padding: "12px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "#e2e8f0" }}>{r.suiteName}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{r.strategy}</div>
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{r.model}</div>
                <div style={{ fontSize: 12, color: r.passRate >= 0.85 ? "#22c55e" : r.passRate >= 0.7 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>{(r.passRate * 100).toFixed(1)}%</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{(r.f1Score * 100).toFixed(1)}%</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{(r.policyComplianceRate * 100).toFixed(1)}%</div>
                <div style={{ fontSize: 12, color: r.overrideRate > 0.15 ? "#f59e0b" : "#94a3b8" }}>{(r.overrideRate * 100).toFixed(1)}%</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{r.avgLatencyMs}ms</div>
                <RegressionBadge severity={r.regressionSeverity} />
              </div>
            ))}
            {reports.length === 0 && (
              <p style={{ textAlign: "center", color: "#475569", fontSize: 13, padding: "40px 0" }}>No eval results yet — run an evaluation suite</p>
            )}
          </div>
        )}

        {activeTab === "benchmarks" && (
          <div>
            <div style={{ marginBottom: 20, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 18 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 14 }}>Strategy Comparison — Pass Rate</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {BENCHMARK_HISTORY.map((b, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: "#e2e8f0" }}>{b.suite} — {b.strategy}</span>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{(b.passRate * 100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${b.passRate * 100}%`, height: "100%", background: ACCENT, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {[
                { title: "F1 Score by Strategy", key: "f1Score" as const, fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
                { title: "Operator Override Rate", key: "overrideRate" as const, fmt: (v: number) => `${(v * 100).toFixed(1)}%` },
              ].map(({ title, key, fmt }) => (
                <div key={title} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 14 }}>{title}</div>
                  {BENCHMARK_HISTORY.map((b, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                      <span style={{ color: "#94a3b8" }}>{b.suite} / {b.strategy.replace("gpt-4o-", "")}</span>
                      <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{fmt(b[key])}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
