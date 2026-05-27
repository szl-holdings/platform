/**
 * Actuator command envelope — re-expressed from American Electrodynamics's
 * published technology surface (custom voice-coil / linear motors / resolvers).
 * See docs/research/electrodynamics-synthesis-2026.md §1.
 *
 *   "Every device is specified by a typed envelope that downstream integrators
 *    must respect; every command into the device must declare which envelope
 *    dimension it sits inside."
 *
 * The package issues envelope-bound *commands* and ingests envelope-bound
 * *feedback*; it does not drive physical hardware.
 */

export interface ActuatorEnvelope {
  /** Stable envelope identifier (e.g. `'vcm-12-1kN-stroke-25mm-S2'`). */
  readonly envelopeId: string;
  /** Maximum force in opaque units (e.g. newtons). */
  readonly maxForce: number;
  /** Maximum stroke in opaque units (e.g. millimetres). */
  readonly maxStroke: number;
  /** Duty cycle ∈ (0, 1]. */
  readonly dutyCycle: number;
  /** Maximum rate of change per second in opaque units. */
  readonly slewLimit: number;
  /** Symmetric deadband around the target below which no actuation occurs. */
  readonly deadband: number;
  /** Free-text thermal class (e.g. `'class-H'`). Opaque to the validator. */
  readonly thermalClass: string;
  /** Free-text shock / vibration class. Opaque to the validator. */
  readonly shockClass: string;
}

export interface ActuatorCommand {
  readonly actuatorRef: string;
  /** Envelope this command claims to sit inside. */
  readonly envelopeId: string;
  /** Setpoint magnitude (e.g. position or force) in envelope-native units. */
  readonly target: number;
  /** Strictly monotonic per-actuator sequence number. */
  readonly monotonicSeq: number;
  /** Issuer identity. */
  readonly issuedBy: string;
  /** ISO-8601 issue timestamp. */
  readonly issuedAt: string;
}

export interface ActuatorFeedback {
  readonly actuatorRef: string;
  /** Sequence number this feedback corresponds to. */
  readonly monotonicSeq: number;
  /** Measured value in envelope-native units. */
  readonly measured: number;
  /** Measured − target. */
  readonly deviation: number;
  /** ISO-8601 measurement timestamp. */
  readonly measuredAt: string;
}

export type EnvelopeValidationResult =
  | { readonly withinEnvelope: true }
  | { readonly withinEnvelope: false; readonly reason: string };

/**
 * Check that a command's target sits inside its claimed envelope's bounds.
 * Pure: no I/O, no mutation. Returns a typed verdict; callers translate to
 * HTTP / receipt outcomes.
 */
export function validateCommandWithinEnvelope(
  command: Pick<ActuatorCommand, 'target' | 'envelopeId'>,
  envelope: ActuatorEnvelope,
): EnvelopeValidationResult {
  if (command.envelopeId !== envelope.envelopeId) {
    return {
      withinEnvelope: false,
      reason: `envelope mismatch: command claims ${command.envelopeId}, envelope is ${envelope.envelopeId}`,
    };
  }
  if (!Number.isFinite(command.target)) {
    return { withinEnvelope: false, reason: 'target is not finite' };
  }
  const absTarget = Math.abs(command.target);
  if (absTarget > envelope.maxStroke && absTarget > envelope.maxForce) {
    return {
      withinEnvelope: false,
      reason: `|target| ${absTarget} exceeds both maxStroke ${envelope.maxStroke} and maxForce ${envelope.maxForce}`,
    };
  }
  if (absTarget < envelope.deadband) {
    return {
      withinEnvelope: false,
      reason: `|target| ${absTarget} is inside deadband ${envelope.deadband}`,
    };
  }
  return { withinEnvelope: true };
}

/**
 * Per-actuator strictly-increasing sequence assigner. Out-of-order
 * commands are rejected at the boundary — no silent re-ordering at the
 * device, which is the AED-discipline lesson re-expressed.
 */
export class MonotonicSeqAssigner {
  private readonly lastByActuator = new Map<string, number>();

  /**
   * Returns the next strictly-greater sequence for `actuatorRef`.
   * Throws if a caller attempts to register a non-monotonic seq.
   */
  next(actuatorRef: string): number {
    const last = this.lastByActuator.get(actuatorRef) ?? -1;
    const next = last + 1;
    this.lastByActuator.set(actuatorRef, next);
    return next;
  }

  /**
   * Register that we have observed `seq` for `actuatorRef`. Used by the
   * server when commands come in pre-numbered by the client. Throws on
   * non-monotonic input.
   */
  register(actuatorRef: string, seq: number): void {
    if (!Number.isInteger(seq) || seq < 0) {
      throw new Error(`actuator-command: monotonicSeq must be a non-negative integer, got ${seq}`);
    }
    const last = this.lastByActuator.get(actuatorRef);
    if (last !== undefined && seq <= last) {
      throw new Error(
        `actuator-command: non-monotonic seq for ${actuatorRef}: incoming ${seq} ≤ last ${last}`,
      );
    }
    this.lastByActuator.set(actuatorRef, seq);
  }

  /** Test helper. */
  _resetForTest(): void {
    this.lastByActuator.clear();
  }
}
