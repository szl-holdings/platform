/**
 * R1. Resonant Frequency Match (Cadence) — primitive #1 of Resonance.
 *
 * BACKGROUND
 * ----------
 * Tesla's resonant frequency formula:
 *
 *     f = 1 / (2π · √(L · C))
 *
 * A Tesla transformer transfers maximum energy between primary and
 * secondary tank circuits when both are tuned to the same f. Any
 * mismatch produces beating, energy slosh, and reduced transfer.
 *
 * COMPUTATIONAL ANALOG
 * --------------------
 * Every Ouroboros loop has a measurable "cadence" — the dominant
 * frequency at which it produces externally-observable events. A loop
 * that handles user requests at ~4 Hz cannot cleanly hand work to a
 * loop that handles batch jobs at 0.3 Hz; binding them produces the
 * same beating pattern Tesla saw on his oscilloscope a hundred years ago.
 *
 * We measure cadence empirically via the median inter-event interval
 * over a sliding window. The resonance match check is:
 *
 *     |f_a − f_b| / max(f_a, f_b) ≤ δ        (default δ = 0.05)
 *
 * which is equivalent to the standard fractional-bandwidth criterion
 * in RF engineering.
 */

const LN2 = Math.log(2);

export interface CadenceObservation {
  /** Monotonic logical-clock tick of the event. */
  readonly tick: number;
}

export interface CadenceReading {
  /** Estimated cadence frequency (events per tick). */
  readonly frequency: number;
  /** Number of inter-event intervals used in the estimate. */
  readonly samples: number;
  /** Coefficient of variation of inter-event intervals (jitter). >= 0 */
  readonly jitter: number;
}

/**
 * Compute cadence frequency from a sequence of event ticks.
 *
 * Uses median inter-event interval, which is robust to outliers (a
 * single very-slow tick won't dominate). Returns 0 when fewer than
 * 2 events are supplied.
 */
export function measureCadence(
  events: readonly CadenceObservation[],
): CadenceReading {
  if (events.length < 2) {
    return { frequency: 0, samples: 0, jitter: 0 };
  }
  const sorted = [...events].sort((a, b) => a.tick - b.tick);
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    intervals.push(sorted[i]!.tick - sorted[i - 1]!.tick);
  }
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)]!;
  const frequency = median > 0 ? 1 / median : 0;
  // jitter = std/mean (coefficient of variation)
  const mean =
    intervals.reduce((acc, x) => acc + x, 0) / intervals.length;
  const variance =
    intervals.reduce((acc, x) => acc + (x - mean) ** 2, 0) / intervals.length;
  const jitter = mean > 0 ? Math.sqrt(variance) / mean : 0;
  return { frequency, samples: intervals.length, jitter };
}

export interface CadenceMatchConfig {
  /** Maximum fractional frequency difference. Default 0.05. */
  readonly tolerance?: number;
}

export interface CadenceMatchResult {
  readonly matched: boolean;
  readonly fractionalDifference: number;
  readonly tolerance: number;
  readonly fA: number;
  readonly fB: number;
}

/**
 * Verify that two loops are within the resonant band for clean handoff.
 *
 *     |f_a − f_b| / max(f_a, f_b) ≤ δ
 */
export function checkCadenceMatch(
  a: CadenceReading,
  b: CadenceReading,
  cfg: CadenceMatchConfig = {},
): CadenceMatchResult {
  const tol = cfg.tolerance ?? 0.05;
  if (a.frequency <= 0 || b.frequency <= 0) {
    return {
      matched: false,
      fractionalDifference: Infinity,
      tolerance: tol,
      fA: a.frequency,
      fB: b.frequency,
    };
  }
  const diff = Math.abs(a.frequency - b.frequency);
  const denom = Math.max(a.frequency, b.frequency);
  const fractional = diff / denom;
  return {
    matched: fractional <= tol,
    fractionalDifference: fractional,
    tolerance: tol,
    fA: a.frequency,
    fB: b.frequency,
  };
}

/**
 * Inverse Tesla resonance formula: given an "inductance-like" quantity L
 * and "capacitance-like" quantity C in normalized runtime units, return
 * the predicted resonant frequency. Useful for ahead-of-time loop sizing.
 *
 *     f = 1 / (2π √(L·C))
 */
export function predictedResonantFrequency(L: number, C: number): number {
  if (L <= 0 || C <= 0) return 0;
  return 1 / (2 * Math.PI * Math.sqrt(L * C));
}

/**
 * Beat frequency between two close cadences:
 *
 *     f_beat = |f_a − f_b|
 *
 * If f_beat is small relative to either parent and the loops are bound,
 * this is the period of the visible "wobble" you'll see in metrics.
 */
export function beatFrequency(a: number, b: number): number {
  return Math.abs(a - b);
}

/** Bits per tick equivalent of a frequency, for cross-package comparison. */
export function frequencyToBitsPerTick(f: number): number {
  if (f <= 0) return 0;
  return Math.log2(1 + f) / LN2;
}
