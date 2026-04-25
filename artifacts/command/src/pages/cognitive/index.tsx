import { useStandardQuery } from '@szl-holdings/api-client-react';
import {
  Activity,
  Brain,
  Clock,
  Eye,
  Info,
  Shield,
  Target,
} from 'lucide-react';
import { CognitiveLayout } from './cognitive-layout';

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');
const ACCENT = '#8b7ac8';
const CARD = 'var(--color-surface-base)';
const BORDER = 'var(--color-surface-border)';
const FG = 'var(--color-fg-primary)';
const FG_MUT = 'var(--color-fg-muted)';

interface ActiveRun {
  id: string;
  name: string;
  agent: string;
  status: 'running' | 'verifying' | 'waiting' | 'paused';
  objective: string;
  startedAt: string;
  autonomyTier: string;
  stepCount: number;
  confidence: number;
}

interface VerifierDecision {
  id: string;
  runId: string;
  agent: string;
  action: string;
  verdict: 'approved' | 'rejected' | 'escalated' | 'modified';
  rationale: string;
  policyRef: string;
  at: string;
  confidence: number;
}

interface Reflection {
  id: string;
  agent: string;
  type: 'self-critique' | 'objective-update' | 'belief-revision' | 'trust-adjustment';
  summary: string;
  at: string;
  impact: 'low' | 'medium' | 'high';
  evidence: string[];
}

interface Objective {
  id: string;
  title: string;
  agent: string;
  priority: number;
  status: 'active' | 'blocked' | 'complete' | 'superseded';
  autonomyTier: string;
  horizon: string;
  confidence: number;
}

interface RuntimeState {
  autonomyTier: { name: string; level: number; label: string; description: string; color: string };
  activeRuns: ActiveRun[];
  objectives: Objective[];
  verifierDecisions: VerifierDecision[];
  reflections: Reflection[];
  summary: {
    totalAgents: number;
    runningAgents: number;
    pendingApprovals: number;
    trustScore: number;
  };
}

const DEMO_STATE: RuntimeState = {
  autonomyTier: {
    name: 'TIER-2',
    level: 2,
    label: 'Supervised Autonomy',
    description:
      'Agents act within pre-approved policy envelopes. Actions above confidence threshold 0.85 auto-approve; below require human sign-off.',
    color: '#f59e0b',
  },
  summary: { totalAgents: 8, runningAgents: 5, pendingApprovals: 3, trustScore: 0.81 },
  activeRuns: [
    {
      id: 'run-001',
      name: 'Fleet Risk Synthesis',
      agent: 'ATLAS-Core',
      status: 'running',
      objective:
        'Synthesize cross-domain risk exposure into actionable signals for morning briefing',
      startedAt: '14:02',
      autonomyTier: 'TIER-2',
      stepCount: 12,
      confidence: 0.88,
    },
    {
      id: 'run-002',
      name: 'Carlota CRM Recovery',
      agent: 'Ops-Agent-3',
      status: 'verifying',
      objective:
        'Restore CRM pipeline after credential expiry; validate data freshness before reconnect',
      startedAt: '13:45',
      autonomyTier: 'TIER-2',
      stepCount: 6,
      confidence: 0.74,
    },
    {
      id: 'run-003',
      name: 'LP Q1 Portfolio Rollup',
      agent: 'DOMAINE-Intel',
      status: 'waiting',
      objective: 'Aggregate Q1 portfolio performance; flag drift vs benchmarks for CFO packet',
      startedAt: '12:30',
      autonomyTier: 'TIER-1',
      stepCount: 3,
      confidence: 0.92,
    },
    {
      id: 'run-004',
      name: 'PARAGON Threat Correlation',
      agent: 'AEGIS-Watch',
      status: 'running',
      objective:
        'Correlate external threat intel with internal posture — surface CISO-level signals',
      startedAt: '11:18',
      autonomyTier: 'TIER-2',
      stepCount: 19,
      confidence: 0.79,
    },
    {
      id: 'run-005',
      name: 'SEXTANT Voyage Anomalies',
      agent: 'Maritime-AI',
      status: 'paused',
      objective: 'Detect anomalous voyage deviations and cross-reference with charter agreements',
      startedAt: '09:55',
      autonomyTier: 'TIER-3',
      stepCount: 7,
      confidence: 0.65,
    },
  ],
  objectives: [
    {
      id: 'obj-1',
      title: 'Restore Carlota data freshness to <1h SLA',
      agent: 'Ops-Agent-3',
      priority: 1,
      status: 'active',
      autonomyTier: 'TIER-2',
      horizon: 'Today',
      confidence: 0.74,
    },
    {
      id: 'obj-2',
      title: 'Prepare CISO briefing on PARAGON bundle exposure',
      agent: 'AEGIS-Watch',
      priority: 2,
      status: 'active',
      autonomyTier: 'TIER-2',
      horizon: 'Today',
      confidence: 0.79,
    },
    {
      id: 'obj-3',
      title: 'Complete LP Q1 portfolio rollup for CFO',
      agent: 'DOMAINE-Intel',
      priority: 3,
      status: 'blocked',
      autonomyTier: 'TIER-1',
      horizon: 'Apr 20',
      confidence: 0.92,
    },
    {
      id: 'obj-4',
      title: 'Synthesize fleet risk for morning brief',
      agent: 'ATLAS-Core',
      priority: 4,
      status: 'active',
      autonomyTier: 'TIER-2',
      horizon: '06:00 tomorrow',
      confidence: 0.88,
    },
  ],
  verifierDecisions: [
    {
      id: 'vd-1',
      runId: 'run-001',
      agent: 'ATLAS-Core',
      action: 'Write synthesized risk digest to briefing queue',
      verdict: 'approved',
      rationale:
        'Action within approved write scope; confidence 0.88 exceeds TIER-2 threshold. No PII involved.',
      policyRef: 'POL-WRT-BRIEF-01',
      at: '14:14',
      confidence: 0.88,
    },
    {
      id: 'vd-2',
      runId: 'run-002',
      agent: 'Ops-Agent-3',
      action: 'Trigger credential rotation for Carlota CRM',
      verdict: 'escalated',
      rationale:
        'Credential mutation classified as TIER-1 action. Routed to Ops Lead for approval.',
      policyRef: 'POL-SEC-CRED-03',
      at: '13:52',
      confidence: 0.74,
    },
    {
      id: 'vd-3',
      runId: 'run-004',
      agent: 'AEGIS-Watch',
      action: 'Emit alert to CISO Slack channel',
      verdict: 'approved',
      rationale: 'Notification-only action. Confidence 0.79 meets TIER-2 notify threshold.',
      policyRef: 'POL-NOTIFY-01',
      at: '13:30',
      confidence: 0.79,
    },
    {
      id: 'vd-4',
      runId: 'run-005',
      agent: 'Maritime-AI',
      action: 'Flag voyage VYG-2847 as anomalous in ledger',
      verdict: 'rejected',
      rationale:
        'Confidence 0.65 below TIER-3 ledger write threshold 0.70. Requires additional corroboration.',
      policyRef: 'POL-WRT-LEDGER-02',
      at: '12:45',
      confidence: 0.65,
    },
    {
      id: 'vd-5',
      runId: 'run-003',
      agent: 'DOMAINE-Intel',
      action: 'Finalize Q1 benchmark comparison',
      verdict: 'modified',
      rationale: 'Action approved but scope narrowed: draft mode only until CFO approval received.',
      policyRef: 'POL-WRT-FINANCE-01',
      at: '12:31',
      confidence: 0.92,
    },
  ],
  reflections: [
    {
      id: 'ref-1',
      agent: 'ATLAS-Core',
      type: 'belief-revision',
      summary:
        'Updated cross-domain risk model after Carlota CRM outage data propagated. Raised KORA exposure estimate from 0.42 → 0.61.',
      at: '14:10',
      impact: 'high',
      evidence: [
        'CRM freshness gap 3h42m',
        'KORA ops queue spike +28%',
        'Prior model calibration error detected',
      ],
    },
    {
      id: 'ref-2',
      agent: 'Ops-Agent-3',
      type: 'self-critique',
      summary:
        'Identified gap in playbook: credential rotation requires human approval but no timeout escalation was configured. Logged for policy update.',
      at: '13:55',
      impact: 'medium',
      evidence: [
        'Escalation stuck for 7 min without auto-timeout',
        'Policy POL-SEC-CRED-03 missing escalation path',
      ],
    },
    {
      id: 'ref-3',
      agent: 'Maritime-AI',
      type: 'trust-adjustment',
      summary:
        'Reduced confidence in SEXTANT AIS data feed after 3 consecutive anomaly false positives on VYG-class voyages. Trust weight reduced 0.82 → 0.71.',
      at: '13:10',
      impact: 'medium',
      evidence: [
        'False positive rate 60% over last 48h on VYG voyages',
        'AIS feed latency +14s vs baseline',
      ],
    },
    {
      id: 'ref-4',
      agent: 'DOMAINE-Intel',
      type: 'objective-update',
      summary:
        'Reprioritized LP rollup behind Carlota recovery after risk model update showed LP data accuracy depends on Carlota sync.',
      at: '12:35',
      impact: 'low',
      evidence: [
        'Dependency graph: LP rollup → Carlota CRM freshness',
        'Risk model revision from ATLAS-Core',
      ],
    },
  ],
};

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: '#22c55e',
    verifying: '#f59e0b',
    waiting: '#3b82f6',
    paused: '#6b7280',
    approved: '#22c55e',
    rejected: '#ef4444',
    escalated: '#f97316',
    modified: '#8b7ac8',
  };
  const color = colors[status] ?? '#6b7280';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
        boxShadow: status === 'running' ? `0 0 6px ${color}` : undefined,
        flexShrink: 0,
      }}
    />
  );
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 0.85 ? '#22c55e' : value >= 0.7 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div
        style={{
          width: 52,
          height: 3,
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <div
          style={{ width: `${value * 100}%`, height: '100%', background: color, borderRadius: 2 }}
        />
      </div>
      <span style={{ fontSize: '9px', fontVariantNumeric: 'tabular-nums', color, fontWeight: 600 }}>
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  headerRight,
}: {
  title: string;
  icon: typeof Activity;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: CARD,
        border: `1px solid ${BORDER}`,
        borderRadius: '0.875rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon style={{ width: 13, height: 13, color: ACCENT }} />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: FG_MUT,
            }}
          >
            {title}
          </span>
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

function AutonomyTierBadge({ tier }: { tier: RuntimeState['autonomyTier'] }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.625rem 1rem',
        borderRadius: '0.625rem',
        background: `${tier.color}10`,
        border: `1px solid ${tier.color}30`,
      }}
    >
      <Shield style={{ width: 14, height: 14, color: tier.color }} />
      <div>
        <div
          style={{ fontSize: '11px', fontWeight: 800, color: tier.color, letterSpacing: '0.05em' }}
        >
          {tier.name} · {tier.label}
        </div>
        <div style={{ fontSize: '9px', color: FG_MUT, marginTop: '1px', maxWidth: 420 }}>
          {tier.description}
        </div>
      </div>
    </div>
  );
}

function ActiveRunsPanel({ runs }: { runs: ActiveRun[] }) {
  const statusLabels: Record<string, string> = {
    running: 'Running',
    verifying: 'Verifying',
    waiting: 'Waiting',
    paused: 'Paused',
  };
  return (
    <SectionCard
      title="Active Agent Runs"
      icon={Activity}
      headerRight={
        <span style={{ fontSize: '9px', color: FG_MUT }}>
          {runs.filter((r) => r.status === 'running').length} running
        </span>
      }
    >
      {runs.map((run, i) => (
        <div
          key={run.id}
          style={{
            padding: '0.75rem 1rem',
            borderBottom: i < runs.length - 1 ? `1px solid ${BORDER}` : undefined,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
          }}
        >
          <StatusDot status={run.status} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: FG }}>{run.name}</span>
              <span
                style={{
                  fontSize: '9px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  background: `${ACCENT}15`,
                  color: ACCENT,
                  fontFamily: 'monospace',
                }}
              >
                {run.agent}
              </span>
              <span style={{ fontSize: '9px', color: FG_MUT }}>{statusLabels[run.status]}</span>
              <span style={{ marginLeft: 'auto', fontSize: '9px', color: FG_MUT, flexShrink: 0 }}>
                <Clock style={{ width: 8, height: 8, display: 'inline', marginRight: 2 }} />
                {run.startedAt} · step {run.stepCount}
              </span>
            </div>
            <p
              style={{
                fontSize: '10px',
                color: FG_MUT,
                margin: '0.25rem 0 0.375rem',
                lineHeight: 1.5,
              }}
            >
              {run.objective}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <ConfidenceBar value={run.confidence} />
              <span style={{ fontSize: '9px', color: FG_MUT, fontFamily: 'monospace' }}>
                {run.autonomyTier}
              </span>
            </div>
          </div>
        </div>
      ))}
    </SectionCard>
  );
}

function ObjectivesPanel({ objectives }: { objectives: Objective[] }) {
  const statusColors: Record<string, string> = {
    active: '#22c55e',
    blocked: '#f97316',
    complete: '#8b7ac8',
    superseded: '#6b7280',
  };
  return (
    <SectionCard title="Current Objectives" icon={Target}>
      {objectives.map((obj, i) => (
        <div
          key={obj.id}
          style={{
            padding: '0.625rem 1rem',
            borderBottom: i < objectives.length - 1 ? `1px solid ${BORDER}` : undefined,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.625rem',
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${BORDER}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '7px',
              fontWeight: 800,
              color: FG_MUT,
              flexShrink: 0,
              marginTop: 1,
            }}
          >
            {obj.priority}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: FG }}>{obj.title}</span>
              <span
                style={{
                  fontSize: '8px',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  background: `${statusColors[obj.status]}18`,
                  color: statusColors[obj.status],
                  fontWeight: 700,
                  textTransform: 'capitalize',
                }}
              >
                {obj.status}
              </span>
            </div>
            <div
              style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}
            >
              <span style={{ fontSize: '9px', color: FG_MUT }}>
                <span style={{ fontSize: '8px', fontFamily: 'monospace', color: ACCENT }}>
                  {obj.agent}
                </span>
              </span>
              <span style={{ fontSize: '9px', color: FG_MUT }}>
                Horizon: <strong style={{ color: FG }}>{obj.horizon}</strong>
              </span>
              <span style={{ fontSize: '9px', fontFamily: 'monospace', color: FG_MUT }}>
                {obj.autonomyTier}
              </span>
              <ConfidenceBar value={obj.confidence} />
            </div>
          </div>
        </div>
      ))}
    </SectionCard>
  );
}

function VerifierPanel({ decisions }: { decisions: VerifierDecision[] }) {
  const verdictColors: Record<string, string> = {
    approved: '#22c55e',
    rejected: '#ef4444',
    escalated: '#f97316',
    modified: '#8b7ac8',
  };
  const verdictLabels: Record<string, string> = {
    approved: 'Approved',
    rejected: 'Rejected',
    escalated: 'Escalated',
    modified: 'Modified',
  };
  return (
    <SectionCard
      title="Recent Verifier Decisions"
      icon={Eye}
      headerRight={<span style={{ fontSize: '9px', color: FG_MUT }}>Last 5</span>}
    >
      {decisions.map((d, i) => {
        const vc = verdictColors[d.verdict];
        return (
          <div
            key={d.id}
            style={{
              padding: '0.75rem 1rem',
              borderBottom: i < decisions.length - 1 ? `1px solid ${BORDER}` : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: vc,
                  boxShadow: `0 0 5px ${vc}80`,
                  flexShrink: 0,
                  marginTop: 4,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 600, color: FG }}>{d.action}</span>
                  <span
                    style={{
                      fontSize: '8px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      background: `${vc}18`,
                      color: vc,
                      fontWeight: 700,
                    }}
                  >
                    {verdictLabels[d.verdict]}
                  </span>
                  <span
                    style={{ marginLeft: 'auto', fontSize: '9px', color: FG_MUT, flexShrink: 0 }}
                  >
                    {d.at}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    alignItems: 'flex-start',
                    marginTop: '0.25rem',
                  }}
                >
                  <Info
                    style={{ width: 9, height: 9, color: FG_MUT, flexShrink: 0, marginTop: 2 }}
                  />
                  <p style={{ fontSize: '10px', color: FG_MUT, margin: 0, lineHeight: 1.5 }}>
                    {d.rationale}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.375rem' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'monospace', color: `${ACCENT}80` }}>
                    {d.agent}
                  </span>
                  <span
                    style={{
                      fontSize: '8px',
                      fontFamily: 'monospace',
                      color: 'rgba(255,255,255,0.2)',
                      padding: '0 4px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 3,
                    }}
                  >
                    {d.policyRef}
                  </span>
                  <ConfidenceBar value={d.confidence} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </SectionCard>
  );
}

function ReflectionsPanel({ reflections }: { reflections: Reflection[] }) {
  const typeColors: Record<string, string> = {
    'self-critique': '#ef4444',
    'objective-update': '#f59e0b',
    'belief-revision': '#8b7ac8',
    'trust-adjustment': '#3b82f6',
  };
  const typeLabels: Record<string, string> = {
    'self-critique': 'Self-Critique',
    'objective-update': 'Objective Update',
    'belief-revision': 'Belief Revision',
    'trust-adjustment': 'Trust Adjustment',
  };
  const impactColors: Record<string, string> = {
    low: '#6b7280',
    medium: '#f59e0b',
    high: '#ef4444',
  };

  return (
    <SectionCard
      title="Recent Reflections"
      icon={Brain}
      headerRight={<span style={{ fontSize: '9px', color: FG_MUT }}>Introspective log</span>}
    >
      {reflections.map((ref, i) => {
        const tc = typeColors[ref.type];
        return (
          <div
            key={ref.id}
            style={{
              padding: '0.75rem 1rem',
              borderBottom: i < reflections.length - 1 ? `1px solid ${BORDER}` : undefined,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem' }}>
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                <span
                  style={{
                    fontSize: '8px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: `${tc}12`,
                    color: tc,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {typeLabels[ref.type]}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '9px', fontFamily: 'monospace', color: ACCENT }}>
                    {ref.agent}
                  </span>
                  <span
                    style={{ fontSize: '8px', color: impactColors[ref.impact], fontWeight: 600 }}
                  >
                    {ref.impact} impact
                  </span>
                  <span
                    style={{ marginLeft: 'auto', fontSize: '9px', color: FG_MUT, flexShrink: 0 }}
                  >
                    {ref.at}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: '11px',
                    color: FG,
                    margin: '0.25rem 0 0.5rem',
                    lineHeight: 1.55,
                  }}
                >
                  {ref.summary}
                </p>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {ref.evidence.map((e, ei) => (
                    <span
                      key={ei}
                      style={{
                        fontSize: '8px',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        background: 'rgba(255,255,255,0.03)',
                        border: `1px solid ${BORDER}`,
                        color: FG_MUT,
                      }}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </SectionCard>
  );
}

export default function CognitiveCommandCenter() {
  const { data: runtimeData } = useStandardQuery<RuntimeState>({
    queryKey: ['cognitive', 'runtime'],
    queryFn: () =>
      fetch(`${BASE}/api/cognitive/runtime`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .catch(() => DEMO_STATE),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const state = runtimeData ?? DEMO_STATE;

  return (
    <CognitiveLayout>
      <div style={{ padding: '1.5rem 2rem', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.375rem',
            }}
          >
            <Brain style={{ width: 16, height: 16, color: ACCENT }} />
            <h1
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                color: 'rgba(255,255,255,0.9)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Cognitive Command Center
            </h1>
          </div>
          <p style={{ fontSize: '11px', color: FG_MUT, margin: 0 }}>
            Live runtime state — what the system is doing, believing, planning, and why.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
          }}
        >
          <AutonomyTierBadge tier={state.autonomyTier} />
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Total Agents', value: state.summary.totalAgents, color: FG_MUT },
              { label: 'Running Now', value: state.summary.runningAgents, color: '#22c55e' },
              {
                label: 'Pending Approvals',
                value: state.summary.pendingApprovals,
                color: '#f97316',
              },
              {
                label: 'Trust Score',
                value: `${Math.round(state.summary.trustScore * 100)}%`,
                color: ACCENT,
              },
            ].map((pill) => (
              <div
                key={pill.label}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${BORDER}`,
                  borderRadius: '0.5rem',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{ fontSize: '1rem', fontWeight: 800, color: pill.color, lineHeight: 1 }}
                >
                  {pill.value}
                </div>
                <div
                  style={{
                    fontSize: '8px',
                    color: FG_MUT,
                    marginTop: '2px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.07em',
                  }}
                >
                  {pill.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ActiveRunsPanel runs={state.activeRuns} />
            <ObjectivesPanel objectives={state.objectives} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <VerifierPanel decisions={state.verifierDecisions} />
            <ReflectionsPanel reflections={state.reflections} />
          </div>
        </div>
      </div>
    </CognitiveLayout>
  );
}
