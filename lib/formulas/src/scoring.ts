/**
 * Generic [0,1] scorers used across Sentra, Counsel, Terra.
 *
 * Source: docs/thesis/v10-canonical.md §2.6, §5.2.
 */

/** Proof-closure: fraction of evidence dimensions present. */
export function proofClosureScore(presentDims: number, totalDims: number): number {
  if (totalDims <= 0) return 0;
  const r = presentDims / totalDims;
  if (!Number.isFinite(r)) return 0;
  return Math.max(0, Math.min(1, r));
}

/** Saturating sigmoid scorer, useful for collapsing unbounded inputs to [0,1]. */
export function saturate(x: number, knee = 1): number {
  if (!Number.isFinite(x)) return 0;
  return x / (Math.abs(x) + Math.max(knee, 1e-9));
}

/** Min-max normalisation to [0,1]; returns 0.5 for a degenerate range. */
export function normaliseToUnit(x: number, lo: number, hi: number): number {
  if (!(hi > lo)) return 0.5;
  const v = (x - lo) / (hi - lo);
  return Math.max(0, Math.min(1, v));
}

/**
 * Voyage cost Monte Carlo (Gaussian sampler).
 * Source: docs/thesis/v10-canonical.md §7.3.
 *
 * Samples voyage cost `iterations` times from a Normal(mean, mean·sigmaPct)
 * distribution, clamped at 0, and returns p10/p50/p90/mean. Pure function:
 * accepts an injected RNG so callers can deterministically replay a sample
 * for receipt-replay scenarios.
 */
export interface VoyageMonteCarloInput {
  meanCostUsd: number;
  costStdDevPct?: number;
  iterations?: number;
  rng?: () => number;
}
export interface VoyageMonteCarloResult {
  p10: number;
  p50: number;
  p90: number;
  mean: number;
  iterations: number;
  formulaVersion: 'voyage-mc-v1';
}
export function voyageCostMonteCarlo(input: VoyageMonteCarloInput): VoyageMonteCarloResult {
  const meanCostUsd = Math.max(0, input.meanCostUsd);
  const costStdDevPct = Math.max(0, Math.min(1, input.costStdDevPct ?? 0.18));
  const iterations = Math.max(100, Math.min(20_000, input.iterations ?? 2000));
  const rng = input.rng ?? Math.random;
  const sigma = meanCostUsd * costStdDevPct;

  const samples = new Float64Array(iterations);
  for (let i = 0; i < iterations; i++) {
    // Box–Muller
    const u1 = Math.max(rng(), 1e-9);
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    samples[i] = Math.max(0, meanCostUsd + z * sigma);
  }
  samples.sort();
  const pct = (p: number): number =>
    samples[Math.min(samples.length - 1, Math.floor(p * samples.length))];
  let sum = 0;
  for (let i = 0; i < iterations; i++) sum += samples[i];

  return {
    p10: Math.round(pct(0.1)),
    p50: Math.round(pct(0.5)),
    p90: Math.round(pct(0.9)),
    mean: Math.round(sum / iterations),
    iterations,
    formulaVersion: 'voyage-mc-v1',
  };
}
