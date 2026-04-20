import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Eye,
  FileText,
  Hand,
  RefreshCw,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Workflow,
  XCircle,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const ACCENT = '#d4a054';

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';

interface ResolvedActor {
  id: number;
  displayName: string;
  email?: string | null;
}

interface ActionApproval {
  id: number;
  requestId: string;
  toolId: string;
  action: string;
  agentId?: string;
  sessionId?: string;
  workflowId?: string;
  status: ApprovalStatus;
  decisionReason?: string;
  requestedById?: number;
  requestedBy?: ResolvedActor;
  approvedById?: number;
  approvedBy?: ResolvedActor;
  approvedAt?: string;
  rejectedById?: number;
  rejectedBy?: ResolvedActor;
  rejectedAt?: string;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

function actorLabel(actor: ResolvedActor | undefined, fallbackId: number | undefined): string {
  if (actor) {
    return actor.email ? `${actor.displayName} (${actor.email})` : actor.displayName;
  }
  return fallbackId !== undefined ? `user #${fallbackId}` : 'unknown user';
}

interface ToolManifest {
  id: string;
  name: string;
  policyTier: string;
  description?: string;
}

type Tab = 'pending' | 'history';

type PolicyMode =
  | 'observe'
  | 'recommend'
  | 'draft'
  | 'approval-required'
  | 'auto-within-guardrails';

interface MemoryRef {
  tier: string;
  key: string;
  freshness?: number;
  confidence?: number;
  summary?: string;
}

interface PolicyEvaluation {
  evaluationId: string;
  resolvedMode: PolicyMode;
  confidence?: number;
  blockedReason?: string;
  approvalRequired?: boolean;
  projectedImpact?: {
    severity: string;
    reversible: boolean;
    estimatedCostUsd?: number;
    affectedEntityIds?: string[];
  };
  projectedRisk?: { level: string; factors: string[] };
  memoryRefs?: MemoryRef[];
  evaluatedAt: number;
}

interface ListResponse<T> {
  data: T[];
  meta?: { total?: number };
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

const TIER_COLORS: Record<string, { fg: string; bg: string; border: string }> = {
  'advisory-only': {
    fg: '#7c8a9a',
    bg: 'rgba(124,138,154,0.10)',
    border: 'rgba(124,138,154,0.30)',
  },
  'internal-workflow': {
    fg: '#6b8f71',
    bg: 'rgba(107,143,113,0.10)',
    border: 'rgba(107,143,113,0.30)',
  },
  'operator-assisted': {
    fg: '#8b7ac8',
    bg: 'rgba(139,122,200,0.10)',
    border: 'rgba(139,122,200,0.30)',
  },
  'executive-facing': {
    fg: '#c9a227',
    bg: 'rgba(201,162,39,0.10)',
    border: 'rgba(201,162,39,0.30)',
  },
  'regulated-workflow': {
    fg: '#d4a054',
    bg: 'rgba(212,160,84,0.10)',
    border: 'rgba(212,160,84,0.30)',
  },
  'external-client-facing': {
    fg: '#0ea5e9',
    bg: 'rgba(14,165,233,0.10)',
    border: 'rgba(14,165,233,0.30)',
  },
  'autonomous-reversible': {
    fg: '#22c55e',
    bg: 'rgba(34,197,94,0.10)',
    border: 'rgba(34,197,94,0.30)',
  },
  'human-approval-mandatory': {
    fg: '#ef4444',
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.30)',
  },
};

function tierStyle(tier?: string) {
  return tier && TIER_COLORS[tier]
    ? TIER_COLORS[tier]
    : { fg: '#7c8a9a', bg: 'rgba(124,138,154,0.10)', border: 'rgba(124,138,154,0.30)' };
}

function timeAgo(iso?: string): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return iso;
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function StatusPill({ status }: { status: ApprovalStatus }) {
  const map: Record<ApprovalStatus, { fg: string; bg: string; border: string; label: string }> = {
    pending: {
      fg: '#d4a054',
      bg: 'rgba(212,160,84,0.12)',
      border: 'rgba(212,160,84,0.35)',
      label: 'PENDING',
    },
    approved: {
      fg: '#22c55e',
      bg: 'rgba(34,197,94,0.12)',
      border: 'rgba(34,197,94,0.35)',
      label: 'APPROVED',
    },
    rejected: {
      fg: '#ef4444',
      bg: 'rgba(239,68,68,0.12)',
      border: 'rgba(239,68,68,0.35)',
      label: 'REJECTED',
    },
    expired: {
      fg: '#7c8a9a',
      bg: 'rgba(124,138,154,0.12)',
      border: 'rgba(124,138,154,0.35)',
      label: 'EXPIRED',
    },
    cancelled: {
      fg: '#7c8a9a',
      bg: 'rgba(124,138,154,0.12)',
      border: 'rgba(124,138,154,0.35)',
      label: 'CANCELLED',
    },
  };
  const s = map[status];
  return (
    <span
      className="text-[9px] font-mono font-semibold tracking-wider px-1.5 py-0.5 rounded"
      style={{ color: s.fg, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

const MODE_COLORS: Record<PolicyMode, string> = {
  observe: '#7c8a9a',
  recommend: '#8b7ac8',
  draft: '#0ea5e9',
  'approval-required': '#d4a054',
  'auto-within-guardrails': '#22c55e',
};

const MODE_ICONS: Record<PolicyMode, React.FC<{ className?: string }>> = {
  observe: Eye,
  recommend: FileText,
  draft: FileText,
  'approval-required': Hand,
  'auto-within-guardrails': Zap,
};

const RISK_COLOR: Record<string, string> = {
  low: '#22c55e',
  medium: '#d4a054',
  high: '#f97316',
  critical: '#ef4444',
};

const TIER_BADGE_COLORS: Record<string, string> = {
  working: '#7c8a9a',
  session: '#8b7ac8',
  episodic: '#0ea5e9',
  semantic: '#22c55e',
  workflow: '#d4a054',
  entity: '#c9a227',
  artifact: '#6b8f71',
  executive: '#ef4444',
  'operator-feedback': '#d4a054',
  'long-term': '#22c55e',
};

function FreshnessBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct > 70 ? '#22c55e' : pct > 40 ? '#d4a054' : '#ef4444';
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-12 h-1 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <div style={{ width: `${pct}%`, background: color, height: '100%' }} />
      </div>
      <span className="text-[9px] font-mono" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

function PolicyEvaluationPanel({ evaluation }: { evaluation?: PolicyEvaluation }) {
  if (!evaluation) return null;

  const ModeIcon = MODE_ICONS[evaluation.resolvedMode] ?? Hand;
  const modeColor = MODE_COLORS[evaluation.resolvedMode] ?? '#d4a054';
  const conf = evaluation.confidence ?? 0;
  const confColor = conf >= 0.8 ? '#22c55e' : conf >= 0.5 ? '#d4a054' : '#ef4444';

  return (
    <div
      className="mt-3 rounded"
      style={{ background: 'rgba(212,160,84,0.04)', border: '1px solid rgba(212,160,84,0.15)' }}
    >
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ borderBottom: '1px solid rgba(212,160,84,0.10)' }}
      >
        <ShieldCheck className="w-3.5 h-3.5" style={{ color: ACCENT }} />
        <span
          className="text-[10px] font-mono font-semibold tracking-wider uppercase"
          style={{ color: ACCENT }}
        >
          Policy Evaluation
        </span>
        <span className="ml-auto text-[9px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {evaluation.evaluationId?.substring(0, 20)}…
        </span>
      </div>

      <div className="px-3 py-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-mono">
        <div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Resolved Mode</span>{' '}
          <span className="inline-flex items-center gap-1 ml-1" style={{ color: modeColor }}>
            <ModeIcon className="w-3 h-3" />
            {evaluation.resolvedMode}
          </span>
        </div>
        <div>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Confidence</span>{' '}
          <span style={{ color: confColor }}>{(conf * 100).toFixed(0)}%</span>
        </div>
        {evaluation.projectedImpact && (
          <>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Impact Severity</span>{' '}
              <span style={{ color: RISK_COLOR[evaluation.projectedImpact.severity] ?? '#d4a054' }}>
                {evaluation.projectedImpact.severity}
              </span>
            </div>
            <div>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>Reversible</span>{' '}
              <span
                style={{ color: evaluation.projectedImpact.reversible ? '#22c55e' : '#ef4444' }}
              >
                {evaluation.projectedImpact.reversible ? 'yes' : 'no'}
              </span>
            </div>
            {evaluation.projectedImpact.estimatedCostUsd !== undefined && (
              <div>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Est. Cost</span>{' '}
                <span style={{ color: 'rgba(255,255,255,0.75)' }}>
                  ${evaluation.projectedImpact.estimatedCostUsd.toLocaleString()}
                </span>
              </div>
            )}
            {(evaluation.projectedImpact.affectedEntityIds?.length ?? 0) > 0 && (
              <div>
                <span style={{ color: 'rgba(255,255,255,0.4)' }}>Entities</span>{' '}
                <span style={{ color: 'rgba(255,255,255,0.65)' }}>
                  {evaluation.projectedImpact.affectedEntityIds!.slice(0, 3).join(', ')}
                  {evaluation.projectedImpact.affectedEntityIds!.length > 3 ? ' …' : ''}
                </span>
              </div>
            )}
          </>
        )}
        {evaluation.projectedRisk && (
          <div className="col-span-2">
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>Risk Level</span>{' '}
            <span style={{ color: RISK_COLOR[evaluation.projectedRisk.level] ?? '#d4a054' }}>
              {evaluation.projectedRisk.level}
            </span>
            {evaluation.projectedRisk.factors.length > 0 && (
              <span className="ml-2 text-[9px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                ({evaluation.projectedRisk.factors.join(' · ')})
              </span>
            )}
          </div>
        )}
        {evaluation.blockedReason && (
          <div className="col-span-2 flex items-start gap-1.5 mt-0.5">
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#f97316' }} />
            <span style={{ color: '#f97316' }}>{evaluation.blockedReason}</span>
          </div>
        )}
      </div>

      {(evaluation.memoryRefs?.length ?? 0) > 0 && (
        <div className="px-3 pb-2.5" style={{ borderTop: '1px solid rgba(212,160,84,0.08)' }}>
          <div
            className="text-[9px] uppercase tracking-widest font-mono mt-2 mb-1.5 flex items-center gap-1.5"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <Database className="w-2.5 h-2.5" /> Evidence Chain — Memory Sources (
            {evaluation.memoryRefs!.length})
          </div>
          <div className="flex flex-col gap-1.5">
            {evaluation.memoryRefs!.map((ref, i) => {
              const tierColor = TIER_BADGE_COLORS[ref.tier] ?? '#7c8a9a';
              return (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded px-2 py-1.5 text-[10px]"
                  style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div
                    className="shrink-0 mt-0.5 px-1 py-px rounded text-[8px] font-mono font-semibold"
                    style={{
                      color: tierColor,
                      background: `${tierColor}18`,
                      border: `1px solid ${tierColor}35`,
                    }}
                  >
                    {ref.tier}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono truncate" style={{ color: 'rgba(255,255,255,0.7)' }}>
                      {ref.key}
                    </div>
                    {ref.summary && (
                      <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {ref.summary}
                      </div>
                    )}
                  </div>
                  {ref.freshness !== undefined && (
                    <div className="shrink-0 flex flex-col items-end gap-0.5">
                      <div
                        className="text-[9px] font-mono"
                        style={{ color: 'rgba(255,255,255,0.3)' }}
                      >
                        freshness
                      </div>
                      <FreshnessBar value={ref.freshness} />
                    </div>
                  )}
                  {ref.confidence !== undefined && (
                    <div
                      className="shrink-0 text-[9px] font-mono"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                    >
                      conf {(ref.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ApprovalRow({
  approval,
  toolName,
  toolTier,
  expanded,
  onToggle,
  onApprove,
  onReject,
  busy,
}: {
  approval: ActionApproval;
  toolName: string;
  toolTier?: string;
  expanded: boolean;
  onToggle: () => void;
  onApprove: (reason: string) => void;
  onReject: (reason: string) => void;
  busy: boolean;
}) {
  const [reason, setReason] = useState('');
  const tier = tierStyle(toolTier);
  const isPending = approval.status === 'pending';

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
            <span className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {toolName}
            </span>
            <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
              · {approval.action}
            </span>
            <span
              className="text-[8px] font-mono font-semibold tracking-wider px-1.5 py-px rounded uppercase"
              style={{ color: tier.fg, background: tier.bg, border: `1px solid ${tier.border}` }}
            >
              {toolTier ?? 'unknown-tier'}
            </span>
            <StatusPill status={approval.status} />
          </div>
          <div
            className="flex items-center gap-3 mt-1 text-[10px] font-mono"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            <span className="flex items-center gap-1">
              <Bot className="w-3 h-3" /> {approval.agentId ?? 'anon-agent'}
            </span>
            {approval.sessionId && (
              <span className="flex items-center gap-1">
                <Workflow className="w-3 h-3" /> session {approval.sessionId.substring(0, 8)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {timeAgo(approval.createdAt)}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.25)' }}>req {approval.requestId}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <PolicyEvaluationPanel
            evaluation={approval.payload?.policyEvaluation as PolicyEvaluation | undefined}
          />

          <div
            className="text-[9px] uppercase tracking-widest font-mono mb-1.5 mt-3"
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

          {approval.decisionReason && (
            <div className="mt-3">
              <div
                className="text-[9px] uppercase tracking-widest font-mono mb-1"
                style={{ color: 'rgba(255,255,255,0.3)' }}
              >
                Decision Reason
              </div>
              <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {approval.decisionReason}
              </div>
            </div>
          )}

          {!isPending && (approval.approvedAt || approval.rejectedAt) && (
            <div className="mt-2 text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {approval.status === 'approved'
                ? `Approved by ${actorLabel(approval.approvedBy, approval.approvedById)} · ${new Date(approval.approvedAt!).toLocaleString()}`
                : approval.status === 'rejected'
                  ? `Rejected by ${actorLabel(approval.rejectedBy, approval.rejectedById)} · ${new Date(approval.rejectedAt!).toLocaleString()}`
                  : null}
            </div>
          )}

          {(approval.requestedBy || approval.requestedById !== undefined) && (
            <div className="mt-1 text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Requested by {actorLabel(approval.requestedBy, approval.requestedById)}
            </div>
          )}

          {isPending && (
            <div className="mt-3 flex flex-col gap-2">
              <input
                type="text"
                placeholder="Optional decision reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
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
                  onClick={() => onApprove(reason || 'Approved by operator')}
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
                  onClick={() => onReject(reason || 'Rejected by operator')}
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
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PolicyApprovalsPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const qc = useQueryClient();

  const approvalsQ = useStandardQuery<ListResponse<ActionApproval>>({
    queryKey: ['guardian', 'actions', tab],
    queryFn: () =>
      fetchJson<ListResponse<ActionApproval>>(
        `/api/guardian/actions?limit=100${tab === 'pending' ? '&status=pending' : ''}`,
      ),
    refetchInterval: tab === 'pending' ? 15_000 : 60_000,
  });

  const toolsQ = useStandardQuery<ListResponse<ToolManifest>>({
    queryKey: ['guardian', 'tools-index'],
    queryFn: () => fetchJson<ListResponse<ToolManifest>>('/api/guardian/tools?limit=200'),
    staleTime: 5 * 60_000,
  });

  const approveMut = useStandardMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      fetchJson(`/api/guardian/actions/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guardian', 'actions'] });
      qc.invalidateQueries({ queryKey: ['guardian', 'actions-pending-count'] });
    },
  });

  const rejectMut = useStandardMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      fetchJson(`/api/guardian/actions/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['guardian', 'actions'] });
      qc.invalidateQueries({ queryKey: ['guardian', 'actions-pending-count'] });
    },
  });

  const toolIndex = useMemo(() => {
    const map = new Map<string, ToolManifest>();
    for (const t of toolsQ.data?.data ?? []) map.set(t.id, t);
    return map;
  }, [toolsQ.data]);

  const all = approvalsQ.data?.data ?? [];
  const pending = all.filter((a) => a.status === 'pending');
  const history = all.filter((a) => a.status !== 'pending');

  const visible = tab === 'pending' ? pending : history;
  const isLoading = approvalsQ.isLoading;
  const error = approvalsQ.error as Error | null;

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
              Policy Approvals
            </h1>
            <div className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Guardian — tool invocations awaiting human review
            </div>
          </div>
        </div>
        <button
          onClick={() => approvalsQ.refetch()}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono transition-colors hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Refresh"
        >
          <RefreshCw className={`w-3 h-3 ${approvalsQ.isFetching ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex items-center gap-1 mb-3">
        {(['pending', 'history'] as Tab[]).map((t) => {
          const active = tab === t;
          const count = t === 'pending' ? pending.length : history.length;
          return (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setExpandedId(null);
              }}
              className="px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-colors"
              style={{
                color: active ? ACCENT : 'rgba(255,255,255,0.5)',
                background: active ? `${ACCENT}14` : 'transparent',
                border: `1px solid ${active ? ACCENT + '30' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              {t === 'pending' ? 'Pending' : 'History'}
              <span
                className="ml-1.5 text-[10px] font-mono"
                style={{ color: active ? ACCENT : 'rgba(255,255,255,0.35)' }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div
          className="rounded p-3 mb-3 flex items-center gap-2 text-[11px]"
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Failed to load approvals: {error.message}
        </div>
      )}

      {isLoading ? (
        <div
          className="text-[11px] font-mono py-8 text-center"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          Loading approvals…
        </div>
      ) : visible.length === 0 ? (
        <div
          className="rounded py-12 text-center"
          style={{
            background: 'rgba(255,255,255,0.015)',
            border: '1px dashed rgba(255,255,255,0.08)',
          }}
        >
          <ShieldCheck
            className="w-8 h-8 mx-auto mb-2"
            style={{ color: 'rgba(255,255,255,0.2)' }}
          />
          <div className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {tab === 'pending'
              ? 'No pending approvals. The queue is clear.'
              : 'No decided approvals yet.'}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((a) => {
            const tool = toolIndex.get(a.toolId);
            return (
              <ApprovalRow
                key={a.id}
                approval={a}
                toolName={tool?.name ?? a.toolId}
                toolTier={tool?.policyTier}
                expanded={expandedId === a.id}
                onToggle={() => setExpandedId(expandedId === a.id ? null : a.id)}
                onApprove={(reason) => approveMut.mutate({ id: a.id, reason })}
                onReject={(reason) => rejectMut.mutate({ id: a.id, reason })}
                busy={approveMut.isPending || rejectMut.isPending}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
