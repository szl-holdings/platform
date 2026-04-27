import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { useDefenseData } from '../hooks/useDefenseData';
import { LoadingState, ErrorState, RefreshBar } from '../components/DefenseDataState';

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

interface SwarmMetrics {
  totalMissions: number;
  activeMissions: number;
  completedMissions: number;
  totalAgentsDeployed: number;
  totalIntelligenceShared: number;
  totalGatesPassed: number;
  avgMissionDuration: string;
}

interface SwarmOrchestratorData {
  missions: SwarmMission[];
  metrics: SwarmMetrics;
}

const STATUS_COLORS: Record<string, string> = { active: '#c9b787', completed: '#8a8a8a', paused: '#f59e0b' };
const TASK_COLORS: Record<string, string> = { done: '#c9b787', 'in-progress': '#3b82f6', queued: '#5e5e5e' };
const GATE_COLORS: Record<string, string> = { passed: '#c9b787', pending: '#f59e0b', blocked: '#ef4444' };
const AGENT_STATUS_COLORS: Record<string, string> = { executing: '#3b82f6', waiting: '#5e5e5e', done: '#c9b787' };

export function SwarmOrchestrator() {
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [view, setView] = useState<'missions' | 'decomposition' | 'intelligence' | 'metrics'>('missions');
  const [pulseAgent, setPulseAgent] = useState(0);
  const { data, loading, error, lastUpdated, refresh } = useDefenseData<SwarmOrchestratorData>(
    '/api/internal/a11oy/defense/swarm-orchestrator'
  );

  const missions = data?.missions ?? [];
  const metrics = data?.metrics ?? {
    totalMissions: 0, activeMissions: 0, completedMissions: 0, totalAgentsDeployed: 0,
    totalIntelligenceShared: 0, totalGatesPassed: 0, avgMissionDuration: '—',
  };

  useEffect(() => {
    if (missions.length > 0 && !selectedMission) {
      setSelectedMission(missions[0].id);
    }
  }, [missions, selectedMission]);

  const mission = missions.find(m => m.id === selectedMission) ?? missions[0];

  useEffect(() => {
    if (!mission || mission.agents.length === 0) return;
    const iv = setInterval(() => setPulseAgent(p => (p + 1) % mission.agents.length), 2000);
    return () => clearInterval(iv);
  }, [mission]);

  return (
    <Layout>
      <PageHeader
        label="AGENTIC SWARM ORCHESTRATOR"
        title="Multi-Agent Swarm Coordination"
        subtitle="Defensive multi-agent swarm workflows — parallel task decomposition, inter-agent intelligence sharing, and coordinated execution with real-time governance gates at every checkpoint."
        status="LIVE"
      />

      <RefreshBar loading={loading} error={error} lastUpdated={lastUpdated} onRefresh={refresh} />

      {!data && loading ? (
        <LoadingState label="Loading swarm missions…" />
      ) : !data && error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : !mission ? (
        <LoadingState label="No active swarm missions." />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <KpiCard label="MISSIONS" value={metrics.totalMissions} sub="total" accent={T.accent} />
            <KpiCard label="ACTIVE" value={metrics.activeMissions} sub="running now" accent={T.accent} />
            <KpiCard label="AGENTS DEPLOYED" value={metrics.totalAgentsDeployed} sub="across missions" accent={T.accent} />
            <KpiCard label="INTEL SHARED" value={metrics.totalIntelligenceShared} sub="data points" accent={T.accent} />
            <KpiCard label="GATES PASSED" value={metrics.totalGatesPassed} sub="governance checks" accent={T.dim} />
            <KpiCard label="AVG DURATION" value={metrics.avgMissionDuration} sub="per mission" accent={T.dim} />
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            {missions.map(m => (
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
                  { label: 'Total Missions', value: metrics.totalMissions.toString(), sub: 'all time' },
                  { label: 'Active Missions', value: metrics.activeMissions.toString(), sub: 'right now' },
                  { label: 'Completed', value: metrics.completedMissions.toString(), sub: 'successfully' },
                  { label: 'Agents Deployed', value: metrics.totalAgentsDeployed.toString(), sub: 'total across missions' },
                  { label: 'Avg Duration', value: metrics.avgMissionDuration, sub: 'per mission' },
                  { label: 'Intel Shared', value: metrics.totalIntelligenceShared.toString(), sub: 'data points total' },
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
                    {missions.map(m => (
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
        </>
      )}
    </Layout>
  );
}
