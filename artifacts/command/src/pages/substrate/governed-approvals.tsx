/**
 * Governed Approvals — lists ApprovalRequest records from the ACR governed
 * store, shows full context (step, interrupt spec, policy reason, evidence
 * summary, suggested decision), and lets an operator approve, deny, or
 * escalate with a signed justification.
 *
 * Data source: GET /api/v1/approvals (governed store, not SubstrateClient)
 */

import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  Shield,
  XCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import type { ApprovalRequest } from './governance-types';
import { formatAge } from './layout';
import { decideGovernedApproval, useGovernedApprovals } from './use-governance';

const ACCENT = '#22d3ee';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#22c55e',
  denied: '#ef4444',
  escalated: '#a78bfa',
  timed_out: 'rgba(255,255,255,0.3)',
};

const VERDICT_CONFIG = {
  approve: { color: '#22c55e', label: 'Approve', icon: CheckCircle2 },
  deny: { color: '#ef4444', label: 'Deny', icon: XCircle },
  escalate: { color: '#f59e0b', label: 'Escalate', icon: ChevronUp },
};

function DecisionDialog({
  request,
  initialVerdict,
  onClose,
  onDecided,
}: {
  request: ApprovalRequest;
  initialVerdict: 'approve' | 'deny' | 'escalate';
  onClose: () => void;
  onDecided: () => void;
}) {
  const [verdict, setVerdict] = useState<'approve' | 'deny' | 'escalate'>(initialVerdict);
  const [reason, setReason] = useState('');
  const [actor, setActor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isValid = reason.trim().length >= 10 && actor.trim().length >= 2;

  async function handleSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    try {
      await decideGovernedApproval(request.id, {
        verdict,
        actor: actor.trim(),
        reason: reason.trim(),
      });
      toast.success(`Decision recorded: ${verdict}`);
      onDecided();
      onClose();
    } catch (err) {
      toast.error(`Failed to record decision: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSubmitting(false);
    }
  }

  const cfg = VERDICT_CONFIG[verdict];
  const Icon = cfg.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-xl border p-6 shadow-2xl"
        style={{ background: 'hsl(214,10%,11%)', borderColor: 'hsla(0,0%,100%,0.12)' }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'hsl(38,8%,92%)' }}>
              Record Decision
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(214,7%,55%)' }}>
              {request.interrupt.actionLabel} · run {request.runId.slice(0, 12)}…
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded"
            style={{ color: 'hsl(214,7%,35%)' }}
          >
            ✕
          </button>
        </div>

        <div
          className="rounded-lg p-3 mb-4 border"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p
            className="text-[10px] font-mono uppercase tracking-wider mb-1"
            style={{ color: 'hsl(214,7%,35%)' }}
          >
            Action
          </p>
          <p className="text-xs" style={{ color: 'hsl(38,8%,92%)' }}>
            {request.interrupt.actionLabel}
          </p>
          {request.interrupt.policyReason && (
            <p className="text-[10px] mt-1" style={{ color: 'hsl(214,7%,55%)' }}>
              Policy: {request.interrupt.policyReason}
            </p>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {(['approve', 'deny', 'escalate'] as const).map((v) => {
            const vc = VERDICT_CONFIG[v];
            const VIcon = vc.icon;
            return (
              <button
                key={v}
                onClick={() => setVerdict(v)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all"
                style={{
                  background: verdict === v ? `${vc.color}20` : 'transparent',
                  borderColor: verdict === v ? vc.color : 'hsla(0,0%,100%,0.12)',
                  color: verdict === v ? vc.color : 'hsl(214,7%,55%)',
                }}
              >
                <VIcon className="w-3.5 h-3.5" />
                {vc.label}
              </button>
            );
          })}
        </div>

        <div className="mb-3">
          <label
            className="block text-[10px] font-mono uppercase tracking-wider mb-1"
            style={{ color: 'hsl(214,7%,35%)' }}
          >
            Your Name
          </label>
          <input
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="Operator name or ID"
            className="w-full rounded-lg px-3 py-2 text-xs border outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderColor: 'hsla(0,0%,100%,0.12)',
              color: 'hsl(38,8%,92%)',
            }}
          />
        </div>

        <div className="mb-4">
          <label
            className="block text-[10px] font-mono uppercase tracking-wider mb-1"
            style={{ color: 'hsl(214,7%,35%)' }}
          >
            Justification (min 10 chars)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Document your reasoning for this decision…"
            className="w-full rounded-lg px-3 py-2 text-xs border outline-none resize-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              borderColor: 'hsla(0,0%,100%,0.12)',
              color: 'hsl(38,8%,92%)',
            }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: isValid && !submitting ? `${cfg.color}20` : 'rgba(255,255,255,0.05)',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: isValid && !submitting ? cfg.color : 'transparent',
            color: isValid && !submitting ? cfg.color : 'hsl(214,7%,35%)',
          }}
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
          {submitting ? 'Submitting…' : `Confirm ${cfg.label}`}
        </button>
      </div>
    </div>
  );
}

function ApprovalCard({ request, onDecided }: { request: ApprovalRequest; onDecided: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [dialog, setDialog] = useState<'approve' | 'deny' | 'escalate' | null>(null);
  const isPending = request.status === 'pending';
  const isExpired = request.expiresAt < Date.now();
  const statusColor = STATUS_COLORS[request.status] ?? 'rgba(255,255,255,0.3)';
  const ageMs = Date.now() - request.requestedAt;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        background: 'hsl(214,10%,11%)',
        borderColor: isExpired ? 'rgba(239,68,68,0.3)' : 'hsla(0,0%,100%,0.10)',
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Shield className="w-4 h-4" style={{ color: ACCENT }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium truncate" style={{ color: 'hsl(38,8%,92%)' }}>
                {request.interrupt.actionLabel}
              </span>
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider"
                style={{ background: `${statusColor}20`, color: statusColor }}
              >
                {request.status}
              </span>
              {isExpired && request.status === 'pending' && (
                <span
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono"
                  style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}
                >
                  EXPIRED
                </span>
              )}
            </div>
            <div
              className="flex items-center gap-3 mt-1 text-[10px]"
              style={{ color: 'hsl(214,7%,45%)' }}
            >
              <span>Run {request.runId.slice(0, 10)}…</span>
              <span>·</span>
              <span>Step: {request.stepName}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatAge(ageMs)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded transition-colors hover:bg-white/5"
            style={{ color: 'hsl(214,7%,45%)' }}
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 space-y-2 pl-7">
            <div
              className="rounded p-2.5 text-xs space-y-1"
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderColor: 'rgba(255,255,255,0.06)',
                borderWidth: 1,
                borderStyle: 'solid',
              }}
            >
              <p
                className="font-mono text-[9px] uppercase tracking-wider mb-1"
                style={{ color: 'hsl(214,7%,35%)' }}
              >
                Policy Reason
              </p>
              <p style={{ color: 'hsl(38,8%,80%)' }}>{request.interrupt.policyReason}</p>
            </div>
            {request.interrupt.evidenceSummary && (
              <div
                className="rounded p-2.5 text-xs"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.06)',
                  borderWidth: 1,
                  borderStyle: 'solid',
                }}
              >
                <p
                  className="font-mono text-[9px] uppercase tracking-wider mb-1"
                  style={{ color: 'hsl(214,7%,35%)' }}
                >
                  Evidence Summary
                </p>
                <p style={{ color: 'hsl(38,8%,80%)' }}>{request.interrupt.evidenceSummary}</p>
              </div>
            )}
            <div
              className="flex items-center gap-2 text-[10px]"
              style={{ color: 'hsl(214,7%,45%)' }}
            >
              <span>Suggested: </span>
              <span
                style={{
                  color: VERDICT_CONFIG[request.interrupt.suggestedDecision]?.color ?? ACCENT,
                }}
              >
                {request.interrupt.suggestedDecision}
              </span>
              {request.checkpointRef && (
                <>
                  <span>·</span>
                  <span>
                    Checkpoint:{' '}
                    <code className="font-mono">{request.checkpointRef.slice(0, 20)}…</code>
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {isPending && !isExpired && (
          <div className="flex gap-2 mt-3 pl-7">
            {(['approve', 'deny', 'escalate'] as const).map((v) => {
              const cfg = VERDICT_CONFIG[v];
              const Icon = cfg.icon;
              return (
                <button
                  key={v}
                  onClick={() => setDialog(v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    background: 'transparent',
                    borderColor: cfg.color + '60',
                    color: cfg.color,
                  }}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}

        {request.resolvedBy && (
          <p className="text-[10px] pl-7 mt-2" style={{ color: 'hsl(214,7%,35%)' }}>
            Decided by {request.resolvedBy}
            {request.resolvedAt ? ` · ${formatAge(Date.now() - request.resolvedAt)} ago` : ''}
          </p>
        )}
      </div>

      {dialog && (
        <DecisionDialog
          request={request}
          initialVerdict={dialog}
          onClose={() => setDialog(null)}
          onDecided={onDecided}
        />
      )}
    </div>
  );
}

export function GovernedApprovals() {
  const [statusFilter, setStatusFilter] = useState<
    'pending' | 'approved' | 'denied' | 'escalated' | 'timed_out' | undefined
  >('pending');
  const { approvals, loading, error, refetch } = useGovernedApprovals(statusFilter);

  const tabs = [
    { key: 'pending' as const, label: 'Pending' },
    { key: 'approved' as const, label: 'Approved' },
    { key: 'denied' as const, label: 'Denied' },
    { key: 'escalated' as const, label: 'Escalated' },
    { key: undefined, label: 'All' },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: 'hsl(214,10%,9%)', color: 'hsl(38,8%,92%)' }}
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" style={{ color: ACCENT }} />
              Governed Approvals
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(214,7%,45%)' }}>
              Approval interrupts raised by the cognitive runtime
            </p>
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors hover:bg-white/5"
            style={{ borderColor: 'hsla(0,0%,100%,0.12)', color: 'hsl(214,7%,55%)' }}
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'hsla(0,0%,100%,0.08)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setStatusFilter(tab.key)}
              className="px-3 py-2 text-xs font-medium border-b-2 transition-colors"
              style={{
                borderColor: statusFilter === tab.key ? ACCENT : 'transparent',
                color: statusFilter === tab.key ? ACCENT : 'hsl(214,7%,45%)',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && (
          <div
            className="flex items-center gap-2 rounded-lg px-4 py-3 mb-4 text-sm"
            style={{
              background: 'rgba(239,68,68,0.1)',
              borderColor: 'rgba(239,68,68,0.3)',
              borderWidth: 1,
              borderStyle: 'solid',
              color: '#ef4444',
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && approvals.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: ACCENT }} />
          </div>
        ) : approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <CheckCircle2 className="w-8 h-8" style={{ color: 'rgba(255,255,255,0.15)' }} />
            <p className="text-sm" style={{ color: 'hsl(214,7%,45%)' }}>
              No approval requests found
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((req) => (
              <ApprovalCard key={req.id} request={req} onDecided={refetch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
