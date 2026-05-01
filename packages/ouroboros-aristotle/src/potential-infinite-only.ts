/**
 * Primitive 76 — Potential-infinite only (finitism gate)
 *
 * Aristotle: actual infinity does not exist. What exists is the
 * potentially-infinite — for any line, we can divide further; for any
 * number, we can add one. The infinite is "what cannot be exhausted."
 *
 * The gate refuses any claim that asserts a completed infinite (an
 * actual-infinite set, an actual-infinite computation). It accepts a
 * claim only if it produces a continuation-witness: a function that,
 * given any current bound, returns a strictly larger bound.
 */

export type ContinuationWitness = (currentBound: number) => number;

export interface InfiniteClaim {
  id: string;
  asserts: "actual-infinite" | "potential-infinite";
  witness?: ContinuationWitness;
}

export interface FinitismVerdict {
  claimId: string;
  accepted: boolean;
  reason: string;
}

export function potentialInfiniteGate(claim: InfiniteClaim, sampleBounds: number[] = [1, 10, 1000]): FinitismVerdict {
  if (claim.asserts === "actual-infinite") {
    return { claimId: claim.id, accepted: false, reason: "actual-infinite rejected (Aristotle, Phys. III.6)" };
  }
  if (!claim.witness) {
    return { claimId: claim.id, accepted: false, reason: "no continuation-witness supplied" };
  }
  for (const b of sampleBounds) {
    let next: number;
    try {
      next = claim.witness(b);
    } catch (e) {
      return { claimId: claim.id, accepted: false, reason: `witness threw at bound ${b}` };
    }
    if (!(next > b)) {
      return { claimId: claim.id, accepted: false, reason: `witness failed monotonicity at bound ${b}` };
    }
  }
  return { claimId: claim.id, accepted: true, reason: "potential-infinite verified by monotone witness" };
}
