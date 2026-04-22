import {
  CheckCircle,
  GitBranch,
  Play,
  Plus,
  RefreshCw,
  Shield,
  Terminal,
  Zap,
} from 'lucide-react';
import { useState } from 'react';

const GOLD = '#d4a054';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

type StepType = 'action' | 'condition' | 'approval' | 'parallel' | 'rollback';

interface RunbookStep {
  id: string;
  type: StepType;
  label: string;
  description: string;
  variables?: string[];
  condition?: string;
  estimatedMs: number;
}

interface Runbook {
  id: string;
  name: string;
  category: string;
  version: string;
  executions: number;
  successRate: number;
  avgDurationMs: number;
  lastRun: number;
  steps: RunbookStep[];
  tags: string[];
  autoTrigger: boolean;
  description: string;
}

const TYPE_COLOR: Record<StepType, string> = {
  action: '#3b82f6',
  condition: '#f59e0b',
  approval: '#8b5cf6',
  parallel: '#10b981',
  rollback: '#ef4444',
};

const TYPE_ICON: Record<StepType, any> = {
  action: Terminal,
  condition: GitBranch,
  approval: Shield,
  parallel: Zap,
  rollback: RefreshCw,
};

const RUNBOOKS: Runbook[] = [
  {
    id: 'rb-001',
    name: 'Pod OOM Recovery',
    category: 'Infra',
    version: 'v3.2',
    executions: 142,
    successRate: 97.2,
    avgDurationMs: 18400,
    lastRun: Date.now() - 1000 * 60 * 8,
    autoTrigger: true,
    description:
      'Automated recovery for pod OOM kill events — cordon, drain, restart, health verify.',
    tags: ['kubernetes', 'memory', 'pod'],
    steps: [
      {
        id: 's1',
        type: 'action',
        label: 'Cordon Pod',
        description: 'kubectl cordon <pod-name>',
        variables: ['POD_NAME', 'NAMESPACE'],
        estimatedMs: 400,
      },
      {
        id: 's2',
        type: 'action',
        label: 'Drain Connections',
        description: 'Gracefully drain active connections with 30s timeout',
        variables: ['DRAIN_TIMEOUT'],
        estimatedMs: 2000,
      },
      {
        id: 's3',
        type: 'condition',
        label: 'Memory Leak Check',
        description: 'If memory growth > 2x baseline, trigger deep analysis before restart',
        condition: 'memory_growth_rate > 2.0',
        estimatedMs: 500,
      },
      {
        id: 's4',
        type: 'action',
        label: 'Restart Pod',
        description: 'kubectl rollout restart deployment/<name>',
        estimatedMs: 6000,
      },
      {
        id: 's5',
        type: 'action',
        label: 'Health Check × 3',
        description: 'Probe readiness endpoint — all 3 must pass within 30s',
        estimatedMs: 9000,
      },
      {
        id: 's6',
        type: 'action',
        label: 'Restore Traffic',
        description: 'Re-enable load balancer routing to recovered pod',
        estimatedMs: 300,
      },
      {
        id: 's7',
        type: 'rollback',
        label: 'Rollback Gate',
        description: 'If health checks fail after 2 attempts, roll back deployment',
        estimatedMs: 100,
      },
    ],
  },
  {
    id: 'rb-003',
    name: 'DB Primary Failover',
    category: 'Database',
    version: 'v2.1',
    executions: 12,
    successRate: 100,
    avgDurationMs: 8900,
    lastRun: Date.now() - 1000 * 60 * 22,
    autoTrigger: true,
    description: 'Automatic PostgreSQL primary failover to warm standby with WAL lag safety check.',
    tags: ['postgres', 'failover', 'ha'],
    steps: [
      {
        id: 's1',
        type: 'condition',
        label: 'WAL Lag Safety Check',
        description: 'Abort if replica WAL lag > 5 seconds — risk of data loss too high',
        condition: 'wal_lag_seconds < 5',
        estimatedMs: 200,
      },
      {
        id: 's2',
        type: 'approval',
        label: 'Auto-Approval Gate',
        description: 'Proceed automatically if WAL lag < 1s, else require on-call sign-off',
        estimatedMs: 0,
      },
      {
        id: 's3',
        type: 'action',
        label: 'Promote Replica',
        description: 'pg_ctl promote on standby node',
        estimatedMs: 4200,
      },
      {
        id: 's4',
        type: 'action',
        label: 'Update DNS CNAME',
        description: 'Route pg.internal to new primary IP',
        estimatedMs: 1100,
      },
      {
        id: 's5',
        type: 'action',
        label: 'Validate Writes',
        description: 'Run synthetic write test — 5 queries must succeed',
        estimatedMs: 3400,
      },
    ],
  },
  {
    id: 'rb-004',
    name: 'Queue Backlog Drain',
    category: 'Messaging',
    version: 'v4.0',
    executions: 204,
    successRate: 88.7,
    avgDurationMs: 46000,
    lastRun: Date.now() - 1000 * 60 * 45,
    autoTrigger: true,
    description:
      'Clear message queue backlog overflow with temporary consumer scale-up and DLQ flush.',
    tags: ['kafka', 'queue', 'consumer'],
    steps: [
      {
        id: 's1',
        type: 'action',
        label: 'Pause Producers',
        description: 'Apply backpressure to upstream producers',
        estimatedMs: 220,
      },
      {
        id: 's2',
        type: 'parallel',
        label: 'Scale Consumers × 3',
        description: 'Spawn 3 additional consumer replicas in parallel',
        estimatedMs: 8400,
      },
      {
        id: 's3',
        type: 'action',
        label: 'Drain Backlog',
        description: 'Process all queued messages',
        estimatedMs: 34000,
      },
      {
        id: 's4',
        type: 'action',
        label: 'Flush DLQ',
        description: 'Requeue DLQ messages for reprocessing',
        estimatedMs: 4200,
      },
      {
        id: 's5',
        type: 'action',
        label: 'Resume Producers',
        description: 'Release backpressure — restore normal flow',
        estimatedMs: 180,
      },
    ],
  },
  {
    id: 'rb-007',
    name: 'Canary Rollback',
    category: 'Deploy',
    version: 'v1.5',
    executions: 28,
    successRate: 92.9,
    avgDurationMs: 12000,
    lastRun: Date.now() - 1000 * 60 * 60 * 3,
    autoTrigger: false,
    description:
      'Halt canary deployment and restore stable version when error rate delta exceeds threshold.',
    tags: ['canary', 'deploy', 'rollback'],
    steps: [
      {
        id: 's1',
        type: 'action',
        label: 'Halt Canary Traffic',
        description: 'Redirect 100% traffic back to stable',
        estimatedMs: 500,
      },
      {
        id: 's2',
        type: 'action',
        label: 'Scale Down Canary',
        description: 'kubectl scale deployment/<canary> --replicas=0',
        estimatedMs: 3000,
      },
      {
        id: 's3',
        type: 'approval',
        label: 'On-Call Confirmation',
        description: 'Require ACK from on-call engineer before completing rollback',
        estimatedMs: 0,
      },
      {
        id: 's4',
        type: 'action',
        label: 'Restore Stable Image',
        description: 'kubectl set image to last known-good tag',
        estimatedMs: 6000,
      },
      {
        id: 's5',
        type: 'action',
        label: 'Smoke Test',
        description: 'Validate stable endpoints respond correctly',
        estimatedMs: 2500,
      },
    ],
  },
];

const EXEC_ANALYTICS = [
  { label: 'Total Executions', value: '386', color: DS.text.primary },
  { label: 'Avg Success Rate', value: '93.2%', color: '#10b981' },
  { label: 'MTTR Saved Today', value: '4.2h', color: GOLD },
  { label: 'Auto-Triggered', value: '78%', color: '#3b82f6' },
];

function StepNode({ step, index }: { step: RunbookStep; index: number }) {
  const Icon = TYPE_ICON[step.type];
  const color = TYPE_COLOR[step.type];
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div className="w-px flex-1 mt-1" style={{ background: DS.border, minHeight: 16 }} />
      </div>
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[9px] font-mono uppercase tracking-wider" style={{ color }}>
            {step.type}
          </span>
          <span className="text-[10px] font-semibold" style={{ color: DS.text.primary }}>
            {step.label}
          </span>
          <span className="text-[9px] font-mono ml-auto" style={{ color: DS.text.muted }}>
            ~{(step.estimatedMs / 1000).toFixed(1)}s
          </span>
        </div>
        <p className="text-[10px]" style={{ color: DS.text.secondary }}>
          {step.description}
        </p>
        {step.condition && (
          <div
            className="mt-1 text-[9px] font-mono px-2 py-1 rounded"
            style={{ background: 'rgba(245,158,11,0.06)', color: '#f59e0b' }}
          >
            if: {step.condition}
          </div>
        )}
        {step.variables && step.variables.length > 0 && (
          <div className="mt-1 flex gap-1 flex-wrap">
            {step.variables.map((v) => (
              <span
                key={v}
                className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(59,130,246,0.08)', color: '#3b82f6' }}
              >
                ${v}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RunbookStudio() {
  const [selected, setSelected] = useState<Runbook>(RUNBOOKS[0]);
  const [testMode, setTestMode] = useState(false);
  const [testRunning, setTestRunning] = useState(false);
  const [testStep, setTestStep] = useState(0);

  const runSandboxTest = () => {
    if (testRunning) return;
    setTestMode(true);
    setTestRunning(true);
    setTestStep(0);
    const total = selected.steps.length;
    let i = 0;
    const advance = () => {
      i++;
      setTestStep(i);
      if (i < total) setTimeout(advance, 800);
      else setTestRunning(false);
    };
    setTimeout(advance, 800);
  };

  return (
    <div className="h-full overflow-auto" style={{ background: '#080c14' }}>
      <div className="max-w-[1400px] mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight" style={{ color: DS.text.primary }}>
              Runbook Automation Studio
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
              Visual runbook builder · conditional logic · sandbox testing · execution analytics
            </p>
          </div>
          <button
            className="flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-medium"
            style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: GOLD }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Runbook
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {EXEC_ANALYTICS.map((s) => (
            <div
              key={s.label}
              className="rounded-lg p-3"
              style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-1"
                style={{ color: DS.text.muted }}
              >
                {s.label}
              </div>
              <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
          {/* Runbook list */}
          <div className="space-y-2">
            <div
              className="text-[9px] uppercase tracking-widest px-1 mb-2"
              style={{ color: DS.text.muted }}
            >
              Runbook Library
            </div>
            {RUNBOOKS.map((rb) => (
              <button
                key={rb.id}
                onClick={() => {
                  setSelected(rb);
                  setTestMode(false);
                  setTestStep(0);
                }}
                className="w-full text-left p-3 rounded-lg transition-all"
                style={{
                  background: selected.id === rb.id ? `${GOLD}08` : DS.surface,
                  border: `1px solid ${selected.id === rb.id ? `${GOLD}30` : DS.border}`,
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[10px] font-semibold" style={{ color: DS.text.primary }}>
                    {rb.name}
                  </span>
                  <span className="text-[8px] font-mono shrink-0" style={{ color: DS.text.muted }}>
                    {rb.version}
                  </span>
                </div>
                <div
                  className="flex items-center gap-2 text-[9px]"
                  style={{ color: DS.text.muted }}
                >
                  <span>{rb.category}</span>
                  <span>·</span>
                  <span style={{ color: '#10b981' }}>{rb.successRate}%</span>
                  <span>·</span>
                  <span>{rb.executions} runs</span>
                </div>
                {rb.autoTrigger && (
                  <div className="mt-1 text-[8px] font-mono" style={{ color: '#3b82f6' }}>
                    ⚡ Auto-trigger enabled
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Runbook detail + builder */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <div
              className="p-4 border-b flex items-start justify-between gap-3"
              style={{ borderColor: DS.border }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono" style={{ color: DS.text.muted }}>
                    {selected.id}
                  </span>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                    style={{ background: `${GOLD}10`, color: GOLD }}
                  >
                    {selected.version}
                  </span>
                  {selected.autoTrigger && (
                    <span
                      className="text-[8px] px-1.5 py-0.5 rounded font-mono"
                      style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}
                    >
                      Auto-trigger
                    </span>
                  )}
                </div>
                <h2 className="text-sm font-semibold mb-1" style={{ color: DS.text.primary }}>
                  {selected.name}
                </h2>
                <p className="text-[10px]" style={{ color: DS.text.secondary }}>
                  {selected.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selected.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[8px] px-1.5 py-0.5 rounded"
                      style={{ background: 'rgba(255,255,255,0.04)', color: DS.text.muted }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={runSandboxTest}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-medium"
                  style={{
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    color: '#10b981',
                  }}
                >
                  {testRunning ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                  {testRunning ? 'Running...' : 'Sandbox Test'}
                </button>
              </div>
            </div>

            <div
              className="grid grid-cols-1 md:grid-cols-[1fr_240px] divide-x"
              style={{ borderColor: DS.border }}
            >
              <div className="p-4 overflow-auto" style={{ maxHeight: 520 }}>
                <div
                  className="text-[9px] uppercase tracking-widest mb-3"
                  style={{ color: DS.text.muted }}
                >
                  Execution Flow · {selected.steps.length} steps
                </div>

                {selected.steps.map((step, i) => (
                  <div key={step.id} className="relative">
                    {testMode && (
                      <div className="absolute left-0 top-2 z-10">
                        {i < testStep ? (
                          <CheckCircle className="w-4 h-4" style={{ color: '#10b981' }} />
                        ) : i === testStep && testRunning ? (
                          <RefreshCw className="w-4 h-4 animate-spin" style={{ color: GOLD }} />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                      </div>
                    )}
                    <div style={{ paddingLeft: testMode ? 24 : 0 }}>
                      <StepNode step={step} index={i} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4">
                <div
                  className="text-[9px] uppercase tracking-widest mb-3"
                  style={{ color: DS.text.muted }}
                >
                  Execution Analytics
                </div>
                <div className="space-y-3">
                  {[
                    { k: 'Total Runs', v: selected.executions },
                    { k: 'Success Rate', v: `${selected.successRate}%`, color: '#10b981' },
                    { k: 'Avg Duration', v: `${(selected.avgDurationMs / 1000).toFixed(0)}s` },
                    {
                      k: 'Last Run',
                      v: `${Math.floor((Date.now() - selected.lastRun) / 60000)}m ago`,
                    },
                  ].map((r) => (
                    <div key={r.k} className="flex justify-between text-[10px]">
                      <span style={{ color: DS.text.muted }}>{r.k}</span>
                      <span
                        className="font-mono"
                        style={{ color: (r as any).color ?? DS.text.primary }}
                      >
                        {r.v}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${DS.border}` }}>
                  <div
                    className="text-[9px] uppercase tracking-widest mb-2"
                    style={{ color: DS.text.muted }}
                  >
                    Step Types
                  </div>
                  {(Object.keys(TYPE_COLOR) as StepType[]).map((t) => {
                    const count = selected.steps.filter((s) => s.type === t).length;
                    if (!count) return null;
                    return (
                      <div key={t} className="flex items-center justify-between text-[9px] mb-1">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: TYPE_COLOR[t] }}
                          />
                          <span style={{ color: DS.text.secondary }} className="capitalize">
                            {t}
                          </span>
                        </div>
                        <span className="font-mono" style={{ color: DS.text.muted }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {testMode && !testRunning && testStep >= selected.steps.length && (
                  <div
                    className="mt-4 p-3 rounded"
                    style={{
                      background: 'rgba(16,185,129,0.06)',
                      border: '1px solid rgba(16,185,129,0.15)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-3.5 h-3.5" style={{ color: '#10b981' }} />
                      <span className="text-[10px] font-semibold" style={{ color: '#10b981' }}>
                        Sandbox Passed
                      </span>
                    </div>
                    <p className="text-[9px]" style={{ color: DS.text.muted }}>
                      All {selected.steps.length} steps completed successfully in sandbox
                      environment.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
