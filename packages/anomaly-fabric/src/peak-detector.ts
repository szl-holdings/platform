/**
 * Peak-detection over `(x, intensity)` surfaces.
 *
 * Re-expressed from MsdialWorkbench's LC-MS peak detector
 * (docs/research/perception-bio-synthesis-2026.md §3). Pure numeric;
 * no dataset assumptions. The multi-factor `score` is the source-of-
 * truth for the `peak.detection.v1` receipt class — score *components*
 * are itemised, not just the composite.
 *
 *   score = α · prominence  +  β · snRatio  −  γ · shape_residual
 */

export interface SurfacePoint {
  readonly x: number;
  readonly intensity: number;
}

export interface PeakScoreComponents {
  readonly prominence: number;
  readonly snRatio: number;
  readonly shapeResidual: number;
  readonly alpha: number;
  readonly beta: number;
  readonly gamma: number;
  readonly composite: number;
}

export interface Peak {
  readonly index: number;
  readonly xCenter: number;
  readonly height: number;
  readonly width: number;
  readonly prominence: number;
  readonly snRatio: number;
  readonly scoreComponents: PeakScoreComponents;
}

export interface PeakDetectorOptions {
  /** Minimum prominence to count as a peak. */
  readonly minProminence?: number;
  /** Minimum signal-to-noise ratio. */
  readonly minSnRatio?: number;
  /** Half-window for local-max + noise estimation. */
  readonly halfWindow?: number;
  /** Composite-score weights `(α, β, γ)`. */
  readonly weights?: { readonly alpha: number; readonly beta: number; readonly gamma: number };
}

const DEFAULT_WEIGHTS = { alpha: 1, beta: 1, gamma: 0.5 } as const;

export function detectPeaks(surface: readonly SurfacePoint[], options: PeakDetectorOptions = {}): Peak[] {
  const minProm = options.minProminence ?? 0;
  const minSn = options.minSnRatio ?? 0;
  const hw = options.halfWindow ?? 3;
  const weights = options.weights ?? DEFAULT_WEIGHTS;

  if (surface.length < 2 * hw + 1) return [];

  const peaks: Peak[] = [];
  for (let i = hw; i < surface.length - hw; i++) {
    const here = surface[i]!.intensity;
    let isMax = true;
    for (let k = i - hw; k <= i + hw; k++) {
      if (k === i) continue;
      if (surface[k]!.intensity > here) { isMax = false; break; }
    }
    if (!isMax) continue;

    // Prominence: height above the higher of the two adjacent minima.
    let leftMin = here, rightMin = here;
    for (let k = i - hw; k < i; k++) if (surface[k]!.intensity < leftMin) leftMin = surface[k]!.intensity;
    for (let k = i + 1; k <= i + hw; k++) if (surface[k]!.intensity < rightMin) rightMin = surface[k]!.intensity;
    const prominence = here - Math.max(leftMin, rightMin);
    if (prominence < minProm) continue;

    // Local noise std (excluding the peak sample itself).
    let mean = 0, n = 0;
    for (let k = i - hw; k <= i + hw; k++) if (k !== i) { mean += surface[k]!.intensity; n++; }
    mean /= Math.max(n, 1);
    let variance = 0;
    for (let k = i - hw; k <= i + hw; k++) if (k !== i) variance += (surface[k]!.intensity - mean) ** 2;
    variance /= Math.max(n, 1);
    const noise = Math.sqrt(variance) || 1e-12;
    const snRatio = prominence / noise;
    if (snRatio < minSn) continue;

    // Width at half-max.
    const half = leftMin + prominence / 2;
    let left = i, right = i;
    while (left > 0 && surface[left]!.intensity > half) left--;
    while (right < surface.length - 1 && surface[right]!.intensity > half) right++;
    const width = surface[right]!.x - surface[left]!.x;

    // Shape residual: deviation of the peak triangle from a fitted
    // symmetric Gaussian-ish form. Cheap proxy: |left-arm − right-arm|.
    const leftArm = here - surface[Math.max(0, i - hw)]!.intensity;
    const rightArm = here - surface[Math.min(surface.length - 1, i + hw)]!.intensity;
    const shapeResidual = Math.abs(leftArm - rightArm);

    const composite = weights.alpha * prominence + weights.beta * snRatio - weights.gamma * shapeResidual;

    peaks.push({
      index: i,
      xCenter: surface[i]!.x,
      height: here,
      width,
      prominence,
      snRatio,
      scoreComponents: {
        prominence,
        snRatio,
        shapeResidual,
        alpha: weights.alpha,
        beta: weights.beta,
        gamma: weights.gamma,
        composite,
      },
    });
  }
  return peaks;
}
