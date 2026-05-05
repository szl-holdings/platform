/**
 * PER — Evaluation Console
 *
 * Fetches from live endpoints (/evolution/candidates + /evolution/evaluations).
 * Shows SIMULATED badge when API returns simulated:true, LIVE badge otherwise.
 */

import { useEffect, useState } from 'react';
import { apiUrl, fetchJson } from '../cognitive/shared';

const PER_ACCENT = '#d4a054';

interface Candidate {
  candidateId: string;
  displayName: string;
  state: string;
  simulated: boolean;
}

interface EvalRun {
  runId: string;
  candidateId: string;
  status: string;
  passRate?: number;
  aggregateRewardScore?: number;
  avgScoreTotal?: number;
  avgLatencyMs?: number;
  aggregateLatencyMs?: number;
  totalCases: number;
  completedCases?: number;
  passed?: number;
  failedCases?: number;
  failed?: number;
  hasRegression?: boolean;
  regressionSeverity?: string;
  coverageThresholdMet?: boolean;
  simulated: boolean;
  completedAt?: string;
  rewardComponents?: Record<string, number>;
  components?: Record<string, number>;
  recommendation?: string;
  promotionEligible?: boolean;
}

function ModeBadge({ simulated }: { simulated: boolean }) {
  if (simulated) {
    return (
      <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', background: '#f59e0b18', padding: '2px 8px', borderRadius: 4, border: '1px solid #f59e0b40', letterSpacing: 1 }}>
        SIMULATED
      </span>
    );
  }
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: '#22c55e', background: '#22c55e18', padding: '2px 8px', borderRadius: 4, border: '1px solid #22c55e40', letterSpacing: 1 }}>
      LIVE
    </span>
  );
}

function PassRateBar({ rate }: { rate: number }) {
  const color = rate >= 0.80 ? '#22c55e' : rate >= 0.70 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: '#1e2028', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${rate * 100}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 12, color, fontWeight: 600, minWidth: 40 }}>{(rate * 100).toFixed(1)}%</span>
    </div>
  );
}

function RecommendationBadge({ rec }: { rec: string }) {
  const colors: Record<string, string> = { promote: '#22c55e', review: '#f59e0b', reject: '#ef4444', hold: '#6366f1' };
  const color = colors[rec] ?? '#6b7280';
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}18`, padding: '3px 10px', borderRadius: 4, border: `1px solid ${color}30` }}>
      {rec.toUpperCase()}
    </span>
  );
}

export default function PEREvaluationConsole() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [evaluationRuns, setEvaluationRuns] = useState<EvalRun[]>([]);
  const [isSimulated, setIsSimulated] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<EvalRun | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [candResp, evalResp] = await Promise.all([
          fetchJson<{ ok: boolean; data: Candidate[]; simulated: boolean }>(apiUrl('/evolution/candidates')),
          fetchJson<{ ok: boolean; data: EvalRun[]; simulated: boolean }>(apiUrl('/evolution/evaluations')),
        ]);
        setCandidates(candResp.data ?? []);
        setEvaluationRuns(evalResp.data ?? []);
        setIsSimulated(candResp.simulated ?? evalResp.simulated ?? true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load evaluation data');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <div style={{ padding: 40, color: '#6b7280' }}>Loading evaluation data…</div>;
  if (error) return <div style={{ padding: 40, color: '#ef4444' }}>Error: {error}</div>;

  const candidateMap = Object.fromEntries(candidates.map((c) => [c.candidateId, c]));
  const displayRun = selectedRun ?? evaluationRuns.find((r) => r.status === 'completed') ?? null;

  return (
    <div style={{ padding: 32, background: '#080a0d', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb', margin: 0 }}>Evaluation Console</h1>
        <ModeBadge simulated={isSimulated} />
      </div>
      <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 32, margin: '0 0 32px' }}>
        Benchmark suites · Scorecards · Candidate comparisons · Reward breakdown
      </p>

      {evaluationRuns.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#6b7280', background: '#0f1015', borderRadius: 10, border: '1px solid #1e2028' }}>
          No evaluation runs found. Launch an evaluation via the PER API or register a candidate and run /evaluate.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, minHeight: 500 }}>
          <div style={{ background: '#0f1015', border: '1px solid #1e2028', borderRadius: 10, padding: 16, overflowY: 'auto' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              Evaluation Runs ({evaluationRuns.length})
            </div>
            {evaluationRuns.map((run) => {
              const cand = candidateMap[run.candidateId];
              const isSelected = displayRun?.runId === run.runId;
              const passRate = run.passRate ?? (run.totalCases > 0 && run.completedCases != null ? (run.completedCases - (run.failedCases ?? 0)) / run.totalCases : 0);
              return (
                <button
                  key={run.runId}
                  onClick={() => setSelectedRun(run)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: isSelected ? '#1a1d24' : 'transparent',
                    border: isSelected ? `1px solid ${PER_ACCENT}40` : '1px solid transparent',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 6,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontSize: 12, color: '#f9fafb', fontWeight: 500 }}>
                    {cand?.displayName?.split('—')[0].trim() ?? run.candidateId}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>
                    {run.status === 'completed' ? (
                      <PassRateBar rate={passRate} />
                    ) : (
                      <span style={{ color: run.status === 'running' ? '#60a5fa' : '#6b7280' }}>
                        {run.status.toUpperCase()}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            {displayRun ? (
              <div>
                <div style={{ background: '#0f1015', border: '1px solid #1e2028', borderRadius: 10, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#f9fafb' }}>
                        {candidateMap[displayRun.candidateId]?.displayName ?? displayRun.candidateId}
                      </div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Run ID: {displayRun.runId}</div>
                    </div>
                    {displayRun.recommendation && <RecommendationBadge rec={displayRun.recommendation} />}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {[
                      { label: 'Pass Rate', value: `${((displayRun.passRate ?? 0) * 100).toFixed(1)}%` },
                      { label: 'Cases', value: `${displayRun.passed ?? displayRun.completedCases ?? 0}/${displayRun.totalCases}` },
                      { label: 'Avg Latency', value: `${(displayRun.avgLatencyMs ?? displayRun.aggregateLatencyMs ?? 0).toFixed(0)}ms` },
                      { label: 'Regression', value: (displayRun.regressionSeverity ?? 'none').toUpperCase() },
                    ].map((stat) => (
                      <div key={stat.label} style={{ background: '#090c10', borderRadius: 6, padding: '10px 14px' }}>
                        <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>{stat.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#f9fafb', marginTop: 4 }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {(displayRun.components ?? displayRun.rewardComponents) && (
                  <div style={{ background: '#0f1015', border: '1px solid #1e2028', borderRadius: 10, padding: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                      Reward Breakdown
                    </div>
                    <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Total Score</span>
                      <span style={{ fontSize: 22, fontWeight: 700, color: PER_ACCENT }}>
                        {((displayRun.aggregateRewardScore ?? displayRun.avgScoreTotal ?? 0) * 100).toFixed(1)}
                      </span>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>/ 100</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {Object.entries(displayRun.components ?? displayRun.rewardComponents ?? {}).map(([key, val]) => {
                        const isPenalty = key.toLowerCase().includes('penalty');
                        return (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#090c10', borderRadius: 5 }}>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: 600, color: isPenalty ? '#ef4444' : '#22c55e' }}>
                              {isPenalty ? '-' : ''}{(Math.abs(Number(val)) * 100).toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {displayRun.simulated && (
                      <div style={{ marginTop: 12, fontSize: 11, color: '#f59e0b', padding: '6px 10px', background: '#f59e0b08', borderRadius: 5 }}>
                        ⚠ Simulated telemetry — values reflect synthetic data
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#6b7280', background: '#0f1015', borderRadius: 10, border: '1px solid #1e2028' }}>
                Select an evaluation run to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
