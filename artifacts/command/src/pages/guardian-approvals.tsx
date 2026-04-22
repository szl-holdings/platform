import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Users,
  Workflow,
  Wrench,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const ACCENT = '#d4a054';

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
type ApprovalType = 'single' | 'dual';
type RollbackStatus = 'pending' | 'in-progress' | 'completed' | 'failed';
type GuardianTier =
  | 'advisory'
  | 'supervised'
  | 'operator-approved'
  | 'dual-approved'
  | 'regulated'
  | 'sovereign';

interface ApprovalDecision {
  approverId: string;
  approverRole: string;
  decision: 'approved' | 'rejected';
  note?: string;
  decidedAt: string;
}

interface GuardianApprovalRequest {
  id: number;
  requestId: string;
  agentId?: string | null;
  sessionId?: string | null;
  workflowId?: string | null;
  orgId?: number | null;
  tier: GuardianTier;
  action: string;
  toolId?: string | null;
  approvalType: ApprovalType;
  status: ApprovalStatus;
  requiredApprovers: string[];
  approvals: ApprovalDecision[];
  payload: Record<string, unknown>;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RollbackEvent {
  id: number;
  actionId: string;
  requestId: string;
  agentId?: string | null;
  orgId?: number | null;
  tier: GuardianTier;
  triggeredBy: string;
  reason: string;
  status: RollbackStatus;
  metadata: Record<string, unknown>;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ListResponse<T> {
  data: T[];
  meta?: { total?: number; page?: number; limit?: number };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

const TIER_COLORS: Record<
  GuardianTier,
  { fg: string; bg: string; border: string; tierNumber: string }
> = {
  advisory: {
    fg: '#7c8a9a',
    bg: 'rgba(124,138,154,0.10)',
    border: 'rgba(124,138,154,0.30)',
    tierNumber: 'T0',
  },
  supervised: {
    fg: '#6b8f71',
    bg: 'rgba(107,143,113,0.10)',
    border: 'rgba(107,143,113,0.30)',
    tierNumber: 'T1',
  },
  'operator-approved': {
    fg: '#8b7ac8',
    bg: 'rgba(139,122,200,0.10)',
    border: 'rgba(139,122,200,0.30)',
    tierNumber: 'T2',
  },
  'dual-approved': {
    fg: '#d4a054',
    bg: 'rgba(212,160,84,0.10)',
    border: 'rgba(212,160,84,0.30)',
    tierNumber: 'T3',
  },
  regulated: {
    fg: '#f97316',
    bg: 'rgba(249,115,22,0.10)',
    border: 'rgba(249,115,22,0.30)',
    tierNumber: 'T4',
  },
  sovereign: {
    fg: '#ef4444',
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.30)',
    tierNumber: 'T5',
  },
};

function tierStyle(tier: GuardianTier) {
  return TIER_COLORS[tier] ?? TIER_COLORS.advisory;
}

function timeAgo(iso?: string | null): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const STATUS_COLORS: Record<ApprovalStatus, { fg: string; bg: string; border: string }> = {
  pending: { fg: '#d4a054', bg: 'rgba(212,160,84,0.12)', border: 'rgba(212,160,84,0.35)' },
  approved: { fg: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)' },
  rejected: { fg: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' },
  expired: { fg: '#7c8a9a', bg: 'rgba(124,138,154,0.12)', border: 'rgba(124,138,154,0.35)' },
  cancelled: { fg: '#7c8a9a', bg: 'rgba(124,138,154,0.12)', border: 'rgba(124,138,154,0.35)' },
};

const ROLLBACK_STATUS_COLORS: Record<RollbackStatus, { fg: string; bg: string; border: string }> = {
  pending: { fg: '#d4a054', bg: 'rgba(212,160,84,0.12)', border: 'rgba(212,160,84,0.35)' },
  'in-progress': { fg: '#0ea5e9', bg: 'rgba(14,165,233,0.12)', border: 'rgba(14,165,233,0.35)' },
  completed: { fg: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)' },
  failed: { fg: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' },
};

function StatusPill({ status }: { status: ApprovalStatus }) {
  const s = STATUS_COLORS[status];
  return (
    <span
      className="text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded uppercase"
      style={{ color: s.fg, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {status}
    </span>
  );
}

function RollbackStatusPill({ status }: { status: RollbackStatus }) {
  const s = ROLLBACK_STATUS_COLORS[status];
  return (
    <span
      className="text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded uppercase"
      style={{ color: s.fg, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {status}
    </span>
  );
}

function summarizePayload(payload: Record<string, unknown>): string {
  const keys = Object.keys(payload ?? {}).filter(
    (k) => k !== 'policyEvaluation' && k !== 'policy_evaluation',
  );
  if (keys.length === 0) return '(no payload)';
  const parts: string[] = [];
  for (const k of keys.slice(0, 4)) {
    const v = payload[k];
    let display: string;
    if (v === null || v === undefined) display = 'null';
    else if (typeof v === 'string') display = v.length > 40 ? `${v.slice(0, 40)}…` : v;
    else if (typeof v === 'number' || typeof v === 'boolean') display = String(v);
    else if (Array.isArray(v)) display = `[${v.length}]`;
    else display = '{…}';
    parts.push(`${k}=${display}`);
  }
  if (keys.length > 4) parts.push(`+${keys.length - 4} more`);
  return parts.join(' · ');
}

function ApprovalProgress({ approval }: { approval: GuardianApprovalRequest }) {
  const required = approval.approvalType === 'dual' ? 2 : 1;
  const approved = approval.approvals.filter((a) => a.decision === 'approved');
  const rejected = approval.approvals.filter((a) => a.decision === 'rejected');
  const received = approval.approvals.length;

  const dots: React.ReactNode[] = [];
  for (let i = 0; i < required; i++) {
    const decision = approval.approvals[i];
    let color = 'rgba(255,255,255,0.15)';
    if (decision?.decision === 'approved') color = '#22c55e';
    else if (decision?.decision === 'rejected') color = '#ef4444';
    dots.push(
      <span
        key={i}
        className="inline-block w-2 h-2 rounded-full"
        style={{ background: color, border: '1px solid rgba(255,255,255,0.15)' }}
      />,
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-1">{dots}</div>
      <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.5)' }}>
        {received}/{required}
        {rejected.length > 0 ? ` · ${rejected.length} rejected` : ''}
        {approved.length > 0 && approval.status === 'pending'
          ? ` · ${approved.length} approved`
          : ''}
      </span>
    </div>
  );
}

function ApprovalsTimeline({ approvals }: { approvals: ApprovalDecision[] }) {
  if (approvals.length === 0) {
    return (
      <div className="text-[10px] font-mono italic" style={{ color: 'rgba(255,255,255,0.35)' }}>
        No reviews submitted yet
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      {approvals.map((a, i) => {
        const isApprove = a.decision === 'approved';
        const color = isApprove ? '#22c55e' : '#ef4444';
        const Icon = isApprove ? CheckCircle2 : XCircle;
        return (
          <div
            key={`${a.approverId}-${i}`}
            className="flex items-start gap-2 rounded px-2 py-1.5 text-[10px]"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}
          >
            <Icon className="w-3 h-3 mt-0.5 shrink-0" style={{ color }} />
            <div className="flex-1 min-w-0">
              <div className="font-mono" style={{ color: 'rgba(255,255,255,0.75)' }}>
                <span style={{ color }}>{a.decision}</span> by {a.approverId}{' '}
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>(role: {a.approverRole})</span>
              </div>
              {a.note && (
                <div className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  “{a.note}”
                </div>
              )}
              <div
                className="text-[9px] mt-0.5 font-mono"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                {new Date(a.decidedAt).toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ApprovalRow({
  approval,
  expanded,
  onToggle,
  onReview,
  busy,
}: {
  approval: GuardianApprovalRequest;
  expanded: boolean;
  onToggle: () => void;
  onReview: (decision: 'approved' | 'rejected', note: string) => void;
  busy: boolean;
}) {
  const [note, setNote] = useState('');
  const tier = tierStyle(approval.tier);
  const isPending = approval.status === 'pending';
  const summary = summarizePayload(approval.payload);
  const expired =
    approval.expiresAt &&
    new Date(approval.expiresAt).getTime() < Date.now() &&
    approval.status === 'pending';

  return (
    <div
      className="rounded border"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span style={{ color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[8px] font-mono font-semibold tracking-wider px-1.5 py-px rounded"
              style={{ color: tier.fg, background: tier.bg, border: `1px solid ${tier.border}` }}
              title={`Guardian tier: ${approval.tier}`}
            >
              {tier.tierNumber} · {approval.tier}
            </span>
            <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {approval.action}
            </span>
            {approval.toolId && (
              <span
                className="text-[10px] font-mono inline-flex items-center gap-1"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                <Wrench className="w-3 h-3" /> {approval.toolId}
              </span>
            )}
            <span
              className="text-[8px] font-mono font-semibold tracking-wider px-1.5 py-px rounded uppercase"
              style={{
                color: approval.approvalType === 'dual' ? '#d4a054' : '#7c8a9a',
                background:
                  approval.approvalType === 'dual'
                    ? 'rgba(212,160,84,0.10)'
                    : 'rgba(124,138,154,0.10)',
                border: `1px solid ${approval.approvalType === 'dual' ? 'rgba(212,160,84,0.30)' : 'rgba(124,138,154,0.30)'}`,
              }}
            >
              {approval.approvalType === 'dual' ? 'Dual approval' : 'Single approval'}
            </span>
            <StatusPill status={approval.status} />
            {expired && (
              <span
                className="text-[8px] font-mono font-semibold tracking-wider px-1.5 py-px rounded uppercase"
                style={{
                  color: '#f97316',
                  background: 'rgba(249,115,22,0.10)',
                  border: '1px solid rgba(249,115,22,0.30)',
                }}
              >
                expired
              </span>
            )}
          </div>
          <div
            className="flex items-center gap-3 mt-1 text-[10px] font-mono flex-wrap"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <span className="flex items-center gap-1">
              <Bot className="w-3 h-3" /> {approval.agentId ?? 'anon-agent'}
            </span>
            {approval.workflowId && (
              <span className="flex items-center gap-1">
                <Workflow className="w-3 h-3" /> wf {approval.workflowId.substring(0, 10)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo(approval.createdAt)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>
              req {approval.requestId.substring(0, 12)}
            </span>
            <ApprovalProgress approval={approval} />
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />{' '}
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                {approval.requiredApprovers.length > 0
                  ? approval.requiredApprovers.join(', ')
                  : 'approver'}
              </span>
            </span>
          </div>
          <div
            className="mt-1 text-[10px] font-mono truncate"
            style={{ color: 'rgba(255,255,255,0.45)' }}
            title={summary}
          >
            {summary}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <div className="grid md:grid-cols-2 gap-3 mt-2">
            <div>
              <div
                className="text-[9px] uppercase tracking-widest font-mono mb-1.5"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Reviews ({approval.approvals.length}/{approval.approvalType === 'dual' ? 2 : 1})
              </div>
              <ApprovalsTimeline approvals={approval.approvals} />
            </div>
            <div>
              <div
                className="text-[9px] uppercase tracking-widest font-mono mb-1.5"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Payload
              </div>
              <pre
                className="text-[10px] font-mono p-2 rounded overflow-auto max-h-40"
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  color: 'rgba(200,210,225,0.85)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {JSON.stringify(approval.payload ?? {}, null, 2)}
              </pre>
            </div>
          </div>

          {approval.expiresAt && (
            <div
              className="mt-3 text-[10px] font-mono flex items-center gap-1.5"
              style={{ color: expired ? '#f97316' : 'rgba(255,255,255,0.45)' }}
            >
              <Clock className="w-3 h-3" />
              Expires {new Date(approval.expiresAt).toLocaleString()}
            </div>
          )}

          {isPending && !expired && (
            <div className="mt-3 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Optional review note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="text-[11px] px-2 py-1.5 rounded outline-none"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)',
                }}
              />
              <div className="flex items-center gap-2">
                <button
                  disabled={busy}
                  onClick={() => onReview('approved', note)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-opacity disabled:opacity-50"
                  style={{
                    color: '#22c55e',
                    background: 'rgba(34,197,94,0.10)',
                    border: '1px solid rgba(34,197,94,0.35)',
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button
                  disabled={busy}
                  onClick={() => onReview('rejected', note)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold transition-opacity disabled:opacity-50"
                  style={{
                    color: '#ef4444',
                    background: 'rgba(239,68,68,0.10)',
                    border: '1px solid rgba(239,68,68,0.35)',
                  }}
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
                {approval.approvalType === 'dual' && (
                  <span
                    className="text-[10px] font-mono ml-1"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    Dual approval — needs two distinct reviewers from{' '}
                    {approval.requiredApprovers.join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RollbackRow({ event }: { event: RollbackEvent }) {
  const tier = tierStyle(event.tier);
  return (
    <div
      className="rounded border px-3 py-2.5"
      style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}
    >
      <div className="flex items-start gap-3">
        <RotateCcw className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: ACCENT }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[8px] font-mono font-semibold tracking-wider px-1.5 py-px rounded"
              style={{ color: tier.fg, background: tier.bg, border: `1px solid ${tier.border}` }}
            >
              {tier.tierNumber} · {event.tier}
            </span>
            <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
              Action {event.actionId}
            </span>
            <RollbackStatusPill status={event.status} />
          </div>
          <div
            className="flex items-center gap-3 mt-1 text-[10px] font-mono flex-wrap"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <span>req {event.requestId.substring(0, 12)}</span>
            {event.agentId && (
              <span className="flex items-center gap-1">
                <Bot className="w-3 h-3" /> {event.agentId}
              </span>
            )}
            <span>triggered by {event.triggeredBy}</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo(event.createdAt)}
            </span>
            {event.completedAt && (
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>
                completed {timeAgo(event.completedAt)}
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {event.reason}
          </div>
        </div>
      </div>
    </div>
  );
}

type Tab = 'pending' | 'history' | 'rollback';

export default function GuardianApprovalsPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const qc = useQueryClient();

  const approvalsQ = useStandardQuery<ListResponse<GuardianApprovalRequest>>({
    queryKey: ['guardian', 'approval-requests', tab === 'rollback' ? 'all' : tab],
    queryFn: () =>
      fetchJson<ListResponse<GuardianApprovalRequest>>(
        `/api/guardian/approvals?limit=100${tab === 'pending' ? '&status=pending' : ''}`,
      ),
    refetchInterval: tab === 'pending' ? 15_000 : 60_000,
    enabled: tab !== 'rollback',
  });

  const rollbackQ = useStandardQuery<ListResponse<RollbackEvent>>({
    queryKey: ['guardian', 'rollback-events'],
    queryFn: () =>
      fetchJson<ListResponse<RollbackEvent>>(`/api/guardian/rollback-events?limit=100`),
    refetchInterval: 30_000,
    enabled: tab === 'rollback',
  });

  const reviewMut = useStandardMutation({
    mutationFn: ({
      requestId,
      decision,
      note,
    }: {
      requestId: string;
      decision: 'approved' | 'rejected';
      note: string;
    }) =>
      fetchJson(`/api/guardian/approvals/${requestId}/review`, {
        method: 'POST',
        body: JSON.stringify({ decision, note: note || undefined }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guardian', 'approval-requests'] });
    },
  });

  const all = approvalsQ.data?.data ?? [];
  const pending = useMemo(() => all.filter((a) => a.status === 'pending'), [all]);
  const history = useMemo(() => all.filter((a) => a.status !== 'pending'), [all]);
  const rollback = rollbackQ.data?.data ?? [];

  const isLoading = tab === 'rollback' ? rollbackQ.isLoading : approvalsQ.isLoading;
  const error = (tab === 'rollback' ? rollbackQ.error : approvalsQ.error) as Error | null;
  const isFetching = tab === 'rollback' ? rollbackQ.isFetching : approvalsQ.isFetching;

  const refresh = () => {
    if (tab === 'rollback') rollbackQ.refetch();
    else approvalsQ.refetch();
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ background: `${ACCENT}12`, border: `1px solid ${ACCENT}30` }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div>
            <h1
              className="text-[14px] font-bold tracking-wide"
              style={{ color: 'rgba(255,255,255,0.95)' }}
            >
              Guardian Console
            </h1>
            <div className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Multi-tier (T2–T4) approval gates and rollback events
            </div>
          </div>
        </div>
        <button
          onClick={refresh}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-colors hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Refresh"
        >
          <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-1 mb-3">
        {[
          { id: 'pending' as Tab, label: 'Pending', count: pending.length },
          { id: 'history' as Tab, label: 'History', count: history.length },
          { id: 'rollback' as Tab, label: 'Rollback events', count: rollback.length },
        ].map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setExpandedId(null);
              }}
              className="px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors"
              style={{
                color: active ? ACCENT : 'rgba(255,255,255,0.5)',
                background: active ? `${ACCENT}10` : 'transparent',
                border: `1px solid ${active ? `${ACCENT}30` : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {t.label}{' '}
              <span className="ml-1 text-[10px] font-mono" style={{ opacity: 0.7 }}>
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div
          className="text-[11px] font-mono py-8 text-center"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Loading…
        </div>
      )}

      {error && (
        <div
          className="rounded p-3 text-[11px] font-mono mb-3 flex items-start gap-2"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Failed to load</div>
            <div className="opacity-80 mt-0.5">{error.message}</div>
          </div>
        </div>
      )}

      {!isLoading && !error && (
        <div className="flex flex-col gap-2">
          {tab === 'rollback' ? (
            rollback.length === 0 ? (
              <div
                className="text-[11px] font-mono py-8 text-center"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                No rollback events recorded.
              </div>
            ) : (
              rollback.map((r) => <RollbackRow key={r.id} event={r} />)
            )
          ) : (
            (() => {
              const visible = tab === 'pending' ? pending : history;
              if (visible.length === 0) {
                return (
                  <div
                    className="text-[11px] font-mono py-8 text-center"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    {tab === 'pending'
                      ? 'No pending Guardian approvals — every gated action has been reviewed.'
                      : 'No reviewed approvals yet.'}
                  </div>
                );
              }
              return visible.map((a) => (
                <ApprovalRow
                  key={a.id}
                  approval={a}
                  expanded={expandedId === a.id}
                  onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
                  onReview={(decision, note) =>
                    reviewMut.mutate({ requestId: a.requestId, decision, note })
                  }
                  busy={reviewMut.isPending}
                />
              ));
            })()
          )}
        </div>
      )}

      {reviewMut.error && (
        <div
          className="mt-3 rounded p-2 text-[10px] font-mono"
          style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
          }}
        >
          Review failed: {(reviewMut.error as Error).message}
        </div>
      )}
    </div>
  );
}
