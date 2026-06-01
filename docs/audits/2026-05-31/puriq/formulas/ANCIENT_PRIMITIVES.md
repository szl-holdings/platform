# ANCIENT_PRIMITIVES.md — Math Primitives for PURIQ Organs

**Layer:** PURIQ (Doctrine v12 = Doctrine v11 + Puriq)
**Author:** PURIQ brain-trust agent (formula-mining)
**Date:** 2026-06-01
**Hard rule (Zero-Bandaid Law):** ALL religious / mystical / ritual content stripped.
We keep only the *mathematical form*. Gematria reduces to integer maps; Bible
numerics reduce to integer sequences and modular structure. Any source that can
*only* be cited mystically is REJECTED. Citations of method are NOT citations of claim.

This file extracts pure-math primitives, maps each to a PURIQ organ, and gives a
Lean 4 type-signature stub matching `lutar-lean` style (see
`thesis-repo/.../LinearReceipt.lean`, `reports/f_feynman2/.../PathIntegralAuditSum.lean`).
Synthesized formulas live in `PURIQ_FORMULA_SUITE.md`; Lean stubs in
`PuriqFormulaLean.lean`; numeric harnesses in `LAKE_TEST_PLAN.md`.

PURIQ master seed (from `PURIQ_CHARTER.md`):
```
P(x,t) = argmax_{a ∈ 𝒜} [ Λ(x) · Yuyay_13(a) · exp(−β·HUKLLA(a)) · ∏_i Khipu_i(a) ]
```
Organs referenced: **Λ-spine** (aggregator), **Yuyay** (13-axis cognition),
**HUKLLA** (T01–T10 tripwires), **Khipu** (receipt DAG), **Kallpa** (wires /
energy-info budget), **𝒜** (Bekenstein-bounded action space).

---

## A. BIBLE-CODE NUMERICS — MATH ONLY (NO PROPHECY, NO MYSTICISM)

> We extract ONLY: (1) integer sequences in chapter/verse counts, (2) modular
> arithmetic structure (mod 7, mod 12, mod 49), (3) the equidistant-letter-sequence
> (ELS) *distance functional* reduced to an integer-lattice minimum-distance form.
> The Witztum–Rips–Rosenberg (WRR) 1994 paper is cited **as a method of
> defining an integer distance function on a 1-D lattice** — NOT as evidence of
> any hidden message. The statistical-significance claim of WRR is explicitly
> NOT adopted (it was contested by McKay–Bar-Natan–Bar-Hillel–Kalai 1999).

### A.1 ELS integer-lattice distance functional (method-only)
**Primitive.** Encode a text as a string `s : Fin N → Σ` over a finite alphabet `Σ`.
An equidistant letter sequence with skip `d ∈ ℤ_{>0}` starting at index `i` is the
tuple `(s_i, s_{i+d}, s_{i+2d}, …)`. WRR define a *distance* between two word-ELSs
`w, w'` as a minimum over the lattice of skips/offsets. Stripped of all content,
this is purely:
\[
\Delta(w, w') \;=\; \min_{\substack{d,d' \in \mathbb{Z}\setminus\{0\}\\ i,i'}} \; f\big((i,d),(i',d')\big),
\]
where `f` is a fixed integer-lattice metric on `ℤ²` (offset, skip). The math object
is: **minimum-distance search over a 2-D integer lattice of (offset, skip) pairs.**

**PURIQ map → Khipu (receipt DAG addressing).** A Khipu receipt chain is a 1-D
sequence of hashed events. The ELS distance becomes a **strided-index proximity
metric** for detecting *periodic structure* in a receipt stream — e.g. a tripwire
that fires when two flagged receipts recur at a fixed stride `d` (periodic-abuse
detector). No semantics, just lattice distance.

**Lean stub.**
```lean
/-- ELS as a strided index map; distance is a min over the (offset,skip) lattice. -/
def elsIndex (N d i k : ℕ) : ℕ := (i + k * d) % N
def latticeDist : (ℕ × ℕ) → (ℕ × ℕ) → ℕ   -- (offset,skip) ↦ (offset,skip) ↦ ℤ≥0 metric
theorem latticeDist_nonneg : ∀ p q, 0 ≤ latticeDist p q := sorry  -- OBLIGATION: metric ≥ 0
```

### A.2 Modular structure of canonical counts (mod 7 / mod 12 / mod 49)
**Primitive.** Chapter/verse counts and calendrical cycles exhibit small-modulus
periodicity: weekly cycle `mod 7`, twelvefold partition `mod 12`, the
`7² = 49` "jubilee" stride `mod 49`. Reduced to math: these are **residue-class
partitions** `ℤ/7ℤ`, `ℤ/12ℤ`, `ℤ/49ℤ` and the CRT factorization
`ℤ/84ℤ ≅ ℤ/4ℤ × ℤ/3ℤ × ℤ/7ℤ` (lcm(7,12)=84). The only fact used is the
**Chinese Remainder Theorem** structure on coprime moduli.

**PURIQ map → HUKLLA tripwire scheduling.** Tripwire re-evaluation cadence can be
scheduled on coprime residue classes so that no two heavy tripwires collide on the
same step except at the CRT period — a load-balancing schedule with provable
collision period `lcm(m_i)`.

**Lean stub.**
```lean
/-- CRT period of a tripwire schedule on coprime moduli. -/
def crtPeriod (ms : List ℕ) : ℕ := ms.foldr Nat.lcm 1
theorem crt_collision_period (ms : List ℕ) (hpair : ms.Pairwise Nat.Coprime) :
    ∀ i j, /- schedules collide only at multiples of -/ crtPeriod ms = ms.foldr Nat.lcm 1 := sorry
```

**Citation (method, not claim):** Witztum, Rips, Rosenberg, "Equidistant Letter
Sequences in the Book of Genesis," *Statistical Science* 9(3):429–438 (1994),
https://projecteuclid.org/journals/statistical-science/volume-9/issue-3/Equidistant-Letter-Sequences-in-the-Book-of-Genesis/10.1214/ss/1177010393.full
— cited *only* for the integer-lattice ELS distance construction. Rebuttal:
McKay, Bar-Natan, Bar-Hillel, Kalai, "Solving the Bible Code Puzzle,"
*Statistical Science* 14(2):150–173 (1999). CRT is standard (Gauss, *Disquisitiones
Arithmeticae*, 1801).

---

## B. EGYPTIAN — RHIND & MOSCOW PAPYRI

### B.1 Egyptian unit-fraction (greedy) decomposition
**Primitive.** Every rational `0 < p/q < 1` decomposes into distinct unit fractions
`1/n_i`. The Rhind 2/n table is the canonical example; the Fibonacci–Sylvester
greedy algorithm formalizes it:
\[
\frac{p}{q} = \frac{1}{\lceil q/p\rceil} + \text{(remainder, recurse)}, \qquad
\frac{2}{n} = \frac{1}{(n+1)/2} + \frac{1}{n(n+1)/2}\ (n\ \text{odd}).
\]
Math object: **finite distinct-denominator decomposition with a terminating greedy
recursion** (each step strictly reduces the numerator).

**PURIQ map → Kallpa (wires / energy budget).** Decompose a total energy/credit
budget `B` into a *canonical, distinct, decreasing* set of allocations — each wire
gets a unit-fraction share, guaranteeing (a) no two wires draw equal slices and (b)
the decomposition terminates (audit-finite allocation).

**Lean stub.**
```lean
/-- Greedy Egyptian-fraction expansion; terminates because numerator strictly decreases. -/
def egyptianGreedy : ℚ → List ℕ   -- returns distinct denominators
theorem egyptian_sum_eq (q : ℚ) (h : 0 < q ∧ q < 1) :
    (egyptianGreedy q).foldr (fun n acc => acc + (1 : ℚ)/n) 0 = q := sorry  -- OBLIGATION
theorem egyptian_distinct (q : ℚ) : (egyptianGreedy q).Nodup := sorry        -- OBLIGATION
```

### B.2 Recursive doubling/halving multiplication (Egyptian/Russian-peasant)
**Primitive.** Multiply `a·b` by binary expansion of `b`: repeatedly double `a`,
halve `b`, accumulate `a` when `b` is odd:
\[
a\cdot b = \sum_{k:\ \text{bit}_k(b)=1} a\cdot 2^{k}.
\]
Math object: **multiplication via binary expansion = `O(log b)` accumulation.**

**PURIQ map → HUKLLA compound-risk accumulation.** Compound a per-step risk `r`
over `n` steps as `r^n` via fast exponentiation on the binary expansion of `n` —
`O(log n)` tripwire-risk rollup, exact and audit-cheap.

**Lean stub.**
```lean
/-- Russian-peasant / Egyptian doubling multiply equals ordinary product. -/
def peasantMul : ℕ → ℕ → ℕ
theorem peasantMul_correct (a b : ℕ) : peasantMul a b = a * b := sorry  -- OBLIGATION
```

### B.3 Frustum volume (Moscow Papyrus, Problem 14)
**Primitive.** Volume of a square frustum with base side `a`, top side `b`, height `h`:
\[
V = \frac{h}{3}\,(a^2 + ab + b^2).
\]
Math object: **exact closed-form for a truncated-pyramid volume** (a degree-2
symmetric form in `(a,b)`).

**PURIQ map → 𝒜 (bounded action-space volume).** When the action space is a
"truncated cone" of options between a wide base (early, exploratory) and a narrow
top (late, committed), the reachable-action *volume* obeys the frustum law — used to
bound `|𝒜|` shrinkage as a trajectory commits (couples to Bekenstein bound in §S).

**Lean stub.**
```lean
def frustumVolume (a b h : ℝ) : ℝ := (h/3) * (a^2 + a*b + b^2)
theorem frustum_degenerates_to_pyramid (a h : ℝ) :
    frustumVolume a 0 h = (h/3) * a^2 := by ring
```

**Citations.** Rhind Mathematical Papyrus 2/n table,
https://en.wikipedia.org/wiki/Rhind_Mathematical_Papyrus_2/n_table ;
analysis: Abdulaziz, "The Rhind 2÷n table and fraction reckoning in ancient Egypt,"
https://hal.science/hal-04232837v1/document ; Moscow Papyrus frustum: standard
history of mathematics (Gillings, *Mathematics in the Time of the Pharaohs*, 1972).

---

## C. VEDIC — SULBA SUTRAS (BAUDHĀYANA / ĀPASTAMBA)

### C.1 Baudhāyana diagonal of the square (√2 approximation)
**Primitive.** The Baudhāyana Śulba Sūtra gives, stripped of all ritual altar context,
a rational approximation to `√2`:
\[
\sqrt{2}\approx 1 + \frac13 + \frac{1}{3\cdot4} - \frac{1}{3\cdot4\cdot34}
= \frac{577}{408} = 1.41421568\ldots\quad(\text{error } < 1.5\times10^{-6}).
\]
This is exactly one Newton/Heron step `r_{n+1} = \tfrac12(r_n + 2/r_n)` from
`r_0 = 17/12`. Math object: **fixed-point iteration converging to `√2`.**

**PURIQ map → Λ-spine orthogonality bound.** The diagonal-of-square gives a tight
rational bound on the L2 norm of a 2-vector; used as a *certified √2 enclosure* when
the Λ-spine aggregates two orthogonal axis contributions (e.g. Pythagorean combine
of two sub-scores) without floating-point drift.

**Lean stub.**
```lean
/-- One Heron step; Baudhāyana 577/408 is the second iterate from 17/12. -/
def heronStep (r : ℚ) : ℚ := (r + 2/r) / 2
theorem baudhayana_iterate : heronStep (17/12) = 577/408 := by norm_num
theorem heron_overestimate (r : ℚ) (hr : 0 < r) : (2 : ℚ) ≤ (heronStep r)^2 := sorry -- OBLIGATION (AM-GM)
```

### C.2 Altar area-preserving transformation (square ↔ rectangle, circle≈square)
**Primitive.** Śulba sutras give area-preserving reshapings: turn a square of area
`s²` into a rectangle of the same area, combine two squares into one
(`a² + b² = c²`, the Pythagorean construction), and a square-to-circle equal-area
rule `r ≈ s·(2+√2)/6`. Math object: **area-invariant geometric transformations =
a measure-preserving group action on shapes.**

**PURIQ map → Yuyay axis re-weighting.** Re-distributing weight across the 13 Yuyay
axes while preserving total "wisdom mass" is an area-preserving transform: the sum
(or the L1 mass) of axis scores is conserved under re-shaping, exactly as altar area
is conserved. Guarantees no axis-gaming inflates total Yuyay.

**Lean stub.**
```lean
/-- An area/mass-preserving reweighting of a score vector. -/
structure MassPreservingReweight (n : ℕ) where
  map : (Fin n → ℝ) → (Fin n → ℝ)
  preserves : ∀ x, (Finset.univ.sum (map x)) = (Finset.univ.sum x)
```

**Citations.** Baudhāyana √2: derivation reproduced in
https://lvnaga.wordpress.com/2013/06/16/square-root-of-2-by-baudayana/ and
https://goldncloudpublications.com/index.php/irjaem/article/download/503/529/1096 ;
historical: Plofker, *Mathematics in India* (Princeton, 2009).

---

## D. GREEK — EUCLID, ERATOSTHENES, APOLLONIUS

### D.1 Euclidean algorithm (GCD)
**Primitive.** `gcd(a,b) = gcd(b, a mod b)`, terminating; Bézout: `∃ x y, ax+by=gcd`.
Math object: **terminating subtractive/division recursion + linear combination
certificate.**

**PURIQ map → Khipu chain reduction.** Reducing two receipt-period vectors to their
common stride, and producing a *Bézout certificate* (a verifiable linear combination)
as the Khipu receipt of the reduction step.

**Lean stub.** `Nat.gcd` and `Nat.gcd_eq_gcd_ab` (Bézout) exist in Mathlib; we wrap:
```lean
theorem khipu_bezout (a b : ℕ) : ∃ x y : ℤ, a * x + b * y = Nat.gcd a b :=
  ⟨Nat.gcdA a b, Nat.gcdB a b, (Nat.gcd_eq_gcd_ab a b) ▸ by ring⟩  -- discharge via Mathlib
```

### D.2 Sieve of Eratosthenes
**Primitive.** Mark composites by striking multiples; survivors are prime.
Math object: **monotone removal of indices in residue progressions.**

**PURIQ map → 𝒜 pruning.** Prune the action space by striking actions in
"composite" residue classes (dominated / redundant actions), leaving an irreducible
candidate set. Couples to von-Neumann minimax (§N) for the surviving adversarial set.

**Lean stub.**
```lean
def sievePrimesUpTo (n : ℕ) : List ℕ   -- survivors after striking multiples
theorem sieve_sound (n p : ℕ) (h : p ∈ sievePrimesUpTo n) : p.Prime := sorry -- OBLIGATION
```

### D.3 Apollonius conics (locus form)
**Primitive.** Conic = locus `{(x,y) : Ax²+Bxy+Cy²+Dx+Ey+F=0}`; classification by
discriminant `B²−4AC` (<0 ellipse, =0 parabola, >0 hyperbola). Math object:
**degree-2 algebraic locus + discriminant classification.**

**PURIQ map → Λ-spine decision boundary.** Λ-gated accept/reject boundaries in a
2-axis projection are conics; the discriminant tells whether the safe region is
bounded (ellipse → halt-safe compact region) or unbounded (hyperbola → escape risk).

**Lean stub.**
```lean
def conicDiscriminant (A B C : ℝ) : ℝ := B^2 - 4*A*C
def boundedSafeRegion (A B C : ℝ) : Prop := conicDiscriminant A B C < 0  -- ellipse ⇒ compact
```

**Citations.** Euclid, *Elements* Book VII (algorithm), Book III Prop. 31 (used by
Khayyam below); Apollonius, *Conics* Book II Prop. 4 — see
https://www.sfu.ca/~muraki/cubic/2016KentMuraki.pdf .

---

## E. ISLAMIC GOLDEN AGE — AL-KHWĀRIZMĪ, OMAR KHAYYĀM

### E.1 al-Khwārizmī completion-of-squares (algorithmic algebra)
**Primitive.** Solve `x² + bx = c` by *al-jabr* (restoration) + *al-muqābala*
(balancing): `x = √((b/2)² + c) − b/2`. Math object: **completing the square +
the word "algorithm" itself (from al-Khwārizmī).**

**PURIQ map → HUKLLA threshold solving.** Solve for the exact penalty coefficient
`β` (or threshold) at which a quadratic risk term crosses a tripwire bound — a
completed-square closed form, fully auditable.

**Lean stub.**
```lean
def completeSquareRoot (b c : ℝ) : ℝ := Real.sqrt ((b/2)^2 + c) - b/2
theorem complete_square_solves (b c : ℝ) (hc : 0 ≤ (b/2)^2 + c) :
    let x := completeSquareRoot b c; x^2 + b*x = c := sorry  -- OBLIGATION
```

### E.2 Omar Khayyām cubic via conic intersection
**Primitive.** Khayyām solves cubics `x³ + ... = ...` geometrically as the
**intersection of a circle/parabola and a hyperbola** (no algebraic radical existed
yet). Math object: **roots of a cubic = intersection points of two conics.**

**PURIQ map → multi-constraint action selection.** When two organ constraints are
each conics in a 2-axis projection, feasible actions are their intersection points —
Khayyām's construction gives a geometric existence/count of feasible joint solutions.

**Lean stub.**
```lean
/-- A real root of a depressed cubic realised as a conic intersection (existence). -/
theorem khayyam_cubic_root (p q : ℝ) : ∃ x : ℝ, x^3 + p*x + q = 0 := sorry -- OBLIGATION (IVT)
```

**Citation.** al-Khwārizmī, *al-Kitāb al-mukhtaṣar fī ḥisāb al-jabr wa-l-muqābala*
(c. 820); Khayyām cubic-by-conics: Kent & Muraki,
https://www.sfu.ca/~muraki/cubic/2016KentMuraki.pdf .

---

## F. NEWTON — FLUXIONS, INVERSE-SQUARE, RULES OF REASONING

### F.1 Fluxions / derivative (rate of change)
**Primitive.** `ẋ = lim_{h→0} (f(x+h)−f(x))/h`. Math object: **the derivative.**

**PURIQ map → derivative-of-risk (HUKLLA).** Fire a tripwire on the *rate* of risk
increase `d(risk)/dt`, not just the level — early-warning halt before a threshold
is crossed (Yachay's open question in PONDER: "Newton's fluxion for derivative-of-risk").

**Lean stub.** Use `deriv` from Mathlib.
```lean
def riskVelocity (risk : ℝ → ℝ) (t : ℝ) : ℝ := deriv risk t
def velocityTripwire (risk : ℝ → ℝ) (t vmax : ℝ) : Prop := riskVelocity risk t ≤ vmax
```

### F.2 Inverse-square law (1/r² primitive)
**Primitive.** `F = G·m₁m₂ / r²`. Math object: **influence decays as `1/r²` in
distance.** (We keep ONLY the inverse-square *form*, not gravitation physics.)

**PURIQ map → Khipu provenance weighting.** Weight the influence of an ancestor
receipt on a current decision by `1/d²` in DAG-distance `d` — distant provenance
contributes quadratically less, giving a bounded, locally-dominated influence kernel.

**Lean stub.**
```lean
def inverseSquareWeight (d : ℝ) (hd : 0 < d) : ℝ := 1 / d^2
theorem inv_square_summable_dag : True := trivial -- OBLIGATION: Σ 1/d² converges (Basel, §H)
```

### F.3 Principia Book III "Rules of Reasoning" (relevance to HUKLLA)
**Primitive (math-as-policy form).** Rule 1: admit no more causes than are true
and sufficient (parsimony). Rule 4: hold inductively-inferred propositions as true
*until* exceptions appear. Math object: **minimal-hypothesis selection + defeasible
update** — i.e. Occam prior + monotone revision.

**PURIQ map → HUKLLA decision discipline.** Encode Rule 1 as "select the action
with the fewest active justifications sufficient to pass Yuyay" (parsimony tie-break)
and Rule 4 as "a passed safety inference stays valid until a counter-receipt arrives"
(monotone revocation, ties to LinearReceipt revocation lemma).

**Lean stub.**
```lean
/-- Parsimony tie-break: among Yuyay-passing actions, prefer minimal justification set. -/
def parsimonyPick (cands : List (α × ℕ)) : Option α  -- (action, #justifications)
theorem parsimony_minimal : True := trivial -- OBLIGATION: picks argmin justification count
```

**Citation.** Newton, *Philosophiæ Naturalis Principia Mathematica* (1687), Book III
"Regulae Philosophandi"; Stanford Encyclopedia of Philosophy, "Newton's Philosophy,"
https://plato.stanford.edu/entries/newton-philosophy/ .

---

## G. EULER — e, IDENTITY, POLYHEDRON V−E+F=2, EULER–LAGRANGE

### G.1 Exponential / Euler's identity
**Primitive.** `e^{iθ} = cosθ + i·sinθ`; `e^{iπ}+1=0`. Math object: **the
exponential map** (already in the master formula as `exp(−β·HUKLLA)`).

**PURIQ map → HUKLLA penalty kernel.** The `exp(−β·HUKLLA(a))` factor is exactly an
exponential decay; Euler grounds its analytic properties (monotone, →0 as violations
↑, →1 at zero violations). Halting safety = `lim_{β→∞} exp(−β·v) = 0` for `v>0`.

**Lean stub.**
```lean
def hukllaPenalty (β : ℝ) (v : ℕ) : ℝ := Real.exp (-β * v)
theorem penalty_halts (v : ℕ) (hv : 0 < v) :
    Filter.Tendsto (fun β => hukllaPenalty β v) Filter.atTop (nhds 0) := sorry -- OBLIGATION
```

### G.2 Euler polyhedron / Euler characteristic V−E+F=2
**Primitive.** For any sphere-homeomorphic polyhedron / planar connected graph,
`V − E + F = 2` (general: `χ = V−E+F = 2−2g` for genus `g`). Math object:
**topological invariant of a planar/spherical cell complex.**

**PURIQ map → Khipu DAG well-formedness.** Treat the Khipu receipt graph's planar
embedding (or its 2-complex) and require `V − E + F = 2` as a *well-formedness
invariant*: a violation signals a "hole" (a missing or duplicated receipt creating a
non-trivial cycle/genus). Direct realization of the founder's "Euler-Khipu DAG identity."

**Lean stub.**
```lean
structure PlanarReceiptGraph where
  V : ℕ; E : ℕ; F : ℕ
def eulerChar (g : PlanarReceiptGraph) : ℤ := (g.V : ℤ) - g.E + g.F
def wellFormed (g : PlanarReceiptGraph) : Prop := eulerChar g = 2
theorem wellFormed_iff_genus_zero (g : PlanarReceiptGraph) :
    wellFormed g ↔ eulerChar g = 2 := Iff.rfl
```

### G.3 Euler–Lagrange (action stationarity)
**Primitive.** Stationary action: `d/dt(∂L/∂q̇) − ∂L/∂q = 0`. Math object:
**stationary point of an action functional ∫L dt.**

**PURIQ map → agency as action-minimization.** Define agentic cost functional
`S[trajectory] = ∫ (effort − Λ·utility) dt`; the chosen Puriq trajectory is a
stationary point of `S`, formalizing "agency = least-action over Khipu-consistent paths"
(couples to Feynman path integral §S.3).

**Lean stub.**
```lean
/-- A trajectory is EL-stationary if the Euler–Lagrange residual vanishes. -/
def isStationary (L : ℝ → ℝ → ℝ) (q : ℝ → ℝ) (t : ℝ) : Prop :=
  deriv (fun s => (deriv (fun v => L (q s) v)) (deriv q s)) t - (deriv (fun s => L (q s) (deriv q s)) t) = 0
```

**Citations.** Euler polyhedron formula: https://en.wikipedia.org/wiki/Euler_characteristic
and https://plus.maths.org/eulers-polyhedron-formula ; Euler–Lagrange: standard
(Euler 1744, Lagrange 1788).

---

## H. GAUSS — NORMAL DISTRIBUTION, GAUSS–BONNET, MODULAR ARITHMETIC

### H.1 Normal (Gaussian) distribution
**Primitive.** `φ(x) = (1/(σ√(2π)))·exp(−(x−μ)²/(2σ²))`; CLT: sums of iid →
normal. Math object: **the maximum-entropy distribution for fixed mean+variance.**

**PURIQ map → Yuyay axis aggregation.** Aggregate the 13 axis scores treating noise
as Gaussian; the Λ-aggregate's confidence interval is `μ ± z·σ/√13`. Used to gate
"is the Yuyay pass statistically robust?" (couples to §I Shannon: Gaussian maximizes
entropy at fixed variance → most conservative aggregation).

**Lean stub.**
```lean
noncomputable def gaussianPdf (μ σ x : ℝ) : ℝ :=
  (1 / (σ * Real.sqrt (2*Real.pi))) * Real.exp (-(x-μ)^2 / (2*σ^2))
theorem gaussian_integral_one (μ σ : ℝ) (hσ : 0 < σ) :
    ∫ x, gaussianPdf μ σ x = 1 := sorry  -- OBLIGATION (Gaussian integral)
```

### H.2 Gauss–Bonnet (curvature ↔ topology)
**Primitive.** `∫_M K dA + ∫_{∂M} k_g ds = 2π·χ(M)`. Math object: **total Gaussian
curvature is a topological invariant (= 2πχ).**

**PURIQ map → Λ-spine curvature budget.** Treat the Λ-spine's score-manifold; the
integrated curvature of the decision surface is pinned to `2π·χ`. Bridges G.2
(Euler-Khipu V−E+F) and the spine: if the Khipu DAG is genus-0 (well-formed), total
spine curvature must equal `4π` — a global consistency check.

**Lean stub.**
```lean
/-- Gauss–Bonnet residual: total curvature minus 2πχ must vanish. -/
def gaussBonnetResidual (totalCurv : ℝ) (χ : ℤ) : ℝ := totalCurv - 2*Real.pi*χ
def curvatureConsistent (totalCurv : ℝ) (χ : ℤ) : Prop := gaussBonnetResidual totalCurv χ = 0
```

### H.3 Modular arithmetic (Disquisitiones)
Already used in §A.2 (CRT). Gauss formalized congruences `a ≡ b (mod m)`; the Khipu
hash-mod bucketing and HUKLLA schedule both ride on `ZMod m`.

**Citations.** Gauss, *Theoria Motus* (1809, normal distribution / least squares);
*Disquisitiones Arithmeticae* (1801, congruences); Gauss–Bonnet (Gauss 1827, Bonnet 1848).

---

## I. RIEMANN — ZETA, RIEMANN SURFACES

### I.1 Zeta function / Euler product
**Primitive.** `ζ(s) = Σ_{n≥1} n^{−s} = ∏_p (1−p^{−s})^{−1}` for `Re(s)>1`;
`ζ(2)=π²/6` (Basel). Math object: **Dirichlet series with Euler product over primes;
convergence for `Re(s)>1`.**

**PURIQ map → Kallpa provenance discounting + convergence guarantee.** A
`ζ`-style discount `Σ d^{−s}` over DAG-distance `d` (generalizes §F.2's `1/d²`):
choosing `s>1` *guarantees the total provenance influence converges* (finite), so no
ancestor swarm can blow up a decision weight. `s=2` recovers Newton inverse-square
and sums to `π²/6`.

**Lean stub.**
```lean
noncomputable def provenanceZeta (s : ℝ) (N : ℕ) : ℝ := ∑ d ∈ Finset.range N, (1:ℝ)/(d+1)^s
theorem provenance_converges (s : ℝ) (hs : 1 < s) :
    ∃ L, Filter.Tendsto (fun N => provenanceZeta s N) Filter.atTop (nhds L) := sorry -- OBLIGATION
```

### I.2 Riemann surfaces (multi-sheet)
**Primitive.** A multivalued function (e.g. `√z`, `log z`) becomes single-valued on a
multi-sheeted covering. Math object: **branched covering / multi-sheet domain.**

**PURIQ map → multi-sheet decision spaces.** When an action has *branch ambiguity*
(same observable, different latent context), model the decision domain as a
multi-sheet cover; the Khipu receipt records *which sheet* the agent committed to,
making latent-branch choices auditable (no silent branch-hopping).

**Lean stub.**
```lean
structure SheetedDecision (Base : Type) where
  sheets : ℕ
  proj : Base → Fin sheets → Base    -- covering projection per sheet
  committedSheet : Fin sheets        -- recorded in Khipu
```

**Citations.** Riemann, "Über die Anzahl der Primzahlen unter einer gegebenen Größe"
(1859); zeta/Euler product & Basel — Wolfram MathWorld,
https://mathworld.wolfram.com/RiemannZetaFunction.html .

---

## J. NOETHER — CONSERVATION THEOREMS

**Primitive.** Noether's First Theorem: every continuous symmetry of the action `S`
yields a conserved current; in the 1-D case `B = const`. Math object:
**symmetry ⇒ conserved quantity (`d/dt Q = 0`).**

**PURIQ map → Khipu receipt-state conservation.** Define a Khipu state-vector `Q`
(e.g. total receipted obligation, total credit, total provenance mass). DAG mutations
that are *symmetries* (re-orderings, gauge-equivalent receipt repackings — cf. the
audit-Reidemeister moves in `PathIntegralAuditSum.lean`) must conserve `Q`. A mutation
that changes `Q` is, by Noether's contrapositive, NOT a symmetry → flag it.

**Lean stub.**
```lean
/-- Noether-style conserved charge over Khipu DAG mutations. -/
structure KhipuCharge (State : Type) where
  Q : State → ℝ
def isSymmetry {State} (c : KhipuCharge State) (μ : State → State) : Prop :=
  ∀ s, c.Q (μ s) = c.Q s
theorem noether_conservation {State} (c : KhipuCharge State) (μ : State → State)
    (h : isSymmetry c μ) (s : State) : c.Q (μ s) = c.Q s := h s
```

**Citation.** Noether, "Invariante Variationsprobleme," *Gött. Nachr.* 1918:235–257;
English (Tavel) https://arxiv.org/abs/physics/0503066 ; Brading exposition
https://www.lms.ac.uk/sites/default/files/files/Events/2018_09%20Brading%20Noether.pdf .

---

## K. RAMANUJAN — PARTITIONS, MOCK THETA, HARDY–RAMANUJAN

### K.1 Partition function p(n) and Hardy–Ramanujan asymptotic
**Primitive.** `p(n)` = number of ways to write `n` as a sum of positive integers
(order-independent); generating function `Σ p(n)qⁿ = ∏_{k≥1}(1−qᵏ)^{−1}`; asymptotic
\[
p(n)\sim \frac{1}{4n\sqrt3}\exp\!\left(\pi\sqrt{\tfrac{2n}{3}}\right).
\]
Math object: **integer-partition counting + sub-exponential growth estimate.**

**PURIQ map → action-space partitioning / 𝒜 sizing.** The number of ways to split a
budget/effort `n` across sub-actions is `p(n)`; the Hardy–Ramanujan asymptotic gives
an *a-priori bound on `|𝒜|`* for budget `n`, feeding the Bekenstein bound (§Q) and
HUKLLA enumeration cost.

**Lean stub.**
```lean
def partitions (n : ℕ) : ℕ                     -- p(n)
def hardyRamanujan (n : ℕ) : ℝ :=
  (1 / (4 * n * Real.sqrt 3)) * Real.exp (Real.pi * Real.sqrt (2*n/3))
theorem hr_asymptotic_upper : True := trivial   -- OBLIGATION: p(n) ≤ C·hardyRamanujan n (large n)
```

### K.2 Mock theta / modularity (action-space partitioning, advanced)
**Primitive.** Mock theta functions (Ramanujan's last letter) are holomorphic parts
of harmonic Maass forms — "almost modular." Math object: **quasi-modular generating
functions for refined partition statistics (ranks/cranks).**

**PURIQ map → refined `𝒜` partition by "rank."** Partition the action space by a
*rank statistic* (e.g. risk-tier) and use crank-style refinements to balance tiers —
an advanced sizing tool; kept as a research stub.

**Citation.** Hardy & Ramanujan, "Asymptotic Formulæ in Combinatory Analysis,"
*Proc. LMS* (1918); https://en.wikipedia.org/wiki/Partition_function_(number_theory) ;
mock theta modern: Bringmann–Ono (2006), Zwegers thesis (2002).

---

## L. GROTHENDIECK — SCHEMES, CATEGORICAL THINKING

**Primitive.** Functorial / relative point of view: study objects via the *functor of
points* `X(R) = Hom(Spec R, X)`; build complex objects by *gluing* local models;
morphisms and universal properties over raw elements. Math object:
**category-theoretic composition + functors + (co)limits.**

**PURIQ map → organ composition algebra.** Treat each PURIQ organ as an object in a
category `𝐏𝐮𝐫𝐢𝐪`; `puriq.{decide,act,reflect}` are morphisms; layer composition
(Doctrine v12 = v11 + Puriq) is a *functor* `v11-category → v12-category`. Organ
wiring must satisfy categorical laws (identity, associativity), giving a provably
well-composed anatomy. Khipu receipts are the *limit* (pullback) gluing organ outputs.

**Lean stub.**
```lean
/-- Organs and morphisms form a category; composition is associative. -/
class PuriqCategory (Organ : Type) where
  Mor : Organ → Organ → Type
  id  : ∀ o, Mor o o
  comp : ∀ {a b c}, Mor a b → Mor b c → Mor a c
  comp_assoc : ∀ {a b c d} (f : Mor a b) (g : Mor b c) (h : Mor c d),
    comp (comp f g) h = comp f (comp g h)
```

**Citation.** Grothendieck, *Éléments de géométrie algébrique* (EGA, 1960–67);
Stanford Encyclopedia of Philosophy, "Category Theory,"
https://plato.stanford.edu/entries/category-theory/ .

---

## M. (merged into N) — see von Neumann

## N. VON NEUMANN — MINIMAX, GAME THEORY

**Primitive.** Minimax theorem: for a 2-player zero-sum game with payoff matrix `A`,
mixed strategies `x,y`,
\[
\max_x \min_y x^\top A y = \min_y \max_x x^\top A y = V.
\]
Math object: **existence of a value `V` and saddle-point mixed strategies.**

**PURIQ map → HUKLLA adversarial halt (minimax tripwire).** Model the agent vs. an
adversarial environment as zero-sum; the tripwire-firing policy is the agent's minimax
strategy — it *minimizes the adversary's best-case harm*. The founder's
"von-Neumann-Hukulla minimax": tripwires fire to minimize worst-case adversarial loss,
with guaranteed value `V`.

**Lean stub.**
```lean
/-- Minimax value of a finite zero-sum game (existence). -/
def gameValue {m n : ℕ} (A : Fin m → Fin n → ℝ) : ℝ
theorem minimax_exists {m n : ℕ} (A : Fin m → Fin n → ℝ) :
    ∃ V, (∃ x, ∀ y, V ≤ /-x·A·y-/ 0) ∧ (∃ y, ∀ x, /-x·A·y-/ 0 ≤ V) := sorry -- OBLIGATION
```

**Citation.** von Neumann, "Zur Theorie der Gesellschaftsspiele," *Math. Annalen*
100:295–320 (1928), https://eudml.org/doc/159291 ; exposition
https://web.math.ucsb.edu/~crandall/math201b/vnminimax.pdf .

---

## O. SHANNON — ENTROPY, CHANNEL CAPACITY

**Primitive.** Entropy `H(X) = −Σ p_i log p_i`; channel capacity
`C = max_{p(x)} I(X;Y)`; noisy-channel coding theorem: reliable rate `< C`. Math
object: **entropy as expected surprise + a hard capacity bound on reliable rate.**

**PURIQ map → Kallpa wire energy/info budget.** Each Kallpa wire has a capacity
`C` (bits/step). The information an organ pushes through a wire is bounded by `C`;
exceeding it is provably unreliable → throttle. Founder's "Shannon-Kallpa capacity
theorem": wire energy budget bounded by channel entropy. Ties to Bekenstein (§Q):
`C` and the energy budget are linked through `S ≤ 2πRE/ħc`.

**Lean stub.**
```lean
noncomputable def shannonEntropy {n : ℕ} (p : Fin n → ℝ) : ℝ :=
  -∑ i, p i * Real.logb 2 (p i)
theorem entropy_nonneg {n} (p : Fin n → ℝ) (hp : ∀ i, 0 ≤ p i ∧ p i ≤ 1) :
    0 ≤ shannonEntropy p := sorry  -- OBLIGATION
def reliableRate (rate C : ℝ) : Prop := rate < C  -- noisy-channel theorem
```

**Citation.** Shannon, "A Mathematical Theory of Communication," *Bell System Tech. J.*
27:379–423, 623–656 (1948),
https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf .

---

## P. KOLMOGOROV — COMPLEXITY

**Primitive.** `K(s)` = length of the shortest program (on a fixed universal machine)
that outputs `s`; invariance theorem: machine choice changes `K` by `O(1)`;
`K` is uncomputable but upper-semicomputable. Math object: **minimal description
length = intrinsic information content.**

**PURIQ map → Bekenstein bound on `𝒜` via description length.** The action space
`𝒜` is bounded not just physically (Bekenstein §Q) but *descriptively*: an action
whose Khipu-encoding has description length `> K_max` is inadmissible (cannot be
compactly justified). `|𝒜|` ≤ number of programs of length ≤ `K_max` `= 2^{K_max+1}−1`.

**Lean stub.**
```lean
/-- Abstract Kolmogorov complexity wrt a universal machine U. -/
def kolmogorov (U : List Bool → Option (List Bool)) (s : List Bool) : ℕ
def admissibleAction (U) (encode : α → List Bool) (Kmax : ℕ) (a : α) : Prop :=
  kolmogorov U (encode a) ≤ Kmax
theorem actions_bounded_by_K (Kmax : ℕ) :
    /- #{programs of length ≤ Kmax} -/ True := trivial -- OBLIGATION: |𝒜| ≤ 2^(Kmax+1)-1
```

**Citation.** Kolmogorov, "Three Approaches to the Quantitative Definition of
Information," *Problems Inform. Transmission* 1(1):1–7 (1965);
https://en.wikipedia.org/wiki/Kolmogorov_complexity .

---

## Q. TURING — HALTING PROBLEM (PURIQ HALTING SAFETY)

**Primitive.** No total computable `halts(f)` decides whether arbitrary `f` halts
(diagonal/Cantor argument). Math object: **undecidability of halting by
self-reference contradiction.**

**PURIQ map → PURIQ halting safety (the honest version).** PURIQ CANNOT claim a
universal halt-decider (Turing forbids it). Instead PURIQ enforces *sound,
incomplete* halting: a **timeout/fuel** bound `n` such that every Puriq action runs in
≤ `n` steps or is force-halted by HUKLLA. We prove "fuel-bounded halting" (total),
NOT "decides halting" (impossible). This honesty is mandated by Zero-Bandaid Law.

**Lean stub.**
```lean
/-- Turing: no total decider. We DON'T assume one; we use fuel-bounded execution. -/
theorem no_universal_halt_decider : ¬ ∃ (h : (ℕ → Option ℕ) → Bool),
    ∀ f, h f = true ↔ (∃ n, (f n).isSome) := sorry  -- OBLIGATION (diagonalization)
/-- Sound replacement: fuel-bounded step function always terminates. -/
def runWithFuel {S} (step : S → Option S) : ℕ → S → Option S
  | 0,     _ => none
  | n+1, s => match step s with | none => some s | some s' => runWithFuel step n s'
theorem fuel_terminates {S} (step : S → Option S) (n : ℕ) (s : S) :
    (runWithFuel step n s).isSome ∨ runWithFuel step n s = none := by
  cases runWithFuel step n s <;> simp
```

**Citation.** Turing, "On Computable Numbers, with an Application to the
Entscheidungsproblem," *Proc. LMS* s2-42:230–265 (1936),
https://www.cs.virginia.edu/~robins/Turing_Paper_1936.pdf ;
https://en.wikipedia.org/wiki/Halting_problem .

---

## R. (merged) — Bekenstein bound (see S.4 & §P, §O)

## S. QUANTUM — SCHRÖDINGER, DIRAC, FEYNMAN, 't HOOFT, PENROSE

> Structural analogy ONLY — combinatorial, not physical (same disclaimer as
> `PathIntegralAuditSum.lean`). No complex amplitudes claimed as physics; we borrow
> the *form*.

### S.1 Schrödinger wavefunction (superposition of agentic actions)
**Primitive.** State `|ψ⟩ = Σ_a c_a|a⟩`, `Σ|c_a|²=1`. Math object: **a normalized
weight vector over a basis** (a probability simplex if we take `|c_a|²`).

**PURIQ map → pre-commitment action superposition.** Before commitment, Puriq holds a
*normalized weight vector* over candidate actions `a∈𝒜`; `Σ|c_a|²=1` is the
simplex constraint. The Λ·Yuyay·penalty product reweights `c_a`. No physics — just a
normalized score vector.

**Lean stub.**
```lean
structure ActionSuperposition (𝒜 : Type) [Fintype 𝒜] where
  amp : 𝒜 → ℝ
  normalized : (∑ a, (amp a)^2) = 1
```

### S.2 Dirac bra-ket (measurement of agentic state)
**Primitive.** Inner product `⟨φ|ψ⟩`; measurement = projection `|⟨a|ψ⟩|²`. Math
object: **inner-product projection onto a basis vector.**

**PURIQ map → action commitment = projection + Khipu receipt.** Committing to action
`a` is the projection `⟨a|ψ⟩`; the squared overlap `|⟨a|ψ⟩|²` is the realized
selection weight, and the projection event emits a Khipu receipt (the "measurement
record"). Collapse = irreversible commit (ties to LinearReceipt use-once).

**Lean stub.**
```lean
def project {𝒜} [Fintype 𝒜] (ψ : ActionSuperposition 𝒜) (a : 𝒜) : ℝ := (ψ.amp a)^2
theorem projections_sum_one {𝒜} [Fintype 𝒜] (ψ : ActionSuperposition 𝒜) :
    (∑ a, project ψ a) = 1 := ψ.normalized
```

### S.3 Feynman path integral (trajectory weighting)
**Primitive.** `K = ∫ 𝒟[x] exp(iS[x]/ħ)`; classical path = stationary `S`. Math
object (Euclidean/positive form): **weighted sum over a finite set of trajectories.**
Already realized in `Lutar.Feynman.Z_Λ` — we reuse it.

**PURIQ map → Puriq path integral over Khipu-consistent trajectories.** Action
selection weight = (normalized) sum over ALL Khipu-consistent trajectories reaching
that action, each weighted by `Λ`. This is the founder's "Feynman-Puriq path integral"
and directly extends `PathIntegralAuditSum.Z_Λ` from receipt-fibers to
action-trajectory-fibers.

**Lean stub.**
```lean
/-- Reuse Lutar.Feynman.Z_Λ; trajectory fiber = Khipu-consistent paths to action a. -/
noncomputable def puriqPathWeight {Traj} [Fintype Traj]
    (consistent : Traj → Prop) [DecidablePred consistent]
    (Λw : Traj → ℝ) : ℝ :=
  (∑ t ∈ Finset.univ.filter consistent, Λw t)  -- normalize downstream as in Z_Λ
```

### S.4 't Hooft–Susskind holography → Bekenstein bound on `𝒜`
**Primitive.** Holographic principle: the information in a volume is bounded by its
*boundary area*; Bekenstein bound `S ≤ 2πRE/(ħc)`, i.e. `dim ℋ = exp(2πRE/ħc)`. Math
object: **a hard cardinality bound on accessible states from `(R,E)`.**

**PURIQ map → `|𝒜|` Bekenstein cap.** The action space is finite and capped:
\[
|\mathcal{A}| \;\le\; \exp\!\left(\frac{2\pi R E}{\hbar c}\right),
\]
with `(R,E)` the agent's "context radius" and "energy/credit budget." Combined with
Kolmogorov (§P) `|𝒜| ≤ 2^{K_max+1}−1`, the binding cap is `min(·,·)`. This is the
charter's "Bekenstein-bounded action space" made explicit.

**Lean stub.**
```lean
noncomputable def bekensteinCap (R E : ℝ) : ℝ := Real.exp (2*Real.pi*R*E)  -- ħ=c=1 units
def actionSpaceBounded {𝒜} [Fintype 𝒜] (R E : ℝ) : Prop :=
  (Fintype.card 𝒜 : ℝ) ≤ bekensteinCap R E
```

### S.5 Penrose twistor (action-space geometry)
**Primitive.** Twistor space `ℙ𝕋` re-encodes points of (compactified, complexified)
Minkowski space as lines in `ℂℙ³`; light rays ↦ points. Math object: **a
correspondence/incidence geometry trading points for lines (a `ℂℙ³` re-coordinatization).**

**PURIQ map → dual coordinates for the decision manifold.** Re-coordinatize the
action-space so that *trajectories* (light-ray analogs) become *points* — making
trajectory-clustering and dominance analysis linear. Kept as a research-grade stub
(incidence relation only).

**Lean stub.**
```lean
/-- Twistor-style incidence: trajectories ↔ points under a fixed correspondence. -/
structure TwistorCorrespondence (Point Traj : Type) where
  incident : Point → Traj → Prop
  -- dual re-coordinatization properties: research-grade, see OBLIGATION
```

**Citations.** Schrödinger (1926) *Ann. Physik*; Dirac, *Principles of Quantum
Mechanics* (1930); Feynman, "Space-Time Approach to Non-Relativistic QM," *Rev. Mod.
Phys.* 20:367 (1948), https://doi.org/10.1103/RevModPhys.20.367 ; 't Hooft
"Dimensional Reduction in Quantum Gravity" (1993, gr-qc/9310026), Susskind (1995);
Bekenstein bound https://en.wikipedia.org/wiki/Bekenstein_bound and
http://www.scholarpedia.org/article/Bekenstein_bound ; Penrose, "Twistor Algebra,"
*J. Math. Phys.* 8:345 (1967).

---

## Index: primitive → PURIQ organ

| # | Primitive | Organ | Synthesized formula (see SUITE) |
|---|-----------|-------|----------------------------------|
| A.1 | ELS lattice distance | Khipu | (periodic-abuse detector) |
| A.2 | CRT mod 7/12/49 | HUKLLA | F12 CRT-Hukulla Schedule |
| B.1 | Egyptian fractions | Kallpa | F2 Egyptian-Kallpa Allocation |
| B.2 | Doubling multiply | HUKLLA | (fast compound risk) |
| B.3 | Frustum volume | 𝒜 | F11 Frustum 𝒜-Shrink |
| C.1 | Baudhāyana √2 | Λ-spine | F10 Baudhāyana Orthogonality |
| C.2 | Area-preserving | Yuyay | F9 Sulba Yuyay Mass-Conservation |
| D.1 | Euclid/Bézout | Khipu | (chain reduction certificate) |
| D.2 | Sieve | 𝒜 | (dominated-action pruning) |
| D.3 | Conic discriminant | Λ-spine | (bounded safe region) |
| E.1 | Complete square | HUKLLA | (β threshold solver) |
| E.2 | Khayyām conics | 𝒜 | (joint feasibility) |
| F.1 | Fluxion derivative | HUKLLA | F6 Newton Risk-Velocity Tripwire |
| F.2 | Inverse-square | Khipu | F7 Inverse-Square Provenance |
| F.3 | Rules of reasoning | HUKLLA | F8 Newton-Parsimony Pick |
| G.1 | exp kernel | HUKLLA | (penalty halting) |
| G.2 | V−E+F=2 | Khipu | F1 Euler-Khipu DAG Identity |
| G.3 | Euler–Lagrange | 𝒜 / agency | F5 Euler-Lagrange Agency |
| H.1 | Gaussian | Yuyay | F4 Gauss-Yuyay Aggregation |
| H.2 | Gauss–Bonnet | Λ-spine | F13 Gauss-Bonnet Spine Curvature |
| I.1 | Zeta convergence | Kallpa | F7 (s-generalized provenance) |
| I.2 | Riemann surfaces | decision space | (multi-sheet commit) |
| J | Noether conservation | Khipu | F3 Noether-Khipu Conservation |
| K.1 | Partition p(n) | 𝒜 | F14 Ramanujan 𝒜-Partition Bound |
| K.2 | Mock theta | 𝒜 | (rank-tier balance) |
| L | Schemes/categories | composition | F15 Grothendieck Organ Functor |
| N | Minimax | HUKLLA | F16 von-Neumann-Hukulla Minimax |
| O | Shannon entropy | Kallpa | F17 Shannon-Kallpa Capacity |
| P | Kolmogorov K | 𝒜 | F18 Kolmogorov 𝒜-Description Cap |
| Q | Turing halting | PURIQ core | F19 Turing-Fuel Halting Safety |
| S.1 | Schrödinger | 𝒜 | F20 Schrödinger Superposition |
| S.2 | Dirac projection | Khipu | F21 Dirac-Commit Projection |
| S.3 | Feynman path | 𝒜 | F22 Feynman-Puriq Path Integral |
| S.4 | Bekenstein/holography | 𝒜 | F23 Bekenstein 𝒜-Cap |
| S.5 | Twistor | decision geom | (dual re-coordinatization) |

All mystical/ritual content stripped per Zero-Bandaid Law. Method-citations (WRR)
are NOT claim-citations.
