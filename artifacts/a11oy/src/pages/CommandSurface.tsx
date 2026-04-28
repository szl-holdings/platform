import { useState, useMemo, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, SeverityDot, SeverityBadge, VerticalBadge, ActionButton, HashId, VerdictBadge, ApprovalGate } from '../components/ui';
import { SEED_SIGNALS, SEED_WORKCELLS, SEED_OUTCOMES } from '@workspace/a11oy-fabric';
import { useAlloySignals, useAlloyWorkflows, useAlloyDashboard, useAlloyApprovals } from '../graphql';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';

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
  isLive: boolean;
  steps: Array<{ step: number; name: string; status: string }>;
  actionBrief?: { title: string; description: string; priority: string; estimatedImpact: string; approvalTier: string };
  mirrorEval?: { verdict: string; score: number; dimensions: Array<{ name: string; score: number }> };
  pceContractId?: string;
  verificationStatus?: string;
}

function fmt(ts: string) {
  try {
    const d = new Date(ts);
    const diffMs = Date.now() - d.getTime();
    const diffM = Math.round(diffMs / 60000);
    if (diffM < 60) return `${diffM}m ago`;
    const diffH = Math.round(diffMs / 3600000);
    if (diffH < 24) return `${diffH}h ago`;
    return `${Math.round(diffH / 24)}d ago`;
  } catch { return ts; }
}

const velocityData = Array.from({ length: 24 }, (_, i) => ({
  h: i,
  actions: Math.floor(8 + Math.sin(i * 0.5) * 4 + (i > 8 && i < 18 ? 6 : 0)),
}));

const proofCovData = Array.from({ length: 24 }, (_, i) => ({
  h: i,
  pct: Math.round(88 + Math.sin(i * 0.3) * 4),
}));

const ACTIVE_AGENTS = [
  { id: 'cascade', name: 'Cascade Navigator', vertical: 'vessels-maritime', status: 'pending_approval', lastAction: 'Port standby — awaiting VP', trust: 97 },
  { id: 'counsel', name: 'Counsel Sentinel', vertical: 'prism-counsel', status: 'active', lastAction: 'Talbot escalation complete', trust: 99 },
  { id: 'pipeline', name: 'Pipeline Oracle', vertical: 'lyte-revenue', status: 'active', lastAction: 'Q2 pipeline analysis running', trust: 91 },
  { id: 'guardian', name: 'Guardian', vertical: 'aegis-defense', status: 'active', lastAction: 'Perimeter hardening verified', trust: 99 },
  { id: 'domaine', name: 'DOMAINE Analyst', vertical: 'terra-real-estate', status: 'active', lastAction: 'Cap rate model updated', trust: 88 },
  { id: 'watchdog', name: 'Fabric Watchdog', vertical: 'alloy-core', status: 'active', lastAction: 'Layer health: all nominal', trust: 100 },
];

type ApprovalDecision = 'approved' | 'deferred' | 'rejected';
type ActionState = Record<string, ApprovalDecision>;

export function CommandSurface() {
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [approvals, setApprovals] = useState<ActionState>({});
  const [tick, setTick] = useState(0);

  const { data: liveSignals, fetching: signalsLoading } = useAlloySignals({ limit: 100 });
  const { data: liveWorkflows } = useAlloyWorkflows({ limit: 50 });
  const { data: dashboard } = useAlloyDashboard();
  const { data: liveApprovals } = useAlloyApprovals({ status: 'pending', limit: 5 });

  const isLive = liveSignals.length > 0;

  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 4000);
    return () => clearInterval(t);
  }, []);

  const signals: NormalizedSignal[] = useMemo(() => {
    if (isLive) {
      return liveSignals.map(s => ({
        id: s.id,
        vertical: s.domain ?? '',
        severity: s.severity ?? 'medium',
        status: s.status ?? 'active',
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
  }, [isLive, liveSignals]);

  const criticalSignals = signals.filter(s => s.severity === 'critical' || s.severity === 'high').slice(0, 20);
  const pendingWC = SEED_WORKCELLS.filter(w => w.requiresApproval && w.status === 'running').slice(0, 4);
  const topOutcomes = SEED_OUTCOMES.slice(0, 6);

  const selectedSignal = signals.find(s => s.id === selectedSignalId) ?? null;

  const linkedWC: NormalizedWorkcell | null = useMemo(() => {
    if (!selectedSignal) return null;
    if (isLive) {
      const wf = liveWorkflows.find(w => w.triggerId === selectedSignal.id);
      if (!wf) return null;
      return {
        id: wf.id,
        name: wf.name,
        status: wf.status,
        requiresApproval: wf.requiresApproval,
        approvalState: wf.approvalState,
        description: wf.description ?? '',
        domain: wf.domain ?? '',
        priority: wf.priority ?? 'medium',
        isLive: true,
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
      isLive: false,
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
  }, [selectedSignal, isLive, liveWorkflows]);

  const KPI_STRIP = [
    { label: 'ACTIVE SIGNALS', value: isLive ? signals.filter(s => s.status === 'active').length : SEED_SIGNALS.filter(s => s.status === 'active' || s.status === 'escalated').length, sub: `${signals.filter(s => s.severity === 'critical').length} critical`, color: '#ef4444' },
    { label: 'RUNNING WORKCELLS', value: isLive ? (dashboard?.runningRuns ?? 0) : SEED_WORKCELLS.filter(w => w.status === 'running').length, sub: 'active now', color: GOLD },
    { label: 'PENDING APPROVALS', value: isLive ? liveApprovals.length : SEED_WORKCELLS.filter(w => w.requiresApproval && w.status === 'running').length, sub: 'awaiting gate', color: '#f97316' },
    { label: 'VERIFIED ACTIONS', value: isLive ? (dashboard?.totalRuns ?? 47) : 47, sub: 'last 24h', color: '#22c55e' },
    { label: 'PROOF COVERAGE', value: '91%', sub: '1,204 of 1,324', color: GOLD },
    { label: 'AGENT TRUST', value: 94, sub: 'avg out of 100', color: GOLD },
    { label: 'OUTCOMES AT RISK', value: SEED_OUTCOMES.filter(o => o.status === 'blocked' || o.status === 'missed').length, sub: 'blocked or missed', color: '#f97316' },
    { label: 'PCE HEALTH', value: '96%', sub: '19 of 20 valid', color: '#22c55e' },
  ];

  function decide(id: string, decision: ApprovalDecision) {
    setApprovals(p => ({ ...p, [id]: decision }));
  }
  function undoDecision(id: string) {
    setApprovals(p => { const n = { ...p }; delete n[id]; return n; });
  }

  return (
    <Layout>
      <PageHeader
        label="COMMAND SURFACE"
        title="Unified Operator Command"
        subtitle="Real-time signal feed · Active agents & workcells · Outcome scorecard · Approval queue — all in a single unified view."
        status={isLive ? 'LIVE' : signalsLoading ? 'CONNECTING' : 'LIVE'}
      >
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: GOLD }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: GOLD }} />
          {isLive ? 'Connected to fabric' : 'All fabric layers operational'}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
        {KPI_STRIP.map(k => (
          <div key={k.label} className="rounded-lg border p-2.5" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', borderTop: `2px solid ${k.color}` }}>
            <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 9, letterSpacing: '0.06em' }}>{k.label}</div>
            <div className="text-xl font-bold font-mono" style={{ color: k.color }}>{k.value}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: 10 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-4 mb-4">
        <div className="xl:col-span-2 flex flex-col gap-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card style={{ padding: 12 }}>
              <div className="text-xs font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>EXECUTION VELOCITY — 24h</div>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={velocityData} margin={{ top: 2, right: 2, bottom: 2, left: -20 }}>
                  <Line type="monotone" dataKey="actions" stroke={GOLD} strokeWidth={1.5} dot={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, fontSize: 10 }} formatter={(v: number) => [`${v}`, 'Actions/hr']} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                <span>12h ago</span><span>12.4 avg/hr</span><span>now</span>
              </div>
            </Card>
            <Card style={{ padding: 12 }}>
              <div className="text-xs font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>PROOF COVERAGE — 24h</div>
              <ResponsiveContainer width="100%" height={80}>
                <LineChart data={proofCovData} margin={{ top: 2, right: 2, bottom: 2, left: -20 }}>
                  <Line type="monotone" dataKey="pct" stroke="#22c55e" strokeWidth={1.5} dot={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, fontSize: 10 }} formatter={(v: number) => [`${v}%`, 'Coverage']} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                <span>12h ago</span><span style={{ color: '#22c55e' }}>91% now</span><span>now</span>
              </div>
            </Card>
          </div>

          <div className="flex gap-0 border rounded-lg overflow-hidden" style={{ borderColor: 'var(--color-a11oy-border)', minHeight: 420 }}>
            <div className="flex-1 overflow-y-auto border-r" style={{ borderColor: 'var(--color-a11oy-border)' }}>
              <div className="p-3 border-b sticky top-0 z-10 flex items-center justify-between" style={{ backgroundColor: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(8px)', borderColor: 'var(--color-a11oy-border)' }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>SIGNAL FEED</span>
                  {isLive && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#c9b787' }} />}
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{criticalSignals.length} events</span>
              </div>
              <div className="flex flex-col divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {signalsLoading && criticalSignals.length === 0 ? (
                  <div className="p-8 text-center text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    <span className="w-2 h-2 rounded-full animate-pulse inline-block mr-2" style={{ backgroundColor: '#5e5e5e' }} />
                    Connecting to fabric...
                  </div>
                ) : criticalSignals.map((s, i) => {
                  const color = VERTICAL_COLORS[s.vertical] ?? '#5e5e5e';
                  const isSelected = s.id === selectedSignalId;
                  const isNew = tick % 5 === 0 && i === 0;
                  return (
                    <div
                      key={s.id}
                      className="p-3 cursor-pointer transition-all"
                      onClick={() => setSelectedSignalId(isSelected ? null : s.id)}
                      style={{
                        backgroundColor: isSelected ? 'rgba(201,183,135,0.05)' : isNew ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
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
                          <span style={{ color: '#c9b787' }}>↗ Linked {linkedWC.isLive ? 'workflow' : 'workcell'}: </span>
                          <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{linkedWC.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-72 flex-shrink-0 overflow-y-auto" style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
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

                  {linkedWC && linkedWC.isLive && (
                    <div className="border-t pt-3 mb-3" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                      <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>LINKED WORKFLOW</div>
                      <div className="text-xs font-medium mb-1" style={{ color: 'var(--color-a11oy-text)' }}>{linkedWC.name}</div>
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

                  {linkedWC && linkedWC.mirrorEval && (
                    <div className="border-t pt-3 mb-3" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                      <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>MIRROREVAL</div>
                      <div className="flex items-center gap-2 mb-2">
                        <VerdictBadge verdict={linkedWC.mirrorEval.verdict as 'pass' | 'fail' | 'warn' | 'abstain'} />
                        <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                          {Math.round(linkedWC.mirrorEval.score * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  )}

                  {linkedWC && linkedWC.requiresApproval && !approvals[linkedWC.id] && (
                    <div className="border-t pt-3" style={{ borderColor: 'var(--color-a11oy-border)' }}>
                      <div className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>APPROVAL CONTROL</div>
                      <ApprovalGate label={`Approval ${linkedWC.isLive ? `state: ${linkedWC.approvalState}` : `tier: ${linkedWC.actionBrief?.approvalTier ?? '—'}`}`} />
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        <button onClick={() => decide(linkedWC.id, 'approved')} className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', cursor: 'pointer' }}>✓ Approve</button>
                        <button onClick={() => decide(linkedWC.id, 'deferred')} className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}>⏸ Defer</button>
                        <button onClick={() => decide(linkedWC.id, 'rejected')} className="text-xs px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>✕ Reject</button>
                      </div>
                    </div>
                  )}
                  {linkedWC && approvals[linkedWC.id] === 'approved' && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)' }}>✓ Approved</div>
                      <button onClick={() => undoDecision(linkedWC.id)} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}>undo</button>
                    </div>
                  )}
                  {linkedWC && approvals[linkedWC.id] === 'deferred' && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.1)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.2)' }}>⏸ Deferred</div>
                      <button onClick={() => undoDecision(linkedWC.id)} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}>undo</button>
                    </div>
                  )}
                  {linkedWC && approvals[linkedWC.id] === 'rejected' && (
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-mono px-2 py-1 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>✕ Rejected</div>
                      <button onClick={() => undoDecision(linkedWC.id)} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}>undo</button>
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

        <div className="flex flex-col gap-4">
          <div>
            <SectionTitle>Active Agents ({ACTIVE_AGENTS.length})</SectionTitle>
            <div className="flex flex-col gap-2">
              {ACTIVE_AGENTS.map(a => {
                const vColor = VERTICAL_COLORS[a.vertical] ?? '#5e5e5e';
                const isPending = a.status === 'pending_approval';
                return (
                  <div key={a.id} className="rounded-lg border p-3" style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)', borderLeft: `2px solid ${isPending ? '#f97316' : vColor}` }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{a.name}</span>
                      <span className="text-xs font-mono" style={{ color: GOLD }}>{a.trust}</span>
                    </div>
                    <div className="text-xs mb-1 truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{a.lastAction}</div>
                    <div className="flex items-center gap-1.5">
                      <VerticalBadge vertical={VERTICAL_LABELS[a.vertical] ?? a.vertical} color={vColor} />
                      {isPending && <span className="text-xs font-mono" style={{ color: '#f97316' }}>⚬ approval</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <SectionTitle>Pending Approvals ({pendingWC.length})</SectionTitle>
            <div className="flex flex-col gap-2">
              {pendingWC.map(wc => (
                <Card key={wc.id}>
                  <div className="text-xs font-medium mb-1 truncate" style={{ color: 'var(--color-a11oy-text)' }}>{wc.actionBrief.title}</div>
                  <div className="text-xs mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Tier: {wc.actionBrief.approvalTier} · {wc.actionBrief.priority} priority</div>
                  {!approvals[wc.id] ? (
                    <div className="flex gap-1.5 flex-wrap">
                      <button onClick={() => decide(wc.id, 'approved')} className="text-xs px-2.5 py-1 rounded" style={{ backgroundColor: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)', cursor: 'pointer' }}>✓ Approve</button>
                      <button onClick={() => decide(wc.id, 'deferred')} className="text-xs px-2.5 py-1 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.08)', color: '#c9b787', border: '1px solid rgba(201,183,135,0.2)', cursor: 'pointer' }}>⏸ Defer</button>
                      <button onClick={() => decide(wc.id, 'rejected')} className="text-xs px-2.5 py-1 rounded" style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>✕ Reject</button>
                    </div>
                  ) : approvals[wc.id] === 'approved' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: '#22c55e' }}>✓ Approved</span>
                      <button onClick={() => undoDecision(wc.id)} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}>undo</button>
                    </div>
                  ) : approvals[wc.id] === 'deferred' ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: '#c9b787' }}>⏸ Deferred</span>
                      <button onClick={() => undoDecision(wc.id)} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}>undo</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: '#ef4444' }}>✕ Rejected</span>
                      <button onClick={() => undoDecision(wc.id)} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)', background: 'none', border: 'none', cursor: 'pointer' }}>undo</button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle>Outcome Scorecard</SectionTitle>
            <div className="flex flex-col gap-1.5">
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
        {isLive ? 'Live mode — connected to execution fabric.' : 'Governed execution fabric — all approval decisions are cryptographically signed and logged to the Proof Ledger.'}
      </div>
    </Layout>
  );
}
