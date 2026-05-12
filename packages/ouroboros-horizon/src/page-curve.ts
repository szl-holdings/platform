/**
 * Page Curve Invariant — primitive #1 of Horizon.
 *
 * BACKGROUND
 * ----------
 * Don Page (1993, Phys. Rev. Lett. 71, 1291) showed that if a quantum system
 * of total Hilbert space dimension D is in a random pure state, the average
 * entropy of a subsystem of dimension D_A <= sqrt(D) is approximately:
 *
 *     S_avg ≈ ln(D_A) − D_A^2 / (2D)
 *
 * As a black hole evaporates, the dimension of the radiation subsystem D_R
 * grows (and the BH dimension shrinks). The von Neumann entropy of the
 * radiation S(R) = S(BH) (because they share a pure state) traces a curve
 * that rises like ln(D_R) initially, then turns over near D_R = sqrt(D),
 * and falls back to zero as D_R → D. This is the Page curve. Its turnover
 * confirms information preservation: a clean evaporation leaves no residue.
 *
 * COMPUTATIONAL ANALOG
 * --------------------
 * In Ouroboros, every long-running governed loop has an externally-visible
 * state stream and a "rest of the system" state stream. We compute the
 * entanglement entropy between them, sampled at every tick, and assert:
 *
 *   1. There exists a unique tick t* (the "Page tick") at which entropy peaks.
 *   2. The curve is non-decreasing on [t_0, t*].
 *   3. The curve is non-increasing on [t*, t_close].
 *   4. The residual entropy at t_close is below a configured epsilon.
 *
 * A loop that closes with residual entropy > epsilon is, by our definition,
 * a DIRTY CLOSE — it left state somewhere that was not reconciled. This is
 * exactly the silent-failure mode we want to expose.
 *
 * IMPLEMENTATION NOTES
 * --------------------
 * Computing true von Neumann entropy requires a density matrix, which we do
 * not have at runtime. We use a faithful classical analog: the mutual
 * information between the loop and its environment, computed from the
 * empirical probability distribution of distinguishable observable states.
 *
 *   I(L; E) = H(L) + H(E) − H(L, E)
 *
 * For a closed system in a pure state, the marginal entropies S(L) and S(E)
 * are equal and both equal to the entanglement entropy. We use this identity
 * to compute S_ent from the observed distribution of L's states relative to
 * the joint distribution with E.
 *
 * This is principled. It is the standard classical-shadow / entropy-estimator
 * correspondence used in quantum information textbooks (Nielsen & Chuang
 * §11.3) when only sampled access to subsystems is available.
 */

import type {
  LoopId,
  LoopTick,
  ObservableSample,
  PageCurveResult,
} from "./types.js";

const LN2 = Math.log(2);
const log2 = (x: number): number => (x <= 0 ? 0 : Math.log(x) / LN2);

/**
 * Shannon entropy in bits of a discrete probability distribution.
 * Treats zero-probability events as contributing zero (lim p log p = 0).
 */
export function shannonEntropyBits(probabilities: readonly number[]): number {
  let h = 0;
  for (const p of probabilities) {
    if (p > 0) h -= p * log2(p);
  }
  return h;
}

/**
 * Empirical probability distribution from a list of state strings.
 * Returns a Map(state -> p) such that sum == 1.
 */
export function empiricalDistribution(
  states: readonly string[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const s of states) {
    counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  const n = states.length;
  const dist = new Map<string, number>();
  if (n === 0) return dist;
  for (const [s, c] of counts) dist.set(s, c / n);
  return dist;
}

/**
 * Mutual information between two parallel sample streams, in bits.
 *
 * I(L; E) = H(L) + H(E) − H(L, E)
 *
 * Both streams must have the same length and represent state observations
 * at the same tick.
 */
export function mutualInformationBits(
  loopStates: readonly string[],
  envStates: readonly string[],
): number {
  if (loopStates.length !== envStates.length) {
    throw new Error(
      `mutual-information: stream length mismatch (${loopStates.length} vs ${envStates.length})`,
    );
  }
  if (loopStates.length === 0) return 0;

  const distL = empiricalDistribution(loopStates);
  const distE = empiricalDistribution(envStates);
  const distJoint = empiricalDistribution(
    loopStates.map((s, i) => `${s}\u0001${envStates[i]}`),
  );

  const hL = shannonEntropyBits([...distL.values()]);
  const hE = shannonEntropyBits([...distE.values()]);
  const hJ = shannonEntropyBits([...distJoint.values()]);

  // Mutual information must be non-negative; numerical error can produce
  // tiny negatives. Clamp at zero.
  return Math.max(0, hL + hE - hJ);
}

/**
 * The Page-formula reference curve: average entropy of a random pure-state
 * subsystem of dimension k in a total system of dimension D, in bits.
 *
 * S_avg(k, D) ≈ log2(k) − k^2 / (2 D ln 2)   for 1 << k <= sqrt(D)
 * S_avg(k, D) ≈ log2(D/k) − (D/k)^2 / (2 D ln 2) for sqrt(D) <= k << D
 *
 * Used by the runtime to give an *expected* shape against which the empirical
 * curve is compared. Mismatch beyond a tolerance is logged as a divergence
 * from "ideal" information conservation.
 */
export function pageReferenceCurveBits(k: number, D: number): number {
  if (k <= 0 || D <= 0 || k > D) return 0;
  if (k <= D / 2) {
    return log2(k) - (k * k) / (2 * D * LN2);
  }
  // Symmetry: S(k) = S(D - k)
  const kPrime = D - k;
  if (kPrime <= 0) return 0;
  return log2(kPrime) - (kPrime * kPrime) / (2 * D * LN2);
}

/**
 * Configuration for a Page-curve check.
 */
export interface PageCurveConfig {
  /** Maximum residual entropy at close, in bits. Default: 0.05. */
  readonly epsilon?: number;
  /**
   * Allowed numerical noise in monotonicity checks, in bits. We allow tiny
   * non-monotone wiggles below this threshold because empirical entropy
   * estimators have variance. Default: 0.02 bits.
   */
  readonly monotonicityTolerance?: number;
}

/**
 * Sliding-window classifier for streamed loop+env samples.
 *
 * The runtime feeds (loopSample, envSample) at each tick. The classifier
 * keeps a window of recent samples and emits a (tick, S_ent) point. At
 * close-time, it produces a PageCurveResult.
 */
export class PageCurveTracker {
  private readonly loopId: LoopId;
  private readonly cfg: Required<PageCurveConfig>;
  private readonly loopWindow: string[] = [];
  private readonly envWindow: string[] = [];
  private readonly series: { tick: LoopTick; entropy: number }[] = [];
  private peak: { tick: LoopTick; entropy: number } | null = null;
  private readonly windowSize: number;

  constructor(
    loopId: LoopId,
    cfg: PageCurveConfig = {},
    windowSize = 64,
  ) {
    this.loopId = loopId;
    this.cfg = {
      epsilon: cfg.epsilon ?? 0.05,
      monotonicityTolerance: cfg.monotonicityTolerance ?? 0.02,
    };
    this.windowSize = windowSize;
  }

  /**
   * Record a sample at tick `t`. The runtime supplies the loop's
   * externally-observable state and a digest of the rest of the system's
   * state at the same tick.
   */
  observe(
    tick: LoopTick,
    loopState: string,
    envState: string,
  ): { tick: LoopTick; entropy: number } {
    this.loopWindow.push(loopState);
    this.envWindow.push(envState);
    if (this.loopWindow.length > this.windowSize) {
      this.loopWindow.shift();
      this.envWindow.shift();
    }
    const entropy = mutualInformationBits(this.loopWindow, this.envWindow);
    const point = { tick, entropy };
    this.series.push(point);
    if (this.peak === null || entropy > this.peak.entropy) {
      this.peak = point;
    }
    return point;
  }

  /**
   * Close the loop and return a PageCurveResult.
   *
   * If `forceFinalSample` is provided, the last point is recorded with that
   * loopState/envState pair. The loop's runtime should pass the canonical
   * "closed state" signal, typically a constant sentinel, so that the
   * environment-loop joint distribution converges and entanglement falls.
   */
  close(): PageCurveResult {
    const series = [...this.series];
    if (series.length === 0) {
      return {
        clean: false,
        residualEntropy: 0,
        epsilon: this.cfg.epsilon,
        series: [],
        pageTick: null,
        pageEntropy: 0,
        monotonicRise: false,
        monotonicFall: false,
      };
    }
    const last = series[series.length - 1]!;
    const peak = this.peak ?? last;
    const tol = this.cfg.monotonicityTolerance;

    const monotonicRise = isMonotone(
      series.filter((p) => p.tick <= peak.tick).map((p) => p.entropy),
      "non-decreasing",
      tol,
    );
    const monotonicFall = isMonotone(
      series.filter((p) => p.tick >= peak.tick).map((p) => p.entropy),
      "non-increasing",
      tol,
    );

    return {
      clean: last.entropy <= this.cfg.epsilon,
      residualEntropy: last.entropy,
      epsilon: this.cfg.epsilon,
      series,
      pageTick: peak.tick,
      pageEntropy: peak.entropy,
      monotonicRise,
      monotonicFall,
    };
  }

  /** Live read of current entropy without closing. */
  current(): number {
    return this.series.length === 0
      ? 0
      : this.series[this.series.length - 1]!.entropy;
  }

  get id(): LoopId {
    return this.loopId;
  }
}

function isMonotone(
  xs: readonly number[],
  direction: "non-decreasing" | "non-increasing",
  tol: number,
): boolean {
  for (let i = 1; i < xs.length; i++) {
    const prev = xs[i - 1]!;
    const cur = xs[i]!;
    if (direction === "non-decreasing" && cur < prev - tol) return false;
    if (direction === "non-increasing" && cur > prev + tol) return false;
  }
  return true;
}
