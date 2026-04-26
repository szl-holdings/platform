import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

interface SwarmMission {
  id: string;
  name: string;
  status: 'active' | 'completed' | 'paused';
  agentCount: number;
  agents: { name: string; role: string; status: 'executing' | 'waiting' | 'done'; progress: number }[];
  taskDecomposition: { task: string; assignedTo: string; status: 'done' | 'in-progress' | 'queued'; duration: string }[];
  governanceGates: { gate: string; status: 'passed' | 'pending' | 'blocked'; timestamp: string }[];
  intelligenceShared: number;
  startedAt: string;
  completedAt: string | null;
  totalDuration: string;
}

const SWARM_MISSIONS: SwarmMission[] = [
  {
    id: 'SM-001', name: 'Cross-Domain Threat Assessment', status: 'active', agentCount: 5,
    agents: [
      { name: 'Guardian', role: 'Threat Intel Lead', status: 'executing', progress: 72 },
      { name: 'Cascade Navigator', role: 'Maritime Correlation', status: 'executing', progress: 85 },
      { name: 'Counsel Sentinel', role: 'Regulatory Impact', status: 'waiting', progress: 0 },
      { name: 'Pipeline Oracle', role: 'Financial Exposure', status: 'done', progress: 100 },
      { name: 'MirrorEval', role: 'Quality Gate', status: 'waiting', progress: 0 },
    ],
    taskDecomposition: [
      { task: 'Aggregate threat indicators from all domains', assignedTo: 'Guardian', status: 'in-progress', duration: '4m 12s' },
      { task: 'Correlate maritime vessel positions with threat zones', assignedTo: 'Cascade Navigator', status: 'in-progress', duration: '3m 45s' },
      { task: 'Assess regulatory implications of threat scenario', assignedTo: 'Counsel Sentinel', status: 'queued', duration: '—' },
      { task: 'Calculate financial exposure across affected portfolios', assignedTo: 'Pipeline Oracle', status: 'done', duration: '2m 18s' },
      { task: 'Validate combined assessment quality and consistency', assignedTo: 'MirrorEval', status: 'queued', duration: '—' },
    ],
    governanceGates: [
      { gate: 'Swarm Activation Approved', status: 'passed', timestamp: '2026-04-26T14:20:00Z' },
      { gate: 'Inter-Agent Data Sharing Authorized', status: 'passed', timestamp: '2026-04-26T14:20:30Z' },
      { gate: 'Cross-Domain Context Merge', status: 'pending', timestamp: '—' },
      { gate: 'Human Review of Combined Assessment', status: 'pending', timestamp: '—' },
    ],
    intelligenceShared: 47,
    startedAt: '2026-04-26T14:20:00Z',
    completedAt: null,
    totalDuration: '12m 33s (running)',
  },
  {
    id: 'SM-002', name: 'Quarterly Risk Synthesis', status: 'completed', agentCount: 6,
    agents: [
      { name: 'Pipeline Oracle', role: 'Revenue Risk', status: 'done', progress: 100 },
      { name: 'Terra Analyst', role: 'Asset Risk', status: 'done', progress: 100 },
      { name: 'Guardian', role: 'Cyber Risk', status: 'done', progress: 100 },
      { name: 'Counsel Sentinel', role: 'Legal Risk', status: 'done', progress: 100 },
      { name: 'Cascade Navigator', role: 'Operational Risk', status: 'done', progress: 100 },
      { name: 'MirrorEval', role: 'Quality Gate', status: 'done', progress: 100 },
    ],
    taskDecomposition: [
      { task: 'Compile revenue pipeline risk factors', assignedTo: 'Pipeline Oracle', status: 'done', duration: '3m 42s' },
      { task: 'Assess real estate portfolio exposure', assignedTo: 'Terra Analyst', status: 'done', duration: '4m 15s' },
      { task: 'Evaluate cyber threat landscape changes', assignedTo: 'Guardian', status: 'done', duration: '5m 08s' },
      { task: 'Review pending legal matters and deadlines', assignedTo: 'Counsel Sentinel', status: 'done', duration: '2m 55s' },
      { task: 'Analyze fleet operational risk factors', assignedTo: 'Cascade Navigator', status: 'done', duration: '3m 22s' },
      { task: 'Cross-validate all risk assessments for consistency', assignedTo: 'MirrorEval', status: 'done', duration: '1m 48s' },
    ],
    governanceGates: [
      { gate: 'Swarm Activation Approved', status: 'passed', timestamp: '2026-04-26T10:00:00Z' },
      { gate: 'Inter-Agent Data Sharing Authorized', status: 'passed', timestamp: '2026-04-26T10:00:15Z' },
      { gate: 'Cross-Domain Context Merge', status: 'passed', timestamp: '2026-04-26T10:18:00Z' },
      { gate: 'Human Review of Combined Assessment', status: 'passed', timestamp: '2026-04-26T10:22:00Z' },
    ],
    intelligenceShared: 128,
    startedAt: '2026-04-26T10:00:00Z',
    completedAt: '2026-04-26T10:22:00Z',
    totalDuration: '22m 00s',
  },
  {
    id: 'SM-003', name: 'Incident Response Coordination', status: 'completed', agentCount: 4,
    agents: [
      { name: 'Guardian', role: 'Incident Commander', status: 'done', progress: 100 },
      { name: 'Fabric Watchdog', role: 'System Status', status: 'done', progress: 100 },
      { name: 'Counsel Sentinel', role: 'Notification Lead', status: 'done', progress: 100 },
      { name: 'MirrorEval', role: 'Response Validator', status: 'done', progress: 100 },
    ],
    taskDecomposition: [
      { task: 'Assess incident severity and blast radius', assignedTo: 'Guardian', status: 'done', duration: '1m 12s' },
      { task: 'Check all system health indicators', assignedTo: 'Fabric Watchdog', status: 'done', duration: '0m 45s' },
      { task: 'Draft regulatory notification requirements', assignedTo: 'Counsel Sentinel', status: 'done', duration: '2m 30s' },
      { task: 'Validate response completeness', assignedTo: 'MirrorEval', status: 'done', duration: '1m 05s' },
    ],
    governanceGates: [
      { gate: 'Emergency Swarm Activation', status: 'passed', timestamp: '2026-04-25T16:00:00Z' },
      { gate: 'Incident Data Sharing Override', status: 'passed', timestamp: '2026-04-25T16:00:05Z' },
      { gate: 'Response Plan Approval', status: 'passed', timestamp: '2026-04-25T16:04:00Z' },
      { gate: 'Executive Notification Sent', status: 'passed', timestamp: '2026-04-25T16:06:00Z' },
    ],
    intelligenceShared: 34,
    startedAt: '2026-04-25T16:00:00Z',
    completedAt: '2026-04-25T16:06:00Z',
    totalDuration: '6m 00s',
  },
];

const SWARM_METRICS = {
  totalMissions: SWARM_MISSIONS.length,
  activeMissions: SWARM_MISSIONS.filter(m => m.status === 'active').length,
  completedMissions: SWARM_MISSIONS.filter(m => m.status === 'completed').length,
  totalAgentsDeployed: SWARM_MISSIONS.reduce((a, m) => a + m.agentCount, 0),
  totalIntelligenceShared: SWARM_MISSIONS.reduce((a, m) => a + m.intelligenceShared, 0),
  totalGatesPassed: SWARM_MISSIONS.reduce((a, m) => a + m.governanceGates.filter(g => g.status === 'passed').length, 0),
  avgMissionDuration: '13m 31s',
};

const STATUS_COLORS: Record<string, string> = { active: '#c9b787', completed: '#8a8a8a', paused: '#f59e0b' };
const TASK_COLORS: Record<string, string> = { done: '#c9b787', 'in-progress': '#3b82f6', queued: '#5e5e5e' };
const GATE_COLORS: Record<string, string> = { passed: '#c9b787', pending: '#f59e0b', blocked: '#ef4444' };
const AGENT_STATUS_COLORS: Record<string, string> = { executing: '#3b82f6', waiting: '#5e5e5e', done: '#c9b787' };

export function SwarmOrchestrator() {
  const [selectedMission, setSelectedMission] = useState<string>(SWARM_MISSIONS[0].id);
  const [view, setView] = useState<'missions' | 'decomposition' | 'intelligence' | 'metrics'>('missions');
  const [pulseAgent, setPulseAgent] = useState(0);

  const mission = SWARM_MISSIONS.find(m => m.id === selectedMission)!;

  useEffect(() => {
    const iv = setInterval(() => setPulseAgent(p => (p + 1) % mission.agents.length), 2000);
    return () => clearInterval(iv);
  }, [mission.agents.length]);

  return (
    <Layout>
      <PageHeader
        label="AGENTIC SWARM ORCHESTRATOR"
        title="Multi-Agent Swarm Coordination"
        subtitle="Defensive multi-agent swarm workflows — parallel task decomposition, inter-agent intelligence sharing, and coordinated execution with real-time governance gates at every checkpoint."
        status="LIVE"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="MISSIONS" value={SWARM_METRICS.totalMissions} sub="total" accent={T.accent} />
        <KpiCard label="ACTIVE" value={SWARM_METRICS.activeMissions} sub="running now" accent={T.accent} />
        <KpiCard label="AGENTS DEPLOYED" value={SWARM_METRICS.totalAgentsDeployed} sub="across missions" accent={T.accent} />
        <KpiCard label="INTEL SHARED" value={SWARM_METRICS.totalIntelligenceShared} sub="data points" accent={T.accent} />
        <KpiCard label="GATES PASSED" value={SWARM_METRICS.totalGatesPassed} sub="governance checks" accent={T.dim} />
        <KpiCard label="AVG DURATION" value={SWARM_METRICS.avgMissionDuration} sub="per mission" accent={T.dim} />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {SWARM_MISSIONS.map(m => (
          <button key={m.id} onClick={() => setSelectedMission(m.id)} className="px-4 py-2 rounded-lg text-xs font-mono transition-all" style={{ background: selectedMission === m.id ? 'rgba(201,183,135,0.1)' : T.surface, border: `1px solid ${selectedMission === m.id ? 'rgba(201,183,135,0.3)' : T.border}`, color: selectedMission === m.id ? T.accent : T.muted, cursor: 'pointer' }}>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_COLORS[m.status] }} />
              {m.name}
            </div>
          </button>
        ))}
      </div>

      <div className="flex gap-1 mb-6">
        {(['missions', 'decomposition', 'intelligence', 'metrics'] as const).map(tab => (
          <button key={tab} onClick={() => setView(tab)} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all" style={{ background: view === tab ? 'rgba(201,183,135,0.1)' : 'transparent', color: view === tab ? T.accent : T.muted, border: `1px solid ${view === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
            {tab}
          </button>
        ))}
      </div>

      {view === 'missions' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SectionTitle>Swarm Visualization — {mission.name}</SectionTitle>
            <Card className="mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${STATUS_COLORS[mission.status]}15`, color: STATUS_COLORS[mission.status] }}>{mission.status}</span>
                    <span className="text-[10px] font-mono" style={{ color: T.dim }}>{mission.id}</span>
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: T.text }}>{mission.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono" style={{ color: T.accent }}>{mission.agentCount} agents</div>
                  <div className="text-[9px] font-mono" style={{ color: T.muted }}>{mission.totalDuration}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-center py-6">
                {mission.agents.map((agent, idx) => (
                  <div key={agent.name} className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-xs font-mono transition-all" style={{ background: `${AGENT_STATUS_COLORS[agent.status]}12`, border: `2px solid ${idx === pulseAgent && agent.status === 'executing' ? T.accent : AGENT_STATUS_COLORS[agent.status]}`, boxShadow: idx === pulseAgent && agent.status === 'executing' ? `0 0 12px ${T.accent}44` : 'none' }}>
                      <div className="text-center">
                        <div className="text-[9px] font-bold" style={{ color: AGENT_STATUS_COLORS[agent.status] }}>{agent.progress}%</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] font-medium" style={{ color: T.text }}>{agent.name}</div>
                      <div className="text-[8px]" style={{ color: T.muted }}>{agent.role}</div>
                    </div>
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${AGENT_STATUS_COLORS[agent.status]}15`, color: AGENT_STATUS_COLORS[agent.status] }}>{agent.status}</span>
                  </div>
                ))}
              </div>
            </Card>

            <SectionTitle>Governance Gate Timeline</SectionTitle>
            <div className="flex flex-col gap-0">
              {mission.governanceGates.map((gate, i) => (
                <div key={gate.gate}>
                  <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: `${GATE_COLORS[gate.status]}06`, border: `1px solid ${GATE_COLORS[gate.status]}20` }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${GATE_COLORS[gate.status]}18`, border: `1px solid ${GATE_COLORS[gate.status]}40` }}>
                      <span className="text-[10px]" style={{ color: GATE_COLORS[gate.status] }}>{gate.status === 'passed' ? '✓' : gate.status === 'pending' ? '◌' : '✗'}</span>
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium" style={{ color: T.text }}>{gate.gate}</div>
                      <div className="text-[9px] font-mono" style={{ color: T.muted }}>{gate.timestamp === '—' ? 'Awaiting...' : new Date(gate.timestamp).toLocaleTimeString()}</div>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${GATE_COLORS[gate.status]}15`, color: GATE_COLORS[gate.status] }}>{gate.status}</span>
                  </div>
                  {i < mission.governanceGates.length - 1 && (
                    <div className="flex justify-start ml-6 my-0">
                      <div className="w-px h-2" style={{ background: `${T.border}` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SectionTitle>Mission Summary</SectionTitle>
            <Card>
              <div className="space-y-3 text-[10px]">
                <div className="flex justify-between"><span style={{ color: T.muted }}>Status</span><span style={{ color: STATUS_COLORS[mission.status] }}>{mission.status}</span></div>
                <div className="flex justify-between"><span style={{ color: T.muted }}>Agents</span><span style={{ color: T.text }}>{mission.agentCount}</span></div>
                <div className="flex justify-between"><span style={{ color: T.muted }}>Tasks</span><span style={{ color: T.text }}>{mission.taskDecomposition.length}</span></div>
                <div className="flex justify-between"><span style={{ color: T.muted }}>Intel Shared</span><span style={{ color: T.accent }}>{mission.intelligenceShared} points</span></div>
                <div className="flex justify-between"><span style={{ color: T.muted }}>Duration</span><span style={{ color: T.text }}>{mission.totalDuration}</span></div>
                <div className="flex justify-between"><span style={{ color: T.muted }}>Gates Passed</span><span style={{ color: T.accent }}>{mission.governanceGates.filter(g => g.status === 'passed').length}/{mission.governanceGates.length}</span></div>
              </div>
            </Card>

            <SectionTitle>Agent Roles</SectionTitle>
            <div className="flex flex-col gap-2">
              {mission.agents.map(agent => (
                <div key={agent.name} className="rounded-lg p-3" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-medium" style={{ color: T.text }}>{agent.name}</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${AGENT_STATUS_COLORS[agent.status]}15`, color: AGENT_STATUS_COLORS[agent.status] }}>{agent.status}</span>
                  </div>
                  <div className="text-[9px]" style={{ color: T.muted }}>{agent.role}</div>
                  <div className="h-1.5 rounded-full mt-2" style={{ background: T.surface }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${agent.progress}%`, background: AGENT_STATUS_COLORS[agent.status] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === 'decomposition' && (
        <>
          <SectionTitle>Parallel Task Decomposition — {mission.name}</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            The swarm orchestrator decomposes complex missions into parallel subtasks, assigns each to the most capable agent, and coordinates execution with governance gates.
          </p>
          <div className="space-y-2 mb-8">
            {mission.taskDecomposition.map((task, i) => (
              <Card key={i} style={{ borderLeft: `3px solid ${TASK_COLORS[task.status]}` }}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${TASK_COLORS[task.status]}15`, color: TASK_COLORS[task.status] }}>{task.status}</span>
                      <span className="text-[9px] font-mono" style={{ color: T.accent }}>{task.assignedTo}</span>
                    </div>
                    <div className="text-xs" style={{ color: T.text }}>{task.task}</div>
                  </div>
                  <div className="text-[10px] font-mono flex-shrink-0" style={{ color: T.dim }}>{task.duration}</div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {view === 'intelligence' && (
        <>
          <SectionTitle>Inter-Agent Intelligence Graph — {mission.name}</SectionTitle>
          <p className="text-xs mb-4" style={{ color: T.dim }}>
            Intelligence data points shared between agents during the mission. Each sharing event is governed — authorized by the swarm's data sharing policy and logged to the proof chain.
          </p>
          <Card className="mb-6">
            <div className="text-center py-8">
              <div className="text-4xl font-mono font-bold mb-2" style={{ color: T.accent }}>{mission.intelligenceShared}</div>
              <div className="text-xs" style={{ color: T.dim }}>intelligence data points shared across {mission.agentCount} agents</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4" style={{ borderTop: `1px solid ${T.border}` }}>
              {[
                { label: 'Threat Indicators', value: Math.floor(mission.intelligenceShared * 0.3), icon: '⚠' },
                { label: 'Context Updates', value: Math.floor(mission.intelligenceShared * 0.25), icon: '◈' },
                { label: 'Risk Scores', value: Math.floor(mission.intelligenceShared * 0.25), icon: '◆' },
                { label: 'Recommendations', value: Math.ceil(mission.intelligenceShared * 0.2), icon: '◇' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className="text-lg font-mono font-bold" style={{ color: T.text }}>{item.value}</div>
                  <div className="text-[9px]" style={{ color: T.muted }}>{item.label}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>SHARING GOVERNANCE RULES</div>
            <div className="space-y-2 text-[10px]">
              {[
                'All inter-agent data sharing requires explicit authorization from the swarm policy',
                'Classified data is compartmentalized — agents receive only the data relevant to their role',
                'Every shared data point is hashed and logged to the Proof Ledger',
                'Cross-domain sharing (e.g., defense to financial) requires elevated approval',
                'Shared intelligence expires after mission completion — no persistent cross-agent memory',
              ].map(rule => (
                <div key={rule} className="flex items-center gap-2">
                  <span style={{ color: T.accent }}>✓</span>
                  <span style={{ color: T.dim }}>{rule}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {view === 'metrics' && (
        <>
          <SectionTitle>Swarm Performance Metrics</SectionTitle>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Missions', value: SWARM_METRICS.totalMissions.toString(), sub: 'all time' },
              { label: 'Active Missions', value: SWARM_METRICS.activeMissions.toString(), sub: 'right now' },
              { label: 'Completed', value: SWARM_METRICS.completedMissions.toString(), sub: 'successfully' },
              { label: 'Agents Deployed', value: SWARM_METRICS.totalAgentsDeployed.toString(), sub: 'total across missions' },
              { label: 'Avg Duration', value: SWARM_METRICS.avgMissionDuration, sub: 'per mission' },
              { label: 'Intel Shared', value: SWARM_METRICS.totalIntelligenceShared.toString(), sub: 'data points total' },
            ].map(m => (
              <Card key={m.label}>
                <div className="text-2xl font-mono font-bold mb-1" style={{ color: T.accent }}>{m.value}</div>
                <div className="text-xs font-medium" style={{ color: T.text }}>{m.label}</div>
                <div className="text-[9px] mt-1" style={{ color: T.muted }}>{m.sub}</div>
              </Card>
            ))}
          </div>

          <SectionTitle>Mission History</SectionTitle>
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {['Mission', 'Status', 'Agents', 'Tasks', 'Intel Shared', 'Duration', 'Gates'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SWARM_MISSIONS.map(m => (
                  <tr key={m.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                    <td className="px-4 py-2.5">
                      <div className="font-mono text-[10px]" style={{ color: T.muted }}>{m.id}</div>
                      <div className="text-xs" style={{ color: T.text }}>{m.name}</div>
                    </td>
                    <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${STATUS_COLORS[m.status]}15`, color: STATUS_COLORS[m.status] }}>{m.status}</span></td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{m.agentCount}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{m.taskDecomposition.length}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>{m.intelligenceShared}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{m.totalDuration}</td>
                    <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>{m.governanceGates.filter(g => g.status === 'passed').length}/{m.governanceGates.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="p-3 rounded-lg text-xs flex items-center gap-2 mt-6" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.15)', color: T.muted }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} /> Agentic Swarm Orchestrator — multi-agent coordination with governance gates at every checkpoint. No swarm executes without policy authorization.
      </div>
    </Layout>
  );
}
