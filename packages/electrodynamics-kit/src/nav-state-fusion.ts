/**
 * Navigation state fusion — re-expressed from PX4 / ArduPilot EKF posture
 * that "the covariance is part of the state." See
 * docs/research/electrodynamics-synthesis-2026.md §10.1.
 *
 *   "No state without covariance."
 *
 * This is NOT a full Kalman implementation — it is a typed fusion shape
 * that guarantees the covariance-bearing envelope. Consumers plug in
 * their own update rule via the `fuser` parameter; the receipt-class
 * contract is what this module locks in.
 */

export interface NavState {
  /** [x, y, z] position in opaque units. */
  readonly position: readonly [number, number, number];
  /** [vx, vy, vz] velocity in opaque units. */
  readonly velocity: readonly [number, number, number];
  /** [roll, pitch, yaw] attitude in radians. */
  readonly attitude: readonly [number, number, number];
  /** [bx, by, bz] gyro bias. */
  readonly gyroBias: readonly [number, number, number];
  /** [bx, by, bz] accel bias. */
  readonly accelBias: readonly [number, number, number];
}

/** 15×15 symmetric covariance (state dim = 15). Row-major. */
export type NavCovariance = readonly (readonly number[])[];

export interface NavStateEnvelope {
  readonly stateRef: string;
  readonly state: NavState;
  readonly covariance: NavCovariance;
  /** Hex hash of canonical covariance bytes — what the receipt records. */
  readonly covarianceHash: string;
  /** ISO-8601 timestamp. */
  readonly asOf: string;
}

export interface SensorHealth {
  readonly sensorRef: string;
  readonly available: boolean;
  /** Sensor-reported confidence ∈ [0, 1]. */
  readonly confidence: number;
}

/** Pure: validate that a covariance matrix is well-formed (square, symmetric, finite). */
export function validateCovariance(cov: NavCovariance, expectedDim = 15): void {
  if (!Array.isArray(cov) || cov.length !== expectedDim) {
    throw new Error(
      `nav-state-fusion: covariance must be ${expectedDim}×${expectedDim}, got ${cov?.length ?? 0} rows`,
    );
  }
  for (let i = 0; i < expectedDim; i++) {
    const row = cov[i];
    if (!Array.isArray(row) || row.length !== expectedDim) {
      throw new Error(`nav-state-fusion: row ${i} has wrong length`);
    }
    for (let j = 0; j < expectedDim; j++) {
      const v = row[j]!;
      if (!Number.isFinite(v)) throw new Error(`nav-state-fusion: cov[${i}][${j}] is not finite`);
      const sym = cov[j]![i]!;
      if (Math.abs(v - sym) > 1e-9) {
        throw new Error(`nav-state-fusion: covariance not symmetric at [${i},${j}]`);
      }
    }
    if (row[i]! < 0) throw new Error(`nav-state-fusion: diagonal cov[${i}][${i}] is negative`);
  }
}

/** Deterministic hash of a covariance matrix for the receipt envelope. */
export function hashCovariance(cov: NavCovariance, hasher: (s: string) => string): string {
  const flat = cov.map((row) => row.map((v) => v.toFixed(12)).join(',')).join('|');
  return hasher(flat);
}

/**
 * Pluggable fusion step. The package guarantees the envelope shape
 * (state + covariance + hash); the integrator supplies the update rule.
 *
 * A sensor that is unavailable or whose confidence is 0 must not move
 * the state — this is enforced here. Tightening (covariance shrink)
 * happens only when the sensor is available with positive confidence.
 */
export function fuseSensor(
  prior: NavStateEnvelope,
  sensor: SensorHealth,
  fuser: (s: NavState, c: NavCovariance) => { state: NavState; covariance: NavCovariance },
  hasher: (s: string) => string,
  nextStateRef: string,
  asOf: string,
): NavStateEnvelope {
  if (!sensor.available || sensor.confidence <= 0) {
    return {
      stateRef: nextStateRef,
      state: prior.state,
      covariance: prior.covariance,
      covarianceHash: prior.covarianceHash,
      asOf,
    };
  }
  const { state, covariance } = fuser(prior.state, prior.covariance);
  validateCovariance(covariance);
  return {
    stateRef: nextStateRef,
    state,
    covariance,
    covarianceHash: hashCovariance(covariance, hasher),
    asOf,
  };
}
