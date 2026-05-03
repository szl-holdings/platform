# The Lutar Invariant: An Axiomatic Trust Aggregator with Egyptian-Fraction Weight Inspectability

**Author:** Stephen Paul Lutar Jr.
**Affiliation:** SZL Consulting Ltd
**ORCID:** [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)
**Contact:** stephenlutar2@gmail.com
**Date:** 2 May 2026
**Version:** v3 (replaces retracted preprint 10.5281/zenodo.19951520)
**Reference implementation:** [github.com/szl-holdings/ouroboros](https://github.com/szl-holdings/ouroboros) — commit `5f6ee65`, suite 172/172
**Companion papers:** v1 [10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281), v2 [10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129)

---

## Abstract

We define the **Lutar Invariant** \( \Lambda \), a scalar trust aggregator over nine independent runtime axes:

\[
\Lambda(\mathbf{x}; \mathbf{w}) = \prod_{i=1}^{9} x_i^{w_i}, \qquad x_i \in [0,1], \quad w_i \geq 0, \quad \sum_{i=1}^{9} w_i = 1.
\]

\(\Lambda\) is the **weighted geometric mean** of nine axis scores, with weights drawn from a transparent Egyptian unit-fraction decomposition. We give four axioms — monotonicity (A1), zero-pinning (A2), Egyptian inspectability (A3), and page-curve concavity (A4) — and prove each by explicit numerical witness. The proof suite (22 assertions, all passing) is shipped in the public reference implementation under an open-source license, and reproducible via `pnpm install && pnpm exec vitest run packages/ouroboros/src/lutar-invariant-proof.test.ts`.

The contribution is the **specific combination**: weighted-geometric (not arithmetic) aggregation, distinct unit-fraction weights chosen for inspectability, an explicit four-axiom set, and a public falsifiable test surface. To the author's knowledge, this combination is novel; related work on multi-axis trust scoring (cited in §6) uses arithmetic aggregation, learned weights, or unaxiomatized scalar metrics.

This paper does **not** claim a deployed product, third-party audit, or fielded validation. The contribution is the formal object \(\Lambda\), its axiomatization, and the public proof artifact.

---

## 1. Motivation

Bounded-loop AI runtimes accumulate *trust signals* across heterogeneous concerns: data freshness, source priority, validator passes, risk-tier escalation, operator approval, and others. Practitioners increasingly need a single scalar summary of these signals — for halt conditions, for receipt generation, for audit trails — yet most deployed systems use either an unaxiomatized weighted sum or a learned black-box score [Bradatsch et al. 2024; Mahmood et al. 2023].

Three properties distinguish a useful trust aggregator from an arbitrary scoring function:

1. **Monotonicity.** Improving any axis must not lower the score.
2. **Zero-pinning.** A single failed axis with positive weight must drive the score to zero — otherwise the aggregator can mask catastrophic failure of one dimension by averaging it with healthy ones.
3. **Inspectability.** A practitioner reading a receipt must be able to reproduce the score by hand, with rational arithmetic, given only the axis scores and the weight set.

Weighted arithmetic means satisfy (1) and (3) but fail (2): an arithmetic mean cannot be driven to zero by any single failing axis unless that axis carries weight 1, which collapses the aggregator to a univariate quantity. Weighted geometric means satisfy all three, with the additional concavity property (A4 below) that bounds them above by the corresponding arithmetic mean (the AM-GM inequality).

The construction below makes this precise.

---

## 2. Definition

### 2.1 The aggregator

Let \(\mathbf{x} = (x_1, \dots, x_9) \in [0,1]^9\) be the runtime axis scores at a given step, and \(\mathbf{w} = (w_1, \dots, w_9)\) be a non-negative weight vector with \(\sum w_i = 1\). Define

\[
\Lambda(\mathbf{x}; \mathbf{w}) \;\;=\;\; \prod_{i=1}^{9} x_i^{w_i}
\]

with the convention that \(0^0 = 1\) and the explicit short-circuit: if there exists \(i\) with \(x_i = 0\) and \(w_i > 0\), then \(\Lambda = 0\). The reference implementation evaluates \(\Lambda\) in log-domain for numerical stability:

\[
\Lambda = \exp\!\Bigl(\, \textstyle\sum_{i: w_i > 0} w_i \log x_i \,\Bigr).
\]

### 2.2 The nine axes

The reference implementation labels the axes:

\[
\text{cleanliness},\ \text{horizon},\ \text{resonance},\ \text{frustum},\ \text{geometry},
\]
\[
\text{invariance},\ \text{moral},\ \text{being},\ \text{non\_measurability}.
\]

The labels are a runtime-system commitment, not part of the mathematical definition. Any nine non-negative scalars in \([0,1]\) constitute a valid input to \(\Lambda\); the labels exist to give receipts a consistent vocabulary across runs.

### 2.3 Two reference weight sets

Two weight sets are exercised by the proof suite:

**Equal weights:**

\[
\mathbf{w}_{\text{equal}} \;=\; \bigl(\tfrac{1}{9},\ \tfrac{1}{9},\ \tfrac{1}{9},\ \tfrac{1}{9},\ \tfrac{1}{9},\ \tfrac{1}{9},\ \tfrac{1}{9},\ \tfrac{1}{9},\ \tfrac{1}{9}\bigr), \qquad \textstyle\sum w_i = 1.
\]

**Egyptian unit-fraction weights** (tiered importance: 2 heavy axes, 1 medium, 6 light):

\[
\mathbf{w}_{\text{eg}} \;=\; \bigl(\tfrac{1}{3},\ \tfrac{1}{3},\ \tfrac{1}{9},\ \tfrac{1}{27},\ \tfrac{1}{27},\ \tfrac{1}{27},\ \tfrac{1}{27},\ \tfrac{1}{27},\ \tfrac{1}{27}\bigr).
\]

Verification of \(\sum \mathbf{w}_{\text{eg}} = 1\):

\[
\tfrac{1}{3} + \tfrac{1}{3} + \tfrac{1}{9} + 6 \cdot \tfrac{1}{27} \;=\; \tfrac{18}{27} + \tfrac{3}{27} + \tfrac{6}{27} \;=\; \tfrac{27}{27} \;=\; 1.
\]

The Egyptian decomposition is the substantive design choice: the weight set is a multiset of unit fractions (\(1/n\) with \(n\) a positive integer), so a practitioner can reproduce any score by hand using rational arithmetic without needing a calculator's floating-point routine. §3.3 (axiom A3) makes the inspectability property formal.

---

## 3. Axioms

We state four axioms and verify each by numerical witness in the reference implementation. The witnesses are not surrogates for proofs in the formal-logic sense; they are *falsification tests*. A failing assertion would refute the axiom on the test points exercised, and the axioms are stated such that the implementation either passes them or it does not.

### 3.1 A1 — Monotonicity

> For every \(i \in \{1, \dots, 9\}\) and every \(\mathbf{x} \in [0,1]^9\), if \(x_i' \geq x_i\) then \(\Lambda(\mathbf{x}'; \mathbf{w}) \geq \Lambda(\mathbf{x}; \mathbf{w})\), where \(\mathbf{x}'\) agrees with \(\mathbf{x}\) outside coordinate \(i\). Strict inequality holds when \(w_i > 0\) and the lifted point lies in \((0, 1]\).

*Sketch:* Differentiate \(\log \Lambda = \sum w_j \log x_j\) with respect to \(x_i\): \(\partial \log \Lambda / \partial x_i = w_i / x_i \geq 0\) on \((0,1]\), strict when \(w_i > 0\).

*Witnesses (4):* monotonicity under equal weights; monotonicity under Egyptian weights; non-increase when any axis is lowered; strict monotonicity when weight is positive. All four pass.

### 3.2 A2 — Zero-pinning

> If there exists \(i\) with \(x_i = 0\) and \(w_i > 0\), then \(\Lambda(\mathbf{x}; \mathbf{w}) = 0\). Conversely, if \(x_i = 0\) but \(w_i = 0\), then axis \(i\) is degenerate and does not affect \(\Lambda\) (since \(0^0 = 1\) by convention).

*Sketch:* The product form makes this immediate: \(0^{w_i} = 0\) for any \(w_i > 0\). The reference implementation uses an explicit short-circuit so log-domain evaluation never encounters \(\log 0\).

*Witnesses (4):* single axis at 0 with equal and Egyptian weights collapses \(\Lambda\); multiple zero axes still yield \(\Lambda = 0\); typical and perfect runs are strictly positive; zero-weight degenerate axis at 0 does not collapse \(\Lambda\). All four pass.

### 3.3 A3 — Egyptian inspectability

> The standard weight set is a multiset of unit fractions \(\{1/n_k\}\) with each \(n_k\) a positive integer, summing exactly to 1 in rational arithmetic. The aggregator \(\Lambda\) under this weight set is reproducible bit-exactly via two independent computation paths (direct division and exp-of-log) at IEEE-754 double precision tolerance.

*Sketch:* The denominators \((3, 3, 9, 27, 27, 27, 27, 27, 27)\) sum to 1 in rationals (§2.3). Each \(1/n_k\) is exactly representable as a double-precision binary fraction up to rounding; the test verifies rational reconstruction at twelve decimal places.

*Witnesses (4):* sum of unit fractions equals 1 to twelve decimals; bit-exact reconstruction across two paths; \(\Lambda(0.5,\dots,0.5; \mathbf{w}_{\text{eg}}) = 0.5\) exactly (since the geometric mean of identical inputs equals that input); the equal-weight set \(9 \times (1/9)\) is also a valid Egyptian decomposition. All four pass.

### 3.4 A4 — Page-curve concavity

> \(\Lambda\) is concave on the positive orthant \((0,1]^9\). Equivalently, for any two points \(\mathbf{a}, \mathbf{b} \in (0,1]^9\) and any \(t \in [0,1]\),
> \[
> \Lambda\bigl(t \mathbf{a} + (1-t) \mathbf{b};\ \mathbf{w}\bigr) \;\geq\; t\,\Lambda(\mathbf{a}; \mathbf{w}) + (1-t)\,\Lambda(\mathbf{b}; \mathbf{w}).
> \]
> As a corollary (the AM-GM inequality applied pointwise),
> \[
> \Lambda(\mathbf{x}; \mathbf{w}) \;\leq\; \sum_{i=1}^{9} w_i \, x_i,
> \]
> with equality if and only if all \(x_i\) with positive weight are equal.

*Sketch:* The weighted geometric mean is a log-concave function on the positive orthant; concavity of \(\log \Lambda\) plus monotonicity of \(\exp\) gives concavity of \(\Lambda\). The "page curve" name comes from the shape of \(\Lambda\) as one axis is varied with others fixed — the second-derivative test (numerical second-difference) is the cleanest empirical handle.

*Witnesses (4):* concavity along a generic line segment in \((\varepsilon, 1]^9\) for \(t \in \{0.1, 0.25, 0.5, 0.75, 0.9\}\); concavity on a stress segment with one axis varying (second-difference \(\leq 10^{-10}\)); AM-GM corollary \(\Lambda \leq \sum w_i x_i\) on four representative inputs; equality when all axes are equal. All four pass.

---

## 4. Boundary and sanity properties

A further six assertions exercise the aggregator at semantic boundaries (not new axioms, but corollaries the implementation must satisfy):

1. \(\Lambda(\mathbf{1}; \mathbf{w}) = 1\) for both weight sets (a perfect run).
2. \(\Lambda((0.7, \dots, 0.7); \mathbf{w}_{\text{equal}}) = 0.7\) (the geometric mean of identical inputs is that input).
3. A *degraded run* with eight axes at 0.9 and one axis at 0.1 yields \(\Lambda \approx 0.707\), strictly below the corresponding arithmetic mean \(\bar{x} \approx 0.811\). This is the headline property: a single weak axis pulls the geometric mean down further than it pulls the arithmetic mean.
4. \(\Lambda\) is symmetric under axis permutation when weights are uniform.
5. The axis labels match the runtime declaration verbatim.
6. Both standard weight sets sum to 1 to twelve decimals.

All six pass.

---

## 5. The reference implementation

### 5.1 Overview

The runtime [github.com/szl-holdings/ouroboros](https://github.com/szl-holdings/ouroboros) ships eight modules — loop kernel, depth allocator, consistency checker, proof-route resolver, risk-tier escalation gate, almanac cycle advancer, v6 ecosystem-payload schema, and government-readiness manifest — together with the \(\Lambda\) aggregator and its proof suite. The full test suite contains **172 tests across 6 files**, all passing on a clean install:

```bash
$ pnpm install
$ pnpm exec vitest run

 ✓ packages/ouroboros/src/runtime-contract.test.ts (41 tests)
 ✓ packages/ouroboros/src/runtime-contract.v4.test.ts (29 tests)
 ✓ packages/ouroboros/src/v6-payload.test.ts (35 tests)
 ✓ packages/ouroboros/src/lutar-invariant-proof.test.ts (22 tests)
 ✓ packages/ouroboros/src/gov-readiness.test.ts (28 tests)
 ✓ src/runtime-contract.test.ts (17 tests)

 Test Files  6 passed (6)
      Tests  172 passed (172)
```

The 22 \(\Lambda\) tests are the contribution of this paper. The remaining 150 tests exercise the surrounding runtime contract — those are engineering scaffolding, not part of the central mathematical claim.

### 5.2 What is and is not unit-tested

This paper distinguishes two kinds of test in the suite, and is honest about which back which claims:

- **Behavioral tests** assert that a function or formula returns the correct value on explicit inputs. The 22 \(\Lambda\) axiom tests are entirely behavioral. So are roughly thirty of the runtime-contract tests (proof-route resolution, risk-tier escalation, almanac cycle advance, deep-immutability of contract tables, domain-pack dispatch, operator-approval gating).

- **Schema regression tests** assert that a constant in the source matches the value the author declared. Tests like `expect(SHARED_RUNTIME_SERVICES_V6.length).toBe(16)` belong to this category. They are useful as anti-drift guards but they prove only that the constant has not been edited; they do not prove that the corresponding runtime services exist as runnable code.

The 22 \(\Lambda\) tests are behavioral. No schema regression tests are claimed as proofs.

### 5.3 Reproducing the proof

```bash
git clone https://github.com/szl-holdings/ouroboros.git
cd ouroboros
pnpm install
pnpm exec vitest run packages/ouroboros/src/lutar-invariant-proof.test.ts
```

Expected output: 22 tests, 22 passed, ~12 ms. A clean snapshot is also stored in [`LUTAR_EVIDENCE.md`](https://github.com/szl-holdings/ouroboros/blob/main/LUTAR_EVIDENCE.md) at the repository root.

---

## 6. Related work

**Multi-axis trust scoring.** Mahmood et al. [2023] survey weighted-sum trust aggregation in vehicular networks; their formulation is arithmetic and unaxiomatized. Bradatsch et al. [2024] discuss score-based access control in zero-trust networks, again with arithmetic combination of factor scores. Gaifulina et al. [2022] propose an "integral user-oriented trustworthiness metric" by weighted summation. None of these axiomatize the aggregator.

**Geometric-mean usage in ML evaluation.** Henriques et al. [2024] use a 95% confidence interval of the geometric mean as one of three trust components in machine-learning model assessment. The geometric mean there is a single statistic over repeated trials, not a multi-axis aggregator over heterogeneous concerns.

**Bayesian trust networks.** Thomas et al. [2023] build a Bayesian network over trust factors for medical devices; the propagation rules are conditional probabilities, not a closed-form aggregator. This is a more expressive but less inspectable construction.

**Mistrust scoring.** Bhaskhar et al. [2023] propose TRUST-LAPSE, a continuous mistrust score for ML monitoring. The score is learned and is not given a public axiomatization.

To the author's knowledge, the combination presented here — *weighted-geometric aggregator with explicit four-axiom statement, Egyptian unit-fraction weight inspectability, and a public falsifiable test surface* — does not appear in the surveyed literature.

---

## 7. Limitations and what this paper does not establish

Stating limitations explicitly is part of the contribution.

1. **Domain of validity.** The axiom proofs are numerical witnesses on finite test points. They establish that the IEEE-754 implementation satisfies the axioms on the points exercised; they do not constitute formal-logic proofs over all of \([0,1]^9\). A future companion in a proof assistant (Coq, Lean) would close this gap; the closed-form structure of \(\Lambda\) makes such a proof straightforward but it has not yet been done.

2. **Axis labels are not proven meaningful.** The nine axis labels (cleanliness, horizon, resonance, frustum, geometry, invariance, moral, being, non_measurability) are runtime-system commitments. This paper does not claim they exhaust the relevant trust dimensions of any particular AI system, nor that they are mutually independent in any deployment. Selecting and operationalising the axes is a system-design problem outside the scope of the formal object \(\Lambda\).

3. **No third-party audit.** The reference implementation has not been audited by any external body. The Empire APEX engagement on 2026-04-30 (administered by NYSTEC) was procurement *counseling* for SZL Consulting Ltd, not technical certification of the runtime.

4. **No deployed product, and the platform does not yet consume the runtime.** The runtime is an open-source reference. The seven product repositories in the SZL Holdings organisation — A11oy, Amaru, Sentra, Counsel, Terra, Vessels, Carlota Jo — are README-stage placeholders at the time of writing (each contains a README, LICENSE, NOTICE, and SECURITY file, and no source). The author also maintains a separate platform monorepo (`szl-holdings/szl-holdings-platform`); a fresh-clone audit on 2 May 2026 confirmed that no `package.json` in that repository declares `@szl-holdings/ouroboros` as a dependency. The runtime is published as a standalone reference artefact ready for consumption; it is not currently imported by any sibling repository, and no fielded validation of \(\Lambda\) is claimed.

5. **Government-readiness scorecards are self-assessments.** The runtime ships a `gov-readiness` manifest with platform-readiness scores (A11oy 72/100, Sentra 68/100, Amaru 65/100). These are founder self-assessments tested for regression, not third-party scores. The certification path is `in_progress` for all platforms; none are presently certified.

6. **No empirical comparison study.** This paper does not present an empirical comparison of \(\Lambda\) against arithmetic-mean or learned aggregators on a held-out task. Such a study is straightforward future work and is not claimed here.

---

## 8. Future work

- **Formal proof.** Mechanise A1-A4 in Lean or Coq.
- **Empirical comparison.** Compare \(\Lambda\)-based halt decisions against arithmetic-mean and min-aggregator baselines on synthetic 9-axis trust traces.
- **Weight learning under axiom constraints.** Investigate whether \(\mathbf{w}\) can be learned from data while preserving Egyptian inspectability (i.e., weights restricted to multisets of unit fractions).
- **Implementation of v4 and v6 runtime services.** The runtime contract declares a 9-entry validator registry (v4) and a 16-service shared runtime (v6) as routing/coordination layers; their implementation is the subject of forthcoming work.

---

## 9. Reproducibility, citation, and licence

**Reference commit:** [`5f6ee65`](https://github.com/szl-holdings/ouroboros/commit/5f6ee65) on `main` of [github.com/szl-holdings/ouroboros](https://github.com/szl-holdings/ouroboros). The proof file is `packages/ouroboros/src/lutar-invariant-proof.test.ts` (278 lines, 22 tests). The evidence summary is `LUTAR_EVIDENCE.md` at the repository root.

**Cite as:**

> Lutar, S. P. (2026). *The Lutar Invariant: An Axiomatic Trust Aggregator with Egyptian-Fraction Weight Inspectability.* The Ouroboros Thesis, v3. SZL Consulting Ltd. ORCID 0009-0001-0110-4173.

**Licence:** Reference implementation is published under the licences declared in the repository (see `LICENSE` and `NOTICE`). This paper is released under CC BY 4.0.

---

## References

1. Bhaskhar, N., Rubin, D. L., & Lee-Messer, C. (2023). TRUST-LAPSE: An Explainable and Actionable Mistrust Scoring Framework for Model Monitoring. *IEEE Transactions on Artificial Intelligence.* [DOI 10.1109/TAI.2023.3272876](https://doi.org/10.1109/TAI.2023.3272876).
2. Bradatsch, L., Miroshkin, O., Trkulja, N., & Kargl, F. (2024). Zero Trust Score-based Network-level Access Control in Enterprise Networks. *arXiv preprint.* [arXiv 2402.08299](https://arxiv.org/abs/2402.08299).
3. Gaifulina, D., Doynikova, E., Novikova, E., & Kotenko, I. (2022). Construction and Analysis of Integral User-Oriented Trustworthiness Metrics. *Electronics, 11(2), 234.* [DOI 10.3390/electronics11020234](https://doi.org/10.3390/electronics11020234).
4. Henriques, J., Sousa, J., Gonçalves, L., Paredes, S., Sousa, S., & Rocha, T. (2024). Machine learning models' assessment: trust and performance. *Medical & Biological Engineering & Computing.* [DOI 10.1007/s11517-024-03145-5](https://doi.org/10.1007/s11517-024-03145-5).
5. Lutar, S. P. (2026a). *The Ouroboros Thesis: Looped Computation as a System Primitive for AI Systems* (v1). Zenodo. [DOI 10.5281/zenodo.19867281](https://doi.org/10.5281/zenodo.19867281).
6. Lutar, S. P. (2026b). *The Loop Is the Product: An Empirical Companion to the Ouroboros Thesis* (v2). Zenodo. [DOI 10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129).
7. Mahmood, A., Suzuki, H., Sheng, Q. Z., Siddiqui, S. A., & Ni, W. (2023). Trust in Vehicles: Toward Context-Aware Trust and Attack Resistance for the Internet of Vehicles. *IEEE Transactions on Intelligent Transportation Systems.* [DOI 10.1109/TITS.2023.3268301](https://doi.org/10.1109/TITS.2023.3268301).
8. Thomas, M., Boursalie, O., Samavi, R., & Doyle, T. E. (2023). Data-driven approach to quantify trust in medical devices using Bayesian networks. *Journal of Medical Devices.* [DOI 10.1177/15353702231215893](https://doi.org/10.1177/15353702231215893).
