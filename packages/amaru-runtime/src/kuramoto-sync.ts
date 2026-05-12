/**
 * Amaru Kuramoto fleet-sync detector.
 *
 * Each metric in the fleet emits a phase signal (slope angle in radians,
 * derived from seked). The Kuramoto order parameter r ∈ [0,1] tells us
 * how synchronized the fleet is:
 *
 *   r ≥ 0.85  COHERENT   — fleet operating in lockstep
 *   0.4 ≤ r   MIXING     — partial sync, watch list
 *   r < 0.4   INCOHERENT — fleet has split, anomaly likely
 *
 * Source: Kuramoto, Y. (1975). Self-entrainment of a population of
 *   coupled non-linear oscillators. International Symposium on
 *   Mathematical Problems in Theoretical Physics.
 */
import {
  classifyCoherence,
  orderParameter,
  type KuramotoOscillator,
  type CoherenceVerdict,
} from "@workspace/ouroboros-resonance";
import { sekedToDegrees, type SekedReading } from "@workspace/reconciliation";

export interface FleetPhase {
  readonly metricId: string;
  readonly phase: number;       // radians
  readonly degrees: number;
}

export interface FleetSyncReport {
  readonly r: number;             // Kuramoto order parameter
  readonly psi: number;           // mean phase
  readonly verdict: CoherenceVerdict;
  readonly phases: ReadonlyArray<FleetPhase>;
}

/** Convert a seked reading into a Kuramoto-style phase in radians. */
export function sekedToPhase(reading: SekedReading): number {
  const deg = sekedToDegrees(reading.seked);
  return (deg * Math.PI) / 180;
}

/**
 * Score the fleet's synchronization given a map of metricId → seked reading.
 */
export function scoreFleetSync(
  readings: ReadonlyMap<string, SekedReading>,
): FleetSyncReport {
  const oscillators: KuramotoOscillator[] = [];
  const phases: FleetPhase[] = [];
  for (const [metricId, r] of readings) {
    const phase = sekedToPhase(r);
    oscillators.push({ id: metricId, phase, naturalFrequency: 0 });
    phases.push({ metricId, phase, degrees: sekedToDegrees(r.seked) });
  }
  const { r, psi } = orderParameter(oscillators);
  return { r, psi, verdict: classifyCoherence(r), phases };
}
