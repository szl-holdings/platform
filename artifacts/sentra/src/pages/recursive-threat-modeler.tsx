/**
 * Sentra — Recursive Threat Modeler.
 *
 * A threat model is never finished, only stable. This page runs threat scoring
 * across STRIDE-shaped categories as an Ouroboros loop. Each pass redistributes
 * probability mass across attack vectors; the loop exits when the risk surface
 * stops moving.
 *
 * The early-exit threshold is the governance dial: how stable do you need the
 * model to be before you brief the board?
 */

import { useCallback, useMemo, useState } from 'react';
import {
  type LoopTrace,
  allocateDepth,
  runLoop,
  vectorConsistency,
} from '@workspace/ouroboros';
import { LoopGlyph, OuroborosTrace } from '@workspace/ouroboros/react';

const VECTORS = [
  'Spoofing',
  'Tampering',
  'Repudiation',
  'Info Disclosure',
  'DoS',
  'Elevation',
  'Supply Chain',
  'Identity Threat',
] as const;

type VectorScores = number[]; // length = VECTORS.length

interface ThreatState {
  scores: VectorScores;
  iteration: number;
}

const SCENARIOS = [
  {
    id: 'baseline',
    label: 'Baseline production posture',
    seed: [0.42, 0.31, 0.18, 0.55, 0.28, 0.36, 0.61, 0.44],
    pressure: [0, 0, 0, 0.05, 0, 0, 0.06, 0.04],
  },
  {
    id: 'incident',
    label: 'Active credential-stuffing campaign',
    seed: [0.71, 0.22, 0.12, 0.4, 0.6, 0.51, 0.33, 0.78],
    pressure: [0.08, 0, 0, 0, 0.03, 0.04, 0, 0.07],
  },
  {
    id: 'sbom',
    label: 'SBOM advisory: 3 transitive deps',
    seed: [0.25, 0.39, 0.15, 0.32, 0.18, 0.28, 0.84, 0.22],
    pressure: [0, 0.02, 0, 0.01, 0, 0, 0.06, 0],
  },
] as const;

/**
 * Deterministic threat-relaxation step. On each pass, each vector's score
 * relaxes toward the weighted mean of its neighbours plus an exogenous
 * "pressure" signal. The fixed-point is the stable risk surface.
 */
function buildRelaxer(pressure: number[], stakes: number) {
  return async function relax(state: ThreatState): Promise<{ state: ThreatState; output: VectorScores }> {
    const next = state.scores.map((s, i) => {
      const left = state.scores[(i - 1 + state.scores.length) % state.scores.length]!;
      const right = state.scores[(i + 1) % state.scores.length]!;
      const neighborMean = (left + right) / 2;
      // Each pass moves 35% toward neighbour mean + the pressure term.
      const relaxed = s * 0.65 + neighborMean * 0.35 + (pressure[i] ?? 0) * stakes;
      return clamp01(relaxed);
    });
    await new Promise((r) => setTimeout(r, 6));
    return {
      state: { scores: next, iteration: state.iteration + 1 },
      output: next,
    };
  };
}

const scoresDelta = (a: ThreatState, b: ThreatState): number => {
  let s = 0;
  for (let i = 0; i < a.scores.length; i++) s += Math.abs(a.scores[i]! - b.scores[i]!);
  return s;
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export default function RecursiveThreatModeler() {
  const [scenarioId, setScenarioId] = useState<(typeof SCENARIOS)[number]['id']>(SCENARIOS[0].id);
  const [trace, setTrace] = useState<LoopTrace<ThreatState, VectorScores> | null>(null);
  const [running, setRunning] = useState(false);
  const [stakes, setStakes] = useState(1);
  const [maxSteps, setMaxSteps] = useState(10);
  const [adaptive, setAdaptive] = useState(false);

  const scenario = useMemo(
    () => SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0],
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

  const run = useCallback(async () => {
    setRunning(true);
    try {
      // Adaptive depth: when enabled and a prior trace exists, the
      // EntropyDepthAllocator's recommendation governs the actual budget
      // (capped by the user's ceiling). This is the operational use of the
      // primitive — not just a displayed recommendation.
      const effectiveBudget =
        adaptive && trace
          ? Math.min(maxSteps, Math.max(1, allocator.recommendedSteps))
          : maxSteps;
      const result = await runLoop<ThreatState, VectorScores>({
        initialState: { scores: [...scenario.seed], iteration: 0 },
        step: buildRelaxer([...scenario.pressure], stakes),
        delta: scoresDelta,
        consistency: (a, b) => vectorConsistency(a, b),
        config: {
          maxSteps: effectiveBudget,
          convergenceThreshold: 0.012,
          label: `sentra.threat.recursion[${scenario.id}]${adaptive && trace ? '.adaptive' : ''}`,
        },
      });
      setTrace(result);
    } finally {
      setRunning(false);
    }
  }, [scenario, stakes, maxSteps, adaptive, trace, allocator]);

  const finalScores = trace?.finalState.scores ?? scenario.seed;
  const top = useMemo(
    () =>
      finalScores
        .map((s, i) => ({ vector: VECTORS[i], score: s }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3),
    [finalScores],
  );
  const convergedConfidence = trace ? Math.max(0, 1 - (trace.steps.at(-1)?.deltaMagnitude ?? 1)) : 0;

  return (
    <div
      style={{
        minHeight: '100%',
        background: '#0a0a0a',
        color: '#eaeaea',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        padding: '28px clamp(16px, 4vw, 56px)',
      }}
      data-testid="page-recursive-threat-modeler"
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <LoopGlyph size={52} convergence={convergedConfidence} spinning={running} color="#7ed7c1" />
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'rgba(126,215,193,0.85)',
              marginBottom: 4,
            }}
          >
            Sentra · Recursive Threat Modeler
          </div>
          <h1 style={{ fontSize: 22, margin: 0, fontWeight: 500 }}>
            Risk surfaces that stop moving
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.55)', maxWidth: 720 }}>
            Each loop pass redistributes probability across the threat vectors. We exit when
            the surface converges; we elevate to human review when it doesn't.
          </p>
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 320px) 1fr',
          gap: 20,
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
            Scenario
          </h2>
          <select
            value={scenarioId}
            onChange={(e) => {
              setScenarioId(e.target.value as typeof scenarioId);
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
              fontSize: 13,
              fontFamily: 'inherit',
            }}
          >
            {SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 18, display: 'grid', gap: 10 }}>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
              Max loop depth · {maxSteps}
              <input
                type="range"
                min={2}
                max={16}
                value={maxSteps}
                onChange={(e) => setMaxSteps(Number(e.target.value))}
                style={{ width: '100%', marginTop: 4 }}
              />
            </label>
            <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
              Crisis stakes · {stakes.toFixed(1)}×
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
                    <span style={{ color: '#7ed7c1' }}>
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
            onClick={run}
            disabled={running}
            data-testid="run-recursion"
            style={{
              marginTop: 18,
              width: '100%',
              padding: '10px 14px',
              background: running ? 'rgba(126,215,193,0.18)' : '#7ed7c1',
              color: running ? '#7ed7c1' : '#0a0a0a',
              border: 'none',
              borderRadius: 4,
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: 500,
              cursor: running ? 'wait' : 'pointer',
              letterSpacing: '0.04em',
            }}
          >
            {running ? 'Recursing…' : 'Run Recursion'}
          </button>

          <div
            style={{
              marginTop: 16,
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
              Allocator
            </div>
            <div>recommends <span style={{ color: '#7ed7c1' }}>{allocator.recommendedSteps}</span> step(s)</div>
            <div>trajectory: {allocator.trajectory}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6,
              padding: 16,
            }}
          >
            <div style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>
              Stable risk surface
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 6 }}>
              {finalScores.map((s, i) => (
                <div key={VECTORS[i]} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 56px', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{VECTORS[i]}</span>
                  <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${(s * 100).toFixed(0)}%`,
                        height: '100%',
                        background: s > 0.6 ? '#ff8c8c' : s > 0.4 ? '#c9b787' : '#7ed7c1',
                        transition: 'width 220ms ease',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', textAlign: 'right' }}>
                    {(s * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>

            {trace ? (
              <div style={{ marginTop: 14, fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                Top vectors after convergence: <strong style={{ color: '#ff8c8c' }}>{top.map((t) => t.vector).join(', ')}</strong>.
                {' '}Loop exited as <span style={{ color: '#7ed7c1' }}>{trace.exitReason}</span>{' '}
                in {trace.stepsRun} of {trace.maxSteps} steps.
                {trace.earliestSafeExit >= 0 ? (
                  <> Surface was already trustworthy at step #{trace.earliestSafeExit} (cross-step consistency ≥ 95%).</>
                ) : null}
              </div>
            ) : null}
          </div>

          {trace ? (
            <OuroborosTrace
              trace={trace}
              describeOutput={(o) =>
                Array.isArray(o)
                  ? `top: ${[...o]
                      .map((v, i) => ({ v, i }))
                      .sort((a, b) => b.v - a.v)
                      .slice(0, 2)
                      .map((x) => `${VECTORS[x.i]} ${(x.v * 100).toFixed(0)}%`)
                      .join(', ')}`
                  : ''
              }
            />
          ) : (
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px dashed rgba(255,255,255,0.12)',
                borderRadius: 6,
                padding: 24,
                color: 'rgba(255,255,255,0.45)',
                fontSize: 13,
                textAlign: 'center',
              }}
            >
              Run the recursion to generate a convergence trace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
