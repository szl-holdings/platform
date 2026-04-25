import { useState } from 'react';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, KpiCard, ApprovalGate, ProgressBar, VerdictBadge } from '../components/ui';
import { SEED_WORKCELLS } from '@workspace/a11oy-fabric';

const OPERATORS = [
  { id: 'op-cascade', name: 'Cascade Navigator', vertical: 'vessels-maritime', type: 'domain-specialist', status: 'active', trustScore: 97, model: 'gpt-4o → claude-3.5-sonnet', tasksToday: 12, pendingTasks: 3, avgLatencyMs: 840, costPerCallUSD: 0.012, skills: ['ETA Monitoring', 'Port Cost Analysis', 'Demurrage Calc', 'Route Optimization'], lastAction: 'Recommended port standby — awaiting VP approval' },
  { id: 'op-counsel', name: 'Counsel Sentinel', vertical: 'prism-counsel', type: 'domain-specialist', status: 'active', trustScore: 99, model: 'claude-3.5-sonnet', tasksToday: 8, pendingTasks: 2, avgLatencyMs: 640, costPerCallUSD: 0.008, skills: ['Deadline Tracking', 'Document Status', 'Matter Monitoring', 'Risk Scoring'], lastAction: 'Flagged Talbot discovery risk' },
  { id: 'op-pipeline', name: 'Pipeline Oracle', vertical: 'lyte-revenue', type: 'domain-specialist', status: 'active', trustScore: 91, model: 'gpt-4o', tasksToday: 21, pendingTasks: 4, avgLatencyMs: 820, costPerCallUSD: 0.015, skills: ['Pipeline Analysis', 'Deal Scoring', 'Forecast Modeling', 'CRM Monitoring'], lastAction: 'Identified 3 at-risk deals' },
  { id: 'op-guardian', name: 'Guardian', vertical: 'aegis-defense', type: 'domain-specialist', status: 'active', trustScore: 99, model: 'claude-3.5-sonnet (air-gapped)', tasksToday: 6, pendingTasks: 1, avgLatencyMs: 980, costPerCallUSD: 0.009, skills: ['Threat Intelligence', 'Posture Assessment', 'Incident Triage'], lastAction: 'TG-Ember escalated to ORANGE' },
  { id: 'op-terra', name: 'Terra Analyst', vertical: 'terra-real-estate', type: 'domain-specialist', status: 'active', trustScore: 88, model: 'gpt-4o', tasksToday: 9, pendingTasks: 0, avgLatencyMs: 760, costPerCallUSD: 0.011, skills: ['Cap Rate Tracking', 'Portfolio Analysis', 'Valuation Modeling'], lastAction: 'Cap rate compression signal processed' },
  { id: 'op-watchdog', name: 'Fabric Watchdog', vertical: 'alloy-core', type: 'system', status: 'active', trustScore: 100, model: 'internal', tasksToday: 144, pendingTasks: 0, avgLatencyMs: 12, costPerCallUSD: 0, skills: ['Mesh Health', 'Layer Monitoring', 'Proof Verification', 'Latency Tracking'], lastAction: 'All 7 fabric layers nominal' },
];

const VERTICAL_COLORS: Record<string, string> = {
  'lyte-revenue': '#3b82f6', 'vessels-maritime': '#06b6d4', 'terra-real-estate': '#10b981',
  'aegis-defense': '#ef4444', 'prism-counsel': '#8b5cf6', 'carlota-jo': '#f59e0b', 'alloy-core': '#6366f1',
};

const HANDOFFS = [
  { from: 'Signal Mesh', to: 'Cascade Navigator', count: 12, vertical: 'vessels-maritime' },
  { from: 'Cascade Navigator', to: 'Covenant Layer', count: 3, vertical: 'vessels-maritime' },
  { from: 'Counsel Sentinel', to: 'MirrorEval', count: 2, vertical: 'prism-counsel' },
  { from: 'Pipeline Oracle', to: 'Covenant Layer', count: 4, vertical: 'lyte-revenue' },
  { from: 'Covenant Layer', to: 'Human Approver', count: 5, vertical: 'alloy-core' },
];

export function Agents() {
  const [selectedOp, setSelectedOp] = useState<string | null>(null);
  const activeWC = SEED_WORKCELLS.filter(w => w.status === 'running');
  const failedWC = SEED_WORKCELLS.filter(w => w.status === 'error');
  const avgTrust = Math.round(OPERATORS.reduce((acc, o) => acc + o.trustScore, 0) / OPERATORS.length);
  const totalTasks = OPERATORS.reduce((acc, o) => acc + o.tasksToday, 0);

  return (
    <Layout>
      <PageHeader
        label="OPERATOR CONTROL PLANE"
        title="Agent Operators & Runtime"
        subtitle="Active workcells, operator registry, handoff map, tool registry, execution traces, evaluation scores, and agent trust scores."
        status="DEMO"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard label="ACTIVE WORKCELLS" value={activeWC.length} sub="running" accent="#f59e0b" />
        <KpiCard label="OPERATORS" value={OPERATORS.length} sub="registered" accent="#10b981" />
        <KpiCard label="TASKS TODAY" value={totalTasks} sub="completed" accent="#3b82f6" />
        <KpiCard label="PENDING GATES" value={SEED_WORKCELLS.filter(w => w.requiresApproval && w.status === 'running').length} sub="approval needed" accent="#8b5cf6" />
        <KpiCard label="AVG TRUST SCORE" value={avgTrust} sub="out of 100" accent="#10b981" />
        <KpiCard label="FAILED CELLS" value={failedWC.length} sub="need attention" accent={failedWC.length > 0 ? '#ef4444' : '#10b981'} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Operator Registry */}
        <div className="lg:col-span-2">
          <SectionTitle>Operator Registry</SectionTitle>
          <div className="rounded-lg border overflow-hidden mb-6" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                  {['Operator', 'Vertical', 'Trust', 'Tasks', 'Latency', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-mono uppercase tracking-wide" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: '10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {OPERATORS.map((op, i) => {
                  const color = VERTICAL_COLORS[op.vertical] ?? '#9bacc4';
                  return (
                    <tr
                      key={op.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedOp(op.id === selectedOp ? null : op.id)}
                      style={{ backgroundColor: selectedOp === op.id ? 'rgba(59,130,246,0.06)' : i % 2 === 0 ? 'var(--color-a11oy-card)' : 'var(--color-a11oy-deep)', borderBottom: '1px solid var(--color-a11oy-border)' }}
                    >
                      <td className="px-3 py-2 font-medium" style={{ color: 'var(--color-a11oy-text)' }}>{op.name}</td>
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: `${color}18`, color }}>{op.vertical.split('-')[0]}</span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={op.trustScore} max={100} color={op.trustScore >= 95 ? '#10b981' : op.trustScore >= 80 ? '#f59e0b' : '#ef4444'} />
                          <span className="font-mono" style={{ color: '#10b981', whiteSpace: 'nowrap' }}>{op.trustScore}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{op.tasksToday}</td>
                      <td className="px-3 py-2 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{op.avgLatencyMs}ms</td>
                      <td className="px-3 py-2">
                        <span className="font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' }}>{op.status}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {selectedOp && (() => {
            const op = OPERATORS.find(o => o.id === selectedOp);
            if (!op) return null;
            const opWC = SEED_WORKCELLS.filter(w => w.agentSequence.some(a => a.agentId.includes(op.id.split('-').pop() ?? '')));
            return (
              <Card className="mb-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{op.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Model: {op.model}</div>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-mono" style={{ color: '#10b981' }}>Trust: {op.trustScore}/100</div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>${op.costPerCallUSD.toFixed(3)}/call</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {op.skills.map(s => (
                    <span key={s} className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-muted)', color: 'var(--color-a11oy-text-ghost)' }}>{s}</span>
                  ))}
                </div>
                <div className="text-xs px-3 py-2 rounded mb-3" style={{ backgroundColor: 'var(--color-a11oy-deep)', border: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-sub)' }}>
                  Last: {op.lastAction}
                </div>
                {opWC.length > 0 && (
                  <div>
                    <div className="text-xs font-mono mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>LINKED WORKCELLS</div>
                    {opWC.slice(0, 3).map(w => (
                      <div key={w.id} className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>→ {w.name}</div>
                    ))}
                  </div>
                )}
                <ApprovalGate label="All material actions from this operator require human approval" />
              </Card>
            );
          })()}

          {/* MirrorEval Scores */}
          <SectionTitle>MirrorEval Scores</SectionTitle>
          <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-a11oy-border)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-a11oy-deep)' }}>
                  {['Workcell', 'Verdict', 'Score', 'Evaluator', 'Flags'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-mono uppercase tracking-wide" style={{ color: 'var(--color-a11oy-text-ghost)', fontSize: '10px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SEED_WORKCELLS.slice(0, 10).map((wc, i) => (
                  <tr key={wc.id} style={{ backgroundColor: i % 2 === 0 ? 'var(--color-a11oy-card)' : 'var(--color-a11oy-deep)', borderBottom: '1px solid var(--color-a11oy-border)' }}>
                    <td className="px-3 py-2 max-w-xs">
                      <div className="truncate" style={{ color: 'var(--color-a11oy-text)' }}>{wc.name}</div>
                    </td>
                    <td className="px-3 py-2"><VerdictBadge verdict={wc.mirrorEvalResult.verdict} /></td>
                    <td className="px-3 py-2 font-mono" style={{ color: '#10b981' }}>{Math.round(wc.mirrorEvalResult.score * 100)}%</td>
                    <td className="px-3 py-2 font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{wc.mirrorEvalResult.evaluatorModel}</td>
                    <td className="px-3 py-2" style={{ color: wc.mirrorEvalResult.flags.length > 0 ? '#f59e0b' : '#10b981' }}>
                      {wc.mirrorEvalResult.flags.length > 0 ? wc.mirrorEvalResult.flags[0] : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: handoffs, memory, cost */}
        <div className="flex flex-col gap-6">
          {/* Active Workcells */}
          <div>
            <SectionTitle>Active Workcells ({activeWC.length})</SectionTitle>
            <div className="flex flex-col gap-2">
              {activeWC.slice(0, 8).map(wc => (
                <Card key={wc.id} className="text-xs">
                  <div className="font-medium truncate mb-0.5" style={{ color: 'var(--color-a11oy-text)' }}>{wc.name}</div>
                  <div className="truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{wc.objective}</div>
                  {wc.requiresApproval && (
                    <div className="mt-1 text-xs font-mono" style={{ color: '#8b5cf6' }}>⚬ approval pending</div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          {/* Handoff Map */}
          <div>
            <SectionTitle>Handoff Map</SectionTitle>
            <div className="flex flex-col gap-2">
              {HANDOFFS.map((h, i) => {
                const color = VERTICAL_COLORS[h.vertical] ?? '#9bacc4';
                return (
                  <div key={i} className="text-xs flex items-center gap-2">
                    <div className="flex-1 px-2 py-1.5 rounded" style={{ backgroundColor: 'var(--color-a11oy-card)', border: '1px solid var(--color-a11oy-border)' }}>
                      <span style={{ color: 'var(--color-a11oy-text)' }}>{h.from}</span>
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}> → </span>
                      <span style={{ color }}>{h.to}</span>
                    </div>
                    <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{h.count}x</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Memory Health */}
          <div>
            <SectionTitle>Memory Health</SectionTitle>
            <Card className="text-xs">
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Short-term</span>
                    <span className="font-mono" style={{ color: '#10b981' }}>84 KB / 512 KB</span>
                  </div>
                  <ProgressBar value={84} max={512} color="#10b981" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Long-term</span>
                    <span className="font-mono" style={{ color: '#3b82f6' }}>1.2 MB / 10 MB</span>
                  </div>
                  <ProgressBar value={1200} max={10000} color="#3b82f6" />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Proof cache</span>
                    <span className="font-mono" style={{ color: '#8b5cf6' }}>342 KB / 1 MB</span>
                  </div>
                  <ProgressBar value={342} max={1000} color="#8b5cf6" />
                </div>
              </div>
            </Card>
          </div>

          {/* Cost & Latency */}
          <div>
            <SectionTitle>Cost & Latency</SectionTitle>
            <Card className="text-xs">
              <div className="flex flex-col gap-2">
                {OPERATORS.map(op => (
                  <div key={op.id} className="flex items-center justify-between">
                    <span className="truncate" style={{ color: 'var(--color-a11oy-text-sub)' }}>{op.name}</span>
                    <div className="flex items-center gap-3 font-mono flex-shrink-0">
                      <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>{op.avgLatencyMs}ms</span>
                      <span style={{ color: '#b08d52' }}>${op.costPerCallUSD.toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Failure Replay */}
          {failedWC.length > 0 && (
            <div>
              <SectionTitle>Failure Replay Queue</SectionTitle>
              <div className="flex flex-col gap-2">
                {failedWC.map(wc => (
                  <Card key={wc.id} className="text-xs">
                    <div className="font-medium mb-0.5" style={{ color: '#ef4444' }}>{wc.name}</div>
                    <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>Status: error — replay available</div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
