/**
 * Sentra Kuramoto defender-coupling.
 *
 * In a cyber-resilience surface we model two phase populations:
 *
 *   DEFENDERS (N_d oscillators) — IDS, EDR, WAF, honeypot, SIEM agents.
 *     Their phase θ_d is the angle of their threat-belief vector.
 *   ATTACKERS (N_a oscillators) — observed adversary tactics.
 *     Their phase θ_a is the angle of their action-mix vector.
 *
 * The Kuramoto order parameter r ∈ [0, 1] over the defender population
 * measures how synchronized our response is. We additionally track the
 * cross-population phase gap Δψ = ψ_d − ψ_a:
 *
 *   |Δψ|  close to 0     → defenders are MIRRORING attackers (reactive)
 *   |Δψ|  close to π     → defenders are COUNTERING attackers (oriented)
 *
 * The defender-coupling K_d is tuned so that a coherent population
 * (r ≥ 0.85) settles within a bounded number of Euler steps. We expose:
 *
 *   - scoreDefenders(readings)         — instantaneous order parameter
 *   - simulateDefence(readings, attack) — Euler-coupled defender/attacker pair
 *   - defenderVerdict(score)            — COHERENT / MIXING / INCOHERENT
 *
 * Source: Kuramoto, Y. (1975); Strogatz, S. H. (2000) "From Kuramoto to
 *   Crawford" — Physica D 143: 1–20.
 */
import {
  classifyCoherence,
  orderParameter,
  stepKuramoto,
  type CoherenceVerdict,
  type KuramotoOscillator,
  type KuramotoState,
} from "@workspace/ouroboros-resonance";

export interface DefenderReading {
  /** Identifier of the defender agent (e.g. "edr-east-1"). */
  readonly id: string;
  /** Threat-belief angle in radians, [0, 2π). */
  readonly phase: number;
  /** Natural oscillation rate in rad/tick (drift of belief if unforced). */
  readonly omega?: number;
}

export interface AttackerSignal {
  /** Observed adversary phase in radians. */
  readonly phase: number;
  /** Strength of the observation, in [0, 1] (e.g. confidence). */
  readonly intensity: number;
}

export interface DefenderScore {
  /** Kuramoto order parameter r of the defender population. */
  readonly r: number;
  /** Mean phase ψ_d. */
  readonly psi: number;
  /** Verdict. */
  readonly verdict: CoherenceVerdict;
  /** Number of defenders. */
  readonly n: number;
}

export interface DefenceSimulation {
  /** Final defender state after Euler steps. */
  readonly finalState: KuramotoState;
  /** r-trace per tick. */
  readonly rTrace: ReadonlyArray<number>;
  /** Cross-population gap |Δψ| at each tick (radians, [0, π]). */
  readonly gapTrace: ReadonlyArray<number>;
  /** True if r ≥ coherentMin at the final tick. */
  readonly converged: boolean;
}

/** Wrap an arbitrary phase angle to [0, 2π). */
function wrap2pi(p: number): number {
  let v = p % (2 * Math.PI);
  if (v < 0) v += 2 * Math.PI;
  return v;
}

/** Symmetric phase distance in [0, π]. */
function phaseGap(a: number, b: number): number {
  const d = Math.abs(wrap2pi(a) - wrap2pi(b));
  return Math.min(d, 2 * Math.PI - d);
}

/** Instantaneous defender population score. */
export function scoreDefenders(
  readings: ReadonlyArray<DefenderReading>,
): DefenderScore {
  const oscillators: KuramotoOscillator[] = readings.map((r) => ({
    phase: wrap2pi(r.phase),
    omega: r.omega ?? 0,
  }));
  const { r, psi } = orderParameter(oscillators);
  return { r, psi, verdict: classifyCoherence(r), n: oscillators.length };
}

/**
 * Couple a defender population to an attacker signal via Kuramoto Euler
 * integration. Each step nudges every defender phase toward π-offset from
 * the attacker (counter-orientation) weighted by attacker intensity, then
 * applies the standard Kuramoto self-coupling.
 *
 * Returns r-trace and |Δψ|-trace for forensic replay.
 */
export function simulateDefence(
  readings: ReadonlyArray<DefenderReading>,
  attacker: AttackerSignal,
  opts: { couplingK?: number; nSteps?: number; dt?: number; counterOrient?: boolean } = {},
): DefenceSimulation {
  const couplingK = opts.couplingK ?? 1.5;
  const nSteps = opts.nSteps ?? 50;
  const dt = opts.dt ?? 0.1;
  const counterOrient = opts.counterOrient ?? true;
  const attackerTarget = counterOrient
    ? wrap2pi(attacker.phase + Math.PI)
    : wrap2pi(attacker.phase);
  // Initial state
  let state: KuramotoState = {
    oscillators: readings.map((r) => ({
      phase: wrap2pi(r.phase),
      omega: r.omega ?? 0,
    })),
    couplingK,
  };
  const rTrace: number[] = [];
  const gapTrace: number[] = [];
  for (let t = 0; t < nSteps; t++) {
    // External nudge toward attackerTarget proportional to intensity.
    const nudged: KuramotoOscillator[] = state.oscillators.map((o) => ({
      phase: wrap2pi(
        o.phase + dt * attacker.intensity * Math.sin(attackerTarget - o.phase),
      ),
      omega: o.omega,
    }));
    state = stepKuramoto({ oscillators: nudged, couplingK }, dt);
    const { r, psi } = orderParameter(state.oscillators);
    rTrace.push(r);
    gapTrace.push(phaseGap(psi, attacker.phase));
  }
  const lastR = rTrace.length > 0 ? rTrace[rTrace.length - 1]! : 0;
  return {
    finalState: state,
    rTrace,
    gapTrace,
    converged: lastR >= 0.85,
  };
}

/** Convenience: total order-parameter verdict over an ensemble. */
export function defenderVerdict(score: DefenderScore): CoherenceVerdict {
  return score.verdict;
}
