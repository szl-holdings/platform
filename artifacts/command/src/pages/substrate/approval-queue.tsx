import { toast } from '@szl-holdings/shared-ui/ui/sonner';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  ChevronUp,
  Clock,
  Filter,
  Shield,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { formatAge } from './layout';
import type { ApprovalVerdict, PendingApproval, RiskLevel, Vertical } from './types';
import { submitVerdict, usePendingApprovals, useSubstrateClient } from './use-substrate';

const ACCENT = '#22d3ee';

const RISK_COLORS: Record<RiskLevel, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#f97316',
  critical: '#ef4444',
};

const VERTICAL_LABELS: Record<Vertical, string> = {
  firestorm: 'Firestorm',
  vessels: 'SEXTANT',
  terra: 'DOMAINE',
  lyte: 'KORA',
  prism: 'PRAXIS',
  alloy: 'FORGE',
  'carlota-jo': 'Carlota Jo',
};

const VERTICAL_COLORS: Record<Vertical, string> = {
  firestorm: '#f97316',
  vessels: '#38bdf8',
  terra: '#c87941',
  lyte: '#22d3ee',
  prism: '#a78bfa',
  alloy: '#60a5fa',
  'carlota-jo': '#d4b896',
};

interface VerdictDialogProps {
  approval: PendingApproval;
  initialVerdict: 'approved' | 'rejected' | 'escalated';
  onConfirm: (verdict: ApprovalVerdict, justification: string) => void;
  onClose: () => void;
}

function VerdictDialog({ approval, initialVerdict, onConfirm, onClose }: VerdictDialogProps) {
  const [justification, setJustification] = useState('');
  const [verdict, setVerdict] = useState<ApprovalVerdict>(initialVerdict);
  const isValid = justification.trim().length >= 10;

  const verdictConfig = {
    approved: { color: '#22c55e', label: 'Approve', icon: CheckCircle2 },
    rejected: { color: '#ef4444', label: 'Reject', icon: XCircle },
    escalated: { color: '#f59e0b', label: 'Escalate', icon: ChevronUp },
  };
  const cfg = verdictConfig[verdict];
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
              {approval.workflow} · {approval.tenant}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: 'hsl(214,7%,35%)' }}
          >
            ✕
          </button>
        </div>

        {/* Action summary */}
        <div
          className="rounded-lg p-3 mb-4 border"
          style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p
            className="text-[10px] font-mono uppercase tracking-wider mb-1"
            style={{ color: 'hsl(214,7%,35%)' }}
          >
            Proposed Action
          </p>
          <p className="text-xs" style={{ color: 'hsl(38,8%,92%)' }}>
            {approval.action}
          </p>
        </div>

        {/* Verdict selector */}
        <div className="flex gap-2 mb-4">
          {(['approved', 'rejected', 'escalated'] as const).map((v) => {
            const vc = verdictConfig[v];
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

        {/* Justification */}
        <div className="mb-4">
          <label
            className="text-[10px] font-mono uppercase tracking-wider block mb-1.5"
            style={{ color: 'hsl(214,7%,35%)' }}
          >
            Justification <span style={{ color: '#ef4444' }}>*</span> (minimum 10 characters)
          </label>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            placeholder="State your reasoning. This entry is immutable and linked to the proof chain."
            className="w-full rounded-lg px-3 py-2 text-xs resize-none outline-none border"
            style={{
              background: 'hsl(214,12%,8%)',
              borderColor: isValid
                ? 'hsla(0,0%,100%,0.15)'
                : justification.length > 0
                  ? '#ef444440'
                  : 'hsla(0,0%,100%,0.12)',
              color: 'hsl(38,8%,92%)',
            }}
          />
          <p
            className="text-[9px] mt-1"
            style={{
              color:
                justification.length < 10 && justification.length > 0
                  ? '#ef4444'
                  : 'hsl(214,7%,35%)',
            }}
          >
            {justification.length}/10 minimum — will be written to the immutable audit trail
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs transition-colors hover:bg-white/5"
            style={{ color: 'hsl(214,7%,55%)' }}
          >
            Cancel
          </button>
          <button
            onClick={() => isValid && onConfirm(verdict, justification)}
            disabled={!isValid}
            className="flex items-center gap-2 px-4 py-2 rounded text-xs font-medium transition-all disabled:opacity-40"
            style={{
              background: isValid ? cfg.color : 'rgba(255,255,255,0.1)',
              color: isValid ? '#000' : 'hsl(214,7%,35%)',
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            Record {cfg.label}
          </button>
        </div>
      </div>
    </div>
  );
}

function ApprovalCard({
  approval,
  onDecision,
}: {
  approval: PendingApproval;
  onDecision: (id: string, verdict: ApprovalVerdict, justification: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [dialog, setDialog] = useState<'approved' | 'rejected' | 'escalated' | null>(null);
  const riskColor = RISK_COLORS[approval.riskLevel];
  const vertColor = VERTICAL_COLORS[approval.vertical] || ACCENT;

  const isUrgent = approval.ageMs > 15 * 60_000;

  return (
    <>
      <div
        className="rounded-lg border overflow-hidden"
        style={{
          background: 'hsl(214,12%,8%)',
          borderColor: isUrgent ? 'rgba(239,68,68,0.2)' : 'hsla(0,0%,100%,0.08)',
        }}
      >
        {isUrgent && (
          <div
            className="px-4 py-1.5 flex items-center gap-2 text-[10px]"
            style={{
              background: 'rgba(239,68,68,0.08)',
              borderBottom: '1px solid rgba(239,68,68,0.15)',
              color: '#ef4444',
            }}
          >
            <AlertTriangle className="w-3 h-3" /> Pending {formatAge(approval.ageMs)} — action
            recommended
          </div>
        )}
        <div className="p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: `${vertColor}15`, color: vertColor }}
                >
                  {VERTICAL_LABELS[approval.vertical]}
                </span>
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded uppercase"
                  style={{ background: `${riskColor}15`, color: riskColor }}
                >
                  {approval.riskLevel} risk
                </span>
                <span className="text-[10px] font-mono" style={{ color: 'hsl(214,7%,35%)' }}>
                  {approval.tenant}
                </span>
              </div>
              <h3 className="text-sm font-semibold" style={{ color: 'hsl(38,8%,92%)' }}>
                {approval.workflow}
              </h3>
              <p className="text-[11px] mt-1" style={{ color: 'hsl(214,7%,55%)' }}>
                {approval.action}
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <div
                className="flex items-center gap-1 text-[10px] font-mono justify-end"
                style={{ color: 'hsl(214,7%,35%)' }}
              >
                <Clock className="w-3 h-3" /> {formatAge(approval.ageMs)} ago
              </div>
              <p className="text-[9px] mt-0.5" style={{ color: 'hsl(214,7%,35%)' }}>
                Requested by {approval.requestedBy}
              </p>
            </div>
          </div>

          {/* Policy badge */}
          <div
            className="flex items-center gap-2 mb-3 p-2 rounded text-[11px]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Shield className="w-3 h-3 flex-shrink-0" style={{ color: riskColor }} />
            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Policy: </span>
            <span style={{ color: 'hsl(38,8%,92%)' }}>{approval.policyName}</span>
            <span className="text-[9px] font-mono" style={{ color: 'hsl(214,7%,35%)' }}>
              ({approval.policyId})
            </span>
          </div>

          {/* Evidence summary */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 text-[11px] mb-3 transition-opacity hover:opacity-80"
            style={{ color: ACCENT }}
          >
            <BookOpen className="w-3 h-3" />
            Evidence summary
            <ChevronUp className={`w-3 h-3 transition-transform ${expanded ? '' : 'rotate-180'}`} />
          </button>
          {expanded && (
            <div
              className="rounded p-2.5 mb-3 border text-[11px]"
              style={{
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.06)',
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              {approval.evidenceSummary}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDialog('approved')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors hover:opacity-90"
              style={{
                background: 'rgba(34,197,94,0.15)',
                border: '1px solid rgba(34,197,94,0.3)',
                color: '#22c55e',
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
            </button>
            <button
              onClick={() => setDialog('rejected')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors hover:opacity-90"
              style={{
                background: 'rgba(239,68,68,0.12)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444',
              }}
            >
              <XCircle className="w-3.5 h-3.5" /> Reject
            </button>
            <button
              onClick={() => setDialog('escalated')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors hover:opacity-90"
              style={{
                background: 'rgba(245,158,11,0.10)',
                border: '1px solid rgba(245,158,11,0.25)',
                color: '#f59e0b',
              }}
            >
              <ChevronUp className="w-3.5 h-3.5" /> Escalate
            </button>
            <span className="ml-auto text-[9px] font-mono" style={{ color: 'hsl(214,7%,35%)' }}>
              {approval.runId}
            </span>
          </div>
        </div>
      </div>

      {dialog && (
        <VerdictDialog
          approval={approval}
          initialVerdict={dialog}
          onConfirm={(v, j) => {
            onDecision(approval.id, v, j);
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}

export function ApprovalQueue() {
  const client = useSubstrateClient();
  const { approvals: fetchedApprovals } = usePendingApprovals();
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [resolvedLog, setResolvedLog] = useState<
    Array<{
      id: string;
      workflow: string;
      verdict: ApprovalVerdict;
      justification: string;
      resolvedAt: string;
      proofRef?: string;
    }>
  >([]);
  const [filterVertical, setFilterVertical] = useState('all');
  const [filterRisk, setFilterRisk] = useState('all');

  const approvals = fetchedApprovals.filter((a) => !resolvedIds.has(a.id));

  async function handleDecision(id: string, verdict: ApprovalVerdict, justification: string) {
    const approval = fetchedApprovals.find((a) => a.id === id);
    if (!approval) return;

    const verdictLabels = { approved: 'approved', rejected: 'rejected', escalated: 'escalated' };

    const result = await submitVerdict(client, approval, verdict, justification);

    setResolvedIds((prev) => new Set([...prev, id]));
    setResolvedLog((prev) => [
      {
        id,
        workflow: approval.workflow,
        verdict,
        justification,
        resolvedAt: new Date().toISOString(),
        proofRef: result?.proofRef,
      },
      ...prev,
    ]);

    toast.success(`Decision ${verdictLabels[verdict]}`, {
      description: result
        ? `${approval.workflow} — proof ref ${result.proofRef} written to audit trail.`
        : `${approval.workflow} — recorded locally (gateway offline).`,
    });
  }

  const filtered = approvals.filter((a) => {
    if (filterVertical !== 'all' && a.vertical !== filterVertical) return false;
    if (filterRisk !== 'all' && a.riskLevel !== filterRisk) return false;
    return true;
  });

  const selectClass = 'text-[11px] rounded px-2 py-1 border outline-none';
  const selectStyle = {
    background: 'hsl(214,12%,8%)',
    borderColor: 'hsla(0,0%,100%,0.12)',
    color: 'hsl(38,8%,92%)',
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'hsl(38,8%,92%)' }}>
            Unified Approval Queue
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'hsl(214,7%,55%)' }}>
            All pending decisions across every vertical — approve, reject, or escalate with required
            justification
          </p>
        </div>
        <div className="flex items-center gap-2">
          {approvals.length > 0 && (
            <span
              className="text-[10px] font-mono px-2 py-1 rounded"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}
            >
              {approvals.length} pending
            </span>
          )}
          {resolvedLog.length > 0 && (
            <span
              className="text-[10px] font-mono px-2 py-1 rounded"
              style={{ background: 'rgba(34,197,94,0.10)', color: '#22c55e' }}
            >
              {resolvedLog.length} resolved
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      {approvals.length > 0 && (
        <div className="flex items-center gap-3 mb-5">
          <Filter className="w-3 h-3" style={{ color: 'hsl(214,7%,55%)' }} />
          <select
            value={filterVertical}
            onChange={(e) => setFilterVertical(e.target.value)}
            className={selectClass}
            style={selectStyle}
          >
            <option value="all">All verticals</option>
            {Object.entries(VERTICAL_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className={selectClass}
            style={selectStyle}
          >
            <option value="all">All risk levels</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          {(filterVertical !== 'all' || filterRisk !== 'all') && (
            <button
              onClick={() => {
                setFilterVertical('all');
                setFilterRisk('all');
              }}
              className="text-[11px] transition-colors hover:opacity-80"
              style={{ color: ACCENT }}
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Pending */}
      {filtered.length > 0 && (
        <div className="space-y-4 mb-6">
          {filtered.map((a) => (
            <ApprovalCard key={a.id} approval={a} onDecision={handleDecision} />
          ))}
        </div>
      )}

      {filtered.length === 0 && approvals.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-4 mb-6">
          <Filter className="w-8 h-8 opacity-20" style={{ color: ACCENT }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              No approvals match these filters
            </p>
          </div>
          <button
            onClick={() => {
              setFilterVertical('all');
              setFilterRisk('all');
            }}
            className="text-xs px-3 py-1.5 rounded border transition-colors hover:bg-white/5"
            style={{ borderColor: 'hsla(0,0%,100%,0.12)', color: 'hsl(38,8%,92%)' }}
          >
            Show all approvals
          </button>
        </div>
      )}

      {approvals.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-4 mb-6">
          <CheckCircle2 className="w-10 h-10 opacity-20" style={{ color: '#22c55e' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Approval queue is clear
            </p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No pending decisions across any vertical
            </p>
          </div>
        </div>
      )}

      {/* Resolved log */}
      {resolvedLog.length > 0 && (
        <div>
          <p
            className="text-[10px] font-mono uppercase tracking-wider mb-3"
            style={{ color: 'hsl(214,7%,35%)' }}
          >
            Resolved this session
          </p>
          <div className="space-y-2">
            {resolvedLog.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between px-4 py-2.5 rounded-lg border"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <div className="flex items-center gap-3">
                  {r.verdict === 'approved' && (
                    <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#22c55e' }} />
                  )}
                  {r.verdict === 'rejected' && (
                    <XCircle className="w-3.5 h-3.5" style={{ color: '#ef4444' }} />
                  )}
                  {r.verdict === 'escalated' && (
                    <ChevronUp className="w-3.5 h-3.5" style={{ color: '#f59e0b' }} />
                  )}
                  <span
                    className="text-xs font-mono capitalize"
                    style={{
                      color: { approved: '#22c55e', rejected: '#ef4444', escalated: '#f59e0b' }[
                        r.verdict
                      ],
                    }}
                  >
                    {r.verdict}
                  </span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {r.justification.slice(0, 60)}
                    {r.justification.length > 60 ? '…' : ''}
                  </span>
                </div>
                <span className="text-[9px] font-mono" style={{ color: 'hsl(214,7%,35%)' }}>
                  {new Date(r.resolvedAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
