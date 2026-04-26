import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, ApprovalGate, ActionButton, SeverityDot, SeverityBadge, VerticalBadge, HashId, VerdictBadge } from '../components/ui';
import { SEED_SIGNALS, SEED_WORKCELLS } from '@workspace/a11oy-fabric';

const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#3b82f6', 'vessels-maritime': '#06b6d4', 'terra-real-estate': '#10b981',
  'aegis-defense': '#ef4444', 'prism-counsel': '#8b5cf6', 'carlota-jo': '#f59e0b', 'alloy-core': '#6366f1',
};
const VERTICAL_LABELS: Record<string, string> = {
  'lyte-revenue': 'Lyte Revenue', 'vessels-maritime': 'Vessels Maritime', 'terra-real-estate': 'Terra Real Estate',
  'aegis-defense': 'Aegis Defense', 'prism-counsel': 'Counsel', 'carlota-jo': 'Carlota Jo', 'alloy-core': 'Alloy Core',
};
const VERTICALS = ['lyte-revenue','vessels-maritime','terra-real-estate','aegis-defense','prism-counsel','carlota-jo','alloy-core'];
const SEVERITIES = ['critical','high','medium','low','info'];
const STATUSES = ['active','escalated','acknowledged','resolved'];

function fmt(ts: string) {
  try {
    const d = new Date(ts);
    const diffMs = Date.now() - d.getTime();
    const diffH = Math.round(diffMs / 3_600_000);
    if (diffH < 1) return `${Math.round(diffMs / 60000)}m`;
    if (diffH < 24) return `${diffH}h`;
    return `${Math.round(diffH / 24)}d`;
  } catch { return ts; }
}

export function CommandSurface() {
  const [filterVertical, setFilterVertical] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  const filtered = SEED_SIGNALS.filter(s =>
    (filterVertical === 'all' || s.vertical === filterVertical) &&
    (filterSeverity === 'all' || s.severity === filterSeverity) &&
    (filterStatus === 'all' || s.status === filterStatus)
  );

  const selected = SEED_SIGNALS.find(s => s.id === selectedId);
  const selectedWC = selected
    ? SEED_WORKCELLS.find(w => w.signals.includes(selected.id))
    : null;

  return (
    <Layout>
      <PageHeader
        label="COMMAND SURFACE"
        title="Operator Command Console"
        subtitle="Three-pane execution hub: filter signals, inspect the causal timeline, and approve or reject governed actions."
        status="DEMO"
      />

      <div className="flex gap-0 border rounded-lg overflow-hidden flex-1" style={{ borderColor: 'var(--color-a11oy-border)', minHeight: 600 }}>
        {/* LEFT RAIL — Filters */}
        <div className="w-52 flex-shrink-0 border-r p-3 flex flex-col gap-4" style={{ backgroundColor: 'var(--color-a11oy-deep)', borderColor: 'var(--color-a11oy-border)' }}>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>VERTICAL</div>
            <select
              value={filterVertical}
              onChange={e => setFilterVertical(e.target.value)}
              className="w-full text-xs rounded px-2 py-1.5 border"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text)' }}
            >
              <option value="all">All verticals</option>
              {VERTICALS.map(v => <option key={v} value={v}>{VERTICAL_LABELS[v]}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SEVERITY</div>
            <div className="flex flex-col gap-1">
              {['all', ...SEVERITIES].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterSeverity(s)}
                  className="text-left text-xs px-2 py-1 rounded transition-colors"
                  style={{
                    backgroundColor: filterSeverity === s ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color: filterSeverity === s ? '#3b82f6' : 'var(--color-a11oy-text-ghost)',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  {s === 'all' ? 'All severities' : s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>STATUS</div>
            <div className="flex flex-col gap-1">
              {['all', ...STATUSES].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className="text-left text-xs px-2 py-1 rounded transition-colors"
                  style={{
                    backgroundColor: filterStatus === s ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color: filterStatus === s ? '#3b82f6' : 'var(--color-a11oy-text-ghost)',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  {s === 'all' ? 'All statuses' : s}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-auto text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            {filtered.length} of {SEED_SIGNALS.length} signals
          </div>
        </div>

        {/* CENTER — Signal Timeline */}
        <div className="flex-1 overflow-y-auto border-r" style={{ borderColor: 'var(--color-a11oy-border)' }}>
          <div className="p-3 border-b flex items-center gap-2 sticky top-0 z-10" style={{ backgroundColor: 'var(--color-a11oy-deep)', borderColor: 'var(--color-a11oy-border)' }}>
            <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SIGNAL TIMELINE</span>
            <span className="ml-auto text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{filtered.length} events</span>
          </div>
          <div className="flex flex-col divide-y divide-white/5">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No signals match the current filters.</div>
            ) : filtered.map(s => {
              const color = VERTICAL_COLORS[s.vertical] ?? '#9bacc4';
              const isSelected = s.id === selectedId;
              return (
                <div
                  key={s.id}
                  className="p-3 cursor-pointer transition-colors"
                  onClick={() => setSelectedId(isSelected ? null : s.id)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(59,130,246,0.06)' : 'var(--color-a11oy-card)',
                    borderLeft: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <SeverityDot severity={s.severity} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <SeverityBadge severity={s.severity} />
                        <VerticalBadge vertical={VERTICAL_LABELS[s.vertical] ?? s.vertical} color={color} />
                      </div>
                      <div className="text-xs font-medium truncate" style={{ color: 'var(--color-a11oy-text)' }}>{s.title}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                        {fmt(s.detectedAt)} ago · {s.owner}
                      </div>
                      {isSelected && (
                        <div className="mt-2 text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{s.description}</div>
                      )}
                      {isSelected && (
                        <div className="mt-1.5 text-xs flex flex-wrap gap-1">
                          {s.evidenceRefs.slice(0, 3).map(ref => (
                            <span key={ref} className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>{ref}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{fmt(s.detectedAt)}</div>
                  </div>
                  {isSelected && selectedWC && (
                    <div className="mt-2 px-2 py-1.5 rounded text-xs" style={{ backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                      <span style={{ color: '#3b82f6' }}>↗ Linked workcell: </span>
                      <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedWC.name}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT RAIL — Signal Detail */}
        <div className="w-80 flex-shrink-0 overflow-y-auto" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
          {!selected ? (
            <div className="p-6 text-center text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
              <div className="text-2xl mb-2" style={{ color: 'var(--color-a11oy-border)' }}>▸</div>
              Select a signal to view details, action brief, and PCE contract.
            </div>
          ) : (
            <div className="p-4">
              {/* Signal Details */}
              <div className="mb-4">
                <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SIGNAL DETAILS</div>
                <div className="text-sm font-medium mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{selected.title}</div>
                <HashId id={selected.id} />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <SeverityBadge severity={selected.severity} />
                  <VerticalBadge vertical={VERTICAL_LABELS[selected.vertical] ?? selected.vertical} color={VERTICAL_COLORS[selected.vertical] ?? '#9bacc4'} />
                </div>
                <p className="mt-2 text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>{selected.description}</p>
                <div className="mt-2 text-xs p-2 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                  {selected.businessImpact}
                </div>
              </div>

              {/* Action Brief */}
              {selectedWC && (
                <div className="mb-4 border-t pt-4" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ACTION BRIEF</div>
                  <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{selectedWC.actionBrief.title}</div>
                  <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedWC.actionBrief.description}</div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                      {selectedWC.actionBrief.priority} priority
                    </span>
                    <span className="font-mono" style={{ color: '#10b981' }}>{selectedWC.actionBrief.estimatedImpact}</span>
                  </div>
                </div>
              )}

              {/* MirrorEval */}
              {selectedWC && (
                <div className="mb-4 border-t pt-4" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>MIRROREVAL</div>
                  <div className="flex items-center gap-2 mb-2">
                    <VerdictBadge verdict={selectedWC.mirrorEvalResult.verdict} />
                    <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                      {Math.round(selectedWC.mirrorEvalResult.score * 100)}% confidence
                    </span>
                  </div>
                  {selectedWC.mirrorEvalResult.dimensions.map(d => (
                    <div key={d.name} className="text-xs mb-1">
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{d.name}: </span>
                      <span style={{ color: '#10b981' }}>{Math.round(d.score * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}

              {/* PCE Contract */}
              {selectedWC && (
                <div className="mb-4 border-t pt-4" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>PCE CONTRACT</div>
                  <HashId id={selectedWC.pceContractId} />
                  <div className="mt-1 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Mode: demo · Approval tier: {selectedWC.actionBrief.approvalTier}
                  </div>
                  <div className="mt-2 text-xs font-mono px-2 py-1.5 rounded" style={{ backgroundColor: 'rgba(16,185,129,0.08)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
                    {selectedWC.verificationResult.status === 'passed' ? '✓ Contract verified' : '✗ Contract failed'}
                  </div>
                </div>
              )}

              {/* Approval Control */}
              {selectedWC && selectedWC.requiresApproval && (
                <div className="border-t pt-4" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                  <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>APPROVAL CONTROL</div>
                  <ApprovalGate label={`Approval tier: ${selectedWC.actionBrief.approvalTier}`} />
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <ActionButton
                      variant="primary"
                      onClick={() => setApproving(true)}
                      disabled={approving}
                    >
                      {approving ? 'Approved (Demo)' : 'Approve'}
                    </ActionButton>
                    <ActionButton variant="ghost">Defer</ActionButton>
                    <ActionButton variant="danger">Reject</ActionButton>
                  </div>
                  <div className="mt-2 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Demo mode — no real execution occurs.
                  </div>
                </div>
              )}

              {/* Evidence Refs */}
              <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>EVIDENCE REFS</div>
                <div className="flex flex-col gap-1">
                  {selected.evidenceRefs.map(ref => (
                    <div key={ref} className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                      {ref}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
