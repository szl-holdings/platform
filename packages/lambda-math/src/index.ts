/**
 * @szl-holdings/lambda-math — canonical Λ-operator.
 *
 * `computeLambda` is the weighted geometric mean
 *
 *     Λ = ∏ score_i ^ (w_i / Σ w)
 *
 * over `components: [{ name, weight, score }]`. Weights accept
 * Egyptian-fraction strings (`"1/3"`, `"1/3+1/12"`) or plain numbers.
 *
 * Bounds (all enforced at runtime):
 *   B1: every score must be in [0, 1]              — input bound
 *   B2: every weight must be ≥ 0, Σ w > 0          — input bound
 *   B3: result Λ in [0, 1]                          — output bound
 *   B4: min(scores)  ≤  Λ  ≤  max(scores)          — sandwich bound
 *
 * This module is a TS mirror of the upstream Lean source of truth.
 * Lean stays the formal proof; this file is what production runtimes
 * actually call.
 */

export { computeLambda, type LambdaComponent, type LambdaResult } from './lambda.js';
export {
  parseEgyptianFraction,
  fractionToNumber,
  canonicalizeEgyptian,
  type Fraction,
} from './egyptian.js';
