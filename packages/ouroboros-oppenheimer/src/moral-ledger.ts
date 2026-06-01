/**
 * Primitive 28 — Moral-responsibility ledger.
 *
 * Source: J. Robert Oppenheimer Papers, Library of Congress, MSS35188,
 *   Series 9b (speeches and statements), with primary attestations in
 *   Oppenheimer, "Science and the Common Understanding" (1954) and the
 *   Reith Lectures (BBC, 1953).
 *
 * Quoted lineage: "the physicists have known sin" (1947 lecture, MIT).
 *
 * Computable form: every consequential action emits an entry binding
 *   { actorId, actionId, foreseenHarms[], unforeseenHarms[], counterfactual,
 *     causality(0–1), authorityClaim, accountabilityWitness }.
 *
 * The ledger refuses anonymous moral cost. Aggregate axis M (moral
 * grounding) ∈ [0,1] = mean accountability score across the active window.
 */

export interface MoralEntry {
  entryId: string;
  actorId: string;
  actionId: string;
  foreseenHarms: string[];
  unforeseenHarms: string[];
  counterfactual: string; // what would have happened without the action
  causality: number; // [0,1]
  authorityClaim: string; // "AEC", "self", "Manhattan Project", etc.
  accountabilityWitness: string | null; // null = anonymous; refused
  timestamp: number;
}

export interface MoralLedgerSummary {
  entryCount: number;
  anonymousCount: number;
  meanCausality: number;
  meanAccountability: number; // M-axis aggregate
  acceptedEntries: MoralEntry[];
  refusedEntries: MoralEntry[];
}

export class MoralLedger {
  private accepted: MoralEntry[] = [];
  private refused: MoralEntry[] = [];

  record(entry: MoralEntry): { accepted: boolean; reason: string } {
    if (entry.accountabilityWitness === null) {
      this.refused.push({ ...entry });
      return {
        accepted: false,
        reason: "Anonymous moral cost refused; entry stored in refused log only.",
      };
    }
    if (entry.causality < 0 || entry.causality > 1) {
      throw new Error("causality must be in [0,1].");
    }
    this.accepted.push({ ...entry });
    return { accepted: true, reason: "Entry recorded with named witness." };
  }

  summary(): MoralLedgerSummary {
    const total = this.accepted.length + this.refused.length;
    const meanCausality =
      this.accepted.length === 0
        ? 0
        : this.accepted.reduce((a, e) => a + e.causality, 0) / this.accepted.length;
    // Accountability score = (accepted / total) blended with mean causality
    // (highly causal accepted entries score higher; refused entries pull down).
    const meanAccountability =
      total === 0
        ? 1.0
        : (this.accepted.length / total) * (0.5 + 0.5 * meanCausality);
    return {
      entryCount: total,
      anonymousCount: this.refused.length,
      meanCausality,
      meanAccountability,
      acceptedEntries: [...this.accepted],
      refusedEntries: [...this.refused],
    };
  }

  /** Convenience: just the M-axis aggregate. */
  moralGroundingAxis(): number {
    return this.summary().meanAccountability;
  }
}
