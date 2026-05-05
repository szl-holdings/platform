import { useState } from 'react';
import { Layout } from '../../components/layout';
import { PageHeader, Card, KpiCard } from '../../components/ui';

const GOLD = '#c9b787';

const MODES = [
  { id: 'read-only', label: 'Read-Only', icon: '👁', desc: 'Agent can query, observe, and report. No write actions permitted. Suitable for monitoring and intelligence gathering.', covenantGate: 'Blocks all writes', humanApproval: 'N/A', autoExecute: 'Reads only', color: '#8a8a8a' },
  { id: 'suggest', label: 'Suggest', icon: '💬', desc: 'Agent formulates recommendations but cannot execute. All actions surfaced as suggestions to a human approver.', covenantGate: 'Evaluates; blocks execution', humanApproval: 'Required for all actions', autoExecute: 'None', color: '#4d8fcc' },
  { id: 'supervised', label: 'Supervised', icon: '🤝', desc: 'Agent auto-executes low-blast-radius actions. High-blast-radius or irreversible actions require human approval.', covenantGate: 'Evaluates; approves low-risk', humanApproval: 'Required for high-risk actions', autoExecute: 'Low-blast-radius only', color: GOLD },
  { id: 'governed-autonomous', label: 'Governed Autonomous', icon: '⚙', desc: 'Agent acts autonomously within the Constitution scope. Every action passes through the Covenant Policy gate. No human approval unless gate escalates.', covenantGate: 'Full gate — blocks on violation', humanApproval: 'Only on gate escalation', autoExecute: 'All within scope', color: '#22c55e' },
  { id: 'sovereign', label: 'Sovereign', icon: '🛡', desc: 'Air-gapped autonomous execution for classified or regulated environments. Local Proof Chain. Zero external calls.', covenantGate: 'Local sovereign gate', humanApproval: 'On-premise approver only', autoExecute: 'All within sovereign scope', color: '#a78bfa' },
];

interface AgentConfig {
  agent: string;
  mode: string;
  since: string;
  actions: number;
  approvals: number;
  blocks: number;
}

const CONFIGS: AgentConfig[] = [
  { agent: 'Cascade Navigator', mode: 'governed-autonomous', since: '2026-03-01', actions: 8421, approvals: 142, blocks: 23 },
  { agent: 'Counsel Sentinel', mode: 'supervised', since: '2026-01-22', actions: 1892, approvals: 892, blocks: 8 },
  { agent: 'Guardian NOC', mode: 'governed-autonomous', since: '2026-03-01', actions: 48210, approvals: 421, blocks: 102 },
  { agent: 'Terra Analyst', mode: 'suggest', since: '2026-04-15', actions: 421, approvals: 421, blocks: 2 },
  { agent: 'Research Swarm', mode: 'supervised', since: '2026-04-01', actions: 982, approvals: 310, blocks: 5 },
];

export function AutonomyModes() {
  const [selected, setSelected] = useState('governed-autonomous');

  const activeMode = MODES.find(m => m.id === selected)!;

  return (
    <Layout>
      <PageHeader
        label="DECISIONS / AUTONOMY MODES"
        title="Agent Autonomy Modes"
        subtitle="Five graduated autonomy levels — from Read-Only observation to Sovereign air-gapped autonomous execution. Mode selection is governed by the Constitution and cannot be changed without alignment review."
        status="LIVE"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KpiCard label="GOVERNED AUTONOMOUS" value={String(CONFIGS.filter(c => c.mode === 'governed-autonomous').length)} sub="agents" accent="#22c55e" />
        <KpiCard label="SUPERVISED" value={String(CONFIGS.filter(c => c.mode === 'supervised').length)} sub="agents" accent={GOLD} />
        <KpiCard label="SUGGEST MODE" value={String(CONFIGS.filter(c => c.mode === 'suggest').length)} sub="agents" accent="#4d8fcc" />
        <KpiCard label="COVENANT BLOCKS" value={String(CONFIGS.reduce((s, c) => s + c.blocks, 0))} sub="total (all agents)" accent={GOLD} />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {MODES.map(m => (
          <button key={m.id} type="button" onClick={() => setSelected(m.id)}
            className="flex-1 min-w-36 p-3 rounded-lg border text-left transition-colors"
            style={{ backgroundColor: selected === m.id ? `${m.color}0e` : 'var(--color-a11oy-card)', borderColor: selected === m.id ? `${m.color}40` : 'var(--color-a11oy-border)', cursor: 'pointer' }}>
            <div className="text-lg mb-1">{m.icon}</div>
            <div className="text-xs font-medium" style={{ color: selected === m.id ? m.color : 'var(--color-a11oy-text)' }}>{m.label}</div>
          </button>
        ))}
      </div>

      <Card className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{activeMode.icon}</span>
          <div>
            <div className="font-medium" style={{ color: activeMode.color }}>{activeMode.label}</div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{activeMode.desc}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Covenant Gate', value: activeMode.covenantGate },
            { label: 'Human Approval', value: activeMode.humanApproval },
            { label: 'Auto-Execute', value: activeMode.autoExecute },
          ].map(kv => (
            <div key={kv.label} className="p-3 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <div className="text-xs mb-1" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{kv.label}</div>
              <div className="text-xs font-medium" style={{ color: 'var(--color-a11oy-text-sub)' }}>{kv.value}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Agent Autonomy Configurations</div>
      <div className="space-y-2">
        {CONFIGS.map(cfg => {
          const mode = MODES.find(m => m.id === cfg.mode)!;
          return (
            <div key={cfg.agent} className="rounded-lg border p-4"
              style={{ backgroundColor: 'var(--color-a11oy-card)', borderColor: 'var(--color-a11oy-border)' }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-medium text-sm" style={{ color: 'var(--color-a11oy-text)' }}>{cfg.agent}</span>
                  <span className="ml-2 text-xs font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${mode.color}18`, color: mode.color }}>{mode.label}</span>
                </div>
                <div className="text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>since {cfg.since}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Actions: </span><span style={{ color: 'var(--color-a11oy-text-sub)' }}>{cfg.actions.toLocaleString()}</span></div>
                <div><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Approvals: </span><span style={{ color: GOLD }}>{cfg.approvals}</span></div>
                <div><span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Blocks: </span><span style={{ color: cfg.blocks > 0 ? '#f87171' : '#22c55e' }}>{cfg.blocks}</span></div>
              </div>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
