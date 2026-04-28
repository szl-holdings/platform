import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import { useEffect, useState } from 'react';
import { ACCENT, apiUrl, fetchJson } from './cognitive/shared';

interface EvalSuiteConfig {
  suiteId: string;
  name: string;
  domain: string;
  caseCount: number;
  redTeamCount: number;
  evalType: string;
  version: number;
  tags: string[];
  description: string;
  graderTypes: string[];
}

interface EvalRunSummary {
  runId: string;
  suiteId: string;
  suiteName: string;
  domain: string;
  passRate: number;
  avgScore: number;
  totalCases: number;
  passed: number;
  failed: number;
  hasRegression: boolean;
  regressionSeverity: 'none' | 'minor' | 'major' | 'critical';
  regressionNotes: string[];
  improvementNotes: string[];
  runAt: string;
  triggeredBy: string;
  avgLatencyMs: number;
  totalCostUsd: number;
}

interface EvalsApiResponse {
  suites: EvalSuiteConfig[];
  recentRuns: EvalRunSummary[];
  domains: string[];
  evalTypes: string[];
  totalSuites: number;
  totalRuns: number;
}

function RegressionBadge({ severity }: { severity: EvalRunSummary['regressionSeverity'] }) {
  const map: Record<string, { color: string; label: string }> = {
    none: { color: '#22c55e', label: '✓ No regression' },
    minor: { color: '#f59e0b', label: '⚠ Minor regression' },
    major: { color: '#f97316', label: '▲ Major regression' },
    critical: { color: '#ef4444', label: '✕ Critical regression' },
  };
  const { color, label } = map[severity] ?? map.none!;
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color,
        background: `${color}18`,
        padding: '2px 8px',
        borderRadius: 4,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  );
}

export default function EvalLab() {
  const [activeTab, setActiveTab] = useState<'suites' | 'results'>('suites');
  const [suites, setSuites] = useState<EvalSuiteConfig[]>([]);
  const [runs, setRuns] = useState<EvalRunSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSuite, setSelectedSuite] = useState<EvalSuiteConfig | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchJson<EvalsApiResponse>(apiUrl('/evals'));
        setSuites(data.suites);
        setRuns(data.recentRuns);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load eval data');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function handleRunEval(suite: EvalSuiteConfig) {
    setRunningId(suite.suiteId);
    try {
      const result = await fetchJson<{
        runId: string;
        suiteId: string;
        suiteName: string;
        domain: string;
        passRate: number;
        avgScore: number;
        totalCases: number;
        passed: number;
        failed: number;
        hasRegression: boolean;
        regressionSeverity: 'none' | 'minor' | 'major' | 'critical';
        regressionNotes: string[];
        improvementNotes: string[];
        runAt: string;
      }>(apiUrl('/evals/run'), {
        method: 'POST',
        body: JSON.stringify({ suiteId: suite.suiteId, triggeredBy: 'eval-lab' }),
      });
      const newRun: EvalRunSummary = {
        ...result,
        triggeredBy: 'eval-lab',
        avgLatencyMs: 0,
        totalCostUsd: 0,
      };
      setRuns((prev) => [newRun, ...prev]);
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run eval');
    } finally {
      setRunningId(null);
    }
  }

  const totalCases = suites.reduce((s, x) => s + x.caseCount, 0);
  const totalRedTeam = suites.reduce((s, x) => s + x.redTeamCount, 0);
  const avgPassRate = runs.length > 0 ? runs.reduce((s, r) => s + r.passRate, 0) / runs.length : 0;
  const suitesWithRegression = runs.filter((r) => r.hasRegression).length;
  const strategiesCompared = new Set(runs.map((r) => r.triggeredBy)).size;

  const tabs = [
    { id: 'suites' as const, label: 'Eval Suites' },
    { id: 'results' as const, label: `Results (${runs.length})` },
  ];

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
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gi-text-primary)' }}>Eval Lab</span>
            <span
              style={{
                fontSize: 11,
                color: '#4d8fcc',
                background: '#4d8fcc20',
                padding: '2px 10px',
                borderRadius: 20,
                border: '1px solid #4d8fcc40',
                fontWeight: 600,
              }}
            >
              BETA
            </span>
          </div>
          <p style={{ color: 'var(--gi-text-muted)', fontSize: 13, margin: 0 }}>
            Run evaluations across strategies, models, and orchestration configs. Track precision,
            recall, usefulness, policy compliance, override rates, and regressions over time.
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
            Loading eval data…
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
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 12,
                marginBottom: 28,
              }}
            >
              {[
                { label: 'Total Eval Cases', value: totalCases, color: ACCENT },
                { label: 'Red-Team Cases', value: totalRedTeam, color: '#ef4444' },
                {
                  label: 'Avg Pass Rate',
                  value: `${(avgPassRate * 100).toFixed(1)}%`,
                  color: '#22c55e',
                },
                { label: 'Suites w/ Regression', value: suitesWithRegression, color: '#f59e0b' },
                { label: 'Run Sources', value: strategiesCompared, color: 'var(--gi-accent-blue)' },
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

            <div
              style={{
                display: 'flex',
                gap: 4,
                marginBottom: 20,
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 8,
                padding: 4,
                width: 'fit-content',
              }}
            >
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    background: activeTab === t.id ? ACCENT : 'transparent',
                    color: activeTab === t.id ? '#fff' : '#4a6070',
                    border: 'none',
                    borderRadius: 6,
                    padding: '7px 18px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === 'suites' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
                <div>
                  {suites.length === 0 && (
                    <p
                      style={{
                        textAlign: 'center',
                        color: '#475569',
                        fontSize: 13,
                        padding: '40px 0',
                      }}
                    >
                      No eval suites registered
                    </p>
                  )}
                  {suites.map((suite) => (
                    <div
                      key={suite.suiteId}
                      onClick={() => setSelectedSuite(suite)}
                      style={{
                        background:
                          selectedSuite?.suiteId === suite.suiteId
                            ? `${ACCENT}10`
                            : 'rgba(255,255,255,0.03)',
                        border:
                          selectedSuite?.suiteId === suite.suiteId
                            ? `1px solid ${ACCENT}50`
                            : '1px solid rgba(255,255,255,0.07)',
                        borderRadius: 10,
                        padding: '16px 18px',
                        marginBottom: 10,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#e2e8f0',
                              marginBottom: 4,
                            }}
                          >
                            {suite.name}
                          </div>
                          <p
                            style={{
                              fontSize: 12,
                              color: '#4a6070',
                              margin: '0 0 10px',
                              lineHeight: 1.5,
                            }}
                          >
                            {suite.description}
                          </p>
                          <div
                            style={{
                              display: 'flex',
                              gap: 10,
                              flexWrap: 'wrap',
                              fontSize: 11,
                              color: '#94a3b8',
                            }}
                          >
                            <span>{suite.caseCount} cases</span>
                            {suite.redTeamCount > 0 && (
                              <span style={{ color: '#ef4444' }}>
                                ⚔ {suite.redTeamCount} red-team
                              </span>
                            )}
                            <span style={{ color: '#8b7ac8' }}>{suite.evalType}</span>
                            {suite.graderTypes.slice(0, 2).map((g) => (
                              <span key={g} style={{ color: '#475569' }}>
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            color: '#4d8fcc',
                            background: '#4d8fcc15',
                            padding: '2px 8px',
                            borderRadius: 4,
                            marginLeft: 12,
                            flexShrink: 0,
                          }}
                        >
                          {suite.domain.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <div
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 10,
                      padding: 18,
                    }}
                  >
                    <div
                      style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 14 }}
                    >
                      Run Evaluation
                    </div>
                    {selectedSuite ? (
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#e2e8f0',
                            marginBottom: 6,
                          }}
                        >
                          {selectedSuite.name}
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            color: '#4a6070',
                            lineHeight: 1.5,
                            marginBottom: 14,
                          }}
                        >
                          {selectedSuite.description}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            marginBottom: 14,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                            }}
                          >
                            <span style={{ color: '#475569' }}>Cases</span>
                            <span style={{ color: 'var(--gi-text-primary)' }}>{selectedSuite.caseCount}</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                            }}
                          >
                            <span style={{ color: '#475569' }}>Red-team</span>
                            <span style={{ color: '#ef4444' }}>{selectedSuite.redTeamCount}</span>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 12,
                            }}
                          >
                            <span style={{ color: '#475569' }}>Type</span>
                            <span style={{ color: 'var(--gi-text-primary)' }}>{selectedSuite.evalType}</span>
                          </div>
                        </div>
                        <button
                          disabled={!!runningId}
                          onClick={() => void handleRunEval(selectedSuite)}
                          style={{
                            width: '100%',
                            background:
                              runningId === selectedSuite.suiteId ? `${ACCENT}40` : ACCENT,
                            border: 'none',
                            borderRadius: 7,
                            padding: '10px 14px',
                            color: '#fff',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: runningId ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          {runningId === selectedSuite.suiteId ? (
                            <>
                              <div
                                style={{
                                  width: 12,
                                  height: 12,
                                  border: '2px solid #fff8',
                                  borderTop: '2px solid #fff',
                                  borderRadius: '50%',
                                  animation: 'spin 0.8s linear infinite',
                                }}
                              />
                              Running…
                            </>
                          ) : (
                            '▶ Run Suite'
                          )}
                        </button>
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
                        Select an eval suite to run
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'results' && (
              <div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.8fr 80px 80px 80px 100px 120px',
                    gap: 8,
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    marginBottom: 6,
                  }}
                >
                  {['Suite', 'Pass%', 'Score', 'Cases', 'Latency', 'Status'].map((h) => (
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
                  ))}
                </div>
                {runs.map((r) => (
                  <div
                    key={r.runId}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.8fr 80px 80px 80px 100px 120px',
                      gap: 8,
                      padding: '12px 12px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--gi-text-primary)' }}>
                        {r.suiteName ?? r.suiteId}
                      </div>
                      <div style={{ fontSize: 11, color: '#475569' }}>
                        {r.domain ?? '—'} · {new Date(r.runAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color:
                          r.passRate >= 0.85
                            ? '#22c55e'
                            : r.passRate >= 0.7
                              ? '#f59e0b'
                              : '#ef4444',
                        fontWeight: 600,
                      }}
                    >
                      {(r.passRate * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {(r.avgScore * 100).toFixed(1)}%
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {r.passed}/{r.totalCases}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {r.avgLatencyMs > 0 ? `${r.avgLatencyMs.toFixed(0)}ms` : '—'}
                    </div>
                    <RegressionBadge severity={r.regressionSeverity ?? 'none'} />
                  </div>
                ))}
                {runs.length === 0 && (
                  <p
                    style={{
                      textAlign: 'center',
                      color: '#475569',
                      fontSize: 13,
                      padding: '40px 0',
                    }}
                  >
                    No eval results yet — run an evaluation suite
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
