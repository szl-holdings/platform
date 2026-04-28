import { useStandardMutation, useStandardQuery } from '@szl-holdings/api-client-react';
import { cn } from '@szl-holdings/shared-ui/utils';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Lock,
  Pause,
  RotateCcw,
  ShieldOff,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useStepUp } from '@/lib/use-step-up';

const FALLBACK_PLAYBOOKS = [
  {
    id: 'PB-001',
    name: 'Lateral Movement Response',
    caseRef: 'CASE-0041',
    status: 'executing',
    startedAt: '34m ago',
    analyst: 'J. Chen',
    approver: 'M. Walsh',
    gate: 'approval_required',
    steps: [
      {
        id: 'S01',
        name: 'Alert triage and severity confirmation',
        status: 'executed',
        gate: 'approved_execute',
        executedBy: 'J. Chen',
        executedAt: '35m ago',
        assignedTo: null,
        requestedAt: null,
        notes: 'Severity confirmed: CRITICAL',
      },
      {
        id: 'S02',
        name: 'Network isolation proposal — DC-PROD-03',
        status: 'pending',
        gate: 'approval_required',
        executedBy: null,
        executedAt: null,
        assignedTo: 'SOC Manager',
        requestedAt: '28m ago',
        notes: 'Awaiting manager approval APR-001',
      },
      {
        id: 'S03',
        name: 'Credential rotation — SVC-ACCNT-04',
        status: 'pending',
        gate: 'approval_required',
        executedBy: null,
        executedAt: null,
        assignedTo: 'SOC Manager',
        requestedAt: '28m ago',
        notes: 'Blocked on approval of S02',
      },
      {
        id: 'S04',
        name: 'Perimeter block — 103.45.18.22',
        status: 'pending',
        gate: 'approval_required',
        executedBy: null,
        executedAt: null,
        assignedTo: 'Network Ops',
        requestedAt: '15m ago',
        notes: '',
      },
      {
        id: 'S05',
        name: 'Memory forensics — DC-PROD-03',
        status: 'pending',
        gate: 'propose_only',
        executedBy: null,
        executedAt: null,
        assignedTo: 'IR Team',
        requestedAt: null,
        notes: '',
      },
      {
        id: 'S06',
        name: 'Post-containment sweep — adjacent segment',
        status: 'pending',
        gate: 'propose_only',
        executedBy: null,
        executedAt: null,
        assignedTo: 'IR Team',
        requestedAt: null,
        notes: '',
      },
      {
        id: 'S07',
        name: 'Executive notification and SLA update',
        status: 'pending',
        gate: 'approved_execute',
        executedBy: null,
        executedAt: null,
        assignedTo: 'SOC Manager',
        requestedAt: null,
        notes: '',
      },
    ],
  },
  {
    id: 'PB-002',
    name: 'Credential Spray Containment',
    caseRef: 'CASE-0038',
    status: 'completed',
    startedAt: '2h ago',
    analyst: 'L. Kim',
    approver: 'M. Walsh',
    gate: 'approved_execute',
    steps: [
      {
        id: 'S01',
        name: 'Source IP block — ASN range',
        status: 'executed',
        gate: 'approved_execute',
        executedBy: 'System',
        executedAt: '2h ago',
        assignedTo: null,
        requestedAt: null,
        notes: '',
      },
      {
        id: 'S02',
        name: 'Auth failure audit — affected accounts',
        status: 'executed',
        gate: 'approved_execute',
        executedBy: 'L. Kim',
        executedAt: '1h 48m ago',
        assignedTo: null,
        requestedAt: null,
        notes: 'No successful auth events confirmed',
      },
      {
        id: 'S03',
        name: 'Alert closed — automated threat',
        status: 'executed',
        gate: 'approved_execute',
        executedBy: 'L. Kim',
        executedAt: '1h 42m ago',
        assignedTo: null,
        requestedAt: null,
        notes: '',
      },
    ],
  },
];

const ROLLBACK_ACTIONS = [
  {
    id: 'RB-01',
    name: 'Re-enable DC-PROD-03 network connectivity',
    associatedStep: 'S02',
    gate: 'approval_required',
    status: 'available',
  },
  {
    id: 'RB-02',
    name: 'Restore SVC-ACCNT-04 prior credential state',
    associatedStep: 'S03',
    gate: 'approval_required',
    status: 'available',
  },
];

const CONTAINMENT_ACTIONS = [
  {
    id: 'CT-01',
    name: 'Emergency segment isolation — PROD-EAST',
    actionType: 'network_isolation',
    targetAsset: 'PROD-EAST',
    gate: 'approval_required',
    severity: 'critical',
    status: 'available',
  },
  {
    id: 'CT-02',
    name: 'Force session termination — all active sessions',
    actionType: 'session_termination',
    targetAsset: 'all-active-sessions',
    gate: 'approval_required',
    severity: 'high',
    status: 'available',
  },
  {
    id: 'CT-03',
    name: 'Kill switch — svc-integration OAuth tokens',
    actionType: 'credential_revocation',
    targetAsset: 'svc-integration-oauth',
    gate: 'approval_required',
    severity: 'high',
    status: 'available',
  },
];

const GATE_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  approval_required: {
    bg: 'bg-[#c9b787]/10',
    text: 'text-[#c9b787]',
    border: 'border-[#c9b787]/20',
    label: 'Approval Required',
  },
  approved_execute: {
    bg: 'bg-[#c9b787]/10',
    text: 'text-[#c9b787]',
    border: 'border-[#c9b787]/20',
    label: 'Approved Execute',
  },
  propose_only: {
    bg: 'bg-[#c9b787]/10',
    text: 'text-[#c9b787]',
    border: 'border-[#c9b787]/20',
    label: 'Propose Only',
  },
  blocked_by_policy: {
    bg: 'bg-[#f5f5f5]/10',
    text: 'text-[#f5f5f5]',
    border: 'border-[#f5f5f5]/20',
    label: 'Blocked by Policy',
  },
};

const STEP_STATUS_STYLES: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> =
  {
    executed: { icon: CheckCircle2, color: 'text-[#c9b787]', bg: 'bg-[#c9b787]/10' },
    completed: { icon: CheckCircle2, color: 'text-[#c9b787]', bg: 'bg-[#c9b787]/10' },
    pending: { icon: Clock, color: 'text-white/40', bg: 'bg-white/5' },
    blocked: { icon: AlertOctagon, color: 'text-[#f5f5f5]', bg: 'bg-[#f5f5f5]/10' },
    failed: { icon: XCircle, color: 'text-[#f5f5f5]', bg: 'bg-[#f5f5f5]/10' },
    'human-review': { icon: Users, color: 'text-[#c9b787]', bg: 'bg-[#c9b787]/10' },
    executing: { icon: Activity, color: 'text-[#c9b787]', bg: 'bg-[#c9b787]/10' },
    in_progress: { icon: Activity, color: 'text-[#c9b787]', bg: 'bg-[#c9b787]/10' },
  };

const PB_STATUS_STYLES: Record<string, string> = {
  executing: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/20',
  in_progress: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/20',
  completed: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/20',
  blocked: 'bg-[#f5f5f5]/10 text-[#f5f5f5] border-[#f5f5f5]/20',
  failed: 'bg-[#f5f5f5]/10 text-[#f5f5f5] border-[#f5f5f5]/20',
  paused: 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/20',
  pending: 'bg-white/5 text-white/40 border-white/10',
};

interface StepShape {
  id: string;
  name: string;
  status: string;
  gate: string;
  executedBy?: string | null;
  executedAt?: string | null;
  assignedTo?: string | null;
  requestedAt?: string | null;
  notes?: string;
}

function StepRow({ step }: { step: StepShape }) {
  const s = STEP_STATUS_STYLES[step.status] ?? STEP_STATUS_STYLES.pending;
  const Icon = s.icon;
  const gate = GATE_STYLES[step.gate] ?? GATE_STYLES.propose_only;
  return (
    <div
      className={cn('flex items-start gap-3 px-4 py-3 rounded-lg border border-white/[0.04]', s.bg)}
    >
      <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-white/5">
        <Icon className={cn('w-3.5 h-3.5', s.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-white/85">{step.name}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <span
            className={cn(
              'text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wide',
              gate.bg,
              gate.text,
              gate.border,
            )}
          >
            {gate.label}
          </span>
          {step.assignedTo && (
            <span className="text-[10px] text-white/35">→ {step.assignedTo}</span>
          )}
          {step.executedAt && (
            <span className="text-[10px] text-white/30">executed {step.executedAt}</span>
          )}
          {step.requestedAt && (
            <span className="text-[10px] text-white/30">requested {step.requestedAt}</span>
          )}
        </div>
        {step.notes && (
          <p className="text-[10px] text-white/45 mt-1 leading-relaxed">{step.notes}</p>
        )}
      </div>
      {step.status === 'pending' && step.gate === 'approval_required' && (
        <div className="flex gap-1.5 shrink-0">
          <button className="px-2 py-1 rounded text-[9px] font-semibold bg-[#c9b787]/10 border border-[#c9b787]/20 text-[#c9b787] hover:bg-[#c9b787]/20">
            Approve
          </button>
          <button className="px-2 py-1 rounded text-[9px] font-semibold bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 text-[#f5f5f5] hover:bg-[#f5f5f5]/20">
            Block
          </button>
        </div>
      )}
      {step.status === 'pending' && step.gate === 'propose_only' && (
        <button className="px-2 py-1 rounded text-[9px] font-semibold bg-[#c9b787]/10 border border-[#c9b787]/20 text-[#c9b787] hover:bg-[#c9b787]/20 shrink-0">
          Initiate
        </button>
      )}
    </div>
  );
}

interface LiveWorkflowAction {
  id: number;
  entityType: string;
  entityId: number;
  actionType: string;
  assignedTo?: string | null;
  status: string;
  notes?: string | null;
  triggeredBy?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PlaybooksPayload {
  playbooks: LiveWorkflowAction[];
  total?: number;
  ztEnvironment?: string;
  ztPermissionClass?: string;
  ztDataLabels?: { sensitivityLabel: string; retentionClass: string };
  fetchedAt: string;
}

interface PlaybookGroup {
  id: string;
  name: string;
  caseRef: string;
  status: string;
  startedAt: string;
  analyst: string;
  approver: string;
  gate: string;
  steps: StepShape[];
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  assign_owner: 'Owner Assignment',
  escalate: 'Escalation',
  acknowledge: 'Acknowledge Alert',
  remediate: 'Remediation Action',
  route_to_response: 'Route to Response Team',
  create_ticket: 'Create Ticket',
  notify: 'Notification',
};

function formatTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function deriveGate(action: LiveWorkflowAction): string {
  if (action.actionType === 'escalate' || action.actionType === 'remediate')
    return 'approval_required';
  if (action.actionType === 'route_to_response') return 'approval_required';
  return 'approved_execute';
}

function groupLiveActions(actions: LiveWorkflowAction[]): PlaybookGroup[] {
  const byEntity = new Map<string, LiveWorkflowAction[]>();
  for (const a of actions) {
    const key = `${a.entityType}-${a.entityId}`;
    const group = byEntity.get(key) ?? [];
    group.push(a);
    byEntity.set(key, group);
  }

  return Array.from(byEntity.entries()).map(([_key, group], idx) => {
    const sorted = group.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const first = sorted[0];
    const allCompleted = sorted.every((a) => a.status === 'completed');
    const anyFailed = sorted.some((a) => a.status === 'failed');
    const anyInProgress = sorted.some((a) => a.status === 'in_progress');

    const pbStatus = anyFailed
      ? 'failed'
      : allCompleted
        ? 'completed'
        : anyInProgress
          ? 'in_progress'
          : 'pending';

    return {
      id: `PB-LIVE-${idx + 1}`,
      name: `${first.entityType.charAt(0).toUpperCase() + first.entityType.slice(1)} #${first.entityId} Response`,
      caseRef: `${first.entityType.toUpperCase()}-${String(first.entityId).padStart(4, '0')}`,
      status: pbStatus,
      startedAt: formatTimeAgo(first.createdAt),
      analyst: first.triggeredBy ?? 'System',
      approver: 'SOC Manager',
      gate: deriveGate(first),
      steps: sorted.map((a, i) => ({
        id: `S${String(i + 1).padStart(2, '0')}`,
        name: ACTION_TYPE_LABELS[a.actionType] ?? a.actionType,
        status: a.status === 'completed' ? 'executed' : a.status,
        gate: deriveGate(a),
        executedBy: a.triggeredBy,
        executedAt: a.completedAt ? formatTimeAgo(a.completedAt) : null,
        assignedTo: a.assignedTo,
        requestedAt: formatTimeAgo(a.createdAt),
        notes: a.notes ?? '',
      })),
    };
  });
}

export default function ResponseOrchestration() {
  const [selectedPbId, setSelectedPbId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'playbook' | 'rollback' | 'containment'>('playbook');
  const [_expandedSteps, _setExpandedSteps] = useState(true);

  const { data: playbooksData } = useStandardQuery<PlaybooksPayload>({
    queryKey: ['command-playbooks'],
    queryFn: () => api.command.playbooks(),
    retry: false,
  });

  const { requestStepUp } = useStepUp();

  const containMutation = useStandardMutation({
    mutationFn: async (payload: {
      containmentType: string;
      assetId: string;
      justification: string;
    }) => {
      const token = await requestStepUp(
        `Containment action: ${payload.containmentType} on ${payload.assetId}`,
      );
      if (!token) throw new Error('Step-up verification cancelled by operator.');
      return api.command.contain(
        payload.containmentType,
        payload.assetId,
        payload.justification,
        token,
      );
    },
  });

  const liveActions = playbooksData?.playbooks ?? [];
  const envLabel = playbooksData?.ztEnvironment;
  const sensitivityLabel = playbooksData?.ztDataLabels?.sensitivityLabel;

  const liveGroups = useMemo(() => groupLiveActions(liveActions), [liveActions]);
  const usingLive = liveGroups.length > 0;
  const displayPlaybooks: PlaybookGroup[] = usingLive ? liveGroups : FALLBACK_PLAYBOOKS;

  const selectedId = selectedPbId ?? displayPlaybooks[0]?.id ?? '';
  const pb = displayPlaybooks.find((p) => p.id === selectedId) ?? displayPlaybooks[0];

  const executed =
    pb?.steps.filter((s) => s.status === 'executed' || s.status === 'completed').length ?? 0;
  const pending = pb?.steps.filter((s) => s.status === 'pending').length ?? 0;
  const blocked =
    pb?.steps.filter((s) => s.status === 'blocked' || s.status === 'failed').length ?? 0;

  return (
    <div
      className="flex h-full min-h-screen"
      style={{ backgroundColor: '#070A10', color: 'var(--gi-text-primary)' }}
    >
      <div className="w-72 shrink-0 border-r border-white/5 flex flex-col">
        <div className="px-4 py-3 border-b border-white/5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#c9b787]" />
              <span className="text-xs font-semibold text-white">Response Orchestration</span>
            </div>
            {envLabel && (
              <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-[#c9b787]/30 bg-[#c9b787]/5 text-[#c9b787]/70">
                {envLabel}
              </span>
            )}
          </div>
          <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {sensitivityLabel && (
              <>
                <Lock className="w-2.5 h-2.5 inline mr-1" />
                {sensitivityLabel} ·{' '}
              </>
            )}
            Playbook execution board
            {usingLive && <span className="text-[#c9b787] ml-1">· {liveGroups.length} live</span>}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
          {displayPlaybooks.map((pb2) => (
            <button
              key={pb2.id}
              onClick={() => setSelectedPbId(pb2.id)}
              className={cn(
                'w-full text-left px-4 py-3 transition-all border-l-2',
                selectedId === pb2.id
                  ? 'bg-[#c9b787]/10 border-[#c9b787]'
                  : 'hover:bg-white/[0.02] border-transparent',
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-mono text-white/40">{pb2.id}</span>
                <span
                  className={cn(
                    'text-[8px] font-mono px-1 py-0.5 rounded border uppercase',
                    PB_STATUS_STYLES[pb2.status] ?? 'border-white/10 text-white/40',
                  )}
                >
                  {pb2.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-[11px] font-medium text-white/85 mb-0.5">{pb2.name}</p>
              <p className="text-[10px] text-white/35">
                {pb2.caseRef} · {pb2.startedAt}
              </p>
            </button>
          ))}
        </div>
        <div className="p-3 border-t border-white/5">
          <button className="w-full py-2 rounded-lg text-xs font-semibold bg-[#c9b787]/10 border border-[#c9b787]/20 text-[#c9b787] hover:bg-[#c9b787]/20 transition-colors">
            + New Playbook
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pb && (
          <>
            <div
              className="px-6 py-4 border-b border-white/5 sticky top-0 z-10"
              style={{ backgroundColor: '#070A10' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-mono text-white/40">{pb.id}</span>
                    <span className="text-[8px] font-mono text-white/30">→</span>
                    <span className="text-[9px] font-mono text-white/40">{pb.caseRef}</span>
                    <span
                      className={cn(
                        'text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase',
                        PB_STATUS_STYLES[pb.status] ?? '',
                      )}
                    >
                      {pb.status.replace('_', ' ')}
                    </span>
                    {pb.gate && (
                      <span
                        className={cn(
                          'text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wide',
                          GATE_STYLES[pb.gate]?.bg,
                          GATE_STYLES[pb.gate]?.text,
                          GATE_STYLES[pb.gate]?.border,
                        )}
                      >
                        {GATE_STYLES[pb.gate]?.label}
                      </span>
                    )}
                    {usingLive && (
                      <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-[#c9b787]/20 bg-[#c9b787]/5 text-[#c9b787]/70">
                        LIVE
                      </span>
                    )}
                  </div>
                  <h1 className="text-sm font-bold text-white">{pb.name}</h1>
                  <div
                    className="flex items-center gap-3 mt-1 text-[10px]"
                    style={{ color: 'rgba(255,255,255,0.4)' }}
                  >
                    <span>Lead: {pb.analyst}</span>
                    <span>·</span>
                    <span>Approver: {pb.approver}</span>
                    <span>·</span>
                    <span>Started {pb.startedAt}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  {(pb.status === 'executing' || pb.status === 'in_progress') && (
                    <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#c9b787]/10 border border-[#c9b787]/20 text-[#c9b787] hover:bg-[#c9b787]/20 transition-colors flex items-center gap-1.5">
                      <Pause className="w-3 h-3" /> Pause
                    </button>
                  )}
                  <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 text-[#f5f5f5] hover:bg-[#f5f5f5]/20 transition-colors flex items-center gap-1.5">
                    <ShieldOff className="w-3 h-3" /> Abort
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <div
                  className="flex justify-between text-[10px] mb-1"
                  style={{ color: 'rgba(255,255,255,0.35)' }}
                >
                  <span>
                    {executed}/{pb.steps.length} steps
                  </span>
                  <div className="flex gap-3">
                    <span className="text-[#c9b787]">{executed} executed</span>
                    <span className="text-white/40">{pending} pending</span>
                    {blocked > 0 && <span className="text-[#f5f5f5]">{blocked} blocked</span>}
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#c9b787] transition-all"
                    style={{
                      width: `${pb.steps.length > 0 ? (executed / pb.steps.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-0.5 px-6 py-2 border-b border-white/5">
              {(['playbook', 'rollback', 'containment'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-[11px] font-medium capitalize transition-all',
                    activeTab === tab
                      ? 'bg-[#c9b787]/15 text-[#c9b787] border border-[#c9b787]/20'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5',
                  )}
                >
                  {tab === 'rollback'
                    ? 'Rollback Actions'
                    : tab === 'containment'
                      ? 'Containment'
                      : 'Playbook Steps'}
                </button>
              ))}
            </div>

            <div className="px-6 py-5">
              {activeTab === 'playbook' && (
                <div className="space-y-2">
                  {pb.steps.map((step, i) => (
                    <div key={step.id} className="flex gap-3 items-stretch">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[9px] font-mono text-white/30 shrink-0">
                          {i + 1}
                        </div>
                        {i < pb.steps.length - 1 && <div className="flex-1 w-px bg-white/5 my-1" />}
                      </div>
                      <div className="flex-1">
                        <StepRow step={step} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'rollback' && (
                <div className="space-y-3">
                  <div className="bg-[#c9b787]/[0.06] border border-[#c9b787]/15 rounded-xl p-4 flex gap-3">
                    <AlertTriangle className="w-4 h-4 text-[#c9b787] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#c9b787] mb-1">Rollback Actions</p>
                      <p className="text-[11px] text-[#c9b787]/60">
                        Rollback actions reverse executed playbook steps. All rollbacks require
                        approval_required gate minimum. Actions are irreversible once confirmed.
                      </p>
                    </div>
                  </div>
                  {ROLLBACK_ACTIONS.map((rb) => (
                    <div
                      key={rb.id}
                      className="bg-white/[0.025] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <RotateCcw className="w-3.5 h-3.5 text-[#c9b787]" />
                          <span className="text-[11px] font-medium text-white/85">{rb.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#c9b787]/20 bg-[#c9b787]/10 text-[#c9b787]">
                            approval_required
                          </span>
                          <span className="text-[10px] text-white/35">
                            reverses step {rb.associatedStep}
                          </span>
                        </div>
                      </div>
                      <button className="px-3 py-1.5 rounded text-[10px] font-semibold bg-[#c9b787]/10 border border-[#c9b787]/20 text-[#c9b787] hover:bg-[#c9b787]/20 shrink-0">
                        Request Rollback
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'containment' && (
                <div className="space-y-3">
                  <div className="bg-[#f5f5f5]/[0.06] border border-[#f5f5f5]/15 rounded-xl p-4 flex gap-3">
                    <AlertOctagon className="w-4 h-4 text-[#f5f5f5] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-[#f5f5f5] mb-1">
                        Emergency Containment
                      </p>
                      <p className="text-[11px] text-[#f5f5f5]/60">
                        Containment actions have broad impact. All require explicit approval.
                        Automated blocking is gated at approval_required minimum — no containment
                        action executes without named authorization.
                      </p>
                    </div>
                  </div>
                  {CONTAINMENT_ACTIONS.map((ct) => (
                    <div
                      key={ct.id}
                      className="bg-white/[0.025] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldOff className="w-3.5 h-3.5 text-[#f5f5f5]" />
                          <span className="text-[11px] font-medium text-white/85">{ct.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase',
                              GATE_STYLES[ct.gate]?.bg,
                              GATE_STYLES[ct.gate]?.text,
                              GATE_STYLES[ct.gate]?.border,
                            )}
                          >
                            {ct.gate}
                          </span>
                          <span
                            className={cn(
                              'text-[8px] font-mono px-1.5 py-0.5 rounded border uppercase',
                              ct.severity === 'critical'
                                ? 'bg-[#f5f5f5]/10 text-[#f5f5f5] border-[#f5f5f5]/20'
                                : 'bg-[#c9b787]/10 text-[#c9b787] border-[#c9b787]/20',
                            )}
                          >
                            {ct.severity}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          containMutation.mutate({
                            containmentType: ct.actionType,
                            assetId: ct.targetAsset,
                            justification: ct.name,
                          })
                        }
                        disabled={containMutation.isPending}
                        className="px-3 py-1.5 rounded text-[10px] font-semibold bg-[#f5f5f5]/10 border border-[#f5f5f5]/20 text-[#f5f5f5] hover:bg-[#f5f5f5]/20 shrink-0 disabled:opacity-40"
                      >
                        {containMutation.isPending ? 'Requesting...' : 'Request Action'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
