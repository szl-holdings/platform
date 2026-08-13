import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, ActionButton } from '../components/ui';
import { WORKCELL_DEMO_SOURCE } from '@workspace/a11oy-fabric';
import { projectWorkcellState } from '../data/workcellProjection';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

interface ReplayStep {
  step: number;
  label: string;
  actor: string;
  ts: string;
  outcome: ReplayOutcome | 'skipped';
  detail: string;
}

type ReplayOutcome = 'success' | 'blocked' | 'failed' | 'running' | 'pending';

interface ReplayReport {
  id: string;
  workcellId: string;
  workcellName: string;
  tenant: string;
  domain: string;
  outcome: ReplayOutcome;
  completedAt: string | null;
  durationMs: number;
  evalDisposition: string | null;
  evalComposite: number | null;
  evalDimensionCount: number;
  proofRef: string | null;
  approvalTier: string;
  approvedBy: string | null;
  approvedAt: string | null;
  traceSpans: number;
  toolCalls: number;
  failureClass: string | null;
  failureExplanation: string | null;
  retryRecommendation: string | null;
  steps: ReplayStep[];
}

const VERTICAL_META: Record<string, { tenant: string; domain: string }> = {
  'lyte-revenue': { tenant: 'Lyte', domain: 'Revenue' },
  'vessels-maritime': { tenant: 'Vessels', domain: 'Maritime' },
  'terra-real-estate': { tenant: 'Terra', domain: 'Real Estate' },
  'aegis-defense': { tenant: 'Aegis', domain: 'Defense' },
  'prism-counsel': { tenant: 'Counsel', domain: 'Legal' },
  'carlota-jo': { tenant: 'Carlota Jo', domain: 'Advisory' },
  'alloy-core': { tenant: 'A11oy', domain: 'Platform' },
};

const STEP_DETAILS: string[] = [
  'Fixture signal row declared; no connector read is represented.',
  'Fixture context fields assembled from tracked source data.',
  'Fixture agent step declared with evidence references.',
  'Fixture evaluation fields are displayed; no runtime evaluator call is inferred.',
  'Fixture policy boundary is displayed; no operational gate was invoked.',
  'Fixture approval state is displayed; no authority was granted.',
  'Proposed action shape is displayed; no external mutation ran.',
  'Receipt-shaped source fields are displayed; no deployed receipt was fetched.',
];

function buildReplayFromId(id: string): ReplayReport | null {
  const workcellId = id.replace(/^replay-/, '');
  const wc = WORKCELL_DEMO_SOURCE.records.find((w) => w.id === workcellId);
  if (!wc) return null;

  const meta = VERTICAL_META[wc.vertical as string] ?? {
    tenant: 'Enterprise',
    domain: 'Operations',
  };
  const recordIndex = WORKCELL_DEMO_SOURCE.records.findIndex((workcell) => workcell.id === wc.id);
  const projection = projectWorkcellState(wc);
  const outcome = projection.outcome;
  const terminal = projection.terminal;
  const completedAt = terminal ? wc.updatedAt : null;
  const durationMs = terminal ? 8000 + Math.max(0, recordIndex) * 4096 : 0;

  const baseSteps = [
    { label: 'Fixture signal declared', actor: 'Signal Mesh shape' },
    { label: 'Fixture context pack declared', actor: 'Context shape' },
    { label: 'Fixture skill step declared', actor: 'Skill shape' },
    { label: 'Fixture evidence references declared', actor: 'Evidence shape' },
    { label: 'Fixture evaluation declared', actor: 'MirrorEval shape' },
    { label: 'Fixture policy gate declared', actor: 'PCE shape' },
    { label: 'Fixture action brief declared', actor: 'Action shape' },
    { label: 'Fixture approval boundary declared', actor: 'Approval shape' },
    { label: 'Fixture human state declared', actor: 'Approval shape' },
    { label: 'External connector mutation blocked', actor: 'Connector boundary' },
    { label: 'Fixture tool result declared', actor: 'Tool shape' },
    { label: 'Fixture receipt shape declared', actor: 'Proof shape' },
    { label: 'Fixture twin state declared', actor: 'Twin shape' },
    { label: 'Fixture outcome state declared', actor: 'Outcome shape' },
  ];

  const agentSteps = wc.agentSequence.map((s) => ({
    label: `${s.role}: ${s.action}`,
    actor: s.role,
  }));
  const allSteps = [...baseSteps.slice(0, 6), ...agentSteps, ...baseSteps.slice(6)].slice(0, 14);

  const steps: ReplayStep[] = allSteps.map((s, i) => {
    let stepOutcome: ReplayStep['outcome'];
    if (outcome === 'success') stepOutcome = 'success';
    else if (outcome === 'failed') stepOutcome = i < 4 ? 'success' : i === 4 ? 'failed' : 'skipped';
    else if (outcome === 'blocked')
      stepOutcome = i < 5 ? 'success' : i === 5 ? 'blocked' : 'skipped';
    else if (outcome === 'running')
      stepOutcome = i < 4 ? 'success' : i === 4 ? 'running' : 'pending';
    else stepOutcome = i === 0 ? 'pending' : 'skipped';

    return {
      step: i + 1,
      label: s.label,
      actor: s.actor,
      ts: wc.updatedAt,
      outcome: stepOutcome,
      detail: STEP_DETAILS[i % STEP_DETAILS.length],
    };
  });

  const evalDisposition =
    wc.mirrorEvalResult.verdict === 'pass'
      ? 'pass'
      : wc.mirrorEvalResult.verdict === 'warn'
        ? 'pass_with_warning'
        : 'blocked';

  return {
    id,
    workcellId: wc.id,
    workcellName: wc.name,
    tenant: meta.tenant,
    domain: meta.domain,
    outcome,
    completedAt,
    durationMs,
    evalDisposition,
    evalComposite: wc.mirrorEvalResult.score,
    evalDimensionCount: wc.mirrorEvalResult.dimensions.length,
    proofRef: projection.showProofShape ? wc.proofPacketId : null,
    approvalTier: wc.requiresApproval
      ? (wc.actionBrief?.approvalTier?.toUpperCase() ?? 'TIER_3')
      : 'TIER_1',
    approvedBy: null,
    approvedAt: null,
    traceSpans: steps.length,
    toolCalls: wc.agentSequence.length,
    failureClass:
      outcome === 'failed' ? 'fixture_error' : outcome === 'blocked' ? 'fixture_blocked' : null,
    failureExplanation:
      outcome === 'failed'
        ? 'The tracked fixture workflow state is error.'
        : outcome === 'blocked'
          ? projection.awaitingApproval
            ? 'The tracked fixture action is pending approval.'
            : 'The tracked fixture workflow state is paused.'
          : null,
    retryRecommendation:
      outcome === 'failed' || outcome === 'blocked'
        ? 'Inspect the fixture source; no runtime retry is available from this view.'
        : null,
    steps,
  };
}

const OUTCOME_COLORS: Record<string, string> = {
  success: '#c9b787',
  blocked: '#f5f5f5',
  failed: '#f5f5f5',
  running: '#c9b787',
  pending: '#8a8a8a',
  skipped: '#8a8a8a',
};

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return s > 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

type ReplayCertDecision = 'certified' | 'flagged' | 'rejected';

export function SovereignReplayDetail() {
  const params = useParams<{ id: string }>();
  const [data] = useState<ReplayReport | null>(() => buildReplayFromId(params.id ?? ''));
  const [replayState, setReplayState] = useState<'idle' | 'playing' | 'done'>('idle');
  const [stepIdx, setStepIdx] = useState(-1);
  const [speed, setSpeed] = useState(800);
  const [certDecision, setCertDecision] = useState<ReplayCertDecision | null>(null);

  const steps = data?.steps ?? [];

  useEffect(() => {
    if (replayState !== 'playing') return;
    if (stepIdx >= steps.length - 1) {
      setReplayState('done');
      return;
    }
    const t = setTimeout(() => setStepIdx((i) => i + 1), speed);
    return () => clearTimeout(t);
  }, [replayState, stepIdx, steps.length, speed]);

  const startReplay = () => {
    setStepIdx(-1);
    setReplayState('playing');
  };
  const pauseReplay = () => setReplayState('idle');
  const resetReplay = () => {
    setStepIdx(-1);
    setReplayState('idle');
  };

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-24">
          <div className="text-sm mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            Replay not found: {params.id}
          </div>
          <Link
            href={`${BASE}/replay`}
            className="text-xs min-h-11 min-w-11 inline-flex items-center justify-center"
            style={{ color: 'var(--color-a11oy-blue)' }}
          >
            ← Back to Replay Index
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href={`${BASE}/replay`}
          className="text-xs font-mono min-h-11 min-w-11 inline-flex items-center"
          style={{ color: 'var(--color-a11oy-blue)', textDecoration: 'none' }}
        >
          ← All Replays
        </Link>
        <span style={{ color: 'var(--color-a11oy-border)' }}>/</span>
        <span
          className="text-xs font-mono truncate"
          style={{ color: 'var(--color-a11oy-text-ghost)' }}
        >
          {data.workcellName}
        </span>
      </div>

      <div
        data-proof-surface="a11oy-sovereign-replay-detail"
        data-proof-ready="true"
        data-proof-state="DEMO"
      >
        <PageHeader
          label="SOVEREIGN REPLAY"
          title={`↩ ${data.workcellName}`}
          subtitle="Step through a deterministic source fixture while preserving unfinished, blocked, failed, and completed workflow outcomes."
          status="DEMO"
        />
      </div>

      <div
        className="p-3 rounded-lg mb-6 text-xs"
        role="status"
        style={{
          backgroundColor: 'rgba(201,183,135,0.06)',
          border: '1px solid rgba(201,183,135,0.2)',
          color: 'var(--color-a11oy-text-sub)',
        }}
      >
        <span className="font-mono" style={{ color: '#c9b787' }}>
          {WORKCELL_DEMO_SOURCE.state}
        </span>
        {' — '}
        {WORKCELL_DEMO_SOURCE.reason}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {replayState === 'playing' ? (
                  <ActionButton variant="primary" onClick={pauseReplay}>
                    ⏸ Pause
                  </ActionButton>
                ) : (
                  <ActionButton variant="primary" onClick={startReplay}>
                    {replayState === 'done' ? '↩ Restart' : '▶ Play Replay'}
                  </ActionButton>
                )}
                <ActionButton variant="ghost" onClick={resetReplay}>
                  ↺ Reset
                </ActionButton>
              </div>
              <div className="flex items-center gap-2 text-xs ml-4">
                <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Speed:</span>
                {[2000, 1000, 600, 300].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setSpeed(s)}
                    aria-pressed={speed === s}
                    className="px-2 py-0.5 rounded font-mono min-h-11 min-w-11"
                    style={{
                      backgroundColor: speed === s ? 'rgba(201,183,135,0.15)' : 'transparent',
                      color: speed === s ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 11,
                    }}
                  >
                    {s === 2000 ? '0.5×' : s === 1000 ? '1×' : s === 600 ? '1.5×' : '2×'}
                  </button>
                ))}
              </div>
              <div
                className="ml-auto text-xs font-mono"
                style={{ color: 'var(--color-a11oy-text-ghost)' }}
              >
                {stepIdx + 1} / {steps.length} steps
              </div>
            </div>
            <div
              className="mt-3 h-1.5 rounded-full"
              style={{ backgroundColor: 'var(--color-a11oy-muted)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width:
                    steps.length > 0
                      ? `${Math.max(0, ((stepIdx + 1) / steps.length) * 100)}%`
                      : '0%',
                  backgroundColor: '#c9b787',
                }}
              />
            </div>
          </Card>

          <SectionTitle>Execution Trace</SectionTitle>
          <Card>
            {steps.length === 0 ? (
              <div
                className="text-center py-8 text-xs"
                style={{ color: 'var(--color-a11oy-text-ghost)' }}
              >
                No execution trace available.
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {steps.map((step, i) => {
                  const visible = i <= stepIdx || replayState === 'idle';
                  const isCurrent = i === stepIdx && replayState === 'playing';
                  const outColor = OUTCOME_COLORS[step.outcome] ?? '#8a8a8a';
                  const statusDot =
                    step.outcome === 'success'
                      ? '✓'
                      : step.outcome === 'blocked'
                        ? '⊗'
                        : step.outcome === 'running'
                          ? '◌'
                          : step.outcome === 'pending'
                            ? '·'
                            : step.outcome === 'skipped'
                              ? '—'
                              : '⚠';
                  return (
                    <div
                      key={i}
                      className="transition-all"
                      style={{
                        opacity: replayState === 'idle' ? 1 : visible ? 1 : 0.2,
                        transform: isCurrent ? 'translateX(4px)' : 'none',
                      }}
                    >
                      <div
                        className="px-3 py-2 rounded text-xs"
                        style={{
                          backgroundColor: isCurrent ? 'rgba(201,183,135,0.06)' : 'transparent',
                          border: isCurrent
                            ? '1px solid rgba(201,183,135,0.2)'
                            : '1px solid transparent',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="font-mono"
                            style={{ color: 'var(--color-a11oy-text-ghost)' }}
                          >
                            {step.step}.
                          </span>
                          {visible && <span style={{ color: outColor }}>{statusDot}</span>}
                          <span style={{ color: 'var(--color-a11oy-text)' }}>{step.label}</span>
                          <span
                            className="ml-auto font-mono text-xs"
                            style={{ color: 'var(--color-a11oy-text-ghost)', flexShrink: 0 }}
                          >
                            {step.actor}
                          </span>
                        </div>
                        {visible && (
                          <div
                            className="text-xs mt-0.5 pl-5"
                            style={{ color: 'var(--color-a11oy-text-ghost)' }}
                          >
                            {step.detail}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {replayState === 'done' && (
            <div
              className="mt-4 p-4 rounded-lg text-center"
              style={{
                backgroundColor: 'rgba(201,183,135,0.08)',
                border: '1px solid rgba(201,183,135,0.2)',
              }}
            >
              <div className="text-sm font-semibold mb-1" style={{ color: '#c9b787' }}>
                Fixture Walkthrough Complete
              </div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                All {steps.length} source rows revealed. Preserved fixture outcome:{' '}
                {data.outcome.toUpperCase()}. No proof-chain or execution claim was created.
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <SectionTitle>Replay Metadata</SectionTitle>
            <Card className="text-xs">
              <div className="flex flex-col gap-2">
                <div>
                  <div
                    className="font-mono mb-0.5"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    OUTCOME
                  </div>
                  <div style={{ color: OUTCOME_COLORS[data.outcome] ?? '#8a8a8a' }}>
                    {data.outcome.toUpperCase()}
                  </div>
                </div>
                <div>
                  <div
                    className="font-mono mb-0.5"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    TENANT · DOMAIN
                  </div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>
                    {data.tenant} · {data.domain}
                  </div>
                </div>
                <div>
                  <div
                    className="font-mono mb-0.5"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    DURATION
                  </div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(data.durationMs)}</div>
                </div>
                <div>
                  <div
                    className="font-mono mb-0.5"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    APPROVAL TIER
                  </div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{data.approvalTier}</div>
                </div>
                {data.approvedBy && (
                  <div>
                    <div
                      className="font-mono mb-0.5"
                      style={{ color: 'var(--color-a11oy-text-ghost)' }}
                    >
                      APPROVED BY
                    </div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{data.approvedBy}</div>
                  </div>
                )}
                <div>
                  <div
                    className="font-mono mb-0.5"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    TRACE SPANS
                  </div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>
                    {data.traceSpans} spans · {data.toolCalls} tool calls
                  </div>
                </div>
                {data.proofRef && (
                  <div>
                    <div
                      className="font-mono mb-0.5"
                      style={{ color: 'var(--color-a11oy-text-ghost)' }}
                    >
                      PROOF REF
                    </div>
                    <div className="font-mono" style={{ color: '#b08d52' }}>
                      ◇ {data.proofRef}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {data.evalDisposition && (
            <div>
              <SectionTitle>MirrorEval Result</SectionTitle>
              <Card className="text-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-1.5 py-0.5 rounded font-mono"
                    style={{
                      color:
                        data.evalDisposition === 'pass'
                          ? '#c9b787'
                          : data.evalDisposition === 'blocked'
                            ? '#f5f5f5'
                            : '#c9b787',
                      backgroundColor:
                        data.evalDisposition === 'pass'
                          ? 'rgba(201,183,135,0.12)'
                          : 'rgba(245,245,245,0.12)',
                    }}
                  >
                    {data.evalDisposition.replace(/_/g, ' ')}
                  </span>
                </div>
                {data.evalComposite !== null && (
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Composite: {Math.round(data.evalComposite * 100)}% · {data.evalDimensionCount}{' '}
                    {data.evalDimensionCount === 1 ? 'dimension' : 'dimensions'} scored
                  </div>
                )}
              </Card>
            </div>
          )}

          {data.failureClass && (
            <div>
              <SectionTitle>Failure Analysis</SectionTitle>
              <Card className="text-xs">
                <div
                  className="mb-1 px-1.5 py-0.5 rounded inline-block"
                  style={{ backgroundColor: 'rgba(245,245,245,0.08)', color: '#f5f5f5' }}
                >
                  {data.failureClass.replace(/_/g, ' ')}
                </div>
                {data.failureExplanation && (
                  <div className="mt-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                    {data.failureExplanation}
                  </div>
                )}
                {data.retryRecommendation && (
                  <div
                    className="mt-2 pt-2"
                    style={{
                      borderTop: '1px solid var(--color-a11oy-border)',
                      color: 'var(--color-a11oy-text-ghost)',
                    }}
                  >
                    Retry: {data.retryRecommendation}
                  </div>
                )}
              </Card>
            </div>
          )}

          <div>
            <SectionTitle>Replay Certification</SectionTitle>
            <Card className="text-xs">
              {!certDecision ? (
                <>
                  <div className="mb-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Record a local review disposition for this fixture presentation. The choice is
                    not persisted, does not certify a receipt, and grants no operational authority.
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCertDecision('certified')}
                      className="w-full text-xs px-3 py-1.5 rounded text-left min-h-11"
                      style={{
                        backgroundColor: 'rgba(34,197,94,0.12)',
                        color: '#22c55e',
                        border: '1px solid rgba(34,197,94,0.3)',
                        cursor: 'pointer',
                      }}
                    >
                      ✓ Accept fixture view
                    </button>
                    <button
                      type="button"
                      onClick={() => setCertDecision('flagged')}
                      className="w-full text-xs px-3 py-1.5 rounded text-left min-h-11"
                      style={{
                        backgroundColor: 'rgba(201,183,135,0.08)',
                        color: '#c9b787',
                        border: '1px solid rgba(201,183,135,0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      ⚑ Flag for review
                    </button>
                    <button
                      type="button"
                      onClick={() => setCertDecision('rejected')}
                      className="w-full text-xs px-3 py-1.5 rounded text-left min-h-11"
                      style={{
                        backgroundColor: 'rgba(239,68,68,0.08)',
                        color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.2)',
                        cursor: 'pointer',
                      }}
                    >
                      ✕ Reject outcome
                    </button>
                  </div>
                </>
              ) : certDecision === 'certified' ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#22c55e' }}>✓</span>
                    <span style={{ color: '#22c55e' }}>
                      Fixture view accepted locally — no receipt certified.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCertDecision(null)}
                    className="text-xs font-mono ml-2 min-h-11 min-w-11 inline-flex items-center justify-center"
                    style={{
                      color: 'var(--color-a11oy-text-ghost)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    undo
                  </button>
                </div>
              ) : certDecision === 'flagged' ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#c9b787' }}>⚑</span>
                    <span style={{ color: '#c9b787' }}>Flagged for investigation.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCertDecision(null)}
                    className="text-xs font-mono ml-2 min-h-11 min-w-11 inline-flex items-center justify-center"
                    style={{
                      color: 'var(--color-a11oy-text-ghost)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    undo
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: '#ef4444' }}>✕</span>
                    <span style={{ color: '#ef4444' }}>Outcome rejected — record disputed.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCertDecision(null)}
                    className="text-xs font-mono ml-2 min-h-11 min-w-11 inline-flex items-center justify-center"
                    style={{
                      color: 'var(--color-a11oy-text-ghost)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    undo
                  </button>
                </div>
              )}
            </Card>
          </div>

          <Link
            href={`${BASE}/replay`}
            className="w-full min-h-11 min-w-11 inline-flex items-center justify-center text-center text-xs px-3 py-2 rounded border"
            style={{
              color: 'var(--color-a11oy-text-sub)',
              borderColor: 'var(--color-a11oy-border)',
              textDecoration: 'none',
            }}
          >
            ← Back to Replay Index
          </Link>
        </div>
      </div>

      <div
        className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2"
        style={{
          backgroundColor: 'rgba(201,183,135,0.06)',
          border: '1px solid rgba(201,183,135,0.15)',
          color: 'var(--color-a11oy-text-ghost)',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-a11oy-blue)]" /> DEMO fixture view
        — records come from tracked source data. No operational ledger fetch, immutable audit trail,
        or runtime verification is represented.
      </div>
    </Layout>
  );
}
