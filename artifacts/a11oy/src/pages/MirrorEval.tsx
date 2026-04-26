import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  BarChart, Bar, Cell,
} from 'recharts';

const GOLD = '#c9b787';
const API = '/api/a11oy';

interface EvalResult {
  id: string; version: string; targetId: string; targetType: string; tenantId: string;
  runAt: string; durationMs: number; modelUsed: string; scores: Record<string, number>;
  composite: number; disposition: string; flags: string[]; gatingBlocked: boolean;
  regressionMatch: boolean; evidenceCoverage: number; hallucinationRisk: number; proofComplete: boolean;
}

interface EvalsData {
  summary: { total: number; passed: number; warned: number; needsEvidence: number; humanReview: number; blocked: number };
  topFailureReasons: Array<{ reason: string; count: number }>;
  evals: EvalResult[];
  regressionSuite: { total: number; passing: number; failing: number; lastRun: string };
  policyComplianceTrend: Array<{ date: string; score: number }>;
  modelComparison: Array<{ model: string; provider: string; evalsRun: number; avgComposite: number }>;
  version: string;
}

const DEMO_EVALS_DATA: EvalsData = {
  summary: { total: 48, passed: 32, warned: 9, needsEvidence: 4, humanReview: 2, blocked: 1 },
  topFailureReasons: [
    { reason: 'insufficient_evidence', count: 4 },
    { reason: 'stale_context', count: 3 },
    { reason: 'hallucination_risk_high', count: 2 },
    { reason: 'scope_violation', count: 1 },
    { reason: 'policy_gate_triggered', count: 1 },
  ],
  evals: [
    { id: 'eval-001', version: '2.1.0', targetId: 'wc-maritime-001', targetType: 'action_brief', tenantId: 'vessels', runAt: new Date(Date.now() - 7200000).toISOString(), durationMs: 840, modelUsed: 'gpt-4o', scores: { groundedness: 0.96, evidence_coverage: 0.94, action_safety: 0.98, hallucination_risk: 0.97, policy_compliance: 0.99, tool_risk: 0.92, stale_context: 0.95, verification_readiness: 0.93, counterfactual_strength: 0.88, causal_validity: 0.90, approval_alignment: 0.96, scope_adherence: 0.97, output_fidelity: 0.94, proof_completeness: 0.95 }, composite: 0.945, disposition: 'pass', flags: [], gatingBlocked: false, regressionMatch: true, evidenceCoverage: 0.94, hallucinationRisk: 0.03, proofComplete: true },
    { id: 'eval-002', version: '2.1.0', targetId: 'wc-counsel-002', targetType: 'action_brief', tenantId: 'counsel', runAt: new Date(Date.now() - 3600000).toISOString(), durationMs: 640, modelUsed: 'claude-3.5-sonnet', scores: { groundedness: 0.99, evidence_coverage: 0.98, action_safety: 0.99, hallucination_risk: 0.99, policy_compliance: 0.99, tool_risk: 0.97, stale_context: 0.98, verification_readiness: 0.97, counterfactual_strength: 0.95, causal_validity: 0.96, approval_alignment: 0.99, scope_adherence: 0.98, output_fidelity: 0.99, proof_completeness: 0.98 }, composite: 0.981, disposition: 'pass', flags: [], gatingBlocked: false, regressionMatch: true, evidenceCoverage: 0.98, hallucinationRisk: 0.01, proofComplete: true },
    { id: 'eval-003', version: '2.1.0', targetId: 'wc-revenue-003', targetType: 'action_brief', tenantId: 'lyte', runAt: new Date(Date.now() - 10800000).toISOString(), durationMs: 820, modelUsed: 'gpt-4o', scores: { groundedness: 0.90, evidence_coverage: 0.85, action_safety: 0.92, hallucination_risk: 0.88, policy_compliance: 0.94, tool_risk: 0.88, stale_context: 0.82, verification_readiness: 0.86, counterfactual_strength: 0.78, causal_validity: 0.80, approval_alignment: 0.88, scope_adherence: 0.91, output_fidelity: 0.87, proof_completeness: 0.89 }, composite: 0.873, disposition: 'pass_with_warning', flags: ['stale_context', 'insufficient_evidence'], gatingBlocked: false, regressionMatch: true, evidenceCoverage: 0.85, hallucinationRisk: 0.12, proofComplete: false },
    { id: 'eval-004', version: '2.1.0', targetId: 'wc-defense-001', targetType: 'action_brief', tenantId: 'aegis', runAt: new Date(Date.now() - 21600000).toISOString(), durationMs: 980, modelUsed: 'claude-3.5-sonnet', scores: { groundedness: 0.99, evidence_coverage: 0.98, action_safety: 0.99, hallucination_risk: 0.99, policy_compliance: 0.99, tool_risk: 0.98, stale_context: 0.99, verification_readiness: 0.97, counterfactual_strength: 0.96, causal_validity: 0.97, approval_alignment: 0.99, scope_adherence: 0.99, output_fidelity: 0.99, proof_completeness: 0.98 }, composite: 0.985, disposition: 'pass', flags: [], gatingBlocked: false, regressionMatch: true, evidenceCoverage: 0.98, hallucinationRisk: 0.01, proofComplete: true },
    { id: 'eval-005', version: '2.1.0', targetId: 'wc-terra-005', targetType: 'action_brief', tenantId: 'terra', runAt: new Date(Date.now() - 43200000).toISOString(), durationMs: 760, modelUsed: 'gpt-4o', scores: { groundedness: 0.88, evidence_coverage: 0.82, action_safety: 0.90, hallucination_risk: 0.87, policy_compliance: 0.89, tool_risk: 0.85, stale_context: 0.80, verification_readiness: 0.84, counterfactual_strength: 0.75, causal_validity: 0.78, approval_alignment: 0.86, scope_adherence: 0.88, output_fidelity: 0.85, proof_completeness: 0.82 }, composite: 0.842, disposition: 'needs_more_evidence', flags: ['stale_context', 'insufficient_evidence'], gatingBlocked: false, regressionMatch: false, evidenceCoverage: 0.82, hallucinationRisk: 0.13, proofComplete: false },
    { id: 'eval-006', version: '2.1.0', targetId: 'wc-finance-001', targetType: 'policy_eval', tenantId: 'alloy', runAt: new Date(Date.now() - 1800000).toISOString(), durationMs: 120, modelUsed: 'internal', scores: { groundedness: 0.55, evidence_coverage: 0.50, action_safety: 0.60, hallucination_risk: 0.70, policy_compliance: 0.42, tool_risk: 0.65, stale_context: 0.75, verification_readiness: 0.55, counterfactual_strength: 0.45, causal_validity: 0.48, approval_alignment: 0.50, scope_adherence: 0.55, output_fidelity: 0.60, proof_completeness: 0.45 }, composite: 0.552, disposition: 'blocked', flags: ['policy_gate_triggered', 'scope_violation'], gatingBlocked: true, regressionMatch: false, evidenceCoverage: 0.50, hallucinationRisk: 0.30, proofComplete: false },
  ],
  regressionSuite: { total: 124, passing: 119, failing: 5, lastRun: new Date(Date.now() - 3600000).toISOString() },
  policyComplianceTrend: [0.92, 0.94, 0.93, 0.95, 0.96, 0.94, 0.95].map((score, i) => ({ date: `D-${6 - i}`, score })),
  modelComparison: [
    { model: 'gpt-4o', provider: 'openai', evalsRun: 28, avgComposite: 0.88 },
    { model: 'claude-3.5', provider: 'anthropic', evalsRun: 16, avgComposite: 0.95 },
    { model: 'gpt-4o-mini', provider: 'openai', evalsRun: 3, avgComposite: 0.81 },
    { model: 'o3-mini', provider: 'openai', evalsRun: 1, avgComposite: 0.79 },
  ],
  version: '2.1.0',
};

const DISP_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  pass: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'PASS' },
  pass_with_warning: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'PASS W/ WARNING' },
  needs_more_evidence: { color: GOLD, bg: 'rgba(201,183,135,0.08)', label: 'NEEDS EVIDENCE' },
  requires_human_review: { color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', label: 'HUMAN REVIEW' },
  blocked: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'BLOCKED' },
};

const DIM_LABELS: Record<string, string> = {
  groundedness: 'Groundedness',
  evidence_coverage: 'Evidence Coverage',
  action_safety: 'Action Safety',
  hallucination_risk: 'Hallucination Risk',
  policy_compliance: 'Policy Compliance',
  tool_risk: 'Tool Risk',
  stale_context: 'Stale Context',
  verification_readiness: 'Verification Readiness',
  counterfactual_strength: 'Counterfactual Strength',
  causal_validity: 'Causal Validity',
  approval_alignment: 'Approval Alignment',
  scope_adherence: 'Scope Adherence',
  output_fidelity: 'Output Fidelity',
  proof_completeness: 'Proof Completeness',
};

const DIM_KEYS = Object.keys(DIM_LABELS);

const AGENT_SPARKLINES: Record<string, number[]> = {
  'Cascade Navigator': [88, 91, 89, 94, 92, 95, 97],
  'Counsel Sentinel':  [96, 97, 98, 97, 99, 98, 99],
  'Pipeline Oracle':   [82, 85, 88, 86, 90, 89, 91],
  'Guardian':          [95, 97, 98, 97, 99, 98, 99],
  'DOMAINE Analyst':   [80, 83, 85, 84, 87, 86, 88],
};

const REGRESSION_30D = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  passing: Math.floor(85 + Math.sin(i * 0.4) * 5 + i * 0.2),
  failing: Math.floor(8 - i * 0.1 + Math.cos(i * 0.3) * 2),
}));

const REGRESSION_7D = REGRESSION_30D.slice(-7).map((d, i) => ({ ...d, label: `D-${6 - i}` }));

function AgentSparkline({ data, label, score }: { data: number[]; label: string; score: number }) {
  const chartData = data.map((v, i) => ({ i, v }));
  const scoreColor = score >= 95 ? '#22c55e' : score >= 88 ? GOLD : '#f97316';
  return (
    <div className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{label}</span>
        <span className="text-xs font-mono font-bold" style={{ color: scoreColor }}>{score}</span>
      </div>
      <ResponsiveContainer width="100%" height={36}>
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line type="monotone" dataKey="v" stroke={scoreColor} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>7-day trend</div>
    </div>
  );
}

function DimRadar({ scores }: { scores: Record<string, number> }) {
  const data = DIM_KEYS.map(k => ({
    dimension: DIM_LABELS[k]?.split(' ')[0] ?? k,
    score: Math.round((scores[k] ?? 0) * 100),
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
        <PolarGrid stroke="rgba(255,255,255,0.06)" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#5e5e5e', fontSize: 9, fontFamily: 'ui-monospace' }} />
        <Radar dataKey="score" stroke={GOLD} fill={GOLD} fillOpacity={0.15} strokeWidth={1.5} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function ModelRadar({ models }: { models: Array<{ model: string; avgComposite: number }> }) {
  const colors = [GOLD, '#8a8a8a', '#4a9eff', '#22c55e', '#a78bfa'];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={models} margin={{ top: 0, right: 8, bottom: 24, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="model" tick={{ fill: '#5e5e5e', fontSize: 9 }} angle={-15} textAnchor="end" />
        <YAxis tick={{ fill: '#5e5e5e', fontSize: 9 }} domain={[0.7, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} />
        <Tooltip
          contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, fontSize: 10 }}
          formatter={(v: number) => [`${Math.round(v * 100)}%`, 'Avg Composite']}
        />
        <Bar dataKey="avgComposite" radius={[3, 3, 0, 0]}>
          {models.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} fillOpacity={0.8} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MirrorEval() {
  const [data, setData] = useState<EvalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EvalResult | null>(null);
  const [filterDisp, setFilterDisp] = useState('all');
  const [regressionView, setRegressionView] = useState<'7d' | '30d'>('7d');

  useEffect(() => {
    fetch(`${API}/evals/sovereign`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d.data); else setData(DEMO_EVALS_DATA); })
      .catch(() => setData(DEMO_EVALS_DATA))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data?.evals.filter(e => filterDisp === 'all' || e.disposition === filterDisp) ?? [];
  const regressionData = regressionView === '7d' ? REGRESSION_7D : REGRESSION_30D.map((d, i) => ({ ...d, label: `D${i + 1}` }));

  return (
    <Layout>
      <PageHeader
        label="MIRROREVAL 2.0"
        title="14-Dimension Evaluation Harness"
        subtitle="Every action brief, tool plan, and board packet is scored across 14 dimensions before it can proceed. Regression trends, per-agent sparklines, and multi-model radar charts."
        status="DEMO"
      />

      {loading ? (
        <div className="text-xs animate-pulse mb-8" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Loading eval dashboard…</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <KpiCard label="TOTAL EVALS" value={String(data.summary.total)} sub={`v${data.version}`} accent="#8a8a8a" />
            <KpiCard label="PASSED" value={String(data.summary.passed)} sub="full pass" accent="#22c55e" />
            <KpiCard label="WARNED" value={String(data.summary.warned)} sub="pass w/ warning" accent="#f97316" />
            <KpiCard label="NEEDS EVIDENCE" value={String(data.summary.needsEvidence)} sub="pending" accent={GOLD} />
            <KpiCard label="HUMAN REVIEW" value={String(data.summary.humanReview)} sub="elevated" accent="#a78bfa" />
            <KpiCard label="BLOCKED" value={String(data.summary.blocked)} sub="gating enforced" accent="#ef4444" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            <div>
              <div className="flex items-center justify-between mb-2">
                <SectionTitle>Regression Trend</SectionTitle>
                <div className="flex gap-1">
                  {(['7d', '30d'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setRegressionView(v)}
                      className="text-xs px-2 py-0.5 rounded font-mono"
                      style={{
                        backgroundColor: regressionView === v ? 'rgba(201,183,135,0.15)' : 'var(--color-a11oy-muted)',
                        color: regressionView === v ? GOLD : 'var(--color-a11oy-text-ghost)',
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <Card>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={regressionData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="label" tick={{ fill: '#5e5e5e', fontSize: 9 }} />
                    <YAxis tick={{ fill: '#5e5e5e', fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, fontSize: 10 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 10, color: '#8a8a8a' }} />
                    <Line type="monotone" dataKey="passing" stroke="#22c55e" strokeWidth={1.5} dot={false} name="Passing" />
                    <Line type="monotone" dataKey="failing" stroke="#ef4444" strokeWidth={1.5} dot={false} name="Failing" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-3 mt-3 text-xs">
                  <div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Total cases</div>
                    <div className="font-mono" style={{ color: 'var(--color-a11oy-text-sub)' }}>{data.regressionSuite.total}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Passing</div>
                    <div className="font-mono" style={{ color: '#22c55e' }}>{data.regressionSuite.passing}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Failing</div>
                    <div className="font-mono" style={{ color: data.regressionSuite.failing > 0 ? '#ef4444' : GOLD }}>{data.regressionSuite.failing}</div>
                  </div>
                </div>
              </Card>
            </div>

            <div>
              <SectionTitle>Model Comparison</SectionTitle>
              <Card>
                <ModelRadar models={data.modelComparison} />
              </Card>
            </div>

            <div>
              <SectionTitle>Top Failure Reasons</SectionTitle>
              <Card>
                <div className="space-y-2">
                  {data.topFailureReasons.map((r, i) => {
                    const maxCount = Math.max(...data.topFailureReasons.map(x => x.count));
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{r.reason.replace(/_/g, ' ')}</span>
                          <span className="font-mono" style={{ color: GOLD }}>{r.count}</span>
                        </div>
                        <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                          <div className="h-1 rounded-full" style={{ width: `${(r.count / maxCount) * 100}%`, backgroundColor: GOLD, opacity: 0.7 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>

          <SectionTitle>Per-Agent Performance Sparklines</SectionTitle>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
            {Object.entries(AGENT_SPARKLINES).map(([name, scores]) => (
              <AgentSparkline key={name} data={scores} label={name} score={scores[scores.length - 1]} />
            ))}
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Disposition:</span>
            {['all', ...Object.keys(DISP_STYLE)].map(d => {
              const style = DISP_STYLE[d];
              return (
                <button
                  key={d}
                  onClick={() => setFilterDisp(d)}
                  className="text-xs px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: filterDisp === d ? (style?.bg ?? 'rgba(201,183,135,0.2)') : 'var(--color-a11oy-muted)',
                    color: filterDisp === d ? (style?.color ?? GOLD) : 'var(--color-a11oy-text-ghost)',
                    border: `1px solid ${filterDisp === d ? (style?.color ?? GOLD) + '40' : 'var(--color-a11oy-border)'}`,
                    cursor: 'pointer',
                  }}
                >
                  {d === 'all' ? 'All' : (style?.label ?? d)}
                </button>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SectionTitle>Eval Results ({filtered.length})</SectionTitle>
              <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
                {filtered.map(e => {
                  const style = DISP_STYLE[e.disposition] ?? DISP_STYLE.pass;
                  return (
                    <Card
                      key={e.id}
                      className="cursor-pointer hover:opacity-90"
                      onClick={() => setSelected(e)}
                      style={{ borderColor: selected?.id === e.id ? GOLD : 'var(--color-a11oy-border)' } as React.CSSProperties}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.id} · {e.tenantId} · {e.targetType}</div>
                          <div className="text-xs font-mono mt-0.5 truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.targetId}</div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: style.color, backgroundColor: style.bg }}>{style.label}</span>
                          <span className="text-xs font-mono font-bold" style={{ color: e.composite >= 0.8 ? '#22c55e' : e.composite >= 0.6 ? GOLD : '#ef4444' }}>
                            {Math.round(e.composite * 100)}%
                          </span>
                        </div>
                      </div>
                      {e.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {e.flags.map(f => (
                            <span key={f} className="text-xs px-1 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444' }}>{f.replace(/_/g, ' ')}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs">
                        <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{new Date(e.runAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.durationMs}ms</span>
                        {e.gatingBlocked && <span style={{ color: '#ef4444' }}>⊗ blocked</span>}
                        {e.proofComplete && <span style={{ color: '#22c55e' }}>◇ proof complete</span>}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              {selected ? (
                <>
                  <SectionTitle>14-Dimension Radar</SectionTitle>
                  <Card>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base font-mono font-bold" style={{ color: selected.composite >= 0.8 ? '#22c55e' : selected.composite >= 0.6 ? GOLD : '#ef4444' }}>
                        {Math.round(selected.composite * 100)}%
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: DISP_STYLE[selected.disposition]?.color, backgroundColor: DISP_STYLE[selected.disposition]?.bg }}>
                        {DISP_STYLE[selected.disposition]?.label}
                      </span>
                    </div>
                    <DimRadar scores={selected.scores} />
                    <div className="mt-3 space-y-1">
                      {Object.entries(selected.scores).slice(0, 7).map(([dim, score]) => {
                        const pct = Math.round((score as number) * 100);
                        const color = pct >= 80 ? '#22c55e' : pct >= 60 ? GOLD : '#ef4444';
                        return (
                          <div key={dim} className="flex items-center justify-between text-xs">
                            <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{DIM_LABELS[dim]?.split(' ')[0]}</span>
                            <span className="font-mono" style={{ color }}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                    {selected.gatingBlocked && (
                      <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        ⊗ Gating blocked — action cannot proceed
                      </div>
                    )}
                  </Card>
                </>
              ) : (
                <>
                  <SectionTitle>Policy Compliance Trend</SectionTitle>
                  <Card>
                    <div className="flex items-end gap-1.5 h-24 mb-2">
                      {data.policyComplianceTrend.map((d, i) => {
                        const pct = Math.round(d.score * 100);
                        const color = pct >= 90 ? '#22c55e' : pct >= 80 ? GOLD : '#ef4444';
                        return (
                          <div key={i} title={`${pct}%`} className="flex-1 flex flex-col items-center">
                            <div className="w-full rounded-t-sm" style={{ height: `${pct * 0.9}%`, backgroundColor: color, opacity: 0.7, minHeight: 4 }} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>7 days</span>
                      <span style={{ color: GOLD }}>{Math.round((data.policyComplianceTrend[data.policyComplianceTrend.length - 1]?.score ?? 0) * 100)}% today</span>
                    </div>
                    <div className="mt-3 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Select an eval result to view its 14-dimension radar.
                    </div>
                  </Card>
                </>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Eval dashboard unavailable.</div>
      )}

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)] flex-shrink-0" /> Governed Environment — MirrorEval 2.0 scores are from the seed eval suite. Blocked dispositions prevent action execution in the live runtime — this behavior is real.
      </div>
    </Layout>
  );
}
