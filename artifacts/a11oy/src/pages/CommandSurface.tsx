import { useState, useMemo } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, SeverityDot, SeverityBadge, VerticalBadge, HashId, ApprovalGate } from '../components/ui';
import { SEED_SIGNALS, SEED_WORKCELLS, SEED_OUTCOMES } from '@workspace/a11oy-fabric';
import { useAlloySignals, useAlloyWorkflows, useAlloyDashboard, useAlloyApprovals } from '../graphql';
import { DashboardEvidence } from '../components/DashboardEvidence';
import type { EvidenceMode } from '../lib/query-evidence';

const GOLD = '#c9b787';

const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#c9b787', 'vessels-maritime': '#8a8a8a', 'terra-real-estate': '#c9b787',
  'aegis-defense': '#f5f5f5', 'prism-counsel': '#8a8a8a', 'carlota-jo': '#c9b787', 'alloy-core': '#5e5e5e',
};
const VERTICAL_LABELS: Record<string, string> = {
  'lyte-revenue': 'Revenue', 'vessels-maritime': 'Maritime', 'terra-real-estate': 'Real Estate',
  'aegis-defense': 'Defense', 'prism-counsel': 'Legal', 'carlota-jo': 'Carlota Jo', 'alloy-core': 'Core',
};

const STATUS_COLORS: Record<string, string> = {
  achieved: '#22c55e', missed: '#ef4444', blocked: '#f97316', in_progress: GOLD, at_risk: '#f97316',
  running: GOLD, paused: '#8a8a8a', error: '#ef4444', completed: '#22c55e', waiting_approval: '#f97316',
};

interface NormalizedSignal {
  id: string;
  vertical: string;
  severity: string;
  status: string;
  title: string;
  description: string;
  detectedAt: string;
  owner: string;
  businessImpact: string;
  evidenceRefs: string[];
}

interface NormalizedWorkcell {
  id: string;
  name: string;
  status: string;
  requiresApproval: boolean;
  approvalState: string;
  description: string;
  domain: string;
  priority: string;
  isApiData: boolean;
  steps: Array<{ step: number; name: string; status: string }>;
  actionBrief?: { title: string; description: string; priority: string; estimatedImpact: string; approvalTier: string };
  mirrorEval?: { verdict: string; score: number; dimensions: Array<{ name: string; score: number }> };
  pceContractId?: string;
  verificationStatus?: string;
}

function fmt(ts: string) {
  try {
    const d = new Date(ts);
    if (!Number.isFinite(d.getTime())) return 'Unknown time';
    const diffMs = Date.now() - d.getTime();
    const diffM = Math.round(diffMs / 60000);
    if (diffM < 60) return `${diffM}m ago`;
    const diffH = Math.round(diffMs / 3600000);
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.round(diffH / 24)}d ago`;
  } catch { return ts; }
}

type ApprovalDecision = 'approved' | 'deferred' | 'rejected';
type ActionState = Record<string, ApprovalDecision>;

export function CommandSurface() {
  const [mode, setMode] = useState<EvidenceMode>('api');
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<ActionState>({});
  const signalsQuery = useAlloySignals({ limit: 100 });
  const workflowsQuery = useAlloyWorkflows({ limit: 50 });
  const dashboardQuery = useAlloyDashboard();
  const approvalsQuery = useAlloyApprovals({ status: 'pending', limit: 5 });
  const isDemo = mode === 'demo';
  const signalsAvailable = isDemo || signalsQuery.source.usable;
  const observedSignals = signalsQuery.source.usable ? signalsQuery.data : [];
  const observedWorkflows = workflowsQuery.source.usable ? workflowsQuery.data : [];
  const dashboard = !isDemo && dashboardQuery.source.usable ? dashboardQuery.data : null;

  const signals: NormalizedSignal[] = useMemo(() => {
    if (!isDemo) {
      return observedSignals.map(s => ({
        id: s.id,
        vertical: s.domain ?? '',
        severity: s.severity ?? 'unknown',
        status: s.status ?? 'unknown',
        title: s.title ?? '',
        description: s.description ?? '',
        detectedAt: s.createdAt ?? '',
        owner: s.ownerUserId ?? '',
        businessImpact: '',
        evidenceRefs: [],
      }));
    }
    return SEED_SIGNALS.map(s => ({
      id: s.id,
      vertical: s.vertical,
      severity: s.severity,
      status: s.status,
      title: s.title,
      description: s.description,
      detectedAt: s.detectedAt,
      owner: s.owner,
      businessImpact: s.businessImpact,
      evidenceRefs: s.evidenceRefs,
    }));
  }, [isDemo, observedSignals]);

  const criticalSignals = signals.filter(s => s.severity === 'critical' || s.severity === 'high').slice(0, 20);
  const pendingWC = isDemo ? SEED_WORKCELLS.filter(w => w.requiresApproval && w.status === 'running').slice(0, 4) : [];
  const topOutcomes = isDemo ? SEED_OUTCOMES.slice(0, 6) : [];

  const selectedSignal = signals.find(s => s.id === selectedSignalId) ?? null;

  const linkedWC: NormalizedWorkcell | null = useMemo(() => {
    if (!selectedSignal) return null;
    if (!isDemo) {
      const wf = observedWorkflows.find(w => w.triggerId === selectedSignal.id);
      if (!wf) return null;
      return {
        id: wf.id,
        name: wf.name,
        status: wf.status,
        requiresApproval: wf.requiresApproval,
        approvalState: wf.approvalState,
        description: wf.description ?? '',
        domain: wf.domain ?? '',
        priority: wf.priority ?? 'unknown',
        isApiData: true,
        steps: wf.steps.map(st => ({ step: st.step, name: st.name, status: st.status })),
      };
    }
    const wc = SEED_WORKCELLS.find(w => w.signals.includes(selectedSignal.id));
    if (!wc) return null;
    return {
      id: wc.id,
      name: wc.name,
      status: wc.status,
      requiresApproval: wc.requiresApproval,
      approvalState: 'none',
      description: wc.objective,
      domain: wc.vertical,
      priority: wc.actionBrief.priority,
      isApiData: false,
      steps: [],
      actionBrief: wc.actionBrief,
      mirrorEval: {
        verdict: wc.mirrorEvalResult.verdict,
        score: wc.mirrorEvalResult.score,
        dimensions: wc.mirrorEvalResult.dimensions,
      },
      pceContractId: wc.pceContractId,
      verificationStatus: wc.verificationResult.status,
    };
  }, [selectedSignal, isDemo, observedWorkflows]);

  const KPI_STRIP = isDemo ? [
    { label: 'DEMO SIGNALS', value: SEED_SIGNALS.length, sub: 'fictional fixture rows', color: GOLD },
    { label: 'DEMO WORKCELLS', value: SEED_WORKCELLS.length, sub: 'fictional fixture rows', color: GOLD },
    { label: 'DEMO PENDING', value: pendingWC.length, sub: 'fixture status only', color: GOLD },
    { label: 'DEMO OUTCOMES', value: topOutcomes.length, sub: 'fictional fixture rows', color: GOLD },
  ] : [
    { label: 'SIGNALS RETURNED', value: signalsQuery.source.usable ? observedSignals.length : '—', sub: signalsQuery.source.usable ? 'response sample, limit 100' : signalsQuery.source.state, color: GOLD },
    { label: 'WORKFLOWS RETURNED', value: workflowsQuery.source.usable ? observedWorkflows.length : '—', sub: workflowsQuery.source.usable ? 'response sample, limit 50' : workflowsQuery.source.state, color: GOLD },
    { label: 'APPROVALS RETURNED', value: approvalsQuery.source.usable ? approvalsQuery.data.length : '—', sub: approvalsQuery.source.usable ? 'pending sample, limit 5' : approvalsQuery.source.state, color: GOLD },
    { label: 'RUNNING RUNS', value: dashboard?.runningRuns ?? '—', sub: dashboard ? 'reported by dashboard' : dashboardQuery.source.state, color: GOLD },
    { label: 'TOTAL RUNS', value: dashboard?.totalRuns ?? '—', sub: dashboard ? 'not verified actions' : dashboardQuery.source.state, color: GOLD },
    { label: 'FAILED RUNS', value: dashboard?.failedRuns ?? '—', sub: dashboard ? 'reported by dashboard' : dashboardQuery.source.state, color: GOLD },
    { label: 'PENDING APPROVALS', value: dashboard?.pendingApprovals ?? '—', sub: dashboard ? 'reported by dashboard' : dashboardQuery.source.state, color: GOLD },
    { label: 'TOTAL WORKFLOWS', value: dashboard?.totalWorkflows ?? '—', sub: dashboard ? 'reported by dashboard' : dashboardQuery.source.state, color: GOLD },
  ];

  function decide(id: string, decision: ApprovalDecision) {
    if (!isDemo) return;
    setApprovals(p => ({ ...p, [id]: decision }));
  }
  function undoDecision(id: string) {
    if (!isDemo) return;
    setApprovals(p => { const n = { ...p }; delete n[id]; return n; });
  }

  return (
    <Layout>
      <PageHeader
        label="COMMAND SURFACE"
        contextLabel="Review only"
        title="Operator Response Review"
        subtitle="Inspect observed signals, workflow state and pending approval records. Operational authorization is not enabled in this view."
        status={isDemo ? 'DEMO' : undefined}
      />
      <DashboardEvidence mode={mode} onModeChange={next => { setMode(next); setSelectedSignalId(null); setApprovals({}); }} sources={{ dashboard: dashboardQuery.source, signals: signalsQuery.source, workflows: workflowsQuery.source, approvals: approvalsQuery.source }} />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
        {KPI_STRIP.map(k => (
          <div key={k.label} className="rounded-lg border p-2.5" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', borderTop: `2px solid ${k.color}` }}>
            <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 9, letterSpacing: '0.06em' }}>{k.label}</div>
            <div className="text-xl font-bold font-mono" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 10 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <div className="min-w-0 xl:col-span-2 flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="text-xs"><SectionTitle>Execution History UNAVAILABLE</SectionTitle>No bound time-series source is available. Rates and trends cannot be calculated from these responses.</Card>
            <Card className="text-xs"><SectionTitle>Proof Verification UNAVAILABLE</SectionTitle>No receipt-verification source, agent-trust measure or contract-health evidence is bound to this view.</Card>
          </div>

          <div className="flex flex-col lg:flex-row gap-0 border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-a11oy-border)', minHeight: 420 }}>
            <div className="min-w-0 flex-1 overflow-y-auto border-r" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <div className="p-3 border-b sticky top-0 z-10 flex items-center justify-between" style={{ backgroundColor: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(8px)', borderColor: 'var(--color-a11oy-border)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>HIGH / CRITICAL SIGNALS</span>
                  <span className="text-xs font-mono">{isDemo ? 'DEMO' : signalsQuery.source.state}</span>
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{signalsAvailable ? criticalSignals.length + ' shown' : 'Unavailable'}</span>
              </div>
              <div className="flex flex-col divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {criticalSignals.length === 0 ? (
                  <div className="p-8 text-center text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    {signalsAvailable ? 'No high or critical signals in the returned rows.' : signalsQuery.source.detail}
                  </div>
                ) : criticalSignals.map(s => {
                  const color = VERTICAL_COLORS[s.vertical] ?? '#5e5e5e';
                  const isSelected = s.id === selectedSignalId;
                  return (
                    <div
                      key={s.id}
                      className="p-3 cursor-pointer transition-all"
                      onClick={() => setSelectedSignalId(isSelected ? null : s.id)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(201,183,135,0.05)' : 'var(--color-a11oy-card)',
                        borderLeft: isSelected ? `2px solid ${GOLD}` : '2px solid transparent',
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <SeverityDot severity={s.severity as 'critical' | 'high' | 'medium' | 'low' | 'info'} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            <SeverityBadge severity={s.severity} />
                            <VerticalBadge vertical={VERTICAL_LABELS[s.vertical] ?? s.vertical} color={color} />
                          </div>
                          <div className="text-xs font-medium truncate" style={{ color: 'var(--color-a11oy-text)' }}>{s.title}</div>
                          {isSelected && <div className="text-xs mt-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{s.description}</div>}
                        </div>
                        <div className="text-xs font-mono flex-shrink-0" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{fmt(s.detectedAt)}</div>
                      </div>
                      {isSelected && linkedWC && (
                        <div className="mt-2 px-2 py-1.5 rounded text-xs" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)' }}>
                          <span style={{ color: '#c9b787' }}>↗ Linked {linkedWC.isApiData ? 'workflow' : 'workcell'}: </span>
                          <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{linkedWC.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full lg:w-72 flex-shrink-0 overflow-y-auto" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
              {selectedSignal ? (
                <div className="p-4">
                  <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SIGNAL DETAIL</div>
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{selectedSignal.title}</div>
                  <HashId id={selectedSignal.id} />
                  <div className="flex flex-wrap gap-1.5 mb-2 mt-2">
                    <SeverityBadge severity={selectedSignal.severity} />
                    <VerticalBadge vertical={VERTICAL_LABELS[selectedSignal.vertical] ?? selectedSignal.vertical} color={VERTICAL_COLORS[selectedSignal.vertical] ?? '#5e5e5e'} />
                  </div>
                  <p className="text-xs mb-3" style={{ color: 'var(--color-a11oy-text-sub)' }}>{selectedSignal.description}</p>
                  {selectedSignal.businessImpact && (
                    <div className="text-xs p-2 rounded mb-3" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: GOLD, border: '1px solid rgba(201,183,135,0.2)' }}>
                      {selectedSignal.businessImpact}
                    </div>
                  )}

                  {linkedWC && linkedWC.actionBrief && (
                    <div className="border-t pt-3 mb-3" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                      <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ACTION BRIEF</div>
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{linkedWC.actionBrief.title}</div>
                      <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{linkedWC.actionBrief.description}</div>
                      <div className="text-xs font-mono mb-2" style={{ color: GOLD }}>{linkedWC.actionBrief.estimatedImpact}</div>
                    </div>
                  )}

                  {linkedWC && linkedWC.isApiData && (
                    <div className="border-t pt-3 mb-3" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                      <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>LINKED WORKFLOW</div>
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{linkedWC.name}</div>
                      <p className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Read-only observation. Approval submission is unavailable in this view.</p>
                      <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-sub)' }}>{linkedWC.description}</div>
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.12)', color: '#c9b787' }}>{linkedWC.status}</span>
                        {linkedWC.requiresApproval && (
                          <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(245,245,245,0.08)', color: '#f5f5f5' }}>approval: {linkedWC.approvalState}</span>
                        )}
                      </div>
                      {linkedWC.steps.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>STEPS</div>
                          {linkedWC.steps.map(step => (
                            <div key={step.step} className="text-xs flex items-center gap-2 mb-0.5">
                              <span className="font-mono" style={{ color: step.status === 'completed' ? '#c9b787' : step.status === 'running' ? '#f5f5f5' : 'var(--color-a11oy-text-ghost)' }}>
                                {step.status === 'completed' ? '✓' : step.status === 'running' ? '▸' : '·'}
                              </span>
                              <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{step.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {isDemo && linkedWC && linkedWC.requiresApproval && !approvals[linkedWC.id] && (
                    <div className="border-t pt-3" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                      <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>DEMO CHOICE — LOCAL ONLY</div>
                      <ApprovalGate label={`Demo approval field: ${linkedWC.isApiData ? `state: ${linkedWC.approvalState}` : `tier: ${linkedWC.actionBrief?.approvalTier ?? '—'}`}`} />
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        <button type="button" onClick={() => decide(linkedWC.id, 'approved')} className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer' }}>Demo: approve</button>
                        <button type="button" onClick={() => decide(linkedWC.id, 'deferred')} className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}>Demo: defer</button>
                        <button type="button" onClick={() => decide(linkedWC.id, 'rejected')} className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>Demo: reject</button>
                      </div>
                    </div>
                  )}
                  {isDemo && linkedWC && approvals[linkedWC.id] === 'approved' && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>Demo choice: approved</div>
                      <button type="button" onClick={() => undoDecision(linkedWC.id)} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear demo choice</button>
                    </div>
                  )}
                  {isDemo && linkedWC && approvals[linkedWC.id] === 'deferred' && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.2)' }}>Demo choice: deferred</div>
                      <button type="button" onClick={() => undoDecision(linkedWC.id)} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear demo choice</button>
                    </div>
                  )}
                  {isDemo && linkedWC && approvals[linkedWC.id] === 'rejected' && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>Demo choice: rejected</div>
                      <button type="button" onClick={() => undoDecision(linkedWC.id)} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear demo choice</button>
                    </div>
                  )}

                  {selectedSignal.evidenceRefs.length > 0 && (
                    <div className="mt-3 border-t pt-3" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                      <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>EVIDENCE REFS</div>
                      <div className="flex flex-col gap-1">
                        {selectedSignal.evidenceRefs.map(ref => (
                          <div key={ref} className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                            {ref}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                  <div className="text-3xl mb-2" style={{ color: 'var(--color-a11oy-border)' }}>▸</div>
                  Select a signal to view details and action controls.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="min-w-0 flex flex-col gap-4">
          <Card className="text-xs"><SectionTitle>Active Agents UNAVAILABLE</SectionTitle>No agent-status query is bound to this view.</Card>

          <div>
            <SectionTitle>{isDemo ? 'Demo Approval Choices' : 'Pending Approvals Returned'} ({isDemo ? pendingWC.length : approvalsQuery.source.usable ? approvalsQuery.data.length : '—'})</SectionTitle>
            <div className="flex flex-col gap-2">
              {!isDemo && !approvalsQuery.source.usable && <Card className="text-xs">{approvalsQuery.source.detail}</Card>}
              {!isDemo && approvalsQuery.source.usable && approvalsQuery.data.length === 0 && <Card className="text-xs">No pending approvals returned in this response.</Card>}
              {!isDemo && approvalsQuery.source.usable && approvalsQuery.data.map(approval => (
                <Card key={approval.id} className="text-xs">
                  <HashId id={approval.id} />
                  <p className="mt-2">Workflow: {approval.workflowId}</p>
                  <p>Reported status: {approval.status}</p>
                  {approval.reason && <p className="mt-1">{approval.reason}</p>}
                  <p className="mt-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Read-only record. Approval submission is unavailable.</p>
                </Card>
              ))}
              {pendingWC.map(wc => (
                <Card key={wc.id}>
                  <div className="text-xs font-medium mb-1 truncate" style={{ color: 'var(--color-a11oy-text)' }}>{wc.actionBrief.title}</div>
                  <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Tier: {wc.actionBrief.approvalTier} · {wc.actionBrief.priority} priority</div>
                  {!approvals[wc.id] ? (
                    <div className="flex gap-1.5 flex-wrap">
                      <button type="button" onClick={() => decide(wc.id, 'approved')} className="text-xs px-2.5 py-1 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', cursor: 'pointer' }}>Demo: approve</button>
                      <button type="button" onClick={() => decide(wc.id, 'deferred')} className="text-xs px-2.5 py-1 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}>Demo: defer</button>
                      <button type="button" onClick={() => decide(wc.id, 'rejected')} className="text-xs px-2.5 py-1 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>Demo: reject</button>
                    </div>
                  ) : approvals[wc.id] === 'approved' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: '#22c55e' }}>Demo choice: approved</span>
                      <button type="button" onClick={() => undoDecision(wc.id)} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear demo choice</button>
                    </div>
                  ) : approvals[wc.id] === 'deferred' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: '#c9b787' }}>Demo choice: deferred</span>
                      <button type="button" onClick={() => undoDecision(wc.id)} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear demo choice</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: '#ef4444' }}>Demo choice: rejected</span>
                      <button type="button" onClick={() => undoDecision(wc.id)} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear demo choice</button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>{isDemo ? 'Demo Outcome Scorecard' : 'Outcomes UNAVAILABLE'}</SectionTitle>
            <div className="flex flex-col gap-1.5">
              {!isDemo && <Card className="text-xs">No outcomes query is bound to this view.</Card>}
              {topOutcomes.map(o => {
                const statusColor = STATUS_COLORS[o.status] ?? GOLD;
                return (
                  <div key={o.id} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg" style={{ backgroundColor: 'var(--color-a11oy-card)', border: '1px solid var(--color-a11oy-border)' }}>
                    <span className="truncate flex-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{o.title.slice(0, 32)}</span>
                    <span className="font-mono ml-2 flex-shrink-0" style={{ color: statusColor }}>{o.status.replace(/_/g, ' ')}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
        {isDemo ? 'DEMO choices exist only in this page. No authorization, execution, signature or ledger write occurs.' : 'API responses are observations. Approval submission, execution and independent verification remain unavailable in this view.'}
      </div>
    </Layout>
  );
}
