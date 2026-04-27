import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard } from '../components/ui';
import { useDefenseData } from '../hooks/useDefenseData';
import { LoadingState, ErrorState, RefreshBar } from '../components/DefenseDataState';

const T = {
  surface: 'rgba(255,255,255,0.025)', border: 'rgba(255,255,255,0.08)',
  text: '#f5f5f5', dim: '#8a8a8a', muted: '#5e5e5e', accent: '#c9b787',
};

interface PlaybookNode {
  id: string;
  type: 'trigger' | 'action' | 'decision' | 'gate' | 'hitl' | 'remediation';
  label: string;
  description: string;
  policyGated: boolean;
  config?: Record<string, string>;
}

interface Playbook {
  id: string;
  name: string;
  category: string;
  status: 'active' | 'draft' | 'archived';
  triggerType: string;
  executionCount: number;
  avgDuration: string;
  lastRun: string | null;
  successRate: number;
  nodes: PlaybookNode[];
  cops: string;
}

interface ExecutionRecord {
  id: string;
  playbookId: string;
  playbookName: string;
  startedAt: string;
  completedAt: string;
  status: 'success' | 'failed' | 'hitl-pending';
  nodesExecuted: number;
  totalNodes: number;
  duration: string;
  trigger: string;
}

interface PlaybookEngineData {
  playbooks: Playbook[];
  executionHistory: ExecutionRecord[];
}

const NODE_COLORS: Record<string, string> = {
  trigger: '#3b82f6', action: '#c9b787', decision: '#8b5cf6', gate: '#f59e0b', hitl: '#f5f5f5', remediation: '#10b981',
};
const NODE_ICONS: Record<string, string> = {
  trigger: '⚡', action: '◆', decision: '◇', gate: '⛔', hitl: '●', remediation: '✓',
};
const EXEC_STATUS_COLORS: Record<string, string> = { success: '#c9b787', failed: '#ef4444', 'hitl-pending': '#f59e0b' };
const CATEGORY_COLORS: Record<string, string> = { Security: '#ef4444', Governance: '#c9b787', Orchestration: '#3b82f6' };

export function PlaybookEngine() {
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null);
  const [view, setView] = useState<'builder' | 'library' | 'history'>('builder');
  const { data, loading, error, lastUpdated, refresh } = useDefenseData<PlaybookEngineData>(
    '/api/internal/a11oy/defense/playbook-engine'
  );

  const playbooks = data?.playbooks ?? [];
  const executionHistory = data?.executionHistory ?? [];

  useEffect(() => {
    if (playbooks.length > 0 && !selectedPlaybook) {
      setSelectedPlaybook(playbooks[0].id);
    }
  }, [playbooks, selectedPlaybook]);

  const playbook = playbooks.find(p => p.id === selectedPlaybook) ?? playbooks[0];
  const totalExecutions = playbooks.reduce((a, p) => a + p.executionCount, 0);
  const avgSuccessRate = playbooks.length
    ? playbooks.reduce((a, p) => a + p.successRate, 0) / playbooks.length
    : 0;

  return (
    <Layout>
      <PageHeader
        label="AUTONOMOUS PLAYBOOK ENGINE"
        title="Policy-Gated Agent Workflows"
        subtitle="XSOAR-inspired playbook library with COPS format — visual playbook builder for agent workflows with policy-gated execution, human-in-the-loop checkpoints, and automated remediation chains."
        status="LIVE"
      />

      <RefreshBar loading={loading} error={error} lastUpdated={lastUpdated} onRefresh={refresh} />

      {!data && loading ? (
        <LoadingState label="Loading playbook library…" />
      ) : !data && error ? (
        <ErrorState error={error} onRetry={refresh} />
      ) : !playbook ? (
        <LoadingState label="No playbooks available." />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            <KpiCard label="PLAYBOOKS" value={playbooks.length} sub="active" accent={T.accent} />
            <KpiCard label="EXECUTIONS" value={totalExecutions.toLocaleString()} sub="total runs" accent={T.accent} />
            <KpiCard label="SUCCESS RATE" value={`${(avgSuccessRate * 100).toFixed(1)}%`} sub="across all playbooks" accent={T.accent} />
            <KpiCard label="POLICY GATES" value={playbooks.reduce((a, p) => a + p.nodes.filter(n => n.policyGated).length, 0)} sub="enforced" accent={T.accent} />
            <KpiCard label="HITL CHECKPOINTS" value={playbooks.reduce((a, p) => a + p.nodes.filter(n => n.type === 'hitl').length, 0)} sub="human review" accent={T.text} />
            <KpiCard label="COPS FORMAT" value={playbooks.length} sub="standardized" accent={T.dim} />
          </div>

          <div className="flex gap-1 mb-6">
            {(['builder', 'library', 'history'] as const).map(tab => (
              <button key={tab} onClick={() => setView(tab)} className="px-4 py-2 text-[10px] font-mono uppercase tracking-widest rounded-md transition-all" style={{ background: view === tab ? 'rgba(201,183,135,0.1)' : 'transparent', color: view === tab ? T.accent : T.muted, border: `1px solid ${view === tab ? 'rgba(201,183,135,0.2)' : 'transparent'}`, cursor: 'pointer' }}>
                {tab}
              </button>
            ))}
          </div>

          {view === 'builder' && (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <SectionTitle>Visual Playbook — {playbook.name}</SectionTitle>
                  <span className="text-[9px] font-mono px-2 py-1 rounded" style={{ background: 'rgba(201,183,135,0.08)', color: T.accent }}>{playbook.cops}</span>
                </div>

                <div className="rounded-lg overflow-hidden mb-4" style={{ background: '#050505', border: `1px solid ${T.border}` }}>
                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: `1px solid ${T.border}` }}>
                    <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: T.muted }}>Playbook Canvas — {playbook.nodes.length} nodes</span>
                    <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${CATEGORY_COLORS[playbook.category]}18`, color: CATEGORY_COLORS[playbook.category] }}>{playbook.category}</span>
                  </div>
                  <div className="p-4">
                    {playbook.nodes.map((node, i) => (
                      <div key={node.id}>
                        <div className="rounded-lg p-3 transition-all" style={{ background: `${NODE_COLORS[node.type]}08`, border: `1px solid ${NODE_COLORS[node.type]}25` }}>
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background: `${NODE_COLORS[node.type]}15`, border: `1px solid ${NODE_COLORS[node.type]}35`, color: NODE_COLORS[node.type] }}>
                              {NODE_ICONS[node.type]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-mono uppercase" style={{ color: NODE_COLORS[node.type] }}>{node.type}</span>
                                {node.policyGated && (
                                  <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>POLICY-GATED</span>
                                )}
                              </div>
                              <div className="text-xs font-medium mb-0.5" style={{ color: T.text }}>{node.label}</div>
                              <div className="text-[10px]" style={{ color: T.dim }}>{node.description}</div>
                              {node.config && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {Object.entries(node.config).map(([k, v]) => (
                                    <span key={k} className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: T.muted }}>{k}: {v}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {i < playbook.nodes.length - 1 && (
                          <div className="flex justify-start ml-7 my-1">
                            <div className="w-px h-3" style={{ background: `${NODE_COLORS[node.type]}30` }} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <SectionTitle>Playbook Selector</SectionTitle>
                <div className="flex flex-col gap-2">
                  {playbooks.map(pb => (
                    <button key={pb.id} onClick={() => setSelectedPlaybook(pb.id)} className="text-left rounded-lg p-3 transition-all" style={{ background: selectedPlaybook === pb.id ? 'rgba(201,183,135,0.06)' : T.surface, border: `1px solid ${selectedPlaybook === pb.id ? 'rgba(201,183,135,0.2)' : T.border}`, cursor: 'pointer' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: CATEGORY_COLORS[pb.category] }} />
                        <span className="text-[9px] font-mono" style={{ color: T.muted }}>{pb.id}</span>
                        <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: `${CATEGORY_COLORS[pb.category]}15`, color: CATEGORY_COLORS[pb.category] }}>{pb.category}</span>
                      </div>
                      <div className="text-[10px] font-medium" style={{ color: selectedPlaybook === pb.id ? T.text : T.dim }}>{pb.name}</div>
                      <div className="text-[9px] mt-0.5" style={{ color: T.muted }}>{pb.executionCount} runs · {(pb.successRate * 100).toFixed(0)}% success</div>
                    </button>
                  ))}
                </div>

                <SectionTitle>Playbook Stats</SectionTitle>
                <Card>
                  <div className="space-y-3 text-[10px]">
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Trigger</span><span style={{ color: T.text }}>{playbook.triggerType}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Executions</span><span style={{ color: T.accent }}>{playbook.executionCount}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Avg Duration</span><span style={{ color: T.text }}>{playbook.avgDuration}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Success Rate</span><span style={{ color: T.accent }}>{(playbook.successRate * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Nodes</span><span style={{ color: T.text }}>{playbook.nodes.length}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>Policy Gates</span><span style={{ color: '#f59e0b' }}>{playbook.nodes.filter(n => n.policyGated).length}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>HITL Checkpoints</span><span style={{ color: T.text }}>{playbook.nodes.filter(n => n.type === 'hitl').length}</span></div>
                    <div className="flex justify-between"><span style={{ color: T.muted }}>COPS ID</span><span style={{ color: T.accent }}>{playbook.cops}</span></div>
                  </div>
                </Card>

                <Card>
                  <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>NODE TYPES</div>
                  <div className="space-y-2">
                    {Object.entries(NODE_COLORS).map(([type, color]) => (
                      <div key={type} className="flex items-center gap-2">
                        <span className="text-sm" style={{ color }}>{NODE_ICONS[type]}</span>
                        <span className="text-[10px] font-mono uppercase" style={{ color }}>{type}</span>
                        <span className="text-[9px]" style={{ color: T.muted }}>— {playbook.nodes.filter(n => n.type === type).length} in this playbook</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {view === 'library' && (
            <>
              <SectionTitle>Playbook Library — COPS Format</SectionTitle>
              <p className="text-xs mb-4" style={{ color: T.dim }}>
                All playbooks follow the COPS (APEX XSOAR Playbook Schema) format for interoperability. Each playbook has policy-gated execution nodes and mandatory human-in-the-loop checkpoints for critical decisions.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {playbooks.map(pb => (
                  <Card key={pb.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[pb.category] }} />
                      <span className="text-[9px] font-mono" style={{ color: T.muted }}>{pb.id}</span>
                      <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ background: `${CATEGORY_COLORS[pb.category]}15`, color: CATEGORY_COLORS[pb.category] }}>{pb.category}</span>
                    </div>
                    <div className="text-sm font-medium mb-1" style={{ color: T.text }}>{pb.name}</div>
                    <div className="text-[10px] mb-3" style={{ color: T.dim }}>{pb.triggerType}</div>
                    <div className="grid grid-cols-3 gap-2 text-[9px] font-mono pt-2" style={{ borderTop: `1px solid ${T.border}` }}>
                      <div><span style={{ color: T.muted }}>Runs:</span> <span style={{ color: T.accent }}>{pb.executionCount}</span></div>
                      <div><span style={{ color: T.muted }}>Avg:</span> <span style={{ color: T.text }}>{pb.avgDuration}</span></div>
                      <div><span style={{ color: T.muted }}>Rate:</span> <span style={{ color: T.accent }}>{(pb.successRate * 100).toFixed(0)}%</span></div>
                    </div>
                    <div className="flex gap-1 mt-2">
                      {pb.nodes.map(node => (
                        <div key={node.id} className="w-5 h-5 rounded flex items-center justify-center text-[8px]" style={{ background: `${NODE_COLORS[node.type]}15`, border: `1px solid ${NODE_COLORS[node.type]}30`, color: NODE_COLORS[node.type] }} title={`${node.type}: ${node.label}`}>
                          {NODE_ICONS[node.type]}
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
              <Card>
                <div className="text-[9px] font-mono uppercase tracking-widest mb-3" style={{ color: T.muted }}>REMEDIATION CHAIN TEMPLATES</div>
                <div className="space-y-2 text-[10px]">
                  {[
                    { name: 'Isolate → Analyze → Remediate → Verify', use: 'Security incidents', playbooks: 3 },
                    { name: 'Detect → Hold → Review → Execute/Archive', use: 'Governance violations', playbooks: 2 },
                    { name: 'Assemble → Decompose → Execute → Merge → Review', use: 'Swarm orchestration', playbooks: 1 },
                  ].map(template => (
                    <div key={template.name} className="flex items-center justify-between p-2 rounded" style={{ background: T.surface, border: `1px solid ${T.border}` }}>
                      <div>
                        <div style={{ color: T.text }}>{template.name}</div>
                        <div className="text-[9px]" style={{ color: T.muted }}>{template.use}</div>
                      </div>
                      <span className="text-[9px] font-mono" style={{ color: T.accent }}>{template.playbooks} playbooks</span>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {view === 'history' && (
            <>
              <SectionTitle>Playbook Execution History</SectionTitle>
              <div className="rounded-lg overflow-hidden mb-8" style={{ border: `1px solid ${T.border}` }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      {['Execution', 'Playbook', 'Status', 'Nodes', 'Duration', 'Trigger', 'Time'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 font-mono text-[9px] uppercase tracking-wider" style={{ color: T.muted, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {executionHistory.map(exec => (
                      <tr key={exec.id} style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                        <td className="px-4 py-2.5 font-mono font-medium" style={{ color: T.dim }}>{exec.id}</td>
                        <td className="px-4 py-2.5" style={{ color: T.text }}>{exec.playbookName}</td>
                        <td className="px-4 py-2.5"><span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: `${EXEC_STATUS_COLORS[exec.status]}15`, color: EXEC_STATUS_COLORS[exec.status] }}>{exec.status}</span></td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: T.accent }}>{exec.nodesExecuted}/{exec.totalNodes}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: T.dim }}>{exec.duration}</td>
                        <td className="px-4 py-2.5 text-[10px]" style={{ color: T.dim, maxWidth: 200 }}>{exec.trigger}</td>
                        <td className="px-4 py-2.5 font-mono" style={{ color: T.muted }}>{new Date(exec.startedAt).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div className="p-3 rounded-lg text-xs flex items-center gap-2 mt-6" style={{ background: 'rgba(201,183,135,0.04)', border: '1px solid rgba(201,183,135,0.15)', color: T.muted }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: T.accent }} /> Autonomous Playbook Engine — XSOAR-inspired, COPS format, policy-gated at every node. No playbook step executes without governance authorization.
          </div>
        </>
      )}
    </Layout>
  );
}
