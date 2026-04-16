import React, { useState } from "react";
import { EcosystemNav } from "@szl-holdings/shared-ui/ecosystem-nav";

const ACCENT = "#8b7ac8";

interface Scenario {
  id: string;
  name: string;
  domain: string;
  description: string;
  tags: string[];
  snapshotCount: number;
  lastReplayed?: string;
  lastOutcome?: "pass" | "fail" | "partial";
  groundTruthMatchRate?: number;
}

interface ReplayRun {
  runId: string;
  scenarioId: string;
  scenarioName: string;
  startedAt: string;
  completedAt: string;
  totalSnapshots: number;
  successful: number;
  failed: number;
  avgLatencyMs: number;
  groundTruthMatchRate: number;
  totalCostUsd: number;
}

const SEEDED_SCENARIOS: Scenario[] = [
  {
    id: "aegis-soc-threat-triage-v1",
    name: "Aegis SOC — Critical Threat Triage",
    domain: "aegis",
    description: "Real-world SOC incident: ransomware lateral movement detected across 14 endpoints. Tests threat classification, escalation routing, and containment decisions.",
    tags: ["security", "ransomware", "soc", "triage", "critical", "ground-truth"],
    snapshotCount: 3,
    lastReplayed: "2025-04-14T09:22:00Z",
    lastOutcome: "partial",
    groundTruthMatchRate: 0.67,
  },
  {
    id: "vessels-voyage-pnl-optimization-v1",
    name: "Vessels — Voyage P&L Optimization",
    domain: "vessels",
    description: "Voyage route optimization request with cyclone avoidance constraints. Tests agent reasoning quality and operator override patterns.",
    tags: ["maritime", "voyage", "pnl", "optimization", "routing"],
    snapshotCount: 1,
    lastReplayed: "2025-04-13T14:05:00Z",
    lastOutcome: "pass",
    groundTruthMatchRate: 0.92,
  },
  {
    id: "terra-portfolio-valuation-v1",
    name: "Terra — Portfolio Valuation Stress Test",
    domain: "terra",
    description: "Interest rate shock scenario: 200bps increase. Tests cap rate estimation, NAV impact, and asset reallocation recommendations.",
    tags: ["real-estate", "valuation", "stress-test", "interest-rate"],
    snapshotCount: 4,
    lastReplayed: undefined,
    lastOutcome: undefined,
    groundTruthMatchRate: undefined,
  },
  {
    id: "prism-compliance-breach-v1",
    name: "Prism Counsel — Compliance Breach Response",
    domain: "prism",
    description: "A GDPR breach notification workflow test. Evaluates document generation, regulator routing, and remediation sequencing.",
    tags: ["compliance", "gdpr", "breach", "legal"],
    snapshotCount: 5,
    lastReplayed: "2025-04-10T11:30:00Z",
    lastOutcome: "pass",
    groundTruthMatchRate: 0.88,
  },
];

const RECENT_RUNS: ReplayRun[] = [
  {
    runId: "replay-1712997720-a3f1b2",
    scenarioId: "aegis-soc-threat-triage-v1",
    scenarioName: "Aegis SOC — Critical Threat Triage",
    startedAt: "2025-04-14T09:22:00Z",
    completedAt: "2025-04-14T09:22:18Z",
    totalSnapshots: 3,
    successful: 2,
    failed: 1,
    avgLatencyMs: 312,
    groundTruthMatchRate: 0.67,
    totalCostUsd: 0.00124,
  },
  {
    runId: "replay-1712910300-c9d4e7",
    scenarioId: "vessels-voyage-pnl-optimization-v1",
    scenarioName: "Vessels — Voyage P&L Optimization",
    startedAt: "2025-04-13T14:05:00Z",
    completedAt: "2025-04-13T14:05:04Z",
    totalSnapshots: 1,
    successful: 1,
    failed: 0,
    avgLatencyMs: 228,
    groundTruthMatchRate: 0.92,
    totalCostUsd: 0.00042,
  },
  {
    runId: "replay-1712649000-ff7a23",
    scenarioId: "prism-compliance-breach-v1",
    scenarioName: "Prism Counsel — Compliance Breach Response",
    startedAt: "2025-04-10T11:30:00Z",
    completedAt: "2025-04-10T11:30:22Z",
    totalSnapshots: 5,
    successful: 5,
    failed: 0,
    avgLatencyMs: 195,
    groundTruthMatchRate: 0.88,
    totalCostUsd: 0.00218,
  },
];

const DOMAIN_COLORS: Record<string, string> = {
  aegis: "#ef4444",
  vessels: "#0ea5e9",
  terra: "#22c55e",
  prism: "#a855f7",
  default: "#8b7ac8",
};

const DOMAIN_ICONS: Record<string, string> = {
  aegis: "⚔",
  vessels: "⚓",
  terra: "⬢",
  prism: "⚖",
  default: "◆",
};

function OutcomeBadge({ outcome }: { outcome?: Scenario["lastOutcome"] }) {
  if (!outcome) return <span style={{ color: "#64748b", fontSize: 11 }}>Not run</span>;
  const colors: Record<string, string> = { pass: "#22c55e", fail: "#ef4444", partial: "#f59e0b" };
  const labels: Record<string, string> = { pass: "PASS", fail: "FAIL", partial: "PARTIAL" };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: colors[outcome], background: `${colors[outcome]}18`, borderRadius: 4, padding: "2px 8px", border: `1px solid ${colors[outcome]}40` }}>
      {labels[outcome]}
    </span>
  );
}

function Delta({ value, higherIsBetter = true, suffix = "" }: { value: number; higherIsBetter?: boolean; suffix?: string }) {
  if (Math.abs(value) < 0.001) return <span style={{ color: "#64748b", fontSize: 11 }}>—</span>;
  const positive = higherIsBetter ? value > 0 : value < 0;
  const color = positive ? "#22c55e" : "#ef4444";
  const arrow = value > 0 ? "▲" : "▼";
  const display = suffix === "ms" ? `${Math.abs(value).toFixed(0)}${suffix}` : `${(Math.abs(value) * 100).toFixed(1)}%`;
  return (
    <span style={{ color, fontSize: 11, fontWeight: 600 }}>
      {arrow} {display}
    </span>
  );
}

interface ComparePanel {
  runA: ReplayRun;
  runB: ReplayRun;
}

function CompareOutcomePanel({ runA, runB, onClose }: ComparePanel & { onClose: () => void }) {
  const metrics: { label: string; keyA: keyof ReplayRun; format: (v: ReplayRun) => string; delta: number; higherBetter: boolean; suffix?: string }[] = [
    {
      label: "GT Match Rate",
      keyA: "groundTruthMatchRate",
      format: r => `${(r.groundTruthMatchRate * 100).toFixed(1)}%`,
      delta: runB.groundTruthMatchRate - runA.groundTruthMatchRate,
      higherBetter: true,
    },
    {
      label: "Pass Rate",
      keyA: "successful",
      format: r => `${r.successful}/${r.totalSnapshots} (${(r.successful / r.totalSnapshots * 100).toFixed(0)}%)`,
      delta: (runB.successful / runB.totalSnapshots) - (runA.successful / runA.totalSnapshots),
      higherBetter: true,
    },
    {
      label: "Avg Latency",
      keyA: "avgLatencyMs",
      format: r => `${r.avgLatencyMs}ms`,
      delta: runB.avgLatencyMs - runA.avgLatencyMs,
      higherBetter: false,
      suffix: "ms",
    },
    {
      label: "Total Cost",
      keyA: "totalCostUsd",
      format: r => `$${r.totalCostUsd.toFixed(5)}`,
      delta: runB.totalCostUsd - runA.totalCostUsd,
      higherBetter: false,
    },
  ];

  const improvements = metrics.filter(m => m.higherBetter ? m.delta > 0.005 : m.delta < -0.5).length;
  const regressions = metrics.filter(m => m.higherBetter ? m.delta < -0.005 : m.delta > 0.5).length;

  const sameDomain = runA.scenarioId === runB.scenarioId;

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${ACCENT}40`, borderRadius: 10, padding: 18, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>Outcome Comparison</span>
          {!sameDomain && (
            <span style={{ fontSize: 10, color: "#f59e0b", background: "#f59e0b18", padding: "1px 6px", borderRadius: 4, marginLeft: 8 }}>CROSS-SCENARIO</span>
          )}
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>✕</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {[{ label: "Run A (baseline)", run: runA }, { label: "Run B (challenger)", run: runB }].map(({ label, run }) => (
          <div key={run.runId} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 12px" }}>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 12, color: "#e2e8f0", fontWeight: 500, marginBottom: 2 }}>{run.scenarioName}</div>
            <div style={{ fontSize: 10, color: "#475569" }}>{run.runId.slice(0, 22)}…</div>
            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>{new Date(run.startedAt).toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
        {metrics.map(m => (
          <div key={m.label} style={{ display: "grid", gridTemplateColumns: "110px 1fr 1fr 80px", gap: 8, alignItems: "center", fontSize: 12 }}>
            <span style={{ color: "#475569", fontSize: 11 }}>{m.label}</span>
            <span style={{ color: "#94a3b8" }}>{m.format(runA)}</span>
            <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{m.format(runB)}</span>
            <Delta value={m.delta} higherIsBetter={m.higherBetter} suffix={m.suffix} />
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ flex: 1, textAlign: "center", background: "#22c55e18", borderRadius: 6, padding: "8px 0" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>{improvements}</div>
          <div style={{ fontSize: 10, color: "#22c55e80", textTransform: "uppercase", letterSpacing: 0.5 }}>Improved</div>
        </div>
        <div style={{ flex: 1, textAlign: "center", background: regressions > 0 ? "#ef444418" : "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 0" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: regressions > 0 ? "#ef4444" : "#475569" }}>{regressions}</div>
          <div style={{ fontSize: 10, color: regressions > 0 ? "#ef444480" : "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>Regressed</div>
        </div>
        <div style={{ flex: 1, textAlign: "center", background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "8px 0" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#64748b" }}>{metrics.length - improvements - regressions}</div>
          <div style={{ fontSize: 10, color: "#47556980", textTransform: "uppercase", letterSpacing: 0.5 }}>Neutral</div>
        </div>
      </div>
    </div>
  );
}

function ReplayRunRow({
  run,
  compareMode,
  selectedForCompare,
  onToggleCompare,
}: {
  run: ReplayRun;
  compareMode: boolean;
  selectedForCompare: boolean;
  onToggleCompare: (run: ReplayRun) => void;
}) {
  const pct = run.successful / run.totalSnapshots;
  const color = pct >= 0.9 ? "#22c55e" : pct >= 0.6 ? "#f59e0b" : "#ef4444";
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: compareMode ? "20px 1fr 70px 70px 80px 70px" : "1fr 70px 70px 80px 70px 80px",
        gap: 8,
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        fontSize: 12,
        color: "#94a3b8",
        alignItems: "center",
        background: selectedForCompare ? `${ACCENT}08` : "transparent",
        borderRadius: selectedForCompare ? 6 : 0,
        cursor: compareMode ? "pointer" : "default",
      }}
      onClick={() => compareMode && onToggleCompare(run)}
    >
      {compareMode && (
        <div style={{
          width: 14, height: 14, borderRadius: 3, border: `2px solid ${selectedForCompare ? ACCENT : "#334155"}`,
          background: selectedForCompare ? ACCENT : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {selectedForCompare && <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>✓</span>}
        </div>
      )}
      <div>
        <div style={{ color: "#e2e8f0", fontWeight: 500, fontSize: 11 }}>{run.scenarioName}</div>
        <div style={{ fontSize: 10, color: "#475569" }}>{run.runId.slice(0, 22)}…</div>
      </div>
      <div style={{ color }}>{run.successful}/{run.totalSnapshots}</div>
      <div>{(run.groundTruthMatchRate * 100).toFixed(0)}%</div>
      <div>{run.avgLatencyMs}ms</div>
      <div>${run.totalCostUsd.toFixed(5)}</div>
      {!compareMode && <div>{new Date(run.startedAt).toLocaleDateString()}</div>}
    </div>
  );
}

export default function ReplayLab() {
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [runs, setRuns] = useState<ReplayRun[]>(RECENT_RUNS);
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareResult, setCompareResult] = useState<{ runA: ReplayRun; runB: ReplayRun } | null>(null);

  const domains = ["all", ...Array.from(new Set(SEEDED_SCENARIOS.map(s => s.domain)))];
  const filtered = filterDomain === "all" ? SEEDED_SCENARIOS : SEEDED_SCENARIOS.filter(s => s.domain === filterDomain);

  function toggleRunForCompare(run: ReplayRun) {
    setCompareIds(prev => {
      if (prev.includes(run.runId)) return prev.filter(id => id !== run.runId);
      if (prev.length >= 2) return [prev[1]!, run.runId];
      return [...prev, run.runId];
    });
    setCompareResult(null);
  }

  function runComparison() {
    const [idA, idB] = compareIds;
    const runA = runs.find(r => r.runId === idA);
    const runB = runs.find(r => r.runId === idB);
    if (runA && runB) setCompareResult({ runA, runB });
  }

  function exitCompareMode() {
    setCompareMode(false);
    setCompareIds([]);
    setCompareResult(null);
  }

  async function handleReplay(scenario: Scenario) {
    setReplayingId(scenario.id);
    await new Promise(r => setTimeout(r, 1800 + Math.random() * 1200));
    const successful = Math.floor(scenario.snapshotCount * (0.6 + Math.random() * 0.4));
    const newRun: ReplayRun = {
      runId: `replay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      totalSnapshots: scenario.snapshotCount,
      successful,
      failed: scenario.snapshotCount - successful,
      avgLatencyMs: Math.floor(180 + Math.random() * 300),
      groundTruthMatchRate: 0.6 + Math.random() * 0.4,
      totalCostUsd: parseFloat((0.0001 * scenario.snapshotCount * (0.5 + Math.random())).toFixed(6)),
    };
    setRuns(prev => [newRun, ...prev]);
    setReplayingId(null);
  }

  return (
    <div style={{ background: "#080c14", minHeight: "100vh", color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={ACCENT} />

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0" }}>Replay Lab</span>
            <span style={{ fontSize: 11, color: ACCENT, background: `${ACCENT}18`, padding: "2px 10px", borderRadius: 20, border: `1px solid ${ACCENT}40`, fontWeight: 600 }}>BETA</span>
          </div>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
            Browse captured scenarios from real incidents and flows. Replay them against agents to measure decision quality and compare outcomes across runs.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Scenarios", value: SEEDED_SCENARIOS.length, color: ACCENT },
            { label: "Total Snapshots", value: SEEDED_SCENARIOS.reduce((s, x) => s + x.snapshotCount, 0), color: "#0ea5e9" },
            { label: "Replay Runs", value: runs.length, color: "#22c55e" },
            { label: "Avg GT Match", value: `${(runs.reduce((s, r) => s + r.groundTruthMatchRate, 0) / (runs.length || 1) * 100).toFixed(0)}%`, color: "#f59e0b" },
          ].map(m => (
            <div key={m.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 18px" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Scenarios</span>
              <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                {domains.map(d => (
                  <button
                    key={d}
                    onClick={() => setFilterDomain(d)}
                    style={{
                      background: filterDomain === d ? ACCENT : "rgba(255,255,255,0.05)",
                      color: filterDomain === d ? "#fff" : "#94a3b8",
                      border: "none",
                      borderRadius: 5,
                      padding: "4px 10px",
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
            </div>

            {filtered.map(s => (
              <div
                key={s.id}
                onClick={() => setSelected(s)}
                style={{
                  background: selected?.id === s.id ? `${ACCENT}12` : "rgba(255,255,255,0.03)",
                  border: selected?.id === s.id ? `1px solid ${ACCENT}60` : "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "16px 18px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  marginBottom: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${DOMAIN_COLORS[s.domain] ?? DOMAIN_COLORS.default}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                    {DOMAIN_ICONS[s.domain] ?? DOMAIN_ICONS.default}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{s.name}</span>
                      <OutcomeBadge outcome={s.lastOutcome} />
                    </div>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 8px", lineHeight: 1.5 }}>{s.description}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: DOMAIN_COLORS[s.domain] ?? DOMAIN_COLORS.default, background: `${DOMAIN_COLORS[s.domain] ?? DOMAIN_COLORS.default}15`, padding: "2px 8px", borderRadius: 4 }}>{s.domain.toUpperCase()}</span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{s.snapshotCount} snapshot{s.snapshotCount !== 1 ? "s" : ""}</span>
                      {s.groundTruthMatchRate !== undefined && (
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>GT match: {(s.groundTruthMatchRate * 100).toFixed(0)}%</span>
                      )}
                      {s.tags.slice(0, 3).map(t => (
                        <span key={t} style={{ fontSize: 10, color: "#64748b", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 3 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); void handleReplay(s); }}
                    disabled={replayingId === s.id}
                    style={{ background: replayingId === s.id ? "#334155" : ACCENT, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: replayingId === s.id ? "not-allowed" : "pointer", flexShrink: 0 }}
                  >
                    {replayingId === s.id ? "Running…" : "▶ Replay"}
                  </button>
                </div>
              </div>
            ))}

            {replayingId && (
              <div style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}40`, borderRadius: 10, padding: "14px 18px", marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 16, height: 16, border: `2px solid ${ACCENT}`, borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 13, color: ACCENT }}>Replaying scenario against agent...</span>
              </div>
            )}
          </div>

          <div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 18, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 14 }}>Scenario Detail</div>
              {selected ? (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", marginBottom: 6 }}>{selected.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>{selected.description}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Domain", value: selected.domain.toUpperCase() },
                      { label: "Snapshots", value: selected.snapshotCount },
                      { label: "Last Outcome", value: selected.lastOutcome ?? "Not run" },
                      { label: "GT Match Rate", value: selected.groundTruthMatchRate !== undefined ? `${(selected.groundTruthMatchRate * 100).toFixed(0)}%` : "—" },
                    ].map(row => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: "#475569" }}>{row.label}</span>
                        <span style={{ color: "#e2e8f0", fontWeight: 500 }}>{String(row.value)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                    <button
                      onClick={() => void handleReplay(selected)}
                      disabled={replayingId === selected.id}
                      style={{ flex: 1, background: ACCENT, color: "#fff", border: "none", borderRadius: 6, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                    >
                      ▶ Replay Now
                    </button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: 12, color: "#475569", textAlign: "center", padding: "20px 0" }}>Select a scenario to view details</p>
              )}
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Recent Runs</div>
                {!compareMode ? (
                  <button
                    onClick={() => { setCompareMode(true); setCompareIds([]); setCompareResult(null); }}
                    style={{ background: "rgba(255,255,255,0.06)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 5, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                  >
                    Compare runs
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={runComparison}
                      disabled={compareIds.length < 2}
                      style={{
                        background: compareIds.length < 2 ? "#1e293b" : ACCENT,
                        color: compareIds.length < 2 ? "#475569" : "#fff",
                        border: "none",
                        borderRadius: 5,
                        padding: "3px 10px",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: compareIds.length < 2 ? "not-allowed" : "pointer",
                      }}
                    >
                      {compareIds.length < 2 ? `Select ${2 - compareIds.length} more` : "Compare →"}
                    </button>
                    <button
                      onClick={exitCompareMode}
                      style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 13 }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {compareMode && (
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, padding: "6px 10px", background: `${ACCENT}08`, borderRadius: 6, border: `1px solid ${ACCENT}20` }}>
                  Select 2 runs to compare outcomes, metrics, and regressions side by side.
                </div>
              )}

              {compareResult && (
                <CompareOutcomePanel runA={compareResult.runA} runB={compareResult.runB} onClose={() => setCompareResult(null)} />
              )}

              <div style={{ display: "grid", gridTemplateColumns: compareMode ? "20px 1fr 70px 70px 80px 70px" : "1fr 70px 70px 80px 70px 80px", gap: 8, padding: "0 0 6px", borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 4 }}>
                {[...(compareMode ? [""] : []), "Scenario", "Pass", "GT%", "Latency", "Cost", ...(compareMode ? [] : ["Date"])].map((h, i) => (
                  <div key={i} style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>{h}</div>
                ))}
              </div>
              {runs.slice(0, 8).map(r => (
                <ReplayRunRow
                  key={r.runId}
                  run={r}
                  compareMode={compareMode}
                  selectedForCompare={compareIds.includes(r.runId)}
                  onToggleCompare={toggleRunForCompare}
                />
              ))}
              {runs.length === 0 && <p style={{ fontSize: 12, color: "#475569", textAlign: "center", padding: "16px 0" }}>No runs yet — replay a scenario</p>}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
