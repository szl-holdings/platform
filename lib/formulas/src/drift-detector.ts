/**
 * Sentra brain — formula drift detector.
 *
 * Records observed-vs-baseline performance samples for instrumented
 * formulas and, once a (formulaId, parameter) bucket has accumulated
 * enough evidence of sustained drift, emits a `SentraSignalForRosie`
 * for the ROSIE loop to convert into an A11oy tuning proposal.
 *
 * Drift is measured as the mean absolute relative gap between the
 * observed performance and the baseline expectation. A signal is emitted
 * when:
 *   - the rolling window holds at least `samplesMin` observations
 *     (default 25), AND
 *   - the mean gap exceeds `gapMin` (default 0.10 — i.e. >10%).
 *
 * This module is intentionally framework-agnostic (no DOM, no fetch) so
 * the same buffer can run inside the sentra brain page, a Node worker,
 * or the api-server scheduled job. It is the single source of truth for
 * what counts as "performance drift" anywhere in the platform.
 *
 * Source: docs/thesis/v10-canonical.md §6.1.
 */

import type { SentraSignalForRosie } from './evolution.js';

export interface DriftThresholds {
  /** Minimum relative gap that counts as drift (default 0.10 = >10%). */
  gapMin?: number;
  /** Minimum observations before a signal can be emitted (default 25). */
  samplesMin?: number;
  /** Maximum samples kept per bucket — older samples are dropped. */
  windowSize?: number;
}

export const DEFAULT_DRIFT_THRESHOLDS: Required<DriftThresholds> = {
  gapMin: 0.1,
  samplesMin: 25,
  windowSize: 200,
};

export interface DriftObservation {
  formulaId: string;
  parameter: string;
  /** Observed performance metric for this run (any positive scale). */
  observed: number;
  /** Baseline / expected performance the formula was tuned for. */
  baseline: number;
  /** Current parameter value being scored. */
  oldValue: number;
  /** Candidate value ROSIE would propose if the signal fires. */
  candidateValue: number;
  /** Version string of the formula generating this observation. */
  fromVersion: string;
  /** Thesis section/citation backing this parameter. */
  thesisCitation: string;
  /** Optional irreversibility penalty in [0, 1] forwarded to ROSIE. */
  irreversibility?: number;
}

interface Bucket {
  formulaId: string;
  parameter: string;
  oldValue: number;
  candidateValue: number;
  fromVersion: string;
  thesisCitation: string;
  irreversibility: number;
  observedHistory: number[];
  baselineHistory: number[];
  gapHistory: number[];
  /** Total observations ever seen (samples reported on emitted signals). */
  totalSamples: number;
}

function bucketKey(formulaId: string, parameter: string): string {
  return `${formulaId}::${parameter}`;
}

function relativeGap(observed: number, baseline: number): number {
  // Use the baseline magnitude as the denominator. When the baseline is
  // (near) zero, fall back to the absolute observed deviation, clamped
  // into [0, 1] so the score is well-defined for evaluateObservedEvent.
  const denom = Math.max(Math.abs(baseline), 1e-9);
  return Math.min(1, Math.abs(observed - baseline) / denom);
}

/**
 * Snapshot of a single bucket's progress toward firing — surfaced to the
 * sentra brain UI so operators can see what's "warming up" before a
 * proposal lands in the Codex. Unlike `pendingSignals()`, this includes
 * buckets that have NOT yet crossed the threshold.
 */
export interface DriftBucketSnapshot {
  formulaId: string;
  parameter: string;
  oldValue: number;
  candidateValue: number;
  fromVersion: string;
  thesisCitation: string;
  irreversibility: number;
  /** Samples currently in the rolling window. */
  sampleCount: number;
  /** Total samples ever recorded (never decreases). */
  totalSamples: number;
  /** Mean absolute relative gap across the window. */
  meanGap: number;
  /** Effective samplesMin / gapMin in force for this detector. */
  samplesMinTarget: number;
  gapMinTarget: number;
  /** 0..1 progress toward samplesMin. */
  progressSamples: number;
  /** 0..1 progress of meanGap toward gapMin (capped at 1). */
  progressGap: number;
  /** True iff this bucket would emit a signal on the next `pendingSignals` call. */
  willFire: boolean;
  /** Tail of rolling observed values (most recent last, up to 60). */
  observedTail: number[];
  /** Tail of rolling baseline values (aligned with observedTail). */
  baselineTail: number[];
}

export interface DriftDetector {
  /** Record one observation. Updates the rolling window in place. */
  record(obs: DriftObservation): void;
  /**
   * Inspect (without mutating) the current set of buckets that have
   * crossed the drift threshold. Useful for UI surfacing.
   */
  pendingSignals(): SentraSignalForRosie[];
  /**
   * Inspect (without mutating) every tracked bucket — including those
   * that have not yet crossed the firing threshold. Sorted by descending
   * `willFire`, then by descending progressGap × progressSamples so
   * the buckets closest to firing surface at the top.
   */
  inspectBuckets(): DriftBucketSnapshot[];
  /**
   * Collect and clear the drift-tripping buckets, returning one signal
   * per (formulaId, parameter) ready to feed into `runRosieLoop`.
   */
  drainSignals(): SentraSignalForRosie[];
  /** Reset all buckets (test helper). */
  reset(): void;
  /** Number of buckets currently being tracked (test helper). */
  size(): number;
  /** Effective thresholds in use. */
  thresholds: Required<DriftThresholds>;
}

export function createDriftDetector(thresholds: DriftThresholds = {}): DriftDetector {
  const cfg: Required<DriftThresholds> = {
    gapMin: thresholds.gapMin ?? DEFAULT_DRIFT_THRESHOLDS.gapMin,
    samplesMin: thresholds.samplesMin ?? DEFAULT_DRIFT_THRESHOLDS.samplesMin,
    windowSize: thresholds.windowSize ?? DEFAULT_DRIFT_THRESHOLDS.windowSize,
  };
  const buckets = new Map<string, Bucket>();

  function record(obs: DriftObservation): void {
    const key = bucketKey(obs.formulaId, obs.parameter);
    let b = buckets.get(key);
    if (!b) {
      b = {
        formulaId: obs.formulaId,
        parameter: obs.parameter,
        oldValue: obs.oldValue,
        candidateValue: obs.candidateValue,
        fromVersion: obs.fromVersion,
        thesisCitation: obs.thesisCitation,
        irreversibility: obs.irreversibility ?? 0,
        observedHistory: [],
        baselineHistory: [],
        gapHistory: [],
        totalSamples: 0,
      };
      buckets.set(key, b);
    } else {
      // Always refresh metadata so the latest candidate/version wins.
      b.oldValue = obs.oldValue;
      b.candidateValue = obs.candidateValue;
      b.fromVersion = obs.fromVersion;
      b.thesisCitation = obs.thesisCitation;
      b.irreversibility = obs.irreversibility ?? b.irreversibility;
    }

    b.observedHistory.push(obs.observed);
    b.baselineHistory.push(obs.baseline);
    b.gapHistory.push(relativeGap(obs.observed, obs.baseline));
    b.totalSamples += 1;

    if (b.observedHistory.length > cfg.windowSize) {
      b.observedHistory.shift();
      b.baselineHistory.shift();
      b.gapHistory.shift();
    }
  }

  function buildSignal(b: Bucket): SentraSignalForRosie | null {
    if (b.gapHistory.length < cfg.samplesMin) return null;
    const meanGap =
      b.gapHistory.reduce((acc, g) => acc + g, 0) / b.gapHistory.length;
    if (meanGap <= cfg.gapMin) return null;
    return {
      formulaId: b.formulaId,
      parameter: b.parameter,
      observedGap: meanGap,
      samples: b.gapHistory.length,
      oldValue: b.oldValue,
      candidateValue: b.candidateValue,
      fromVersion: b.fromVersion,
      thesisCitation: b.thesisCitation,
      driftSamples: {
        current: [...b.baselineHistory],
        candidate: [...b.observedHistory],
      },
      // Forward the per-sample gap history so the ROSIE evaluator can
      // compute a Hoeffding lower confidence bound on the mean gap
      // (Auer-Cesa-Bianchi-Fischer 2002 §2.1) and reject thin-evidence
      // proposals that beat `gapMin` only on a high-variance point
      // estimate.
      gapHistory: [...b.gapHistory],
      irreversibility: b.irreversibility,
    };
  }

  function pendingSignals(): SentraSignalForRosie[] {
    const out: SentraSignalForRosie[] = [];
    for (const b of buckets.values()) {
      const sig = buildSignal(b);
      if (sig) out.push(sig);
    }
    return out;
  }

  function snapshotBucket(b: Bucket): DriftBucketSnapshot {
    const sampleCount = b.gapHistory.length;
    const meanGap = sampleCount === 0
      ? 0
      : b.gapHistory.reduce((acc, g) => acc + g, 0) / sampleCount;
    const progressSamples = Math.min(1, sampleCount / Math.max(1, cfg.samplesMin));
    const progressGap = Math.min(1, meanGap / Math.max(1e-9, cfg.gapMin));
    const willFire = sampleCount >= cfg.samplesMin && meanGap > cfg.gapMin;
    const TAIL = 60;
    return {
      formulaId: b.formulaId,
      parameter: b.parameter,
      oldValue: b.oldValue,
      candidateValue: b.candidateValue,
      fromVersion: b.fromVersion,
      thesisCitation: b.thesisCitation,
      irreversibility: b.irreversibility,
      sampleCount,
      totalSamples: b.totalSamples,
      meanGap,
      samplesMinTarget: cfg.samplesMin,
      gapMinTarget: cfg.gapMin,
      progressSamples,
      progressGap,
      willFire,
      observedTail: b.observedHistory.slice(-TAIL),
      baselineTail: b.baselineHistory.slice(-TAIL),
    };
  }

  function inspectBuckets(): DriftBucketSnapshot[] {
    const out: DriftBucketSnapshot[] = [];
    for (const b of buckets.values()) out.push(snapshotBucket(b));
    out.sort((a, b) => {
      if (a.willFire !== b.willFire) return a.willFire ? -1 : 1;
      const aScore = a.progressGap * a.progressSamples;
      const bScore = b.progressGap * b.progressSamples;
      return bScore - aScore;
    });
    return out;
  }

  function drainSignals(): SentraSignalForRosie[] {
    const out: SentraSignalForRosie[] = [];
    for (const [key, b] of buckets) {
      const sig = buildSignal(b);
      if (sig) {
        out.push(sig);
        // Clear this bucket so we don't re-propose on every tick — wait
        // for fresh observations before signalling again.
        buckets.delete(key);
      }
    }
    return out;
  }

  return {
    record,
    pendingSignals,
    inspectBuckets,
    drainSignals,
    reset: () => buckets.clear(),
    size: () => buckets.size,
    thresholds: cfg,
  };
}

/**
 * Shared module-level detector. Most callers should use this so the
 * sentra-brain UI and the api-server scheduled job observe the same
 * buffer when running in the same process.
 */
export const driftDetector = createDriftDetector();
