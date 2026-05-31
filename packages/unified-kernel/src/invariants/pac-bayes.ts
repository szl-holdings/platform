/**
 * invariants/pac-bayes.ts — PAC-Bayes tail bound primitive used by the
 * Λ-axis audit-closure operator (Λ_audit_closure) as the confidence-margin
 * tail bound.
 *
 * This is the McAllester (2003) PAC-Bayes bound on the confidence margin:
 *
 *   margin ≤ KL(posterior ‖ prior) + ln( (2 √n) / δ )  all over  2n,
 *   then take the square root:
 *
 *     pacBayesTailBound = sqrt( ( KL + ln(2√n / δ) ) / (2n) )
 *
 * This returns the *tail* term (the additive penalty over the empirical risk),
 * NOT a full generalization guarantee — the underlying sub-Gaussian MGF
 * concentration inequality is an undischarged AXIOM in the Lean layer
 * (Lutar/PACBayes/PACBayes.lean::MomentSubGaussian). It is a real numeric
 * formula, returned as a statistical estimate, not a proof (Doctrine v7 §2).
 *
 * Citation: McAllester, D. (2003). "PAC-Bayesian Stochastic Model Selection."
 *   Machine Learning 51, 5–21. DOI 10.1023/A:1021840411064.
 *   (Catoni form: Catoni 2007, IMS Lecture Notes 56.)
 *
 * Author: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> (ORCID 0009-0001-0110-4173)
 */

/**
 * pacBayesTailBound — the McAllester (2003) PAC-Bayes tail term on the
 * confidence margin.
 *
 *   sqrt( ( KL(posterior ‖ prior) + ln(2√n / δ) ) / (2n) )
 *
 * @param prior      a discrete prior distribution (probabilities, summing to ~1)
 * @param posterior  a discrete posterior over the same support
 * @param sampleSize n > 0, the number of i.i.d. samples
 * @param delta      confidence parameter δ ∈ (0,1)
 * @returns          the additive tail penalty in [0, ∞) (NOT clamped to 1; this
 *                   is the penalty term, not the full risk bound)
 */
export function pacBayesTailBound(
  prior: readonly number[],
  posterior: readonly number[],
  sampleSize: number,
  delta: number,
): number {
  if (prior.length !== posterior.length || prior.length === 0) {
    throw new Error("pacBayesTailBound: prior and posterior must be non-empty and same length");
  }
  if (sampleSize <= 0) throw new Error("pacBayesTailBound: sampleSize must be positive");
  if (delta <= 0 || delta >= 1) throw new Error("pacBayesTailBound: delta must be in (0,1)");

  const kl = klDivergence(posterior, prior);
  const complexity = (kl + Math.log((2 * Math.sqrt(sampleSize)) / delta)) / (2 * sampleSize);
  return Math.sqrt(Math.max(0, complexity));
}

/**
 * klDivergence — KL(p ‖ q) = Σ pᵢ ln(pᵢ / qᵢ), in nats. Real computation;
 * terms with pᵢ = 0 contribute 0 (0·ln0 := 0). Throws if any qᵢ = 0 where
 * pᵢ > 0 (KL is +∞ — refuse rather than emit Infinity silently).
 */
export function klDivergence(p: readonly number[], q: readonly number[]): number {
  if (p.length !== q.length) throw new Error("klDivergence: length mismatch");
  let kl = 0;
  for (let i = 0; i < p.length; i += 1) {
    if (p[i] < 0 || q[i] < 0) throw new Error("klDivergence: probabilities must be non-negative");
    if (p[i] === 0) continue;
    if (q[i] === 0) throw new Error("klDivergence: q has zero mass where p is positive (KL = ∞)");
    kl += p[i] * Math.log(p[i] / q[i]);
  }
  return kl;
}
