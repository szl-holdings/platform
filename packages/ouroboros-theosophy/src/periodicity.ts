/**
 * Primitive 52 — Periodicity tracker
 *
 * Theosophical Secret Doctrine: cycles recur. Operationalised as a
 * naive autocorrelation peak finder over a sequence of timestamped
 * observations, returning the dominant integer lag and its strength.
 * Used to surface cyclic structure honestly; never used to predict.
 */

export interface PeriodicityReport {
  dominantLag: number;       // 0 if no peak above threshold
  strength: number;          // normalised autocorrelation in [-1, 1]
  threshold: number;
  declared: boolean;         // whether dominantLag > 0 above threshold
}

export function detectPeriod(
  series: number[],
  maxLag = Math.floor(series.length / 2),
  threshold = 0.5,
): PeriodicityReport {
  if (series.length < 4) {
    return { dominantLag: 0, strength: 0, threshold, declared: false };
  }
  const n = series.length;
  const mean = series.reduce((a, b) => a + b, 0) / n;
  const centered = series.map((x) => x - mean);
  const denom = centered.reduce((a, b) => a + b * b, 0);
  if (denom === 0) {
    return { dominantLag: 0, strength: 0, threshold, declared: false };
  }
  let bestLag = 0;
  let bestR = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    let num = 0;
    for (let i = 0; i < n - lag; i++) {
      num += centered[i] * centered[i + lag];
    }
    const r = num / denom;
    if (Math.abs(r) > Math.abs(bestR)) {
      bestR = r;
      bestLag = lag;
    }
  }
  const declared = Math.abs(bestR) >= threshold && bestLag > 0;
  return {
    dominantLag: declared ? bestLag : 0,
    strength: bestR,
    threshold,
    declared,
  };
}
