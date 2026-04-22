import {
  BookOpen,
  Bot,
  Brain,
  CheckCircle,
  Clock,
  RefreshCw,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const GOLD = '#d4a054';
const DS = {
  surface: 'rgba(255,255,255,0.025)',
  surfaceHover: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.06)',
  text: {
    primary: 'rgba(255,255,255,0.88)',
    secondary: 'rgba(255,255,255,0.5)',
    muted: 'rgba(255,255,255,0.25)',
  },
};

type AgentState =
  | 'idle'
  | 'detecting'
  | 'diagnosing'
  | 'selecting'
  | 'executing'
  | 'verifying'
  | 'resolved'
  | 'escalated'
  | 'rolled_back';
type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface ReasoningStep {
  id: string;
  phase: string;
  thought: string;
  confidence: number;
  durationMs: number;
  output?: string;
}

interface RunbookStep {
  id: string;
  label: string;
  status: 'done' | 'running' | 'pending' | 'failed' | 'skipped';
  durationMs?: number;
  output?: string;
}

interface RemediationCase {
  id: string;
  title: string;
  service: string;
  severity: RiskLevel;
  detectedAt: number;
  agent: string;
  state: AgentState;
  runbook: string;
  runbookSteps: RunbookStep[];
  reasoning: ReasoningStep[];
  mttrSaved: number;
  autoResolved: boolean;
  rollbackAvailable: boolean;
  auditHash: string;
  description: string;
}

const SEV_COLOR: Record<RiskLevel, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#f59e0b',
  low: '#3b82f6',
};

const STATE_COLOR: Record<AgentState, string> = {
  idle: '#6b7280',
  detecting: '#3b82f6',
  diagnosing: '#8b5cf6',
  selecting: '#f59e0b',
  executing: '#f97316',
  verifying: '#10b981',
  resolved: '#10b981',
  escalated: '#ef4444',
  rolled_back: '#f97316',
};

const STATE_LABEL: Record<AgentState, string> = {
  idle: 'Idle',
  detecting: 'Detecting',
  diagnosing: 'Diagnosing',
  selecting: 'Selecting Runbook',
  executing: 'Executing',
  verifying: 'Verifying Fix',
  resolved: 'Resolved',
  escalated: 'Escalated',
  rolled_back: 'Rolled Back',
};

const SEED_CASES: RemediationCase[] = [
  {
    id: 'NOC-8821',
    title: 'API Gateway OOM — Cascading Latency',
    service: 'api-gateway',
    severity: 'critical',
    detectedAt: Date.now() - 1000 * 60 * 8,
    agent: 'AGENT-ALPHA',
    state: 'resolved',
    runbook: 'RUNBOOK-001: Pod drain → restart → reroute',
    runbookSteps: [
      {
        id: 's1',
        label: 'Cordon affected pod',
        status: 'done',
        durationMs: 410,
        output: 'Pod api-gateway-7f9d4c-xkbwp cordoned',
      },
      {
        id: 's2',
        label: 'Drain existing connections',
        status: 'done',
        durationMs: 1820,
        output: '218 connections drained gracefully',
      },
      {
        id: 's3',
        label: 'Restart pod',
        status: 'done',
        durationMs: 6100,
        output: 'Pod restarted — new pod api-gateway-7f9d4c-lp8qz Ready',
      },
      {
        id: 's4',
        label: 'Health check (3 probes)',
        status: 'done',
        durationMs: 9000,
        output: 'All probes passed — P99 latency 34ms (baseline 31ms)',
      },
      {
        id: 's5',
        label: 'Restore traffic routing',
        status: 'done',
        durationMs: 320,
        output: 'Traffic rerouted, error rate 0.02%',
      },
      {
        id: 's6',
        label: 'Close ticket & audit',
        status: 'done',
        durationMs: 180,
        output: 'Ticket INC-44821 closed — audit hash 0xa3f1e9c2',
      },
    ],
    reasoning: [
      {
        id: 'r1',
        phase: 'Detect',
        thought:
          'OOM kill event received on api-gateway-7f9d4c-xkbwp. 3 restarts in 10 min. Memory usage spike to 94% before kill.',
        confidence: 99,
        durationMs: 120,
      },
      {
        id: 'r2',
        phase: 'Diagnose',
        thought:
          'Root cause: request size overflow — large batch GraphQL query at 14:22:07 consumed 1.8GB. No leak detected. Isolated spike.',
        confidence: 94,
        durationMs: 840,
        output: 'Root cause: batch query overflow (GraphQL introspection flood)',
      },
      {
        id: 'r3',
        phase: 'Risk assess',
        thought:
          'Risk: MEDIUM. Pattern known (matched 12 prior incidents). Safe to auto-remediate. Blast radius: 1 pod, 1 service. No downstream DB impact detected.',
        confidence: 92,
        durationMs: 310,
      },
      {
        id: 'r4',
        phase: 'Runbook select',
        thought:
          'RUNBOOK-001 matched with 97.2% historical success on identical pattern. Alternative: RUNBOOK-007 (scale) — rejected, CPU nominal.',
        confidence: 97,
        durationMs: 200,
        output: 'Selected RUNBOOK-001',
      },
      {
        id: 'r5',
        phase: 'Execute',
        thought: 'Executing pod drain → restart sequence. Monitoring error rate during reroute.',
        confidence: 95,
        durationMs: 18000,
      },
      {
        id: 'r6',
        phase: 'Verify',
        thought:
          'Post-restart health checks passed. Latency returned to 34ms (baseline 31ms). Memory at 42%. Resolved.',
        confidence: 99,
        durationMs: 9200,
        output: 'VERIFIED — all SLOs met',
      },
    ],
    mttrSaved: 34,
    autoResolved: true,
    rollbackAvailable: true,
    auditHash: '0xa3f1e9c2',
    description:
      'API gateway pod OOM kill causing elevated 5xx errors and latency degradation across all downstream services.',
  },
  {
    id: 'NOC-8820',
    title: 'DB Primary Failover — Write Timeout',
    service: 'postgres-primary',
    severity: 'critical',
    detectedAt: Date.now() - 1000 * 60 * 22,
    agent: 'AGENT-BETA',
    state: 'resolved',
    runbook: 'RUNBOOK-003: Promote replica → Update DNS → Validate',
    runbookSteps: [
      {
        id: 's1',
        label: 'Detect primary failure',
        status: 'done',
        durationMs: 280,
        output: '3 consecutive health check failures on pg-primary-01',
      },
      {
        id: 's2',
        label: 'Promote standby replica',
        status: 'done',
        durationMs: 4200,
        output: 'pg-replica-01 promoted to primary (WAL lag: 0.2s)',
      },
      {
        id: 's3',
        label: 'Update DNS routing',
        status: 'done',
        durationMs: 1100,
        output: 'pg.internal → 10.0.14.22 — propagated in 1.1s',
      },
      {
        id: 's4',
        label: 'Validate write operations',
        status: 'done',
        durationMs: 3400,
        output: 'Write test passed — 847 queued writes flushed',
      },
      {
        id: 's5',
        label: 'Notify on-call & audit',
        status: 'done',
        durationMs: 150,
        output: 'PagerDuty ACK sent. Audit: 0xb2d4a1f7',
      },
    ],
    reasoning: [
      {
        id: 'r1',
        phase: 'Detect',
        thought:
          'Write timeouts spiking — pg-primary-01 health check failing. Replica lag 0.2s — within safe failover threshold.',
        confidence: 99,
        durationMs: 95,
      },
      {
        id: 'r2',
        phase: 'Diagnose',
        thought:
          'Primary disk I/O saturation (100%) — likely storage controller failure. Replica fully in sync (0.2s lag acceptable).',
        confidence: 91,
        durationMs: 620,
      },
      {
        id: 'r3',
        phase: 'Risk assess',
        thought:
          'HIGH risk — data loss possible if WAL lag > 5s. Current: 0.2s. Proceed. Failover is safer than continued primary degradation.',
        confidence: 88,
        durationMs: 400,
      },
      {
        id: 'r4',
        phase: 'Execute',
        thought:
          'RUNBOOK-003 executing. Promoting replica. Coordinating DNS cutover without split-brain risk.',
        confidence: 96,
        durationMs: 8900,
      },
      {
        id: 'r5',
        phase: 'Verify',
        thought:
          'All write validation passed. 847 queued writes flushed. P99 write latency back to 8ms. Resolved.',
        confidence: 99,
        durationMs: 3400,
      },
    ],
    mttrSaved: 87,
    autoResolved: true,
    rollbackAvailable: false,
    auditHash: '0xb2d4a1f7',
    description:
      'PostgreSQL primary node disk I/O saturation causing write timeouts. Automated failover to warm standby replica.',
  },
  {
    id: 'NOC-8819',
    title: 'Payment Service — Novel Error Pattern',
    service: 'payment-processor',
    severity: 'high',
    detectedAt: Date.now() - 1000 * 60 * 5,
    agent: 'AGENT-GAMMA',
    state: 'escalated',
    runbook: 'N/A — Novel pattern',
    runbookSteps: [
      { id: 's1', label: 'Anomaly classification', status: 'done', durationMs: 820 },
      {
        id: 's2',
        label: 'Pattern library lookup',
        status: 'done',
        durationMs: 340,
        output: 'No match found in 847 known patterns',
      },
      {
        id: 's3',
        label: 'Blast radius assessment',
        status: 'done',
        durationMs: 510,
        output: 'Blast radius: 3 services, ~$12k/hr revenue exposure',
      },
      { id: 's4', label: 'Escalate to on-call engineer', status: 'running', durationMs: 0 },
    ],
    reasoning: [
      {
        id: 'r1',
        phase: 'Detect',
        thought:
          'Payment processor returning error code 4291 — not seen in prior incident history. Error rate 8.4%.',
        confidence: 99,
        durationMs: 110,
      },
      {
        id: 'r2',
        phase: 'Diagnose',
        thought:
          'Error 4291 matches no known failure pattern. Stripe upstream status nominal. Internal circuit breaker NOT tripped.',
        confidence: 72,
        durationMs: 1100,
        output: 'Novel error — escalation required',
      },
      {
        id: 'r3',
        phase: 'Risk assess',
        thought:
          'Revenue impact: $12k/hr. Novel pattern — autonomous action risk too high. Escalating with full context to on-call.',
        confidence: 95,
        durationMs: 200,
      },
    ],
    mttrSaved: 0,
    autoResolved: false,
    rollbackAvailable: false,
    auditHash: '0xc5e8f3a2',
    description:
      'Novel error code 4291 in payment processor — no known runbook match. Escalating to on-call with full diagnostic context.',
  },
  {
    id: 'NOC-8817',
    title: 'Queue Backlog — Message Consumer Lag',
    service: 'order-processor',
    severity: 'medium',
    detectedAt: Date.now() - 1000 * 60 * 45,
    agent: 'AGENT-DELTA',
    state: 'resolved',
    runbook: 'RUNBOOK-004: Pause → Drain → Flush DLQ → Resume',
    runbookSteps: [
      { id: 's1', label: 'Pause message producers', status: 'done', durationMs: 220 },
      {
        id: 's2',
        label: 'Scale consumers +3',
        status: 'done',
        durationMs: 8400,
        output: '3 additional consumers active',
      },
      {
        id: 's3',
        label: 'Drain backlog',
        status: 'done',
        durationMs: 34000,
        output: '52,814 messages drained',
      },
      {
        id: 's4',
        label: 'Flush DLQ',
        status: 'done',
        durationMs: 4200,
        output: '1,247 DLQ messages requeued',
      },
      { id: 's5', label: 'Resume producers', status: 'done', durationMs: 180 },
    ],
    reasoning: [
      {
        id: 'r1',
        phase: 'Detect',
        thought:
          'Queue depth exceeded 50k messages threshold. Consumer lag growing at 2,400 msg/min.',
        confidence: 99,
        durationMs: 80,
      },
      {
        id: 'r2',
        phase: 'Diagnose',
        thought:
          'Consumer processing time increased 340% after last deploy (v2.14.1). Memory-intensive deserialization code change identified.',
        confidence: 87,
        durationMs: 740,
      },
      {
        id: 'r3',
        phase: 'Execute',
        thought:
          'Temporary consumer scale-up is safer than rollback while backlog clears. Rollback queued for post-drain.',
        confidence: 91,
        durationMs: 46000,
      },
    ],
    mttrSaved: 12,
    autoResolved: true,
    rollbackAvailable: true,
    auditHash: '0xd4b7e6c1',
    description:
      'Message queue backlog overflow after consumer performance regression in v2.14.1 deploy.',
  },
];

const AGENT_STATS = [
  {
    label: 'Auto-Resolved Today',
    value: '83',
    unit: '%',
    color: '#10b981',
    sub: 'of all incidents',
  },
  { label: 'MTTR Saved', value: '4.2h', unit: '', color: GOLD, sub: 'today' },
  { label: 'Active Agents', value: '4', unit: '/4', color: '#3b82f6', sub: 'operational' },
  { label: 'Novel Escalations', value: '2', unit: '', color: '#f97316', sub: 'need review' },
];

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded text-[9px] font-mono font-medium uppercase tracking-wider"
      style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}
    >
      {label}
    </span>
  );
}

function RunbookProgress({ steps }: { steps: RunbookStep[] }) {
  const done = steps.filter((s) => s.status === 'done').length;
  const pct = Math.round((done / steps.length) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px]" style={{ color: DS.text.secondary }}>
          Runbook Progress
        </span>
        <span className="text-[9px] font-mono" style={{ color: GOLD }}>
          {done}/{steps.length} steps
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden mb-2"
        style={{ background: 'rgba(255,255,255,0.05)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${GOLD}, #10b981)` }}
        />
      </div>
      <div className="space-y-1">
        {steps.map((s) => (
          <div key={s.id} className="flex items-start gap-2">
            <div className="mt-0.5 shrink-0">
              {s.status === 'done' && (
                <CheckCircle className="w-3 h-3" style={{ color: '#10b981' }} />
              )}
              {s.status === 'running' && (
                <RefreshCw className="w-3 h-3 animate-spin" style={{ color: GOLD }} />
              )}
              {s.status === 'pending' && (
                <Clock className="w-3 h-3" style={{ color: DS.text.muted }} />
              )}
              {s.status === 'failed' && (
                <XCircle className="w-3 h-3" style={{ color: '#ef4444' }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10px]"
                  style={{ color: s.status === 'pending' ? DS.text.muted : DS.text.primary }}
                >
                  {s.label}
                </span>
                {s.durationMs ? (
                  <span className="text-[9px] font-mono shrink-0" style={{ color: DS.text.muted }}>
                    {(s.durationMs / 1000).toFixed(1)}s
                  </span>
                ) : null}
              </div>
              {s.output && (
                <div className="text-[9px] mt-0.5 font-mono" style={{ color: DS.text.muted }}>
                  {s.output}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReasoningTrace({ steps }: { steps: ReasoningStep[] }) {
  return (
    <div className="space-y-2">
      {steps.map((s, i) => (
        <div key={s.id} className="relative pl-4">
          {i < steps.length - 1 && (
            <div
              className="absolute left-1.5 top-3 bottom-0 w-px"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          )}
          <div
            className="absolute left-0 top-1.5 w-3 h-3 rounded-full flex items-center justify-center"
            style={{ background: `${GOLD}18`, border: `1px solid ${GOLD}35` }}
          >
            <Brain className="w-1.5 h-1.5" style={{ color: GOLD }} />
          </div>
          <div
            className="rounded p-2"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[9px] font-mono font-semibold uppercase tracking-wider"
                style={{ color: GOLD }}
              >
                {s.phase}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono" style={{ color: DS.text.muted }}>
                  conf: {s.confidence}%
                </span>
                <span className="text-[8px] font-mono" style={{ color: DS.text.muted }}>
                  {(s.durationMs / 1000).toFixed(1)}s
                </span>
              </div>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: DS.text.secondary }}>
              {s.thought}
            </p>
            {s.output && (
              <div
                className="mt-1 text-[9px] font-mono px-2 py-1 rounded"
                style={{ background: 'rgba(16,185,129,0.06)', color: '#10b981' }}
              >
                {s.output}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CaseCard({
  c,
  onSelect,
  selected,
}: {
  c: RemediationCase;
  onSelect: () => void;
  selected: boolean;
}) {
  const since = Math.floor((Date.now() - c.detectedAt) / 60000);
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-3 rounded-lg transition-all"
      style={{
        background: selected ? `${SEV_COLOR[c.severity]}08` : DS.surface,
        border: `1px solid ${selected ? `${SEV_COLOR[c.severity]}30` : DS.border}`,
      }}
    >
      <div className="flex items-start gap-2">
        <div
          className="w-2 h-2 rounded-full mt-1.5 shrink-0"
          style={{ background: STATE_COLOR[c.state] }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[11px] font-semibold" style={{ color: DS.text.primary }}>
              {c.title}
            </span>
            <Badge label={c.severity} color={SEV_COLOR[c.severity]} />
          </div>
          <div className="flex items-center gap-3 text-[9px]" style={{ color: DS.text.muted }}>
            <span className="font-mono">{c.service}</span>
            <span>{since}m ago</span>
            <span style={{ color: STATE_COLOR[c.state] }}>{STATE_LABEL[c.state]}</span>
          </div>
          {c.autoResolved && (
            <div className="mt-1 text-[9px] font-mono" style={{ color: '#10b981' }}>
              ↓ {c.mttrSaved}m MTTR saved
            </div>
          )}
        </div>
        <span className="text-[9px] font-mono shrink-0" style={{ color: DS.text.muted }}>
          {c.agent}
        </span>
      </div>
    </button>
  );
}

export default function AutonomousNOC() {
  const [selected, setSelected] = useState<RemediationCase>(SEED_CASES[0]);
  const [tab, setTab] = useState<'runbook' | 'reasoning'>('runbook');
  const [autoMode, setAutoMode] = useState(true);
  const [_ticker, setTicker] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTicker((t) => t + 1), 3000);
    return () => clearInterval(id);
  }, []);

  const totalMttr = SEED_CASES.reduce((a, c) => a + c.mttrSaved, 0);
  const resolvedCount = SEED_CASES.filter((c) => c.state === 'resolved').length;

  return (
    <div className="h-full overflow-auto" style={{ background: '#080c14' }}>
      <div className="max-w-[1400px] mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold tracking-tight" style={{ color: DS.text.primary }}>
              Autonomous NOC
            </h1>
            <p className="text-[11px] mt-0.5" style={{ color: DS.text.muted }}>
              AI agents detect, diagnose, and remediate — humans handle novel cases only
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoMode((a) => !a)}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-medium transition-all"
              style={{
                background: autoMode ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${autoMode ? 'rgba(16,185,129,0.25)' : DS.border}`,
                color: autoMode ? '#10b981' : DS.text.secondary,
              }}
            >
              <Bot className="w-3.5 h-3.5" />
              {autoMode ? 'Autonomous Mode ON' : 'Manual Override'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {AGENT_STATS.map((s) => (
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
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold font-mono" style={{ color: s.color }}>
                  {s.value}
                </span>
                {s.unit && (
                  <span className="text-[11px]" style={{ color: DS.text.muted }}>
                    {s.unit}
                  </span>
                )}
              </div>
              <div className="text-[9px] mt-0.5" style={{ color: DS.text.muted }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Main panel */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
          {/* Case list */}
          <div className="space-y-2">
            <div
              className="text-[9px] uppercase tracking-widest mb-2 px-1 flex items-center justify-between"
              style={{ color: DS.text.muted }}
            >
              <span>Active Cases</span>
              <span className="font-mono" style={{ color: GOLD }}>
                {SEED_CASES.length} cases
              </span>
            </div>
            {SEED_CASES.map((c) => (
              <CaseCard
                key={c.id}
                c={c}
                selected={selected.id === c.id}
                onSelect={() => setSelected(c)}
              />
            ))}

            {/* MTTR summary */}
            <div
              className="rounded-lg p-3 mt-2"
              style={{
                background: 'rgba(16,185,129,0.04)',
                border: '1px solid rgba(16,185,129,0.12)',
              }}
            >
              <div
                className="text-[9px] uppercase tracking-widest mb-2"
                style={{ color: '#10b981' }}
              >
                Today's Impact
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { k: 'Cases Closed', v: `${resolvedCount}/${SEED_CASES.length}` },
                  { k: 'MTTR Saved', v: `${totalMttr}m` },
                  { k: 'Auto-Rate', v: '83%' },
                  { k: 'Escalations', v: '1' },
                ].map((r) => (
                  <div key={r.k}>
                    <div className="text-[8px]" style={{ color: DS.text.muted }}>
                      {r.k}
                    </div>
                    <div
                      className="text-[12px] font-mono font-semibold"
                      style={{ color: DS.text.primary }}
                    >
                      {r.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Case detail */}
          <div
            className="rounded-lg overflow-hidden"
            style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
          >
            <div className="p-4 border-b" style={{ borderColor: DS.border }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono" style={{ color: DS.text.muted }}>
                      {selected.id}
                    </span>
                    <Badge label={selected.severity} color={SEV_COLOR[selected.severity]} />
                    <Badge
                      label={STATE_LABEL[selected.state]}
                      color={STATE_COLOR[selected.state]}
                    />
                  </div>
                  <h2 className="text-sm font-semibold" style={{ color: DS.text.primary }}>
                    {selected.title}
                  </h2>
                  <p className="text-[11px] mt-1" style={{ color: DS.text.secondary }}>
                    {selected.description}
                  </p>
                </div>
                {selected.rollbackAvailable && (
                  <button
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-medium shrink-0"
                    style={{
                      background: 'rgba(239,68,68,0.06)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#ef4444',
                    }}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Rollback
                  </button>
                )}
              </div>
              <div className="flex items-center gap-4 text-[10px]" style={{ color: DS.text.muted }}>
                <span>
                  Agent:{' '}
                  <span className="font-mono" style={{ color: GOLD }}>
                    {selected.agent}
                  </span>
                </span>
                <span>
                  Service:{' '}
                  <span className="font-mono" style={{ color: DS.text.secondary }}>
                    {selected.service}
                  </span>
                </span>
                {selected.mttrSaved > 0 && (
                  <span style={{ color: '#10b981' }}>↓ {selected.mttrSaved}m MTTR saved</span>
                )}
                <span className="ml-auto font-mono text-[9px]" style={{ color: DS.text.muted }}>
                  audit: {selected.auditHash}
                </span>
              </div>
            </div>

            <div className="flex border-b" style={{ borderColor: DS.border }}>
              {(['runbook', 'reasoning'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-medium capitalize transition-all"
                  style={{
                    color: tab === t ? GOLD : DS.text.muted,
                    borderBottom: tab === t ? `2px solid ${GOLD}` : '2px solid transparent',
                  }}
                >
                  {t === 'runbook' ? (
                    <BookOpen className="w-3 h-3" />
                  ) : (
                    <Brain className="w-3 h-3" />
                  )}
                  {t === 'runbook' ? 'Runbook Execution' : 'AI Reasoning Trace'}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-auto" style={{ maxHeight: 480 }}>
              {tab === 'runbook' ? (
                <div>
                  <div
                    className="text-[10px] font-mono mb-3 px-2 py-1.5 rounded"
                    style={{ background: 'rgba(255,255,255,0.03)', color: DS.text.muted }}
                  >
                    <span style={{ color: GOLD }}>▶</span> {selected.runbook}
                  </div>
                  <RunbookProgress steps={selected.runbookSteps} />
                </div>
              ) : (
                <ReasoningTrace steps={selected.reasoning} />
              )}
            </div>
          </div>
        </div>

        {/* Agent fleet */}
        <div
          className="rounded-lg p-4"
          style={{ background: DS.surface, border: `1px solid ${DS.border}` }}
        >
          <div
            className="text-[10px] uppercase tracking-widest font-medium mb-3"
            style={{ color: DS.text.muted }}
          >
            Agent Fleet Status
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                name: 'AGENT-ALPHA',
                role: 'Infra Remediation',
                cases: 142,
                success: 97.2,
                state: 'idle' as AgentState,
              },
              {
                name: 'AGENT-BETA',
                role: 'Database Ops',
                cases: 89,
                success: 94.4,
                state: 'verifying' as AgentState,
              },
              {
                name: 'AGENT-GAMMA',
                role: 'Application Layer',
                cases: 204,
                success: 88.7,
                state: 'executing' as AgentState,
              },
              {
                name: 'AGENT-DELTA',
                role: 'Network & Queue',
                cases: 67,
                success: 91.2,
                state: 'idle' as AgentState,
              },
            ].map((a) => (
              <div
                key={a.name}
                className="p-3 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${DS.border}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ background: STATE_COLOR[a.state] }}
                  />
                  <span
                    className="text-[10px] font-mono font-bold"
                    style={{ color: DS.text.primary }}
                  >
                    {a.name}
                  </span>
                </div>
                <div className="text-[9px] mb-2" style={{ color: DS.text.secondary }}>
                  {a.role}
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <div className="text-[8px]" style={{ color: DS.text.muted }}>
                      Cases
                    </div>
                    <div className="text-[11px] font-mono" style={{ color: DS.text.primary }}>
                      {a.cases}
                    </div>
                  </div>
                  <div>
                    <div className="text-[8px]" style={{ color: DS.text.muted }}>
                      Success
                    </div>
                    <div className="text-[11px] font-mono" style={{ color: '#10b981' }}>
                      {a.success}%
                    </div>
                  </div>
                </div>
                <div
                  className="mt-1.5 text-[8px] font-mono"
                  style={{ color: STATE_COLOR[a.state] }}
                >
                  {STATE_LABEL[a.state]}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
