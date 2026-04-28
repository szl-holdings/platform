/**
 * A11oy — Loop Reasoner.
 *
 * The agent loop, made explicit. Demonstrates an agent iteratively refining a
 * plan via the Ouroboros kernel; the loop exits when successive drafts agree
 * (cross-step consistency) or when delta drops below threshold.
 *
 * This is the agent-runtime instantiation of the Ouroboros thesis:
 *   "An agent's plan is a fixed-point computation. The loop is the unit of
 *    governable compute."
 */

import { useCallback, useMemo, useState } from 'react';
import {
  type LoopTrace,
  allocateDepth,
  runLoop,
  stringConsistency,
} from '@workspace/ouroboros';
import {
  LoopGlyph,
  OuroborosTrace,
} from '@workspace/ouroboros/react';

interface PlanState {
  draft: string;
  considerations: string[];
  confidence: number;
}

const SCENARIOS: Array<{ id: string; label: string; objective: string; baseDraft: string }> = [
  {
    id: 'rollout',
    label: 'Rollout decision',
    objective: 'Decide whether to ship v3.4 to the EU tenant cohort tonight.',
    baseDraft: 'Ship v3.4 to EU at 22:00 UTC.',
  },
  {
    id: 'incident',
    label: 'Incident triage',
    objective: 'Triage the 03:14 latency spike on the orders pipeline.',
    baseDraft: 'Investigate orders pipeline latency.',
  },
  {
    id: 'budget',
    label: 'Budget reallocation',
    objective: 'Reallocate Q3 inference spend after the Sentra alert volume drop.',
    baseDraft: 'Move 15% of Sentra budget to A11oy retrieval.',
  },
];

/**
 * Deterministic plan refiner. Each step appends a new consideration drawn from
 * the objective text and tightens the draft. Convergence is monotone — the
 * draft text stops growing when the model has nothing new to add.
 */
function buildRefiner(objective: string) {
  const tokens = objective
    .split(/\s+/)
    .filter((t) => t.length > 4)
    .slice(0, 6);
  return async function refine(state: PlanState, i: number): Promise<{ state: PlanState; output: string }> {
    const considerations = [...state.considerations];
    const newAdditions: string[] = [];
    if (tokens[i]) {
      newAdditions.push(`Account for "${tokens[i]}".`);
    }
    if (i === 1) newAdditions.push('Confirm rollback window.');
    if (i === 2) newAdditions.push('Notify on-call lead.');
    if (i === 3) newAdditions.push('Pin observability dashboard.');
    for (const a of newAdditions) {
      if (!considerations.includes(a)) considerations.push(a);
    }
    const confidence = Math.min(1, state.confidence + 0.18 + (i === 0 ? 0 : 0.05));
    const draft =
      considerations.length === state.considerations.length
        ? state.draft
        : `${state.draft.replace(/\.$/, '')}, considering: ${considerations.slice(-3).join(' ')}`;
    // tiny synthetic latency so the trace shows differentiated step durations
    await new Promise((res) => setTimeout(res, 8 + i * 4));
    return {
      state: { draft, considerations, confidence },
      output: draft,
    };
  };
}

const planDelta = (a: PlanState, b: PlanState): number => {
  const consDelta = Math.abs(a.considerations.length - b.considerations.length);
  const draftDelta = a.draft === b.draft ? 0 : 1 - stringConsistency(a.draft, b.draft);
  const confDelta = Math.abs(a.confidence - b.confidence);
  return consDelta * 0.5 + draftDelta + confDelta;
};

export function LoopReasoner() {
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0]!.id);
  const [trace, setTrace] = useState<LoopTrace<PlanState, string> | null>(null);
  const [running, setRunning] = useState(false);
  const [stakes, setStakes] = useState(1);
  const [maxSteps, setMaxSteps] = useState(8);
  const [adaptive, setAdaptive] = useState(false);

  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0]!,
    [scenarioId],
  );

  const allocator = useMemo(
    () =>
      allocateDepth({
        recentDeltas: trace ? trace.steps.slice(-3).map((s) => s.deltaMagnitude).reverse() : [],
        maxSteps,
        stakes,
      }),
    [trace, maxSteps, stakes],
  );

  const onRun = useCallback(async () => {
    setRunning(true);
    try {
      const refine = buildRefiner(scenario.objective);
      // When adaptive mode is on AND we have a prior trace, use the
      // allocator's recommended budget (capped by the user's ceiling). This
      // is the operational use of EntropyDepthAllocator — not just display.
      const effectiveBudget =
        adaptive && trace
          ? Math.min(maxSteps, Math.max(1, allocator.recommendedSteps))
          : maxSteps;
      const result = await runLoop<PlanState, string>({
        initialState: {
          draft: scenario.baseDraft,
          considerations: [],
          confidence: 0.4,
        },
        step: refine,
        delta: planDelta,
        consistency: (a, b) => stringConsistency(a, b),
        config: {
          maxSteps: effectiveBudget,
          convergenceThreshold: 0.02,
          label: `a11oy.agent.refine[${scenario.id}]${adaptive && trace ? '.adaptive' : ''}`,
        },
      });
      setTrace(result);
    } finally {
      setRunning(false);
    }
  }, [scenario, maxSteps, adaptive, trace, allocator]);

  const finalConfidence = trace?.finalState.confidence ?? 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        color: '#eaeaea',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        padding: '32px clamp(16px, 4vw, 64px)',
      }}
      data-testid="page-loop-reasoner"
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <LoopGlyph size={56} convergence={finalConfidence} spinning={running} />
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(201,183,135,0.85)',
              marginBottom: 4,
            }}
          >
            A11oy · Loop Reasoner
          </div>
          <h1 style={{ fontSize: 24, margin: 0, fontWeight: 500, letterSpacing: '-0.01em' }}>
            Plans as fixed-points
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.55)', maxWidth: 720 }}>
            The agent drafts, critiques, redrafts. The loop terminates when the draft stops
            changing — or when an early step's draft already agrees with what the loop would
            converge to. Cross-step consistency turns "we ran fewer steps" into "we ran enough."
          </p>
        </div>
      </header>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 320px) 1fr',
          gap: 24,
          marginTop: 24,
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6,
            padding: 16,
          }}
        >
          <h2 style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            Decision
          </h2>
          <select
            value={scenarioId}
            onChange={(e) => {
              setScenarioId(e.target.value);
              setTrace(null);
            }}
            style={{
              marginTop: 10,
              width: '100%',
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.04)',
              color: '#eaeaea',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 4,
              fontFamily: 'inherit',
              fontSize: 13,
            }}
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <p style={{ marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
            {scenario.objective}
          </p>

          <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
              Max loop steps · {maxSteps}
              <input
                type="range"
                min={2}
                max={12}
                value={maxSteps}
                onChange={(e) => setMaxSteps(Number(e.target.value))}
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
              Stakes multiplier · {stakes.toFixed(1)}×
              <input
                type="range"
                min={0.5}
                max={3}
                step={0.1}
                value={stakes}
                onChange={(e) => setStakes(Number(e.target.value))}
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
            <label
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={adaptive}
                onChange={(e) => setAdaptive(e.target.checked)}
                data-testid="adaptive-toggle"
              />
              <span>
                Adaptive depth budget{' '}
                {adaptive ? (
                  trace ? (
                    <span style={{ color: '#a0c4ff' }}>
                      · using {Math.min(maxSteps, Math.max(1, allocator.recommendedSteps))} of {maxSteps}
                    </span>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>· needs prior run</span>
                  )
                ) : (
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>· off</span>
                )}
              </span>
            </label>
          </div>

          <button
            type="button"
            onClick={onRun}
            disabled={running}
            data-testid="run-loop"
            style={{
              marginTop: 18,
              width: '100%',
              padding: '10px 14px',
              background: running ? 'rgba(201,183,135,0.18)' : '#c9b787',
              color: running ? '#c9b787' : '#0a0a0a',
              border: 'none',
              borderRadius: 4,
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              cursor: running ? 'wait' : 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            {running ? 'Looping…' : 'Run Loop'}
          </button>

          <div
            style={{
              marginTop: 18,
              padding: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 4,
              fontSize: 11,
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 9, marginBottom: 6 }}>
              Depth allocator
            </div>
            <div>recommended <span style={{ color: '#c9b787' }}>{allocator.recommendedSteps}</span> step(s)</div>
            <div>trajectory: {allocator.trajectory}</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{allocator.reason}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
          {trace ? (
            <>
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  padding: 16,
                }}
              >
                <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
                  Converged plan
                </div>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: '#eaeaea', lineHeight: 1.55 }}>
                  {trace.finalState.draft}
                </p>
                <ul style={{ marginTop: 10, paddingLeft: 18, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                  {trace.finalState.considerations.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <div style={{ marginTop: 14, display: 'flex', gap: 24, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                  <span>confidence <span style={{ color: '#c9b787' }}>{(trace.finalState.confidence * 100).toFixed(0)}%</span></span>
                  <span>steps <span style={{ color: '#eaeaea' }}>{trace.stepsRun}/{trace.maxSteps}</span></span>
                  <span>exit <span style={{ color: '#c9b787' }}>{trace.exitReason}</span></span>
                </div>
              </div>
              <OuroborosTrace
                trace={trace}
                describeOutput={(o) => (typeof o === 'string' ? o : '')}
              />
            </>
          ) : (
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.12)',
                borderRadius: 6,
                padding: 32,
                color: 'rgba(255,255,255,0.45)',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              Run the loop to generate a convergence trace.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default LoopReasoner;
