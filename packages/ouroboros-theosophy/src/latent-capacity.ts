/**
 * Primitive 51 — Latent-capacity ledger
 *
 * Theosophical Society Object 3: "to investigate the unexplained
 * laws of nature and the powers latent in man." Operationalised
 * as a named-witness ledger: any claim that a system holds a
 * capacity not yet activated must be entered with (a) a witness
 * who can attest, (b) an activation criterion, (c) a falsifier.
 * Without all three the entry is rejected.
 */

export interface LatentClaim {
  capacityId: string;
  description: string;
  witness: string;
  activationCriterion: string;
  falsifier: string;
}

export interface LatentEntry extends LatentClaim {
  acceptedAt: string;
  activated: boolean;
  falsified: boolean;
}

export class LatentCapacityLedger {
  private entries = new Map<string, LatentEntry>();

  declare(claim: LatentClaim, acceptedAt: string): LatentEntry {
    if (
      !claim.witness ||
      !claim.activationCriterion ||
      !claim.falsifier
    ) {
      throw new Error(
        "latent claim requires witness, activationCriterion, and falsifier",
      );
    }
    const e: LatentEntry = {
      ...claim,
      acceptedAt,
      activated: false,
      falsified: false,
    };
    this.entries.set(claim.capacityId, e);
    return e;
  }

  activate(id: string): boolean {
    const e = this.entries.get(id);
    if (!e || e.falsified) return false;
    e.activated = true;
    return true;
  }

  falsify(id: string): boolean {
    const e = this.entries.get(id);
    if (!e) return false;
    e.falsified = true;
    e.activated = false;
    return true;
  }

  list(): LatentEntry[] {
    return [...this.entries.values()];
  }
}
