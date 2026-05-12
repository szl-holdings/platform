/**
 * Sentra integration — HSM-anchored governance via Egyptian doubling
 * multiplication.
 *
 * Sentra's HSM anchor only supports shift-and-add primitives in its
 * audited code path. Egyptian multiplication (RMP doubling method) is
 * the proof that any 256-bit accumulator can be expressed using only
 * shift and add — no native multiply needed.
 *
 * Every governance event is folded into a shift-add accumulator inside
 * the HSM, producing a tamper-evident trace where each step is a single
 * doubling, recoverable by an external auditor.
 */

import {
  egyptianMultiply,
  verifyDoublingTrace,
  shiftAddAccumulate,
  SHIFT_ADD_PRIME,
  type DoublingTrace,
} from "@workspace/reconciliation";

export interface SentraGovernanceEvent {
  readonly eventId: string;
  readonly leafHash: bigint;
  readonly timestamp: number;
}

export interface SentraAccumulatorState {
  readonly accumulator: bigint;
  readonly eventCount: number;
  readonly lastUpdate: number;
  readonly prime: bigint;
}

export class SentraHSMAnchor {
  private accumulator = 0n;
  private eventCount = 0;
  private lastUpdate = 0;

  constructor(private readonly prime: bigint = SHIFT_ADD_PRIME) {}

  /**
   * Append a governance event to the HSM-resident accumulator using only
   * shift-and-add. Returns the doubling trace as the audit artifact.
   */
  append(event: SentraGovernanceEvent): { state: SentraAccumulatorState; trace: DoublingTrace } {
    const trace = egyptianMultiply(event.leafHash % this.prime, 2n);
    this.accumulator = (this.accumulator + trace.product) % this.prime;
    this.eventCount += 1;
    this.lastUpdate = event.timestamp;
    return {
      state: this.snapshot(),
      trace,
    };
  }

  /**
   * Batch append. Useful for HSM bulk-load on cold start.
   */
  appendBatch(events: readonly SentraGovernanceEvent[]): SentraAccumulatorState {
    const leaves = events.map((e) => e.leafHash);
    const delta = shiftAddAccumulate(leaves, this.prime);
    this.accumulator = (this.accumulator + delta) % this.prime;
    this.eventCount += events.length;
    if (events.length > 0) {
      this.lastUpdate = events[events.length - 1].timestamp;
    }
    return this.snapshot();
  }

  snapshot(): SentraAccumulatorState {
    return {
      accumulator: this.accumulator,
      eventCount: this.eventCount,
      lastUpdate: this.lastUpdate,
      prime: this.prime,
    };
  }

  /**
   * External re-derivation: given the original events, recompute the
   * accumulator without trusting the HSM. Auditors use this to verify
   * the HSM has not silently mutated the accumulator state.
   */
  static reDerive(events: readonly SentraGovernanceEvent[], prime: bigint = SHIFT_ADD_PRIME): bigint {
    return shiftAddAccumulate(
      events.map((e) => e.leafHash),
      prime
    );
  }
}

/**
 * Verify a doubling trace produced by the HSM.
 */
export function verifyHSMTrace(trace: DoublingTrace): boolean {
  return verifyDoublingTrace(trace);
}

export { SHIFT_ADD_PRIME };
