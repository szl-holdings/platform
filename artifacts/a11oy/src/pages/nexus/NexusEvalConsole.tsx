import { useEffect, useMemo, useState } from 'react';

const GOLD = '#c9b787';
const RED = '#f87171';
const GREEN = '#22c55e';
const AMBER = '#fbbf24';

interface RunSummary {
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
  runAt: string;
}

interface CompareCase {
  caseId: string;
  label: string;
  baseline: { passed: boolean; score: number; latencyMs: number } | null;
  variant: { passed: boolean; score: number; latencyMs: number } | null;
  scoreDelta: number | null;
  latencyDelta: number | null;
  statusChange: string;
}

interface CompareResult {
  baselineRunId: string;
  variantRunId: string;
  suiteId: string;
  baselineAvgScore: number;
  variantAvgScore: number;
  scoreDelta: number;
  baselinePassRate: number;
  variantPassRate: number;
  passRateDelta: number;
  baselineAvgLatencyMs: number;
  variantAvgLatencyMs: number;
  latencyDeltaMs: number;
  pValue: number;
  ci95: [number, number];
  significant: boolean;
  significanceLabel: string;
  alignedCases: number;
  cases: CompareCase[];
}

interface Alert {
  suiteId: string;
  baselineRunId: string;
  latestRunId: string;
  baselineAvgScore: number;
  latestAvgScore: number;
  delta: number;
  threshold: number;
  severity: 'critical' | 'major' | 'minor';
  detectedAt: string;
}

const card: React.CSSProperties = {
  backgroundColor: 'var(--color-a11oy-card, #0c0c0c)',
  border: '1px solid var(--color-a11oy-border, rgba(255,255,255,0.06))',
  borderRadius: 8,
  padding: 16,
};

export default function NexusEvalConsole() {
  const [runs, setRuns] = useState<RunSummary[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [baselineId, setBaselineId] = useState<string>('');
  const [variantId, setVariantId] = useState<string>('');
  const [compare, setCompare] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/evals/runs?limit=50')
      .then((r) => r.json())
      .then((d) => {
        const list: RunSummary[] = (d.runs ?? []).slice(0, 50);
        setRuns(list);
        if (list.length >= 2) {
          setBaselineId(list[1].runId);
          setVariantId(list[0].runId);
        }
      })
      .catch(() => setRuns([]));
    fetch('/api/a11oy/eval/alerts')
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(() => setAlerts([]));
  }, []);

  async function runCompare() {
    if (!baselineId || !variantId) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/a11oy/eval/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baselineRunId: baselineId, variantRunId: variantId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? `HTTP ${r.status}`);
      setCompare(d as CompareResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'compare failed');
      setCompare(null);
    } finally {
      setLoading(false);
    }
  }

  async function pinBaseline() {
    if (!baselineId) return;
    const run = runs.find((r) => r.runId === baselineId);
    if (!run) return;
    await fetch('/api/a11oy/eval/alerts/baseline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suiteId: run.suiteId, runId: baselineId, threshold: 0.05 }),
    });
    const refreshed = await fetch('/api/a11oy/eval/alerts').then((r) => r.json()).catch(() => null);
    if (refreshed) setAlerts(refreshed.alerts ?? []);
  }

  const suiteRuns = useMemo(() => {
    if (!baselineId) return runs;
    const baseRun = runs.find((r) => r.runId === baselineId);
    if (!baseRun) return runs;
    return runs.filter((r) => r.suiteId === baseRun.suiteId);
  }, [runs, baselineId]);

  const sigPill = compare && (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontFamily: 'ui-monospace, monospace',
        background:
          compare.significanceLabel === 'significant_regression'
            ? 'rgba(248,113,113,0.12)'
            : compare.significanceLabel === 'significant_improvement'
              ? 'rgba(34,197,94,0.12)'
              : 'rgba(255,255,255,0.06)',
        color:
          compare.significanceLabel === 'significant_regression'
            ? RED
            : compare.significanceLabel === 'significant_improvement'
              ? GREEN
              : GOLD,
        border: `1px solid ${
          compare.significanceLabel === 'significant_regression'
            ? 'rgba(248,113,113,0.3)'
            : compare.significanceLabel === 'significant_improvement'
              ? 'rgba(34,197,94,0.3)'
              : 'rgba(255,255,255,0.1)'
        }`,
      }}
    >
      {compare.significanceLabel.replace(/_/g, ' ')} · p={compare.pValue.toFixed(4)} · CI95 [
      {compare.ci95[0].toFixed(3)}, {compare.ci95[1].toFixed(3)}]
    </span>
  );

  return (
    <div style={{ padding: 24, color: 'var(--color-a11oy-text, #e5e5e5)' }}>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 2,
            color: 'var(--color-a11oy-text-ghost, #777)',
            fontFamily: 'ui-monospace, monospace',
          }}
        >
          NEXUS / EVAL CONSOLE
        </div>
        <h1 style={{ margin: '4px 0 4px', fontSize: 22 }}>Eval Console</h1>
        <div style={{ fontSize: 12, color: 'var(--color-a11oy-text-sub, #aaa)' }}>
          LangSmith-style run diff with Welch&apos;s t-test significance and
          regression alerts against the pinned baseline.
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{ ...card, borderColor: 'rgba(248,113,113,0.3)', marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: RED, fontFamily: 'ui-monospace, monospace', marginBottom: 8 }}>
            ⚠ REGRESSION ALERTS ({alerts.length})
          </div>
          {alerts.map((a) => (
            <div key={a.latestRunId} style={{ fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: a.severity === 'critical' ? RED : a.severity === 'major' ? AMBER : GOLD }}>
                [{a.severity}]
              </span>{' '}
              suite <strong>{a.suiteId}</strong>: avg score{' '}
              {(a.baselineAvgScore * 100).toFixed(1)}% → {(a.latestAvgScore * 100).toFixed(1)}% (Δ
              {(a.delta * 100).toFixed(2)}%; threshold {(a.threshold * 100).toFixed(0)}%)
            </div>
          ))}
        </div>
      )}

      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>BASELINE RUN</div>
            <select
              value={baselineId}
              onChange={(e) => setBaselineId(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                background: 'rgba(0,0,0,0.4)',
                color: '#eee',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              <option value="">— select —</option>
              {runs.map((r) => (
                <option key={r.runId} value={r.runId}>
                  {r.suiteId} · {r.runId.slice(0, 10)} · {(r.avgScore * 100).toFixed(1)}% · {r.runAt.slice(0, 16)}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>VARIANT RUN</div>
            <select
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              style={{
                width: '100%',
                padding: 8,
                background: 'rgba(0,0,0,0.4)',
                color: '#eee',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                fontSize: 12,
              }}
            >
              <option value="">— select —</option>
              {suiteRuns.map((r) => (
                <option key={r.runId} value={r.runId}>
                  {r.runId.slice(0, 10)} · {(r.avgScore * 100).toFixed(1)}% · {r.runAt.slice(0, 16)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={runCompare}
            disabled={!baselineId || !variantId || loading}
            style={{
              padding: '10px 16px',
              background: 'rgba(201,183,135,0.12)',
              color: GOLD,
              border: '1px solid rgba(201,183,135,0.3)',
              borderRadius: 4,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {loading ? 'Computing…' : 'Diff runs'}
          </button>
          <button
            type="button"
            onClick={pinBaseline}
            disabled={!baselineId}
            style={{
              padding: '10px 16px',
              background: 'rgba(255,255,255,0.04)',
              color: '#ccc',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Pin as regression baseline
          </button>
        </div>
        {error && (
          <div style={{ color: RED, fontSize: 12, marginTop: 8 }}>{error}</div>
        )}
        {runs.length === 0 && (
          <div style={{ marginTop: 12, color: '#888', fontSize: 12 }}>
            No eval runs available yet. Trigger a run via{' '}
            <code>POST /api/evals/run</code> then refresh.
          </div>
        )}
      </div>

      {compare && (
        <>
          <div style={{ ...card, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: '#888', fontFamily: 'ui-monospace, monospace' }}>
                AGGREGATE DIFF · {compare.alignedCases} aligned cases
              </div>
              {sigPill}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <Stat
                label="Avg Score"
                base={`${(compare.baselineAvgScore * 100).toFixed(2)}%`}
                vari={`${(compare.variantAvgScore * 100).toFixed(2)}%`}
                delta={`${compare.scoreDelta >= 0 ? '+' : ''}${(compare.scoreDelta * 100).toFixed(2)}%`}
                positive={compare.scoreDelta >= 0}
              />
              <Stat
                label="Pass Rate"
                base={`${(compare.baselinePassRate * 100).toFixed(1)}%`}
                vari={`${(compare.variantPassRate * 100).toFixed(1)}%`}
                delta={`${compare.passRateDelta >= 0 ? '+' : ''}${(compare.passRateDelta * 100).toFixed(1)}%`}
                positive={compare.passRateDelta >= 0}
              />
              <Stat
                label="Avg Latency"
                base={`${compare.baselineAvgLatencyMs.toFixed(0)}ms`}
                vari={`${compare.variantAvgLatencyMs.toFixed(0)}ms`}
                delta={`${compare.latencyDeltaMs >= 0 ? '+' : ''}${compare.latencyDeltaMs.toFixed(0)}ms`}
                positive={compare.latencyDeltaMs <= 0}
              />
            </div>
          </div>

          <div style={card}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: '#888', fontFamily: 'ui-monospace, monospace', marginBottom: 8 }}>
              PER-CASE DIFF ({compare.cases.length})
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#888', fontSize: 10 }}>
                    <th style={{ padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Case</th>
                    <th style={{ padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>Status</th>
                    <th style={{ padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'right' }}>Baseline</th>
                    <th style={{ padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'right' }}>Variant</th>
                    <th style={{ padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'right' }}>Δ Score</th>
                    <th style={{ padding: '6px 4px', borderBottom: '1px solid rgba(255,255,255,0.06)', textAlign: 'right' }}>Δ Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {compare.cases.map((c) => {
                    const isReg = c.statusChange === 'pass→fail';
                    const isImp = c.statusChange === 'fail→pass';
                    return (
                      <tr key={c.caseId}>
                        <td style={{ padding: '5px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <div style={{ fontWeight: 500 }}>{c.label}</div>
                          <div style={{ fontSize: 10, color: '#666', fontFamily: 'ui-monospace, monospace' }}>{c.caseId}</div>
                        </td>
                        <td style={{ padding: '5px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)', color: isReg ? RED : isImp ? GREEN : '#aaa', fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
                          {c.statusChange}
                        </td>
                        <td style={{ padding: '5px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right' }}>
                          {c.baseline ? `${(c.baseline.score * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ padding: '5px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right' }}>
                          {c.variant ? `${(c.variant.score * 100).toFixed(1)}%` : '—'}
                        </td>
                        <td style={{ padding: '5px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right', color: c.scoreDelta == null ? '#666' : c.scoreDelta < 0 ? RED : c.scoreDelta > 0 ? GREEN : '#aaa' }}>
                          {c.scoreDelta == null ? '—' : `${c.scoreDelta >= 0 ? '+' : ''}${(c.scoreDelta * 100).toFixed(1)}%`}
                        </td>
                        <td style={{ padding: '5px 4px', borderBottom: '1px solid rgba(255,255,255,0.04)', textAlign: 'right', color: c.latencyDelta == null ? '#666' : c.latencyDelta > 0 ? AMBER : '#aaa' }}>
                          {c.latencyDelta == null ? '—' : `${c.latencyDelta >= 0 ? '+' : ''}${c.latencyDelta}ms`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  base,
  vari,
  delta,
  positive,
}: {
  label: string;
  base: string;
  vari: string;
  delta: string;
  positive: boolean;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 6,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 11, color: '#aaa' }}>
        {base} → <span style={{ color: '#eee' }}>{vari}</span>
      </div>
      <div style={{ fontSize: 13, marginTop: 4, color: positive ? GREEN : RED, fontWeight: 600 }}>
        {delta}
      </div>
    </div>
  );
}
