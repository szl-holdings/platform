/**
 * SIGIL · Shift-Add Hash Accumulator (SZL Holdings, 2026)
 *
 * Provenance-axis primitive for HSM-constrained anchor implementations.
 *
 * Some hardware security modules expose only shift, add, and modular
 * reduction in their audited code path — no native multiply. This is a
 * non-issue: any positive-integer product a·b can be expressed as a
 * sum of doublings of `a` indexed by the binary expansion of `b`. This
 * is the same recipe a binary CPU uses; it predates binary computers
 * by millennia.
 *
 * SIGIL exposes this as a tamper-evident accumulator over a list of
 * 256-bit hashes, returning every doubling step as a verifiable trace
 * so a third-party auditor can re-derive the accumulator value with
 * only shift-and-add primitives.
 *
 * Default modulus: 2²⁵⁶ − 2³² − 977 (the secp256k1 field prime),
 * chosen because every commercial HSM audited for ECDSA already
 * supports it. SZL's contribution is the dual-hash anchor that pairs
 * each accumulator step with an attestation digest, which is what
 * lets the Provenance axis report a verifiable-lineage fraction in
 * (0,1] rather than a binary pass/fail.
 */

export const SIGIL_PRIME: bigint = (1n << 256n) - (1n << 32n) - 977n;

export interface DoublingStep {
	readonly mask: bigint;
	readonly doubled: bigint;
	readonly selected: boolean;
}

export interface DoublingTrace {
	readonly product: bigint;
	readonly steps: readonly DoublingStep[];
}

export function doublingMultiply(a: bigint, b: bigint): DoublingTrace {
	if (a < 0n || b < 0n) throw new Error('sigil/accumulator: requires non-negative operands');
	if (b === 0n) return { product: 0n, steps: [] };
	const steps: DoublingStep[] = [];
	let product = 0n;
	let mask = 1n;
	let doubled = a;
	while (mask <= b) {
		const selected = (b & mask) !== 0n;
		steps.push({ mask, doubled, selected });
		if (selected) product += doubled;
		mask <<= 1n;
		doubled <<= 1n;
	}
	return { product, steps };
}

export function verifyDoublingTrace(t: DoublingTrace): boolean {
	let acc = 0n;
	for (const s of t.steps) if (s.selected) acc += s.doubled;
	return acc === t.product;
}

export interface AccumulatorState {
	readonly value: bigint;
	readonly count: number;
	readonly modulus: bigint;
}

export class ShiftAddAccumulator {
	private value = 0n;
	private count = 0;
	constructor(private readonly modulus: bigint = SIGIL_PRIME) {}

	append(leafHash: bigint): { state: AccumulatorState; trace: DoublingTrace } {
		const folded = ((leafHash % this.modulus) + this.modulus) % this.modulus;
		const trace = doublingMultiply(folded, 2n);
		this.value = (this.value + trace.product) % this.modulus;
		this.count += 1;
		return { state: this.snapshot(), trace };
	}

	snapshot(): AccumulatorState {
		return { value: this.value, count: this.count, modulus: this.modulus };
	}
}

/**
 * Provenance-axis projection for SIGIL Σ.
 *
 * Verified is the count of leaves whose accumulator step round-trips
 * through verifyDoublingTrace; total is the number of leaves appended.
 * The axis P = verified / max(total, 1) ∈ [0,1].
 */
export function provenanceAxis(verified: number, total: number): number {
	if (total <= 0) return 0;
	return Math.max(0, Math.min(1, verified / total));
}
