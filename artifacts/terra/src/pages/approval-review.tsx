import { EmptyState } from '@szl-holdings/shared-ui/EmptyState';
import { PolicyResultBanner } from '@szl-holdings/shared-ui/policy-result';
import { RiskEvidenceList } from '@szl-holdings/shared-ui/risk-evidence';
import {
  ArrowUpRight,
  CheckCircle,
  ChevronRight,
  Download,
  FileText,
  MessageSquare,
  Shield,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { type PropertyApproval, propertyTwins } from '@/data/property-twin';

const ACCENT = '#40856a';

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  pending: { color: '#c08a2c', bg: '#c08a2c20', label: 'Pending' },
  approved: { color: '#40856a', bg: '#40856a20', label: 'Approved' },
  rejected: { color: '#c04a2a', bg: '#c04a2a20', label: 'Rejected' },
  escalated: { color: '#a855f7', bg: '#a855f720', label: 'Escalated' },
  withdrawn: { color: 'rgba(255,255,255,0.25)', bg: 'rgba(255,255,255,0.04)', label: 'Withdrawn' },
};

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
  critical: { color: '#c04a2a', bg: '#c04a2a20' },
  high: { color: '#c08a2c', bg: '#c08a2c20' },
  medium: { color: '#4a7dc8', bg: '#4a7dc820' },
  low: { color: 'rgba(255,255,255,0.35)', bg: 'rgba(255,255,255,0.04)' },
};

const ACTION_LABELS: Record<string, string> = {
  acquisition: 'Acquisition',
  disposition: 'Disposition',
  refinance: 'Refinance',
  diligence: 'Diligence',
  export_packet: 'Export Packet',
};

interface FlatApproval extends PropertyApproval {
  propertyName: string;
}

function ApprovalCard({
  approval,
  onAction,
}: {
  approval: FlatApproval;
  onAction: (id: string, action: 'approve' | 'reject' | 'escalate') => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [_comment, _setComment] = useState('');
  const ss = STATUS_STYLE[approval.status];
  const ps = PRIORITY_STYLE[approval.priority];

  return (
    <div
      className="rounded-xl border transition-all duration-200"
      style={{
        background: approval.status === 'pending' ? '#c08a2c05' : 'rgba(255,255,255,0.02)',
        borderColor: approval.status === 'pending' ? '#c08a2c20' : 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: '#4a7dc815', color: '#4a7dc8' }}
              >
                {ACTION_LABELS[approval.actionClass] ?? approval.actionClass}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: ps.bg, color: ps.color }}
              >
                {approval.priority}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: ss.bg, color: ss.color }}
              >
                {ss.label}
              </span>
            </div>
            <div className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {approval.title}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {approval.propertyName} · Requested by {approval.requestedBy} ·{' '}
              {relTime(approval.requestedAt)}
            </div>
          </div>
        </div>

        <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {approval.description}
        </p>

        {approval.comments.length > 0 && (
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs mb-3 hover:opacity-70 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <MessageSquare size={12} />
            {approval.comments.length} comment{approval.comments.length > 1 ? 's' : ''}
            <ChevronRight
              size={12}
              style={{
                transform: showComments ? 'rotate(90deg)' : 'none',
                transition: 'transform 0.2s',
              }}
            />
          </button>
        )}

        {showComments && (
          <div
            className="mb-3 space-y-2 pl-4 border-l"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            {approval.comments.map((c, i) => (
              <div key={i} className="text-xs">
                <span className="font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {c.author}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.25)' }}> · {relTime(c.at)}</span>
                {c.internal && (
                  <span className="ml-1 text-xs" style={{ color: '#a855f7' }}>
                    (internal)
                  </span>
                )}
                <p className="mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {c.body}
                </p>
              </div>
            ))}
          </div>
        )}

        {approval.status === 'pending' && (
          <>
            <div className="mb-3">
              <PolicyResultBanner
                decision={{
                  effect: 'escalate',
                  allowed: false,
                  reason: `${ACTION_LABELS[approval.actionClass] ?? approval.actionClass} policy requires human approval at ${approval.priority} priority before execution.`,
                  escalationPath: ['Deal Manager', 'Fund Controller'],
                  whatNeedsToChange: [
                    'Authorized reviewer must approve',
                    'Review supporting documentation before deciding',
                  ],
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAction(approval.id, 'approve')}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                style={{ background: ACCENT, color: 'white' }}
              >
                <CheckCircle size={12} />
                Approve
              </button>
              <button
                onClick={() => onAction(approval.id, 'reject')}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
                style={{ border: '1px solid #c04a2a40', color: '#c04a2a' }}
              >
                <X size={12} />
                Reject
              </button>
              <button
                onClick={() => onAction(approval.id, 'escalate')}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.4)',
                }}
              >
                <ArrowUpRight size={12} />
                Escalate
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ApprovalReview() {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [approvalStates, setApprovalStates] = useState<Record<string, string>>({});

  const allApprovals: FlatApproval[] = propertyTwins.flatMap((t) =>
    t.approvals.map((a) => ({ ...a, propertyName: t.name })),
  );

  function handleAction(id: string, action: 'approve' | 'reject' | 'escalate') {
    const map: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      escalate: 'escalated',
    };
    setApprovalStates((prev) => ({ ...prev, [id]: map[action] }));
  }

  const displayed = allApprovals
    .map((a) => ({
      ...a,
      status: (approvalStates[a.id] ?? a.status) as PropertyApproval['status'],
    }))
    .filter((a) => statusFilter === 'all' || a.status === statusFilter);

  const pending = allApprovals.filter(
    (a) => (approvalStates[a.id] ?? a.status) === 'pending',
  ).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
              Review & Approval
            </h1>
            {pending > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: '#c08a2c20', color: '#c08a2c' }}
              >
                {pending} pending
              </span>
            )}
          </div>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Manage approval requests across all property actions — diligence gates, transactions,
            and export packets
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {['all', 'pending', 'approved', 'rejected'].map((s) => {
          const count =
            s === 'all'
              ? allApprovals.length
              : allApprovals.filter((a) => (approvalStates[a.id] ?? a.status) === s).length;
          const ss =
            s === 'all'
              ? {
                  color: 'rgba(255,255,255,0.7)',
                  bg: 'rgba(255,255,255,0.04)',
                  border: 'rgba(255,255,255,0.08)',
                }
              : ({
                  pending: { color: '#c08a2c', bg: '#c08a2c08', border: '#c08a2c25' },
                  approved: { color: '#40856a', bg: '#40856a08', border: '#40856a25' },
                  rejected: { color: '#c04a2a', bg: '#c04a2a08', border: '#c04a2a25' },
                }[s] ?? {
                  color: 'rgba(255,255,255,0.5)',
                  bg: 'rgba(255,255,255,0.02)',
                  border: 'rgba(255,255,255,0.06)',
                });
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="rounded-xl border p-3 text-left transition-all"
              style={{
                background: statusFilter === s ? ss.bg : 'rgba(255,255,255,0.01)',
                borderColor: statusFilter === s ? ss.border : 'rgba(255,255,255,0.04)',
              }}
            >
              <div
                className="text-lg font-bold"
                style={{ color: statusFilter === s ? ss.color : 'rgba(255,255,255,0.6)' }}
              >
                {count}
              </div>
              <div
                className="text-xs capitalize mt-0.5"
                style={{ color: 'rgba(255,255,255,0.35)' }}
              >
                {s}
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {displayed.length === 0 ? (
          <EmptyState
            icon={Shield}
            headline="No approvals"
            description={
              statusFilter === 'pending'
                ? 'No pending approvals at this time.'
                : `No ${statusFilter} approvals.`
            }
            accentColor={ACCENT}
          />
        ) : (
          displayed.map((a) => <ApprovalCard key={a.id} approval={a} onAction={handleAction} />)
        )}
      </div>

      <div className="mt-6">
        <RiskEvidenceList
          domain="terra"
          domainLabel="Cited Risk Simulations"
          accentColor={ACCENT}
          emptyHint="Reviewers can cite Monte Carlo runs by opening Risk Simulation and using Save run as evidence. Cited runs appear here for inclusion in approval decisions and export packets."
        />
      </div>

      <div
        className="mt-8 rounded-xl border p-4"
        style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <FileText size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
          <h3 className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Export Packet / Audit Trail
          </h3>
        </div>
        <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Generate a signed export packet for any property — includes diligence summary, approval
          log, and full audit trace. Packets are immutable once generated and tied to the audit
          chain.
        </p>
        <button
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
          style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
        >
          <Download size={12} />
          Generate Export Packet
        </button>
      </div>
    </div>
  );
}
