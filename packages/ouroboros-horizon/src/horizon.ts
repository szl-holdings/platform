/**
 * Loop Capacity Horizon — primitive #5 of Horizon.
 *
 * BACKGROUND
 * ----------
 * The Bekenstein-Hawking entropy formula (Bekenstein 1973, Hawking 1975)
 * states that the entropy of a black hole is one quarter of its horizon
 * area in Planck units:
 *
 *     S_BH = A / (4 ℓ_P²)
 *
 * The implication is profound: the maximum information you can pack into
 * any region of space is bounded by the area of its boundary, not the
 * volume it encloses. This is the holographic principle ('t Hooft 1993,
 * Susskind 1995).
 *
 * COMPUTATIONAL ANALOG
 * --------------------
 * Every Ouroboros loop has a BOUNDARY: the set of integration points where
 * it touches the rest of the system (tools called, agents called, RPCs
 * issued, side effects emitted). The capacity of a loop — the maximum
 * information it can correctly process before saturation degrades quality —
 * is bounded by:
 *
 *     C(ℓ) = α · |∂ℓ| · log₂(1 + T_ℓ / T_min)
 *
 * where:
 *   |∂ℓ|  is the boundary cardinality (number of distinct interface points)
 *   T_ℓ   is the loop's measured throughput in samples/sec
 *   T_min is the minimum useful throughput (configured)
 *   α     is a calibration constant (default 1.0)
 *
 * This is dimensional analysis on the holographic bound: log₂(1 + T/T_min)
 * is the log-rate factor (Shannon channel capacity at the boundary), and
 * |∂ℓ| is the area term. The product is a soft upper bound on bits per tick
 * that the loop can faithfully process.
 *
 * Why this matters operationally:
 *   - Loops that exceed C(ℓ) are scheduled for split or fan-out.
 *   - Loops far below C(ℓ) are candidates for fan-in or merge.
 *   - The horizon is the schedulable signal: a single number per loop that
 *     orders the runtime's resource decisions.
 *
 * This replaces the current heuristic in A11oy that uses request count and
 * latency P95 — both of which lag, neither of which captures information
 * density. Capacity is the canonical signal.
 */

import type { LoopId } from "./types.js";

export interface CapacityHorizonConfig {
  /** Number of distinct interface points (tools, agents, RPCs) on the loop boundary. */
  readonly boundaryCardinality: number;
  /** Measured throughput in samples per second. >= 0 */
  readonly throughputPerSec: number;
  /** Minimum useful throughput in samples per second. Default: 1.0 */
  readonly minThroughputPerSec?: number;
  /** Calibration constant α. Default: 1.0 */
  readonly alpha?: number;
}

export interface CapacityHorizonReading {
  readonly loopId: LoopId;
  /** Capacity bound in bits per tick. */
  readonly capacityBits: number;
  /** Boundary cardinality at the time of reading. */
  readonly boundaryCardinality: number;
  /** Calibration parameters, for forensic reproducibility. */
  readonly params: {
    readonly alpha: number;
    readonly minThroughputPerSec: number;
    readonly throughputPerSec: number;
  };
}

/**
 * Compute the capacity horizon C(ℓ) for a loop.
 *
 * @returns capacity in bits per tick (>= 0).
 */
export function computeCapacityHorizon(
  loopId: LoopId,
  cfg: CapacityHorizonConfig,
): CapacityHorizonReading {
  const alpha = cfg.alpha ?? 1.0;
  const minT = Math.max(1e-9, cfg.minThroughputPerSec ?? 1.0);
  const T = Math.max(0, cfg.throughputPerSec);
  const boundary = Math.max(0, cfg.boundaryCardinality);
  const logFactor = Math.log2(1 + T / minT);
  const capacityBits = alpha * boundary * logFactor;
  return {
    loopId,
    capacityBits,
    boundaryCardinality: boundary,
    params: { alpha, minThroughputPerSec: minT, throughputPerSec: T },
  };
}

/**
 * Determine whether observed information rate exceeds the capacity horizon.
 *
 * `observedInfoRateBitsPerTick` should be the recent average of mutual
 * information between the loop and its environment per tick (the same
 * quantity tracked by PageCurveTracker.current()).
 */
export function isAboveHorizon(
  reading: CapacityHorizonReading,
  observedInfoRateBitsPerTick: number,
): boolean {
  return observedInfoRateBitsPerTick > reading.capacityBits;
}

/**
 * Margin between observed rate and capacity, in bits per tick. Negative
 * means the loop has spare capacity; positive means it is over-saturated.
 */
export function horizonMargin(
  reading: CapacityHorizonReading,
  observedInfoRateBitsPerTick: number,
): number {
  return observedInfoRateBitsPerTick - reading.capacityBits;
}

/**
 * Scheduling recommendation from horizon margin.
 *
 *   margin > +0.5 bits  → SPLIT     (loop is saturated; fan out)
 *   |margin| <= 0.5     → STEADY    (in band)
 *   margin < -0.5       → MERGE     (under-utilized; candidate for fan-in)
 */
export type HorizonRecommendation = "SPLIT" | "STEADY" | "MERGE";

export function recommendFromHorizon(
  reading: CapacityHorizonReading,
  observedInfoRateBitsPerTick: number,
  bandBits = 0.5,
): HorizonRecommendation {
  const m = horizonMargin(reading, observedInfoRateBitsPerTick);
  if (m > bandBits) return "SPLIT";
  if (m < -bandBits) return "MERGE";
  return "STEADY";
}
