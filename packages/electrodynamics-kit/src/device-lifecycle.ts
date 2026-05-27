/**
 * Device lifecycle chain — re-expressed from Moog's posture that a device's
 * identity is the *chain* (build → test → ship → integrate → calibrate →
 * operate → retire), not any single record. See
 * docs/research/electrodynamics-synthesis-2026.md §2.
 *
 * Re-uses the szl-receipts append-only model conceptually (each stage is a
 * hashed link); the consumer (api-server) emits a `device.lifecycle.v1`
 * receipt per stage. Calibration is the gate that authorises commands —
 * an uncalibrated device's command attempt is rejected at the boundary.
 */

export type DeviceLifecycleStage =
  | 'build'
  | 'factory-test'
  | 'ship'
  | 'integrate'
  | 'calibrate'
  | 'operate'
  | 'retire';

export interface DeviceLifecycleEvent {
  readonly deviceRef: string;
  readonly stage: DeviceLifecycleStage;
  /** ISO-8601 timestamp. */
  readonly occurredAt: string;
  /** Hash of the previous lifecycle event (chain link). */
  readonly parentLifecycleId?: string;
  /** Free-form stage payload (kept opaque to the chain validator). */
  readonly stageData: Readonly<Record<string, unknown>>;
  /** SHA-256-equivalent hash of (parentLifecycleId, stage, deviceRef, occurredAt, stageData). */
  readonly chainHead: string;
}

export interface CalibrationGate {
  readonly deviceRef: string;
  readonly current: boolean;
  readonly reason: string;
  /** chainHead of the calibration event consulted (if any). */
  readonly chainHead?: string;
}

/**
 * Pure check: given a chronologically-ordered chain of events, does the
 * tail contain a `calibrate` whose `expiresAt` (in stageData) is in the
 * future, with no intervening `retire`?
 *
 * Chain is expected in event-order (oldest → newest). Returns a typed
 * gate verdict — callers translate to receipt-write or HTTP refusal.
 */
export function evaluateCalibrationGate(
  deviceRef: string,
  chain: readonly DeviceLifecycleEvent[],
  now: number = Date.now(),
): CalibrationGate {
  let lastCalibrate: DeviceLifecycleEvent | undefined;
  let retired = false;
  for (const ev of chain) {
    if (ev.deviceRef !== deviceRef) continue;
    if (ev.stage === 'calibrate') lastCalibrate = ev;
    if (ev.stage === 'retire') retired = true;
  }
  if (retired) {
    return { deviceRef, current: false, reason: 'device retired' };
  }
  if (!lastCalibrate) {
    return { deviceRef, current: false, reason: 'no calibrate event in chain' };
  }
  const expiresAtRaw = (lastCalibrate.stageData as { expiresAt?: unknown }).expiresAt;
  if (typeof expiresAtRaw !== 'string') {
    return {
      deviceRef,
      current: false,
      reason: 'calibrate event missing expiresAt timestamp',
      chainHead: lastCalibrate.chainHead,
    };
  }
  const expiresAt = Date.parse(expiresAtRaw);
  if (!Number.isFinite(expiresAt)) {
    return {
      deviceRef,
      current: false,
      reason: `calibrate expiresAt is unparseable: ${expiresAtRaw}`,
      chainHead: lastCalibrate.chainHead,
    };
  }
  if (expiresAt <= now) {
    return {
      deviceRef,
      current: false,
      reason: `calibration expired at ${expiresAtRaw}`,
      chainHead: lastCalibrate.chainHead,
    };
  }
  return {
    deviceRef,
    current: true,
    reason: 'calibration in date',
    chainHead: lastCalibrate.chainHead,
  };
}
