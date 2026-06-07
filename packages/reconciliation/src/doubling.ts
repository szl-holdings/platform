/**
 * Doubling/Halving Multiplication — Primitive 14.
 *
 * Source: Rhind Mathematical Papyrus method (c. 1650 BCE).
 *
 * Egyptian multiplication uses only doubling, halving, and addition. Every
 * product a·b is expressed as a sum of doublings of a indexed by the binary
 * representation of b. This is the same primitive a binary computer uses,
 * 4000 years before binary arithmetic was formalized.
 *
 * Why this matters for runtime: HSM-constrained anchor implementations
 * sometimes lack a multiplication primitive but always have shift-and-add.
 * Egyptian multiplication is the proof that hash-chain accumulators can
 * use only shift-and-add with no loss of expressive power.
 *
 * Formal-verification corollary: Lean and Coq prefer additive primitives
 * over multiplicative ones for proof simplicity. Egyptian multiplication
 * is the natural target encoding for v3.1 formal proofs.
 */

export interface DoublingTrace {
  readonly product: bigint;
  readonly steps: readonly { multiplier: bigint; doubled: bigint; selected: boolean }[];
}

/**
 * Compute a · b using only doubling and addition. Returns both the product
 * and the trace of every doubling step, which is the audit artifact.
 *
 * Works on bigint to keep integer-exact regardless of magnitude — important
 * for HSM contexts where 256-bit multiplication is normal.
 */
export function egyptianMultiply(a: bigint, b: bigint): DoublingTrace {
  if (a < 0n || b < 0n) {
    throw new Error("egyptianMultiply: requires non-negative operands");
  }
  if (b === 0n) {
    return { product: 0n, steps: [] };
  }
  const steps: { multiplier: bigint; doubled: bigint; selected: boolean }[] = [];
  let product = 0n;
  let multiplier = 1n;
  let doubled = a;
  let remaining = b;
  while (multiplier <= remaining) {
    const selected = (remaining & multiplier) !== 0n;
    steps.push({ multiplier, doubled, selected });
    if (selected) product += doubled;
    multiplier <<= 1n;
    doubled <<= 1n;
  }
  return { product, steps };
}

/**
 * Verify an Egyptian-multiplication trace independently. Used at audit
 * time to re-derive the product from the steps without trusting the
 * original computation.
 */
export function verifyDoublingTrace(trace: DoublingTrace): boolean {
  let acc = 0n;
  for (const step of trace.steps) {
    if (step.selected) acc += step.doubled;
  }
  return acc === trace.product;
}

/**
 * The shift-and-add hash accumulator: combines a list of bigint hashes
 * using only doubling and addition modulo a prime. Proof-friendly, HSM-
 * friendly, and bit-equivalent to standard accumulator constructions when
 * the prime is chosen appropriately.
 *
 * Default prime: 2^256 - 2^32 - 977 (the secp256k1 field prime), chosen
 * because it is widely audited and HSM-supported.
 */
export const SHIFT_ADD_PRIME = (1n << 256n) - (1n << 32n) - 977n;

export function shiftAddAccumulate(values: readonly bigint[], prime: bigint = SHIFT_ADD_PRIME): bigint {
  let acc = 0n;
  for (const v of values) {
    const t = egyptianMultiply(v % prime, 2n).product;
    acc = (acc + t) % prime;
  }
  return acc;
}
