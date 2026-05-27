/**
 * Time-R1 temporal anomaly scoring (#5503).
 *
 * Distilled from the AGI-stack synthesis §6 (Time-R1: temporal-trajectory
 * reasoning). Where the existing streaming / batch detectors classify a
 * single point against a rolling baseline, Time-R1 scores an *entire
 * trajectory* — how surprising is this sequence of points given the
 * recent history — and emits a single score per window plus the per-step
 * shock contributions that drove it.
 *
 * Three signals are combined:
 *
 *   1. **drift**     — magnitude of the trajectory mean vs. the
 *                      baseline mean, normalised by baseline σ.
 *   2. **shock**     — peak per-step |z-score| inside the trajectory.
 *   3. **direction** — cosine distance between the trajectory's
 *                      first-difference vector and the baseline's, so a
 *                      flat metric that suddenly oscillates scores high
 *                      even when its mean is unchanged.
 *
 * The composite `temporalScore ∈ [0,1]` is `clamp(0.5·drift_norm +
 * 0.3·shock_norm + 0.2·direction)`. We deliberately keep the math
 * transparent — investors and auditors must be able to re-derive the
 * score from the receipt payload by hand.
 *
 * Out-of-scope: model training, GPU inference. Time-R1's published paper
 * uses an LLM; the Sentra surface only needs the trajectory-scoring
 * primitive, and we ship the deterministic version so it can run inline
 * during incident triage without a sidecar.
 */

import { z } from 'zod';

export const TIME_R1_SCORING_VERSION = '1.0.0' as const;

export const TemporalTrajectoryInputSchema = z.object({
  metricName: z.string(),
  /** Recent points BEFORE the trajectory window — used as baseline. */
  baseline: z
    .array(z.object({ value: z.number(), timestamp: z.string() }))
    .min(2),
  /** The trajectory under evaluation, in time order. */
  trajectory: z
    .array(z.object({ value: z.number(), timestamp: z.string() }))
    .min(2),
  lane: z.string().optional(),
  entityId: z.string().optional(),
});

export type TemporalTrajectoryInput = z.infer<typeof TemporalTrajectoryInputSchema>;

export const TemporalTrajectoryScoreSchema = z.object({
  metricName: z.string(),
  lane: z.string().optional(),
  entityId: z.string().optional(),
  scoredAt: z.string(),
  windowStart: z.string(),
  windowEnd: z.string(),
  /** Composite trajectory score, 0..1. */
  temporalScore: z.number().min(0).max(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  components: z.object({
    driftSigma: z.number().describe('|mean(traj) − mean(baseline)| / σ(baseline)'),
    peakShockSigma: z.number().describe('max |z| inside trajectory vs. baseline'),
    directionCosineDistance: z.number().min(0).max(2).describe('1 − cos(Δtraj, Δbaseline)'),
  }),
  /** Per-step contributions, useful for the UI step-bar. */
  perStepShock: z.array(
    z.object({
      timestamp: z.string(),
      value: z.number(),
      zScore: z.number(),
    }),
  ),
  /** Receipt class — emitted by callers via ReceiptChain.append(). */
  receiptKind: z.literal('anomaly.time-r1.v1'),
  version: z.string(),
});

export type TemporalTrajectoryScore = z.infer<typeof TemporalTrajectoryScoreSchema>;

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function stddev(xs: number[], mu: number): number {
  if (xs.length < 2) return 0;
  let s = 0;
  for (const x of xs) s += (x - mu) ** 2;
  return Math.sqrt(s / (xs.length - 1));
}

function diffs(xs: number[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < xs.length; i++) {
    out.push((xs[i] ?? 0) - (xs[i - 1] ?? 0));
  }
  return out;
}

function cosineDistance(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return 1;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < n; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    na += ai * ai;
    nb += bi * bi;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  if (denom === 0) return 1; // a flat vector vs anything → maximally distant
  const sim = dot / denom;
  // map [-1,1] → [0,2] so the composite stays well-behaved
  return 1 - sim;
}

function severityFor(score: number): TemporalTrajectoryScore['severity'] {
  if (score >= 0.85) return 'critical';
  if (score >= 0.7) return 'high';
  if (score >= 0.45) return 'medium';
  return 'low';
}

/**
 * Pure, deterministic Time-R1 trajectory scoring. Caller is responsible
 * for appending an `anomaly.time-r1.v1` receipt to its ReceiptChain with
 * the returned object as the payload.
 */
export function scoreTemporalTrajectory(
  input: TemporalTrajectoryInput,
): TemporalTrajectoryScore {
  const baselineValues = input.baseline.map((p) => p.value);
  const trajValues = input.trajectory.map((p) => p.value);

  const muB = mean(baselineValues);
  const sigB = stddev(baselineValues, muB);
  const muT = mean(trajValues);

  const driftSigma = sigB > 0 ? Math.abs(muT - muB) / sigB : 0;

  let peakShockSigma = 0;
  const perStepShock: TemporalTrajectoryScore['perStepShock'] = [];
  for (const p of input.trajectory) {
    const z = sigB > 0 ? (p.value - muB) / sigB : 0;
    if (Math.abs(z) > peakShockSigma) peakShockSigma = Math.abs(z);
    perStepShock.push({ timestamp: p.timestamp, value: p.value, zScore: z });
  }

  const dB = diffs(baselineValues);
  const dT = diffs(trajValues);
  const directionCosineDistance = cosineDistance(dB, dT);

  const driftNorm = Math.min(1, driftSigma / 4); // 4σ → saturated
  const shockNorm = Math.min(1, peakShockSigma / 5); // 5σ → saturated
  const dirNorm = Math.min(1, directionCosineDistance / 2);

  const temporalScore = Math.max(
    0,
    Math.min(1, 0.5 * driftNorm + 0.3 * shockNorm + 0.2 * dirNorm),
  );

  const firstTs =
    input.trajectory[0]?.timestamp ?? new Date(0).toISOString();
  const lastTs =
    input.trajectory[input.trajectory.length - 1]?.timestamp ?? firstTs;

  return {
    metricName: input.metricName,
    lane: input.lane,
    entityId: input.entityId,
    scoredAt: new Date().toISOString(),
    windowStart: firstTs,
    windowEnd: lastTs,
    temporalScore,
    severity: severityFor(temporalScore),
    components: {
      driftSigma,
      peakShockSigma,
      directionCosineDistance,
    },
    perStepShock,
    receiptKind: 'anomaly.time-r1.v1',
    version: TIME_R1_SCORING_VERSION,
  };
}
