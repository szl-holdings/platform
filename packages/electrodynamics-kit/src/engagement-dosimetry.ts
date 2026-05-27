/**
 * Engagement dosimetry envelope — re-expressed from Epirus's public posture
 * on directed-energy effects (deny/degrade/destroy) expressed as an
 * envelope with cumulative-dose budget. See
 * docs/research/electrodynamics-synthesis-2026.md §5.
 *
 * Doses are *opaque scalars* tagged with a unit string. The package does
 * not encode physical units — the integrator owns the unit binding. The
 * value here is the receipt-bearing exhaustion discipline.
 *
 *   "Exhaustion is recorded *before* the system refuses further emissions."
 */

export type EffectClass = 'deny' | 'degrade' | 'destroy';

export interface EngagementEnvelope {
  readonly envelopeId: string;
  readonly effectClass: EffectClass;
  /** Opaque geofence reference. */
  readonly geofenceRef: string;
  /** Total cumulative dose budget (opaque scalar). */
  readonly doseBudget: number;
  /** Unit tag for the dose (e.g. `'J/m^2'`); opaque to validator. */
  readonly doseUnit: string;
  /** Approver identity (resolved at envelope-creation time). */
  readonly approvedBy: string;
}

export interface EngagementEmission {
  readonly envelopeId: string;
  readonly emissionId: string;
  readonly doseDelta: number;
  /** ISO-8601 timestamp. */
  readonly emittedAt: string;
}

export interface EngagementJournalEntry {
  readonly emissionId: string;
  readonly doseDelta: number;
  readonly cumulativeDose: number;
  readonly budgetRemaining: number;
  readonly exhausted: boolean;
}

export type EngagementOutcome =
  | {
      readonly outcome: 'emitted';
      readonly entry: EngagementJournalEntry;
    }
  | {
      readonly outcome: 'exhausted';
      readonly entry: EngagementJournalEntry;
      readonly reason: string;
    }
  | {
      readonly outcome: 'refused';
      readonly reason: string;
    };

/**
 * Stateful journal — single envelope, append-only. The journal is the
 * authoritative record; cumulative dose is *only* derived from it, never
 * cached externally.
 */
export class EngagementJournal {
  private readonly entries: EngagementJournalEntry[] = [];
  private cumulative = 0;

  constructor(private readonly envelope: EngagementEnvelope) {
    if (!Number.isFinite(envelope.doseBudget) || envelope.doseBudget <= 0) {
      throw new Error(
        `engagement-dosimetry: doseBudget must be > 0, got ${envelope.doseBudget}`,
      );
    }
  }

  /** Snapshot of the current cumulative dose. */
  totalDose(): number {
    return this.cumulative;
  }

  /** Snapshot of remaining budget. */
  remaining(): number {
    return this.envelope.doseBudget - this.cumulative;
  }

  /** Read-only journal view. */
  view(): readonly EngagementJournalEntry[] {
    return this.entries;
  }

  /**
   * Record an emission. If recording the emission would exceed the
   * budget, the journal first records an *exhaustion* entry (so the
   * receipt-bearing exhaustion event always precedes the refusal), then
   * refuses subsequent emissions until the envelope is closed.
   */
  record(emission: EngagementEmission): EngagementOutcome {
    if (emission.envelopeId !== this.envelope.envelopeId) {
      return {
        outcome: 'refused',
        reason: `envelope mismatch: emission claims ${emission.envelopeId}, journal is for ${this.envelope.envelopeId}`,
      };
    }
    if (!Number.isFinite(emission.doseDelta) || emission.doseDelta < 0) {
      return {
        outcome: 'refused',
        reason: `doseDelta must be a non-negative finite number, got ${emission.doseDelta}`,
      };
    }
    const wasExhausted = this.cumulative >= this.envelope.doseBudget;
    if (wasExhausted) {
      return {
        outcome: 'refused',
        reason: `envelope already exhausted (cumulative ${this.cumulative} ≥ budget ${this.envelope.doseBudget})`,
      };
    }
    const wouldExceed = this.cumulative + emission.doseDelta > this.envelope.doseBudget;
    if (wouldExceed) {
      // Record exhaustion BEFORE refusing.
      const entry: EngagementJournalEntry = {
        emissionId: emission.emissionId,
        doseDelta: emission.doseDelta,
        cumulativeDose: this.envelope.doseBudget,
        budgetRemaining: 0,
        exhausted: true,
      };
      this.entries.push(entry);
      this.cumulative = this.envelope.doseBudget;
      return {
        outcome: 'exhausted',
        entry,
        reason: `emission ${emission.emissionId} would carry cumulative ${
          this.cumulative + emission.doseDelta
        } past budget ${this.envelope.doseBudget}`,
      };
    }
    this.cumulative += emission.doseDelta;
    const entry: EngagementJournalEntry = {
      emissionId: emission.emissionId,
      doseDelta: emission.doseDelta,
      cumulativeDose: this.cumulative,
      budgetRemaining: this.envelope.doseBudget - this.cumulative,
      exhausted: this.cumulative >= this.envelope.doseBudget,
    };
    this.entries.push(entry);
    return { outcome: 'emitted', entry };
  }
}
