import { useCallback, useEffect, useRef, useState } from 'react';
import { ACCENT, apiUrl, fetchJson } from '../cognitive/shared';

interface ApiEnvelope<T> {
  ok: boolean;
  data: T;
  meta?: Record<string, unknown>;
  error?: { type: string; message: string };
}

async function apiCall<T>(url: string, init?: RequestInit): Promise<T> {
  const envelope = await fetchJson<ApiEnvelope<T>>(url, init);
  if (!envelope.ok) {
    throw new Error(envelope.error?.message ?? 'API error');
  }
  return envelope.data;
}

const RISK_COLORS: Record<string, { color: string; bg: string }> = {
  safe:     { color: '#22c55e', bg: '#22c55e18' },
  low:      { color: '#22c55e', bg: '#22c55e18' },
  medium:   { color: '#f59e0b', bg: '#f59e0b18' },
  high:     { color: '#ef4444', bg: '#ef444418' },
  critical: { color: '#dc2626', bg: '#dc262618' },
};

const STATUS_COLORS: Record<string, string> = {
  pending:           '#4a6070',
  awaiting_approval: '#f59e0b',
  approved:          '#22c55e',
  rejected:          '#ef4444',
  executing:         '#8b7ac8',
  completed:         '#22c55e',
  failed:            '#ef4444',
  skipped:           '#4a6070',
};

const RUN_STATUS_COLORS: Record<string, string> = {
  planning:          '#8b7ac8',
  awaiting_approval: '#f59e0b',
  executing:         '#8b7ac8',
  completed:         '#22c55e',
  failed:            '#ef4444',
  cancelled:         '#4a6070',
};

interface PlanStep {
  stepId: string;
  stepNumber: number;
  title: string;
  description: string;
  toolId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  sideEffects: string[];
  riskLevel: string;
  requiresApproval: boolean;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedReason?: string;
  result?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
}

interface AuditEntry {
  entryId: string;
  runId: string;
  stepId?: string;
  eventType: string;
  actor: string;
  detail: string;
  timestamp: string;
}

interface OperatorRun {
  runId: string;
  intent: string;
  vertical: string;
  requestedBy: string;
  status: string;
  plan: PlanStep[];
  auditLog: AuditEntry[];
  currentStepIndex: number;
  planSummary: string;
  estimatedSideEffects: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

type PlanStepProposal = Omit<PlanStep, 'stepId' | 'status'>;

interface PlanProposal {
  steps: PlanStepProposal[];
  planSummary: string;
  estimatedSideEffects: string[];
  vertical: string;
}

interface ReplayData {
  runId: string;
  intent: string;
  auditLog: AuditEntry[];
  steps: PlanStep[];
  timeline: Array<{ timestamp: string; event: string; actor: string; stepId?: string }>;
}

const EVENT_ICONS: Record<string, string> = {
  run_created:      '◆',
  plan_generated:   '◈',
  step_approved:    '✓',
  step_rejected:    '✗',
  step_executing:   '▶',
  step_completed:   '●',
  step_failed:      '✕',
  run_completed:    '◉',
  run_failed:       '⊗',
  run_cancelled:    '◌',
};

const EVENT_COLORS: Record<string, string> = {
  run_created:      ACCENT,
  plan_generated:   '#8b7ac8',
  step_approved:    '#22c55e',
  step_rejected:    '#ef4444',
  step_executing:   ACCENT,
  step_completed:   '#22c55e',
  step_failed:      '#ef4444',
  run_completed:    '#22c55e',
  run_failed:       '#ef4444',
  run_cancelled:    '#4a6070',
};

function card(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: 18,
    ...extra,
  };
}

function RiskBadge({ level }: { level: string }) {
  const s = RISK_COLORS[level] ?? { color: '#4a6070', bg: '#64748b18' };
  return (
    <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, padding: '2px 7px', borderRadius: 4, border: `1px solid ${s.color}40` }}>
      {level.toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? '#4a6070';
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}15`, padding: '2px 7px', borderRadius: 4, border: `1px solid ${color}30` }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function RunStatusBadge({ status }: { status: string }) {
  const color = RUN_STATUS_COLORS[status] ?? '#4a6070';
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}18`, padding: '3px 10px', borderRadius: 5, border: `1px solid ${color}35` }}>
      {status.replace(/_/g, ' ').toUpperCase()}
    </span>
  );
}

function StepCard({ step, runId, onAction }: { step: PlanStep; runId: string; onAction: () => void }) {
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [busy, setBusy] = useState(false);
  const risk = RISK_COLORS[step.riskLevel] ?? RISK_COLORS.medium;

  async function approve() {
    setBusy(true);
    try {
      await apiCall<OperatorRun>(apiUrl(`/a11oy/operator/runs/${runId}/steps/${step.stepId}/approve`), {
        method: 'POST',
        body: JSON.stringify({ approvedBy: 'operator@szl' }),
      });
      onAction();
    } catch (err) {
      console.error('Approve failed:', err);
    } finally { setBusy(false); }
  }

  async function reject() {
    if (!rejectReason.trim()) return;
    setBusy(true);
    try {
      await apiCall<OperatorRun>(apiUrl(`/a11oy/operator/runs/${runId}/steps/${step.stepId}/reject`), {
        method: 'POST',
        body: JSON.stringify({ rejectedBy: 'operator@szl', reason: rejectReason }),
      });
      setShowReject(false);
      setRejectReason('');
      onAction();
    } catch (err) {
      console.error('Reject failed:', err);
    } finally { setBusy(false); }
  }

  async function execute() {
    setBusy(true);
    try {
      await apiCall<{ run: OperatorRun; stepResult: unknown }>(
        apiUrl(`/a11oy/operator/runs/${runId}/steps/${step.stepId}/execute`),
        { method: 'POST', body: JSON.stringify({ executedBy: 'operator@szl', actorRole: 'operator' }) },
      );
      onAction();
    } catch (err) {
      console.error('Execute failed:', err);
    } finally { setBusy(false); }
  }

  return (
    <div style={{ ...card(), borderLeft: `3px solid ${risk.color}`, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${ACCENT}25`, border: `1px solid ${ACCENT}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: ACCENT, flexShrink: 0 }}>
            {step.stepNumber}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gi-text-primary)' }}>{step.title}</div>
            <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', marginTop: 2 }}>{step.description}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <RiskBadge level={step.riskLevel} />
          <StatusBadge status={step.status} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: step.sideEffects.length > 0 ? 8 : 0, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tool</span>
        <span style={{ fontSize: 11, color: '#8b7ac8', background: '#8b7ac815', padding: '2px 8px', borderRadius: 4, border: '1px solid #8b7ac830', fontFamily: 'monospace' }}>
          {step.toolName}
        </span>
        {step.requiresApproval && (
          <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: '#f59e0b12', padding: '2px 7px', borderRadius: 3, border: '1px solid #f59e0b30', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Requires Approval
          </span>
        )}
      </div>

      {step.sideEffects.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>Side Effects</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {step.sideEffects.map((se, i) => (
              <span key={i} style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', padding: '2px 7px', borderRadius: 4 }}>
                {se}
              </span>
            ))}
          </div>
        </div>
      )}

      {step.result && (
        <div style={{ background: '#22c55e0a', border: '1px solid #22c55e20', borderRadius: 7, padding: '8px 10px', marginBottom: 10, fontSize: 11, color: '#86efac', fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {JSON.stringify(step.result, null, 2).slice(0, 300)}
          {JSON.stringify(step.result).length > 300 ? '…' : ''}
        </div>
      )}

      {step.error && (
        <div style={{ background: '#ef444410', border: '1px solid #ef444430', borderRadius: 7, padding: '8px 10px', marginBottom: 10, fontSize: 11, color: '#fca5a5' }}>
          {step.error}
        </div>
      )}

      {step.durationMs != null && (
        <div style={{ fontSize: 10, color: '#475569', marginBottom: 8 }}>Duration: {step.durationMs}ms</div>
      )}

      {step.approvedBy && (
        <div style={{ fontSize: 10, color: '#22c55e', marginBottom: 8 }}>
          ✓ Approved by {step.approvedBy} · {new Date(step.approvedAt!).toLocaleTimeString()}
        </div>
      )}
      {step.rejectedBy && (
        <div style={{ fontSize: 10, color: '#ef4444', marginBottom: 8 }}>
          ✗ Rejected by {step.rejectedBy} — {step.rejectedReason}
        </div>
      )}

      {step.status === 'awaiting_approval' && (
        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            disabled={busy}
            onClick={approve}
            style={{ flex: 1, background: '#22c55e', border: 'none', borderRadius: 7, padding: '8px 0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}
          >
            ✓ Approve
          </button>
          <button
            disabled={busy}
            onClick={() => setShowReject((v) => !v)}
            style={{ flex: 1, background: 'rgba(239,68,68,0.12)', border: '1px solid #ef444440', borderRadius: 7, padding: '8px 0', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer' }}
          >
            ✗ Reject
          </button>
        </div>
      )}

      {showReject && step.status === 'awaiting_approval' && (
        <div style={{ marginTop: 8 }}>
          <input
            placeholder="Rejection reason…"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.currentTarget.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '7px 10px', color: 'var(--gi-text-primary)', fontSize: 12, boxSizing: 'border-box' }}
          />
          <button
            disabled={busy || !rejectReason.trim()}
            onClick={reject}
            style={{ marginTop: 6, width: '100%', background: '#ef444418', border: '1px solid #ef444440', borderRadius: 6, padding: '7px 0', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: busy || !rejectReason.trim() ? 0.5 : 1 }}
          >
            Confirm Rejection
          </button>
        </div>
      )}

      {step.status === 'approved' && (
        <button
          disabled={busy}
          onClick={execute}
          style={{ marginTop: 10, width: '100%', background: ACCENT, border: 'none', borderRadius: 7, padding: '8px 0', color: '#fff', fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? '⟳ Executing…' : '▶ Execute Step'}
        </button>
      )}

      {step.status === 'pending' && !step.requiresApproval && (
        <button
          disabled={busy}
          onClick={execute}
          style={{ marginTop: 10, width: '100%', background: `${ACCENT}25`, border: `1px solid ${ACCENT}50`, borderRadius: 7, padding: '8px 0', color: ACCENT, fontSize: 12, fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.6 : 1 }}
        >
          {busy ? '⟳ Executing…' : '▶ Execute (no approval required)'}
        </button>
      )}
    </div>
  );
}

function AuditLogPanel({ log }: { log: AuditEntry[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[...log].reverse().map((entry) => {
        const color = EVENT_COLORS[entry.eventType] ?? '#4a6070';
        const icon = EVENT_ICONS[entry.eventType] ?? '·';
        return (
          <div key={entry.entryId} style={{ display: 'flex', gap: 10, padding: '6px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.015)', borderLeft: `2px solid ${color}40` }}>
            <span style={{ color, fontSize: 12, flexShrink: 0, width: 16, textAlign: 'center', paddingTop: 1 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.5, wordBreak: 'break-word' }}>{entry.detail}</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 3 }}>
                <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>{entry.actor}</span>
                <span style={{ fontSize: 10, color: '#334155' }}>{new Date(entry.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ReplayViewer({ data }: { data: ReplayData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: 'Total Steps', value: String(data.steps.length) },
          { label: 'Audit Events', value: String(data.timeline.length) },
          { label: 'Completed', value: String(data.steps.filter((s) => s.status === 'completed').length) },
        ].map((m) => (
          <div key={m.label} style={{ ...card({ padding: 12 }), textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: ACCENT }}>{m.value}</div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{m.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5 }}>Execution Timeline</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {data.timeline.map((event, i) => {
          const relMs = i === 0 ? 0 : new Date(event.timestamp).getTime() - new Date(data.timeline[0].timestamp).getTime();
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 60, fontSize: 10, color: '#475569', fontFamily: 'monospace', flexShrink: 0, paddingTop: 2, textAlign: 'right' }}>
                +{relMs}ms
              </div>
              <div style={{ width: 1, background: `${ACCENT}30`, alignSelf: 'stretch', flexShrink: 0, margin: '0 6px' }} />
              <div style={{ fontSize: 11, color: '#94a3b8', flex: 1, paddingTop: 2, wordBreak: 'break-word' }}>
                <span style={{ color: 'var(--gi-text-muted)', marginRight: 6 }}>[{event.actor}]</span>
                {event.event}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 }}>Step Outcomes</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.steps.map((step) => {
          const sc = STATUS_COLORS[step.status] ?? '#4a6070';
          return (
            <div key={step.stepId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 7, border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: `${sc}20`, border: `1px solid ${sc}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: sc, flexShrink: 0 }}>
                {step.stepNumber}
              </div>
              <div style={{ flex: 1, fontSize: 12, color: 'var(--gi-text-primary)' }}>{step.title}</div>
              <StatusBadge status={step.status} />
              {step.durationMs != null && <span style={{ fontSize: 10, color: '#475569' }}>{step.durationMs}ms</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RunListItem({ run, selected, onClick }: { run: OperatorRun; selected: boolean; onClick: () => void }) {
  const color = RUN_STATUS_COLORS[run.status] ?? '#4a6070';
  return (
    <div
      onClick={onClick}
      style={{ padding: '10px 12px', borderRadius: 8, cursor: 'pointer', background: selected ? `${ACCENT}10` : 'rgba(255,255,255,0.02)', border: `1px solid ${selected ? ACCENT + '50' : 'rgba(255,255,255,0.06)'}`, marginBottom: 6, transition: 'all 0.15s' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT, fontFamily: 'monospace' }}>{run.runId}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`, padding: '1px 7px', borderRadius: 3, border: `1px solid ${color}30` }}>
          {run.status.replace(/_/g, ' ')}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {run.intent}
      </div>
      <div style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>
        {new Date(run.createdAt).toLocaleString()} · {run.plan.length} steps
      </div>
    </div>
  );
}

const SAMPLE_INTENTS = [
  'Create a new DOMAINE deal for the SZL Tower project in NYC and draft a Pulse executive briefing',
  'Open a Counsel matter for maritime sanctions review and create a SEXTANT alert rule for flag-state changes',
  'Query the ontology for regulatory exposure across active deals and notify key stakeholders',
];

export function OperatorPanel() {
  const [intent, setIntent] = useState('');
  const [planning, setPlanning] = useState(false);
  const [planProposal, setPlanProposal] = useState<PlanProposal | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);

  const [runs, setRuns] = useState<OperatorRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<OperatorRun | null>(null);
  const [loadingRun, setLoadingRun] = useState(false);
  const [tab, setTab] = useState<'plan' | 'audit' | 'replay'>('plan');
  const [replayData, setReplayData] = useState<ReplayData | null>(null);
  const [loadingReplay, setLoadingReplay] = useState(false);
  const [creating, setCreating] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadRuns = useCallback(async () => {
    try {
      const runs = await apiCall<OperatorRun[]>(apiUrl('/a11oy/operator/runs'));
      setRuns(Array.isArray(runs) ? runs : []);
    } catch { /* silent */ }
  }, []);

  const refreshSelectedRun = useCallback(async (runId: string) => {
    try {
      const run = await apiCall<OperatorRun>(apiUrl(`/a11oy/operator/runs/${runId}`));
      setSelectedRun(run);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  useEffect(() => {
    if (!selectedRun) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    if (['completed', 'failed', 'cancelled'].includes(selectedRun.status)) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(() => {
      void refreshSelectedRun(selectedRun.runId);
      void loadRuns();
    }, 2500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [selectedRun?.runId, selectedRun?.status, refreshSelectedRun, loadRuns]);

  async function generatePlan() {
    if (!intent.trim()) return;
    setPlanning(true);
    setPlanProposal(null);
    setPlanError(null);
    try {
      const data = await apiCall<PlanProposal>(apiUrl('/a11oy/operator/plan'), {
        method: 'POST',
        body: JSON.stringify({ intent }),
      });
      setPlanProposal(data);
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setPlanning(false);
    }
  }

  async function createRun() {
    if (!planProposal) return;
    setCreating(true);
    try {
      const run = await apiCall<OperatorRun>(apiUrl('/a11oy/operator/runs'), {
        method: 'POST',
        body: JSON.stringify({
          intent,
          vertical: planProposal.vertical,
          plan: planProposal.steps,
          planSummary: planProposal.planSummary,
          estimatedSideEffects: planProposal.estimatedSideEffects,
        }),
      });
      setSelectedRun(run);
      setRuns((prev) => [run, ...prev]);
      setPlanProposal(null);
      setIntent('');
      setTab('plan');
    } catch (err) {
      setPlanError(err instanceof Error ? err.message : 'Failed to create run');
    } finally {
      setCreating(false);
    }
  }

  async function selectRun(run: OperatorRun) {
    setLoadingRun(true);
    setReplayData(null);
    setTab('plan');
    try {
      const data = await apiCall<OperatorRun>(apiUrl(`/a11oy/operator/runs/${run.runId}`));
      setSelectedRun(data);
    } finally {
      setLoadingRun(false);
    }
  }

  async function loadReplay(runId: string) {
    setLoadingReplay(true);
    try {
      const data = await apiCall<ReplayData>(apiUrl(`/a11oy/operator/runs/${runId}/replay`));
      setReplayData(data);
      setTab('replay');
    } finally {
      setLoadingReplay(false);
    }
  }

  async function onStepAction() {
    if (!selectedRun) return;
    await refreshSelectedRun(selectedRun.runId);
    await loadRuns();
  }

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, background: 'var(--gi-bg-base)', color: 'var(--gi-text-primary)', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      {/* Left — run list */}
      <div style={{ width: 280, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.07)', padding: '16px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 }}>Operator Runs</div>
          {runs.length === 0 && (
            <div style={{ fontSize: 12, color: '#334155', textAlign: 'center', padding: '24px 0' }}>No runs yet — propose a plan above</div>
          )}
          {runs.map((r) => (
            <RunListItem key={r.runId} run={r} selected={selectedRun?.runId === r.runId} onClick={() => selectRun(r)} />
          ))}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gi-text-primary)', letterSpacing: -0.3 }}>Operator Panel</div>
            <div style={{ fontSize: 11, color: '#475569' }}>Governed Agentic Runtime · Human-in-the-Loop</div>
          </div>

          {/* Intent input */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                value={intent}
                onChange={(e) => setIntent(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && void generatePlan()}
                placeholder="Describe what you want the agent to do…"
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: `1px solid ${ACCENT}40`, borderRadius: 8, padding: '10px 14px', color: 'var(--gi-text-primary)', fontSize: 13, boxSizing: 'border-box', outline: 'none' }}
              />
            </div>
            <button
              disabled={planning || !intent.trim()}
              onClick={() => void generatePlan()}
              style={{ background: ACCENT, border: 'none', borderRadius: 8, padding: '0 20px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: planning || !intent.trim() ? 'not-allowed' : 'pointer', opacity: planning || !intent.trim() ? 0.6 : 1, flexShrink: 0 }}
            >
              {planning ? '⟳ Planning…' : '◈ Propose Plan'}
            </button>
          </div>

          {/* Sample intents */}
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {SAMPLE_INTENTS.map((s, i) => (
              <button
                key={i}
                onClick={() => setIntent(s)}
                style={{ fontSize: 10, color: 'var(--gi-text-muted)', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, padding: '3px 9px', cursor: 'pointer' }}
              >
                {s.slice(0, 60)}…
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {/* Plan Proposal — before run is created */}
          {planProposal && !selectedRun && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ ...card({ marginBottom: 16 }), borderColor: `${ACCENT}40` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gi-text-primary)' }}>Proposed Plan</div>
                  <div style={{ fontSize: 11, color: '#8b7ac8', fontFamily: 'monospace' }}>vertical: {planProposal.vertical}</div>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, marginBottom: 14 }}>{planProposal.planSummary}</div>
                {planProposal.estimatedSideEffects.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>⚠ Estimated Side Effects</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {planProposal.estimatedSideEffects.map((se, i) => (
                        <span key={i} style={{ fontSize: 10, color: '#fbbf24', background: '#f59e0b10', border: '1px solid #f59e0b30', padding: '2px 8px', borderRadius: 4 }}>{se}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    disabled={creating}
                    onClick={() => void createRun()}
                    style={{ flex: 1, background: ACCENT, border: 'none', borderRadius: 8, padding: '10px 0', color: '#fff', fontSize: 13, fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.6 : 1 }}
                  >
                    {creating ? '⟳ Creating Run…' : '✓ Approve & Create Run'}
                  </button>
                  <button
                    onClick={() => setPlanProposal(null)}
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 20px', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Discard
                  </button>
                </div>
              </div>

              {/* Preview steps */}
              <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Plan Steps ({planProposal.steps.length})</div>
              {planProposal.steps.map((step) => (
                <div key={step.stepNumber} style={{ ...card({ marginBottom: 8 }), borderLeft: `3px solid ${(RISK_COLORS[step.riskLevel] ?? RISK_COLORS.medium).color}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${ACCENT}20`, border: `1px solid ${ACCENT}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: ACCENT, flexShrink: 0 }}>
                      {step.stepNumber}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gi-text-primary)', flex: 1 }}>{step.title}</div>
                    <RiskBadge level={step.riskLevel} />
                    {step.requiresApproval && <span style={{ fontSize: 9, fontWeight: 700, color: '#f59e0b', background: '#f59e0b12', padding: '2px 6px', borderRadius: 3, border: '1px solid #f59e0b30' }}>APPROVAL</span>}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gi-text-muted)', paddingLeft: 32 }}>{step.description}</div>
                  <div style={{ display: 'flex', gap: 6, paddingLeft: 32, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, color: '#8b7ac8', fontFamily: 'monospace', background: '#8b7ac810', padding: '1px 7px', borderRadius: 4 }}>{step.toolName}</span>
                    {step.sideEffects.map((se, i) => (
                      <span key={i} style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(255,255,255,0.03)', padding: '1px 7px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.06)' }}>{se}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {planError && (
            <div style={{ background: '#ef444412', border: '1px solid #ef444435', borderRadius: 8, padding: '12px 14px', marginBottom: 20, color: '#fca5a5', fontSize: 13 }}>
              {planError}
            </div>
          )}

          {/* Selected run detail */}
          {loadingRun && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#475569', fontSize: 13 }}>
              Loading run…
            </div>
          )}

          {selectedRun && !loadingRun && (
            <div>
              {/* Run header */}
              <div style={{ ...card({ marginBottom: 16 }) }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', fontFamily: 'monospace', marginBottom: 4 }}>{selectedRun.runId}</div>
                    <div style={{ fontSize: 13, color: 'var(--gi-text-primary)', lineHeight: 1.5 }}>{selectedRun.intent}</div>
                  </div>
                  <RunStatusBadge status={selectedRun.status} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--gi-text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{selectedRun.planSummary}</div>

                {selectedRun.estimatedSideEffects.length > 0 && (
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b' }}>Side Effects: </span>
                    {selectedRun.estimatedSideEffects.map((se, i) => (
                      <span key={i} style={{ fontSize: 10, color: '#fbbf24', background: '#f59e0b10', border: '1px solid #f59e0b25', padding: '1px 7px', borderRadius: 3 }}>{se}</span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  {(['plan', 'audit', 'replay'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        if (t === 'replay') void loadReplay(selectedRun.runId);
                        else setTab(t);
                      }}
                      style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: tab === t ? 700 : 500, cursor: 'pointer', background: tab === t ? `${ACCENT}25` : 'transparent', border: tab === t ? `1px solid ${ACCENT}50` : '1px solid rgba(255,255,255,0.08)', color: tab === t ? ACCENT : 'var(--gi-text-muted)' }}
                    >
                      {t === 'plan' ? `Steps (${selectedRun.plan.length})` : t === 'audit' ? `Audit (${selectedRun.auditLog.length})` : 'Replay Viewer'}
                    </button>
                  ))}
                </div>
              </div>

              {tab === 'plan' && (
                <div>
                  {selectedRun.plan.map((step) => (
                    <StepCard key={step.stepId} step={step} runId={selectedRun.runId} onAction={() => void onStepAction()} />
                  ))}
                </div>
              )}

              {tab === 'audit' && (
                <div style={card()}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                    Immutable Audit Log · {selectedRun.auditLog.length} entries
                  </div>
                  <AuditLogPanel log={selectedRun.auditLog} />
                </div>
              )}

              {tab === 'replay' && (
                loadingReplay ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#475569' }}>Loading replay data…</div>
                ) : replayData ? (
                  <div style={card()}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>
                      Replay Viewer · {replayData.runId}
                    </div>
                    <ReplayViewer data={replayData} />
                  </div>
                ) : (
                  <div style={{ color: '#475569', fontSize: 12, textAlign: 'center', padding: 40 }}>No replay data available</div>
                )
              )}
            </div>
          )}

          {!planProposal && !selectedRun && !loadingRun && !planning && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 14 }}>
              <div style={{ fontSize: 40, opacity: 0.2 }}>◈</div>
              <div style={{ fontSize: 14, color: '#334155', textAlign: 'center', maxWidth: 400, lineHeight: 1.6 }}>
                Type a natural-language intent above to have the agent propose a governed execution plan with step-by-step human approval gates.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                {[
                  { icon: '⬢', label: 'DOMAINE Deal', color: '#22c55e' },
                  { icon: '⚓', label: 'SEXTANT Alert', color: '#4d8fcc' },
                  { icon: '⚖', label: 'Counsel Matter', color: '#a855f7' },
                  { icon: '◉', label: 'Pulse Briefing', color: '#f59e0b' },
                  { icon: '◆', label: 'Ontology Query', color: ACCENT },
                ].map((t) => (
                  <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: t.color, background: `${t.color}10`, border: `1px solid ${t.color}30`, padding: '4px 10px', borderRadius: 6 }}>
                    <span>{t.icon}</span> {t.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OperatorPanel;
