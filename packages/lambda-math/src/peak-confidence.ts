/**
 * Peak-confidence formula — composite scalar from a peak's itemised
 * score components, expressed in the platform's notation.
 *
 *   PeakConfidence(p) = clamp01( α·prominence + β·snRatio − γ·shapeResidual )
 *
 * This is the closed-form companion of `@workspace/anomaly-fabric`'s
 * `peak-detector.scoreComponents.composite`, normalised to [0, 1] so
 * it can compose into Λ as a component score. Same lesson as the
 * MsdialWorkbench primitive: components are itemised, not collapsed.
 *
 * Source: docs/research/perception-bio-synthesis-2026.md §3.
 */

export interface PeakConfidenceInput {
  readonly prominence: number;
  readonly snRatio: number;
  readonly shapeResidual: number;
  readonly alpha?: number;
  readonly beta?: number;
  readonly gamma?: number;
  /** Soft-saturation scale; defaults to 10. */
  readonly scale?: number;
}

export function peakConfidence(input: PeakConfidenceInput): number {
  const a = input.alpha ?? 1;
  const b = input.beta ?? 1;
  const g = input.gamma ?? 0.5;
  const s = input.scale ?? 10;
  if (!Number.isFinite(input.prominence) || !Number.isFinite(input.snRatio) || !Number.isFinite(input.shapeResidual)) {
    throw new Error('peakConfidence: components must be finite');
  }
  if (input.prominence < 0 || input.snRatio < 0 || input.shapeResidual < 0) {
    throw new Error('peakConfidence: components must be non-negative');
  }
  const raw = a * input.prominence + b * input.snRatio - g * input.shapeResidual;
  // Logistic squash → (0, 1).
  return 1 / (1 + Math.exp(-raw / s));
}
