/**
 * Primitive 30 — Hypothesis Ledger (analytical / hypothetical method)
 *
 * Source: Plato, Republic 510b, 533c5; Phaedo 100a; Meno 86e;
 *         Theaetetus 197a1 (Socrates' only mode).
 * Working summary: Eva Brann, op. cit.
 *
 * Every claim must declare its hypotheses (named, citeable). Each hypothesis
 * tracks its status:
 *   ASSUMED   — taken on, not yet examined
 *   AGREED    — interlocutor consents (Republic 533c5 "agreement")
 *   RAISED    — taken up (anairousa, 533c8): given an account, made non-hypothetical
 *   RETRACTED — withdrawn after refutation (elenchus)
 */

export type HypothesisStatus = "ASSUMED" | "AGREED" | "RAISED" | "RETRACTED";

export interface Hypothesis {
  id: string;
  text: string;
  parents: string[]; // ids of hypotheses this depends on
  status: HypothesisStatus;
  account?: string; // logos given when raised
}

export interface LedgerEntry {
  hypothesis: Hypothesis;
  derivedClaims: string[];
}

export class HypothesisLedger {
  private store = new Map<string, LedgerEntry>();

  add(h: Hypothesis): void {
    if (this.store.has(h.id)) {
      throw new Error(`Hypothesis ${h.id} already in ledger.`);
    }
    for (const parentId of h.parents) {
      if (!this.store.has(parentId)) {
        throw new Error(`Parent hypothesis ${parentId} not in ledger.`);
      }
    }
    this.store.set(h.id, { hypothesis: { ...h }, derivedClaims: [] });
  }

  get(id: string): Hypothesis | undefined {
    return this.store.get(id)?.hypothesis;
  }

  setStatus(id: string, status: HypothesisStatus, account?: string): void {
    const entry = this.store.get(id);
    if (!entry) throw new Error(`Hypothesis ${id} not found.`);
    if (status === "RAISED" && !account) {
      throw new Error("Raising a hypothesis requires an account (logos).");
    }
    entry.hypothesis.status = status;
    if (account) entry.hypothesis.account = account;
  }

  attachClaim(claimId: string, hypothesisIds: string[]): void {
    for (const hid of hypothesisIds) {
      const entry = this.store.get(hid);
      if (!entry) throw new Error(`Hypothesis ${hid} not found.`);
      entry.derivedClaims.push(claimId);
    }
  }

  /** Ids of hypotheses currently RAISED. */
  raisedIds(): string[] {
    return [...this.store.values()]
      .filter((e) => e.hypothesis.status === "RAISED")
      .map((e) => e.hypothesis.id);
  }

  /** Ids of hypotheses currently RETRACTED. */
  retractedIds(): string[] {
    return [...this.store.values()]
      .filter((e) => e.hypothesis.status === "RETRACTED")
      .map((e) => e.hypothesis.id);
  }

  /** True if every hypothesis transitively required by claim is RAISED. */
  isClaimFullyRaised(claimId: string): boolean {
    const required = new Set<string>();
    for (const entry of this.store.values()) {
      if (entry.derivedClaims.includes(claimId)) {
        this.collectAncestors(entry.hypothesis.id, required);
      }
    }
    if (required.size === 0) return false;
    for (const hid of required) {
      const status = this.store.get(hid)?.hypothesis.status;
      if (status !== "RAISED") return false;
    }
    return true;
  }

  private collectAncestors(id: string, into: Set<string>): void {
    if (into.has(id)) return;
    into.add(id);
    const h = this.store.get(id)?.hypothesis;
    if (!h) return;
    for (const p of h.parents) this.collectAncestors(p, into);
  }

  size(): number {
    return this.store.size;
  }
}
