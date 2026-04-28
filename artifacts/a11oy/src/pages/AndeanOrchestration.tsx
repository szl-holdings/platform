/**
 * A11oy — Andean Orchestration.
 *
 * The meta-loop: A11oy orchestrates Sentra (threat) and Amaru (sync) sub-loops
 * as a single Ouroboros pass. Each meta-step runs both child loops, collects
 * their convergence traces, and asks: "has the compound system stabilized?"
 *
 * Named for Amaru — the Inca cosmic serpent with two heads, one in hanan pacha
 * (upper world) and one in uku pacha (lower world). The two heads are Sentra
 * and Amaru; A11oy is the spine that connects them.
 *
 * Implements the §6 Distillation Corollary from the Ouroboros thesis:
 *   "A surprising convergence pattern in one loop is a candidate teacher
 *    signal for the others."
 */

import { useCallback, useState } from 'react';
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

interface SubLoopResult {
  name: string;
  convergedAtStep: number;
  finalDelta: number;
  finalConsistency: number;
}

interface MetaState {
  sentra: SubLoopResult;
  amaru: SubLoopResult;
  crossSignals: string[];
  systemStable: boolean;
}

function simulateSentraLoop(seed: number): SubLoopResult {
  const steps = 3 + (seed % 4);
  const delta = Math.max(0, 0.42 - steps * 0.09 + (seed % 3) * 0.02);
  const consistency = Math.min(1, 0.55 + steps * 0.08);
  return {
    name: 'Sentra · Recursive Threat Model',
    convergedAtStep: steps,
    finalDelta: Math.round(delta * 1000) / 1000,
    finalConsistency: Math.round(consistency * 1000) / 1000,
  };
}

function simulateAmaruLoop(seed: number): SubLoopResult {
  const steps = 2 + (seed % 5);
  const delta = Math.max(0, 0.38 - steps * 0.07 + (seed % 2) * 0.03);
  const consistency = Math.min(1, 0.60 + steps * 0.07);
  return {
    name: 'Amaru · Convergent Sync',
    convergedAtStep: steps,
    finalDelta: Math.round(delta * 1000) / 1000,
    finalConsistency: Math.round(consistency * 1000) / 1000,
  };
}

function deriveCrossSignals(
  sentra: SubLoopResult,
  amaru: SubLoopResult,
  metaStep: number,
): string[] {
  const signals: string[] = [];
  if (sentra.finalDelta > 0.15) {
    signals.push(
      `Sentra threat surface still shifting (δ=${sentra.finalDelta}). ` +
      `Amaru should hold sync until threat model stabilizes.`,
    );
  }
  if (amaru.finalDelta > 0.12 && sentra.finalConsistency > 0.85) {
    signals.push(
      `Amaru sync divergent but Sentra stable — investigate entity class ` +
      `drift as candidate Sentra investigation.`,
    );
  }
  if (
    sentra.finalConsistency > 0.9 &&
    amaru.finalConsistency > 0.9 &&
    metaStep > 1
  ) {
    signals.push(
      `Both sub-loops converged. Cross-distillation candidate: ` +
      `Sentra vectors → A11oy red-team scenarios; Amaru audit → Sentra entity watch.`,
    );
  }
  if (signals.length === 0) {
    signals.push(
      `Meta-step ${metaStep}: sub-loops still in progress. No cross-signal yet.`,
    );
  }
  return signals;
}

const SCENARIOS = [
  {
    id: 'normal',
    label: 'Routine operations',
    description: 'Nightly sync + scheduled threat re-scan',
  },
  {
    id: 'incident',
    label: 'Active incident',
    description: 'Sentra elevated alert level; Amaru sync held',
  },
  {
    id: 'drift',
    label: 'Entity drift detected',
    description: 'Amaru sync divergent on financial entities',
  },
];

export function AndeanOrchestration() {
  const [scenario, setScenario] = useState(SCENARIOS[0]);
  const [trace, setTrace] = useState<LoopTrace<MetaState, string> | null>(null);
  const [running, setRunning] = useState(false);
  const [useAdaptive, setUseAdaptive] = useState(false);

  const maxSteps = 8;

  const run = useCallback(async () => {
    setRunning(true);

    const scenarioSeed =
      scenario.id === 'incident' ? 7 : scenario.id === 'drift' ? 11 : 3;

    const initialState: MetaState = {
      sentra: simulateSentraLoop(scenarioSeed),
      amaru: simulateAmaruLoop(scenarioSeed),
      crossSignals: [],
      systemStable: false,
    };

    const effectiveMax = useAdaptive
      ? Math.min(
          maxSteps,
          allocateDepth({
            recentDeltas: [0.5, 0.35, 0.22],
            maxSteps,
            minSteps: 2,
          }).recommendedSteps,
        )
      : maxSteps;

    const result = await runLoop<MetaState, string>({
      initialState,
      step: (prev, idx) => {
        const seed = scenarioSeed + idx * 3;
        const sentra = simulateSentraLoop(seed);
        const amaru = simulateAmaruLoop(seed);
        const crossSignals = deriveCrossSignals(sentra, amaru, idx + 1);
        const systemStable =
          sentra.finalConsistency > 0.88 && amaru.finalConsistency > 0.88;
        const nextState: MetaState = { sentra, amaru, crossSignals, systemStable };
        const sig = `${sentra.finalDelta}|${amaru.finalDelta}`;
        return { state: nextState, output: sig };
      },
      delta: (prev, next) => {
        const sentraDrift = Math.abs(
          next.sentra.finalConsistency - prev.sentra.finalConsistency,
        );
        const amaruDrift = Math.abs(
          next.amaru.finalConsistency - prev.amaru.finalConsistency,
        );
        return (sentraDrift + amaruDrift) / 2;
      },
      consistency: (prevOutput, output) => {
        return stringConsistency(prevOutput ?? '', output ?? '');
      },
      config: {
        maxSteps: effectiveMax,
        convergenceThreshold: 0.02,
        safeExitConsistency: 0.92,
      },
    });

    setTrace(result);
    setRunning(false);
  }, [scenario, useAdaptive]);

  const lastStep = trace?.steps[trace.steps.length - 1] ?? null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#09090b',
        color: '#e4e4e7',
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: '40px 28px 80px',
        maxWidth: 960,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 8,
        }}
      >
        <LoopGlyph size={36} spinning={running} />
        <div>
          <div
            style={{
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'rgba(160,196,255,0.85)',
              marginBottom: 4,
            }}
          >
            A11oy · Andean Orchestration
          </div>
          <h1 style={{ fontSize: 22, margin: 0, fontWeight: 500 }}>
            Meta-Loop — Sentra × Amaru
          </h1>
        </div>
      </div>

      <p
        style={{
          fontSize: 13,
          color: '#a1a1aa',
          lineHeight: 1.6,
          maxWidth: 680,
          marginBottom: 28,
        }}
      >
        The two-headed serpent. A11oy runs Sentra's recursive threat model and
        Amaru's convergent sync as child loops inside a single meta-pass. The
        meta-loop exits when both sub-loops stabilize and cross-signals have
        been extracted. This is §6 of the Ouroboros thesis — the mutually
        distilling triad.
      </p>

      {/* Scenario picker */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            onClick={() => setScenario(s)}
            style={{
              background:
                scenario.id === s.id
                  ? 'rgba(160,196,255,0.18)'
                  : 'rgba(255,255,255,0.04)',
              border:
                scenario.id === s.id
                  ? '1px solid rgba(160,196,255,0.5)'
                  : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              padding: '10px 16px',
              color: scenario.id === s.id ? '#a0c4ff' : '#a1a1aa',
              cursor: 'pointer',
              fontSize: 13,
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{s.description}</div>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 28,
        }}
      >
        <button
          onClick={run}
          disabled={running}
          style={{
            background: 'linear-gradient(135deg,#a0c4ff 0%,#6b8dd6 100%)',
            border: 'none',
            borderRadius: 8,
            padding: '10px 24px',
            color: '#09090b',
            fontWeight: 600,
            fontSize: 14,
            cursor: running ? 'wait' : 'pointer',
            opacity: running ? 0.6 : 1,
          }}
        >
          {running ? 'Running…' : 'Run Meta-Loop'}
        </button>
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: '#a1a1aa',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={useAdaptive}
            onChange={(e) => setUseAdaptive(e.target.checked)}
          />
          Adaptive depth budget
          <span style={{ opacity: 0.5, fontSize: 11 }}>
            {!useAdaptive
              ? '(off)'
              : trace
                ? `(using ${trace.steps.length} of ${maxSteps})`
                : '(needs prior run)'}
          </span>
        </label>
      </div>

      {/* Results */}
      {trace && lastStep && (
        <>
          {/* Sub-loop summary cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
              marginBottom: 24,
            }}
          >
            {[lastStep.state.sentra, lastStep.state.amaru].map((sub) => (
              <div
                key={sub.name}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: sub.name.startsWith('Sentra')
                      ? '#f87171'
                      : '#34d399',
                    marginBottom: 8,
                  }}
                >
                  {sub.name}
                </div>
                <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
                  <div>
                    <div style={{ color: '#71717a', fontSize: 10 }}>
                      Converged at
                    </div>
                    <div style={{ fontWeight: 600 }}>Step {sub.convergedAtStep}</div>
                  </div>
                  <div>
                    <div style={{ color: '#71717a', fontSize: 10 }}>
                      Final δ
                    </div>
                    <div style={{ fontWeight: 600 }}>{sub.finalDelta}</div>
                  </div>
                  <div>
                    <div style={{ color: '#71717a', fontSize: 10 }}>
                      Consistency
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {(sub.finalConsistency * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cross-signals */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: '#fbbf24',
                marginBottom: 12,
              }}
            >
              Cross-Distillation Signals
            </div>
            {lastStep.state.crossSignals.map((sig, i) => (
              <div
                key={i}
                style={{
                  fontSize: 13,
                  color: '#d4d4d8',
                  lineHeight: 1.6,
                  paddingLeft: 12,
                  borderLeft: '2px solid rgba(251,191,36,0.3)',
                  marginBottom: i < lastStep.state.crossSignals.length - 1 ? 10 : 0,
                }}
              >
                {sig}
              </div>
            ))}
          </div>

          {/* System verdict */}
          <div
            style={{
              padding: '14px 20px',
              borderRadius: 10,
              marginBottom: 24,
              background: lastStep.state.systemStable
                ? 'rgba(52,211,153,0.08)'
                : 'rgba(248,113,113,0.08)',
              border: lastStep.state.systemStable
                ? '1px solid rgba(52,211,153,0.3)'
                : '1px solid rgba(248,113,113,0.3)',
              fontSize: 13,
              fontWeight: 500,
              color: lastStep.state.systemStable ? '#34d399' : '#f87171',
            }}
          >
            {lastStep.state.systemStable
              ? `✓ System converged at meta-step ${trace.steps.length}. ` +
                `Exit reason: ${trace.exitReason}. Both sub-loops stable.`
              : `✗ System did NOT converge after ${trace.steps.length} meta-steps. ` +
                `Exit reason: ${trace.exitReason}. Manual review required.`}
          </div>

          {/* Ouroboros trace */}
          <OuroborosTrace trace={trace} />
        </>
      )}

      {/* Thesis reference */}
      <div
        style={{
          marginTop: 40,
          padding: 20,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#71717a',
            marginBottom: 8,
          }}
        >
          From the Ouroboros Thesis
        </div>
        <blockquote
          style={{
            margin: 0,
            fontSize: 13,
            color: '#a1a1aa',
            fontStyle: 'italic',
            lineHeight: 1.7,
            borderLeft: '2px solid rgba(160,196,255,0.2)',
            paddingLeft: 14,
          }}
        >
          "A11oy's agent loop, Sentra's threat loop, and Amaru's sync loop should
          exchange traces. A surprising convergence pattern in one is a candidate
          teacher signal for the others. We argue the loops can form a mutually
          distilling triad."
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              fontStyle: 'normal',
              color: '#52525b',
            }}
          >
            — §6 The Distillation Corollary, docs/ouroboros-thesis.md
          </div>
        </blockquote>
      </div>
    </div>
  );
}
