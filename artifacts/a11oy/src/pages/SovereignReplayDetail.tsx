import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Link } from 'wouter';
import { Layout } from '../components/layout';
import { PageHeader, Card, SectionTitle, ActionButton, DemoBadge } from '../components/ui';

const API = '/api/a11oy';
const BASE = (import.meta.env.BASE_URL ?? '/a11oy/').replace(/\/$/, '');

interface ReplayStep {
  step: number; label: string; actor: string; ts: string;
  outcome: 'success' | 'blocked' | 'failed' | 'skipped';
  detail: string;
}

interface ReplayReport {
  id: string; workcellId: string; workcellName: string; tenant: string; domain: string;
  outcome: string; completedAt: string; durationMs: number;
  evalDisposition: string | null; evalComposite: number | null; proofRef: string | null;
  approvalTier: string; approvedBy: string | null; approvedAt: string | null;
  traceSpans: number; toolCalls: number; failureClass: string | null;
  failureExplanation: string | null; retryRecommendation: string | null;
  steps: ReplayStep[];
}

const OUTCOME_COLORS: Record<string, string> = {
  success: '#c9b787', blocked: '#f5f5f5', failed: '#c9b787', skipped: '#5e5e5e',
};

function fmt(ms: number) {
  const s = Math.floor(ms / 1000);
  return s > 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;
}

export function SovereignReplayDetail() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ReplayReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [replayState, setReplayState] = useState<'idle' | 'playing' | 'done'>('idle');
  const [stepIdx, setStepIdx] = useState(-1);
  const [speed, setSpeed] = useState(800);

  useEffect(() => {
    fetch(`${API}/replay/${params.id}`)
      .then(r => r.json())
      .then(d => {
        if (d.ok) { setData(d.data); }
        else { setNotFound(true); }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  const steps = data?.steps ?? [];

  useEffect(() => {
    if (replayState !== 'playing') return;
    if (stepIdx >= steps.length - 1) { setReplayState('done'); return; }
    const t = setTimeout(() => setStepIdx(i => i + 1), speed);
    return () => clearTimeout(t);
  }, [replayState, stepIdx, steps.length, speed]);

  const startReplay = () => { setStepIdx(-1); setReplayState('playing'); };
  const pauseReplay = () => setReplayState('idle');
  const resetReplay = () => { setStepIdx(-1); setReplayState('idle'); };

  if (loading) {
    return (
      <Layout>
        <div className="text-xs animate-pulse py-12 text-center" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
          Loading replay…
        </div>
      </Layout>
    );
  }

  if (notFound || !data) {
    return (
      <Layout>
        <div className="text-center py-24">
          <div className="text-sm mb-4" style={{ color: 'var(--color-a11oy-text-ghost)' }}>Replay not found: {params.id}</div>
          <Link href={`${BASE}/replay`} className="text-xs" style={{ color: 'var(--color-a11oy-blue)' }}>← Back to Replay Index</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-4 flex items-center gap-3">
        <Link href={`${BASE}/replay`} className="text-xs font-mono" style={{ color: 'var(--color-a11oy-blue)', textDecoration: 'none' }}>← All Replays</Link>
        <span style={{ color: 'var(--color-a11oy-border)' }}>/</span>
        <span className="text-xs font-mono truncate" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{data.workcellName}</span>
      </div>

      <PageHeader
        label="SOVEREIGN REPLAY"
        title={`↩ ${data.workcellName}`}
        subtitle="Step-by-step replay of the sovereign workcell execution trace — signals, skills, eval, approval gate, and proof chain."
        status="DEMO"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {replayState === 'playing' ? (
                  <ActionButton variant="primary" onClick={pauseReplay}>⏸ Pause</ActionButton>
                ) : (
                  <ActionButton variant="primary" onClick={startReplay}>
                    {replayState === 'done' ? '↩ Restart' : '▶ Play Replay'}
                  </ActionButton>
                )}
                <ActionButton variant="ghost" onClick={resetReplay}>↺ Reset</ActionButton>
              </div>
              <div className="flex items-center gap-2 text-xs ml-4">
                <span style={{ color: 'var(--color-a11oy-text-ghost)' }}>Speed:</span>
                {[2000, 1000, 600, 300].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className="px-2 py-0.5 rounded font-mono"
                    style={{
                      backgroundColor: speed === s ? 'rgba(201,183,135,0.15)' : 'transparent',
                      color: speed === s ? '#c9b787' : 'var(--color-a11oy-text-ghost)',
                      border: 'none', cursor: 'pointer', fontSize: 11,
                    }}
                  >
                    {s === 2000 ? '0.5×' : s === 1000 ? '1×' : s === 600 ? '1.5×' : '2×'}
                  </button>
                ))}
              </div>
              <div className="ml-auto text-xs font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                {stepIdx + 1} / {steps.length} steps
              </div>
            </div>
            <div className="mt-3 h-1.5 rounded-full" style={{ backgroundColor: 'var(--color-a11oy-muted)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: steps.length > 0 ? `${Math.max(0, ((stepIdx + 1) / steps.length) * 100)}%` : '0%',
                  backgroundColor: replayState === 'done' ? '#c9b787' : '#c9b787',
                }}
              />
            </div>
          </Card>

          <SectionTitle>Execution Trace</SectionTitle>
          <Card>
            {steps.length === 0 ? (
              <div className="text-center py-8 text-xs" style={{ color: 'var(--color-a11oy-text-ghost)' }}>No execution trace available.</div>
            ) : (
              <div className="flex flex-col gap-1">
                {steps.map((step, i) => {
                  const visible = i <= stepIdx || replayState === 'idle';
                  const isCurrent = i === stepIdx && replayState === 'playing';
                  const outColor = OUTCOME_COLORS[step.outcome] ?? '#5e5e5e';
                  const statusDot = step.outcome === 'success' ? '✓' : step.outcome === 'blocked' ? '⊗' : '⚠';
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
                          border: isCurrent ? '1px solid rgba(201,183,135,0.2)' : '1px solid transparent',
                        }}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{step.step}.</span>
                          {visible && <span style={{ color: outColor }}>{statusDot}</span>}
                          <span style={{ color: 'var(--color-a11oy-text)' }}>{step.label}</span>
                          <span className="ml-auto font-mono text-xs" style={{ color: 'var(--color-a11oy-text-ghost)', flexShrink: 0 }}>{step.actor}</span>
                        </div>
                        {visible && (
                          <div className="text-xs mt-0.5 pl-5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>{step.detail}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {replayState === 'done' && (
            <div className="mt-4 p-4 rounded-lg text-center" style={{ backgroundColor: 'rgba(201,183,135,0.08)', border: '1px solid rgba(201,183,135,0.2)' }}>
              <div className="text-sm font-semibold mb-1" style={{ color: '#c9b787' }}>Replay Complete</div>
              <div className="text-xs" style={{ color: 'var(--color-a11oy-text-sub)' }}>
                All {steps.length} steps replayed. Outcome: {data.outcome.toUpperCase()}
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
                  <div className="font-mono mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>OUTCOME</div>
                  <div style={{ color: OUTCOME_COLORS[data.outcome] ?? '#5e5e5e' }}>{data.outcome.toUpperCase()}</div>
                </div>
                <div>
                  <div className="font-mono mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>TENANT · DOMAIN</div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{data.tenant} · {data.domain}</div>
                </div>
                <div>
                  <div className="font-mono mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>DURATION</div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{fmt(data.durationMs)}</div>
                </div>
                <div>
                  <div className="font-mono mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>APPROVAL TIER</div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{data.approvalTier}</div>
                </div>
                {data.approvedBy && (
                  <div>
                    <div className="font-mono mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>APPROVED BY</div>
                    <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{data.approvedBy}</div>
                  </div>
                )}
                <div>
                  <div className="font-mono mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>TRACE SPANS</div>
                  <div style={{ color: 'var(--color-a11oy-text-sub)' }}>{data.traceSpans} spans · {data.toolCalls} tool calls</div>
                </div>
                {data.proofRef && (
                  <div>
                    <div className="font-mono mb-0.5" style={{ color: 'var(--color-a11oy-text-ghost)' }}>PROOF REF</div>
                    <div className="font-mono" style={{ color: '#b08d52' }}>◇ {data.proofRef}</div>
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
                      color: data.evalDisposition === 'pass' ? '#c9b787' : data.evalDisposition === 'blocked' ? '#f5f5f5' : '#c9b787',
                      backgroundColor: data.evalDisposition === 'pass' ? 'rgba(201,183,135,0.12)' : 'rgba(245,245,245,0.12)',
                    }}
                  >
                    {data.evalDisposition.replace(/_/g, ' ')}
                  </span>
                </div>
                {data.evalComposite !== null && (
                  <div style={{ color: 'var(--color-a11oy-text-ghost)' }}>
                    Composite: {Math.round(data.evalComposite * 100)}%
                  </div>
                )}
              </Card>
            </div>
          )}

          {data.failureClass && (
            <div>
              <SectionTitle>Failure Analysis</SectionTitle>
              <Card className="text-xs">
                <div className="mb-1 px-1.5 py-0.5 rounded inline-block" style={{ backgroundColor: 'rgba(245,245,245,0.08)', color: '#f5f5f5' }}>
                  {data.failureClass.replace(/_/g, ' ')}
                </div>
                {data.failureExplanation && (
                  <div className="mt-1" style={{ color: 'var(--color-a11oy-text-sub)' }}>{data.failureExplanation}</div>
                )}
                {data.retryRecommendation && (
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--color-a11oy-border)', color: 'var(--color-a11oy-text-ghost)' }}>
                    Retry: {data.retryRecommendation}
                  </div>
                )}
              </Card>
            </div>
          )}

          <Link
            href={`${BASE}/replay`}
            className="block text-center text-xs px-3 py-2 rounded border"
            style={{ color: 'var(--color-a11oy-text-sub)', borderColor: 'var(--color-a11oy-border)', textDecoration: 'none' }}
          >
            ← Back to Replay Index
          </Link>
        </div>
      </div>

      <div className="mt-6 p-3 rounded-lg text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(201,183,135,0.06)', border: '1px solid rgba(201,183,135,0.15)', color: 'var(--color-a11oy-text-ghost)' }}>
        <DemoBadge /> Sovereign replay data is fetched from the A11oy Proof Ledger. Demo replays are seeded from the sovereign API.
      </div>
    </Layout>
  );
}
