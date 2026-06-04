/**
 * Calibration Drift Detector
 *
 * Tracks per-agent accuracy over time and surfaces calibration drift to
 * operators — the gap between an agent's predicted confidence and its
 * observed outcome rate.
 *
 * "Calibration drift" means the agent is systematically over-confident or
 * under-confident relative to its actual performance in a given domain.
 *
 * Detection pipeline:
 *   1. Collect PerformanceRecord[] from the SelfModelStore
 *   2. Compare confidenceBefore vs outcome per window
 *   3. Compute expected calibration error (ECE) and confidence bias
 *   4. Emit a DriftAlert when thresholds are breached
 *   5. Return a CalibrationReport for dashboard surfacing
 */

import type { PerformanceRecord } from './types.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DriftSeverity = 'none' | 'minor' | 'moderate' | 'severe';

export interface CalibrationBucket {
  confidenceLow: number; // e.g. 0.60
  confidenceHigh: number; // e.g. 0.70
  sampleCount: number;
  meanConfidence: number; // average stated confidence in this bucket
  observedAccuracy: number; // fraction of 'success' outcomes
  calibrationError: number; // |meanConfidence - observedAccuracy|
}

export interface DriftAlert {
  agentId: string;
  domain?: string;
  severity: DriftSeverity;
  message: string;
  driftScore: number; // 0–1 normalised ECE
  confidenceBias: number; // positive = over-confident, negative = under-confident
  detectedAt: string;
  recommendedAction: 'monitor' | 'recalibrate' | 'retrain' | 'escalate';
}

export interface CalibrationReport {
  agentId: string;
  domain?: string;
  windowSizeRuns: number;
  buckets: CalibrationBucket[];
  expectedCalibrationError: number; // ECE — weighted mean |confidence - accuracy|
  confidenceBias: number;
  driftScore: number; // 0–1 — same as ECE normalised
  driftSeverity: DriftSeverity;
  successRate: number;
  meanStatedConfidence: number;
  alert: DriftAlert | null;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUCKET_EDGES = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.01];

const DRIFT_THRESHOLDS: Record<DriftSeverity, number> = {
  none: 0,
  minor: 0.07,
  moderate: 0.15,
  severe: 0.25,
};

// ---------------------------------------------------------------------------
// Core computation
// ---------------------------------------------------------------------------

function outcomeToNumeric(outcome: PerformanceRecord['outcome']): number {
  switch (outcome) {
    case 'success':
      return 1;
    case 'partial':
      return 0.5;
    case 'failure':
      return 0;
  }
}

/**
 * Compute calibration buckets from a set of performance records that have
 * both a stated confidence (confidenceBefore) and an observed outcome.
 */
function computeBuckets(records: PerformanceRecord[]): CalibrationBucket[] {
  const buckets: CalibrationBucket[] = [];

  for (let i = 0; i < BUCKET_EDGES.length - 1; i++) {
    const low = BUCKET_EDGES[i]!;
    const high = BUCKET_EDGES[i + 1]!;

    const inBucket = records.filter(
      (r) =>
        r.confidenceBefore !== undefined &&
        r.confidenceBefore >= low &&
        r.confidenceBefore < high,
    );

    if (inBucket.length === 0) continue;

    const meanConf =
      inBucket.reduce((sum, r) => sum + (r.confidenceBefore ?? 0.5), 0) / inBucket.length;
    const observedAcc =
      inBucket.reduce((sum, r) => sum + outcomeToNumeric(r.outcome), 0) / inBucket.length;
    const calibrationError = Math.abs(meanConf - observedAcc);

    buckets.push({
      confidenceLow: low,
      confidenceHigh: high,
      sampleCount: inBucket.length,
      meanConfidence: parseFloat(meanConf.toFixed(4)),
      observedAccuracy: parseFloat(observedAcc.toFixed(4)),
      calibrationError: parseFloat(calibrationError.toFixed(4)),
    });
  }

  return buckets;
}

/**
 * Compute Expected Calibration Error (ECE) — sample-weighted mean
 * of per-bucket calibration errors.
 */
function computeECE(buckets: CalibrationBucket[], totalSamples: number): number {
  if (totalSamples === 0) return 0;
  const ece =
    buckets.reduce((sum, b) => sum + (b.sampleCount / totalSamples) * b.calibrationError, 0);
  return parseFloat(ece.toFixed(4));
}

function classifyDriftSeverity(ece: number): DriftSeverity {
  if (ece >= DRIFT_THRESHOLDS.severe) return 'severe';
  if (ece >= DRIFT_THRESHOLDS.moderate) return 'moderate';
  if (ece >= DRIFT_THRESHOLDS.minor) return 'minor';
  return 'none';
}

function recommendAction(severity: DriftSeverity): DriftAlert['recommendedAction'] {
  switch (severity) {
    case 'severe':
      return 'escalate';
    case 'moderate':
      return 'retrain';
    case 'minor':
      return 'recalibrate';
    default:
      return 'monitor';
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyse a set of PerformanceRecords and produce a CalibrationReport.
 *
 * If `minSamples` is not met, a report is still returned but with a note
 * that the sample size is insufficient for reliable drift detection.
 */
export function analyseCalibrationDrift(
  agentId: string,
  records: PerformanceRecord[],
  options: {
    domain?: string;
    minSamples?: number;
    alertThreshold?: DriftSeverity;
  } = {},
): CalibrationReport {
  const { domain, minSamples = 10, alertThreshold = 'minor' } = options;
  const now = new Date().toISOString();

  // Filter to records that have confidenceBefore for bucket analysis
  const calibratedRecords = records.filter((r) => r.confidenceBefore !== undefined);

  const successRate =
    records.length > 0
      ? records.filter((r) => r.outcome === 'success').length / records.length
      : 0;

  const meanStatedConf =
    calibratedRecords.length > 0
      ? calibratedRecords.reduce((s, r) => s + (r.confidenceBefore ?? 0.5), 0) /
        calibratedRecords.length
      : 0.5;

  const buckets = computeBuckets(calibratedRecords);
  const ece = calibratedRecords.length >= minSamples ? computeECE(buckets, calibratedRecords.length) : 0;
  const confidenceBias = parseFloat((meanStatedConf - successRate).toFixed(4));
  const severity = calibratedRecords.length >= minSamples ? classifyDriftSeverity(ece) : 'none';

  const severityRank: Record<DriftSeverity, number> = { none: 0, minor: 1, moderate: 2, severe: 3 };

  let alert: DriftAlert | null = null;
  if (severity !== 'none' && severityRank[severity] >= severityRank[alertThreshold]) {
    const biasDirection = confidenceBias > 0 ? 'over-confident' : 'under-confident';
    alert = {
      agentId,
      domain,
      severity,
      message: `Agent ${agentId} is ${biasDirection} by ${Math.abs(confidenceBias * 100).toFixed(1)}pp. ` +
        `ECE = ${(ece * 100).toFixed(1)}% across ${calibratedRecords.length} calibrated runs.`,
      driftScore: ece,
      confidenceBias,
      detectedAt: now,
      recommendedAction: recommendAction(severity),
    };
  }

  return {
    agentId,
    domain,
    windowSizeRuns: records.length,
    buckets,
    expectedCalibrationError: ece,
    confidenceBias,
    driftScore: ece,
    driftSeverity: severity,
    successRate: parseFloat(successRate.toFixed(4)),
    meanStatedConfidence: parseFloat(meanStatedConf.toFixed(4)),
    alert,
    generatedAt: now,
  };
}

/**
 * Extract calibration drift from a SelfModelState's recent performance history.
 * Convenience wrapper that reads from recentFailures + recentWins.
 */
export function extractDriftFromSelfModel(
  agentId: string,
  state: {
    recentFailures: PerformanceRecord[];
    recentWins: PerformanceRecord[];
    driftScore: number;
    confidenceProfile: { overall: number };
  },
  options: { domain?: string; alertThreshold?: DriftSeverity } = {},
): CalibrationReport {
  const allRecords = [...state.recentWins, ...state.recentFailures];
  return analyseCalibrationDrift(agentId, allRecords, options);
}

/**
 * Check if a drift report warrants surfacing on the operator dashboard.
 * Returns true when the severity meets or exceeds the given threshold.
 */
export function shouldSurfaceDrift(
  report: CalibrationReport,
  threshold: DriftSeverity = 'minor',
): boolean {
  const rank: Record<DriftSeverity, number> = { none: 0, minor: 1, moderate: 2, severe: 3 };
  return rank[report.driftSeverity] >= rank[threshold];
}
