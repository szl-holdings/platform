/**
 * Entanglement Metric — primitive #4 of Horizon.
 *
 * BACKGROUND
 * ----------
 * The Ryu-Takayanagi formula (Ryu & Takayanagi 2006, Phys. Rev. Lett. 96,
 * 181602) gives the holographic entanglement entropy of a boundary region A
 * in a CFT as the area of the minimal bulk surface anchored on ∂A:
 *
 *     S(A) = Area(γ_A) / (4 G_N)
 *
 * The discovery is that entanglement is geometric. The amount of quantum
 * correlation between two regions is measured by the size of the surface
 * separating them. ER=EPR (Maldacena & Susskind 2013, "Cool horizons for
 * entangled black holes") strengthens this: entangled systems are connected
 * by a non-traversable wormhole.
 *
 * COMPUTATIONAL ANALOG
 * --------------------
 * In Ouroboros, two loops ℓ₁ and ℓ₂ are "entangled" when the closure of
 * one constrains the closure of the other. We measure entanglement using
 * Shannon mutual information of their externally-observable state streams:
 *
 *     S_ent(ℓ₁, ℓ₂) = H(ℓ₁) + H(ℓ₂) − H(ℓ₁, ℓ₂)
 *
 * High S_ent means the two loops are coupled — closing one affects the other.
 * Low S_ent means they are independent and can be reasoned about separately.
 *
 * A11oy uses this metric to BUILD A DEPENDENCY GRAPH at runtime. Where the
 * current orchestrator relies on hand-coded edges between agents, Horizon
 * gives us empirical edges with weights. We can detect when two supposedly
 * independent loops are secretly entangled (and thus a closure of one without
 * the other is a dirty close), and we can detect when entanglement is below
 * a configured floor (and thus the loops are decoupled enough to parallelize).
 *
 * LIMITS
 * ------
 * Mutual information is symmetric and non-negative but not a metric in the
 * mathematical sense (no triangle inequality). For visualization and graph
 * algorithms we use the variation of information distance:
 *
 *     d(ℓ₁, ℓ₂) = H(ℓ₁, ℓ₂) − I(ℓ₁; ℓ₂)
 *               = H(ℓ₁ | ℓ₂) + H(ℓ₂ | ℓ₁)
 *
 * which IS a true metric (Meilă 2003).
 */

import type { LoopId, ObservableSample } from "./types.js";
import {
  empiricalDistribution,
  mutualInformationBits,
  shannonEntropyBits,
} from "./page-curve.js";

/**
 * Pairwise entanglement entropy between two parallel observable streams.
 *
 * Streams must be aligned tick-by-tick. Out-of-band ticks are discarded by
 * inner-joining on tick value before the calculation.
 */
export function entanglementBits(
  a: readonly ObservableSample[],
  b: readonly ObservableSample[],
): number {
  const aligned = innerJoinByTick(a, b);
  if (aligned.length === 0) return 0;
  return mutualInformationBits(
    aligned.map((p) => p.aState),
    aligned.map((p) => p.bState),
  );
}

/**
 * Variation-of-information distance, in bits.
 *
 * d(A,B) = H(A,B) − I(A;B) >= 0; d(A,A) = 0; symmetric; triangle inequality.
 */
export function variationOfInformationBits(
  a: readonly ObservableSample[],
  b: readonly ObservableSample[],
): number {
  const aligned = innerJoinByTick(a, b);
  if (aligned.length === 0) return 0;
  const aStates = aligned.map((p) => p.aState);
  const bStates = aligned.map((p) => p.bState);
  const distA = empiricalDistribution(aStates);
  const distB = empiricalDistribution(bStates);
  const joint = empiricalDistribution(
    aligned.map((p) => `${p.aState}\u0001${p.bState}`),
  );
  const hA = shannonEntropyBits([...distA.values()]);
  const hB = shannonEntropyBits([...distB.values()]);
  const hJ = shannonEntropyBits([...joint.values()]);
  const mi = Math.max(0, hA + hB - hJ);
  return Math.max(0, hJ - mi);
}

interface AlignedSample {
  readonly tick: number;
  readonly aState: string;
  readonly bState: string;
}

function innerJoinByTick(
  a: readonly ObservableSample[],
  b: readonly ObservableSample[],
): AlignedSample[] {
  const bByTick = new Map<number, string>();
  for (const s of b) bByTick.set(s.tick, s.state);
  const out: AlignedSample[] = [];
  for (const s of a) {
    const bState = bByTick.get(s.tick);
    if (bState !== undefined) {
      out.push({ tick: s.tick, aState: s.state, bState });
    }
  }
  return out;
}

/**
 * Edge in the loop entanglement graph.
 */
export interface EntanglementEdge {
  readonly from: LoopId;
  readonly to: LoopId;
  /** Mutual information in bits. >= 0 */
  readonly bits: number;
  /** Variation-of-information distance in bits (true metric). >= 0 */
  readonly distance: number;
}

/**
 * Build a complete weighted entanglement graph over a set of loops.
 *
 * Returns one edge per unordered pair (i, j) with i < j (lexicographic on
 * loop id) so that consumers can dedupe trivially.
 */
export function buildEntanglementGraph(
  loops: ReadonlyMap<LoopId, readonly ObservableSample[]>,
): EntanglementEdge[] {
  const ids = [...loops.keys()].sort();
  const edges: EntanglementEdge[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const idA = ids[i]!;
      const idB = ids[j]!;
      const a = loops.get(idA)!;
      const b = loops.get(idB)!;
      const bits = entanglementBits(a, b);
      const distance = variationOfInformationBits(a, b);
      edges.push({ from: idA, to: idB, bits, distance });
    }
  }
  return edges;
}

/**
 * Configuration for entanglement-based assertions.
 */
export interface EntanglementGuardConfig {
  /**
   * Pairs that the runtime expects to be DECOUPLED. If any pair has bits
   * above `decoupledMaxBits`, the guard reports a violation.
   */
  readonly expectedDecoupled?: ReadonlyArray<readonly [LoopId, LoopId]>;
  /**
   * Pairs that the runtime expects to be COUPLED. If any pair has bits
   * below `coupledMinBits`, the guard reports a violation.
   */
  readonly expectedCoupled?: ReadonlyArray<readonly [LoopId, LoopId]>;
  /** Default decoupled threshold in bits. Default: 0.1 */
  readonly decoupledMaxBits?: number;
  /** Default coupled threshold in bits. Default: 0.5 */
  readonly coupledMinBits?: number;
}

export interface EntanglementViolation {
  readonly pair: readonly [LoopId, LoopId];
  readonly observedBits: number;
  readonly expectation: "decoupled" | "coupled";
  readonly threshold: number;
}

/**
 * Check entanglement-based topological expectations.
 */
export function checkEntanglementGuards(
  edges: readonly EntanglementEdge[],
  cfg: EntanglementGuardConfig,
): EntanglementViolation[] {
  const decoupledMax = cfg.decoupledMaxBits ?? 0.1;
  const coupledMin = cfg.coupledMinBits ?? 0.5;
  const lookup = new Map<string, EntanglementEdge>();
  for (const e of edges) {
    const k = canonicalPairKey(e.from, e.to);
    lookup.set(k, e);
  }
  const violations: EntanglementViolation[] = [];
  for (const [a, b] of cfg.expectedDecoupled ?? []) {
    const e = lookup.get(canonicalPairKey(a, b));
    const bits = e?.bits ?? 0;
    if (bits > decoupledMax) {
      violations.push({
        pair: [a, b],
        observedBits: bits,
        expectation: "decoupled",
        threshold: decoupledMax,
      });
    }
  }
  for (const [a, b] of cfg.expectedCoupled ?? []) {
    const e = lookup.get(canonicalPairKey(a, b));
    const bits = e?.bits ?? 0;
    if (bits < coupledMin) {
      violations.push({
        pair: [a, b],
        observedBits: bits,
        expectation: "coupled",
        threshold: coupledMin,
      });
    }
  }
  return violations;
}

function canonicalPairKey(a: LoopId, b: LoopId): string {
  return a < b ? `${a}\u0001${b}` : `${b}\u0001${a}`;
}
