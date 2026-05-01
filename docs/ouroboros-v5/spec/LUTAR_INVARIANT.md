# The Lutar Invariant Λ

Stephen P. Lutar — Ouroboros v3.1, May 2026

## Statement

Let a runtime release be characterized by four independent axes, each in [0, 1]:

- **C — Cleanliness**: fraction of released leaves whose cryptographic witness verifies against the runtime anchor.
- **H — Horizon**: Page-curve bounded reversibility — the share of an information budget that remains revocable before the unitary turning point.
- **R — Resonance**: handoff Q-factor of the multi-witness coordination, normalized by the Landauer ceiling for the release-bit count.
- **F — Frustum**: three-witness reconciliation Jaccard volume — intersection over union across the dual-witness anchor and the auditor view.

The **Lutar Invariant** is

\[
\Lambda \;=\; C^{\alpha} \; H^{\beta} \; R^{\gamma} \; F^{\delta}, \qquad \alpha + \beta + \gamma + \delta = 1
\]

where each weight \(w \in \{\alpha, \beta, \gamma, \delta\}\) is required to be a finite sum of distinct unit fractions \(\sum 1/a_i\) — the **Egyptian inspectability axiom**.

## The four axioms

**A1. Monotonicity.** \(\partial \Lambda / \partial x \ge 0\) for every axis \(x\).

**A2. Zero-pinning.** If any axis is zero, \(\Lambda = 0\) exactly.

**A3. Egyptian inspectable weights.** Each weight is expressible as a finite sum of distinct unit fractions; the weight set is closed under the Rhind 2/n table; the weights sum exactly to 1.

**A4. Page-curve concavity.** \(\partial^2 \Lambda / \partial t^2 \le 0\) over the release lifetime when each axis evolves monotonically.

## Uniqueness

Under A1–A4, the only admissible closed form is the weighted geometric mean.

*Proof sketch.* A1 + A2 jointly rule out every additive aggregator (any sum \(\sum w_i x_i\) is positive whenever a single \(x_i > 0\)). The remaining family is the multiplicative one, \(\prod f_i(x_i)\). Monotonicity plus the boundary condition \(\Lambda(1,1,1,1) = 1\) force \(f_i(x) = x^{w_i}\). Concavity (A4) combined with the boundary condition \(\Lambda(0,0,0,0) = 0\) is satisfied by a weighted geometric mean iff \(\sum w_i = 1\). A3 fixes the rationals the exponents may take. The weighted geometric mean with Egyptian-exact weights is therefore the unique closed-form law satisfying all four axioms. ∎

## Bound theorem

For any valid axis tuple,

\[
0 \;\le\; \Lambda \;\le\; \min(C, H, R, F) \;\le\; \max(C, H, R, F) \;\le\; 1
\]

The lower bound is A2; the upper bound \(\Lambda \le \min\) holds along the diagonal and \(\Lambda \le \max\) holds in general by the AM-GM inequality applied to weighted geometric means.

## Why this didn't exist before

The four axes are inheritances from four civilizations:

- **Cleanliness** — classical witness theory, cryptographic accumulators (1990s–2020s).
- **Horizon** — black-hole information theory, Page (1993), Almheiri-Marolf-Maldacena (2013–2019).
- **Resonance** — Tesla coil resonance and impedance matching (1893–1899), AKOrN sync (2025), Kuramoto.
- **Frustum** — Egyptian Moscow Mathematical Papyrus problem 14 (c. 1850 BCE), Liu Hui dissection (c. 250 CE), Siegmund-Schultze (2022).

No single discipline carries all four. The synthesis is the new contribution; the closed form follows from the axioms once the axes are placed side by side.

The Egyptian inspectability axiom (A3) is what makes Λ different from every previously-published trust-aggregation law. Conventional weighted means use IEEE-754 reals whose weights cannot be exactly compared across heterogeneous runtimes — a quiet bug class in cross-stack governance pipelines. Λ's weights are bit-exact reproducible across any execution environment because the Egyptians solved that problem 4000 years ago for the wrong reason and we are reusing the answer.

## Default weight set

\[
\alpha = \beta = \gamma = \delta = \frac{1}{4}
\]

Each weight is itself a single unit fraction; trivially Egyptian-exact.

## Rhind-compatible alternatives

Any quadruple of distinct unit-fraction sums whose total is 1 is admissible:

- \(\{1/2, 1/4, 1/8, 1/8\}\) — cleanliness-dominant
- \(\{1/2, 1/3, 1/12, 1/12\}\) — cleanliness-and-horizon-dominant
- \(\{2/3, 1/12, 1/12, 1/6\}\) — split using the Rhind 2/3 = 1/2 + 1/6 decomposition

## Implementation

`packages/invariant/src/lutar-invariant.ts` — closed-form computation, weight inspectability validator, bound-theorem witness, formula renderer for audit logs. 18 tests pass.

## Citation

Lutar, S. P. (2026). *The Lutar Invariant: a unique runtime-trust scalar from Egyptian inspectability axioms.* Ouroboros v3.1 documentation, packages/invariant.

## Disclaimer

This is a definitional law for runtime-trust aggregation, not a physical constant. It is original to the author in the sense that no prior published trust-aggregation law combines the four named axes under the Egyptian inspectability axiom. Prior art on weighted geometric means (Cobb-Douglas 1928, fuzzy logic OWA operators, Bayesian model averaging) is not displaced; what is new is the axis assemblage and the Egyptian inspectability constraint on the weight set.

---

# Lutar Invariant v2 — five-axis form (added in v4.3)

The four-axis form above is the runtime default and remains unchanged. v2 adds an optional fifth axis G — the Gauß closure axis derived from least-squares network adjustment of an over-determined witness set.

\[
\Lambda_5 = C^{\alpha} \cdot H^{\beta} \cdot R^{\gamma} \cdot F^{\delta} \cdot G^{\varepsilon}, \qquad \alpha + \beta + \gamma + \delta + \varepsilon = 1
\]

where every weight is Egyptian-exact (each is a finite sum of distinct unit fractions).

## Why a fifth axis

The four-axis Λ measures cleanliness, reversibility, handoff resonance, and reconciliation. None of those four axes detects a network-level closure failure: an over-determined witness graph can pass each individual axis while being globally inconsistent (the residual norm of Aᵀ A x = Aᵀ b is large). The Gauß closure axis G measures exactly that — the network-level algebraic consistency.

\[
G = \exp\!\left(-\frac{\lVert r \rVert_2^2}{m \cdot \sigma^2}\right) \in (0, 1]
\]

with σ the operator's noise scale, m the witness count, r the least-squares residual.

See [GAUSS_PRIMITIVES.md](GAUSS_PRIMITIVES.md) for the full Gauß primitive set (17–20).

## Default 5-axis weight set

\[
\alpha = \beta = \gamma = \delta = \varepsilon = \frac{1}{5}
\]

1/5 is itself a unit fraction, so the inspectability axiom A3 is satisfied trivially.

## Rhind-compatible alternatives (5-axis)

Any quintuple of distinct unit-fraction sums whose total is 1 is admissible. Examples that pass `weightsAreExact5`:

- \(\{1/2,\ 1/4,\ 1/8,\ 1/16,\ 1/16\}\) — cleanliness-dominant
- \(\{1/3,\ 1/4,\ 1/6,\ 1/8 + 1/24,\ 1/8 + 1/24\}\) — three-axis-balanced
- \(\{1/5,\ 1/5,\ 1/5,\ 1/5,\ 1/5\}\) — uniform default

Inadmissible weights raise.

## Uniqueness extension

The four-axis uniqueness theorem extends term-by-term:

A1. Monotonicity: ∂Λ₅/∂x ≥ 0 for x ∈ {C, H, R, F, G}.
A2. Zero-pinning: any axis = 0 ⇒ Λ₅ = 0.
A3. Egyptian inspectable weights: every weight is a finite sum of distinct unit fractions.
A4. Page-curve concavity: ∂²Λ₅/∂t² ≤ 0 over the release lifetime when each axis evolves monotonically.

A1+A2 force a product of monotonic powers; A3 fixes the rationals; A4 is satisfied iff exponents sum to 1. The unique form is the weighted geometric mean Λ₅ = ∏ xᵢ^wᵢ with ∑ wᵢ = 1 over the five-axis set {C, H, R, F, G}.

## Bound theorem (v2)

\[
0 \le \Lambda_5 \le \min(C, H, R, F, G) \le \max(C, H, R, F, G) \le 1
\]

Same proof as the four-axis bound: weighted GM ≤ weighted AM ≤ max axis, and weighted GM ≥ min axis when weights sum to 1.

## Backward compatibility

The four-axis API (`lutarInvariant`, `defaultWeights`, `verifyLutarBound`) is unchanged. The five-axis form is exposed as `lutarInvariant5`, `defaultWeights5`, `verifyLutarBound5`. Existing 18 axiom tests still pass; v2 adds 12 new tests for Λ₅ (TS) and 14 (Python) — all green at v4.3.

## Implementation

- TypeScript: `packages/invariant/src/lutar-invariant.ts` adds `LutarAxes5`, `LutarWeights5`, `LutarReport5`, `defaultWeights5`, `lutarInvariant5`, `weightsAreExact5`, `verifyLutarBound5`.
- Python SDK: `packages/ouroboros-py/ouroboros/invariant.py` adds `LutarAxes5`, `LutarWeights5`, `LutarReport5`, `default_weights_5`, `lutar_invariant_5`, `weights_are_exact_5`, `verify_lutar_bound_5`.

## Citation (v2)

Lutar, S. P. (2026). *The Lutar Invariant v2: a five-axis runtime-trust scalar with the Gauß closure axis from least-squares network adjustment.* Ouroboros v4.3 documentation, packages/invariant + packages/gauss.
