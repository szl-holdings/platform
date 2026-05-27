/**
 * Per-message-class latency-budget bus — re-expressed from Curtiss-Wright's
 * public posture on rugged deterministic-latency interconnect. See
 * docs/research/electrodynamics-synthesis-2026.md §3.
 *
 *   "Refusal as a first-class outcome — the bus returns {delivered: false,
 *    reason: 'budget-exceeded'} rather than queueing past budget."
 *
 * Pure scheduler / journaling; no I/O.
 */

export interface BusMessageClass {
  readonly className: string;
  readonly maxLatencyMs: number;
}

export interface BusSendInput {
  readonly className: string;
  readonly payloadHash: string;
  /** Wall-clock millis when the sender enqueued the payload. */
  readonly enqueuedAt: number;
}

export type BusDeliveryOutcome =
  | {
      readonly delivered: true;
      readonly className: string;
      readonly maxLatencyMs: number;
      readonly observedLatencyMs: number;
    }
  | {
      readonly delivered: false;
      readonly className: string;
      readonly maxLatencyMs: number;
      readonly observedLatencyMs: number;
      readonly refusalReason: string;
    };

/**
 * Evaluate a single send against its declared class. Pure function:
 * given the send input, the class registry, and the wall-clock at the
 * moment of evaluation, return the outcome. No mutation.
 */
export function evaluateBusDelivery(
  input: BusSendInput,
  classes: ReadonlyMap<string, BusMessageClass>,
  evaluatedAt: number,
): BusDeliveryOutcome {
  const cls = classes.get(input.className);
  if (!cls) {
    return {
      delivered: false,
      className: input.className,
      maxLatencyMs: 0,
      observedLatencyMs: 0,
      refusalReason: `unknown message class: ${input.className}`,
    };
  }
  const observedLatencyMs = Math.max(0, evaluatedAt - input.enqueuedAt);
  if (observedLatencyMs > cls.maxLatencyMs) {
    return {
      delivered: false,
      className: cls.className,
      maxLatencyMs: cls.maxLatencyMs,
      observedLatencyMs,
      refusalReason: `budget-exceeded: observed ${observedLatencyMs}ms > max ${cls.maxLatencyMs}ms`,
    };
  }
  return {
    delivered: true,
    className: cls.className,
    maxLatencyMs: cls.maxLatencyMs,
    observedLatencyMs,
  };
}
