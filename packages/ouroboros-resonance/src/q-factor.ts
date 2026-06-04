/**
 * R3. Quality-Factor Budget — primitive #3 of Resonance.
 *
 * BACKGROUND
 * ----------
 * For an LC resonator, the quality factor is
 *
 *     Q = ω L / R    (equivalently  Q = f / Δf  =  energy stored / energy lost per cycle · 2π)
 *
 * High-Q means the resonator stores energy for many cycles before
 * damping; low-Q means energy dissipates fast. In Tesla coils Q sets
 * how many ringdown cycles per spark; in radio engineering Q sets
 * selectivity vs bandwidth.
 *
 * Reference: Pozar, *Microwave Engineering*, ch. 6.
 *
 * COMPUTATIONAL ANALOG
 * --------------------
 * A loop's Q is its useful-work-to-loss ratio:
 *
 *     Q_ℓ = W_useful / W_lost
 *
 * where W_useful is the no-hair `mass` (bounded work delivered) and
 * W_lost is the residual entropy at close (un-reconciled state) plus
 * retried work plus orphaned-claim work. Higher Q = sharper, cleaner
 * loop. Lower Q = noisy, lossy loop.
 *
 * Q below 1.5 is degraded and triggers tier review. Above 10 is
 * over-budget (the loop is doing more work than its boundary suggests
 * it should — check for hidden coupling).
 */

export interface QInputs {
  /** Bounded work delivered (no-hair mass). >= 0 */
  readonly workUseful: number;
  /** Residual entropy at close (Page-curve residualEntropy). >= 0 */
  readonly residualEntropyBits: number;
  /** Retried-work units (no-hair mass that was redone). >= 0 */
  readonly retryWork?: number;
  /** Orphaned-claim work (count of dual-witness orphans × unit cost). >= 0 */
  readonly orphanWork?: number;
}

export interface QReading {
  readonly Q: number;
  readonly workUseful: number;
  readonly workLost: number;
  readonly verdict: QVerdict;
}

export type QVerdict = "DEGRADED" | "HEALTHY" | "OVER_BUDGET";

export interface QBudgetConfig {
  /** Q below this is DEGRADED. Default 1.5. */
  readonly minHealthy?: number;
  /** Q above this is OVER_BUDGET. Default 10. */
  readonly maxHealthy?: number;
  /** Cost of a retry in normalized work units. Default 1.0. */
  readonly retryCost?: number;
  /** Cost of an orphaned claim in normalized work units. Default 1.0. */
  readonly orphanCost?: number;
}

/**
 * Compute Q-factor for a closed loop.
 *
 *     Q = W_useful / W_lost
 *     W_lost = residualEntropyBits + retryCost·retryWork + orphanCost·orphanWork
 */
export function computeQFactor(
  inputs: QInputs,
  cfg: QBudgetConfig = {},
): QReading {
  const minH = cfg.minHealthy ?? 1.5;
  const maxH = cfg.maxHealthy ?? 10;
  const retryCost = cfg.retryCost ?? 1.0;
  const orphanCost = cfg.orphanCost ?? 1.0;

  const workUseful = Math.max(0, inputs.workUseful);
  const workLost =
    Math.max(0, inputs.residualEntropyBits) +
    retryCost * Math.max(0, inputs.retryWork ?? 0) +
    orphanCost * Math.max(0, inputs.orphanWork ?? 0);

  // Avoid division by zero. A perfectly clean, no-loss loop has effectively
  // infinite Q — we cap reporting at a large finite number for stability.
  const denom = workLost <= 1e-12 ? 1e-12 : workLost;
  const Q = workUseful / denom;

  let verdict: QVerdict;
  if (Q < minH) verdict = "DEGRADED";
  else if (Q > maxH) verdict = "OVER_BUDGET";
  else verdict = "HEALTHY";

  return { Q, workUseful, workLost, verdict };
}

/**
 * Track Q-factor across multiple closes of the same logical loop, to
 * detect drift over releases.
 */
export class QFactorHistory {
  private readonly samples: { ts: number; Q: number }[] = [];

  add(ts: number, Q: number): void {
    this.samples.push({ ts, Q });
  }

  /** Mean of all recorded Q values. */
  mean(): number {
    if (this.samples.length === 0) return 0;
    return (
      this.samples.reduce((acc, s) => acc + s.Q, 0) / this.samples.length
    );
  }

  /**
   * Fractional drift between the first and last halves of recorded
   * samples. Positive means Q is rising; negative means Q is decaying.
   */
  drift(): number {
    if (this.samples.length < 4) return 0;
    const half = Math.floor(this.samples.length / 2);
    const earlyMean =
      this.samples.slice(0, half).reduce((a, s) => a + s.Q, 0) / half;
    const lateMean =
      this.samples.slice(half).reduce((a, s) => a + s.Q, 0) /
      (this.samples.length - half);
    if (earlyMean <= 0) return 0;
    return (lateMean - earlyMean) / earlyMean;
  }

  count(): number {
    return this.samples.length;
  }

  values(): readonly { ts: number; Q: number }[] {
    return [...this.samples];
  }
}
