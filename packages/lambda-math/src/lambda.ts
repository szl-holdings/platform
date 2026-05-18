import { fractionToNumber, parseEgyptianFraction, type Fraction } from './egyptian.js';

export interface LambdaComponent {
  /** Human-readable label, e.g. "cleanliness", "horizon", or a vertical name. */
  name: string;
  /** Weight as an Egyptian-fraction string (`"1/3"`, `"1/3+1/12"`) or a plain number. */
  weight: string | number;
  /** Score in [0, 1]. */
  score: number;
}

export interface LambdaResult {
  /** Λ = ∏ score_i ^ (w_i / Σ w). Always in [0, 1] given B1. */
  lambda: number;
  /** The normalized weights actually used (Σ = 1). */
  normalizedWeights: number[];
  /** Σ of raw weights as an exact rational. */
  weightSum: Fraction;
  /** Per-component view convenient for receipts. */
  components: Array<{ name: string; weight: number; normalizedWeight: number; score: number }>;
}

/**
 * Canonical Λ-operator.
 *
 * Λ = exp( (1/Σw) · Σ w_i · log(score_i) )
 *
 * with the special-case `Λ = 0` if any score is 0 and its weight > 0.
 * Bounds B1–B4 are enforced; violations throw `Error` (we fail loud,
 * not silent — silent fallbacks are an anti-pattern for trust scores).
 */
export function computeLambda(input: { components: LambdaComponent[] }): LambdaResult {
  if (!input || !Array.isArray(input.components) || input.components.length === 0) {
    throw new Error('lambda-math: at least one component is required');
  }

  // ── Parse weights and validate B1, B2 ──────────────────────────────
  const parsedWeights: Fraction[] = [];
  const weightNums: number[] = [];
  let weightSum: Fraction = { p: 0n, q: 1n };

  for (const c of input.components) {
    if (typeof c.score !== 'number' || !Number.isFinite(c.score)) {
      throw new Error(`lambda-math: component "${c.name}" score is not a finite number`);
    }
    // B1: score ∈ [0, 1]
    if (c.score < 0 || c.score > 1) {
      throw new Error(
        `lambda-math: B1 violation — component "${c.name}" score ${c.score} is outside [0, 1]`,
      );
    }
    const w = parseEgyptianFraction(c.weight);
    // B2: weight ≥ 0
    if (w.p < 0n) {
      throw new Error(
        `lambda-math: B2 violation — component "${c.name}" weight ${String(c.weight)} is negative`,
      );
    }
    parsedWeights.push(w);
    weightNums.push(fractionToNumber(w));
    weightSum = addFraction(weightSum, w);
  }

  // B2: Σ w > 0
  if (weightSum.p === 0n) {
    throw new Error('lambda-math: B2 violation — sum of weights is zero');
  }

  const sumNum = fractionToNumber(weightSum);
  const normalized: number[] = weightNums.map((w) => w / sumNum);

  // ── Compute Λ via log-sum-exp for numerical stability ──────────────
  let zeroShortCircuit = false;
  let logSum = 0;
  for (let i = 0; i < input.components.length; i++) {
    const s = input.components[i]!.score;
    const w = normalized[i]!;
    if (w === 0) continue; // zero-weight component contributes nothing
    if (s === 0) {
      zeroShortCircuit = true;
      break;
    }
    logSum += w * Math.log(s);
  }

  let lambda = zeroShortCircuit ? 0 : Math.exp(logSum);

  // Clamp microscopic floating-point overshoot so B3 holds exactly.
  if (lambda > 1) lambda = 1;
  if (lambda < 0) lambda = 0;

  // ── B3: Λ ∈ [0, 1] ─────────────────────────────────────────────────
  if (!(lambda >= 0 && lambda <= 1)) {
    throw new Error(`lambda-math: B3 violation — Λ=${lambda} is outside [0, 1]`);
  }

  // ── B4: min(scores) ≤ Λ ≤ max(scores) (over positively-weighted) ──
  let minScore = Infinity;
  let maxScore = -Infinity;
  for (let i = 0; i < input.components.length; i++) {
    if (normalized[i]! === 0) continue;
    const s = input.components[i]!.score;
    if (s < minScore) minScore = s;
    if (s > maxScore) maxScore = s;
  }
  // Allow tiny epsilon for floating-point edges.
  const EPS = 1e-12;
  if (lambda < minScore - EPS || lambda > maxScore + EPS) {
    throw new Error(
      `lambda-math: B4 violation — Λ=${lambda} not in [min=${minScore}, max=${maxScore}]`,
    );
  }

  return {
    lambda,
    normalizedWeights: normalized,
    weightSum,
    components: input.components.map((c, i) => ({
      name: c.name,
      weight: weightNums[i]!,
      normalizedWeight: normalized[i]!,
      score: c.score,
    })),
  };
}

function addFraction(a: Fraction, b: Fraction): Fraction {
  const p = a.p * b.q + b.p * a.q;
  const q = a.q * b.q;
  // Reduce
  const g = gcd(p < 0n ? -p : p, q < 0n ? -q : q);
  if (g === 0n) return { p: 0n, q: 1n };
  return { p: p / g, q: q / g };
}

function gcd(a: bigint, b: bigint): bigint {
  let x = a;
  let y = b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}
