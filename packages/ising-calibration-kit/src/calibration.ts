/**
 * Calibration loop — discover → execute → analyse → drift → correct → rollback.
 *
 * Re-expression of the architectural pattern from
 * NVIDIA/Quantum-Calibration-Agent-Blueprint (Apache 2.0,
 * @ShuxiangCao lead + 6 contributors). We absorb the loop shape and
 * its state-tracking discipline (HDF5 + SQLite in the original);
 * we ship the typed receipt envelopes only.
 *
 * Every step in the loop emits a content-addressed receipt that is
 * chained back to its predecessor via that predecessor's digest. No
 * synthesised refs, no parent-ref-as-id shortcuts — same audit-chain
 * rule used in `@szl-holdings/memo-reflection-kit`.
 */

import {
  digestBody,
  makeRef,
  type IsingReceiptRef,
} from "./receipts.js";

export interface Experiment {
  readonly id: string;
  readonly label: string;
  /** Free-form parameter schema — opaque to the kit. */
  readonly paramSchema: Record<string, unknown>;
}

export interface Measurement {
  readonly experimentId: string;
  /** Raw observable values keyed by metric name. */
  readonly values: Record<string, number>;
  readonly timestampMs: number;
}

/** Declared model weights the system claims to be operating under. */
export interface DeclaredWeights {
  readonly weights: Record<string, number>;
  readonly version: string;
}

export interface CalibrationChain {
  readonly experimentRef: IsingReceiptRef;
  readonly measurementRef: IsingReceiptRef;
  readonly driftRef: IsingReceiptRef | null;
  readonly correctionRef: IsingReceiptRef | null;
  readonly rollbackRef: IsingReceiptRef | null;
  readonly driftMagnitude: number;
  readonly action: "noop" | "corrected" | "rolled-back";
}

export interface CalibrationPolicy {
  /** L∞ distance above which we emit a drift receipt. */
  readonly driftFloor: number;
  /** L∞ distance above which a correction is mandatory. */
  readonly correctionThreshold: number;
  /**
   * L∞ distance above which we must roll back instead of correcting
   * (the system is too far gone to fit safely).
   */
  readonly rollbackThreshold: number;
}

function lInfDistance(
  a: Record<string, number>,
  b: Record<string, number>,
): number {
  const keys = new Set<string>([...Object.keys(a), ...Object.keys(b)]);
  let max = 0;
  for (const k of keys) {
    const av = a[k] ?? 0;
    const bv = b[k] ?? 0;
    if (!Number.isFinite(av) || !Number.isFinite(bv)) {
      throw new Error(`lInfDistance: non-finite value for key ${k}`);
    }
    const d = Math.abs(av - bv);
    if (d > max) max = d;
  }
  return max;
}

/**
 * Compose a single pass of the calibration loop.
 *
 * Returns a chain of refs:
 *   experimentRef → measurementRef
 *                → optionally driftRef
 *                → optionally correctionRef OR rollbackRef
 *
 * Throws when policy thresholds are inconsistent
 * (driftFloor > correctionThreshold > rollbackThreshold violation), so
 * misconfiguration is caught at compose time, not in production.
 */
export function composeCalibrationChain(args: {
  experiment: Experiment;
  measurement: Measurement;
  declared: DeclaredWeights;
  /** Fresh weights estimated from observed data. */
  fitted: Record<string, number>;
  /** Last-known-good weights to roll back to, if needed. */
  lastKnownGood: DeclaredWeights;
  policy: CalibrationPolicy;
}): CalibrationChain {
  const { experiment, measurement, declared, fitted, lastKnownGood, policy } =
    args;

  if (measurement.experimentId !== experiment.id) {
    throw new Error(
      `composeCalibrationChain: measurement.experimentId=${measurement.experimentId} != experiment.id=${experiment.id}`,
    );
  }
  if (
    !(policy.driftFloor <= policy.correctionThreshold) ||
    !(policy.correctionThreshold <= policy.rollbackThreshold)
  ) {
    throw new Error(
      "composeCalibrationChain: policy must satisfy driftFloor ≤ correctionThreshold ≤ rollbackThreshold",
    );
  }

  const experimentBody = {
    id: experiment.id,
    label: experiment.label,
    paramSchema: experiment.paramSchema,
  };
  const experimentRef = makeRef(
    "ising.calibration.experiment.v1",
    experimentBody,
  );

  const measurementBody = {
    experimentDigest: digestBody(experimentBody),
    values: measurement.values,
    timestampMs: measurement.timestampMs,
  };
  const measurementRef = makeRef(
    "ising.calibration.measurement.v1",
    measurementBody,
  );

  const distance = lInfDistance(fitted, declared.weights);

  if (distance <= policy.driftFloor) {
    return {
      experimentRef,
      measurementRef,
      driftRef: null,
      correctionRef: null,
      rollbackRef: null,
      driftMagnitude: distance,
      action: "noop",
    };
  }

  const driftBody = {
    measurementDigest: digestBody(measurementBody),
    declaredVersion: declared.version,
    distance,
    fitted,
    declared: declared.weights,
  };
  const driftRef = makeRef("ising.calibration.drift.v1", driftBody);

  if (distance >= policy.rollbackThreshold) {
    const rollbackBody = {
      driftDigest: digestBody(driftBody),
      rolledBackTo: lastKnownGood.version,
      weights: lastKnownGood.weights,
    };
    const rollbackRef = makeRef(
      "ising.calibration.rollback.v1",
      rollbackBody,
    );
    return {
      experimentRef,
      measurementRef,
      driftRef,
      correctionRef: null,
      rollbackRef,
      driftMagnitude: distance,
      action: "rolled-back",
    };
  }

  if (distance >= policy.correctionThreshold) {
    const correctionBody = {
      driftDigest: digestBody(driftBody),
      newWeights: fitted,
      replacesVersion: declared.version,
    };
    const correctionRef = makeRef(
      "ising.calibration.correction.v1",
      correctionBody,
    );
    return {
      experimentRef,
      measurementRef,
      driftRef,
      correctionRef,
      rollbackRef: null,
      driftMagnitude: distance,
      action: "corrected",
    };
  }

  // Drift detected but below correction threshold — recorded, no action.
  return {
    experimentRef,
    measurementRef,
    driftRef,
    correctionRef: null,
    rollbackRef: null,
    driftMagnitude: distance,
    action: "noop",
  };
}
