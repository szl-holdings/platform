import { useCallback, useEffect, useState } from 'react';

const API = (import.meta as Record<string, unknown> & { env: Record<string, string> }).env?.VITE_API_URL ?? '';

type ProposalStatus = 'new' | 'accepted' | 'deferred' | 'rejected';
type Priority = 'P0' | 'P1' | 'P2' | 'P3';

interface CapabilityProposal {
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

const PRIORITY_COLOR: Record<Priority, string> = {
  P0: '#ef4444',
  P1: '#f97316',
  P2: '#eab308',
  P3: '#6b7280',
};

const STATUS_COLOR: Record<ProposalStatus, string> = {
  new:      '#6b8de3',
  accepted: '#22c55e',
  deferred: '#eab308',
  rejected: '#6b7280',
};

const T = {
  bg:      '#0a0a0a',
  surface: 'rgba(255,255,255,0.025)',
  border:  'rgba(255,255,255,0.08)',
  text:    '#f5f5f5',
  sub:     '#8a8a8a',
  muted:   '#5e5e5e',
  gold:    '#c9b787',
};

function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span style={{
      fontSize: 10, fontFamily: 'monospace', fontWeight: 700,
      padding: '2px 7px', borderRadius: 4,
      background: `${PRIORITY_COLOR[priority]}18`,
      color: PRIORITY_COLOR[priority],
      border: `1px solid ${PRIORITY_COLOR[priority]}44`,
    }}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: ProposalStatus }) {
  const labels: Record<ProposalStatus, string> = {
    new: 'NEW', accepted: 'ACCEPTED', deferred: 'DEFERRED', rejected: 'REJECTED',
  };
  return (
    <span style={{
      fontSize: 10, fontFamily: 'monospace', fontWeight: 600,
      padding: '2px 7px', borderRadius: 4,
      background: `${STATUS_COLOR[status]}14`,
      color: STATUS_COLOR[status],
      border: `1px solid ${STATUS_COLOR[status]}40`,
    }}>
      {labels[status]}
    </span>
  );
}

function ActionButton({
  label, color, onClick, disabled,
}: {
  label: string; color: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '4px 12px', borderRadius: 6, fontSize: 11, fontFamily: 'monospace',
        fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        background: `${color}12`, color, border: `1px solid ${color}44`,
        opacity: disabled ? 0.4 : 1, transition: 'opacity 0.15s',
      }}
    >
      {label}
    </button>
  );
}

function ProposalRow({
  proposal, onAction,
}: {
  proposal: CapabilityProposal;
  onAction: (id: string, status: 'accepted' | 'deferred' | 'rejected') => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handle = async (status: 'accepted' | 'deferred' | 'rejected') => {
    setLoading(true);
    try {
      await onAction(proposal.id, status);
    } finally {
      setLoading(false);
    }
  };

  const isSettled = proposal.status !== 'new';

  return (
    <div style={{
      padding: '1rem 1.25rem',
      borderBottom: `1px solid ${T.border}`,
      background: T.surface,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <PriorityBadge priority={proposal.priority} />
            <StatusBadge status={proposal.status} />
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.muted, marginLeft: 'auto' }}>
              {proposal.targetAgent} · {proposal.impactArea}
            </span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4, lineHeight: 1.4 }}>
            {proposal.title}
          </div>
          <div style={{ fontSize: 12, color: T.sub, lineHeight: 1.55, marginBottom: 6 }}>
            {proposal.description}
          </div>
          <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5, borderLeft: `2px solid ${T.border}`, paddingLeft: 8 }}>
            <span style={{ color: T.sub, fontWeight: 600 }}>Rationale: </span>
            {proposal.rationale}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, color: T.muted, fontFamily: 'monospace', marginRight: 'auto' }}>
          effort: {proposal.estimatedEffort} · signals: {proposal.signalIds.length}
        </span>
        {!isSettled && (
          <>
            <ActionButton label="Accept" color="#22c55e" onClick={() => handle('accepted')} disabled={loading} />
            <ActionButton label="Defer"  color="#eab308" onClick={() => handle('deferred')}  disabled={loading} />
            <ActionButton label="Reject" color="#ef4444" onClick={() => handle('rejected')} disabled={loading} />
          </>
        )}
        {isSettled && (
          <span style={{ fontSize: 11, color: T.muted, fontFamily: 'monospace' }}>
            {proposal.statusReason ?? '—'}
          </span>
        )}
      </div>
    </div>
  );
}

interface HeliosProposalsInboxProps {
  limit?: number;
  statusFilter?: 'new' | 'all';
  title?: string;
}

export function HeliosProposalsInbox({
  limit = 20,
  statusFilter = 'new',
  title = 'Frontier Capability Proposals',
}: HeliosProposalsInboxProps) {
  const [proposals, setProposals] = useState<CapabilityProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'new' | 'accepted' | 'deferred' | 'rejected'>(
    statusFilter === 'all' ? 'all' : 'new',
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      if (filter !== 'all') params.set('status', filter);
      const res = await fetch(`${API}/api/helios/proposals?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { proposals: CapabilityProposal[] };
      setProposals(data.proposals ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load proposals');
    } finally {
      setLoading(false);
    }
  }, [filter, limit]);

  useEffect(() => { void load(); }, [load]);

  const handleAction = useCallback(async (id: string, status: 'accepted' | 'deferred' | 'rejected') => {
    const res = await fetch(`${API}/api/helios/proposals/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { proposal: CapabilityProposal };
    setProposals(prev => prev.map(p => p.id === id ? data.proposal : p));
  }, []);

  const FILTERS: Array<{ label: string; value: typeof filter }> = [
    { label: 'New',      value: 'new' },
    { label: 'All',      value: 'all' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Deferred', value: 'deferred' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <div style={{
      borderRadius: 12,
      border: `1px solid ${T.border}`,
      overflow: 'hidden',
      background: T.bg,
      fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        padding: '0.875rem 1.25rem',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.14em', color: T.gold, marginBottom: 2 }}>
            FRONTIER INTELLIGENCE · HELIOS
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{title}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '3px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'monospace',
                cursor: 'pointer', fontWeight: filter === f.value ? 700 : 400,
                background: filter === f.value ? 'rgba(201,183,135,0.12)' : 'transparent',
                color: filter === f.value ? T.gold : T.sub,
                border: filter === f.value ? `1px solid rgba(201,183,135,0.3)` : `1px solid transparent`,
              }}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => void load()}
            style={{
              padding: '3px 10px', borderRadius: 6, fontSize: 11, fontFamily: 'monospace',
              cursor: 'pointer', background: 'transparent', color: T.muted, border: `1px solid ${T.border}`,
            }}
          >
            ↻
          </button>
        </div>
      </div>

      {loading && (
        <div style={{ padding: '2rem', textAlign: 'center', color: T.muted, fontSize: 12, fontFamily: 'monospace' }}>
          Loading proposals…
        </div>
      )}
      {!loading && error && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444', fontSize: 12, fontFamily: 'monospace' }}>
          {error}
        </div>
      )}
      {!loading && !error && proposals.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: T.muted, fontSize: 12, fontFamily: 'monospace' }}>
          No proposals match the current filter.
        </div>
      )}
      {!loading && !error && proposals.map(p => (
        <ProposalRow key={p.id} proposal={p} onAction={handleAction} />
      ))}

      {!loading && !error && proposals.length > 0 && (
        <div style={{
          padding: '0.625rem 1.25rem',
          borderTop: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 11, color: T.muted, fontFamily: 'monospace' }}>
            {proposals.length} proposal{proposals.length !== 1 ? 's' : ''}
          </span>
          <a
            href="/a11oy/command/frontier/proposals"
            style={{ fontSize: 11, color: T.gold, fontFamily: 'monospace', textDecoration: 'none' }}
          >
            Full Proposals Board →
          </a>
        </div>
      )}
    </div>
  );
}
