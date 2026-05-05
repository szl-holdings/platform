import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { ACCENT, apiUrl, BASE_URL, fetchJson } from '../cognitive/shared';

function getCsrfToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.split(';').find((c) => c.trim().startsWith('csrf_token='));
  return match ? decodeURIComponent(match.trim().split('=').slice(1).join('=')) : undefined;
}

const EVAL_TYPES = [
  'prompt-eval',
  'model-routing',
  'verifier',
  'tool-reliability',
  'citation-fidelity',
  'memory-retrieval',
  'planning-quality',
  'reflection-quality',
  'autonomy-safety',
  'end-to-end-scenario',
] as const;
type EvalType = (typeof EVAL_TYPES)[number];

const EVAL_TYPE_LABEL: Record<string, string> = {
  'prompt-eval': 'Prompt Eval',
  'model-routing': 'Model Routing',
  verifier: 'Verifier',
  'tool-reliability': 'Tool Reliability',
  'citation-fidelity': 'Citation Fidelity',
  'memory-retrieval': 'Memory Retrieval',
  'planning-quality': 'Planning Quality',
  'reflection-quality': 'Reflection Quality',
  'autonomy-safety': 'Autonomy Safety',
  'end-to-end-scenario': 'End-to-End Scenario',
};

interface EvalSuite {
  suiteId: string;
  name: string;
  description?: string;
  domain: string;
  evalType: string;
  version: number;
  tags: string[];
  caseCount: number;
  redTeamCount: number;
  graderTypes: string[];
}

interface EvalRunSummary {
  runId: string;
  suiteId: string;
  suiteName?: string;
  domain?: string;
  passRate: number;
  avgScore: number;
  totalCases: number;
  passed: number;
  failed: number;
  hasRegression?: boolean;
  regressionSeverity?: 'none' | 'minor' | 'major' | 'critical';
  regressionNotes?: string[];
  improvementNotes?: string[];
  runAt: string;
  triggeredBy: string;
  avgLatencyMs?: number;
  totalCostUsd?: number;
}

interface EvalsApiResponse {
  suites: EvalSuite[];
  recentRuns: EvalRunSummary[];
  domains: string[];
  evalTypes: string[];
  totalSuites: number;
  totalRuns: number;
}

interface EvalCaseResult {
  caseId: string;
  domain: string;
  label: string;
  evalType?: string;
  graderType: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  groundTruth: Record<string, unknown>;
  passed: boolean;
  score: number;
  expectedOutcome: 'pass' | 'fail';
  latencyMs: number;
  tokensUsed: number;
  costUsd: number;
  model?: string;
  traceId?: string;
  failureReason?: string;
  graderDetails?: Record<string, unknown>;
  tags?: string[];
}

interface EvalForgeMetrics {
  correctness: {
    passRate: number;
    avgScore: number;
    passed: number;
    failed: number;
    total: number;
  };
  evidenceQuality: {
    citationCoverage: number;
    citationAccuracy: number;
    sourceVerified: number;
    totalCitations: number;
    score: number;
  };
  confidenceCalibration: {
    avgConfidence: number;
    calibrationError: number;
    overconfidenceRate: number;
    underconfidenceRate: number;
    brierScore: number;
    score: number;
  };
  latency: {
    avgLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    maxLatencyMs: number;
  };
  cost: {
    totalCostUsd: number;
    avgCostUsd: number;
    costPerOutcome: number;
    totalTokensUsed: number;
    avgTokensUsed: number;
    p95CostUsd: number;
  };
  interventionValue: {
    interventions: number;
    totalDecisions: number;
    interventionRate: number;
    avgImprovementFromIntervention: number;
    estimatedValueSaved: number;
  };
  humanOverrideRate: {
    overrides: number;
    totalDecisions: number;
    overrideRate: number;
    acceptedRate: number;
    overrideReasons: Record<string, number>;
  };
  rollbackRate: {
    rollbacks: number;
    totalActions: number;
    rollbackRate: number;
    rollbackReasons: Record<string, number>;
    avgRollbackLatencyMs: number;
  };
  policyViolations: {
    totalChecks: number;
    violations: number;
    violationRate: number;
    criticalViolations: number;
    violationsByType: Record<string, number>;
    complianceRate: number;
  };
}

interface EvalRunReport extends EvalRunSummary {
  evalType?: string;
  metrics: EvalForgeMetrics;
  totalTokensUsed: number;
  caseResults: EvalCaseResult[];
  baselineRunId?: string;
}

const REGRESSION_STYLES: Record<string, { color: string; label: string }> = {
  none: { color: '#22c55e', label: 'No regression' },
  minor: { color: '#f59e0b', label: 'Minor regression' },
  major: { color: '#f97316', label: 'Major regression' },
  critical: { color: '#ef4444', label: 'Critical regression' },
};

function RegressionBadge({
  severity,
  hasRegression,
}: {
  severity?: string;
  hasRegression?: boolean;
}) {
  const key = hasRegression ? (severity ?? 'minor') : 'none';
  const { color, label } = REGRESSION_STYLES[key] ?? REGRESSION_STYLES.none!;
  const symbol = key === 'none' ? '✓' : key === 'minor' ? '⚠' : key === 'major' ? '▲' : '✕';
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
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        whiteSpace: 'nowrap',
      }}
    >
      <span>{symbol}</span>
      <span>{label}</span>
    </span>
  );
}

function passRateColor(rate: number) {
  if (rate >= 0.85) return '#22c55e';
  if (rate >= 0.7) return '#f59e0b';
  return '#ef4444';
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 10,
};

function buildRoute(path: string) {
  const base = BASE_URL.replace(/\/$/, '');
  return `${base}${path}`;
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function EvalForgeDashboard() {
  const [, navigate] = useLocation();
  const [data, setData] = useState<EvalsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningSuiteId, setRunningSuiteId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<EvalType | 'all'>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchJson<EvalsApiResponse>(apiUrl('/evals'));
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load eval data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRun = useCallback(
    async (suite: EvalSuite) => {
      setRunningSuiteId(suite.suiteId);
      try {
        const csrfToken = getCsrfToken();
        const result = await fetchJson<
          EvalRunSummary & { regressionSeverity?: EvalRunSummary['regressionSeverity'] }
        >(apiUrl('/evals/run'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
          },
          body: JSON.stringify({ suiteId: suite.suiteId, triggeredBy: 'eval-forge-ui' }),
        });
        setData((prev) =>
          prev
            ? {
                ...prev,
                recentRuns: [
                  {
                    ...result,
                    triggeredBy: result.triggeredBy ?? 'eval-forge-ui',
                  },
                  ...prev.recentRuns,
                ].slice(0, 100),
              }
            : prev,
        );
        navigate(`/eval-forge/runs/${result.runId}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to trigger eval run');
      } finally {
        setRunningSuiteId(null);
      }
    },
    [navigate],
  );

  const suites = data?.suites ?? [];
  const runs = data?.recentRuns ?? [];

  const visibleSuites = useMemo(() => {
    return suites.filter((s) => {
      if (typeFilter !== 'all' && s.evalType !== typeFilter) return false;
      if (domainFilter !== 'all' && s.domain !== domainFilter) return false;
      return true;
    });
  }, [suites, typeFilter, domainFilter]);

  const suitesByType = useMemo(() => {
    const out: Record<string, EvalSuite[]> = {};
    for (const t of EVAL_TYPES) out[t] = [];
    for (const s of visibleSuites) {
      const k = (s.evalType ?? 'prompt-eval') as string;
      if (!out[k]) out[k] = [];
      out[k]?.push(s);
    }
    return out;
  }, [visibleSuites]);

  const totalCases = suites.reduce((sum, s) => sum + s.caseCount, 0);
  const totalRedTeam = suites.reduce((sum, s) => sum + s.redTeamCount, 0);
  const avgPassRate =
    runs.length > 0 ? runs.reduce((sum, r) => sum + (r.passRate ?? 0), 0) / runs.length : 0;
  const regressionCount = runs.filter((r) => r.hasRegression).length;
  const domains = data?.domains ?? [];

  return (
    <div
      style={{
        background: 'var(--gi-bg-base)',
        minHeight: '100vh',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700 }}>Eval Forge Console</span>
            <span
              style={{
                fontSize: 11,
                color: ACCENT,
                background: `${ACCENT}20`,
                padding: '2px 10px',
                borderRadius: 20,
                border: `1px solid ${ACCENT}40`,
                fontWeight: 600,
              }}
            >
              {data ? `${data.totalSuites} suites · ${data.totalRuns} runs` : 'loading'}
            </span>
            <button
              onClick={() => void load()}
              style={{
                marginLeft: 'auto',
                background: 'transparent',
                color: '#94a3b8',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              ↻ Refresh
            </button>
          </div>
          <p style={{ color: 'var(--gi-text-muted)', fontSize: 13, margin: 0 }}>
            Browse Eval Forge suites by type, trigger runs, and track regressions across all nine
            metric categories.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: '#ef444418',
              border: '1px solid #ef444440',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 20,
              color: '#fca5a5',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            { label: 'Eval Suites', value: suites.length, color: ACCENT },
            { label: 'Total Cases', value: totalCases, color: 'var(--gi-accent-blue)' },
            { label: 'Red-Team Cases', value: totalRedTeam, color: '#ef4444' },
            {
              label: 'Avg Pass Rate',
              value: runs.length ? `${(avgPassRate * 100).toFixed(1)}%` : '—',
              color: '#22c55e',
            },
            { label: 'Regressions', value: regressionCount, color: '#f59e0b' },
          ].map((m) => (
            <div key={m.label} style={{ ...cardStyle, padding: '14px 18px' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', marginTop: 2 }}>{m.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
              <FilterPill
                active={typeFilter === 'all'}
                onClick={() => setTypeFilter('all')}
                label="All Types"
              />
              {EVAL_TYPES.map((t) => (
                <FilterPill
                  key={t}
                  active={typeFilter === t}
                  onClick={() => setTypeFilter(t)}
                  label={EVAL_TYPE_LABEL[t]!}
                  count={suitesByType[t]?.length ?? 0}
                />
              ))}
            </div>

            {domains.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
                <FilterPill
                  active={domainFilter === 'all'}
                  onClick={() => setDomainFilter('all')}
                  label="All Domains"
                  subtle
                />
                {domains.map((d) => (
                  <FilterPill
                    key={d}
                    active={domainFilter === d}
                    onClick={() => setDomainFilter(d)}
                    label={d.toUpperCase()}
                    subtle
                  />
                ))}
              </div>
            )}

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
                Loading suites…
              </div>
            )}

            {!loading && visibleSuites.length === 0 && (
              <div
                style={{
                  ...cardStyle,
                  padding: 32,
                  textAlign: 'center',
                  color: '#4a6070',
                  fontSize: 13,
                }}
              >
                No suites match the current filters.
              </div>
            )}

            {!loading &&
              EVAL_TYPES.map((type) => {
                const ofType = suitesByType[type] ?? [];
                if (ofType.length === 0) return null;
                return (
                  <div key={type} style={{ marginBottom: 28 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gi-text-primary)' }}>
                        {EVAL_TYPE_LABEL[type]}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>
                        {ofType.length} suite{ofType.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {ofType.map((suite) => {
                        const lastRun = runs.find((r) => r.suiteId === suite.suiteId);
                        return (
                          <div key={suite.suiteId} style={{ ...cardStyle, padding: '14px 16px' }}>
                            <div
                              style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 4,
                                  }}
                                >
                                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gi-text-primary)' }}>
                                    {suite.name}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: '#4d8fcc',
                                      background: '#4d8fcc15',
                                      padding: '2px 8px',
                                      borderRadius: 4,
                                    }}
                                  >
                                    {suite.domain.toUpperCase()}
                                  </span>
                                  <span style={{ fontSize: 10, color: 'var(--gi-text-muted)' }}>
                                    v{suite.version}
                                  </span>
                                </div>
                                <p
                                  style={{
                                    fontSize: 12,
                                    color: '#94a3b8',
                                    margin: '0 0 8px',
                                    lineHeight: 1.5,
                                  }}
                                >
                                  {suite.description ?? 'No description'}
                                </p>
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: 12,
                                    fontSize: 11,
                                    color: '#4a6070',
                                    flexWrap: 'wrap',
                                  }}
                                >
                                  <span>{suite.caseCount} cases</span>
                                  {suite.redTeamCount > 0 && (
                                    <span style={{ color: '#ef4444' }}>
                                      ⚔ {suite.redTeamCount} red-team
                                    </span>
                                  )}
                                  {suite.graderTypes.slice(0, 3).map((g) => (
                                    <span key={g}>{g}</span>
                                  ))}
                                  {lastRun && (
                                    <>
                                      <span>·</span>
                                      <span style={{ color: passRateColor(lastRun.passRate) }}>
                                        Last run: {(lastRun.passRate * 100).toFixed(0)}% pass
                                      </span>
                                      {lastRun.hasRegression && (
                                        <RegressionBadge
                                          hasRegression
                                          severity={lastRun.regressionSeverity}
                                        />
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 6,
                                  flexShrink: 0,
                                }}
                              >
                                <button
                                  disabled={!!runningSuiteId}
                                  onClick={() => void handleRun(suite)}
                                  style={{
                                    background:
                                      runningSuiteId === suite.suiteId ? `${ACCENT}40` : ACCENT,
                                    border: 'none',
                                    borderRadius: 6,
                                    padding: '8px 14px',
                                    color: '#fff',
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: runningSuiteId ? 'not-allowed' : 'pointer',
                                    minWidth: 110,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                  }}
                                >
                                  {runningSuiteId === suite.suiteId ? (
                                    <>
                                      <div
                                        style={{
                                          width: 10,
                                          height: 10,
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
                                {lastRun && (
                                  <button
                                    onClick={() => navigate(`/eval-forge/runs/${lastRun.runId}`)}
                                    style={{
                                      background: 'transparent',
                                      border: '1px solid rgba(255,255,255,0.1)',
                                      borderRadius: 6,
                                      padding: '6px 14px',
                                      color: '#94a3b8',
                                      fontSize: 11,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    View last run
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>

          <div>
            <div style={{ ...cardStyle, padding: 16 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gi-text-primary)' }}>Recent Runs</span>
                <span style={{ fontSize: 11, color: 'var(--gi-text-muted)' }}>{runs.length}</span>
              </div>

              {runs.length === 0 && (
                <p
                  style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '20px 0' }}
                >
                  No runs yet — trigger a suite to populate the timeline.
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  maxHeight: 700,
                  overflowY: 'auto',
                }}
              >
                {runs.slice(0, 30).map((r) => (
                  <button
                    key={r.runId}
                    onClick={() => navigate(`/eval-forge/runs/${r.runId}`)}
                    style={{
                      textAlign: 'left',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      color: '#e2e8f0',
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600 }}>
                        {r.suiteName ?? r.suiteId}
                      </span>
                      <span
                        style={{ fontSize: 12, fontWeight: 700, color: passRateColor(r.passRate) }}
                      >
                        {(r.passRate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 10,
                        color: '#4a6070',
                      }}
                    >
                      <span>{new Date(r.runAt).toLocaleString()}</span>
                      <span>
                        {r.passed}/{r.totalCases}
                      </span>
                    </div>
                    {r.hasRegression && (
                      <div style={{ marginTop: 6 }}>
                        <RegressionBadge hasRegression severity={r.regressionSeverity} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  subtle,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
  subtle?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? ACCENT : subtle ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
        color: active ? '#fff' : '#94a3b8',
        border: active ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.07)',
        borderRadius: 999,
        padding: '5px 12px',
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span>{label}</span>
      {typeof count === 'number' && <span style={{ fontSize: 10, opacity: 0.7 }}>{count}</span>}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Run Detail
// ---------------------------------------------------------------------------

function MetricCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ ...cardStyle, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gi-text-primary)', marginBottom: 10 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </div>
  );
}

function MetricRow({
  label,
  value,
  color,
}: {
  label: string;
  value: React.ReactNode;
  color?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: 12,
      }}
    >
      <span style={{ color: 'var(--gi-text-muted)' }}>{label}</span>
      <span style={{ color: color ?? 'var(--gi-text-primary)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function fmtPct(n: number, digits = 1) {
  if (!Number.isFinite(n)) return '—';
  return `${(n * 100).toFixed(digits)}%`;
}

function fmtNum(n: number, digits = 0) {
  if (!Number.isFinite(n)) return '—';
  return n.toFixed(digits);
}

function fmtMs(n: number) {
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `${Math.round(n)}ms`;
}

function fmtUsd(n: number) {
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return '$0.00';
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function EvalForgeRunDetail({ runId }: { runId: string }) {
  const [, navigate] = useLocation();
  const [report, setReport] = useState<EvalRunReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyFailed, setShowOnlyFailed] = useState(false);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetchJson<EvalRunReport>(
          apiUrl(`/evals/runs/${encodeURIComponent(runId)}`),
        );
        if (!cancelled) {
          setReport(res);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load run');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [runId]);

  const visibleCases = useMemo(() => {
    if (!report) return [] as EvalCaseResult[];
    return showOnlyFailed ? report.caseResults.filter((c) => !c.passed) : report.caseResults;
  }, [report, showOnlyFailed]);

  return (
    <div
      style={{
        background: 'var(--gi-bg-base)',
        minHeight: '100vh',
        color: '#e2e8f0',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 20px' }}>
        <button
          onClick={() => navigate('/eval-forge')}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6,
            padding: '6px 12px',
            color: '#94a3b8',
            fontSize: 12,
            cursor: 'pointer',
            marginBottom: 16,
          }}
        >
          ← Back to Eval Forge
        </button>

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
            Loading run report…
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              background: '#ef444418',
              border: '1px solid #ef444440',
              borderRadius: 8,
              padding: '12px 16px',
              color: '#fca5a5',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {!loading && report && (
          <>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 700 }}>
                  {report.suiteName ?? report.suiteId}
                </span>
                <RegressionBadge
                  hasRegression={report.hasRegression}
                  severity={report.regressionSeverity}
                />
                {report.evalType && (
                  <span
                    style={{
                      fontSize: 11,
                      color: '#94a3b8',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {EVAL_TYPE_LABEL[report.evalType] ?? report.evalType}
                  </span>
                )}
                {report.domain && (
                  <span
                    style={{
                      fontSize: 11,
                      color: '#4d8fcc',
                      background: '#4d8fcc15',
                      padding: '2px 8px',
                      borderRadius: 4,
                    }}
                  >
                    {report.domain.toUpperCase()}
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  fontSize: 12,
                  color: '#4a6070',
                  flexWrap: 'wrap',
                }}
              >
                <span>
                  Run ID: <code style={{ color: '#94a3b8' }}>{report.runId}</code>
                </span>
                <span>Triggered by: {report.triggeredBy}</span>
                <span>{new Date(report.runAt).toLocaleString()}</span>
                {report.baselineRunId && (
                  <button
                    onClick={() => navigate(`/eval-forge/runs/${report.baselineRunId}`)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: ACCENT,
                      cursor: 'pointer',
                      fontSize: 12,
                      padding: 0,
                    }}
                  >
                    ← Baseline
                  </button>
                )}
              </div>
            </div>

            {report.regressionNotes?.length || report.improvementNotes?.length ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {report.regressionNotes && report.regressionNotes.length > 0 && (
                  <div
                    style={{
                      background: '#ef444412',
                      border: '1px solid #ef444430',
                      borderRadius: 8,
                      padding: '12px 14px',
                    }}
                  >
                    <div
                      style={{ fontSize: 12, fontWeight: 600, color: '#fca5a5', marginBottom: 6 }}
                    >
                      Regressions vs baseline
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#fca5a5', fontSize: 12 }}>
                      {report.regressionNotes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.improvementNotes && report.improvementNotes.length > 0 && (
                  <div
                    style={{
                      background: '#22c55e12',
                      border: '1px solid #22c55e30',
                      borderRadius: 8,
                      padding: '12px 14px',
                    }}
                  >
                    <div
                      style={{ fontSize: 12, fontWeight: 600, color: '#86efac', marginBottom: 6 }}
                    >
                      Improvements vs baseline
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, color: '#86efac', fontSize: 12 }}>
                      {report.improvementNotes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <div style={{ ...cardStyle, padding: '14px 18px' }}>
                <div
                  style={{ fontSize: 22, fontWeight: 700, color: passRateColor(report.passRate) }}
                >
                  {fmtPct(report.passRate)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', marginTop: 2 }}>Pass Rate</div>
              </div>
              <div style={{ ...cardStyle, padding: '14px 18px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gi-text-primary)' }}>
                  {fmtPct(report.avgScore)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', marginTop: 2 }}>Avg Score</div>
              </div>
              <div style={{ ...cardStyle, padding: '14px 18px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gi-text-primary)' }}>
                  {report.passed}/{report.totalCases}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', marginTop: 2 }}>Cases Passed</div>
              </div>
              <div style={{ ...cardStyle, padding: '14px 18px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gi-text-primary)' }}>
                  {fmtMs(report.avgLatencyMs ?? 0)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', marginTop: 2 }}>Avg Latency</div>
              </div>
              <div style={{ ...cardStyle, padding: '14px 18px' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gi-text-primary)' }}>
                  {fmtUsd(report.totalCostUsd ?? 0)}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', marginTop: 2 }}>Total Cost</div>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gi-text-primary)', marginBottom: 12 }}>
                Metric Categories
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 12,
                }}
              >
                <MetricCard title="Correctness">
                  <MetricRow
                    label="Pass rate"
                    value={fmtPct(report.metrics.correctness.passRate)}
                    color={passRateColor(report.metrics.correctness.passRate)}
                  />
                  <MetricRow
                    label="Avg score"
                    value={fmtPct(report.metrics.correctness.avgScore)}
                  />
                  <MetricRow
                    label="Passed / total"
                    value={`${report.metrics.correctness.passed} / ${report.metrics.correctness.total}`}
                  />
                  <MetricRow
                    label="Failed"
                    value={report.metrics.correctness.failed}
                    color={report.metrics.correctness.failed > 0 ? '#ef4444' : undefined}
                  />
                </MetricCard>

                <MetricCard title="Evidence Quality">
                  <MetricRow label="Score" value={fmtPct(report.metrics.evidenceQuality.score)} />
                  <MetricRow
                    label="Citation coverage"
                    value={fmtPct(report.metrics.evidenceQuality.citationCoverage)}
                  />
                  <MetricRow
                    label="Citation accuracy"
                    value={fmtPct(report.metrics.evidenceQuality.citationAccuracy)}
                  />
                  <MetricRow
                    label="Sources verified"
                    value={`${report.metrics.evidenceQuality.sourceVerified} / ${report.metrics.evidenceQuality.totalCitations}`}
                  />
                </MetricCard>

                <MetricCard title="Confidence Calibration">
                  <MetricRow
                    label="Score"
                    value={fmtPct(report.metrics.confidenceCalibration.score)}
                  />
                  <MetricRow
                    label="Avg confidence"
                    value={fmtPct(report.metrics.confidenceCalibration.avgConfidence)}
                  />
                  <MetricRow
                    label="Calibration error"
                    value={fmtPct(report.metrics.confidenceCalibration.calibrationError)}
                  />
                  <MetricRow
                    label="Brier score"
                    value={fmtNum(report.metrics.confidenceCalibration.brierScore, 3)}
                  />
                  <MetricRow
                    label="Overconfidence"
                    value={fmtPct(report.metrics.confidenceCalibration.overconfidenceRate)}
                  />
                  <MetricRow
                    label="Underconfidence"
                    value={fmtPct(report.metrics.confidenceCalibration.underconfidenceRate)}
                  />
                </MetricCard>

                <MetricCard title="Latency">
                  <MetricRow label="Avg" value={fmtMs(report.metrics.latency.avgLatencyMs)} />
                  <MetricRow label="p50" value={fmtMs(report.metrics.latency.p50LatencyMs)} />
                  <MetricRow label="p95" value={fmtMs(report.metrics.latency.p95LatencyMs)} />
                  <MetricRow label="p99" value={fmtMs(report.metrics.latency.p99LatencyMs)} />
                  <MetricRow label="Max" value={fmtMs(report.metrics.latency.maxLatencyMs)} />
                </MetricCard>

                <MetricCard title="Cost">
                  <MetricRow label="Total" value={fmtUsd(report.metrics.cost.totalCostUsd)} />
                  <MetricRow label="Avg / case" value={fmtUsd(report.metrics.cost.avgCostUsd)} />
                  <MetricRow
                    label="Cost per outcome"
                    value={fmtUsd(report.metrics.cost.costPerOutcome)}
                  />
                  <MetricRow label="p95 cost" value={fmtUsd(report.metrics.cost.p95CostUsd)} />
                  <MetricRow
                    label="Tokens (total)"
                    value={fmtNum(report.metrics.cost.totalTokensUsed)}
                  />
                  <MetricRow
                    label="Tokens (avg)"
                    value={fmtNum(report.metrics.cost.avgTokensUsed, 1)}
                  />
                </MetricCard>

                <MetricCard title="Intervention Value">
                  <MetricRow
                    label="Interventions"
                    value={`${report.metrics.interventionValue.interventions} / ${report.metrics.interventionValue.totalDecisions}`}
                  />
                  <MetricRow
                    label="Intervention rate"
                    value={fmtPct(report.metrics.interventionValue.interventionRate)}
                  />
                  <MetricRow
                    label="Avg improvement"
                    value={fmtPct(report.metrics.interventionValue.avgImprovementFromIntervention)}
                  />
                  <MetricRow
                    label="Value saved"
                    value={fmtUsd(report.metrics.interventionValue.estimatedValueSaved)}
                  />
                </MetricCard>

                <MetricCard title="Human Override Rate">
                  <MetricRow
                    label="Overrides"
                    value={`${report.metrics.humanOverrideRate.overrides} / ${report.metrics.humanOverrideRate.totalDecisions}`}
                  />
                  <MetricRow
                    label="Override rate"
                    value={fmtPct(report.metrics.humanOverrideRate.overrideRate)}
                    color={
                      report.metrics.humanOverrideRate.overrideRate > 0.1 ? '#f59e0b' : undefined
                    }
                  />
                  <MetricRow
                    label="Accepted rate"
                    value={fmtPct(report.metrics.humanOverrideRate.acceptedRate)}
                  />
                  {Object.entries(report.metrics.humanOverrideRate.overrideReasons)
                    .slice(0, 3)
                    .map(([k, v]) => (
                      <MetricRow key={k} label={`· ${k}`} value={v} />
                    ))}
                </MetricCard>

                <MetricCard title="Rollback Rate">
                  <MetricRow
                    label="Rollbacks"
                    value={`${report.metrics.rollbackRate.rollbacks} / ${report.metrics.rollbackRate.totalActions}`}
                  />
                  <MetricRow
                    label="Rate"
                    value={fmtPct(report.metrics.rollbackRate.rollbackRate)}
                    color={report.metrics.rollbackRate.rollbackRate > 0.05 ? '#f59e0b' : undefined}
                  />
                  <MetricRow
                    label="Avg rollback latency"
                    value={fmtMs(report.metrics.rollbackRate.avgRollbackLatencyMs)}
                  />
                  {Object.entries(report.metrics.rollbackRate.rollbackReasons)
                    .slice(0, 3)
                    .map(([k, v]) => (
                      <MetricRow key={k} label={`· ${k}`} value={v} />
                    ))}
                </MetricCard>

                <MetricCard title="Policy Violations">
                  <MetricRow
                    label="Compliance"
                    value={fmtPct(report.metrics.policyViolations.complianceRate)}
                    color={passRateColor(report.metrics.policyViolations.complianceRate)}
                  />
                  <MetricRow
                    label="Violations"
                    value={`${report.metrics.policyViolations.violations} / ${report.metrics.policyViolations.totalChecks}`}
                    color={report.metrics.policyViolations.violations > 0 ? '#ef4444' : undefined}
                  />
                  <MetricRow
                    label="Violation rate"
                    value={fmtPct(report.metrics.policyViolations.violationRate)}
                  />
                  <MetricRow
                    label="Critical"
                    value={report.metrics.policyViolations.criticalViolations}
                    color={
                      report.metrics.policyViolations.criticalViolations > 0 ? '#ef4444' : undefined
                    }
                  />
                  {Object.entries(report.metrics.policyViolations.violationsByType)
                    .slice(0, 3)
                    .map(([k, v]) => (
                      <MetricRow key={k} label={`· ${k}`} value={v} />
                    ))}
                </MetricCard>
              </div>
            </div>

            <div
              style={{
                marginBottom: 12,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gi-text-primary)' }}>
                Per-Case Results{' '}
                <span style={{ color: 'var(--gi-text-muted)', fontWeight: 400, fontSize: 12 }}>
                  ({visibleCases.length} of {report.caseResults.length})
                </span>
              </div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={showOnlyFailed}
                  onChange={(e) => setShowOnlyFailed(e.target.checked)}
                />
                Show only failed
              </label>
            </div>

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '60px 2fr 1fr 80px 90px 90px 90px',
                  gap: 8,
                  padding: '10px 14px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                <div>Status</div>
                <div>Case</div>
                <div>Grader</div>
                <div>Score</div>
                <div>Latency</div>
                <div>Tokens</div>
                <div>Cost</div>
              </div>
              {visibleCases.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--gi-text-muted)', fontSize: 13 }}>
                  No cases to display.
                </div>
              )}
              {visibleCases.map((c) => {
                const expanded = expandedCase === c.caseId;
                return (
                  <div key={c.caseId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <button
                      onClick={() => setExpandedCase(expanded ? null : c.caseId)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '60px 2fr 1fr 80px 90px 90px 90px',
                        gap: 8,
                        padding: '10px 14px',
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                        color: '#e2e8f0',
                        cursor: 'pointer',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: c.passed ? '#22c55e' : '#ef4444',
                            background: c.passed ? '#22c55e18' : '#ef444418',
                            border: `1px solid ${c.passed ? '#22c55e40' : '#ef444440'}`,
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          {c.passed ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{c.label}</div>
                        <div
                          style={{
                            fontSize: 10,
                            color: '#4a6070',
                            display: 'flex',
                            gap: 8,
                            marginTop: 2,
                          }}
                        >
                          <span>{c.caseId}</span>
                          <span>·</span>
                          <span>{c.domain}</span>
                          {c.tags?.slice(0, 2).map((t) => (
                            <span key={t}>#{t}</span>
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.graderType}</div>
                      <div style={{ fontSize: 12, color: passRateColor(c.score), fontWeight: 600 }}>
                        {fmtPct(c.score)}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{fmtMs(c.latencyMs)}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{fmtNum(c.tokensUsed)}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>{fmtUsd(c.costUsd)}</div>
                    </button>
                    {expanded && (
                      <div
                        style={{
                          padding: '0 14px 14px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: 12,
                        }}
                      >
                        <CaseSection title="Input" data={c.input} />
                        <CaseSection title="Output" data={c.output} />
                        <CaseSection title="Ground Truth" data={c.groundTruth} />
                        {c.failureReason && (
                          <div
                            style={{
                              gridColumn: '1 / -1',
                              background: '#ef444412',
                              border: '1px solid #ef444430',
                              borderRadius: 6,
                              padding: '8px 12px',
                              fontSize: 12,
                              color: '#fca5a5',
                            }}
                          >
                            <strong>Failure:</strong> {c.failureReason}
                          </div>
                        )}
                        {c.graderDetails && Object.keys(c.graderDetails).length > 0 && (
                          <div style={{ gridColumn: '1 / -1' }}>
                            <CaseSection title="Grader Details" data={c.graderDetails} />
                          </div>
                        )}
                        {c.traceId && (
                          <div style={{ gridColumn: '1 / -1', fontSize: 11, color: 'var(--gi-text-muted)' }}>
                            Trace: <code style={{ color: '#94a3b8' }}>{c.traceId}</code>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function CaseSection({ title, data }: { title: string; data: Record<string, unknown> }) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: 6,
        padding: 10,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      <pre
        style={{
          margin: 0,
          fontSize: 11,
          color: '#94a3b8',
          fontFamily: 'ui-monospace, SF Mono, Menlo, monospace',
          overflow: 'auto',
          maxHeight: 240,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Router shell
// ---------------------------------------------------------------------------

export default function EvalForge() {
  const [matchRun, runParams] = useRoute<{ runId: string }>('/eval-forge/runs/:runId');
  if (matchRun && runParams?.runId) {
    return <EvalForgeRunDetail runId={runParams.runId} />;
  }
  return <EvalForgeDashboard />;
}

export { buildRoute };
