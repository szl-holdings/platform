/**
 * Cluster-history scoring with a built-in monotonicity self-check.
 *
 * The spherepop incentive-compatibility property: if `f(clusterSize)`
 * is non-decreasing in size, the player is incentivised to merge
 * before popping. `score()` asserts this property at runtime on the
 * provided `f`, throwing if a sampled violation is found. Failing
 * loud here is intentional — silent fallback to a non-monotone
 * scoring function defeats the design.
 */

export interface ClusterPopRecord {
  readonly clusterId: string;
  readonly size: number;
  readonly tMs: number;
}

export interface ScoreOptions {
  /** Sample sizes used by the monotonicity self-check. */
  readonly checkSizes?: readonly number[];
}

const DEFAULT_CHECK_SIZES = [1, 2, 3, 5, 8, 13, 21, 34] as const;

export function score(
  history: readonly ClusterPopRecord[],
  f: (size: number) => number,
  options: ScoreOptions = {},
): number {
  const sizes = options.checkSizes ?? DEFAULT_CHECK_SIZES;
  // Self-check: f must be non-decreasing on the sampled lattice.
  let prev = f(sizes[0]!);
  for (let i = 1; i < sizes.length; i++) {
    const v = f(sizes[i]!);
    if (!(v >= prev - 1e-12)) {
      throw new Error(
        `sim-kit/scoring: monotonicity violation — f(${sizes[i - 1]})=${prev} > f(${sizes[i]})=${v}; ` +
          `scoring requires a non-decreasing payoff for incentive-compatibility`,
      );
    }
    prev = v;
  }
  let total = 0;
  for (const r of history) total += f(r.size);
  return total;
}
