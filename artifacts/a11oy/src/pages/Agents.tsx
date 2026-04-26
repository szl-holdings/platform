import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ProgressBar } from '../components/ui';
import { SEED_WORKCELLS } from '@workspace/a11oy-fabric';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const GOLD = '#c9b787';

const RISK_LEVELS = ['Critical', 'High', 'Medium', 'Low'] as const;
const RISK_COLORS: Record<string, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#c9b787',
  Low: '#22c55e',
};

const AGENTS = [
  {
    id: 'op-cascade',
    name: 'Cascade Navigator',
    role: 'Domain Specialist — Vessels Maritime',
    vertical: 'vessels-maritime',
    type: 'domain-specialist',
    status: 'active',
    trustScore: 97,
    riskClassification: 'High' as const,
    model: 'gpt-4o → claude-3.5-sonnet',
    humanOwner: { name: 'Sarah Chen', title: 'VP Operations', initials: 'SC' },
    tasksToday: 12,
    pendingTasks: 3,
    avgLatencyMs: 840,
    costPerCallUSD: 0.012,
    permissions: {
      read: ['AIS vessel data', 'Port authority API', 'Voyage plans', 'Demurrage contracts'],
      write: ['Voyage plan updates', 'Port standby requests'],
      execute: ['ETA calculation', 'Route optimization', 'Cost analysis'],
      approve: [],
    },
    assignedTools: ['api-caller', 'data-analyzer', 'risk-scorer', 'evidence-packager'],
    skills: ['ETA Monitoring', 'Port Cost Analysis', 'Demurrage Calc', 'Route Optimization'],
    lastAction: 'Recommended port standby — awaiting VP approval',
    activityTimeline: [
      { time: '10:30', action: 'ETA recalculated — 18h delay detected' },
      { time: '10:32', action: 'Port standby cost analysis completed' },
      { time: '10:34', action: 'Action brief submitted for VP approval' },
      { time: '08:15', action: 'Route optimization run — 3 alternatives evaluated' },
    ],
    perfHistory: [88, 91, 89, 94, 92, 95, 97],
    evalDimensions: { groundedness: 0.96, actionSafety: 0.94, policyCompliance: 0.98, hallucinationRisk: 0.97, proofCompleteness: 0.95 },
  },
  {
    id: 'op-counsel',
    name: 'Counsel Sentinel',
    role: 'Domain Specialist — Prism Counsel',
    vertical: 'prism-counsel',
    type: 'domain-specialist',
    status: 'active',
    trustScore: 99,
    riskClassification: 'Critical' as const,
    model: 'claude-3.5-sonnet',
    humanOwner: { name: 'Patricia Mwangi', title: 'General Counsel', initials: 'PM' },
    tasksToday: 8,
    pendingTasks: 2,
    avgLatencyMs: 640,
    costPerCallUSD: 0.008,
    permissions: {
      read: ['Matter records', 'Deadline calendars', 'Document repositories', 'Client communications'],
      write: ['Matter status updates', 'Task assignments'],
      execute: ['Deadline analysis', 'Risk scoring', 'Document review'],
      approve: [],
    },
    assignedTools: ['document-reader', 'risk-scorer', 'evidence-packager', 'approval-gateway'],
    skills: ['Deadline Tracking', 'Document Status', 'Matter Monitoring', 'Risk Scoring'],
    lastAction: 'Flagged Talbot discovery risk — escalation requested',
    activityTimeline: [
      { time: '08:00', action: 'Talbot discovery deadline T-48h alert generated' },
      { time: '08:05', action: 'Document gap analysis: 340 items outstanding' },
      { time: '08:10', action: 'Escalation to General Counsel submitted' },
      { time: '06:30', action: 'Daily matter health check completed' },
    ],
    perfHistory: [96, 97, 98, 97, 99, 98, 99],
    evalDimensions: { groundedness: 0.99, actionSafety: 0.98, policyCompliance: 0.99, hallucinationRisk: 0.99, proofCompleteness: 0.98 },
  },
  {
    id: 'op-pipeline',
    name: 'Pipeline Oracle',
    role: 'Domain Specialist — KORA Revenue',
    vertical: 'lyte-revenue',
    type: 'domain-specialist',
    status: 'active',
    trustScore: 91,
    riskClassification: 'Medium' as const,
    model: 'gpt-4o',
    humanOwner: { name: 'James Okafor', title: 'VP Revenue', initials: 'JO' },
    tasksToday: 21,
    pendingTasks: 4,
    avgLatencyMs: 820,
    costPerCallUSD: 0.015,
    permissions: {
      read: ['CRM opportunities', 'Pipeline data', 'Customer health scores', 'Engagement metrics'],
      write: ['CRM activity updates', 'Opportunity stage changes'],
      execute: ['Pipeline analysis', 'Deal scoring', 'Forecast modeling', 'Churn prediction'],
      approve: [],
    },
    assignedTools: ['crm-query', 'data-analyzer', 'risk-scorer', 'email-sender'],
    skills: ['Pipeline Analysis', 'Deal Scoring', 'Forecast Modeling', 'CRM Monitoring'],
    lastAction: 'Identified 3 at-risk accounts — executive outreach recommended',
    activityTimeline: [
      { time: '09:15', action: 'Churn risk model ran — 3 accounts flagged ≥85%' },
      { time: '09:20', action: 'Executive outreach brief prepared' },
      { time: '09:25', action: 'Action submitted for VP Revenue approval' },
      { time: '07:00', action: 'Daily pipeline velocity report generated' },
    ],
    perfHistory: [82, 85, 88, 86, 90, 89, 91],
    evalDimensions: { groundedness: 0.90, actionSafety: 0.92, policyCompliance: 0.94, hallucinationRisk: 0.88, proofCompleteness: 0.91 },
  },
  {
    id: 'op-guardian',
    name: 'Guardian',
    role: 'Domain Specialist — Aegis Defense',
    vertical: 'aegis-defense',
    type: 'domain-specialist',
    status: 'active',
    trustScore: 99,
    riskClassification: 'Critical' as const,
    model: 'claude-3.5-sonnet (air-gapped)',
    humanOwner: { name: 'Marcus Steel', title: 'CISO', initials: 'MS' },
    tasksToday: 6,
    pendingTasks: 1,
    avgLatencyMs: 980,
    costPerCallUSD: 0.009,
    permissions: {
      read: ['Threat intelligence feeds', 'SIEM events', 'Firewall logs', 'Vulnerability scans'],
      write: ['Threat registry updates', 'Firewall rule proposals'],
      execute: ['Threat analysis', 'Posture assessment', 'Incident triage', 'Perimeter hardening'],
      approve: ['Tier escalations up to HIGH'],
    },
    assignedTools: ['api-caller', 'risk-scorer', 'evidence-packager', 'proof-issuer'],
    skills: ['Threat Intelligence', 'Posture Assessment', 'Incident Triage', 'Perimeter Hardening'],
    lastAction: 'TG-Ember escalated to ORANGE — perimeter hardened automatically',
    activityTimeline: [
      { time: '18:55', action: 'TG-Ember threat actor elevated to ORANGE' },
      { time: '18:55', action: '14 new firewall block rules applied automatically' },
      { time: '18:56', action: 'CISO notified — perimeter scan initiated' },
      { time: '18:56', action: 'Verification complete — surface reduced 22%' },
    ],
    perfHistory: [95, 97, 98, 97, 99, 98, 99],
    evalDimensions: { groundedness: 0.99, actionSafety: 0.99, policyCompliance: 0.99, hallucinationRisk: 0.99, proofCompleteness: 0.98 },
  },
  {
    id: 'op-terra',
    name: 'DOMAINE Analyst',
    role: 'Domain Specialist — Terra Real Estate',
    vertical: 'terra-real-estate',
    type: 'domain-specialist',
    status: 'active',
    trustScore: 88,
    riskClassification: 'Medium' as const,
    model: 'gpt-4o',
    humanOwner: { name: 'Elena Vasquez', title: 'Portfolio Manager', initials: 'EV' },
    tasksToday: 9,
    pendingTasks: 0,
    avgLatencyMs: 760,
    costPerCallUSD: 0.011,
    permissions: {
      read: ['CoStar data', 'Portfolio holdings', 'Valuation models', 'Market comps'],
      write: ['Valuation model updates', 'LOI draft proposals'],
      execute: ['Cap rate analysis', 'Portfolio valuation', 'Comp analysis', 'Risk modeling'],
      approve: [],
    },
    assignedTools: ['api-caller', 'data-analyzer', 'pdf-generator', 'evidence-packager'],
    skills: ['Cap Rate Tracking', 'Portfolio Analysis', 'Valuation Modeling', 'Comp Analysis'],
    lastAction: 'Cap rate compression signal — Westfield portfolio valuation updated',
    activityTimeline: [
      { time: '16:40', action: 'Cap rate compression signal detected — 28bps shift' },
      { time: '16:42', action: 'Westfield portfolio valuation model updated' },
      { time: '16:45', action: 'LOI analysis prepared — Tier Omega property' },
      { time: '14:00', action: 'Daily portfolio health check completed' },
    ],
    perfHistory: [80, 83, 85, 84, 87, 86, 88],
    evalDimensions: { groundedness: 0.88, actionSafety: 0.90, policyCompliance: 0.89, hallucinationRisk: 0.87, proofCompleteness: 0.88 },
  },
  {
    id: 'op-watchdog',
    name: 'Fabric Watchdog',
    role: 'System Agent — A11oy Core',
    vertical: 'alloy-core',
    type: 'system',
    status: 'active',
    trustScore: 100,
    riskClassification: 'Low' as const,
    model: 'internal',
    humanOwner: { name: 'Platform Team', title: 'Engineering', initials: 'PT' },
    tasksToday: 144,
    pendingTasks: 0,
    avgLatencyMs: 12,
    costPerCallUSD: 0,
    permissions: {
      read: ['All fabric layer metrics', 'Health endpoints', 'Proof ledger hashes', 'Layer latencies'],
      write: [],
      execute: ['Health probes', 'Proof verification', 'Layer monitoring', 'Latency tracking'],
      approve: [],
    },
    assignedTools: ['api-caller', 'proof-issuer', 'mirror-eval-runner'],
    skills: ['Mesh Health', 'Layer Monitoring', 'Proof Verification', 'Latency Tracking'],
    lastAction: 'All 7 fabric layers nominal — scheduled verification complete',
    activityTimeline: [
      { time: '10:00', action: 'Layer health check — all 7 nominal' },
      { time: '09:00', action: 'Proof ledger integrity verified — 0 anomalies' },
      { time: '08:00', action: 'Layer health check — all 7 nominal' },
      { time: '07:00', action: 'Daily latency baseline established' },
    ],
    perfHistory: [100, 100, 100, 100, 100, 100, 100],
    evalDimensions: { groundedness: 1.0, actionSafety: 1.0, policyCompliance: 1.0, hallucinationRisk: 1.0, proofCompleteness: 1.0 },
  },
>>>>>>> ba6182151 (feat(a11oy): frontier agentic command surface — 8 enhanced modules + 3 new pages)
];

const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#c9b787', 'vessels-maritime': '#8a8a8a', 'terra-real-estate': '#c9b787',
  'aegis-defense': '#f5f5f5', 'prism-counsel': '#8a8a8a', 'carlota-jo': '#c9b787', 'alloy-core': '#5e5e5e',
};

const EVAL_DIMS = ['groundedness', 'actionSafety', 'policyCompliance', 'hallucinationRisk', 'proofCompleteness'];
const EVAL_LABELS: Record<string, string> = {
  groundedness: 'Grounded', actionSafety: 'Action Safety', policyCompliance: 'Policy', hallucinationRisk: 'Hallucination', proofCompleteness: 'Proof',
};

function AgentRadar({ dims }: { dims: Record<string, number> }) {
  const data = EVAL_DIMS.map(d => ({ dimension: EVAL_LABELS[d], score: Math.round(dims[d] * 100) }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <RadarChart data={data} margin={{ top: 8, right: 20, bottom: 8, left: 20 }}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: '#5e5e5e', fontSize: 9, fontFamily: 'ui-monospace, monospace' }} />
        <Radar dataKey="score" stroke={GOLD} fill={GOLD} fillOpacity={0.15} strokeWidth={1.5} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <Line type="monotone" dataKey="v" stroke={GOLD} strokeWidth={1.5} dot={false} />
        <Tooltip
          contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, fontSize: 10 }}
          formatter={(v: number) => [`${v}`, 'Trust']}
          labelFormatter={() => ''}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function PermissionBadge({ type, items }: { type: string; items: string[] }) {
  const colors: Record<string, string> = { read: '#8a8a8a', write: '#c9b787', execute: '#b08d52', approve: '#f97316' };
  const color = colors[type] ?? '#5e5e5e';
  if (items.length === 0) return null;
  return (
    <div className="mb-2">
      <div className="text-xs font-mono mb-1" style={{ color }}>
        {type.toUpperCase()} ({items.length})
      </div>
      <div className="flex flex-wrap gap-1">
        {items.map(item => (
          <span key={item} className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: `${color}10`, color, border: `1px solid ${color}20` }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Agents() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState('All');
  const [filterType, setFilterType] = useState('All');

  const filtered = AGENTS.filter(a =>
    (filterRisk === 'All' || a.riskClassification === filterRisk) &&
    (filterType === 'All' || a.type === filterType)
  );

  const selected = AGENTS.find(a => a.id === selectedId);
  const activeWC = SEED_WORKCELLS.filter(w => w.status === 'running');

  return (
    <Layout>
      <PageHeader
        label="AGENT REGISTRY"
        title="Operator Agent Registry"
        subtitle="Full registry of every agent with explicit permissions, assigned tools, risk classification, human ownership, and live performance tracking."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="REGISTERED AGENTS" value={AGENTS.length} sub="all active" accent={GOLD} />
        <KpiCard label="CRITICAL RISK" value={AGENTS.filter(a => a.riskClassification === 'Critical').length} sub="highest oversight" accent="#ef4444" />
        <KpiCard label="HIGH RISK" value={AGENTS.filter(a => a.riskClassification === 'High').length} sub="human approval required" accent="#f97316" />
        <KpiCard label="AVG TRUST" value={Math.round(AGENTS.reduce((a, o) => a + o.trustScore, 0) / AGENTS.length)} sub="out of 100" accent={GOLD} />
        <KpiCard label="TASKS TODAY" value={AGENTS.reduce((a, o) => a + o.tasksToday, 0)} sub="across all agents" accent={GOLD} />
        <KpiCard label="ACTIVE WORKCELLS" value={activeWC.length} sub="running now" accent={GOLD} />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {['All', ...RISK_LEVELS].map(r => (
          <button
            key={r}
            onClick={() => setFilterRisk(r)}
            className="text-xs px-2.5 py-1 rounded font-mono"
            style={{
              backgroundColor: filterRisk === r ? `${RISK_COLORS[r] ?? GOLD}18` : 'var(--color-a11oy-muted)',
              color: filterRisk === r ? (RISK_COLORS[r] ?? GOLD) : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${filterRisk === r ? (RISK_COLORS[r] ?? GOLD) + '30' : 'transparent'}`,
              cursor: 'pointer',
            }}
          >
            {r}
          </button>
        ))}
        {['All', 'domain-specialist', 'system'].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className="text-xs px-2.5 py-1 rounded font-mono"
            style={{
              backgroundColor: filterType === t ? 'rgba(201,183,135,0.12)' : 'var(--color-a11oy-muted)',
              color: filterType === t ? GOLD : 'var(--color-a11oy-text-ghost)',
              border: `1px solid ${filterType === t ? 'rgba(201,183,135,0.25)' : 'transparent'}`,
              cursor: 'pointer',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionTitle>Agent Registry ({filtered.length})</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-4">
            {filtered.map(agent => {
              const riskColor = RISK_COLORS[agent.riskClassification];
              const vertColor = VERTICAL_COLORS[agent.vertical] ?? '#5e5e5e';
              const isSelected = selectedId === agent.id;

              return (
                <div
                  key={agent.id}
                  className="rounded-xl border cursor-pointer transition-all p-4"
                  onClick={() => setSelectedId(isSelected ? null : agent.id)}
                  style={{
                    backgroundColor: isSelected ? 'rgba(201,183,135,0.03)' : 'var(--color-a11oy-card)',
                    borderColor: isSelected ? GOLD : 'var(--color-a11oy-border)',
                    borderLeft: `3px solid ${riskColor}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="text-sm font-semibold mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{agent.name}</div>
                      <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{agent.role}</div>
                    </div>
                    <span className="text-xs font-mono px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: `${riskColor}15`, color: riskColor, border: `1px solid ${riskColor}30` }}>
                      {agent.riskClassification}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${vertColor}18`, color: vertColor, border: `1px solid ${vertColor}30`, fontSize: 8 }}>
                        {agent.humanOwner.initials}
                      </div>
                      <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>{agent.humanOwner.name}</div>
                    </div>
                    <span className="font-mono" style={{ color: GOLD }}>Trust: {agent.trustScore}</span>
                  </div>

                  <div className="mb-3">
                    <Sparkline data={agent.perfHistory} />
                    <div className="text-xs text-right" style={{ color: 'var(--color-a11oy-text-ghost)' }}>7-day trust trend</div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {agent.assignedTools.map(t => (
                      <span key={t} className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className="text-xs border-t pt-2 mt-2" style={{ borderColor: 'var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)' }}>
                    <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{agent.lastAction.slice(0, 58)}{agent.lastAction.length > 58 ? '…' : ''}</span>
                  </div>

                  <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    <span>{agent.tasksToday} tasks today</span>
                    <span>{agent.avgLatencyMs}ms avg</span>
                    {agent.costPerCallUSD > 0 && <span>${agent.costPerCallUSD.toFixed(3)}/call</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {selected ? (
            <Card>
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>AGENT DETAIL</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: `${RISK_COLORS[selected.riskClassification]}18`, color: RISK_COLORS[selected.riskClassification] }}>
                  {selected.humanOwner.initials}
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{selected.name}</div>
                  <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Owner: {selected.humanOwner.name} · {selected.humanOwner.title}</div>
                </div>
              </div>

              <div className="text-xs mt-2 mb-3 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Model: {selected.model}</div>

              <div className="mb-3">
                <div className="text-xs font-mono mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>EXPLICIT PERMISSIONS</div>
                <PermissionBadge type="read" items={selected.permissions.read} />
                <PermissionBadge type="write" items={selected.permissions.write} />
                <PermissionBadge type="execute" items={selected.permissions.execute} />
                {selected.permissions.approve.length > 0 && <PermissionBadge type="approve" items={selected.permissions.approve} />}
              </div>

              <div className="mb-3">
                <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>EVAL RADAR (5 dimensions)</div>
                <AgentRadar dims={selected.evalDimensions} />
              </div>

              <div className="mb-3">
                <div className="text-xs font-mono mb-1.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>ACTIVITY TIMELINE</div>
                <div className="space-y-2">
                  {selected.activityTimeline.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="font-mono flex-shrink-0" style={{ color: GOLD }}>{ev.time}</span>
                      <span style={{ color: 'var(--color-a11oy-text-sub)' }}>{ev.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs p-2.5 rounded" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
                All material actions from this agent require human approval by <span style={{ color: GOLD }}>{selected.humanOwner.name}</span>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>RISK DISTRIBUTION</div>
              {RISK_LEVELS.map(r => {
                const count = AGENTS.filter(a => a.riskClassification === r).length;
                const pct = (count / AGENTS.length) * 100;
                return (
                  <div key={r} className="mb-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: RISK_COLORS[r] }}>{r}</span>
                      <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{count}</span>
                    </div>
                    <ProgressBar value={count} max={AGENTS.length} color={RISK_COLORS[r]} />
                  </div>
                );
              })}
              <div className="mt-4 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                Select an agent to view full permissions, radar scores, and activity timeline.
              </div>
            </Card>
          )}

          <div>
            <SectionTitle>Trust Scores</SectionTitle>
            <div className="flex flex-col gap-2">
              {AGENTS.map(a => (
                <div key={a.id} className="flex items-center gap-3 text-xs">
                  <span className="truncate flex-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{a.name}</span>
                  <ProgressBar value={a.trustScore} max={100} color={RISK_COLORS[a.riskClassification]} />
                  <span className="font-mono flex-shrink-0" style={{ color: GOLD, width: 28, textAlign: 'right' }}>{a.trustScore}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
