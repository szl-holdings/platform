import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useApiData } from '../hooks/useApiData';

const T = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5',
  dim: '#8a8a8a',
  muted: '#5e5e5e',
  accent: '#c9b787',
  gold: '#b08d52',
};

type AmendmentStatus = 'pending' | 'accepted' | 'rejected' | 'monitoring';

interface LutarAxes9 {
  cleanliness: number;
  horizon: number;
  resonance: number;
  frustum: number;
  gaussClosure: number;
  invariance: number;
  moralGrounding: number;
  ontologicalGrounding: number;
  measurabilityHonesty: number;
}

interface AmendmentProposal {
  id: string;
  title: string;
  policyId: string;
  policyName: string;
  domain: string;
  type: 'lower_ceiling' | 'raise_floor' | 'relax_redline' | 'tighten_redline' | 'remove_gate';
  evidence: {
    blockRate: number;
    overrideApprovalRate: number;
    avgApprovalLatencyMs: number;
    outcomeSuccessRate: number;
    sampleSize: number;
  };
  recommendation: string;
  impact: string;
  confidenceScore: number;
  status: AmendmentStatus;
  proposedAt: string;
  decidedAt?: string;
  decidedBy?: string;
  proofHash?: string;
  metaOutcome?: string;
  // ─── Real engine fields (ouroboros-invariant + codex-kernel) ─────────
  lambdaAxes?: LutarAxes9;
  lutarInvariant?: number;
  lutarFormula?: string;
  codexReceiptId?: string;
  prevReceiptId?: string;
}

const LAMBDA_AXIS_KEYS: Array<{ k: keyof LutarAxes9; short: string; long: string }> = [
  { k: 'cleanliness',           short: 'C', long: 'Cleanliness (canon refusal)' },
  { k: 'horizon',               short: 'H', long: 'Horizon / page-curve' },
  { k: 'resonance',             short: 'R', long: 'Resonance / Q-factor' },
  { k: 'frustum',               short: 'F', long: 'Frustum / Newton symmetry' },
  { k: 'gaussClosure',          short: 'G', long: 'Gauss closure' },
  { k: 'invariance',            short: 'I', long: 'Invariance / relabel' },
  { k: 'moralGrounding',        short: 'M', long: 'Moral / Oppenheimer' },
  { k: 'ontologicalGrounding',  short: 'B', long: 'Being / Socrates' },
  { k: 'measurabilityHonesty',  short: 'N', long: 'Non-measurability / Lara' },
];

function LambdaAxesBar({ axes, invariant }: { axes: LutarAxes9; invariant: number }) {
  return (
    <div className="mt-2 mb-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] font-mono" style={{ color: T.muted }}>Λ₉ AXES</span>
        <span className="text-[9px] font-mono" style={{ color: T.accent }}>
          Λ = {invariant.toFixed(3)}
        </span>
        <span className="text-[8px] font-mono" style={{ color: T.muted }}>
          ouroboros-invariant@lutarInvariant9
        </span>
      </div>
      <div className="flex items-end gap-1 h-7">
        {LAMBDA_AXIS_KEYS.map(({ k, short, long }) => {
          const v = axes[k];
          return (
            <div key={k} className="flex-1 flex flex-col items-center" title={`${long}: ${v.toFixed(3)}`}>
              <div className="w-full h-5 rounded-sm relative" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-sm"
                  style={{ height: `${Math.max(4, v * 100)}%`, background: T.accent, opacity: 0.85 }}
                />
              </div>
              <div className="text-[8px] font-mono mt-0.5" style={{ color: T.muted }}>{short}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface PolicyHealth {
  policyId: string;
  name: string;
  domain: string;
  status: 'healthy' | 'over_restrictive' | 'under_utilized' | 'watch';
  blockRate: number;
  overrideApprovalRate: number;
  avgLatencyMs: number;
  utilization: number;
  insight: string;
}

const STATUS_STYLE: Record<AmendmentStatus, { color: string; label: string }> = {
  pending: { color: '#c9b787', label: 'PENDING REVIEW' },
  accepted: { color: '#22c55e', label: 'ACCEPTED' },
  rejected: { color: '#ef4444', label: 'REJECTED' },
  monitoring: { color: '#8a8a8a', label: 'MONITORING' },
};

const HEALTH_STYLE: Record<string, { color: string; label: string }> = {
  healthy: { color: '#22c55e', label: 'HEALTHY' },
  over_restrictive: { color: '#f97316', label: 'OVER-RESTRICTIVE' },
  under_utilized: { color: '#a78bfa', label: 'UNDER-UTILIZED' },
  watch: { color: '#c9b787', label: 'WATCH' },
};

const TYPE_LABEL: Record<string, string> = {
  lower_ceiling: 'Lower Autonomy Ceiling',
  raise_floor: 'Raise Confidence Floor',
  relax_redline: 'Relax Redline',
  tighten_redline: 'Tighten Redline',
  remove_gate: 'Remove Gate',
};

const API_BASE = '/api/a11oy';

function AmendmentCard({ proposal, onDecide }: { proposal: AmendmentProposal; onDecide: (id: string, decision: 'accepted' | 'rejected') => void }) {
  const [expanded, setExpanded] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const style = STATUS_STYLE[proposal.status];
  const isPending = proposal.status === 'pending';

  const [decideError, setDecideError] = useState<string | null>(null);
  const handleDecision = async (decision: 'accepted' | 'rejected') => {
    setDeciding(true);
    setDecideError(null);
    try {
      await onDecide(proposal.id, decision);
    } catch (e) {
      setDecideError(e instanceof Error ? e.message : 'Decision failed — proof not chained');
    } finally {
      setDeciding(false);
    }
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${T.accent}18`, color: T.accent }}>{proposal.domain}</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: T.dim }}>{TYPE_LABEL[proposal.type]}</span>
          </div>
          <div className="text-sm font-semibold mb-1" style={{ color: T.text }}>{proposal.title}</div>
          <div className="text-[10px] font-mono" style={{ color: T.muted }}>{proposal.policyName} · {proposal.policyId}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-[9px] font-mono px-2 py-1 rounded" style={{ background: `${style.color}18`, color: style.color }}>{style.label}</span>
          {proposal.codexReceiptId && (
            <span className="text-[8px] font-mono" style={{ color: T.muted }} title={`codex-kernel chainHash receipt · prev: ${proposal.prevReceiptId ?? 'genesis'}`}>
              codex {proposal.codexReceiptId.slice(0, 14)}…
            </span>
          )}
          {!proposal.codexReceiptId && proposal.proofHash && (
            <span className="text-[8px] font-mono" style={{ color: T.muted }}>{proposal.proofHash.slice(0, 20)}…</span>
          )}
        </div>
      </div>

      {proposal.lambdaAxes && proposal.lutarInvariant !== undefined && (
        <LambdaAxesBar axes={proposal.lambdaAxes} invariant={proposal.lutarInvariant} />
      )}

      {decideError && (
        <div className="mb-2 p-2 rounded text-[10px] font-mono"
          style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
          ⨯ {decideError}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'BLOCK RATE', value: `${Math.round(proposal.evidence.blockRate * 100)}%` },
          { label: 'OVERRIDE APPROVED', value: `${Math.round(proposal.evidence.overrideApprovalRate * 100)}%` },
          { label: 'AVG LATENCY', value: `${(proposal.evidence.avgApprovalLatencyMs / 1000).toFixed(1)}s` },
          { label: 'OUTCOME SUCCESS', value: `${Math.round(proposal.evidence.outcomeSuccessRate * 100)}%` },
        ].map(({ label, value }) => (
          <div key={label} className="text-center p-2 rounded" style={{ background: T.surface }}>
            <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>{label}</div>
            <div className="text-xs font-semibold font-mono" style={{ color: T.accent }}>{value}</div>
          </div>
        ))}
      </div>

      <p className="text-xs mb-2" style={{ color: T.dim, lineHeight: 1.6 }}>{proposal.recommendation}</p>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono" style={{ color: T.muted }}>CONFIDENCE</span>
          <div className="w-20 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-full rounded-full" style={{ width: `${proposal.confidenceScore * 100}%`, background: T.accent }} />
          </div>
          <span className="text-[10px] font-mono" style={{ color: T.accent }}>{Math.round(proposal.confidenceScore * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[10px] font-mono px-2 py-1 rounded" style={{ color: T.dim, background: T.surface }} onClick={() => setExpanded(!expanded)}>
            {expanded ? 'LESS' : 'DETAILS'}
          </button>
          {isPending && (
            <>
              <button
                onClick={() => handleDecision('rejected')}
                disabled={deciding}
                className="text-[10px] font-mono px-2 py-1 rounded border"
                style={{ color: deciding ? T.muted : '#ef4444', borderColor: 'rgba(239,68,68,0.3)', opacity: deciding ? 0.5 : 1 }}
              >
                REJECT
              </button>
              <button
                onClick={() => handleDecision('accepted')}
                disabled={deciding}
                className="text-[10px] font-mono px-3 py-1 rounded"
                style={{ background: `${T.accent}22`, color: deciding ? T.muted : T.accent, border: `1px solid ${T.accent}44`, opacity: deciding ? 0.5 : 1 }}
              >
                {deciding ? 'PROOF-CHAINING…' : 'ACCEPT & PROOF-CHAIN'}
              </button>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${T.border}` }}>
          <div className="text-[10px] font-mono mb-1" style={{ color: T.muted }}>PROJECTED IMPACT</div>
          <p className="text-xs mb-2" style={{ color: T.dim }}>{proposal.impact}</p>
          <div className="text-[10px] font-mono mb-1" style={{ color: T.muted }}>SAMPLE SIZE</div>
          <p className="text-xs mb-2" style={{ color: T.dim }}>{proposal.evidence.sampleSize} decisions analyzed</p>
          {proposal.decidedBy && (
            <>
              <div className="text-[10px] font-mono mb-1" style={{ color: T.muted }}>DECIDED BY</div>
              <p className="text-xs mb-2" style={{ color: T.dim }}>{proposal.decidedBy} · {proposal.decidedAt ? new Date(proposal.decidedAt).toLocaleString() : ''}</p>
            </>
          )}
          {proposal.metaOutcome && (
            <>
              <div className="text-[10px] font-mono mb-1" style={{ color: '#22c55e' }}>META-LOOP OUTCOME</div>
              <p className="text-xs" style={{ color: '#86efac' }}>{proposal.metaOutcome}</p>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

export function AdaptiveGovernance() {
  const [activeTab, setActiveTab] = useState<'proposals' | 'health' | 'timeline' | 'trust' | 'meta'>('proposals');

  const { data: apiAmendments, loading: amendmentsLoading } = useApiData<AmendmentProposal[]>('/adaptive/governance/amendments');
  const { data: policyHealth } = useApiData<PolicyHealth[]>('/adaptive/governance/policies/health');
  const { data: timeline } = useApiData<unknown[]>('/adaptive/governance/timeline');
  const { data: metaLoop } = useApiData<Array<{ month: string; accepted: number; improved: number; total: number }>>('/adaptive/governance/meta-loop');
  const { data: trustTrajectory } = useApiData<unknown[]>('/adaptive/governance/trust-trajectory');

  const [proposals, setProposals] = useState<AmendmentProposal[]>([]);

  useEffect(() => {
    if (apiAmendments) setProposals(apiAmendments);
  }, [apiAmendments]);

  const pending = proposals.filter(p => p.status === 'pending').length;
  const accepted = proposals.filter(p => p.status === 'accepted').length;
  const metaSuccessRate = metaLoop
    ? Math.round((metaLoop.reduce((a, d) => a + d.improved, 0) / Math.max(1, metaLoop.reduce((a, d) => a + d.accepted, 0))) * 100)
    : 0;

  const handleDecide = async (id: string, decision: 'accepted' | 'rejected') => {
    const res = await fetch(`${API_BASE}/adaptive/governance/amendments/${id}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, decidedBy: 'operator' }),
    });
    if (!res.ok) {
      throw new Error(`Codex chain-write failed (${res.status}) — amendment NOT decided`);
    }
    const json = await res.json() as { ok: boolean; data: AmendmentProposal; error?: string };
    if (!json.ok || !json.data) {
      throw new Error(json.error ?? 'Engine refused decision (no codex receipt returned)');
    }
    setProposals(prev => prev.map(p => p.id === id ? json.data : p));
  };

  const TABS = [
    { id: 'proposals', label: 'Amendment Proposals' },
    { id: 'health', label: 'Policy Health' },
    { id: 'timeline', label: 'Evolution Timeline' },
    { id: 'trust', label: 'Trust Trajectories' },
    { id: 'meta', label: 'Meta-Loop' },
  ] as const;

  return (
    <Layout>
      <PageHeader
        label="ADAPTIVE GOVERNANCE · A11OY.1"
        title="Adaptive Governance Loop"
        subtitle="Data-driven policy amendment proposals backed by outcome evidence. Every amendment decision is proof-chained. The meta-loop tracks whether accepted amendments actually improved outcomes."
        status="LIVE"
      />

      <div className="mb-6 p-4 rounded-lg border" style={{ background: 'rgba(176,141,82,0.06)', borderColor: 'rgba(176,141,82,0.25)' }}>
        <div className="text-xs font-semibold mb-1" style={{ color: T.gold }}>Constitutional Principle</div>
        <div className="text-xs" style={{ color: T.dim, lineHeight: 1.7 }}>
          The constitution evolves through governed amendment — not silent drift. Every amendment proposal is evidence-backed, every decision is proof-chained, and every accepted amendment is tracked by the meta-loop to verify it actually improved outcomes. The self-improvement is governed with the same rigor as the actions.
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="PENDING PROPOSALS" value={pending} sub="awaiting decision" accent="#c9b787" />
        <KpiCard label="ACCEPTED (90D)" value={accepted} sub="proof-chained" accent="#c9b787" />
        <KpiCard label="META SUCCESS RATE" value={`${metaSuccessRate}%`} sub="amendments improved outcomes" accent="#c9b787" />
        <KpiCard label="TRUST RECALCS" value="8" sub="this month" accent="#c9b787" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="text-[11px] font-mono px-3 py-1.5 rounded"
            style={{
              background: activeTab === tab.id ? `${T.accent}22` : T.surface,
              color: activeTab === tab.id ? T.accent : T.dim,
              border: `1px solid ${activeTab === tab.id ? T.accent + '44' : T.border}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'proposals' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Amendment Proposals ({proposals.length})</SectionTitle>
            <span className="text-[10px] font-mono" style={{ color: T.muted }}>
              {amendmentsLoading ? 'Loading from outcome graph…' : `Generated from outcome graph · ${pending} pending`}
            </span>
          </div>
          {amendmentsLoading && proposals.length === 0 && (
            <div className="text-center py-8 text-xs" style={{ color: T.muted }}>Loading amendment proposals…</div>
          )}
          {proposals.map(p => (
            <AmendmentCard key={p.id} proposal={p} onDecide={handleDecide} />
          ))}
        </div>
      )}

      {activeTab === 'health' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Policy Health Dashboard</SectionTitle>
            <span className="text-[10px] font-mono" style={{ color: T.muted }}>Refreshed every 6 hours</span>
          </div>
          <div className="flex flex-col gap-3">
            {(policyHealth ?? []).map(p => {
              const hs = HEALTH_STYLE[p.status];
              return (
                <Card key={p.policyId}>
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div>
                      <div className="text-sm font-semibold mb-0.5" style={{ color: T.text }}>{p.name}</div>
                      <div className="text-[10px] font-mono" style={{ color: T.muted }}>{p.policyId} · {p.domain}</div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ background: `${hs.color}18`, color: hs.color }}>{hs.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {[
                      { label: 'BLOCK', value: `${Math.round(p.blockRate * 100)}%` },
                      { label: 'OVERRIDE→APPROVE', value: `${Math.round(p.overrideApprovalRate * 100)}%` },
                      { label: 'LATENCY', value: p.avgLatencyMs === 0 ? 'N/A' : `${(p.avgLatencyMs / 1000).toFixed(1)}s` },
                      { label: 'UTILIZATION', value: `${Math.round(p.utilization * 100)}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center p-2 rounded" style={{ background: T.surface }}>
                        <div className="text-[9px] font-mono mb-0.5" style={{ color: T.muted }}>{label}</div>
                        <div className="text-xs font-mono font-semibold" style={{ color: T.accent }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: T.dim, lineHeight: 1.6 }}>{p.insight}</p>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Governance Evolution Timeline</SectionTitle>
            <span className="text-[10px] font-mono" style={{ color: T.muted }}>Constitutional changes with outcome-linked rationale</span>
          </div>
          <div className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: T.border }} />
            <div className="flex flex-col gap-4">
              {((timeline ?? []) as Array<{ date: string; event: string; domain: string; rationale: string; outcome: string; type: string; proofHash?: string }>).map((ev, i) => (
                <div key={i} className="relative pl-4">
                  <div className="absolute left-0 top-2 w-2 h-2 rounded-full -translate-x-0.5" style={{ background: ev.type === 'accepted' ? '#22c55e' : '#ef4444' }} />
                  <Card>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-mono" style={{ color: T.accent }}>{ev.domain}</span>
                      <span className="text-[10px] font-mono" style={{ color: T.muted }}>{ev.date}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: ev.type === 'accepted' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: ev.type === 'accepted' ? '#22c55e' : '#ef4444' }}>
                        {ev.type.toUpperCase()}
                      </span>
                      {ev.proofHash && <span className="text-[8px] font-mono ml-auto" style={{ color: T.muted }}>{ev.proofHash.slice(0, 18)}…</span>}
                    </div>
                    <div className="text-sm font-semibold mb-1" style={{ color: T.text }}>{ev.event}</div>
                    <p className="text-xs mb-1" style={{ color: T.dim, lineHeight: 1.6 }}><span style={{ color: T.muted }}>Rationale: </span>{ev.rationale}</p>
                    <p className="text-xs" style={{ color: '#86efac', lineHeight: 1.6 }}><span style={{ color: T.muted }}>Outcome: </span>{ev.outcome}</p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'trust' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Dynamic Trust Trajectories</SectionTitle>
            <span className="text-[10px] font-mono" style={{ color: T.muted }}>Trust scores computed from outcome history · recalculated weekly</span>
          </div>
          <Card>
            <div className="text-xs font-mono mb-4" style={{ color: T.dim }}>Agent trust scores evolve from demonstrated outcome success rates — not seed values. Scores above 85 unlock higher autonomy ceilings per RSP-aligned tier policy.</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={(trustTrajectory ?? []) as Array<Record<string, number | string>>} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="week" tick={{ fill: T.muted, fontSize: 10 }} />
                <YAxis domain={[60, 100]} tick={{ fill: T.muted, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#111', border: `1px solid ${T.border}`, borderRadius: 6 }} labelStyle={{ color: T.dim }} />
                <Line type="monotone" dataKey="maritime" stroke="#8a8a8a" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="legal" stroke={T.accent} dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="revenue" stroke="#a78bfa" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="defense" stroke="#22c55e" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-3">
              {[{ label: 'Maritime', color: '#8a8a8a' }, { label: 'Legal', color: T.accent }, { label: 'Revenue', color: '#a78bfa' }, { label: 'Defense', color: '#22c55e' }].map(({ label, color }) => (
                <span key={label} className="flex items-center gap-1 text-[10px] font-mono" style={{ color: T.dim }}>
                  <span className="w-3 h-0.5 inline-block rounded" style={{ background: color }} />{label}
                </span>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'meta' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle>Meta-Loop — Did Amendments Actually Help?</SectionTitle>
            <span className="text-[10px] font-mono" style={{ color: T.muted }}>HyperAgents pattern: self-improvement governed by outcome evidence</span>
          </div>
          <div className="mb-4 p-3 rounded border" style={{ background: 'rgba(201,183,135,0.06)', borderColor: 'rgba(201,183,135,0.2)' }}>
            <div className="text-xs" style={{ color: T.dim, lineHeight: 1.7 }}>
              Every accepted amendment is tracked at 30-day review. If the projected improvement did not materialize, the amendment is flagged for reversal. The meta-loop also adjusts the amendment-generation heuristics — proposals with lower evidence quality are deprioritized.
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {(metaLoop ?? []).map(d => (
              <Card key={d.month}>
                <div className="text-[10px] font-mono mb-1" style={{ color: T.muted }}>{d.month}</div>
                <div className="text-xs font-semibold mb-1" style={{ color: T.accent }}>{d.improved}/{d.accepted} improved</div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: d.accepted > 0 ? `${Math.round((d.improved / d.accepted) * 100)}%` : '0%', background: T.accent }} />
                </div>
              </Card>
            ))}
          </div>
          <div className="p-4 rounded border" style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: '#22c55e' }}>Meta-Loop Summary</div>
            <div className="text-xs" style={{ color: '#86efac', lineHeight: 1.7 }}>
              {metaSuccessRate}% of accepted amendments confirmed as outcome-improving at 30-day review. Amendment generation heuristics updated: evidence quality weight +0.15, sample size floor raised to 40 decisions.
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
