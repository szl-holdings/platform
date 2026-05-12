/**
 * Primitive 48 — Synchronicity log
 *
 * Jung: meaningful coincidence without causal connection. The log
 * records co-occurrences of independent events, computes a naive
 * coincidence index (1 / expected joint probability), and refuses
 * to assert causation. Every entry is observation only.
 */

export interface CoOccurrence {
  eventA: string;
  eventB: string;
  pA: number;            // marginal probability 0..1
  pB: number;            // marginal probability 0..1
  observedAt: string;    // ISO-8601
  note?: string;
}

export interface SynchronicityRecord extends CoOccurrence {
  expectedJoint: number; // pA * pB under independence assumption
  surpriseIndex: number; // -log2(expectedJoint), guarded
  causalClaim: false;    // hard-coded — synchronicity never claims cause
}

export class SynchronicityLog {
  private records: SynchronicityRecord[] = [];

  observe(co: CoOccurrence): SynchronicityRecord {
    if (co.pA <= 0 || co.pA > 1 || co.pB <= 0 || co.pB > 1) {
      throw new Error("marginals must be in (0,1]");
    }
    const expectedJoint = co.pA * co.pB;
    const surpriseIndex = -Math.log2(Math.max(expectedJoint, 1e-300));
    const r: SynchronicityRecord = {
      ...co,
      expectedJoint,
      surpriseIndex,
      causalClaim: false,
    };
    this.records.push(r);
    return r;
  }

  list(): SynchronicityRecord[] {
    return [...this.records];
  }

  count(): number {
    return this.records.length;
  }
}
