/**
 * Wilson score interval for a binomial proportion.
 *
 * Mirror of `@szl-holdings/sequence-pipeline/wilson-ci` so the formula
 * has a home in the canonical lambda-math kernel alongside the other
 * Λ-adjacent statistics. CRISPResso2 lesson re-expressed: no claim
 * without an interval.
 *
 * Source: docs/research/perception-bio-synthesis-2026.md §2.
 */

const Z = { '0.90': 1.6448536269514722, '0.95': 1.959963984540054, '0.99': 2.5758293035489004 } as const;
export type WilsonConfidenceLevel = keyof typeof Z;

export interface WilsonIntervalResult {
  readonly p: number;
  readonly ciLower: number;
  readonly ciUpper: number;
  readonly level: WilsonConfidenceLevel;
}

export function wilsonInterval(successes: number, trials: number, level: WilsonConfidenceLevel = '0.95'): WilsonIntervalResult {
  if (!Number.isFinite(successes) || !Number.isFinite(trials) || trials < 0 || successes < 0 || successes > trials) {
    throw new Error(`wilsonInterval: invalid inputs successes=${successes} trials=${trials}`);
  }
  if (trials === 0) return { p: 0, ciLower: 0, ciUpper: 1, level };
  const z = Z[level];
  const n = trials;
  const p = successes / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = (p + z2 / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))) / denom;
  return { p, ciLower: Math.max(0, centre - half), ciUpper: Math.min(1, centre + half), level };
}
