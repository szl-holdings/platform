/**
 * Peak-detector council voter (#5516).
 *
 * Wraps `@workspace/anomaly-fabric/peak-detector` (MsdialWorkbench primitive)
 * so it can vote alongside antivenom/temporal/heuristic detectors at the
 * MARBLE Detector Council. Each surviving peak is materialised as a
 * `statistical`-kind Finding whose `score` is the peak's composite
 * (α·prominence + β·snRatio − γ·shapeResidual) clamped to [0,1].
 *
 * Provenance is preserved verbatim in `evidence.scoreComponents` so
 * auditors can re-derive the verdict from the peak.detection.v1 receipt
 * + the council bench.marble.v1 receipt without re-running the detector.
 *
 * The voter is intentionally side-effect-free — it returns a
 * CouncilCandidate[] that the route layer hands to `deliberateAndReceipt`.
 * The peak.detection.v1 receipts are emitted on the perception-bio surface
 * (see `/perception/peak-detector/batch`) and are independently auditable;
 * a council deliberation that includes peak votes references back to those
 * receipts via the finding ids.
 */
import { ReceiptChain } from '@szl-holdings/szl-receipts';
import type { Finding } from '@szl-holdings/sentra-detector-sdk';
import {
  detectPeaks,
  type Peak,
  type PeakDetectorOptions,
  type SurfacePoint,
} from '@workspace/anomaly-fabric/peak-detector';
import type { CouncilCandidate } from '../sentra-detector-council.js';

export const PEAK_VOTER_DETECTOR_ID = 'ts-perception/peak-detector' as const;
export const PEAK_DETECTION_RECEIPT_KIND = 'peak.detection.v1' as const;

const peakChain = new ReceiptChain({
  operatorId: 'sentra/detector/peak-detector-voter',
});

export interface PeakVoterInput {
  /** Correlation key (incident id / asset id / metric name). */
  readonly correlationKey: string;
  /** Surface points: `{ x, intensity }[]`. */
  readonly surface: readonly SurfacePoint[];
  /** Detection thresholds + window. */
  readonly options?: PeakDetectorOptions;
  /** Score floor for a peak to become a Council vote. */
  readonly councilScoreFloor?: number;
  /** Asset(s) the surface belongs to (carried into the Finding). */
  readonly affectedAssets?: readonly string[];
  /** Optional metric name to enrich the Finding title. */
  readonly metricName?: string;
}

export interface PeakVoterOutput {
  readonly peaks: readonly Peak[];
  readonly candidates: readonly CouncilCandidate[];
  /** Selfhash of the per-batch peak.detection.v1 receipt. */
  readonly chainReceiptId: string;
}

/**
 * Map composite score → [0,1] confidence via a soft squash so big
 * prominence numbers don't blow past the Council's score cap.
 *
 *   confidence = composite / (composite + 1)
 *
 * Strictly monotone increasing, 0 → 0, ∞ → 1.
 */
function squash(composite: number): number {
  if (!Number.isFinite(composite) || composite <= 0) return 0;
  return composite / (composite + 1);
}

function severityFor(score: number): Finding['severity'] {
  if (score >= 0.85) return 'critical';
  if (score >= 0.65) return 'high';
  if (score >= 0.4) return 'medium';
  if (score >= 0.2) return 'low';
  return 'info';
}

/**
 * Detect peaks, emit one peak.detection.v1 receipt for the batch, and
 * return a bundle of CouncilCandidates the caller can pipe straight into
 * `deliberateAndReceipt(correlationKey, [...existing, ...peakVotes])`.
 *
 * Pure with respect to the input surface (no mutation); the receipt
 * chain side-effect is internal so callers don't have to thread it.
 */
export async function scorePeaksAndVote(input: PeakVoterInput): Promise<PeakVoterOutput> {
  const floor = input.councilScoreFloor ?? 0.2;
  const peaks = detectPeaks(input.surface, input.options ?? {});
  const now = new Date().toISOString();

  const candidates: CouncilCandidate[] = [];
  for (let i = 0; i < peaks.length; i++) {
    const p = peaks[i]!;
    const confidence = squash(p.scoreComponents.composite);
    if (confidence < floor) continue;
    const sev = severityFor(confidence);
    const finding: Finding = {
      id: `${PEAK_VOTER_DETECTOR_ID}#${input.correlationKey}#${i}`,
      detectorId: PEAK_VOTER_DETECTOR_ID,
      runId: `${input.correlationKey}#${now}`,
      severity: sev,
      score: confidence,
      title: `Peak at ${input.metricName ?? 'x'}=${p.xCenter.toFixed(3)} (score=${confidence.toFixed(2)})`,
      summary: `prominence=${p.prominence.toFixed(3)}, snRatio=${p.snRatio.toFixed(2)}, shapeResidual=${p.scoreComponents.shapeResidual.toFixed(3)}; composite=${p.scoreComponents.composite.toFixed(3)} → confidence=${confidence.toFixed(3)}.`,
      attackTechniques: [],
      affectedAssets: [...(input.affectedAssets ?? [])],
      evidence: {
        peakIndex: p.index,
        xCenter: p.xCenter,
        height: p.height,
        width: p.width,
        prominence: p.prominence,
        snRatio: p.snRatio,
        scoreComponents: p.scoreComponents,
        sourceReceiptKind: PEAK_DETECTION_RECEIPT_KIND,
      },
      recommendedAction: {
        kind: 'investigate',
        detail: `Surface anomaly at ${input.metricName ?? 'x'}=${p.xCenter.toFixed(3)}; cross-reference with contemporaneous detectors before escalating.`,
      },
      emittedAt: now,
      governanceClass: 'advisory',
    };
    candidates.push({ finding, detectorKind: 'statistical' });
  }

  const receipt = await peakChain.append({
    kind: PEAK_DETECTION_RECEIPT_KIND,
    correlationKey: input.correlationKey,
    peakCount: peaks.length,
    candidateCount: candidates.length,
    councilScoreFloor: floor,
    metricName: input.metricName ?? null,
    components: peaks.map((p) => ({
      xCenter: p.xCenter,
      composite: p.scoreComponents.composite,
      prominence: p.prominence,
      snRatio: p.snRatio,
      shapeResidual: p.scoreComponents.shapeResidual,
    })),
    emittedAt: now,
  });

  return { peaks, candidates, chainReceiptId: receipt.selfHash };
}
