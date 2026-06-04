/**
 * R4. Dual-Tuning Protocol (Kuramoto Coherence) — primitive #4 of Resonance.
 *
 * BACKGROUND
 * ----------
 * The Kuramoto model (Y. Kuramoto, 1975) describes N coupled phase
 * oscillators:
 *
 *     dθ_i/dt = ω_i + (K / N) · Σ_j sin(θ_j − θ_i)
 *
 * The order parameter
 *
 *     r · e^{i·ψ} = (1/N) · Σ_j e^{i·θ_j}
 *
 * has magnitude r ∈ [0, 1] that quantifies coherence: r = 0 means total
 * disorder; r = 1 means perfect phase-lock. As K crosses a critical
 * coupling strength K_c, the oscillator population undergoes a phase
 * transition from incoherent to coherent.
 *
 * Recent: Miyato et al. (2024), *Artificial Kuramoto Oscillatory Neurons*
 * (arXiv:2410.13821, ICLR 2025) — incorporates the Kuramoto update into
 * deep nets in place of threshold units. We borrow only the math, not
 * the code.
 *
 * COMPUTATIONAL ANALOG
 * --------------------
 * In a multi-agent fan-out, treat each agent loop as an oscillator with
 * phase θ_i derived from its current step count modulo cadence. The
 * coherence r tells us *how aligned the fleet is*. We use:
 *
 *   • r ≥ 0.85    → COHERENT (agents are agreeing)
 *   • 0.4 ≤ r < 0.85 → MIXING (still finding consensus)
 *   • r < 0.4     → INCOHERENT (no consensus; investigate)
 *
 * Pinned to runtime: when a fan-out's coherence drops below 0.4 mid-run
 * for more than W ticks, the runtime suspects a livelock and emits a
 * `KURAMOTO_DECOHERENCE` event.
 */

const TWO_PI = 2 * Math.PI;

export interface KuramotoOscillator {
  /** Phase in radians (will be wrapped to [0, 2π)). */
  readonly phase: number;
  /** Natural frequency in radians per tick. */
  readonly omega: number;
}

export interface KuramotoState {
  readonly oscillators: readonly KuramotoOscillator[];
  /** Coupling strength K. */
  readonly couplingK: number;
}

/** Wrap a phase to [0, 2π). */
export function wrap(phase: number): number {
  let p = phase % TWO_PI;
  if (p < 0) p += TWO_PI;
  return p;
}

/**
 * Compute the order parameter (r, ψ) of an oscillator population.
 *
 *     r · e^{i·ψ} = (1/N) · Σ e^{i·θ_j}
 */
export function orderParameter(
  oscillators: readonly KuramotoOscillator[],
): { r: number; psi: number } {
  if (oscillators.length === 0) return { r: 0, psi: 0 };
  let sx = 0;
  let sy = 0;
  for (const o of oscillators) {
    sx += Math.cos(o.phase);
    sy += Math.sin(o.phase);
  }
  const N = oscillators.length;
  const cx = sx / N;
  const cy = sy / N;
  const r = Math.sqrt(cx * cx + cy * cy);
  const psi = Math.atan2(cy, cx);
  return { r, psi };
}

/**
 * Advance a Kuramoto population by one Euler step of size dt.
 *
 *     θ_i(t+dt) = θ_i(t) + dt · [ω_i + (K/N) · Σ sin(θ_j − θ_i)]
 */
export function stepKuramoto(
  state: KuramotoState,
  dt = 0.1,
): KuramotoState {
  const N = state.oscillators.length;
  if (N === 0) return state;
  const newOsc: KuramotoOscillator[] = [];
  for (let i = 0; i < N; i++) {
    const xi = state.oscillators[i]!;
    let coupling = 0;
    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      coupling += Math.sin(state.oscillators[j]!.phase - xi.phase);
    }
    const dtheta = xi.omega + (state.couplingK / N) * coupling;
    newOsc.push({ phase: wrap(xi.phase + dt * dtheta), omega: xi.omega });
  }
  return { oscillators: newOsc, couplingK: state.couplingK };
}

/** Run `nSteps` Euler iterations and return both final state and the r-trace. */
export function runKuramoto(
  initial: KuramotoState,
  nSteps: number,
  dt = 0.1,
): { state: KuramotoState; rTrace: number[] } {
  let s = initial;
  const rTrace: number[] = [];
  for (let i = 0; i < nSteps; i++) {
    s = stepKuramoto(s, dt);
    rTrace.push(orderParameter(s.oscillators).r);
  }
  return { state: s, rTrace };
}

export type CoherenceVerdict = "COHERENT" | "MIXING" | "INCOHERENT";

export interface CoherenceConfig {
  /** Lower bound for COHERENT. Default 0.85. */
  readonly coherentMin?: number;
  /** Lower bound for MIXING. Default 0.4. */
  readonly mixingMin?: number;
}

/** Classify a coherence reading into one of three verdicts. */
export function classifyCoherence(
  r: number,
  cfg: CoherenceConfig = {},
): CoherenceVerdict {
  const cohMin = cfg.coherentMin ?? 0.85;
  const mixMin = cfg.mixingMin ?? 0.4;
  if (r >= cohMin) return "COHERENT";
  if (r >= mixMin) return "MIXING";
  return "INCOHERENT";
}

/**
 * Detect Kuramoto decoherence: count of consecutive ticks where r is
 * below the incoherent threshold.
 */
export function decoherenceWindowLength(
  rTrace: readonly number[],
  threshold = 0.4,
): number {
  let max = 0;
  let cur = 0;
  for (const r of rTrace) {
    if (r < threshold) {
      cur++;
      if (cur > max) max = cur;
    } else {
      cur = 0;
    }
  }
  return max;
}
