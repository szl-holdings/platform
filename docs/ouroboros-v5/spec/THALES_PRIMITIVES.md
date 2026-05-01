# Thales Primitives — Primitives 15 & 16

Stephen P. Lutar, May 2026. v4.2 of the Ouroboros runtime.

## Source

Maor & Jost, Beautiful Geometry, Chapter 1 ("Thales of Miletus"), Princeton University Press. Public chapter PDF: [s10065.pdf](https://assets.press.princeton.edu/chapters/s10065.pdf).

Thales of Miletus (c. 624–546 BCE) gave deductive mathematics two of its earliest gifts:

1. The Cheops Method — finding the height of an unreachable object by similar triangles formed by shadows.
2. The Inscribed-Angle Theorem — every point on a circle subtends the diameter at exactly π/2. Maor & Jost call this "perhaps the first known invariance theorem."

The Lutar runtime treats invariance theorems as runtime trust primitives. Both Thales results carry directly. Together they bring the primitive count from 14 to 16.

## Primitive 15 — Similarity Ratio (Cheops Method)

### Theorem (Thales)

Two right triangles with the same sun angle are similar. If a staff of height h casts a shadow of length s, and a pyramid of height H casts a shadow of length S at the same instant, then

\[ \frac{H}{S} = \frac{h}{s} \quad \Longrightarrow \quad H = h \cdot \frac{S}{s} \]

### Runtime translation

The "staff" is a small reference run that is fully witnessed and anchored. Its trust ratio h/s is known. The "pyramid" is a giant production run we cannot anchor in real time — but we can read its workload S. By Thales, the inferred trust H = h · S / s is exact under the similarity hypothesis. The similarity defect

\[ \delta = \frac{|H_{\text{obs}} - H_{\text{inferred}}|}{H_{\text{inferred}}} \]

measures how much the production triangle has drifted from its reference twin. Three bands:

- δ ≤ 5%: SIMILAR. Production behaves like the reference; inherit the reference's trust.
- 5% < δ ≤ 20%: DEGRADED. Open a similarity ticket, do not gate.
- δ > 20%: BROKEN. The triangles are no longer similar; reference cannot pin production.

### Why this matters

This is the first runtime primitive that lets a small anchored canary stand in for an unanchored fleet. The trust ratio is dimension-free, so it composes across heterogeneous workloads. The bound is a theorem, not a heuristic.

### API

TypeScript:

```ts
import { computeSimilarity, similarityAxis } from "@workspace/reconciliation";

const reading = computeSimilarity(
  { referenceHeight: 1, referenceShadow: 1.57 },  // h, s — Cheops staff
  { observedShadow: 230, observedHeight: 146.5 }, // S, H_obs — pyramid
);
// reading.verdict === "SIMILAR"
// similarityAxis(reading) ≈ 1
```

Python:

```python
from ouroboros import compute_similarity, ThalesReference, ThalesObservation, similarity_axis

r = compute_similarity(
    ThalesReference(reference_height=1, reference_shadow=1.57),
    ThalesObservation(observed_shadow=230, observed_height=146.5),
)
```

## Primitive 16 — Inscribed-Angle Locus

### Theorem (Thales, generalised)

Let C be a circle and AB a chord of C. Every point P on the major arc subtends AB at the same angle α; every point on the minor arc subtends AB at 180° − α. Special case: if AB is a diameter then α = 90° at every point on the circle.

The locus of all points from which AB subtends a constant angle is itself an arc of a circle (the converse, also due to the same theorem family).

### Runtime translation

A handoff between two services is a "chord" in observation space. Every honest witness on the same trust locus must observe the chord at the same subtended angle. The locus reading

\[ \text{maxDev} = \max_i |\theta_i - \tilde\theta| \]

is the worst per-witness deviation from the median angle. Three bands:

- maxDev ≤ 1°: ON_LOCUS. All witnesses agree; handoff is on-circle.
- 1° < maxDev ≤ 5°: DRIFT. Investigate; one witness is moving.
- maxDev > 5°: OFF_LOCUS. At least one witness is off the trust circle. Quarantine.

### Why this matters

Frustum reconciliation (primitive 11) verifies set equality across three witnesses; it answers "do they see the same released bits?" The inscribed-angle locus answers a complementary, stronger question: "do they see the same handoff at the same geometric angle?" Two witnesses can agree on the bits while standing on different circles. The angle test detects the drift that set comparison misses.

This is also the runtime's first primitive whose unit is geometric (radians), which means it composes naturally with future primitives that describe phase or coupling. It is the foundation for a future axis 17 ("phase locus") if needed.

### API

TypeScript:

```ts
import { verifyInscribedAngle, unitDiameter, locusAxis } from "@workspace/reconciliation";

const witnesses = [
  { id: "rekor",  point: { x: Math.cos(0.5), y: Math.sin(0.5) } },
  { id: "ct-log", point: { x: Math.cos(1.0), y: Math.sin(1.0) } },
  { id: "anchor", point: { x: Math.cos(2.0), y: Math.sin(2.0) } },
];
const report = verifyInscribedAngle(witnesses, unitDiameter());
// report.verdict === "ON_LOCUS"
// report.medianAngle ≈ π/2
// locusAxis(report) ≈ 1
```

Python:

```python
import math
from ouroboros import verify_inscribed_angle, unit_diameter, WitnessOnCircle, Point2D, locus_axis

witnesses = [
    WitnessOnCircle(id="rekor",  point=Point2D(math.cos(0.5), math.sin(0.5))),
    WitnessOnCircle(id="ct-log", point=Point2D(math.cos(1.0), math.sin(1.0))),
    WitnessOnCircle(id="anchor", point=Point2D(math.cos(2.0), math.sin(2.0))),
]
report = verify_inscribed_angle(witnesses, unit_diameter())
```

## Bound theorems

For Primitive 15 (similarity), with valid reference (h, s > 0) and observation (S ≥ 0):

- Trust ratio h/s is fixed by the reference; independent of S. Proof: division.
- Inferred height is h · S / s. Bound: H_inferred ∈ [0, ∞) is monotone non-decreasing in S.
- Similarity defect δ ∈ [0, ∞) is zero iff H_obs = H_inferred. Proof: definition of absolute value.
- Axis output similarity_axis(reading) ∈ [0, 1]. Bound: clamped to [0, 1] by construction.

For Primitive 16 (inscribed angle), with ≥ 3 witnesses and a non-degenerate chord:

- Subtended angle θ_i = |atan2(cross, dot)| ∈ [0, π]. Bound: range of atan2 is (−π, π], absolute value lands in [0, π].
- maxDev ≥ 0. Bound: it is a max of non-negative deviations.
- Axis output locus_axis(report) ∈ [0, 1]. Bound: clamped to [0, 1] by construction.
- Thales' classical case: every point on the circle subtends the diameter at exactly π/2. Verified by test (`thales.test.ts`: "Thales' classical theorem").

## Lutar Invariant — optional fifth axis

The Lutar Invariant Λ remains four-axis by default (C, H, R, F). The Thales primitives plug into the existing axes:

- similarityAxis(reading) → contributes to Cleanliness (C). It bounds the trust an anchored canary can lend to an unanchored fleet.
- locusAxis(report) → contributes to Frustum (F). It refines the three-witness Jaccard with a per-witness geometric angle check.

Operators who want them treated as a separate axis can configure a five-axis Λ by passing weights that sum to 1 and remain Egyptian-inspectable:

\[ \Lambda_5 = C^{1/5} \cdot H^{1/5} \cdot R^{1/5} \cdot F^{1/5} \cdot T^{1/5} \]

with each weight 1/5 expressible as a single unit fraction (Egyptian-exact). The bound theorem generalises: 0 ≤ Λ_5 ≤ min axis ≤ 1.

## Citations

- Maor, E. and Jost, E. (2014). Beautiful Geometry, Chapter 1: Thales of Miletus. Princeton University Press. [Chapter PDF](https://assets.press.princeton.edu/chapters/s10065.pdf).
- Lutar, S. P. (2026). Ouroboros Thesis v4: Closed-Loop Runtime Trust with the Lutar Invariant. [Zenodo DOI: 10.5281/zenodo.19934129](https://doi.org/10.5281/zenodo.19934129) (v2; v4 minting per IP_ROADMAP.md).

## Tests

TypeScript: `packages/reconciliation/test/thales.test.ts` — 21 tests.
Python: `packages/ouroboros-py/tests/test_thales.py` — 18 tests.
Total Thales coverage: 39 tests across both languages, including the classical Thales theorem as a numerical fixture (every point on the unit circle subtends the diameter at π/2 ± 1e-9).
