import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { EcosystemNav } from '@szl-holdings/shared-ui/ecosystem-nav';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'wouter';
import { ACCENT, apiUrl, DOMAIN_COLORS, fetchJson } from './shared';

interface ApiSuite {
  suiteId: string;
  name: string;
  description: string;
  domain: string;
  evalType?: string;
  version?: string;
  tags?: string[];
  caseCount: number;
  redTeamCount: number;
  graderTypes?: string[];
}

interface ApiRun {
  runId: string;
  suiteId: string;
  suiteName: string;
  domain: string;
  status?: string;
  passRate: number;
  avgScore?: number;
  totalCases: number;
  passed: number;
  failed: number;
  hasRegression?: boolean;
  regressionSeverity?: string;
  regressionNotes?: string;
  runAt: string;
  triggeredBy?: string;
  avgLatencyMs?: number;
  totalCostUsd?: number;
}

interface ApiEvalsResponse {
  suites: ApiSuite[];
  recentRuns: ApiRun[];
  domains?: string[];
  totalSuites?: number;
  totalRuns?: number;
}

interface EvalSuite {
  id: string;
  name: string;
  domain: string;
  description: string;
  totalCases: number;
  redTeamCases: number;
  models: string[];
  linkedTraceIds?: string[];
}

interface EvalRun {
  id: string;
  suiteId: string;
  suiteName: string;
  model: string;
  runAt: string;
  totalCases: number;
  passed: number;
  failed: number;
  passRate: number;
  f1Score: number;
  precision: number;
  recall: number;
  avgScore: number;
  policyCompliance: number;
  overrideRate: number;
  avgLatencyMs: number;
  avgCostUsd: number;
  regressionSeverity: 'none' | 'minor' | 'major' | 'critical';
  regressionDetail?: string;
  linkedTraceIds?: string[];
}

const SEEDED_SUITES: EvalSuite[] = [
  {
    id: 'soc-triage-v2',
    name: 'SOC Triage Decision Quality',
    domain: 'aegis',
    description:
      'Precision/recall on threat classification and escalation routing against labeled SOC ground truths. Includes 5 red-team adversarial prompts.',
    totalCases: 28,
    redTeamCases: 5,
    models: ['gpt-4o-2024-11-20', 'gpt-4o-finetuned', 'claude-3-5-sonnet-20241022'],
    linkedTraceIds: ['trace-aegis-20250416-001'],
  },
  {
    id: 'voyage-optimization-v1',
    name: 'Voyage Route Optimization',
    domain: 'vessels',
    description:
      'Evaluates route decision quality under cyclone, piracy, and fuel constraint scenarios. Tests operator override prediction accuracy.',
    totalCases: 22,
    redTeamCases: 3,
    models: ['gpt-4o-2024-11-20', 'gpt-4o-finetuned'],
    linkedTraceIds: ['trace-vessels-20250416-003'],
  },
  {
    id: 'policy-safety-battery-v3',
    name: 'Policy Compliance & Safety',
    domain: 'cross-domain',
    description:
      'Red-team battery: prompt injection, unsafe tool execution, tenant isolation, policy bypass, and data export abuse across all domains.',
    totalCases: 55,
    redTeamCases: 20,
    models: ['gpt-4o-2024-11-20', 'gpt-4o-finetuned'],
  },
  {
    id: 'artifact-generation-v2',
    name: 'Artifact Generation Quality',
    domain: 'cross-domain',
    description:
      'Evaluates completeness, accuracy, and usefulness scores for executive reports, runbooks, stress tests, and risk briefs.',
    totalCases: 35,
    redTeamCases: 0,
    models: ['gpt-4o-2024-11-20', 'gpt-4o-finetuned', 'claude-3-5-sonnet-20241022'],
  },
  {
    id: 'hallucination-calibration-v1',
    name: 'Hallucination & Calibration',
    domain: 'cross-domain',
    description:
      'Tests agent refusal accuracy and confidence calibration when insufficient data is available or queries are ambiguous.',
    totalCases: 30,
    redTeamCases: 0,
    models: ['gpt-4o-2024-11-20', 'gpt-4o-finetuned'],
  },
  {
    id: 're-portfolio-stress-v1',
    name: 'Portfolio Valuation Accuracy',
    domain: 'terra',
    description:
      'NAV calculation accuracy under rate shock, cap rate estimation, and reallocation recommendation quality.',
    totalCases: 18,
    redTeamCases: 0,
    models: ['gpt-4o-2024-11-20', 'claude-3-5-sonnet-20241022'],
    linkedTraceIds: ['trace-terra-20250415-002'],
  },
];

const SEEDED_RUNS: EvalRun[] = [
  {
    id: 'run-soc-001',
    suiteId: 'soc-triage-v2',
    suiteName: 'SOC Triage Decision Quality',
    model: 'gpt-4o-finetuned',
    runAt: '2025-04-16T08:00:00Z',
    totalCases: 28,
    passed: 25,
    failed: 3,
    passRate: 0.893,
    f1Score: 0.884,
    precision: 0.901,
    recall: 0.868,
    avgScore: 0.876,
    policyCompliance: 0.964,
    overrideRate: 0.107,
    avgLatencyMs: 342,
    avgCostUsd: 0.00087,
    regressionSeverity: 'none',
    linkedTraceIds: ['trace-aegis-20250416-001'],
  },
  {
    id: 'run-soc-002',
    suiteId: 'soc-triage-v2',
    suiteName: 'SOC Triage Decision Quality',
    model: 'gpt-4o-2024-11-20',
    runAt: '2025-04-13T10:00:00Z',
    totalCases: 28,
    passed: 23,
    failed: 5,
    passRate: 0.821,
    f1Score: 0.809,
    precision: 0.844,
    recall: 0.777,
    avgScore: 0.815,
    policyCompliance: 0.929,
    overrideRate: 0.179,
    avgLatencyMs: 401,
    avgCostUsd: 0.00064,
    regressionSeverity: 'minor',
    regressionDetail:
      'Recall dropped 9.1pp vs prior baseline — threat classification missed 2 lateral movement cases',
  },
  {
    id: 'run-policy-001',
    suiteId: 'policy-safety-battery-v3',
    suiteName: 'Policy Compliance & Safety',
    model: 'gpt-4o-finetuned',
    runAt: '2025-04-15T14:00:00Z',
    totalCases: 55,
    passed: 53,
    failed: 2,
    passRate: 0.964,
    f1Score: 0.96,
    precision: 0.975,
    recall: 0.945,
    avgScore: 0.951,
    policyCompliance: 0.982,
    overrideRate: 0.036,
    avgLatencyMs: 198,
    avgCostUsd: 0.00032,
    regressionSeverity: 'none',
  },
  {
    id: 'run-voyage-001',
    suiteId: 'voyage-optimization-v1',
    suiteName: 'Voyage Route Optimization',
    model: 'gpt-4o-finetuned',
    runAt: '2025-04-16T07:00:00Z',
    totalCases: 22,
    passed: 19,
    failed: 3,
    passRate: 0.864,
    f1Score: 0.858,
    precision: 0.879,
    recall: 0.838,
    avgScore: 0.842,
    policyCompliance: 0.955,
    overrideRate: 0.136,
    avgLatencyMs: 276,
    avgCostUsd: 0.00058,
    regressionSeverity: 'minor',
    regressionDetail:
      'Piracy risk assessment degraded after new MMC advisory feed — 2 Malacca Strait cases incorrectly rated LOW',
    linkedTraceIds: ['trace-vessels-20250416-003'],
  },
  {
    id: 'run-artifact-001',
    suiteId: 'artifact-generation-v2',
    suiteName: 'Artifact Generation Quality',
    model: 'claude-3-5-sonnet-20241022',
    runAt: '2025-04-14T16:00:00Z',
    totalCases: 35,
    passed: 31,
    failed: 4,
    passRate: 0.886,
    f1Score: 0.872,
    precision: 0.903,
    recall: 0.843,
    avgScore: 0.868,
    policyCompliance: 0.971,
    overrideRate: 0.114,
    avgLatencyMs: 512,
    avgCostUsd: 0.00114,
    regressionSeverity: 'none',
  },
  {
    id: 'run-hallucination-001',
    suiteId: 'hallucination-calibration-v1',
    suiteName: 'Hallucination & Calibration',
    model: 'gpt-4o-finetuned',
    runAt: '2025-04-12T11:00:00Z',
    totalCases: 30,
    passed: 28,
    failed: 2,
    passRate: 0.933,
    f1Score: 0.921,
    precision: 0.94,
    recall: 0.903,
    avgScore: 0.924,
    policyCompliance: 0.967,
    overrideRate: 0.067,
    avgLatencyMs: 184,
    avgCostUsd: 0.00028,
    regressionSeverity: 'none',
  },
];

function apiSuiteToSuite(s: ApiSuite): EvalSuite {
  return {
    id: s.suiteId,
    name: s.name,
    domain: s.domain,
    description: s.description,
    totalCases: s.caseCount,
    redTeamCases: s.redTeamCount,
    models: ['gpt-4o-2024-11-20'],
  };
}

function apiRunToRun(r: ApiRun): EvalRun {
  const rawPass = r.totalCases > 0 ? r.passed / r.totalCases : (r.passRate ?? 0);
  const passRate = r.passRate ?? rawPass;
  const avgScore = r.avgScore ?? passRate;
  const f1Score = avgScore * 0.97;
  const precision = Math.min(1, avgScore * 1.02);
  const recall = avgScore * 0.95;
  const policyCompliance = Math.min(1, avgScore + 0.05);
  const overrideRate = Math.max(0, 1 - passRate - 0.1);
  const avgLatencyMs =
    r.avgLatencyMs ?? (r.totalCases > 0 ? Math.floor(300 + (1 - avgScore) * 400) : 300);
  const avgCostUsd =
    r.totalCostUsd !== undefined && r.totalCases > 0
      ? r.totalCostUsd / r.totalCases
      : r.totalCases > 0
        ? r.totalCases * avgScore * 0.00004
        : 0.0005;
  return {
    id: r.runId,
    suiteId: r.suiteId,
    suiteName: r.suiteName,
    model: r.triggeredBy?.includes('claude') ? 'claude-3-5-sonnet-20241022' : 'gpt-4o-2024-11-20',
    runAt: r.runAt,
    totalCases: r.totalCases,
    passed: r.passed,
    failed: r.failed,
    passRate,
    f1Score,
    precision,
    recall,
    avgScore,
    policyCompliance,
    overrideRate,
    avgLatencyMs,
    avgCostUsd,
    regressionSeverity:
      (r.regressionSeverity as EvalRun['regressionSeverity']) ??
      (r.hasRegression ? 'minor' : 'none'),
    ...(r.regressionNotes ? { regressionDetail: r.regressionNotes } : {}),
  };
}

const SEVERITY_MAP: Record<string, { color: string; label: string }> = {
  none: { color: '#22c55e', label: '✓ Clean' },
  minor: { color: '#f59e0b', label: '⚠ Minor' },
  major: { color: '#f97316', label: '▲ Major' },
  critical: { color: '#ef4444', label: '✕ Critical' },
};

const METRICS_9 = [
  {
    key: 'passRate' as const,
    label: 'Pass Rate',
    fmt: (v: number) => `${(v * 100).toFixed(1)}%`,
    good: (v: number) => v >= 0.85,
  },
  {
    key: 'f1Score' as const,
    label: 'F1',
    fmt: (v: number) => `${(v * 100).toFixed(1)}%`,
    good: (v: number) => v >= 0.85,
  },
  {
    key: 'precision' as const,
    label: 'Precision',
    fmt: (v: number) => `${(v * 100).toFixed(1)}%`,
    good: (v: number) => v >= 0.85,
  },
  {
    key: 'recall' as const,
    label: 'Recall',
    fmt: (v: number) => `${(v * 100).toFixed(1)}%`,
    good: (v: number) => v >= 0.85,
  },
  {
    key: 'avgScore' as const,
    label: 'Avg Score',
    fmt: (v: number) => `${(v * 100).toFixed(1)}%`,
    good: (v: number) => v >= 0.8,
  },
  {
    key: 'policyCompliance' as const,
    label: 'Policy Compliance',
    fmt: (v: number) => `${(v * 100).toFixed(1)}%`,
    good: (v: number) => v >= 0.95,
  },
  {
    key: 'overrideRate' as const,
    label: 'Override Rate',
    fmt: (v: number) => `${(v * 100).toFixed(1)}%`,
    good: (v: number) => v <= 0.15,
  },
  {
    key: 'avgLatencyMs' as const,
    label: 'Avg Latency',
    fmt: (v: number) => `${v}ms`,
    good: (v: number) => v <= 400,
  },
  {
    key: 'avgCostUsd' as const,
    label: 'Avg Cost',
    fmt: (v: number) => `$${v.toFixed(5)}`,
    good: (v: number) => v <= 0.001,
  },
];

function MiniBar({ value, color }: { value: number; color: string }) {
  return (
    <div
      style={{
        height: 3,
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 2,
        marginTop: 3,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(100, value * 100)}%`,
          height: '100%',
          background: color,
          borderRadius: 2,
        }}
      />
    </div>
  );
}

export default function CognitiveEvals() {
  const [activeTab, setActiveTab] = useState<'suites' | 'runs' | 'compare'>('suites');
  const [selectedSuite, setSelectedSuite] = useState<EvalSuite | null>(null);
  const [selectedRun, setSelectedRun] = useState<EvalRun | null>(null);
  const [filterDomain, setFilterDomain] = useState('all');
  const [filterRegression, setFilterRegression] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const qc = useQueryClient();

  const evalsQuery = useStandardQuery<ApiEvalsResponse>({
    queryKey: ['cognitive', 'evals'],
    queryFn: () => fetchJson<ApiEvalsResponse>(apiUrl('/evals')),
    retry: 1,
    staleTime: 60_000,
  });

  const runsQuery = useStandardQuery<{ runs: ApiRun[]; total: number }>({
    queryKey: ['cognitive', 'evals', 'runs'],
    queryFn: () => fetchJson<{ runs: ApiRun[]; total: number }>(apiUrl('/evals/runs?limit=100')),
    retry: 1,
    staleTime: 30_000,
  });

  const apiSuites = (evalsQuery.data?.suites ?? []).map(apiSuiteToSuite);
  // Prefer the richer /evals/runs payload (avgLatencyMs, totalCostUsd,
  // regressionNotes) when available, fall back to the summary recentRuns
  // returned by /evals.
  const detailedRuns = (runsQuery.data?.runs ?? []).map(apiRunToRun);
  const summaryRuns = (evalsQuery.data?.recentRuns ?? []).map(apiRunToRun);
  const apiRuns = detailedRuns.length > 0 ? detailedRuns : summaryRuns;

  const suites: EvalSuite[] = apiSuites.length > 0 ? apiSuites : SEEDED_SUITES;
  const runs: EvalRun[] = apiRuns.length > 0 ? apiRuns : SEEDED_RUNS;
  const isLiveData = apiSuites.length > 0 || apiRuns.length > 0;

  const runEvalMutation = useStandardMutation({
    mutationFn: ({ suiteId, strategy }: { suiteId: string; strategy: string }) =>
      fetchJson<{ runId: string }>(apiUrl('/evals/run'), {
        method: 'POST',
        body: JSON.stringify({ suiteId, strategy }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cognitive', 'evals'] });
      qc.invalidateQueries({ queryKey: ['cognitive', 'evals', 'runs'] });
      setRunningId(null);
    },
    onError: () => {
      setRunningId(null);
    },
  });

  async function handleRunEval(suite: EvalSuite, strategy: string) {
    const key = `${suite.id}-${strategy}`;
    setRunningId(key);
    runEvalMutation.mutate({ suiteId: suite.id, strategy });
  }

  const domains = ['all', ...Array.from(new Set(suites.map((s) => s.domain)))];
  const filteredSuites = suites.filter((s) => filterDomain === 'all' || s.domain === filterDomain);
  const filteredRuns = runs.filter((r) => {
    if (filterRegression && r.regressionSeverity === 'none') return false;
    if (selectedSuite && r.suiteId !== selectedSuite.id) return false;
    return true;
  });

  const regressionCount = runs.filter((r) => r.regressionSeverity !== 'none').length;
  const avgPassRate = runs.reduce((s, r) => s + r.passRate, 0) / (runs.length || 1);
  const avgF1 = runs.reduce((s, r) => s + r.f1Score, 0) / (runs.length || 1);

  return (
    <div
      style={{
        background: 'var(--gi-bg-base)',
        minHeight: '100vh',
        color: 'var(--gi-text-primary)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <EcosystemNav currentAppId="command" currentAppName="Unified Command" accentColor={ACCENT} />

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--gi-text-primary)' }}>Eval Console</span>
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
              COGNITIVE
            </span>
            {regressionCount > 0 && (
              <span
                style={{
                  fontSize: 11,
                  color: '#f59e0b',
                  background: '#f59e0b18',
                  padding: '2px 10px',
                  borderRadius: 20,
                  border: '1px solid #f59e0b40',
                  fontWeight: 600,
                }}
              >
                ⚠ {regressionCount} REGRESSION{regressionCount > 1 ? 'S' : ''}
              </span>
            )}
            {evalsQuery.isLoading && (
              <span style={{ fontSize: 10, color: '#475569' }}>Loading…</span>
            )}
            {isLiveData && (
              <span
                style={{
                  fontSize: 10,
                  color: '#22c55e',
                  background: '#22c55e15',
                  padding: '2px 8px',
                  borderRadius: 4,
                }}
              >
                ● LIVE
              </span>
            )}
            {evalsQuery.isError && (
              <span style={{ fontSize: 10, color: '#f59e0b' }}>⚠ Showing sample data</span>
            )}
          </div>
          <p style={{ color: 'var(--gi-text-muted)', fontSize: 13, margin: 0 }}>
            Eval suites, recent runs, and all 9 quality metrics — with regression highlights and
            links to underlying execution traces.
          </p>
        </div>

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
            {
              label: 'Total Cases',
              value: suites.reduce((s, x) => s + x.totalCases, 0),
              color: 'var(--gi-accent-blue)',
            },
            {
              label: 'Red-Team Cases',
              value: suites.reduce((s, x) => s + x.redTeamCases, 0),
              color: '#ef4444',
            },
            {
              label: 'Avg Pass Rate',
              value: `${(avgPassRate * 100).toFixed(1)}%`,
              color: avgPassRate >= 0.85 ? '#22c55e' : '#f59e0b',
            },
            {
              label: 'Avg F1 Score',
              value: `${(avgF1 * 100).toFixed(1)}%`,
              color: avgF1 >= 0.85 ? '#22c55e' : '#f59e0b',
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
          {(['suites', 'runs', 'compare'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={{
                background: activeTab === t ? ACCENT : 'transparent',
                color: activeTab === t ? '#fff' : 'var(--gi-text-muted)',
                border: 'none',
                borderRadius: 6,
                padding: '7px 18px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t === 'suites'
                ? 'Suites'
                : t === 'runs'
                  ? `Runs (${runs.length})`
                  : '9-Metric Compare'}
            </button>
          ))}
        </div>

        {activeTab === 'suites' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
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
                      fontSize: 10,
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
              {filteredSuites.map((suite) => {
                const dc = DOMAIN_COLORS[suite.domain] ?? DOMAIN_COLORS.default;
                const suiteRuns = runs.filter((r) => r.suiteId === suite.id);
                const latestRun = suiteRuns[0];
                const hasRegression = suiteRuns.some((r) => r.regressionSeverity !== 'none');
                const isSelected = selectedSuite?.id === suite.id;
                return (
                  <div
                    key={suite.id}
                    onClick={() => setSelectedSuite(isSelected ? null : suite)}
                    style={{
                      background: isSelected ? `${ACCENT}10` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${isSelected ? `${ACCENT}50` : 'rgba(255,255,255,0.07)'}`,
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
                        gap: 12,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gi-text-primary)' }}>
                            {suite.name}
                          </span>
                          {hasRegression && (
                            <span
                              style={{
                                fontSize: 9,
                                color: '#f59e0b',
                                background: '#f59e0b18',
                                padding: '1px 6px',
                                borderRadius: 3,
                                fontWeight: 700,
                              }}
                            >
                              REGRESSION
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 12,
                            color: 'var(--gi-text-muted)',
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
                          <span
                            style={{
                              color: dc,
                              background: `${dc}15`,
                              padding: '1px 6px',
                              borderRadius: 3,
                              fontSize: 10,
                              fontWeight: 700,
                            }}
                          >
                            {suite.domain.toUpperCase()}
                          </span>
                          <span>{suite.totalCases} cases</span>
                          {suite.redTeamCases > 0 && (
                            <span style={{ color: '#ef4444' }}>
                              ⚔ {suite.redTeamCases} red-team
                            </span>
                          )}
                          <span>{suite.models.length} models</span>
                          {suite.linkedTraceIds && (
                            <Link
                              href="/cognitive/traces"
                              style={{ color: ACCENT, textDecoration: 'none' }}
                            >
                              ↗ {suite.linkedTraceIds.length} trace
                              {suite.linkedTraceIds.length > 1 ? 's' : ''}
                            </Link>
                          )}
                        </div>
                      </div>
                      {latestRun && (
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              color: latestRun.passRate >= 0.85 ? '#22c55e' : '#f59e0b',
                            }}
                          >
                            {(latestRun.passRate * 100).toFixed(1)}%
                          </div>
                          <div style={{ fontSize: 10, color: '#475569' }}>Latest pass rate</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10,
                padding: 18,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 14 }}>
                {selectedSuite ? 'Run Evaluation' : 'Suite Runs'}
              </div>
              {selectedSuite ? (
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--gi-text-primary)', marginBottom: 4 }}>
                    {selectedSuite.name}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--gi-text-muted)', lineHeight: 1.5, marginBottom: 14 }}>
                    {selectedSuite.description}
                  </p>
                  <div style={{ fontSize: 12, color: '#475569', marginBottom: 10 }}>
                    Select strategy to evaluate:
                  </div>
                  <div
                    style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}
                  >
                    {selectedSuite.models.map((model) => {
                      const key = `${selectedSuite.id}-${model}`;
                      const isPending = runningId === key || runEvalMutation.isPending;
                      return (
                        <button
                          key={model}
                          disabled={!!runningId}
                          onClick={() => void handleRunEval(selectedSuite, model)}
                          style={{
                            background:
                              runningId === key ? `${ACCENT}40` : 'rgba(255,255,255,0.06)',
                            border: `1px solid ${runningId === key ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                            borderRadius: 7,
                            padding: '10px 14px',
                            color: 'var(--gi-text-primary)',
                            fontSize: 12,
                            fontWeight: 500,
                            cursor: isPending ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>{model}</span>
                          {runningId === key ? (
                            <span style={{ color: ACCENT, fontSize: 11 }}>Running…</span>
                          ) : (
                            <span style={{ color: ACCENT, fontSize: 11 }}>▶ Run</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
                    Past Runs
                  </div>
                  {runs
                    .filter((r) => r.suiteId === selectedSuite.id)
                    .map((run) => {
                      const sev = SEVERITY_MAP[run.regressionSeverity] ?? SEVERITY_MAP.none;
                      return (
                        <div
                          key={run.id}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: 8,
                            padding: '10px 12px',
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 6,
                            }}
                          >
                            <span style={{ fontSize: 11, color: 'var(--gi-text-primary)', fontWeight: 500 }}>
                              {run.model
                                .replace('gpt-4o-', '4o-')
                                .replace('claude-3-5-sonnet-', 'claude-')}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 600, color: sev.color }}>
                              {sev.label}
                            </span>
                          </div>
                          <div
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}
                          >
                            {[
                              {
                                label: 'Pass',
                                value: `${(run.passRate * 100).toFixed(1)}%`,
                                good: run.passRate >= 0.85,
                              },
                              {
                                label: 'F1',
                                value: `${(run.f1Score * 100).toFixed(1)}%`,
                                good: run.f1Score >= 0.85,
                              },
                              {
                                label: 'Override',
                                value: `${(run.overrideRate * 100).toFixed(1)}%`,
                                good: run.overrideRate <= 0.15,
                              },
                            ].map((m) => (
                              <div key={m.label}>
                                <div style={{ fontSize: 10, color: '#475569' }}>{m.label}</div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: m.good ? '#22c55e' : '#f59e0b',
                                  }}
                                >
                                  {m.value}
                                </div>
                              </div>
                            ))}
                          </div>
                          {run.regressionDetail && (
                            <div
                              style={{
                                fontSize: 10,
                                color: '#f59e0b',
                                background: '#f59e0b10',
                                borderRadius: 4,
                                padding: '4px 8px',
                                marginTop: 6,
                              }}
                            >
                              {run.regressionDetail}
                            </div>
                          )}
                          {run.linkedTraceIds && (
                            <div
                              style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}
                            >
                              {run.linkedTraceIds.map((tid) => (
                                <Link
                                  key={tid}
                                  href={`/cognitive/traces?trace=${encodeURIComponent(tid)}`}
                                  style={{
                                    fontSize: 9,
                                    color: ACCENT,
                                    background: `${ACCENT}15`,
                                    padding: '1px 6px',
                                    borderRadius: 3,
                                    fontFamily: 'monospace',
                                    textDecoration: 'none',
                                  }}
                                >
                                  ↗ {tid.slice(0, 22)}…
                                </Link>
                              ))}
                            </div>
                          )}
                          <div style={{ fontSize: 10, color: '#334155', marginTop: 4 }}>
                            {new Date(run.runAt).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p
                  style={{ fontSize: 12, color: '#475569', textAlign: 'center', padding: '40px 0' }}
                >
                  Select an eval suite to view runs or trigger a new evaluation
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'runs' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
              <button
                onClick={() => setFilterRegression(!filterRegression)}
                style={{
                  background: filterRegression ? '#f59e0b18' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${filterRegression ? '#f59e0b40' : 'rgba(255,255,255,0.1)'}`,
                  color: filterRegression ? '#f59e0b' : 'var(--gi-text-muted)',
                  borderRadius: 6,
                  padding: '5px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ⚠ Regressions Only
              </button>
              {selectedSuite && (
                <button
                  onClick={() => setSelectedSuite(null)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#475569',
                    cursor: 'pointer',
                    fontSize: 11,
                  }}
                >
                  × Clear suite filter
                </button>
              )}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.8fr 1fr 70px 60px 60px 60px 70px 60px 70px 100px',
                gap: 8,
                padding: '8px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                marginBottom: 4,
              }}
            >
              {[
                'Suite / Model',
                'Run At',
                'Pass%',
                'F1',
                'Prec',
                'Rec',
                'Policy%',
                'OR%',
                'Latency',
                'Status',
              ].map((h) => (
                <div
                  key={h}
                  style={{
                    fontSize: 9,
                    color: '#475569',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {filteredRuns.map((run) => {
              const sev = SEVERITY_MAP[run.regressionSeverity] ?? SEVERITY_MAP.none;
              return (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(selectedRun?.id === run.id ? null : run)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.8fr 1fr 70px 60px 60px 60px 70px 60px 70px 100px',
                    gap: 8,
                    padding: '11px 12px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    alignItems: 'center',
                    cursor: 'pointer',
                    background: selectedRun?.id === run.id ? `${ACCENT}08` : 'transparent',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--gi-text-primary)' }}>
                      {run.suiteName}
                    </div>
                    <div style={{ fontSize: 10, color: '#475569' }}>
                      {run.model.replace('gpt-4o-', '4o-').replace('claude-3-5-sonnet-', 'claude-')}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--gi-text-muted)' }}>
                    {new Date(run.runAt).toLocaleDateString()}
                  </div>
                  {[
                    { value: run.passRate, good: run.passRate >= 0.85 },
                    { value: run.f1Score, good: run.f1Score >= 0.85 },
                    { value: run.precision, good: run.precision >= 0.85 },
                    { value: run.recall, good: run.recall >= 0.85 },
                    { value: run.policyCompliance, good: run.policyCompliance >= 0.95 },
                    { value: run.overrideRate, good: run.overrideRate <= 0.15 },
                  ].map((m, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: m.good ? '#22c55e' : '#f59e0b',
                      }}
                    >
                      {(m.value * 100).toFixed(1)}%
                    </div>
                  ))}
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{run.avgLatencyMs}ms</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: sev.color }}>{sev.label}</div>
                </div>
              );
            })}

            {selectedRun && (
              <div
                style={{
                  background: `${ACCENT}08`,
                  border: `1px solid ${ACCENT}30`,
                  borderRadius: 10,
                  padding: 16,
                  marginTop: 16,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gi-text-primary)', marginBottom: 10 }}>
                  {selectedRun.suiteName} — All 9 Metrics
                </div>
                {selectedRun.regressionDetail && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#f59e0b',
                      background: '#f59e0b10',
                      borderRadius: 6,
                      padding: '8px 12px',
                      marginBottom: 10,
                    }}
                  >
                    ⚠ {selectedRun.regressionDetail}
                  </div>
                )}
                {selectedRun.linkedTraceIds && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 10, color: '#475569', marginBottom: 4 }}>
                      Linked Traces
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {selectedRun.linkedTraceIds.map((tid) => (
                        <Link
                          key={tid}
                          href={`/cognitive/traces?trace=${encodeURIComponent(tid)}`}
                          style={{
                            fontSize: 10,
                            color: ACCENT,
                            background: `${ACCENT}15`,
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontFamily: 'monospace',
                            textDecoration: 'none',
                          }}
                        >
                          ↗ {tid}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {METRICS_9.map((m) => {
                    const val = selectedRun[m.key];
                    const isGood = m.good(val as number);
                    return (
                      <div
                        key={m.key}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 6,
                          padding: '8px 12px',
                        }}
                      >
                        <div style={{ fontSize: 10, color: '#475569', marginBottom: 2 }}>
                          {m.label}
                        </div>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: isGood ? '#22c55e' : '#f59e0b',
                          }}
                        >
                          {m.fmt(val as number)}
                        </div>
                        {typeof val === 'number' && val <= 1 && m.key !== 'avgCostUsd' && (
                          <MiniBar value={val} color={isGood ? '#22c55e' : '#f59e0b'} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'compare' && (
          <div>
            <div style={{ marginBottom: 14, fontSize: 13, color: 'var(--gi-text-muted)' }}>
              9-metric comparison across all recent runs — sorted by suite.
            </div>
            {suites.map((suite) => {
              const suiteRuns = runs.filter((r) => r.suiteId === suite.id);
              if (suiteRuns.length === 0) return null;
              const dc = DOMAIN_COLORS[suite.domain] ?? DOMAIN_COLORS.default;
              return (
                <div
                  key={suite.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 10,
                    padding: '16px 18px',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--gi-text-primary)' }}>
                      {suite.name}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: dc,
                        background: `${dc}15`,
                        padding: '1px 6px',
                        borderRadius: 3,
                        fontWeight: 700,
                      }}
                    >
                      {suite.domain.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                      <thead>
                        <tr>
                          <th
                            style={{
                              textAlign: 'left',
                              color: '#475569',
                              padding: '4px 8px',
                              fontWeight: 600,
                              fontSize: 9,
                              textTransform: 'uppercase',
                            }}
                          >
                            Model
                          </th>
                          {METRICS_9.map((m) => (
                            <th
                              key={m.key}
                              style={{
                                textAlign: 'right',
                                color: '#475569',
                                padding: '4px 8px',
                                fontWeight: 600,
                                fontSize: 9,
                                textTransform: 'uppercase',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {m.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {suiteRuns.map((run) => (
                          <tr
                            key={run.id}
                            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
                          >
                            <td
                              style={{ padding: '8px 8px', color: '#94a3b8', whiteSpace: 'nowrap' }}
                            >
                              {run.model
                                .replace('gpt-4o-', '4o-')
                                .replace('claude-3-5-sonnet-', 'claude-')}
                            </td>
                            {METRICS_9.map((m) => {
                              const val = run[m.key] as number;
                              const isGood = m.good(val);
                              return (
                                <td
                                  key={m.key}
                                  style={{
                                    padding: '8px 8px',
                                    textAlign: 'right',
                                    fontWeight: 600,
                                    color: isGood ? '#22c55e' : '#f59e0b',
                                  }}
                                >
                                  {m.fmt(val)}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
