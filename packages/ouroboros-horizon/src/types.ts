/**
 * Horizon — shared types.
 *
 * Every loop in the Ouroboros runtime that wishes to use Horizon primitives
 * exposes the same canonical shapes. These types are deliberately minimal:
 * the goal is interface discipline, not modelling power.
 */

/**
 * A monotonically increasing logical clock. We do not use wall-clock time for
 * invariants because clock skew across distributed hosts will break Page-curve
 * monotonicity assertions. Use a Lamport-style tick from the runtime kernel.
 */
export type LoopTick = number;

/**
 * A loop identifier. Must be globally unique within an Ouroboros deployment.
 * Convention: `<product>:<surface>:<instance>`.
 */
export type LoopId = string & { readonly __brand: "LoopId" };

export const asLoopId = (s: string): LoopId => s as LoopId;

/**
 * Risk tier from the existing risk-tier-gate. Lower is more dangerous.
 *   1 = critical (medical, defense, financial trading)
 *   2 = sensitive (legal, PII, compliance)
 *   3 = standard (internal workflow)
 *   4 = sandbox (preview, dev)
 */
export type RiskTier = 1 | 2 | 3 | 4;

/**
 * The five-scalar canonical state of a closed loop. See no-hair.ts.
 *
 * This is the entire externally-visible description of any closed loop in
 * the platform. By design, no other field is exposed across the loop boundary.
 */
export interface NoHairState {
  /** Total bounded work done in normalized cost units. Always >= 0. */
  readonly mass: number;
  /** Net policy obligation discharged (-) or accrued (+). Signed. */
  readonly charge: number;
  /** Adversariality of inputs encountered, as Shannon entropy in bits. >= 0. */
  readonly spin: number;
  /** Risk tier at close. */
  readonly tier: RiskTier;
  /** Content hash of the closed witness chain. Hex string. 64 chars (sha-256). */
  readonly hash: string;
}

/**
 * A single sample of a loop's externally-observable state at a tick.
 * Used to compute entanglement entropy over the lifetime of the loop.
 *
 * `state` is a string-encoded distinguishable state. The runtime is responsible
 * for canonicalizing internal state into a small alphabet of distinguishable
 * external states (e.g. via hashing a projection of the state).
 */
export interface ObservableSample {
  readonly tick: LoopTick;
  readonly state: string;
}

/**
 * Witness levels — used by dual-witness.
 */
export type WitnessLevel = "internal" | "external";

/**
 * A single witness entry. Hash-chained to its predecessor.
 */
export interface WitnessEntry {
  readonly tick: LoopTick;
  readonly level: WitnessLevel;
  readonly kind: string; // e.g. "tool_call", "reasoning", "side_effect", "policy_check"
  readonly payload: Record<string, unknown>;
  /** Whether this entry made an externally-observable claim (vs pure reasoning). */
  readonly externallyObservable: boolean;
  /** sha-256 hex of (prevHash || canonicalJSON(this entry without prevHash)). */
  readonly prevHash: string;
  readonly hash: string;
}

/**
 * Result of a Page-curve check. See page-curve.ts.
 */
export interface PageCurveResult {
  /** Was the close clean (residual entropy below epsilon)? */
  readonly clean: boolean;
  /** Final residual entanglement entropy at close, in bits. */
  readonly residualEntropy: number;
  /** The configured epsilon threshold. */
  readonly epsilon: number;
  /** The full series of (tick, S_ent) samples. */
  readonly series: readonly { tick: LoopTick; entropy: number }[];
  /** Tick at which the entropy peaked. */
  readonly pageTick: LoopTick | null;
  /** Peak entropy value. */
  readonly pageEntropy: number;
  /** Whether the curve was monotone-rising before the peak. */
  readonly monotonicRise: boolean;
  /** Whether the curve was monotone-falling after the peak. */
  readonly monotonicFall: boolean;
}

/**
 * Result of a dual-witness consistency check. See dual-witness.ts.
 */
export interface DualWitnessResult {
  /** Did internal claims all have an external witness? */
  readonly consistent: boolean;
  /** Externally-observable internal claims that lack an external witness. */
  readonly orphanedClaims: readonly WitnessEntry[];
  /** Tick range checked. */
  readonly range: { from: LoopTick; to: LoopTick };
}
