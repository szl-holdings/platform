import { useState, useEffect } from 'react';
import { useParams, Link } from 'wouter';
import { Layout } from '../components/layout';
import {
  PageHeader,
  Card,
  SectionTitle,
  ActionButton,
  VerdictBadge,
  TraceStep,
} from '../components/ui';
import { SEED_WORKCELLS } from '@workspace/a11oy-fabric';

const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

export function WorkcellReplayDetail() {
  const params = useParams<{ id: string }>();
  const wc = SEED_WORKCELLS.find((w) => w.id === params.id);
  const [replayState, setReplayState] = useState<'idle' | 'playing' | 'done'>('idle');
  const [stepIdx, setStepIdx] = useState(-1);
  const [speed, setSpeed] = useState(800);

  const steps = wc
    ? [
        {
          step: 'Signal Mesh: signals ingested and routed',
          status: 'completed',
          note: wc.signals.slice(0, 2).join(', '),
        },
        {
          step: 'Causal Core: evidence graph assembled',
          status: 'completed',
          note: `${wc.signals.length} causal links traced`,
        },
        {
          step: 'Context Engine: context pack built',
          status: 'completed',
          note: `${JSON.stringify(wc.contextPack).slice(0, 60)}…`,
        },
        ...wc.agentSequence.map((a) => ({
          step: `${a.role}: ${a.action}`,
          status:
            wc.status === 'completed'
              ? 'completed'
              : wc.status === 'running'
                ? 'running'
                : 'pending',
          note: `Agent: ${a.agentId}`,
        })),
        {
          step: 'Covenant Layer: policy gate evaluated',
          status: wc.requiresApproval ? 'running' : 'completed',
          note: wc.requiresApproval
            ? `Pending ${wc.actionBrief.approvalTier} approval`
            : 'All policy clauses satisfied',
        },
        {
          step: 'MirrorEval: recommendation scored',
          status: 'completed',
          note: `Verdict: ${wc.mirrorEvalResult.verdict} · Score: ${Math.round(wc.mirrorEvalResult.score * 100)}%`,
        },
        {
          step: 'Demo Proof Ledger: seed PCE contract referenced',
          status: wc.verificationResult.status === 'passed' ? 'completed' : 'failed',
          note: `Contract: ${wc.pceContractId}`,
        },
      ]
    : [];

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

  if (!wc) {
    return (
      <Layout>
        <div className="text-center py-24">
          <div className="text-sm mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
            Workcell not found: {params.id}
          </div>
          <Link
            href={`${BASE}/workcells`}
            className="text-xs"
            style={{ color: 'var(--color-a11oy-blue)' }}
          >
            ← Back to Workcells
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href={`${BASE}/workcells`}
          className="text-xs font-mono"
          style={{ color: 'var(--color-a11oy-blue)', textDecoration: 'none' }}
        >
          ← All Workcells
        </Link>
        <span style={{ color: 'var(--color-a11oy-border)' }}>/</span>
        <Link
          href={`${BASE}/workcells/${wc.id}`}
          className="text-xs font-mono"
          style={{ color: 'var(--color-a11oy-blue)', textDecoration: 'none' }}
        >
          {wc.name}
        </Link>
        <span style={{ color: 'var(--color-a11oy-border)' }}>/</span>
        <span className="text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          replay
        </span>
      </div>

      <PageHeader
        label="WORKCELL REPLAY"
        title={`↩ ${wc.name}`}
        subtitle="Browser-local replay of a seeded Workcell trace with agent roles and demonstration evidence."
        status={wc.evidenceState}
      />

      <div
        className="mb-6 rounded-xl border border-white/15 bg-white/[0.03] p-4 text-sm leading-6"
        style={{ color: 'var(--color-a11oy-text-sub)' }}
        role="note"
      >
        <strong style={{ color: 'var(--color-a11oy-text)' }}>Demo replay:</strong>{' '}
        {wc.evidenceReason} Playback changes only local UI state.
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Replay Controls */}
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
                    className="min-h-11 px-3 py-2 rounded font-mono"
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
            {/* Progress Bar */}
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
                  backgroundColor: replayState === 'done' ? '#c9b787' : '#c9b787',
                }}
              />
            </div>
          </Card>

          {/* Trace Steps */}
          <SectionTitle>Execution Trace</SectionTitle>
          <Card>
            {steps.length === 0 ? (
              <div
                className="text-center py-8 text-xs"
                style={{ color: 'var(--color-a11oy-text-ghost)' }}
              >
                No execution trace available for this workcell.
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {steps.map((step, i) => {
                  const visible = i <= stepIdx || replayState === 'idle';
                  const isCurrent = i === stepIdx && replayState === 'playing';
                  return (
                    <div
                      key={step.step}
                      className="transition-all"
                      style={{
                        opacity: replayState === 'idle' ? 1 : visible ? 1 : 0.2,
                        transform: isCurrent ? 'translateX(4px)' : 'none',
                      }}
                    >
                      <TraceStep
                        step={`${i + 1}. ${step.step}`}
                        status={visible ? (isCurrent ? 'running' : step.status) : 'pending'}
                        note={visible ? step.note : undefined}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Done banner */}
          {replayState === 'done' && (
            <div
              className="mt-4 p-4 rounded-lg text-center"
              style={{
                backgroundColor: 'rgba(201,183,135,0.08)',
                border: '1px solid rgba(201,183,135,0.2)',
              }}
            >
              <div className="text-sm font-semibold mb-1" style={{ color: '#c9b787' }}>
                Replay Complete
              </div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                All {steps.length} steps replayed. MirrorEval verdict: {wc.mirrorEvalResult.verdict}
              </div>
            </div>
          )}
        </div>

        {/* Right rail */}
        <div className="flex flex-col gap-4">
          <div>
            <SectionTitle>Workcell Metadata</SectionTitle>
            <Card className="text-xs">
              <div className="flex flex-col gap-2">
                <div>
                  <div
                    className="font-mono mb-0.5"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    STATUS
                  </div>
                  <div
                    style={{
                      color: {
                        running: '#c9b787',
                        completed: '#c9b787',
                        error: '#f5f5f5',
                        paused: '#5e5e5e',
                        idle: '#5e5e5e',
                      }[wc.status],
                    }}
                  >
                    {wc.status}
                  </div>
                </div>
                <div>
                  <div
                    className="font-mono mb-0.5"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    OBJECTIVE
                  </div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{wc.objective}</div>
                </div>
                <div>
                  <div
                    className="font-mono mb-0.5"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    CREATED
                  </div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>
                    {wc.createdAt.slice(0, 10)}
                  </div>
                </div>
                <div>
                  <div
                    className="font-mono mb-0.5"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    TRACE ID
                  </div>
                  <div className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    {wc.executionTraceId}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle>MirrorEval</SectionTitle>
            <Card className="text-xs">
              <VerdictBadge verdict={wc.mirrorEvalResult.verdict} />
              <div className="mt-2" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                Score: {Math.round(wc.mirrorEvalResult.score * 100)}%
              </div>
              <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                Evaluator: {wc.mirrorEvalResult.evaluatorModel}
              </div>
            </Card>
          </div>

          <div>
            <SectionTitle>Agent Sequence</SectionTitle>
            <div className="flex flex-col gap-1.5">
              {wc.agentSequence.map((a, i) => (
                <div
                  key={a.agentId}
                  className="text-xs px-2 py-1.5 rounded border"
                  style={{
                    backgroundColor: 'var(--color-a11oy-card)',
                    borderColor: 'var(--color-a11oy-border)',
                  }}
                >
                  <span
                    className="font-mono mr-2"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    #{i + 1}
                  </span>
                  <span style={{ color: 'var(--color-a11oy-text)' }}>{a.role}</span>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--color-a11oy-text-ghost)' }}
                  >
                    {a.action}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Link
              href={`${BASE}/workcells/${wc.id}`}
              className="block text-center text-xs px-3 py-2 rounded border"
              style={{
                color: 'var(--color-a11oy-text-sub)',
                borderColor: 'var(--color-a11oy-border)',
                textDecoration: 'none',
              }}
            >
              ↗ Full Workcell Detail
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
