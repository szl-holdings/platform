/**
 * Peak-detector → AMI signal adapter.
 *
 * Re-expresses the MsdialWorkbench peak-detector composite
 * (α·prominence + β·snRatio − γ·shape_residual) as a contribution to
 * the AMI v2 noise (N) and drift (D) axes. Brand-drift bursts and
 * recommender anomalies surface as peaks; the gate must respond
 * without overwriting the other signals the gate already weighs.
 *
 * The mapping is intentionally monotone and bounded:
 *
 *   noise   += saturate(sum(composite_i) / capacity)
 *   drift   += saturate(top_composite      / capacity)
 *
 * Both are clamped to [0, 1] at the AMI-formula boundary; this helper
 * returns the raw contribution so the caller can mix it (typically
 * `max(existing, contribution)`) without losing signal it already had.
 */

export interface PeakSignal {
  /** Composite score of this peak (`α·prominence + β·snRatio − γ·shapeResidual`). */
  readonly composite: number;
}

export interface PeakSignalContribution {
  /** Additive noise contribution ∈ [0, 1]. */
  readonly noise: number;
  /** Additive drift contribution ∈ [0, 1]. */
  readonly drift: number;
  /** Highest single composite seen, for surfacing in the AMI rationale. */
  readonly topComposite: number;
  /** Count of peaks considered. */
  readonly peakCount: number;
}

export interface PeakSignalOptions {
  /** Saturation point for `sum(composite)` (default: 4). */
  readonly noiseCapacity?: number;
  /** Saturation point for the top single composite (default: 1.5). */
  readonly driftCapacity?: number;
}

const DEFAULTS: Required<PeakSignalOptions> = {
  noiseCapacity: 4,
  driftCapacity: 1.5,
};

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export function peaksToAmiContribution(
  peaks: readonly PeakSignal[],
  options: PeakSignalOptions = {},
): PeakSignalContribution {
  const opts = { ...DEFAULTS, ...options };
  if (peaks.length === 0) {
    return { noise: 0, drift: 0, topComposite: 0, peakCount: 0 };
  }
  let sum = 0;
  let top = 0;
  for (const p of peaks) {
    const c = Number.isFinite(p.composite) ? Math.max(0, p.composite) : 0;
    sum += c;
    if (c > top) top = c;
  }
  return {
    noise: clamp01(sum / Math.max(1e-9, opts.noiseCapacity)),
    drift: clamp01(top / Math.max(1e-9, opts.driftCapacity)),
    topComposite: top,
    peakCount: peaks.length,
  };
}
