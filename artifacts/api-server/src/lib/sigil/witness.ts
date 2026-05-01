/**
 * SIGIL · N-Witness Convergence (SZL Holdings, 2026)
 *
 * Reconciliation primitive for the Convergence axis (C).
 *
 * Given N independent witness views of the same runtime release, where
 * each witness publishes a set of distinct event hashes (leaves), we
 * report the Jaccard-style verdict:
 *
 *   • RECONCILED  ⇔  all witnesses observed the same leaf set
 *   • DIVERGENT   ⇔  any witness disagrees on any leaf
 *   • INSUFFICIENT ⇔  fewer than two witnesses
 *
 * The convergence-axis numeric value is |∩| / |∪| ∈ [0,1] — the
 * Jaccard index (1901, public domain) — yielding a smooth gradient
 * between full agreement and full divergence rather than a binary.
 *
 * SZL's contribution is the explicit min-witness-count gate (default 3
 * for production, 2 acceptable for staging) and the gap-table reporter
 * that names every witness still missing leaves observed elsewhere.
 */

export interface WitnessView {
	readonly id: string;
	readonly leaves: readonly string[];
	readonly source?: string;
}

export type ConvergenceVerdict = 'RECONCILED' | 'DIVERGENT' | 'INSUFFICIENT';

export interface ConvergenceReport {
	readonly verdict: ConvergenceVerdict;
	readonly witnessCount: number;
	readonly unionVolume: number;
	readonly intersectionVolume: number;
	readonly jaccard: number;
	readonly perWitnessVolume: readonly { id: string; volume: number }[];
	readonly maxPairwiseDiff: number;
	readonly gaps: readonly { witnessId: string; missing: number }[];
}

export function reconcile(views: readonly WitnessView[], minWitnesses = 3): ConvergenceReport {
	if (views.length < Math.min(2, minWitnesses)) {
		return {
			verdict: 'INSUFFICIENT',
			witnessCount: views.length,
			unionVolume: 0,
			intersectionVolume: 0,
			jaccard: 0,
			perWitnessVolume: views.map(v => ({ id: v.id, volume: new Set(v.leaves).size })),
			maxPairwiseDiff: 0,
			gaps: [],
		};
	}

	const sets = views.map(v => new Set(v.leaves));
	const perWitnessVolume = sets.map((s, i) => ({ id: views[i].id, volume: s.size }));

	const union = new Set<string>();
	for (const s of sets) for (const leaf of s) union.add(leaf);

	const intersection = new Set<string>(sets[0]);
	for (let i = 1; i < sets.length; i++) {
		for (const leaf of [...intersection]) if (!sets[i].has(leaf)) intersection.delete(leaf);
	}

	let maxPairwiseDiff = 0;
	for (let i = 0; i < sets.length; i++) {
		for (let j = i + 1; j < sets.length; j++) {
			let diff = 0;
			for (const x of sets[i]) if (!sets[j].has(x)) diff++;
			for (const x of sets[j]) if (!sets[i].has(x)) diff++;
			if (diff > maxPairwiseDiff) maxPairwiseDiff = diff;
		}
	}

	const gaps = sets.map((s, i) => ({ witnessId: views[i].id, missing: union.size - s.size }));

	const insufficient = views.length < minWitnesses;
	const jaccard = union.size === 0 ? 1 : intersection.size / union.size;

	let verdict: ConvergenceVerdict;
	if (insufficient) verdict = 'INSUFFICIENT';
	else if (union.size === intersection.size && maxPairwiseDiff === 0) verdict = 'RECONCILED';
	else verdict = 'DIVERGENT';

	return {
		verdict,
		witnessCount: views.length,
		unionVolume: union.size,
		intersectionVolume: intersection.size,
		jaccard,
		perWitnessVolume,
		maxPairwiseDiff,
		gaps,
	};
}

/**
 * Project the convergence report onto the [0,1] axis value used by Σ.
 */
export function convergenceAxis(r: ConvergenceReport): number {
	if (r.verdict === 'INSUFFICIENT') return 0;
	return Math.max(0, Math.min(1, r.jaccard));
}
