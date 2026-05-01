/**
 * SIGIL · Exact Rational Weights (SZL Holdings, 2026)
 *
 * Weight inputs to the Σ composition law are expressed as positive
 * proper rationals p/q with integer p,q. We decompose each weight as
 * a finite sum of distinct unit fractions using the greedy algorithm
 * (Fibonacci–Sylvester, 1202 / 1880) so that the weight set is:
 *
 *   - bit-exact reproducible across language runtimes (no float drift)
 *   - inspectable by humans (every weight reads as 1/a₁ + 1/a₂ + …)
 *   - provably summing to one (verified by exact rational addition)
 *
 * The greedy algorithm is well-known and predates this library by
 * eight centuries. What is novel here is the use of exact unit-fraction
 * weight verification at the boundary between the trust-composition
 * law and its callers — a discipline we call "rational gating."
 */

export interface UnitFractionDecomposition {
	readonly numerator: number;
	readonly denominator: number;
	readonly terms: readonly number[];
	readonly exact: boolean;
}

export interface InspectableWeight {
	readonly terms: readonly number[];
	readonly value: number;
}

function gcd(a: number, b: number): number {
	let x = Math.abs(a);
	let y = Math.abs(b);
	while (y !== 0) {
		const t = y;
		y = x % y;
		x = t;
	}
	return x === 0 ? 1 : x;
}

/**
 * Decompose proper positive p/q (0 < p < q) into distinct unit fractions
 * via greedy expansion. Bounded to 64 iterations; for p,q ≤ 10⁴ this
 * terminates in well under a dozen terms.
 */
export function decomposeUnitFraction(p: number, q: number): UnitFractionDecomposition {
	if (!Number.isInteger(p) || !Number.isInteger(q)) {
		throw new Error('decomposeUnitFraction: p and q must be integers');
	}
	if (p <= 0 || q <= 0) {
		throw new Error('decomposeUnitFraction: p and q must be positive');
	}
	if (p >= q) {
		throw new Error('decomposeUnitFraction: requires p < q');
	}
	const terms: number[] = [];
	let np = p;
	let nq = q;
	for (let guard = 0; guard < 64 && np > 0; guard++) {
		const a = Math.ceil(nq / np);
		terms.push(a);
		const newP = a * np - nq;
		const newQ = a * nq;
		if (newP === 0) {
			return { numerator: p, denominator: q, terms, exact: true };
		}
		const g = gcd(newP, newQ);
		np = newP / g;
		nq = newQ / g;
	}
	return { numerator: p, denominator: q, terms, exact: np === 0 };
}

/**
 * Add a list of unit fractions exactly using rational arithmetic.
 * Returns the reduced p/q.
 */
export function sumUnitFractions(terms: readonly number[]): { numerator: number; denominator: number } {
	if (terms.length === 0) return { numerator: 0, denominator: 1 };
	let p = 0;
	let q = 1;
	for (const a of terms) {
		if (!Number.isInteger(a) || a <= 0) {
			throw new Error(`sumUnitFractions: every denominator must be a positive integer (got ${a})`);
		}
		const newP = p * a + q;
		const newQ = q * a;
		const g = gcd(newP, newQ);
		p = newP / g;
		q = newQ / g;
	}
	return { numerator: p, denominator: q };
}

/**
 * Build an inspectable weight from a positive proper p/q.
 */
export function inspectableWeight(p: number, q: number): InspectableWeight {
	const d = decomposeUnitFraction(p, q);
	if (!d.exact) {
		throw new Error(`inspectableWeight: ${p}/${q} did not decompose exactly`);
	}
	return { terms: d.terms, value: p / q };
}

/**
 * Verify a list of inspectable weights sums to exactly 1 using rational
 * arithmetic on the underlying unit-fraction terms (no floating point
 * comparison anywhere).
 */
export function weightsSumToOne(weights: readonly InspectableWeight[]): boolean {
	const allTerms = weights.flatMap(w => [...w.terms]);
	const r = sumUnitFractions(allTerms);
	return r.numerator === r.denominator && r.numerator > 0;
}

export function renderWeight(w: InspectableWeight): string {
	if (w.terms.length === 1) return `1/${w.terms[0]}`;
	return w.terms.map(t => `1/${t}`).join(' + ');
}
