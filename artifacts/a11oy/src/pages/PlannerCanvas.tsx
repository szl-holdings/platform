import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ActionButton } from '../components/ui';
import { fetchJson } from './cognitive/shared';

const API_BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/a11oy\/$/, '/api').replace(/\/$/, '');

const T = {
  bg: '#0a0a0a', surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

type NodeStatus = 'pending' | 'running' | 'complete' | 'blocked';

interface PlanNode {
  id: string; label: string; agent: string; duration: string; deps: string[];
  col: number; row: number; status: NodeStatus; detail: string;
}

const DEMO_PLANS = [
  {
    id: 'maritime-risk',
    label: 'Maritime Risk Response',
    objective: 'Respond to Horizon Star ETA delay + fuel anomaly. Recommend port alternative and notify stakeholders.',
    color: '#8a8a8a',
    nodes: [
      { id: 'p1', label: 'Vessel Lookup', agent: 'Cascade Navigator', duration: '90ms', deps: [], col: 0, row: 0, status: 'pending' as NodeStatus, detail: 'Query AIS/IMO for Horizon Star current position and manifest' },
      { id: 'p2', label: 'ETA Calculation', agent: 'Cascade Navigator', duration: '210ms', deps: ['p1'], col: 1, row: 0, status: 'pending' as NodeStatus, detail: 'Route + weather + speed → ETA: 14.2h, confidence 0.94' },
      { id: 'p3', label: 'Sanctions Check', agent: 'Cascade Navigator', duration: '45ms', deps: ['p1'], col: 1, row: 1, status: 'pending' as NodeStatus, detail: 'OFAC/EU/UN screen on vessel, crew, and cargo' },
      { id: 'p4', label: 'Port Alternatives', agent: 'Cascade Navigator', duration: '380ms', deps: ['p2'], col: 2, row: 0, status: 'pending' as NodeStatus, detail: 'Score 4 alternate ports by capacity, cost, and ETA delta' },
      { id: 'p5', label: 'Fuel Diagnostics', agent: 'Pipeline Oracle', duration: '290ms', deps: ['p1'], col: 2, row: 1, status: 'pending' as NodeStatus, detail: 'Fuel consumption anomaly: 2% below baseline — minor deviation' },
      { id: 'p6', label: 'Stakeholder Brief', agent: 'Cascade Navigator', duration: '120ms', deps: ['p4', 'p5', 'p3'], col: 3, row: 0, status: 'pending' as NodeStatus, detail: 'Compose ops brief for VP-Operations and charter party' },
      { id: 'p7', label: 'Approval Gate', agent: 'Human: VP-Operations', duration: '—', deps: ['p6'], col: 4, row: 0, status: 'pending' as NodeStatus, detail: 'VP-Operations must approve port change before notification' },
    ] as PlanNode[],
  },
  {
    id: 'legal-escalation',
    label: 'Legal Matter Escalation',
    objective: 'Talbot matter — filing deadline in 48h. Opposing counsel late pattern. Prepare and file motion.',
    color: '#c9b787',
    nodes: [
      { id: 'q1', label: 'Matter Lookup', agent: 'Counsel Sentinel', duration: '60ms', deps: [], col: 0, row: 0, status: 'pending' as NodeStatus, detail: 'Pull Talbot docket, deadlines, and filing history from Clio' },
      { id: 'q2', label: 'Deadline Scan', agent: 'Counsel Sentinel', duration: '80ms', deps: ['q1'], col: 1, row: 0, status: 'pending' as NodeStatus, detail: 'Court calendar sync — 48h deadline confirmed, no extension filed' },
      { id: 'q3', label: 'Counsel Pattern', agent: 'Counsel Sentinel', duration: '140ms', deps: ['q1'], col: 1, row: 1, status: 'pending' as NodeStatus, detail: 'Opposing counsel: 3 of 5 prior cases filed late. Pattern flagged.' },
      { id: 'q4', label: 'Draft Motion', agent: 'Counsel Sentinel', duration: '1.8s', deps: ['q2', 'q3'], col: 2, row: 0, status: 'pending' as NodeStatus, detail: 'Draft motion to compel with late-filing precedent citations' },
      { id: 'q5', label: 'Partner Alert', agent: 'Counsel Sentinel', duration: '40ms', deps: ['q2'], col: 2, row: 1, status: 'pending' as NodeStatus, detail: 'Notify managing partner via Slack — deadline < 72h policy triggered' },
      { id: 'q6', label: 'Calendar Block', agent: 'Counsel Sentinel', duration: '30ms', deps: ['q2'], col: 2, row: 2, status: 'pending' as NodeStatus, detail: 'Block 4h review session for partner + associate' },
      { id: 'q7', label: 'Approval Gate', agent: 'Human: Managing Partner', duration: '—', deps: ['q4', 'q5'], col: 3, row: 0, status: 'pending' as NodeStatus, detail: 'Managing partner reviews and approves motion before filing' },
    ] as PlanNode[],
  },
  {
    id: 'cyber-incident',
    label: 'Cyber Incident Response',
    objective: 'TG-Ember C2 on 8080. Contain, investigate, report, and harden.',
    color: '#f5f5f5',
    nodes: [
      { id: 'r1', label: 'IOC Match', agent: 'Guardian', duration: '35ms', deps: [], col: 0, row: 0, status: 'pending' as NodeStatus, detail: 'STIX match: TG-Ember C2 fingerprint confirmed on port 8080' },
      { id: 'r2', label: 'Host Isolation', agent: 'Guardian', duration: '890ms', deps: ['r1'], col: 1, row: 0, status: 'pending' as NodeStatus, detail: 'Network isolation applied to 3 affected hosts — EDR API call' },
      { id: 'r3', label: 'YARA Deploy', agent: 'Guardian', duration: '340ms', deps: ['r1'], col: 1, row: 1, status: 'pending' as NodeStatus, detail: 'Push TG-Ember YARA rules to all 248 endpoints' },
      { id: 'r4', label: 'IOC Block', agent: 'Guardian', duration: '120ms', deps: ['r1'], col: 1, row: 2, status: 'pending' as NodeStatus, detail: 'Block C2 IPs at perimeter + DNS-over-HTTPS IOC list updated' },
      { id: 'r5', label: 'Forensic Snapshot', agent: 'Guardian', duration: '2.1s', deps: ['r2'], col: 2, row: 0, status: 'pending' as NodeStatus, detail: 'Memory and disk snapshots captured for forensic analysis' },
      { id: 'r6', label: 'CISO Alert', agent: 'Guardian', duration: '20ms', deps: ['r2', 'r3'], col: 2, row: 1, status: 'pending' as NodeStatus, detail: 'Executive alert sent: TG-Ember confirmed, 3 hosts isolated' },
      { id: 'r7', label: 'Incident Report', agent: 'Guardian', duration: '1.2s', deps: ['r5', 'r6', 'r4'], col: 3, row: 0, status: 'pending' as NodeStatus, detail: 'Draft IR with TTPs, timeline, IOCs, and remediation steps' },
    ] as PlanNode[],
  },
  {
    id: 'revenue-recovery',
    label: 'Revenue Recovery Plan',
    objective: 'Pipeline velocity -22%. Diagnose, surface interventions, adjust forecast.',
    color: '#b08d52',
    nodes: [
      { id: 's1', label: 'CRM Pull', agent: 'Pipeline Oracle', duration: '280ms', deps: [], col: 0, row: 0, status: 'pending' as NodeStatus, detail: 'Pull all Q2 deals from Salesforce — stage, age, owner' },
      { id: 's2', label: 'Stage Analysis', agent: 'Pipeline Oracle', duration: '640ms', deps: ['s1'], col: 1, row: 0, status: 'pending' as NodeStatus, detail: 'Velocity drop concentrated in Proposal → Negotiation stage' },
      { id: 's3', label: 'Call Sentiment', agent: 'Pipeline Oracle', duration: '1.1s', deps: ['s1'], col: 1, row: 1, status: 'pending' as NodeStatus, detail: 'Gong sentiment: competitor mentions +38%, objection rate +22%' },
      { id: 's4', label: 'Churn Risk Score', agent: 'Pipeline Oracle', duration: '420ms', deps: ['s1'], col: 1, row: 2, status: 'pending' as NodeStatus, detail: 'Top 5 accounts at churn risk — ML score >0.7' },
      { id: 's5', label: 'Intervention Model', agent: 'Pipeline Oracle + MirrorEval', duration: '1.8s', deps: ['s2', 's3'], col: 2, row: 0, status: 'pending' as NodeStatus, detail: 'Score 8 intervention options — coaching ranked #1, +18% win rate' },
      { id: 's6', label: 'Forecast Adj.', agent: 'Pipeline Oracle', duration: '180ms', deps: ['s2', 's4'], col: 2, row: 1, status: 'pending' as NodeStatus, detail: 'Q2 forecast adjusted: -$2.1M. CFO notification triggered (>15% delta).' },
      { id: 's7', label: 'Exec Brief', agent: 'Pipeline Oracle', duration: '240ms', deps: ['s5', 's6'], col: 3, row: 0, status: 'pending' as NodeStatus, detail: 'Board-ready brief: diagnosis, interventions, adjusted forecast' },
    ] as PlanNode[],
  },
];

const STATUS_COLORS: Record<NodeStatus, string> = {
  pending: 'rgba(255,255,255,0.08)', running: '#c9b787', complete: '#8a8a8a', blocked: '#f5f5f5',
};

export function PlannerCanvas() {
  const [selectedPlan, setSelectedPlan] = useState(DEMO_PLANS[0].id);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, NodeStatus>>({});
  const [playing, setPlaying] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [planLocked, setPlanLocked] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [showDecisionCard, setShowDecisionCard] = useState(false);

  const plan = DEMO_PLANS.find(p => p.id === selectedPlan)!;

  function reset() {
    setNodeStatuses({});
    setStepIdx(-1);
    setPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }

  function selectPlan(id: string) {
    setSelectedPlan(id);
    reset();
    setSelectedNode(null);
  }

  function play() {
    if (playing) { setPlaying(false); if (intervalRef.current) clearInterval(intervalRef.current); return; }
    setPlaying(true);
    const executionOrder = plan.nodes.map(n => n.id);
    let idx = stepIdx + 1;
    if (idx >= executionOrder.length) { idx = 0; setNodeStatuses({}); }

    const tick = () => {
      const nodeId = executionOrder[idx];
      setStepIdx(idx);
      setNodeStatuses(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { if (next[k] === 'running') next[k] = 'complete'; });
        next[nodeId] = 'running';
        return next;
      });
      idx++;
      if (idx >= executionOrder.length) {
        setTimeout(() => {
          setNodeStatuses(prev => { const n = { ...prev }; Object.keys(n).forEach(k => { if (n[k] === 'running') n[k] = 'complete'; }); return n; });
        }, 700);
        setPlaying(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
  }

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const cols = Math.max(...plan.nodes.map(n => n.col)) + 1;
  const rows = Math.max(...plan.nodes.map(n => n.row)) + 1;

  const selectedNodeData = selectedNode ? plan.nodes.find(n => n.id === selectedNode) : null;

  async function signAndLock() {
    setLockLoading(true);
    try {
      const agents = [...new Set(plan.nodes.map(n => n.agent))];
      const createJson = await fetchJson<{ ok: boolean; data: { plan_id: string }; error?: string }>(
        `${API_BASE}/a11oy/plans`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: plan.label,
            objective: plan.objective,
            agent_id: agents[0] ?? 'operator',
            trust_tier: 3,
            decision_card: {
              signal: plan.label,
              context: plan.objective,
              recommendation: `Execute ${plan.nodes.length}-step plan via ${agents.join(', ')}`,
              simulation: 'Pre-lock simulation: no side-effecting steps unblocked until signed',
            },
          }),
        },
      );
      if (!createJson.ok) throw new Error(createJson.error ?? 'Plan creation failed');

      const planId: string = createJson.data.plan_id;

      const signJson = await fetchJson<{ ok: boolean; error?: string }>(
        `${API_BASE}/a11oy/plans/${planId}/sign`,
        { method: 'POST', body: JSON.stringify({ signed_by: 'operator' }) },
      );
      if (!signJson.ok) throw new Error(signJson.error ?? 'Plan signing failed');

      setPlanLocked(true);
    } catch {
      // Sign failed — leave unlocked so the user can retry
    } finally {
      setLockLoading(false);
    }
  }

  return (
    <Layout>
      <PageHeader
        label="PLANNER CANVAS"
        title="Plan Decomposition DAG"
        subtitle="Objectives decompose into animated dependency graphs. Agents assigned to nodes, resource estimates shown, step-through controls for operator review."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <KpiCard label="DEMO PLANS" value={DEMO_PLANS.length} sub="pre-built" accent={T.accent} />
        <KpiCard label="MAX NODES" value={Math.max(...DEMO_PLANS.map(p => p.nodes.length))} sub="per plan" accent={T.accent} />
        <KpiCard label="PARALLEL PATHS" value="up to 3" sub="concurrent" accent={T.accent} />
        <KpiCard label={planLocked ? 'PLAN LOCKED' : 'PLAN STATUS'} value={planLocked ? 'LOCKED' : 'DRAFT'} sub={planLocked ? 'signed & proof-chained' : 'awaiting sign-off'} accent={planLocked ? '#c9b787' : T.dim} />
      </div>

      {/* Plan selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {DEMO_PLANS.map(p => (
          <button
            key={p.id}
            onClick={() => { selectPlan(p.id); setPlanLocked(false); setShowDecisionCard(false); }}
            className="px-4 py-2 rounded-lg text-xs font-mono transition-all"
            style={{
              background: selectedPlan === p.id ? `${p.color}18` : T.surface,
              border: `1px solid ${selectedPlan === p.id ? p.color + '40' : T.border}`,
              color: selectedPlan === p.id ? p.color : T.dim,
              cursor: 'pointer',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Plan Lock affordance */}
      <div className="mb-4 p-3 rounded-lg" style={{ background: 'rgba(201,183,135,0.04)', border: `1px solid ${planLocked ? 'rgba(201,183,135,0.25)' : T.border}` }}>
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-[9px] font-mono uppercase tracking-widest" style={{ color: T.muted }}>PLAN LOCK</div>
              {planLocked && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.12)', color: '#c9b787' }}>
                  ◆ SIGNED & LOCKED · proof-plan-{plan.id.slice(0, 8)}
                </span>
              )}
            </div>
            <div className="text-xs" style={{ color: T.dim }}>
              {planLocked
                ? 'Plan is signed and locked. Side-effecting tools are unblocked. Promote to Workcell when ready.'
                : 'Sign and lock this plan before promoting to Workcell. Hooks will block side-effecting tools until signed.'}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {!planLocked ? (
              <button
                type="button"
                onClick={signAndLock}
                disabled={lockLoading}
                className="text-xs px-3 py-1.5 rounded font-mono transition-colors"
                style={{
                  backgroundColor: lockLoading ? 'rgba(201,183,135,0.08)' : 'rgba(201,183,135,0.15)',
                  color: lockLoading ? T.muted : '#c9b787',
                  border: '1px solid rgba(201,183,135,0.3)',
                  cursor: lockLoading ? 'wait' : 'pointer',
                }}
              >
                {lockLoading ? 'SIGNING…' : '◆ SIGN & LOCK PLAN'}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setPlanLocked(false); setShowDecisionCard(false); }}
                className="text-xs px-3 py-1.5 rounded font-mono"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: T.muted, border: `1px solid ${T.border}` }}
              >
                UNLOCK (re-draft)
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowDecisionCard(p => !p)}
              className="text-xs px-3 py-1.5 rounded font-mono"
              style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: T.dim, border: `1px solid ${T.border}` }}
            >
              {showDecisionCard ? 'HIDE CARD' : 'DECISION CARD'}
            </button>
          </div>
        </div>

        {showDecisionCard && (
          <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-3" style={{ borderColor: T.border }}>
            {[
              { label: 'SIGNAL', value: plan.label, desc: 'Triggering signal / objective' },
              { label: 'CONTEXT', value: plan.objective, desc: 'Situational context' },
              { label: 'RECOMMENDATION', value: `Execute ${plan.nodes.length}-step plan via ${[...new Set(plan.nodes.map(n => n.agent))].join(', ')}`, desc: 'Agent recommendation' },
              { label: 'SIMULATION', value: planLocked ? 'Plan locked — no simulation drift possible' : 'Plan in draft — simulation available pre-lock', desc: 'Pre-lock simulation result' },
            ].map(({ label, value, desc }) => (
              <div key={label} className="p-2 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
                <div className="text-[10px] font-mono mb-0.5" style={{ color: T.muted }}>{label}</div>
                <div className="text-[11px] font-medium mb-0.5 leading-snug" style={{ color: T.text }}>{value}</div>
                <div className="text-[10px]" style={{ color: T.muted }}>{desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4 p-3 rounded-lg flex items-start gap-4" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex-1">
          <div className="text-[9px] font-mono uppercase tracking-widest mb-1" style={{ color: T.muted }}>OBJECTIVE</div>
          <p className="text-sm" style={{ color: T.text }}>{plan.objective}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <ActionButton variant="primary" size="sm" onClick={play} disabled={!planLocked || playing}>
            {playing ? '⏸ Pause' : stepIdx < 0 ? '▶ Execute' : '▶ Continue'}
          </ActionButton>
          <ActionButton variant="ghost" size="sm" onClick={reset}>Reset</ActionButton>
        </div>
        {!planLocked && (
          <div className="text-[10px] font-mono self-center" style={{ color: T.muted }}>Lock plan to execute</div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* DAG visualization */}
        <div className="lg:col-span-2">
          <div className="rounded-lg overflow-hidden" style={{ background: '#050505', border: `1px solid ${T.border}` }}>
            <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${T.border}` }}>
              <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: T.muted }}>Plan DAG — {plan.nodes.length} nodes</span>
              {playing && <span className="ml-auto w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: plan.color }} />}
            </div>
            <div className="p-6 overflow-x-auto">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${cols}, 160px)`,
                  gridTemplateRows: `repeat(${rows}, 80px)`,
                  gap: '12px',
                  position: 'relative',
                  minWidth: cols * 172,
                }}
              >
                {plan.nodes.map(node => {
                  const status = nodeStatuses[node.id] ?? 'pending';
                  const sc = status === 'running' ? plan.color : status === 'complete' ? T.dim : status === 'blocked' ? '#f5f5f5' : T.border;
                  const isSelected = node.id === selectedNode;
                  return (
                    <motion.button
                      key={node.id}
                      onClick={() => setSelectedNode(isSelected ? null : node.id)}
                      style={{
                        gridColumn: node.col + 1,
                        gridRow: node.row + 1,
                        background: status === 'running' ? `${plan.color}18` : status === 'complete' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${isSelected ? plan.color : sc}`,
                        borderRadius: 8,
                        padding: '8px 10px',
                        textAlign: 'left',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      animate={{ scale: status === 'running' ? [1, 1.02, 1] : 1 }}
                      transition={{ duration: 0.6, repeat: status === 'running' ? Infinity : 0 }}
                    >
                      <div className="text-[10px] font-medium mb-0.5" style={{ color: status === 'running' ? plan.color : status === 'complete' ? T.dim : T.muted }}>
                        {status === 'complete' ? '✓ ' : status === 'running' ? '⟳ ' : ''}{node.label}
                      </div>
                      <div className="text-[9px]" style={{ color: T.muted }}>{node.agent.slice(0, 22)}</div>
                      <div className="text-[9px] font-mono mt-1" style={{ color: status === 'running' ? plan.color : T.muted }}>{node.duration}</div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="mt-4 text-[9px] font-mono flex items-center gap-4" style={{ color: T.muted }}>
                <span>← Dependencies flow left to right</span>
                <span>Click a node for details →</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {selectedNodeData ? (
              <motion.div key={selectedNodeData.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>NODE DETAIL</div>
                  <div className="text-sm font-medium mb-1" style={{ color: T.text }}>{selectedNodeData.label}</div>
                  <div className="text-[10px] mb-3" style={{ color: T.dim }}>{selectedNodeData.detail}</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div><div style={{ color: T.muted }}>Agent</div><div style={{ color: T.accent }}>{selectedNodeData.agent}</div></div>
                    <div><div style={{ color: T.muted }}>Duration</div><div style={{ color: T.text }}>{selectedNodeData.duration}</div></div>
                    <div><div style={{ color: T.muted }}>Status</div><div style={{ color: STATUS_COLORS[nodeStatuses[selectedNodeData.id] ?? 'pending'] }}>{nodeStatuses[selectedNodeData.id] ?? 'pending'}</div></div>
                    <div><div style={{ color: T.muted }}>Deps</div><div style={{ color: T.dim }}>{selectedNodeData.deps.length || 'none'}</div></div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <Card>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-2" style={{ color: T.muted }}>PLAN SUMMARY</div>
                <div className="flex flex-col gap-2">
                  {plan.nodes.map(n => {
                    const status = nodeStatuses[n.id] ?? 'pending';
                    return (
                      <div key={n.id} className="flex items-center gap-2 text-[10px]">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: status === 'running' ? plan.color : status === 'complete' ? T.dim : T.border }} />
                        <span style={{ color: status === 'complete' ? T.dim : T.muted }}>{n.label}</span>
                        <span className="ml-auto font-mono" style={{ color: T.muted }}>{n.duration}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </AnimatePresence>

          <Card>
            <SectionTitle>Agent Assignments</SectionTitle>
            <div className="flex flex-col gap-1.5">
              {Array.from(new Set(plan.nodes.map(n => n.agent))).map(agent => {
                const count = plan.nodes.filter(n => n.agent === agent).length;
                return (
                  <div key={agent} className="flex items-center justify-between text-[10px]">
                    <span style={{ color: T.dim }}>{agent}</span>
                    <span className="font-mono" style={{ color: plan.color }}>{count} task{count > 1 ? 's' : ''}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
