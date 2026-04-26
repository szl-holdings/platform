import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { toast, Toaster } from 'sonner';
import { heliosApi, type CapabilityProposal } from '../lib/api';

const STATUS_META = {
  new:      { label: 'New',      color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.2)' },
  accepted: { label: 'Accepted', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.2)' },
  deferred: { label: 'Deferred', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.2)' },
  rejected: { label: 'Rejected', color: '#f87171', bg: 'rgba(248,113,113,0.1)',  border: 'rgba(248,113,113,0.2)' },
};

const PRIORITY_META = {
  P0: { color: '#f87171', label: 'Critical' },
  P1: { color: '#fb923c', label: 'High' },
  P2: { color: '#f59e0b', label: 'Medium' },
  P3: { color: '#60a5fa', label: 'Low' },
};

const AGENT_COLORS: Record<string, string> = {
  Sentra: '#f87171', Counsel: '#a78bfa', Terra: '#34d399',
  Vessels: '#60a5fa', Aegis: '#fb923c', Lyte: '#2dd4bf', 'A11oy': '#f59e0b',
};

function ProposalCard({ proposal }: { proposal: CapabilityProposal }) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  const statusMeta = STATUS_META[proposal.status];
  const priorityMeta = PRIORITY_META[proposal.priority];
  const agentColor = AGENT_COLORS[proposal.targetAgent] ?? '#888';

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ status }: { status: 'accepted' | 'deferred' | 'rejected' }) =>
      heliosApi.updateProposalStatus(proposal.id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['helios-stats'] });
      toast.success(`Proposal ${data.proposal.status}`);
    },
    onError: () => toast.error('Failed to update proposal status'),
  });

  return (
    <div
      className="section-card animate-fadeIn"
      style={{ marginBottom: 10, borderLeft: `3px solid ${statusMeta.color}40` }}
    >
      <div style={{ padding: '14px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
              {/* Priority */}
              <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em', color: priorityMeta.color, background: `${priorityMeta.color}15`, border: `1px solid ${priorityMeta.color}30` }}>
                {proposal.priority}
              </span>
              {/* Status */}
              <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.05em', color: statusMeta.color, background: statusMeta.bg, border: `1px solid ${statusMeta.border}` }}>
                {statusMeta.label}
              </span>
              {/* Target agent */}
              <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: '0.67rem', fontWeight: 600, color: agentColor, background: `${agentColor}12`, border: `1px solid ${agentColor}25` }}>
                {proposal.targetAgent}
              </span>
              {/* Impact area */}
              <span style={{ fontSize: '0.67rem', color: 'var(--helios-text-muted)' }}>
                {proposal.impactArea}
              </span>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--helios-text)', lineHeight: 1.35, marginBottom: 4 }}>
              {proposal.title}
            </div>
            <div style={{ fontSize: '0.79rem', color: 'var(--helios-text-dim)', lineHeight: 1.5 }}>
              {proposal.description}
            </div>
          </div>
        </div>

        {/* Actions (only for 'new') */}
        {proposal.status === 'new' && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button
              onClick={() => updateStatus({ status: 'accepted' })}
              disabled={isPending}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', color: '#60a5fa' }}
            >
              <Check size={12} /> Accept
            </button>
            <button
              onClick={() => updateStatus({ status: 'deferred' })}
              disabled={isPending}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}
            >
              <Clock size={12} /> Defer
            </button>
            <button
              onClick={() => updateStatus({ status: 'rejected' })}
              disabled={isPending}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 5, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171' }}
            >
              <X size={12} /> Reject
            </button>
          </div>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--helios-text-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          {expanded ? 'Hide details' : 'Show rationale & signals'}
        </button>

        {expanded && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--helios-border)' }}>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--helios-text-muted)', marginBottom: 5 }}>
                Rationale
              </div>
              <div style={{ fontSize: '0.79rem', color: 'var(--helios-text-dim)', lineHeight: 1.55 }}>
                {proposal.rationale}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--helios-text-muted)', marginBottom: 4 }}>
                  Effort
                </div>
                <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>
                  {proposal.estimatedEffort}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--helios-text-muted)', marginBottom: 4 }}>
                  Source Signals
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {proposal.signalIds.slice(0, 3).map((id) => (
                    <span key={id} style={{ padding: '1px 6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3, fontSize: '0.65rem', fontFamily: 'JetBrains Mono, monospace', color: 'var(--helios-text-muted)' }}>
                      {id.slice(0, 8)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.67rem', color: 'var(--helios-text-muted)' }}>
              Created {formatDistanceToNow(new Date(proposal.createdAt), { addSuffix: true })} · Updated {formatDistanceToNow(new Date(proposal.updatedAt), { addSuffix: true })}
            </div>

            {/* Push to tasks link */}
            {proposal.status === 'accepted' && (
              <div style={{ marginTop: 10 }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                  <ExternalLink size={11} />
                  Push to Project Tasks
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_FILTERS = ['all', 'new', 'accepted', 'deferred', 'rejected'] as const;

export default function CapabilityProposals() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['proposals', statusFilter],
    queryFn: () => heliosApi.getProposals(statusFilter === 'all' ? undefined : statusFilter),
  });

  const proposals = data?.proposals ?? [];
  const newCount = proposals.filter(p => p.status === 'new').length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 900, margin: '0 auto' }}>
      <Toaster position="bottom-right" theme="dark" />
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Sparkles size={20} color="var(--helios-amber)" />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--helios-text)', letterSpacing: '-0.01em' }}>
            Capability Proposals
          </h1>
          {newCount > 0 && (
            <span style={{ padding: '2px 8px', borderRadius: 10, background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.25)', fontSize: '0.7rem', fontWeight: 700, color: '#34d399' }}>
              {newCount} new
            </span>
          )}
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--helios-text-muted)', lineHeight: 1.5 }}>
          Actionable upgrade recommendations generated by the Evolution Engine from high-impact frontier signals. Review, accept, defer, or reject each proposal.
        </p>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_FILTERS.map((s) => {
          const meta = s !== 'all' ? STATUS_META[s] : null;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '5px 12px', borderRadius: 5, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', border: '1px solid',
                background: statusFilter === s ? (meta?.bg ?? 'rgba(245,158,11,0.1)') : 'transparent',
                color: statusFilter === s ? (meta?.color ?? '#f59e0b') : 'var(--helios-text-muted)',
                borderColor: statusFilter === s ? (meta?.border ?? 'rgba(245,158,11,0.3)') : 'rgba(255,255,255,0.08)',
                textTransform: 'capitalize',
              }}
            >
              {s === 'all' ? 'All Proposals' : meta?.label}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      {data && (
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={12} color="var(--helios-text-muted)" />
          <span style={{ fontSize: '0.72rem', color: 'var(--helios-text-muted)' }}>
            {data.total} proposal{data.total !== 1 ? 's' : ''} {statusFilter !== 'all' ? `with status "${statusFilter}"` : 'total'}
          </span>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="section-card" style={{ padding: 16, opacity: 0.5 }}>
              <div style={{ height: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 4, marginBottom: 8, width: '55%' }} />
              <div style={{ height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4, width: '85%' }} />
            </div>
          ))}
        </div>
      ) : proposals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--helios-text-muted)' }}>
          <Sparkles size={32} style={{ marginBottom: 12, opacity: 0.3 }} />
          <div style={{ fontWeight: 600, marginBottom: 4 }}>No proposals in this queue</div>
          <div style={{ fontSize: '0.825rem' }}>The Evolution Engine will generate proposals as high-impact signals arrive.</div>
        </div>
      ) : (
        proposals.map((p) => <ProposalCard key={p.id} proposal={p} />)
      )}
    </div>
  );
}
