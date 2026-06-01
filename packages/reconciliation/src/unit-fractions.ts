/**
 * Unit-Fraction Decomposition — Primitive 13.
 *
 * Source: Rhind Mathematical Papyrus 2/n table (c. 1650 BCE).
 * Egyptian Mathematical Leather Roll (1/n table).
 *
 * Every floating-point ratio in alert thresholds, budget allocations, or
 * rate limits is decomposed into a sum of distinct unit fractions:
 *
 *   p/q = 1/a₁ + 1/a₂ + ... + 1/aₙ
 *
 * Decompositions are exact, deterministic, and inspectable. This eliminates
 * floating-point drift across language runtimes — a quiet bug class in
 * cross-stack governance pipelines.
 *
 * We use the Greedy (Fibonacci-Sylvester) algorithm: at each step,
 *   p/q  →  ⌈q/p⌉  is the next unit-fraction denominator.
 * Always terminates for positive rationals. Bounded above by p in length.
 *
 * Internally the algorithm runs on bigint to avoid the silent corruption
 * that JS `number` arithmetic introduces once intermediate products exceed
 * `Number.MAX_SAFE_INTEGER`. Inputs are still typed as `number` for the
 * call site ergonomics, but we cap them at MAX_DENOMINATOR for safety.
 */

export interface UnitFractionDecomposition {
  readonly numerator: number;
  readonly denominator: number;
  readonly terms: readonly number[];
  readonly exact: boolean;
}

/**
 * Maximum denominator we will accept. Above this size the greedy algorithm
 * may legitimately produce intermediate denominators that exceed
 * `Number.MAX_SAFE_INTEGER`, making the resulting `terms[]` (which is
 * `number[]`) lossy. We refuse rather than silently corrupt.
 */
export const MAX_DENOMINATOR = 1_000_000;

/**
 * Decompose a positive rational p/q into distinct unit fractions.
 * Both arguments must be positive integers and p < q.
 */
export function decomposeUnitFraction(p: number, q: number): UnitFractionDecomposition {
  if (!Number.isInteger(p) || !Number.isInteger(q)) {
    throw new Error("decomposeUnitFraction: p and q must be integers");
  }
  if (p <= 0 || q <= 0) {
    throw new Error("decomposeUnitFraction: p and q must be positive");
  }
  if (p >= q) {
    throw new Error("decomposeUnitFraction: requires p < q (proper fraction)");
  }
  if (q > MAX_DENOMINATOR) {
    throw new Error(
      `decomposeUnitFraction: q exceeds MAX_DENOMINATOR (${MAX_DENOMINATOR}); ` +
        "intermediate values would exceed Number.MAX_SAFE_INTEGER",
    );
  }

  const terms: number[] = [];
  let np = BigInt(p);
  let nq = BigInt(q);
  // Bound the loop generously; Sylvester decomposition can grow super-
  // exponentially but for q ≤ MAX_DENOMINATOR (1e6) terminates well
  // below 64 iterations in practice.
  for (let guard = 0; guard < 64 && np > 0n; guard++) {
    // a = ⌈nq / np⌉
    const a = (nq + np - 1n) / np;
    if (a > BigInt(Number.MAX_SAFE_INTEGER)) {
      // The next term would be lossy if we coerced to `number`.
      return { numerator: p, denominator: q, terms, exact: false };
    }
    terms.push(Number(a));
    // Update: p/q − 1/a = (a·p − q) / (a·q)
    const newP = a * np - nq;
    const newQ = a * nq;
    if (newP === 0n) {
      return { numerator: p, denominator: q, terms, exact: true };
    }
    const g = gcdBig(newP, newQ);
    np = newP / g;
    nq = newQ / g;
  }
  return { numerator: p, denominator: q, terms, exact: np === 0n };
}

function gcdBig(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

/**
 * Inspect an alert threshold. A threshold is auditable iff it can be
 * expressed as a sum of at most maxTerms (default 4) distinct unit
 * fractions. The Rhind 2/n table proves this is achievable for all
 * fractions of form 2/n with odd n ∈ [3, 101].
 */
export function thresholdInspectable(
  p: number,
  q: number,
  maxTerms = 4
): { inspectable: boolean; decomposition: UnitFractionDecomposition } {
  const d = decomposeUnitFraction(p, q);
  return { inspectable: d.exact && d.terms.length <= maxTerms, decomposition: d };
}

/**
 * Reconstruct a unit-fraction sum back to its rational p/q form.
 * Used to verify a decomposition round-trips exactly.
 */
export function reconstructFraction(
  terms: readonly number[]
): { numerator: number; denominator: number } {
  if (terms.length === 0) return { numerator: 0, denominator: 1 };
  let p = 0n;
  let q = 1n;
  for (const a of terms) {
    if (!Number.isInteger(a) || a <= 0) {
      throw new Error("reconstructFraction: every term must be a positive integer");
    }
    const ab = BigInt(a);
    // p/q + 1/a = (p·a + q) / (q·a)
    const newP = p * ab + q;
    const newQ = q * ab;
    const g = gcdBig(newP, newQ);
    p = newP / g;
    q = newQ / g;
  }
  if (p > BigInt(Number.MAX_SAFE_INTEGER) || q > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("reconstructFraction: result exceeds Number.MAX_SAFE_INTEGER");
  }
  return { numerator: Number(p), denominator: Number(q) };
}
