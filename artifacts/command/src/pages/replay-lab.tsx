import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import { useEffect, useState } from 'react';
import { ACCENT, apiUrl, DOMAIN_COLORS, DOMAIN_ICONS, fetchJson } from './cognitive/shared';

interface Scenario {
  scenarioId: string;
  name: string;
  domain: string;
  description: string;
  tags: string[];
  snapshotCount: number;
  lastReplayed: string | null;
  lastOutcome: string | null;
  groundTruthMatchRate: number | null;
  recentRuns: ReplayRun[];
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

function OutcomeBadge({ outcome }: { outcome?: string | null }) {
  if (!outcome) return <span style={{ color: 'var(--gi-text-muted)', fontSize: 11 }}>Not run</span>;
  const colors: Record<string, string> = { pass: '#22c55e', fail: '#ef4444', partial: '#f59e0b' };
  const labels: Record<string, string> = { pass: 'PASS', fail: 'FAIL', partial: 'PARTIAL' };
  const color = colors[outcome] ?? '#4a6070';
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1,
        color,
        background: `${color}18`,
        borderRadius: 4,
        padding: '2px 8px',
        border: `1px solid ${color}40`,
      }}
    >
      {labels[outcome] ?? outcome.toUpperCase()}
    </span>
  );
}

function Delta({
  value,
  higherIsBetter = true,
  suffix = '',
}: {
  value: number;
  higherIsBetter?: boolean;
  suffix?: string;
}) {
  if (Math.abs(value) < 0.001) return <span style={{ color: 'var(--gi-text-muted)', fontSize: 11 }}>—</span>;
  const positive = higherIsBetter ? value > 0 : value < 0;
  const color = positive ? '#22c55e' : '#ef4444';
  const arrow = value > 0 ? '▲' : '▼';
  const display =
    suffix === 'ms'
      ? `${Math.abs(value).toFixed(0)}${suffix}`
      : `${(Math.abs(value) * 100).toFixed(1)}%`;
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
  const metrics: {
    label: string;
    format: (v: ReplayRun) => string;
    delta: number;
    higherBetter: boolean;
    suffix?: string;
  }[] = [
    {
      label: 'GT Match Rate',
      format: (r) => `${(r.groundTruthMatchRate * 100).toFixed(1)}%`,
      delta: runB.groundTruthMatchRate - runA.groundTruthMatchRate,
      higherBetter: true,
    },
    {
      label: 'Pass Rate',
      format: (r) =>
        `${r.successful}/${r.totalSnapshots} (${((r.successful / r.totalSnapshots) * 100).toFixed(0)}%)`,
      delta: runB.successful / runB.totalSnapshots - runA.successful / runA.totalSnapshots,
      higherBetter: true,
    },
    {
      label: 'Avg Latency',
      format: (r) => `${r.avgLatencyMs}ms`,
      delta: runB.avgLatencyMs - runA.avgLatencyMs,
      higherBetter: false,
      suffix: 'ms',
    },
    {
      label: 'Total Cost',
      format: (r) => `$${r.totalCostUsd.toFixed(5)}`,
      delta: runB.totalCostUsd - runA.totalCostUsd,
      higherBetter: false,
    },
  ];

  const improvements = metrics.filter((m) =>
    m.higherBetter ? m.delta > 0.005 : m.delta < -0.5,
  ).length;
  const regressions = metrics.filter((m) =>
    m.higherBetter ? m.delta < -0.005 : m.delta > 0.5,
  ).length;
  const sameDomain = runA.scenarioId === runB.scenarioId;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${ACCENT}40`,
        borderRadius: 10,
        padding: 18,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gi-text-primary)' }}>
            Outcome Comparison
          </span>
          {!sameDomain && (
            <span
              style={{
                fontSize: 10,
                color: '#f59e0b',
                background: '#f59e0b18',
                padding: '1px 6px',
                borderRadius: 4,
                marginLeft: 8,
              }}
            >
              CROSS-SCENARIO
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#475569',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Run A (baseline)', run: runA },
          { label: 'Run B (challenger)', run: runB },
        ].map(({ label, run }) => (
          <div
            key={run.runId}
            style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 12px' }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#4a6070',
                fontWeight: 600,
                textTransform: 'uppercase',
                marginBottom: 4,
              }}
            >
              {label}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gi-text-primary)', fontWeight: 500, marginBottom: 2 }}>
              {run.scenarioName}
            </div>
            <div style={{ fontSize: 10, color: '#475569' }}>{run.runId.slice(0, 22)}…</div>
            <div style={{ fontSize: 10, color: 'var(--gi-text-muted)', marginTop: 2 }}>
              {new Date(run.startedAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {metrics.map((m) => (
          <div
            key={m.label}
            style={{
              display: 'grid',
              gridTemplateColumns: '110px 1fr 1fr 80px',
              gap: 8,
              alignItems: 'center',
              fontSize: 12,
            }}
          >
            <span style={{ color: '#475569', fontSize: 11 }}>{m.label}</span>
            <span style={{ color: '#94a3b8' }}>{m.format(runA)}</span>
            <span style={{ color: 'var(--gi-text-primary)', fontWeight: 500 }}>{m.format(runB)}</span>
            <Delta value={m.delta} higherIsBetter={m.higherBetter} suffix={m.suffix} />
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            background: '#22c55e18',
            borderRadius: 6,
            padding: '8px 0',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>{improvements}</div>
          <div
            style={{
              fontSize: 10,
              color: '#22c55e80',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Improved
          </div>
        </div>
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            background: regressions > 0 ? '#ef444418' : 'rgba(255,255,255,0.03)',
            borderRadius: 6,
            padding: '8px 0',
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: regressions > 0 ? '#ef4444' : '#475569',
            }}
          >
            {regressions}
          </div>
          <div
            style={{
              fontSize: 10,
              color: regressions > 0 ? '#ef444480' : '#475569',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Regressed
          </div>
        </div>
        <div
          style={{
            flex: 1,
            textAlign: 'center',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 6,
            padding: '8px 0',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--gi-text-muted)' }}>
            {metrics.length - improvements - regressions}
          </div>
          <div
            style={{
              fontSize: 10,
              color: '#47556980',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Neutral
          </div>
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
  const color = pct >= 0.9 ? '#22c55e' : pct >= 0.6 ? '#f59e0b' : '#ef4444';
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: compareMode
          ? '20px 1fr 70px 70px 80px 70px'
          : '1fr 70px 70px 80px 70px 80px',
        gap: 8,
        padding: '10px 0',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        fontSize: 12,
        color: '#94a3b8',
        alignItems: 'center',
        background: selectedForCompare ? `${ACCENT}08` : 'transparent',
        borderRadius: selectedForCompare ? 6 : 0,
        cursor: compareMode ? 'pointer' : 'default',
      }}
      onClick={() => compareMode && onToggleCompare(run)}
    >
      {compareMode && (
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: 3,
            border: `2px solid ${selectedForCompare ? ACCENT : '#334155'}`,
            background: selectedForCompare ? ACCENT : 'transparent',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {selectedForCompare && (
            <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>✓</span>
          )}
        </div>
      )}
      <div>
        <div style={{ color: 'var(--gi-text-primary)', fontWeight: 500, fontSize: 11 }}>{run.scenarioName}</div>
        <div style={{ fontSize: 10, color: '#475569' }}>{run.runId.slice(0, 22)}…</div>
      </div>
      <div style={{ color }}>
        {run.successful}/{run.totalSnapshots}
      </div>
      <div>{(run.groundTruthMatchRate * 100).toFixed(0)}%</div>
      <div>{run.avgLatencyMs}ms</div>
      <div>${run.totalCostUsd.toFixed(5)}</div>
      {!compareMode && <div>{new Date(run.startedAt).toLocaleDateString()}</div>}
    </div>
  );
}

export default function ReplayLab() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [runs, setRuns] = useState<ReplayRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [replayingId, setReplayingId] = useState<string | null>(null);
  const [runError, setRunError] = useState<string | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareResult, setCompareResult] = useState<{ runA: ReplayRun; runB: ReplayRun } | null>(
    null,
  );

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [scenariosResp, runsResp] = await Promise.all([
          fetchJson<{ scenarios: Scenario[]; total: number; domains: string[] }>(
            apiUrl('/replay/scenarios'),
          ),
          fetchJson<{ runs: ReplayRun[]; total: number }>(apiUrl('/replay/runs')),
        ]);
        setScenarios(scenariosResp.scenarios);
        setRuns(runsResp.runs);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load replay data');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const domains = ['all', ...Array.from(new Set(scenarios.map((s) => s.domain)))];
  const filtered =
    filterDomain === 'all' ? scenarios : scenarios.filter((s) => s.domain === filterDomain);

  function toggleRunForCompare(run: ReplayRun) {
    setCompareIds((prev) => {
      if (prev.includes(run.runId)) return prev.filter((id) => id !== run.runId);
      if (prev.length >= 2) return [prev[1]!, run.runId];
      return [...prev, run.runId];
    });
    setCompareResult(null);
  }

  function runComparison() {
    const [idA, idB] = compareIds;
    const runA = runs.find((r) => r.runId === idA);
    const runB = runs.find((r) => r.runId === idB);
    if (runA && runB) setCompareResult({ runA, runB });
  }

  function exitCompareMode() {
    setCompareMode(false);
    setCompareIds([]);
    setCompareResult(null);
  }

  async function handleReplay(scenario: Scenario) {
    setReplayingId(scenario.scenarioId);
    setRunError(null);
    try {
      const run = await fetchJson<ReplayRun>(apiUrl('/replay/run'), {
        method: 'POST',
        body: JSON.stringify({ scenarioId: scenario.scenarioId }),
      });
      setRuns((prev) => [run, ...prev]);
      setScenarios((prev) =>
        prev.map((s) =>
          s.scenarioId === scenario.scenarioId
            ? {
                ...s,
                lastReplayed: run.startedAt,
                lastOutcome:
                  run.successful === run.totalSnapshots
                    ? 'pass'
                    : run.failed === run.totalSnapshots
                      ? 'fail'
                      : 'partial',
                groundTruthMatchRate: run.groundTruthMatchRate,
              }
            : s,
        ),
      );
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Replay failed — please try again');
    } finally {
      setReplayingId(null);
    }
  }

  const totalSnapshots = scenarios.reduce((s, x) => s + x.snapshotCount, 0);
  const avgGtMatch =
    runs.length > 0 ? runs.reduce((s, r) => s + r.groundTruthMatchRate, 0) / runs.length : 0;

  return (
    <div
      style={{
        background: 'var(--gi-bg-base)',
        minHeight: '100vh',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={ACCENT} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gi-text-primary)' }}>Replay Lab</span>
            <span
              style={{
                fontSize: 11,
                color: ACCENT,
                background: `${ACCENT}18`,
                padding: '2px 10px',
                borderRadius: 20,
                border: `1px solid ${ACCENT}40`,
                fontWeight: 600,
              }}
            >
              BETA
            </span>
          </div>
          <p style={{ color: 'var(--gi-text-muted)', fontSize: 13, margin: 0 }}>
            Browse captured scenarios from real incidents and flows. Replay them against agents to
            measure decision quality and compare outcomes across runs.
          </p>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
            <div
              style={{
                width: 24,
                height: 24,
                border: `2px solid ${ACCENT}`,
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 12px',
              }}
            />
            Loading replay data…
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              background: '#ef444418',
              border: '1px solid #ef444440',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 20,
              color: '#ef4444',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {!loading && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
                marginBottom: 28,
              }}
            >
              {[
                { label: 'Scenarios', value: scenarios.length, color: ACCENT },
                { label: 'Total Snapshots', value: totalSnapshots, color: 'var(--gi-accent-blue)' },
                { label: 'Replay Runs', value: runs.length, color: '#22c55e' },
                {
                  label: 'Avg GT Match',
                  value: `${(avgGtMatch * 100).toFixed(0)}%`,
                  color: '#f59e0b',
                },
              ].map((m) => (
                <div
                  key={m.label}
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    padding: '14px 18px',
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', marginTop: 2 }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>Scenarios</span>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
                    {domains.map((d) => (
                      <button
                        key={d}
                        onClick={() => setFilterDomain(d)}
                        style={{
                          background: filterDomain === d ? ACCENT : 'rgba(255,255,255,0.05)',
                          color: filterDomain === d ? '#fff' : '#94a3b8',
                          border: 'none',
                          borderRadius: 5,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {filtered.length === 0 && (
                  <p
                    style={{
                      textAlign: 'center',
                      color: '#475569',
                      fontSize: 13,
                      padding: '40px 0',
                    }}
                  >
                    No scenarios found
                  </p>
                )}

                {filtered.map((s) => (
                  <div
                    key={s.scenarioId}
                    onClick={() => setSelected(s)}
                    style={{
                      background:
                        selected?.scenarioId === s.scenarioId
                          ? `${ACCENT}12`
                          : 'rgba(255,255,255,0.03)',
                      border:
                        selected?.scenarioId === s.scenarioId
                          ? `1px solid ${ACCENT}60`
                          : '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10,
                      padding: '16px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: `${DOMAIN_COLORS[s.domain] ?? DOMAIN_COLORS.default}20`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          flexShrink: 0,
                        }}
                      >
                        {DOMAIN_ICONS[s.domain] ?? DOMAIN_ICONS.default}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gi-text-primary)' }}>
                            {s.name}
                          </span>
                          <OutcomeBadge outcome={s.lastOutcome} />
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            color: '#94a3b8',
                            margin: '0 0 8px',
                            lineHeight: 1.5,
                          }}
                        >
                          {s.description}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            flexWrap: 'wrap',
                          }}
                        >
                          <span
                            style={{
                              fontSize: 11,
                              color: DOMAIN_COLORS[s.domain] ?? DOMAIN_COLORS.default,
                              background: `${DOMAIN_COLORS[s.domain] ?? DOMAIN_COLORS.default}15`,
                              padding: '2px 8px',
                              borderRadius: 4,
                            }}
                          >
                            {s.domain.toUpperCase()}
                          </span>
                          <span style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>
                            {s.snapshotCount} snapshot{s.snapshotCount !== 1 ? 's' : ''}
                          </span>
                          {s.groundTruthMatchRate != null && (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                              GT match: {(s.groundTruthMatchRate * 100).toFixed(0)}%
                            </span>
                          )}
                          {s.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              style={{
                                fontSize: 10,
                                color: '#4a6070',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '1px 6px',
                                borderRadius: 3,
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleReplay(s);
                        }}
                        disabled={replayingId === s.scenarioId}
                        style={{
                          background: replayingId === s.scenarioId ? '#334155' : ACCENT,
                          color: '#fff',
                          border: 'none',
                          borderRadius: 6,
                          padding: '6px 14px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: replayingId === s.scenarioId ? 'not-allowed' : 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {replayingId === s.scenarioId ? 'Running…' : '▶ Replay'}
                      </button>
                    </div>
                  </div>
                ))}

                {replayingId && (
                  <div
                    style={{
                      background: `${ACCENT}12`,
                      border: `1px solid ${ACCENT}40`,
                      borderRadius: 10,
                      padding: '14px 18px',
                      marginTop: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        border: `2px solid ${ACCENT}`,
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                    />
                    <span style={{ fontSize: 13, color: ACCENT }}>
                      Replaying scenario against agent...
                    </span>
                  </div>
                )}
              </div>

              <div>
                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    padding: 18,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 14 }}
                  >
                    Scenario Detail
                  </div>
                  {selected ? (
                    <div>
                      <div
                        style={{ fontSize: 14, fontWeight: 600, color: 'var(--gi-text-primary)', marginBottom: 6 }}
                      >
                        {selected.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#4a6070',
                          lineHeight: 1.6,
                          marginBottom: 12,
                        }}
                      >
                        {selected.description}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {[
                          { label: 'Domain', value: selected.domain.toUpperCase() },
                          { label: 'Snapshots', value: selected.snapshotCount },
                          { label: 'Last Outcome', value: selected.lastOutcome ?? 'Not run' },
                          {
                            label: 'GT Match Rate',
                            value:
                              selected.groundTruthMatchRate != null
                                ? `${(selected.groundTruthMatchRate * 100).toFixed(0)}%`
                                : '—',
                          },
                        ].map((row) => (
                          <div
                            key={row.label}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                            }}
                          >
                            <span style={{ color: '#475569' }}>{row.label}</span>
                            <span style={{ color: 'var(--gi-text-primary)', fontWeight: 500 }}>
                              {String(row.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => void handleReplay(selected)}
                          disabled={replayingId === selected.scenarioId}
                          style={{
                            flex: 1,
                            background: ACCENT,
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: '8px 0',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          ▶ Replay Now
                        </button>
                      </div>
                      {runError && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: '6px 10px',
                            background: 'rgba(239,68,68,0.12)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 6,
                            fontSize: 11,
                            color: '#fca5a5',
                          }}
                        >
                          {runError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p
                      style={{
                        fontSize: 12,
                        color: '#475569',
                        textAlign: 'center',
                        padding: '20px 0',
                      }}
                    >
                      Select a scenario to view details
                    </p>
                  )}
                </div>

                <div
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    padding: 18,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                      Recent Runs
                    </div>
                    {!compareMode ? (
                      <button
                        onClick={() => {
                          setCompareMode(true);
                          setCompareIds([]);
                          setCompareResult(null);
                        }}
                        style={{
                          fontSize: 11,
                          color: ACCENT,
                          background: `${ACCENT}15`,
                          border: 'none',
                          borderRadius: 4,
                          padding: '3px 10px',
                          cursor: 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        Compare
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {compareIds.length === 2 && (
                          <button
                            onClick={runComparison}
                            style={{
                              fontSize: 11,
                              color: '#fff',
                              background: ACCENT,
                              border: 'none',
                              borderRadius: 4,
                              padding: '3px 10px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Compare ({compareIds.length})
                          </button>
                        )}
                        <button
                          onClick={exitCompareMode}
                          style={{
                            fontSize: 11,
                            color: '#475569',
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            borderRadius: 4,
                            padding: '3px 10px',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {compareResult && (
                    <CompareOutcomePanel
                      runA={compareResult.runA}
                      runB={compareResult.runB}
                      onClose={() => setCompareResult(null)}
                    />
                  )}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: compareMode
                        ? '20px 1fr 70px 70px 80px 70px'
                        : '1fr 70px 70px 80px 70px 80px',
                      gap: 8,
                      padding: '6px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.08)',
                      marginBottom: 4,
                    }}
                  >
                    {compareMode && <div />}
                    {['Scenario', 'Pass', 'GT%', 'Latency', 'Cost', compareMode ? '' : 'Date'].map(
                      (h) => (
                        <div
                          key={h}
                          style={{
                            fontSize: 10,
                            color: '#475569',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                          }}
                        >
                          {h}
                        </div>
                      ),
                    )}
                  </div>

                  {runs.slice(0, 15).map((run) => (
                    <ReplayRunRow
                      key={run.runId}
                      run={run}
                      compareMode={compareMode}
                      selectedForCompare={compareIds.includes(run.runId)}
                      onToggleCompare={toggleRunForCompare}
                    />
                  ))}

                  {runs.length === 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        color: '#475569',
                        textAlign: 'center',
                        padding: '20px 0',
                      }}
                    >
                      No runs yet — replay a scenario
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
