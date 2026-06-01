/**
 * R5. Peak-vs-RMS Alerting — primitive #5 of Resonance.
 *
 * BACKGROUND
 * ----------
 * Tesla:  E_rms = 0.7071 · E_peak    (for a sinusoid)
 *
 * RMS is what does work on average; peak is what burns the dielectric.
 * For safety analysis you must use peak. For thermal budgeting you must
 * use RMS. Confusing them is how transformers explode.
 *
 * COMPUTATIONAL ANALOG
 * --------------------
 * Every metric on a loop has a mean (RMS-equivalent) and a peak. The
 * runtime must alert on:
 *
 *   • peak  — when the underlying invariant is correctness/safety
 *             (Page-curve cleanliness, complementarity, tier integrity)
 *   • mean  — when the underlying invariant is throughput/cost
 *
 * This module provides:
 *
 *   1. Statistical primitives (rms, peak, crest factor) for any series.
 *   2. AlertRule registry that rejects rules pairing a safety invariant
 *      with a mean aggregator at registration time.
 */

export interface SeriesStats {
  readonly count: number;
  readonly mean: number;
  readonly rms: number;
  readonly peak: number;
  readonly trough: number;
  /** crest factor = peak / rms. Sinusoid → √2 ≈ 1.414. Spiky → much larger. */
  readonly crestFactor: number;
}

/** Compute mean, RMS, peak, trough, crest factor of a numeric series. */
export function seriesStats(xs: readonly number[]): SeriesStats {
  if (xs.length === 0) {
    return { count: 0, mean: 0, rms: 0, peak: 0, trough: 0, crestFactor: 0 };
  }
  let sum = 0;
  let sumSq = 0;
  let peak = -Infinity;
  let trough = Infinity;
  for (const x of xs) {
    sum += x;
    sumSq += x * x;
    if (x > peak) peak = x;
    if (x < trough) trough = x;
  }
  const mean = sum / xs.length;
  const rms = Math.sqrt(sumSq / xs.length);
  const absPeak = Math.max(Math.abs(peak), Math.abs(trough));
  const crest = rms > 0 ? absPeak / rms : 0;
  return { count: xs.length, mean, rms, peak, trough, crestFactor: crest };
}

/** Tesla relationship for a clean sinusoid (sanity check). */
export const SINUSOID_RMS_TO_PEAK = 1 / Math.SQRT2; // ≈ 0.7071

export type Aggregator = "mean" | "rms" | "peak" | "p95" | "p99";

export type InvariantClass = "safety" | "throughput";

export interface AlertRule {
  readonly id: string;
  readonly invariantClass: InvariantClass;
  readonly aggregator: Aggregator;
  /** Threshold in raw metric units. */
  readonly threshold: number;
  /** Direction: alert when value exceeds (above) or falls below (below). */
  readonly direction: "above" | "below";
}

export class AlertRuleRegistry {
  private readonly rules = new Map<string, AlertRule>();

  /**
   * Register an alert rule. Rejects safety rules with `mean` aggregator
   * at registration time — a safety invariant is not allowed to use a
   * smoothing aggregator.
   */
  register(rule: AlertRule): void {
    if (rule.invariantClass === "safety" && rule.aggregator === "mean") {
      throw new Error(
        `peak-rms: safety rule "${rule.id}" cannot use mean aggregator; ` +
          `safety rules must use peak, rms, p95, or p99.`,
      );
    }
    if (this.rules.has(rule.id)) {
      throw new Error(`peak-rms: duplicate rule id "${rule.id}".`);
    }
    this.rules.set(rule.id, Object.freeze({ ...rule }));
  }

  get(id: string): AlertRule | undefined {
    return this.rules.get(id);
  }

  /** Evaluate a rule against a series. Returns true if the rule fires. */
  evaluate(id: string, series: readonly number[]): boolean {
    const rule = this.rules.get(id);
    if (!rule) throw new Error(`peak-rms: unknown rule "${id}"`);
    const s = seriesStats(series);
    const value = pick(s, rule.aggregator, series);
    return rule.direction === "above"
      ? value > rule.threshold
      : value < rule.threshold;
  }

  size(): number {
    return this.rules.size;
  }
}

function percentile(xs: readonly number[], p: number): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.floor((p / 100) * sorted.length)),
  );
  return sorted[idx]!;
}

function pick(
  s: SeriesStats,
  agg: Aggregator,
  raw: readonly number[],
): number {
  switch (agg) {
    case "mean":
      return s.mean;
    case "rms":
      return s.rms;
    case "peak":
      return Math.max(s.peak, Math.abs(s.trough));
    case "p95":
      return percentile(raw, 95);
    case "p99":
      return percentile(raw, 99);
  }
}
