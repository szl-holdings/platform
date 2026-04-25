import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, DemoBadge } from '../components/ui';

const API = '/api/a11oy';

interface EvalScore { dimension: string; score: number; }
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

const DISP_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  pass: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'PASS' },
  pass_with_warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'PASS W/ WARNING' },
  needs_more_evidence: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', label: 'NEEDS EVIDENCE' },
  requires_human_review: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'HUMAN REVIEW' },
  blocked: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'BLOCKED' },
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

function ScorePill({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <span className="text-xs font-mono px-1 rounded" style={{ color, backgroundColor: `${color}18` }}>{pct}</span>
  );
}

export function MirrorEval() {
  const [data, setData] = useState<EvalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EvalResult | null>(null);
  const [filterDisp, setFilterDisp] = useState('all');

  useEffect(() => {
    fetch(`${API}/evals/sovereign`)
      .then(r => r.json())
      .then(d => { if (d.ok) setData(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = data?.evals.filter(e => filterDisp === 'all' || e.disposition === filterDisp) ?? [];

  return (
    <Layout>
      <PageHeader
        label="MIRROREVAL 2.0"
        title="14-Dimension Evaluation Suite"
        subtitle="Every Action Brief, tool plan, Board Packet, and Proof Packet is scored across 14 dimensions before it can proceed. Five dispositions from pass to blocked."
        status="DEMO"
      />

      {loading ? (
        <div className="text-xs animate-pulse mb-8" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Loading eval dashboard…</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <KpiCard label="TOTAL EVALS" value={String(data.summary.total)} sub={`v${data.version}`} accent="#8b5cf6" />
            <KpiCard label="PASSED" value={String(data.summary.passed)} sub="pass" accent="#10b981" />
            <KpiCard label="WARNED" value={String(data.summary.warned)} sub="pass w/ warning" accent="#f59e0b" />
            <KpiCard label="NEEDS EVIDENCE" value={String(data.summary.needsEvidence)} sub="blocked pending" accent="#f59e0b" />
            <KpiCard label="HUMAN REVIEW" value={String(data.summary.humanReview)} sub="elevated" accent="#ef4444" />
            <KpiCard label="BLOCKED" value={String(data.summary.blocked)} sub="gating enforced" accent="#ef4444" />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mb-8">
            <Card>
              <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>TOP FAILURE REASONS</div>
              <div className="space-y-2">
                {data.topFailureReasons.map((r, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{r.reason.replace(/_/g, ' ')}</span>
                    <span className="font-mono" style={{ color: '#f59e0b' }}>{r.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>REGRESSION SUITE</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between"><span style={{ color: 'var(--color-a11oy-text-sub)' }}>Total cases</span><span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{data.regressionSuite.total}</span></div>
                <div className="flex items-center justify-between"><span style={{ color: 'var(--color-a11oy-text-sub)' }}>Passing</span><span className="font-mono" style={{ color: '#10b981' }}>{data.regressionSuite.passing}</span></div>
                <div className="flex items-center justify-between"><span style={{ color: 'var(--color-a11oy-text-sub)' }}>Failing</span><span className="font-mono" style={{ color: data.regressionSuite.failing > 0 ? '#ef4444' : '#10b981' }}>{data.regressionSuite.failing}</span></div>
                <div className="flex items-center justify-between"><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Last run</span><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{new Date(data.regressionSuite.lastRun).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span></div>
              </div>
            </Card>

            <Card>
              <div className="text-xs font-semibold mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>MODEL COMPARISON</div>
              <div className="space-y-2">
                {data.modelComparison.map(m => (
                  <div key={m.model} className="text-xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{m.model}</span>
                      <span className="font-mono" style={{ color: m.avgComposite >= 0.85 ? '#10b981' : '#f59e0b' }}>
                        {Math.round(m.avgComposite * 100)}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                      <div className="h-1 rounded-full" style={{ width: `${Math.round(m.avgComposite * 100)}%`, backgroundColor: m.avgComposite >= 0.85 ? '#10b981' : '#f59e0b' }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Disposition:</span>
            {['all', 'pass', 'pass_with_warning', 'needs_more_evidence', 'requires_human_review', 'blocked'].map(d => {
              const style = DISP_STYLE[d];
              return (
                <button key={d} onClick={() => setFilterDisp(d)} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: filterDisp === d ? (style?.bg ?? 'rgba(59,130,246,0.2)') : 'var(--color-a11oy-muted)', color: filterDisp === d ? (style?.color ?? '#3b82f6') : 'var(--color-a11oy-text-ghost)', border: `1px solid ${filterDisp === d ? (style?.color ?? '#3b82f6') + '40' : 'var(--color-a11oy-border)'}` }}>
                  {d === 'all' ? 'all' : (style?.label ?? d)}
                </button>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SectionTitle>Eval Results ({filtered.length})</SectionTitle>
              <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
                {filtered.map(e => {
                  const style = DISP_STYLE[e.disposition] ?? DISP_STYLE.pass;
                  return (
                    <Card key={e.id} className={`cursor-pointer hover:opacity-80 ${selected?.id === e.id ? 'ring-1 ring-blue-500/30' : ''}`} onClick={() => setSelected(e)}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.id} · {e.tenantId} · {e.targetType}</div>
                          <div className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{e.targetId}</div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ color: style.color, backgroundColor: style.bg }}>{style.label}</span>
                          <span className="text-xs font-mono" style={{ color: e.composite >= 0.8 ? '#10b981' : e.composite >= 0.6 ? '#f59e0b' : '#ef4444' }}>
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
                        {e.gatingBlocked && <span style={{ color: '#ef4444' }}>⊗ gating blocked</span>}
                        {e.proofComplete && <span style={{ color: '#10b981' }}>◇ proof complete</span>}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div>
              {selected ? (
                <>
                  <SectionTitle>14-Dimension Scores</SectionTitle>
                  <Card>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm font-mono font-bold" style={{ color: selected.composite >= 0.8 ? '#10b981' : selected.composite >= 0.6 ? '#f59e0b' : '#ef4444' }}>
                        {Math.round(selected.composite * 100)}%
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ color: DISP_STYLE[selected.disposition]?.color, backgroundColor: DISP_STYLE[selected.disposition]?.bg }}>
                        {DISP_STYLE[selected.disposition]?.label}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {Object.entries(selected.scores).map(([dim, score]) => {
                        const pct = Math.round((score as number) * 100);
                        const color = pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444';
                        return (
                          <div key={dim}>
                            <div className="flex items-center justify-between text-xs mb-0.5">
                              <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{DIM_LABELS[dim] ?? dim}</span>
                              <ScorePill score={score as number} />
                            </div>
                            <div className="h-1 rounded-full" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
                              <div className="h-1 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {selected.gatingBlocked && (
                      <div className="mt-3 p-2 rounded text-xs" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                        ⊗ Gating blocked — action cannot proceed until disposition improves
                      </div>
                    )}
                  </Card>
                </>
              ) : (
                <>
                  <SectionTitle>Policy Compliance Trend</SectionTitle>
                  <Card>
                    <div className="flex items-end gap-1.5 h-20 mb-2">
                      {data.policyComplianceTrend.map((d, i) => {
                        const pct = Math.round(d.score * 100);
                        const color = pct >= 90 ? '#10b981' : pct >= 80 ? '#f59e0b' : '#ef4444';
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full rounded-sm" style={{ height: `${pct * 0.8}%`, backgroundColor: color, minHeight: 4 }} />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>7 days</span>
                      <span style={{ color: '#10b981' }}>{Math.round((data.policyComplianceTrend[data.policyComplianceTrend.length - 1]?.score ?? 0) * 100)}% today</span>
                    </div>
                    <div className="mt-3 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      Select an eval result to view 14-dimension scores.
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

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> MirrorEval 2.0 — demo mode. All eval results are seeded. Blocked dispositions prevent execution in the real runtime.
      </div>
    </Layout>
  );
}
