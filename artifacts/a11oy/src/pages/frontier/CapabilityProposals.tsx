import { useState, useEffect } from 'react';
import { Layout } from '../../components/layout';
import { ResearchCitationPanel } from './ResearchCitationPanel';
import type { Citation } from './ResearchCitationPanel';
import {
  FRONTIER_TOKENS,
  FrontierPageHeader,
  FrontierCard,
  FrontierKpiTile,
  FrontierCitationBanner,
  FrontierMonoBadge,
  FrontierSectionLabel,
} from './FrontierPrimitives';

const API = '/api/helios';
const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
const { GOLD, DIM, MUTED, BORDER, SURFACE, MONO } = FRONTIER_TOKENS;

type ProposalStatus = 'new' | 'accepted' | 'deferred' | 'rejected';
type Priority = 'P0' | 'P1' | 'P2' | 'P3';

interface SignalRef {
  id: string;
  title: string;
  sourceUrl: string;
  sourceName: string;
  kind: string;
}

interface Proposal {
  id: string;
  status: ProposalStatus;
  title: string;
  description: string;
  rationale: string;
  targetAgent: string;
  impactArea: string;
  priority: Priority;
  signalIds: string[];
  estimatedEffort: string;
  createdAt: string;
  updatedAt: string;
  statusReason?: string;
}

interface PromotedTask {
  taskRef: string;
  proposalId: string;
  title: string;
  status: 'pending' | 'in_progress' | 'done';
  promotedAt: string;
}

const STATUS_COLOR: Record<ProposalStatus, string> = {
  new: '#c9b787',
  accepted: '#8de3b5',
  deferred: '#6b8de3',
  rejected: '#e36b6b',
};

const PRIORITY_COLOR: Record<Priority, string> = {
  P0: '#e36b6b',
  P1: '#e3a66b',
  P2: '#c9b787',
  P3: '#8a8a8a',
};

const PROPOSALS_CITATIONS: Citation[] = [
  {
    id: 'cit-prop-hitl', lab: 'MIT Human-AI Collaboration Group', kind: 'academic',
    title: 'Human Oversight in Agentic AI: Fatigue, Thresholds, and Trust Calibration',
    sourceUrl: 'https://hci.mit.edu',
    sourceName: 'MIT HCI',
    excerpt: 'Research on optimal human-in-the-loop intervention points. Blanket review causes operator fatigue; risk-tiered routing improves decision quality by 38%.',
    date: 'Feb 2026',
  },
  {
    id: 'cit-prop-metr', lab: 'METR (Model Evaluation & Threat Research)', kind: 'lab',
    title: 'Evaluating Autonomous Replication and Adaptation Capabilities',
    sourceUrl: 'https://metr.org',
    sourceName: 'METR Research',
    excerpt: 'Framework for identifying when AI systems exhibit autonomous capability expansion. Informs the capability proposal review criteria used in this queue.',
    date: 'Mar 2026',
  },
  {
    id: 'cit-prop-arc', lab: 'Anthropic', kind: 'lab',
    title: 'Responsible Scaling Policy (RSP): Evaluate before deploy',
    sourceUrl: 'https://www.anthropic.com/news/anthropics-responsible-scaling-policy',
    sourceName: 'Anthropic RSP',
    excerpt: 'RSP\'s evaluation-gate-before-capability-promotion model is the intellectual ancestor of this queue\'s human-gated promotion flow.',
    date: 'Oct 2023',
  },
];

function StatusBadge({ status }: { status: ProposalStatus }) {
  return (
    <span style={{
      fontSize: 9, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600,
      letterSpacing: '0.1em', textTransform: 'uppercase',
      color: STATUS_COLOR[status], background: `${STATUS_COLOR[status]}18`,
      border: `1px solid ${STATUS_COLOR[status]}40`,
      padding: '2px 7px', borderRadius: 3,
    }}>
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span style={{
      fontSize: 9, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700,
      color: PRIORITY_COLOR[priority], background: `${PRIORITY_COLOR[priority]}18`,
      border: `1px solid ${PRIORITY_COLOR[priority]}40`,
      padding: '2px 7px', borderRadius: 3,
    }}>
      {priority}
    </span>
  );
}

function ReasonModal({
  action,
  onConfirm,
  onCancel,
}: {
  action: 'rejected' | 'deferred';
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  const label = action === 'rejected' ? 'Reject' : 'Snooze (defer)';
  const color = action === 'rejected' ? '#e36b6b' : '#6b8de3';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#141414', border: `1px solid ${color}40`, borderRadius: 12,
          padding: '24px 28px', maxWidth: 460, width: '90%', boxShadow: `0 0 40px ${color}20`,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 6, fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.05em' }}>
          {label} — Reason required
        </div>
        <div style={{ fontSize: 12, color: DIM, marginBottom: 14, lineHeight: 1.5 }}>
          Provide a brief reason. This is logged to the queue for traceability and future reconsideration.
        </div>
        <textarea
          autoFocus
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder={action === 'rejected' ? 'e.g. Not aligned with current quarter roadmap...' : 'e.g. Revisit after Q3 benchmark results...'}
          rows={3}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${BORDER}`,
            borderRadius: 6, color: '#f0f0f0', fontSize: 12, padding: '8px 12px',
            resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '6px 14px', fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
              background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED,
              borderRadius: 5, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={reason.trim().length < 5}
            onClick={() => onConfirm(reason.trim())}
            style={{
              padding: '6px 14px', fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
              background: `${color}22`, border: `1px solid ${color}60`, color,
              borderRadius: 5, cursor: reason.trim().length < 5 ? 'not-allowed' : 'pointer',
              fontWeight: 700, opacity: reason.trim().length < 5 ? 0.5 : 1,
            }}
          >
            Confirm {label}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProposalCitations({ signalIds, signalMap }: { signalIds: string[]; signalMap: Map<string, SignalRef> }) {
  const found = signalIds.map(id => signalMap.get(id)).filter(Boolean) as SignalRef[];
  if (found.length === 0) return null;

  return (
    <div style={{
      background: 'rgba(201,183,135,0.05)', border: '1px solid rgba(201,183,135,0.18)',
      borderRadius: 6, padding: '10px 14px', marginBottom: 12,
    }}>
      <div style={{
        fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: GOLD,
        textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
      }}>
        Supporting signal citations — review before promoting
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {found.map((sig, i) => (
          <div key={sig.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '6px 10px', borderRadius: 5,
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`,
          }}>
            <span style={{
              fontSize: 9, fontFamily: 'var(--font-mono, monospace)',
              color: GOLD, flexShrink: 0, marginTop: 1,
            }}>
              [{i + 1}]
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#e0e0e0', lineHeight: 1.4, marginBottom: 2 }}>
                {sig.title}
              </div>
              <a
                href={sig.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 10, color: GOLD, fontFamily: 'var(--font-mono, monospace)',
                  textDecoration: 'none', opacity: 0.8,
                }}
              >
                {sig.sourceName} →
              </a>
            </div>
            <span style={{
              fontSize: 9, fontFamily: 'var(--font-mono, monospace)',
              color: MUTED, flexShrink: 0, marginTop: 1,
            }}>
              {sig.id}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CapabilityProposals() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('new');
  const [updating, setUpdating] = useState<string | null>(null);
  const [promoted, setPromoted] = useState<Map<string, PromotedTask>>(new Map());
  const [modal, setModal] = useState<{ proposalId: string; action: 'rejected' | 'deferred' } | null>(null);
  const [signalMap, setSignalMap] = useState<Map<string, SignalRef>>(new Map());

  useEffect(() => {
    fetch(`${API}/signals?pageSize=50`)
      .then(r => r.json())
      .then(d => {
        const map = new Map<string, SignalRef>();
        for (const s of (d.signals ?? [])) {
          map.set(s.id, { id: s.id, title: s.title, sourceUrl: s.sourceUrl, sourceName: s.sourceName, kind: s.kind });
        }
        setSignalMap(map);
      })
      .catch(() => {});
  }, []);

  function load(status: string) {
    setLoading(true);
    const params = new URLSearchParams(status !== 'all' ? { status } : {});
    fetch(`${API}/proposals?${params}`)
      .then(r => r.json())
      .then(d => setProposals(d.proposals ?? []))
      .catch(() => setError('Proposals queue unavailable'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(statusFilter); }, [statusFilter]);

  function updateStatus(id: string, status: 'accepted' | 'deferred' | 'rejected', reason?: string) {
    setUpdating(id);
    fetch(`${API}/proposals/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...(reason ? { reason } : {}) }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.proposal) {
          setProposals(prev => prev.map(p => p.id === id ? d.proposal : p));
        }
      })
      .catch(() => {})
      .finally(() => setUpdating(null));
  }

  function promoteToTask(id: string) {
    setUpdating(id);
    fetch(`${API}/proposals/${id}/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
      .then(r => r.json())
      .then(d => {
        if (d.task) {
          setPromoted(prev => new Map([...prev, [id, d.task as PromotedTask]]));
          setProposals(prev => prev.map(p => p.id === id ? { ...p, status: 'accepted' } : p));
        }
      })
      .catch(() => {})
      .finally(() => setUpdating(null));
  }

  function handleReasonConfirm(reason: string) {
    if (!modal) return;
    updateStatus(modal.proposalId, modal.action, reason);
    setModal(null);
  }

  const statuses: ProposalStatus[] = ['new', 'accepted', 'deferred', 'rejected'];

  const allProposals = proposals;
  const counts = allProposals.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Layout>
      {modal && (
        <ReasonModal
          action={modal.action}
          onConfirm={handleReasonConfirm}
          onCancel={() => setModal(null)}
        />
      )}

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <FrontierPageHeader
          base={BASE}
          section="Capability Proposals"
          title="Capability Proposals"
          description="Research-derived capability proposals awaiting human review. No proposal is auto-promoted — every item in this queue requires explicit human action before entering the project backlog."
        />

        <FrontierCitationBanner message='Proposals require explicit "Promote to project task" action. Each card shows its supporting signal citations for review before promotion. Rejection or snooze requires a logged reason.' />

        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['all', ...statuses] as string[]).map(s => {
            const count = s === 'all' ? allProposals.length : counts[s] ?? 0;
            return (
              <button key={s} type="button" onClick={() => setStatusFilter(s)} style={{
                padding: '6px 12px', fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: 5, cursor: 'pointer',
                background: statusFilter === s ? (s === 'all' ? GOLD : STATUS_COLOR[s as ProposalStatus]) : 'transparent',
                color: statusFilter === s ? '#0a0a0a' : DIM,
                border: `1px solid ${statusFilter === s ? (s === 'all' ? GOLD : STATUS_COLOR[s as ProposalStatus]) : BORDER}`,
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
              }}>
                {s}
                {count > 0 && (
                  <span style={{
                    fontSize: 9, background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '1px 5px',
                    color: statusFilter === s ? '#0a0a0a' : MUTED,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: MUTED, fontFamily: 'var(--font-mono, monospace)', fontSize: 12 }}>
            Loading proposals…
          </div>
        )}
        {error && (
          <div style={{ padding: 16, background: '#e36b6b18', border: '1px solid #e36b6b40', borderRadius: 6, color: '#e36b6b', fontSize: 12 }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {proposals.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, color: MUTED, fontSize: 13 }}>
                No proposals in this state.
              </div>
            )}
            {proposals.map(p => {
              const taskRecord = promoted.get(p.id);
              return (
                <div key={p.id} style={{
                  border: `1px solid ${taskRecord ? '#8de3b560' : BORDER}`,
                  borderRadius: 10, background: taskRecord ? '#8de3b508' : SURFACE,
                  overflow: 'hidden', transition: 'all 0.2s',
                }}>
                  <div style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                          <PriorityBadge priority={p.priority} />
                          <StatusBadge status={p.status} />
                          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED }}>
                            → {p.targetAgent}
                          </span>
                          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED, marginLeft: 'auto' }}>
                            {p.estimatedEffort}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f5f5f5', margin: '0 0 6px', lineHeight: 1.3 }}>{p.title}</h3>
                        <p style={{ fontSize: 12, color: DIM, margin: '0 0 8px', lineHeight: 1.5 }}>{p.description}</p>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(0,0,0,0.2)', border: `1px solid ${BORDER}`, borderRadius: 6, padding: '10px 14px', marginBottom: 12 }}>
                      <div style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                        Rationale
                      </div>
                      <div style={{ fontSize: 12, color: '#d5d5d5', lineHeight: 1.5 }}>{p.rationale}</div>
                    </div>

                    <ProposalCitations signalIds={p.signalIds} signalMap={signalMap} />

                    {p.statusReason && p.status !== 'new' && (
                      <div style={{ background: `${STATUS_COLOR[p.status]}08`, border: `1px solid ${STATUS_COLOR[p.status]}25`, borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
                        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: STATUS_COLOR[p.status], textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                          {p.status === 'rejected' ? 'Rejection reason' : 'Snooze reason'}
                        </div>
                        <div style={{ fontSize: 12, color: '#d5d5d5', lineHeight: 1.5 }}>{p.statusReason}</div>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 10, fontFamily: 'var(--font-mono, monospace)',
                          padding: '2px 7px', borderRadius: 3,
                          background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: DIM,
                        }}>
                          {p.impactArea}
                        </span>
                        {p.signalIds.map(sid => (
                          <span key={sid} style={{
                            fontSize: 10, fontFamily: 'var(--font-mono, monospace)',
                            padding: '2px 7px', borderRadius: 3,
                            background: '#c9b78710', border: `1px solid #c9b78730`, color: '#c9b787',
                          }}>
                            {sid}
                          </span>
                        ))}
                      </div>

                      {p.status === 'new' && !taskRecord && (
                        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            disabled={updating === p.id}
                            onClick={() => setModal({ proposalId: p.id, action: 'rejected' })}
                            style={{
                              padding: '5px 12px', fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
                              background: 'transparent', border: '1px solid #e36b6b40', color: '#e36b6b',
                              borderRadius: 5, cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            disabled={updating === p.id}
                            onClick={() => setModal({ proposalId: p.id, action: 'deferred' })}
                            style={{
                              padding: '5px 12px', fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
                              background: 'transparent', border: '1px solid #6b8de340', color: '#6b8de3',
                              borderRadius: 5, cursor: 'pointer', transition: 'all 0.15s',
                            }}
                          >
                            Snooze
                          </button>
                          <button
                            type="button"
                            disabled={updating === p.id}
                            onClick={() => promoteToTask(p.id)}
                            style={{
                              padding: '5px 14px', fontSize: 11, fontFamily: 'var(--font-mono, monospace)',
                              background: GOLD, border: `1px solid ${GOLD}`, color: '#0a0a0a',
                              borderRadius: 5, cursor: 'pointer', fontWeight: 700, transition: 'all 0.15s',
                            }}
                          >
                            {updating === p.id ? '…' : 'Promote to project task'}
                          </button>
                        </div>
                      )}
                      {taskRecord && (
                        <div style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: '#8de3b5', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>✓</span>
                          Promoted to backlog — task ref{' '}
                          <span style={{ fontWeight: 700, color: '#c9b787' }}>{taskRecord.taskRef}</span>
                        </div>
                      )}
                      {p.status !== 'new' && !taskRecord && (
                        <div style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono, monospace)', color: MUTED }}>
                          Updated {new Date(p.updatedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: 28, padding: '12px 16px', borderRadius: 8, background: 'rgba(141,227,181,0.04)', border: '1px solid rgba(141,227,181,0.15)' }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono, monospace)', color: '#8de3b5', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
            Back-links
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              { label: 'Self-Optimization', href: '/self-optimization' },
              { label: 'Benchmark Scoreboard', href: '/frontier/benchmarks' },
              { label: 'Signal Feed', href: '/frontier/feed' },
              { label: 'System Health', href: '/frontier/system' },
            ].map(l => (
              <a key={l.href} href={`${BASE}${l.href}`} style={{ color: '#8de3b5', fontFamily: 'var(--font-mono, monospace)', fontSize: 11, textDecoration: 'none', padding: '3px 9px', borderRadius: 4, border: '1px solid rgba(141,227,181,0.2)', background: 'rgba(141,227,181,0.05)' }}>
                {l.label} →
              </a>
            ))}
          </div>
        </div>

        <ResearchCitationPanel citations={PROPOSALS_CITATIONS} title="Human-gate methodology references" />
      </div>
    </Layout>
  );
}
