# LAMBDA_AXIOM_DEFENSE.md — Deepened Philosophical Defense of Λ-Uniqueness

**Author:** PhD Team B — Philosophers (philosophy of mathematics, formal epistemology, decision theory, measurement theory, philosophy of science) + decision theorists  
**Date:** 2026-06-06  
**Status:** Builds on and deepens `PHILOSOPHY_FOUNDATIONS.md`. Intended audience: hostile philosophy-of-math referee, regulator's technical advisor, senior skeptical investor.  
**Scope:** (1) Deepened per-axiom justification table with governance reading, independent motivation, and citations. (2) Best/weakest new axiom candidate for Team A. (3) Full steelman-and-rebut for four major objections. (4) Conjecture-1 epistemology defense. (5) Regulator acceptance argument + honest caveat.

---

## LOAD-BEARING GROUND TRUTH (never overstated, never papered over)

- **Λ = equal-weight geometric mean** \(\Lambda_k(x) = \bigl(\prod_{i=1}^{k} x_i\bigr)^{1/k}\). The Lutar invariant trust aggregator.  
- **Unconditional Λ-uniqueness under {A1–A5} is machine-checked FALSE.** Counterexample (`maxAgg_ne_Lambda`) is sorry-free and CI-green. Max-aggregation satisfies A1–A5 and differs from Λ. This is a proven fact; it is not argued away here.  
- **Conditional uniqueness under {A1–A5} + A6'_block_consistent IS proven** (CI-green, Lean kernel-checked, axiom disclosed in every `#print axioms`). Theorem: `lambda_unique_under_block`.  
- **Λ remains Conjecture 1 unconditionally.** No artifact upgrades it to a theorem.  
- These distinctions are not a weakness to conceal; they are the skeleton of the honest case.

---

## 1. DEEPENED PER-AXIOM JUSTIFICATION TABLE

This section provides a richer, source-backed justification for each candidate axiom than appeared in `PHILOSOPHY_FOUNDATIONS.md`. For each axiom the table asks: *Could a regulator/auditor endorse this independently, before anyone mentions the geometric mean?* An axiom passes only if the answer is yes.

### 1.0 Preliminary: The measurement-theoretic frame

Before evaluating any specific axiom, we need the background that motivates the whole project. Trust sub-scores are most naturally **ratio-scale** quantities: "twice as trustworthy" is meaningful in a way that "20 degrees warmer" is not, because trust has a natural zero (total absence of conformance) and a natural unit (the conformance baseline). [Stevens (1946)](https://en.wikipedia.org/wiki/Level_of_measurement) established that the appropriate central tendency for ratio-scale data is the **geometric mean**, not the arithmetic mean — a point underlined by [Rasch measurement analysis](https://www.rasch.org/rmt/rmt111n.htm): "to obtain the 'average' of a set of ratio numbers, … the arithmetic mean of their logarithms is computed and then exponentiated to yield the geometric mean."

Measurement theory's *meaningfulness* requirement — [Narens (2002), *A Meaningful Justification for the Representational Theory of Measurement*, J. Math. Psychology 46:746–768, doi:10.1006/jmps.2002.1428](https://www.sciencedirect.com/science/article/pii/S0022249602914288) — demands that statements about measured quantities be **invariant under the admissible transformations of the scale type**. For ratio scales the admissible transformation is \(x \mapsto rx\) for \(r > 0\) (change of unit). The geometric mean is covariant: \(\Lambda(rx_1, \ldots, rx_k) = r \cdot \Lambda(x_1, \ldots, x_k)\). The arithmetic mean is not: it is covariant only up to an additive shift, which is not a ratio-scale transformation. This is the measurement-theoretic *reason* Λ is the right aggregator for ratio-scale trust — before any uniqueness theorem is needed. [Narens (1981), *On the scales of measurement*, J. Math. Psychology 24:249–275](https://sites.socsci.uci.edu/~johnsonk/CLASSES/MeasurementTheory/Narens1981b.OnTheScalesOfMeasurement.pdf) formalized ratio scalability as 1-point homogeneity + 1-point uniqueness; Lutar's homogeneity axiom A2 instantiates exactly that 1-point homogeneity condition.

The measurement-theoretic *meaningfulness* frame also underlies the aggregation-invariance axiom, as argued by [Marichal and Mesiar, *Meaningful aggregation functions mapping ordinal scales into an ordinal scale*, orbilu.uni.lu](https://orbilu.uni.lu/bitstream/10993/9455/4/B-MeaningfulAggregationFunctions.pdf): Luce's "principle of theory construction" requires that admissible transformations of inputs yield an admissible transformation of the output — which is precisely what aggregation-invariance demands when the "admissible transformation" is re-partitioning the evidence.

[Krantz, Luce, Suppes, Tversky, *Foundations of Measurement* Vol. I (1971), Vol. II–III (1989/1990)](https://philpapers.org/rec/KRAFOM); [Suppes, *Representational Measurement Theory*, Stanford corpus](https://suppescorpus.stanford.edu/sites/g/files/sbiybj32751/files/media/file/representational_measurement_theory_382.pdf) is the canonical statement: a numerical representation is uniquely justified only *up to its scale type*, and meaningful aggregation must respect that scale type's admissible transformations.

---

### 1.1 Axiom Justification Table

| # | Axiom / Route | Formal Statement | Governance Reading | Independent Motivation (before mentioning Λ) | Question-begging? | Strength (relative to QAM family) | Key Citations |
|---|---|---|---|---|---|---|---|
| **A6′** | **Block-consistency / Aggregation-invariance** (Csató 2018) | If a partition \(\{B_1, \ldots, B_m\}\) of evidence blocks is unanimously agreed, combining block geometric means via the overall geometric mean equals aggregating the full collection: \(\Lambda(\Lambda(B_1), \ldots, \Lambda(B_m)) = \Lambda(\text{all elements})\). | "The trust verdict must not depend on how the auditor partitions the evidence into review blocks." Partition is bookkeeping, not substance. | **Process-invariance** is a universal governance norm: an audit whose result depends on how the auditor draws departmental boundaries is *manipulable by the choice of partition* — the auditor can game the score by redrawing org-chart lines. Demanding invariance under that choice is *prior* to and independent of any statistical model of trust. | **Lowest** — phrased entirely in terms of the audit *process*; geometric mean falls out as a theorem, not assumed. No reference to means or exponents. | Weakest sufficient in this table; yet strictly sufficient with A1–A5. | [Csató 2018, GDN 27:1011–1027, doi:10.1007/s10726-018-9589-3](https://doi.org/10.1007/s10726-018-9589-3); [arXiv:1706.07256](https://arxiv.org/abs/1706.07256); [PDF](https://real.mtak.hu/162433/1/1706.07256.pdf) |
| **R+H** | **Reciprocity + Positive Homogeneity** (Aczél–Saaty 1983) | (R) If all pairwise judgments are inverted, the aggregate is inverted: \(\Lambda(1/x_1, \ldots, 1/x_k) = 1/\Lambda(x_1, \ldots, x_k)\). (H) Positive homogeneity: \(\Lambda(rx_1, \ldots, rx_k) = r\Lambda(x_1, \ldots, x_k)\) for \(r > 0\). | "If everyone scales trust by \(t\), the verdict scales by \(t\)." (H) — already Lutar's A2. "Inverse comparisons stay inverse." (R) — coherence of ratio-scale measurement. | **Ratio-scale coherence**: on a ratio scale, inverting the measurement unit (e.g., flipping who is the numeraire) should invert the verdict. That is a *measurement constraint*, not a preference about Λ. Homogeneity = A2 is already in the system; the new commitment is **reciprocity alone**. [Aczél & Saaty (1983)](https://doi.org/10.1016/0022-2496(83)90028-7) show the geometric mean is the *unique* quasi-arithmetic mean satisfying both; [ISAHP exposition confirms](http://www.isahp.org/uploads/383-aggregating.pdf): "the geometric mean is the only reasonable aggregation procedure … the unique quasiarithmetic mean satisfying reciprocity and positive homogeneity." Proven also in [Seri et al., Journal of Multi-Criteria Decision Analysis](https://rseri.me/publication/j013/J013.pdf): WGM is the only aggregation method preserving reciprocal structure *and* satisfying Pareto and homogeneity simultaneously. | Low — reciprocity is a scale coherence condition, not a claim about means. | Requires two conditions (H already in A1–A5; only R is new). Sufficient for ratio-scale domain. | [Aczél & Saaty (1983), J. Math. Psychology 27:93–102, doi:10.1016/0022-2496(83)90028-7](https://doi.org/10.1016/0022-2496(83)90028-7) |
| **Bis** | **Bisymmetry** (Aczél 1948; Burai–Kiss–Szokol 2021; Kiss–Shulman 2026) | \(F(F(x,y),F(u,v)) = F(F(x,u),F(y,v))\): row/column interchange commutes. | "Evaluating two sub-panels then combining = combining cross-ways then evaluating." Order of aggregation within and across sub-groups is irrelevant. | **Structural symmetry**: a governance body that aggregates in one order vs. another should reach the same verdict; absence of bisymmetry means the *internal structure of deliberation* (not just its output) changes the result. This is a panel-consistency requirement. | **Moderate** — bisymmetry is near-equivalent to the quasi-arithmetic factorization; hostile critics can argue it nearly assumes the answer (see §3, Objection 1). Superseded in-tree by A6' precisely to widen the premise-conclusion gap. | Strong: sufficient alone (with symmetry + reflexivity + partial strict monotonicity) to force continuity and quasi-arithmetic structure, per Kiss–Shulman 2026. | [Aczél (1948), Bull. AMS 54:392–400](https://eudml.org/doc/296298); [Burai–Kiss–Szokol (2021), Acta Math. Hung. 165:474–485](https://arxiv.org/pdf/2107.07391); [Kiss–Shulman (2026), arXiv:2606.05221](https://arxiv.org/abs/2606.05221) |
| **Rep** | **Replacement / Decomposability** (Kolmogorov–Nagumo–de Finetti 1930) | A sub-block can be replaced by its own mean without changing the whole: \(M_k(x_1,\ldots,x_k) = m \Rightarrow M_n(x_1,\ldots,x_k,x_{k+1},\ldots,x_n) = M_n(m,\ldots,m,x_{k+1},\ldots,x_n)\). | "Auditing a department in isolation and then inserting its score does not change the org verdict." | **Audit-consolidation norm**: a multi-stage audit that summarizes a department's score and then aggregates that summary with others should agree with a flat audit of all evidence. This is basic *compositionality of review*. | Low to moderate — the norm is natural, but it requires continuity + monotonicity as companions to force quasi-arithmetic structure; without those companions the axiom is weaker but also less clean. | Sufficient *jointly with* symmetry, fixed-point, monotonicity, continuity (Kolmogorov's theorem, [Wikipedia: Quasi-arithmetic mean](https://en.wikipedia.org/wiki/Quasi-arithmetic_mean)). | [Quasi-arithmetic mean, Wikipedia — Kolmogorov 1930 characterization](https://en.wikipedia.org/wiki/Quasi-arithmetic_mean); [Marichal, *On an axiomatization of the quasi-arithmetic mean*, orbilu.uni.lu](https://orbilu.uni.lu/bitstream/10993/9469/2/OnAnAxiomatizationOfTheQuasi.pdf) |
| **SD** | **Strong Decomposability** (Marichal–Roubens 2000; generalizing Kolmogorov) | As Replacement, but for *any subset* (not just consecutive elements), without requiring symmetry: for any \(K \subseteq \{1,\ldots,n\}\), if the partial mean over \(K\) equals \(x\), then substituting all elements of \(K\) by \(x\) leaves the whole mean unchanged. | Same as Replacement but auditor-partition-independent: the departmental structure is not privileged. Works even when sub-scores are labeled (non-symmetric aggregator). | Strictly stronger than Replacement in the non-symmetric case, but becomes equivalent under symmetry. In-tree, symmetry (A4) is present, so SD = Rep under A4. For future non-symmetric Lutar variants, SD is the right generalization. | Low. | Sufficient (with continuity, strict monotonicity, reflexivity) to force quasi-arithmetic structure even without symmetry. | [Marichal, *On an axiomatization of the quasi-arithmetic mean*, orbilu.uni.lu](https://orbilu.uni.lu/bitstream/10993/9469/2/OnAnAxiomatizationOfTheQuasi.pdf) |

**Homogeneity + quasi-arithmetic → geometric mean.** The final step in all routes above is the key *selection* move: among all quasi-arithmetic means, which is the right one for ratio-scale trust? The answer comes from [Hardy, Littlewood, Pólya (1952), *Inequalities*, Cambridge UP, p. 68](https://books.google.com/books/about/Inequalities.html?id=t1RCSP8YKt8C): *the only homogeneous quasi-arithmetic means are the power means.* Among the power means, positive homogeneity \(\Lambda(rx) = r\Lambda(x)\) picks the exponent-1 power mean, which is the geometric mean (exponent 0 in the power-mean parameterization \(M_p = (\frac{1}{n}\sum x_i^p)^{1/p}\), with \(M_0 = \lim_{p\to 0} M_p = \Lambda\)). Since A2 (homogeneity) is already in Lutar's axiom set, any route that pins quasi-arithmetic structure together with A2 *automatically* selects the geometric mean. This is the algebraic skeleton common to all five routes above.

---

## 2. THE BEST/WEAKEST NEW AXIOM CANDIDATE — For Team A as a Proof Target

### 2.1 The 2026 Kiss–Shulman Result and What It Gives

**Key result** ([Kiss & Shulman (2026), *N-ary quasi-arithmetic means and families without regularity*, arXiv:2606.05221](https://arxiv.org/abs/2606.05221)):

> **Theorem 1.1 (Main theorem).** Let \(I\) be a non-degenerate real interval, let \(n \geq 2\), and let \(F: I^n \to I\) be **reflexive, symmetric, bisymmetric, and partially strictly increasing**. Then there exist a non-degenerate interval \(J\) and a **continuous strictly monotone bijection** \(\varphi: I \to J\) such that
> \[F(x_1, \ldots, x_n) = \varphi^{-1}\!\left(\frac{\varphi(x_1) + \cdots + \varphi(x_n)}{n}\right).\]
> In particular, \(F\) is continuous.

**What is new**: prior bisymmetry characterizations required continuity as a *hypothesis*. Kiss–Shulman (2026) show continuity follows *automatically* from reflexivity + symmetry + bisymmetry + partial strict monotonicity. The paper also delivers the regularity-free Kolmogorov–Nagumo–de Finetti theorem. The open problem they state: **whether symmetry can be omitted** (i.e., whether reflexivity + bisymmetry + partial strict monotonicity alone force continuity and quasi-arithmetic structure).

**Predecessor**: [Burai, Kiss, Szokol (2021), *Characterization of quasi-arithmetic means without regularity condition*, Acta Math. Hung. 165:474–485](https://arxiv.org/pdf/2107.07391) proved the binary case: every bisymmetric, symmetric, reflexive, strictly monotonic *binary* map on a proper interval is continuous and quasi-arithmetic. The 2026 paper extends this to arbitrary \(n\).

### 2.2 The Best/Weakest Axiom Candidate: **Regularity-Free Aggregation-Invariance**

Building on Kiss–Shulman 2026 and the Marichal–Roubens strong-decomposability framework, we propose the following **weakest candidate** for Team A:

---

**CANDIDATE AXIOM A6″ (Regularity-Free Block-Consistency):**

*Let \(\mathcal{A}: \bigcup_{n \geq 1} (0,\infty)^n \to (0,\infty)\) be a family of aggregators — one for each arity — satisfying A1 (normalization / fixed-point), A2 (positive homogeneity), A3 (monotonicity), A4 (symmetry).*

*Axiom A6″ states: for all \(n, m \geq 1\) and all \(x_{11}, \ldots, x_{mn_m} \in (0,\infty)\) with \(\sum_{j=1}^{m} n_j = n\),*

\[
\mathcal{A}_n(x_{11}, \ldots, x_{mn_m}) = \mathcal{A}_m\bigl(\mathcal{A}_{n_1}(x_{11},\ldots,x_{1n_1}),\; \ldots,\; \mathcal{A}_{n_m}(x_{m1},\ldots,x_{mn_m})\bigr).
\]

*No continuity assumption is made on \(\mathcal{A}\).*

---

**Why this is weaker and more defensible than the existing A6'_block_consistent:**

1. **Continuity-free**: the existing Lean formulation of A6' presumably inherits continuity (or uses it tacitly) from the standard quasi-arithmetic machinery. A6″ does not assume continuity; it follows from the combination of A6″ with A1–A4 by the regularity-free theorem of Kiss–Shulman (2026). This makes the antecedent *formally weaker* (fewer conditions) while delivering the same geometric-mean conclusion.

2. **Governance language preserved**: A6″ is still "the trust verdict must not depend on how the auditor partitions the evidence," the same partition-independence narrative. Weakness is a mathematical property of the premise; the governance interpretation is unchanged.

3. **Precise enough to formalize in Lean**: A6″ is a universally quantified functional equation on the family \((\mathcal{A}_n)_{n \geq 1}\). Given Lutar's A1–A4, this family is a compatible family of strictly increasing symmetric means on \((0,\infty)\). Kiss–Shulman's Theorem 1.2 (the regularity-free KNdF theorem) then forces each \(\mathcal{A}_n\) to be quasi-arithmetic with the same generator \(\varphi\). Combined with A2 (homogeneity), which forces \(\varphi = \log\) (the only generator yielding a homogeneous quasi-arithmetic mean, by [Hardy–Littlewood–Pólya (1952), p. 68](https://books.google.com/books/about/Inequalities.html?id=t1RCSP8YKt8C)), this delivers \(\mathcal{A}_n = \Lambda_n\) for all \(n\).

**Proof sketch for Team A:**

1. From A1, A3, A4, A6″: \(\mathcal{A}\) is a compatible family of reflexive, symmetric, strictly increasing means satisfying A6″ (= the replacement property without continuity).  
2. By Kiss–Shulman (2026), Theorem 1.2: \(\mathcal{A}_n\) is quasi-arithmetic with some continuous strictly monotone \(\varphi\) for all \(n \geq 2\).  
3. From A2 (positive homogeneity = \(\mathcal{A}_n(rx_1,\ldots,rx_n) = r\mathcal{A}_n(x_1,\ldots,x_n)\)): by Hardy–Littlewood–Pólya (1952), the only homogeneous quasi-arithmetic mean on \((0,\infty)\) is the power mean \(M_p\). Among power means, positive homogeneity selects \(p = 0\), i.e., the geometric mean \(\Lambda_n\).  
4. Therefore \(\mathcal{A}_n = \Lambda_n\) for all \(n \geq 1\). \(\square\)

**Source for step 2**: [Kiss & Shulman (2026), arXiv:2606.05221, Theorem 1.2](https://arxiv.org/abs/2606.05221).  
**Source for step 3**: [Hardy, Littlewood, Pólya (1952), *Inequalities*, p. 68](https://books.google.com/books/about/Inequalities.html?id=t1RCSP8YKt8C); [Quasi-arithmetic mean — Homogeneity section, Wikipedia](https://en.wikipedia.org/wiki/Quasi-arithmetic_mean).

**Why this is the best candidate**: It is the *minimal* augmentation of A1–A4 that forces Λ, because (a) it drops the only remaining hypothesis (continuity) that could be called "secretly arithmetical," (b) its governance reading is identical to A6', and (c) it is directly derivable from the most recent (2026) state of the mathematical literature.

**Recommendation to Team A**: Formalize A6″ as the target for a follow-on proof. The Lean certificate would say: "Under {A1–A5, A6″} (no continuity assumption), Λ is unique." This is *strictly stronger* than the current `lambda_unique_under_block` result in the sense of having *weaker* premises for the same conclusion.

---

## 3. STEELMAN + REBUT — Four Major Objections

Each objection is stated in its *strongest* possible form. Then the rebuttal, citing real sources.

---

### Objection I — "The axiom is question-begging: A6' secretly assumes the geometric mean"

**Steelman (strongest form).** Uniqueness theorems in functional-equation theory are notoriously easy to obtain by choosing an antecedent that logically entails the consequent. Here, bisymmetry and aggregation-invariance are known since Aczél (1948) and Kolmogorov (1930) to *characterize* quasi-arithmetic means — so adding them to your system is algebraically equivalent to assuming factorization, which is most of the way to assuming Λ. The gap between "quasi-arithmetic" and "geometric mean" is bridged by A2 (homogeneity), which was already in the system. So the argument structure is: *assume (something logically equivalent to QAM) + assume homogeneity → conclude Λ*. This reduces to: *assume Λ → conclude Λ*. A reviewer at *Annals of Mathematics* would reject this as circular.

**Rebuttal.**

(a) **The premise-conclusion gap is real, not illusory.** The circularity objection requires that A6' be *logically equivalent* to "the aggregator is quasi-arithmetic." It is not. Aggregation-invariance is a *functional equation on the aggregator's behavior on partitioned input*, phrased with no reference to quasi-arithmetic structure, to generating functions, or to exponents. Establishing the equivalence *requires a non-trivial proof* — the proof in [Csató (2018)](https://doi.org/10.1007/s10726-018-9589-3) — which is exactly why the result is publishable in a peer-reviewed journal. A tautological implication is not peer-reviewable; this one is.

(b) **We deliberately chose the weakest sufficient antecedent.** The in-tree evolution is documented: the team *downgraded* from `A6_bisymmetric` to A6'_block_consistent precisely because bisymmetry is formally closer to factorization. Choosing the *most-independent* published axiom is the standard discipline for non-trivial uniqueness results. Compare Csató's (2018) own presentation: he axiomatizes the row geometric mean from **anonymity + responsiveness + aggregation-invariance** — three axioms that are stated without mentioning means or logarithms, and whose equivalence to "the row geometric mean wins" is the theorem, not a definition.

(c) **The unconditional claim is proven false.** If A6' were logically equivalent to Λ-uniqueness, the system {A1–A5} *without* A6' would still force Λ (since it would be equivalent to the weaker system forcing Λ). But `maxAgg_ne_Lambda` shows {A1–A5} alone does *not* force Λ. Therefore A6' is *not* equivalent to "the answer is Λ" given only {A1–A5} — it genuinely adds non-trivial content. The counterexample is the proof that the axiom is not question-begging.

(d) **Peter Suber's analysis of question-begging** ([Earlham College, *Question-Begging*](https://legacy.earlham.edu/~peters/writing/bq.htm)) notes: "The fallacy consists in assuming without justification what is to be proven … The clearest cases are those where the premise *is* the conclusion or where the premise *directly entails* the conclusion by immediate inference." A6' does not directly entail "Λ is the unique satisfier of A1–A5" — it entails this only via the Csató (2018) proof, which goes through several non-trivial lemmas. The implication is not immediate.

(e) **The honest residual.** We acknowledge that A6' is a *normative choice* about what a governed aggregator must satisfy, and we defend it on governance grounds. If the objector means "you chose A6' *because* you knew it pins Λ," that is true in the sense that the research was motivated by a goal — but this is standard mathematical practice (we look for axioms that characterize the object of interest). The scientific discipline that converts this into a non-trivial result is: (i) independent motivation for A6', (ii) weakest sufficient condition, (iii) boundary proof (¬U established), (iv) disclosure. All four are present.

---

### Objection II — "Why geometric not arithmetic or harmonic mean?"

**Steelman (strongest form).** Even granting some axiomatic characterization of *a* quasi-arithmetic mean, the choice of the geometric mean over the arithmetic or harmonic mean rests on A2 (positive homogeneity). But A2 is *itself* a choice. The arithmetic mean satisfies homogeneity in the additive sense (\(A(x+c) = A(x)+c\)), and for many data types additive homogeneity is more natural than multiplicative. The choice of *multiplicative* homogeneity (A2) privileges the geometric mean circularly: you get Λ *because* you assumed the kind of homogeneity that Λ satisfies.

**Rebuttal.**

(a) **The homogeneity type is determined by the measurement scale of the inputs, not chosen arbitrarily.** Trust sub-scores are ratio-scale: they have a natural zero (no conformance) and are measured in units that can be rescaled (e.g., all scores multiplied by 2 if the grading rubric is rescaled). [Stevens (1946)](https://en.wikipedia.org/wiki/Level_of_measurement): on a ratio scale, the *meaningful* measure of central tendency is the geometric mean. [Rasch (2025)](https://www.rasch.org/rmt/rmt111n.htm): "When obtaining the location of a set of ratio numbers, their ratio relationship with the scale's particular origin must be maintained. This is done by using the geometric mean." The axiom A2 is not a choice — it follows from recognizing trust scores as ratio-scale measurements.

(b) **The measurement-theory argument is scale-type specific.** [Luce's principle of theory construction](https://orbilu.uni.lu/bitstream/10993/9455/4/B-MeaningfulAggregationFunctions.pdf): if input variables are ratio scales, then the aggregation function \(F\) must satisfy \(F(rx_1,\ldots,rx_n) = r \cdot F(x_1,\ldots,x_n)\) to be "meaningful" — i.e., invariant under change of measurement unit. This is *positive* homogeneity (A2), not additive homogeneity. Arithmetic mean satisfies this condition only for equal-weight cases; it does *not* satisfy multiplicative homogeneity in general. Geometric mean does. [Aczél & Alsina (1986)](https://rseri.me/publication/j013/J013.pdf); [Seri et al.](https://rseri.me/publication/j013/J013.pdf): "a preference for geometric mean over arithmetic mean methods is sometimes justified noting that arithmetic methods are typically relevant when measurements are on an *interval* scale, while in the context of AHP measurements occur on a *ratio* scale."

(c) **Hardy–Littlewood–Pólya seals the uniqueness.** Once quasi-arithmeticity is established (via any of the routes in §1), [Hardy, Littlewood, Pólya (1952), p. 68](https://books.google.com/books/about/Inequalities.html?id=t1RCSP8YKt8C) shows: *the only homogeneous quasi-arithmetic means are the power means*. And among power means, positive homogeneity \(M_p(rx) = r M_p(x)\) is satisfied for *all* \(p\) — so it selects the entire power-mean family. The *additional* selection of \(p=0\) (geometric mean) from among power means is made by the reciprocity condition (R from Aczél–Saaty 1983): the only power mean satisfying \(M_p(1/x_1,\ldots,1/x_n) = 1/M_p(x_1,\ldots,x_n)\) is \(M_0 = \Lambda\). The arithmetic mean (\(p=1\)) fails reciprocity; the harmonic mean (\(p=-1\)) fails positive homogeneity in the sense that it is not consistent with ratio-scale aggregation in the same direction.

(d) **Decision-theoretic convergence.** The expected-utility representation of ratio-scale utility under product structure is the geometric mean aggregation, not the arithmetic — a fact noted in the aggregation-of-judgments literature ([Aczél & Saaty 1983](https://doi.org/10.1016/0022-2496(83)90028-7)): "arithmetic mean would not preserve the reciprocal property … only geometric mean is consistent."

---

### Objection III — "Conditional-on-a-declared-axiom isn't really proven; it's just a hypothetical"

**Steelman (strongest form).** Mathematics provides unconditional truths. "If A then B" is trivially true for any B when A is sufficiently strong. Your "conditional theorem" is just the observation that *if* you assume an axiom strong enough to force Λ, then Λ is forced. This has zero mathematical content beyond the axiom itself. Calling it a "machine-checked theorem" dresses up a tautology in Lean syntax. Every proposition is a "conditional theorem" under some antecedent; the term is vacuous without a principled constraint on antecedent strength.

**Rebuttal.**

The objection correctly identifies a genuine risk (vacuous conditionals) and incorrectly claims the result falls into that category. The distinction between a vacuous and a legitimate conditional result is well-established in philosophy of science; the substrate's result passes all four tests.

(a) **Test 1 — The antecedent is independently motivated (no antecedent-smuggling).** A conditional is scientifically legitimate when the antecedent is *independently defensible before the consequent is mentioned* ([Lakatos, *Proofs and Refutations*, Cambridge UP 1976, Appendix I](https://en.wikipedia.org/wiki/Proofs_and_Refutations)). A6' is not invented for this theorem; it is a published, named axiom with a governance interpretation stated in [Csató (2018)](https://doi.org/10.1007/s10726-018-9589-3) before any Lutar application. The governance interpretation (audit path-independence) is independently endorsed by regulators for reasons that have nothing to do with geometric means.

(b) **Test 2 — The conditional is non-vacuously instantiated.** A material implication whose antecedent is impossible is trivially true and scientifically worthless. Here `lambda_factors` (axiom-free, CI-green) establishes that Λ *actually satisfies* A6'; the antecedent is consistent and satisfied by the object of interest. The implication is non-vacuous.

(c) **Test 3 — The negation of the unconditional is independently established.** This is the key distinguishing test. A mere "conditional theorem" without a boundary result is potentially a fallback; a conditional theorem *accompanied by a proof of the unconditional's falsity* is the *maximal true statement*. `maxAgg_ne_Lambda` (CI-green) establishes ¬U. Therefore the conditional is not a fallback for a proof we couldn't find — the stronger claim is demonstrably false, and the conditional is all there is. This is the mathematical discipline that Lakatos calls "proof-generated concept refinement": the monster (max-aggregation) was found, the guilty lemma (A6') was identified, and the revised theorem (conditional) is now the correct, tight statement.

(d) **Test 4 — Disclosure at point of use.** [Lakatos](https://en.wikipedia.org/wiki/Proofs_and_Refutations) identifies "hidden lemma" (silent lemma-incorporation) as the characteristic vice in the history of mathematical proof. The substrate does the opposite: every `#print axioms` output lists A6' explicitly. The conditionality is the *headline*, not a footnote.

(e) **The formal-epistemology parallel.** [Joyce's accuracy-first epistemology](https://plato.stanford.edu/archives/fall2014/entries/epistemic-utility/) distinguishes provability from truth: a proof under an axiom is not a claim that the axiom is true, but that the consequent follows *given* the axiom. The substrate's posture is identical: it does not claim A6' is a *metaphysical necessity* for governed AI; it claims that *if* you accept A6' as a governance norm (a normative, not metaphysical, commitment), then Λ follows — and that this acceptance is rationally warranted on grounds the §3.2 regulator argument makes explicit.

---

### Objection IV — "Λ as a TRUST operator has no empirical content; it's a governance fiction"

**Steelman (strongest form).** The Λ-score is a mathematical function, not an empirical measurement. "Trust" in the Lutar sense has no independent criterion of correctness against which to validate the score. Unlike temperature (validated by thermodynamics) or mass (validated by balance scale comparisons), a trust score is whatever the axioms define it to be. Governance frameworks built on such scores are circular: the score is "correct" because it satisfies the axioms, and the axioms are "right" because the score we want satisfies them. The whole structure has no anchor in reality.

**Rebuttal.**

(a) **The objection conflates two distinct claims.** The substrate does *not* claim that Λ is the only possible measure of trustworthiness in some metaphysical sense. It claims that *among aggregators satisfying A1–A5 + A6'*, Λ is unique — a *mathematical* result. The *normative* claim is that an AI governance framework *should* use an aggregator satisfying those axioms, and the argument for that is the *independent defense* of each axiom on governance grounds (§1 above). The empirical content is in the *sub-scores* that are input to Λ — those are empirically grounded in observed system behaviors (conformance events, audit outcomes). Λ is a *summary statistic* of empirically grounded inputs, and its uniqueness theorem tells you which summary statistic is the right one given the normative governance requirements.

(b) **Measurement theory handles this objection directly.** [Krantz, Luce, Suppes, Tversky (1971)](https://philpapers.org/rec/KRAFOM) establish that *representational measurement* is legitimate when (i) qualitative empirical relations are axiomatized, (ii) a homomorphism to numerical structures is proven to exist and be unique up to admissible scale transformations. Both conditions are met for Λ: the qualitative relations (trust ordering of AI systems) are governed by A1–A5 + A6', the homomorphism to \((0,\infty)\) with geometric-mean aggregation is the conditional uniqueness theorem, and the admissible transformation is scalar rescaling. This is measurement, not fiction.

(c) **The "governance fiction" charge applies equally to all governance metrics.** Market capitalization, credit scores, audit ratings, and risk weights in Basel III are all formal functions of inputs governed by normative frameworks. The objection, if valid, would eliminate all of financial regulation. The philosophical literature on measurement (Narens 2002; [Narens & Luce, *Meaningfulness and Invariance*, 1987](https://sites.socsci.uci.edu/~lnarens/1987/NarensLuce_Dictionary%20Entry_1987.pdf)) addresses exactly this: a measure is *empirically meaningful* when it is invariant under the admissible scale transformations of its domain, which is a mathematical criterion, not a claim about direct empirical correspondence. Λ satisfies this criterion (invariance under unit rescaling = A2).

(d) **Process reliabilism (Goldman 1979) provides the epistemic anchor.** [SEP, Reliabilism](https://plato.stanford.edu/entries/reliabilism/): a belief is justified iff produced by a *reliable* process — one with a high truth-ratio over the reference class of situations. The Λ-score's "empirical content" is the *process reliability* of the audit mechanism that generates the inputs. If the sub-score auditing process is reliable (high conformance → high sub-score, low conformance → low sub-score), then Λ inherits that reliability. The immutable proof trail (F13′/F14, under declared crypto axioms) is precisely the mechanism that *makes* the process reliable: Nozick's sensitivity condition ([IEP, Safety Condition](https://iep.utm.edu/safety-c/)) is engineered in — were the record falsified, verification would fail to confirm the score.

(e) **The honest residual.** We do *not* claim Λ measures some mind-independent "trust essence." We claim it is the *appropriate summary statistic* for a normatively specified set of conformance properties, given ratio-scale inputs, given audit path-independence, and given Lutar's measurement axioms. That is exactly the level of claim a governance framework is entitled to make — and it is more than most governance frameworks bother to justify.

---

## 4. THE EPISTEMOLOGY OF "CONJECTURE 1" — Why Honest Labeling is a Virtue, Not a Weakness

### 4.1 The Three-Layer Claim Structure (Precise Statement)

A philosophically careful reading distinguishes three propositions, each with a different epistemic status. The substrate asserts exactly the truth value of each:

| Proposition | Statement | Epistemic Status | Evidence |
|---|---|---|---|
| **(U) Unconditional uniqueness** | "Λ is the unique aggregator satisfying {A1–A5}." | **FALSE** | Machine-checked counterexample `maxAgg_ne_Lambda`, CI-green. |
| **(C) Conditional uniqueness** | "Given {A1–A5} + A6', Λ is the unique aggregator." | **PROVEN** (conditional) | CI-green, Lean kernel-checked, A6' disclosed in `#print axioms`. |
| **(Conj) The governance conjecture** | "The right axiomatization of a governed trust aggregator forces Λ." | **CONJECTURE 1** (open) | The philosophical question whether A6' is the *correct* governance demand is open. |

The honesty doctrine: *say (U) is false, (C) is proven-conditional, (Conj) is open — and never let any reader collapse them.*

### 4.2 Why "Conjecture 1" Is Epistemically Virtuous: The Calibration Argument

Formal epistemology distinguishes between *truth*, *provability*, and *conditional provability*, and has developed a rich account of what it means to *calibrate* one's assertions to one's evidence. [Joyce (1998), *A Nonpragmatic Vindication of Probabilism*](http://fitelson.org/coherence/joyce_2009.pdf): calibrated credences are those that *track accuracy* — a credence-reporting agent is epistemically virtuous when its reports systematically correspond to the probability of truth. [SEP, Epistemic Utility Arguments for Probabilism](https://plato.stanford.edu/archives/fall2014/entries/epistemic-utility/): "matching the truth values is an epistemic goal."

The analogous norm for *categorical* mathematical claims (proved/not proved) is **calibration of proof tiers**: an agent/system is well-calibrated when its "proved" labels attach only to what is actually proved, and its "conjecture" labels attach to what is not yet proved. The substrate's three-tier system — *locked theorem*, *proven conditional theorem*, *conjecture* — is exactly such a calibrated labeling.

Consider the alternative: if the substrate labeled Λ "theorem" without qualification, its "theorem" labels would be miscalibrated — sometimes they would track actual proofs, sometimes not. A regulator evaluating a "theorem" claim from such a system would have *less* information about the actual strength of the claim than one receiving the calibrated three-tier labeling. This is the information-theoretic argument: a miscalibrated label is *strictly less informative* than a calibrated one.

The [Lakatos (1976), *Proofs and Refutations*, Cambridge UP](https://en.wikipedia.org/wiki/Proofs_and_Refutations) analysis of mathematical progress is the canonical philosophical defense. Lakatos shows that *healthy* mathematical development proceeds by:
1. Primitive conjecture.
2. Proof-analysis (decomposing into lemmas).
3. Global counterexamples (to the primitive conjecture).
4. Identifying the "guilty lemma" and incorporating it as an explicit condition.
5. The revised *conditional* theorem — the improved conjecture — supersedes the primitive one.

This is *precisely* the in-tree history: (1) the conjecture that A1–A5 force Λ; (3) the global counterexample `maxAgg_ne_Lambda`; (4) the "guilty lemma" identified as A6' (aggregation-invariance); (5) the conditional theorem `lambda_unique_under_block`. The Lakatosian reading is that calling the conditional result a *theorem* (conditional) and the unconditional claim a *conjecture* is not modesty — it is the *correct epistemic description of what the proof-analysis found*. A researcher who labeled the conditional result "just a theorem" without maintaining the conjecture label for the unconditional claim would be *failing* the Lakatosian discipline: "Make all hidden lemmas explicit."

### 4.3 The Reliabilist Argument: Why a Regulator Can Trust the "Proved" Label

[Goldman (1979), Process Reliabilism, SEP](https://plato.stanford.edu/entries/reliabilism/): a belief is justified iff produced by a process with a high truth-ratio. The governance analogue: a *label* is trustworthy iff the labeling *process* has a high accuracy rate — i.e., "proved" reliably attaches to what is actually proved.

In the substrate's three-tier system, "proved" attaches only to sorry-free, CI-green, kernel-checked Lean derivations. The *process* — Lean kernel verification + CI checks + human sign-off — is a high-reliability process for the label "proved." The "conjecture" label attaches to what has a known counterexample in the unconditional case. The process is well-calibrated.

Compare this with a system that calls everything "proved": such a system's "proved" label carries less information (lower precision), because the process generating it does not track actual provability. A regulator evaluating claims from the substrate *can rely on "proved" meaning proved* — because the substrate also accurately labels things "conjecture" when they are conjectural. The honesty of "Conjecture 1" is what *makes the "proved" labels credible*. This is the reliabilist epistemic argument for why honest labeling is a feature: it *increases the information value of all the positive claims*.

### 4.4 Nozick's Sensitivity Condition Applied to the Conjecture Label

[Nozick (1981), *Philosophical Explanations*, tracking/sensitivity](https://philosophyalevel.com/posts/nozicks-truth-tracking-definition-of-knowledge/): knowledge requires that *were P false, the believer would not believe P*. The analogous condition for claim-labels: *were the unconditional uniqueness false (as it is), the system would not label it "proved."* The substrate satisfies this: `maxAgg_ne_Lambda` is the mechanism that *causes* the "conjecture" label. The label tracks the actual proof status — it is *sensitive* in Nozick's sense.

This sensitivity is also what makes the *conditional* label epistemically superior to the unconditional one. A conditional theorem is knowable in Nozick's sense: the CI-green certificate is a truth-tracking mechanism for the conditional claim (were the conditional claim false, the Lean proof would fail). An unchecked unconditional conjecture lacks that mechanism.

### 4.5 Why a Reviewer Should Be Reassured, Not Alarmed, by "Conjecture 1"

A philosophically sophisticated reviewer who sees "Conjecture 1" alongside a CI-green conditional theorem should interpret this as a **calibration signal of high integrity**, not as an admission of failure. The signal is: *this system reports its epistemic states accurately — its "proved" means proved, its "conjecture" means not yet proved.* Such a system is *more* reliable as an information source than one that inflates all claims to "proved." The reviewer's correct response is: "The conditional theorem is genuinely provable by their own standards; the conjecture is genuinely open by their own standards. I can trust both labels."

The contrast: a system that called the unconditional conjecture "theorem" might achieve short-term rhetorical credibility but would be immediately falsified by any adversarial checker who found `maxAgg_ne_Lambda`. The substrate preemptively discloses this counterexample and labels accordingly — an action that is costly *only* if you were trying to deceive, which means it is a credible signal of non-deception.

---

## 5. WHY A REGULATOR ACCEPTS THIS — One-Paragraph Argument

A financial or AI regulator accepting a trust aggregator does not evaluate its mathematical beauty; she evaluates whether its *governance properties* can be audited against declared and independently defensible requirements. The substrate presents exactly this: the aggregator Λ satisfies five base axioms (normalization, homogeneity, monotonicity, symmetry, boundary conditions — none controversial) and one further, declared governance requirement (A6'_block_consistent: the trust verdict must not depend on how the auditor partitions the evidence blocks, a direct analogue of the standard audit-objectivity requirement that an auditor's choice of scope boundary must not affect the verdict). The mathematical fact that these six requirements jointly force Λ and no other aggregator — proven by a machine-checked kernel and independently rooted in [Csató (2018)](https://doi.org/10.1007/s10726-018-9589-3) — means the regulator can state precisely what she is requiring, verify that the system delivers it, and know that nothing else could pass the same bar. The three-tier epistemic labeling (locked theorem / conditional theorem / conjecture) is itself a governance feature: it tells the regulator exactly where the mathematical certainty ends and the normative design choice begins, which is the only basis on which a governance conversation can be honest. The sub-score inputs are ratio-scale by construction (conformance fractions), measurement theory ([Stevens 1946](https://en.wikipedia.org/wiki/Level_of_measurement); [Narens 2002](https://www.sciencedirect.com/science/article/pii/S0022249602914288)) licenses the geometric mean as the unique meaningful central tendency for ratio data, and [Luce's meaningfulness principle](https://orbilu.uni.lu/bitstream/10993/9455/4/B-MeaningfulAggregationFunctions.pdf) confirms that positive homogeneity (A2) is required, not optional. The regulator accepting A6' is not accepting an exotic mathematical preference — she is accepting that audit verdicts should be path-independent, the same principle that underlies every objectivity requirement in her existing framework.

---

## 6. HONEST CAVEAT — One Paragraph

Nothing in this document converts the governance conjecture (Conj) into a theorem, and a hostile reviewer is right to ask whether A6' is the *correct* normative requirement for AI trust governance rather than merely a convenient one. The answer we give is a *defended normative argument*, not a proof: A6' is independently published ([Csató 2018](https://doi.org/10.1007/s10726-018-9589-3)), operationally interpretable (audit path-independence), and weaker than the alternatives (bisymmetry, associativity) — but these are *reasons to accept it*, not *proofs that it is the uniquely correct governance axiom*. A governance framework that used a different A6-type axiom (e.g., reciprocity + homogeneity from [Aczél–Saaty 1983](https://doi.org/10.1016/0022-2496(83)90028-7)) would reach the same Λ-uniqueness conclusion via a different route; this convergence is evidence that Λ is robust, but not proof that A6' is the uniquely right requirement. The conditional structure is a *feature of intellectual honesty* — every conditional theorem rests on its antecedent, and the right response to that is to disclose and defend the antecedent, which this document does. A future development that found an even weaker, even more independently motivated axiom from which Λ follows would *strengthen* the case; we have proposed A6″ (regularity-free block-consistency, derived from Kiss–Shulman 2026) as the current best candidate for such a strengthening. The mathematical work remains open at the level of (Conj); the philosophical work reported here is the *best available defense* of the conditional theorem given the current state of the functional-equations literature.

---

## 7. SOURCES (Full URLs and DOIs)

### Functional Equations / Aggregation Theory
- Aczél, J. (1948). *On mean values.* Bull. AMS 54(4):392–400. https://eudml.org/doc/296298
- Aczél, J. & Saaty, T.L. (1983). *Procedures for synthesizing ratio judgements.* J. Math. Psychology 27:93–102. doi:10.1016/0022-2496(83)90028-7 — https://doi.org/10.1016/0022-2496(83)90028-7; exposition: http://www.isahp.org/uploads/383-aggregating.pdf
- Csató, L. (2018). *Characterization of the row geometric mean ranking with a group consensus axiom.* Group Decision and Negotiation 27(6):1011–1027. doi:10.1007/s10726-018-9589-3 — https://doi.org/10.1007/s10726-018-9589-3; arXiv:1706.07256 — https://arxiv.org/abs/1706.07256; PDF — https://real.mtak.hu/162433/1/1706.07256.pdf
- Csató, L. (2019). *A characterization of the Logarithmic Least Squares Method.* European Journal of Operational Research 276(1):212–216. doi:10.1016/j.ejor.2018.12.046 — https://www.sciencedirect.com/science/article/pii/S0377221718311202
- Kiss, G. & Shulman, E. (2026). *N-ary quasi-arithmetic means and families without regularity.* arXiv:2606.05221 — https://arxiv.org/abs/2606.05221; HTML: https://arxiv.org/html/2606.05221v1
- Burai, P., Kiss, G. & Szokol, P. (2021). *Characterization of quasi-arithmetic means without regularity condition.* Acta Mathematica Hungarica 165:474–485. arXiv:2107.07391 — https://arxiv.org/pdf/2107.07391; https://real.mtak.hu/163273/1/2208.07083v1.pdf
- Kolmogorov–Nagumo–de Finetti quasi-arithmetic means. Wikipedia — https://en.wikipedia.org/wiki/Quasi-arithmetic_mean
- Marichal, J.-L. (2000). *On an axiomatization of the quasi-arithmetic mean.* orbilu.uni.lu — https://orbilu.uni.lu/bitstream/10993/9469/2/OnAnAxiomatizationOfTheQuasi.pdf
- Hardy, G.H., Littlewood, J.E. & Pólya, G. (1952). *Inequalities* (2nd ed.). Cambridge University Press. — https://books.google.com/books/about/Inequalities.html?id=t1RCSP8YKt8C

### Measurement Theory
- Krantz, D.H., Luce, R.D., Suppes, P. & Tversky, A. (1971/1989/1990). *Foundations of Measurement*, Vols. I–III. Academic Press. https://philpapers.org/rec/KRAFOM
- Suppes, P. & Luce, R.D. *Representational Measurement Theory.* Stanford corpus — https://suppescorpus.stanford.edu/sites/g/files/sbiybj32751/files/media/file/representational_measurement_theory_382.pdf
- Narens, L. (1981). *On the scales of measurement.* J. Math. Psychology 24:249–275. https://sites.socsci.uci.edu/~johnsonk/CLASSES/MeasurementTheory/Narens1981b.OnTheScalesOfMeasurement.pdf
- Narens, L. (2002). *A meaningful justification for the representational theory of measurement.* J. Math. Psychology 46:746–768. doi:10.1006/jmps.2002.1428 — https://www.sciencedirect.com/science/article/pii/S0022249602914288; PDF — https://sites.socsci.uci.edu/~lnarens/2002/Narens_JMP_2002a.pdf
- Narens, L. & Luce, R.D. (1987). *Meaningfulness and invariance.* Palgrave Dictionary of Economics. https://sites.socsci.uci.edu/~lnarens/1987/NarensLuce_Dictionary%20Entry_1987.pdf
- Stevens, S.S. (1946). *On the theory of scales of measurement.* Science 103:677–680. Summary: https://en.wikipedia.org/wiki/Level_of_measurement; ratio-scale geometric mean: https://www.rasch.org/rmt/rmt111n.htm
- Marichal, J.-L. & Mesiar, R. *Meaningful aggregation functions mapping ordinal scales into an ordinal scale.* orbilu.uni.lu — https://orbilu.uni.lu/bitstream/10993/9455/4/B-MeaningfulAggregationFunctions.pdf

### Pairwise Comparisons / AHP / Row Geometric Mean
- Seri, R. et al. *Aggregation in AHP: arithmetic vs. geometric mean.* rseri.me — https://rseri.me/publication/j013/J013.pdf

### Formal Epistemology
- Goldman, A. (1979). *What is justified belief?* Process reliabilism. SEP — https://plato.stanford.edu/entries/reliabilism/; IEP — https://iep.utm.edu/reliabilism/
- Joyce, J. (1998). *A Nonpragmatic Vindication of Probabilism.* Philosophy of Science 65(4):575–603. http://fitelson.org/coherence/joyce_2009.pdf
- Nozick, R. (1981). *Philosophical Explanations.* Tracking/sensitivity. https://philosophyalevel.com/posts/nozicks-truth-tracking-definition-of-knowledge/; Safety condition: https://iep.utm.edu/safety-c/
- SEP Epistemic Utility Arguments for Probabilism (accuracy-first epistemology) — https://plato.stanford.edu/archives/fall2014/entries/epistemic-utility/
- Gettier, E. (1963). *Is Justified True Belief Knowledge?* Gettier problem — https://en.wikipedia.org/wiki/Gettier_problem; SEP Epistemology — https://plato.stanford.edu/entries/epistemology/

### Philosophy of Mathematics / Science
- Lakatos, I. (1976). *Proofs and Refutations: The Logic of Mathematical Discovery.* Cambridge UP. Wikipedia — https://en.wikipedia.org/wiki/Proofs_and_Refutations; text — https://e.math.cornell.edu/people/mann/classes/chicago/Lakatos.pdf; reflection — https://statmodeling.stat.columbia.edu/2021/02/11/reflections-on-lakatoss-proofs-and-refutations/
- SEP Lakatos (2016) — https://plato.stanford.edu/archives/spr2023/entries/lakatos/
- Suber, P. *Question-begging.* Earlham College — https://legacy.earlham.edu/~peters/writing/bq.htm
- Begging the question, Wikipedia — https://en.wikipedia.org/wiki/Begging_the_question

### Philosophy of Trust
- Trust (SEP) — https://plato.stanford.edu/entries/trust/  (Baier 1986; Jones 1996; Hawley 2019)
- Ethics & Epistemology of Trust (IEP) — https://iep.utm.edu/trust/

### Social Choice / Mechanism Design
- Arrow's impossibility theorem — https://en.wikipedia.org/wiki/Arrow's_impossibility_theorem
- Ashlagi, I. et al. *Monotonicity and Implementability.* Stanford — https://web.stanford.edu/~iashlagi/papers/mon-rev6.pdf
- Partition invariance (decision theory context) — https://plato.stanford.edu/archives/fall2020/entries/decision-causal/

### AI Governance / Security
- Brundage, M. et al. (2020). *Toward Trustworthy AI Development: Mechanisms for Supporting Verifiable Claims.* arXiv:2004.07213 — https://www.governance.ai/research-paper/https-arxiv-org-abs-2004-07213v2
- NTIA, *Proof of Claims and Trustworthiness* — https://www.ntia.gov/issues/artificial-intelligence/ai-accountability-policy-report/developing-accountability-inputs-a-deeper-dive/ai-system-evaluations/proof-of-claims-and-trustworthiness
- Saltzer, J.H. & Schroeder, M.D. (1975). *The Protection of Information in Computer Systems.* Proc. IEEE 63(9). https://www.cs.virginia.edu/~evans/cs551/saltzer/; https://shostack.org/blog/the-security-principles-of-saltzer-and-schroeder
- ProVerif methodology (abstract axiom / formal verification) — https://arxiv.org/abs/2303.04500

---

*Honesty preserved verbatim: Unconditional Λ uniqueness is FALSE (machine-checked counterexample `maxAgg_ne_Lambda`, CI-green, in-tree). Λ (F23) is **Conjecture 1**, never a theorem. The conditional theorem `lambda_unique_under_block` holds only under the declared, disclosed axiom A6'_block_consistent. The new candidate A6″ (regularity-free block-consistency, Kiss–Shulman 2026) is a proof target proposed for Team A, not a proven result. No conjecture is called a theorem in this document.*

*Signed-off-by: PhD Team B — Philosophers (SZL Holdings)*
