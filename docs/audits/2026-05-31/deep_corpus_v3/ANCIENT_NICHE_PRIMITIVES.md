# ANCIENT_NICHE_PRIMITIVES.md — Niche Ancient/Medieval Math Primitives for PURIQ (PART B)

**Layer:** PURIQ (Doctrine v12). **Date:** 2026-06-01. **Author:** Yachay, under CTO authority.
**Construction intent:** net-new ancient/medieval/early-modern mathematics — Babylonian,
Mesoamerican, Chinese, Kerala-Indian, Hellenistic, Persian/Islamic, Renaissance, and modern
structural foundations — reduced to pure math and mapped onto PURIQ organs. **ZERO mysticism:**
calendar/number systems are admitted only as *number-theoretic and combinatorial structures*, never
as cosmology, divination, or ritual. Sources in `RESEARCH_NOTES.md` (refs 22–37). These do **not**
duplicate §A–§W of `ANCIENT_PRIMITIVES.md` / `_v2.md` (Egyptian, Vedic, Euclid, al-Khwārizmī,
Newton…Quantum, DSS/Enoch/Templar/Alchemy already covered).

---

## AN-1 — Babylonian sexagesimal divisor richness (base-60)
**Summary.** Base 60 is the smallest integer divisible by 1,2,3,4,5,6 and admits finite reciprocals
for all *regular* numbers (only primes 2,3,5), making division exact and tables small.
**Math.** \( 60 = 2^2\cdot3\cdot5;\quad \mathrm{div}(60)=\{1,2,3,4,5,6,10,12,15,20,30,60\};\quad
1/n \text{ terminates in base } 60 \iff \text{rad}(n)\mid 60. \)
**Citation.** Friberg 1981 *Historia Mathematica* 8(3):277–318; Friberg, *Amazing Traces…* (World Sci.).
**PURIQ-organ map.** **Kallpa / scheduler** — choose a polling/sharding period with a *maximally
divisible* base so many sub-cadences (½,⅓,¼,⅕,⅙) align exactly without remainder drift.
**Lean stub.** `theorem sexagesimal_exact_div (n : ℕ) (h : (n.factorization.support ⊆ {2,3,5})) : terminatesBase60 (1/n) := sorry`
**Efficiency claim.** Scheduler-alignment loop: a base-60 cadence lattice makes nested timers share
tick boundaries exactly — no fractional-period accumulation, fewer re-sync events.

## AN-2 — Plimpton 322 (exact ratio-based right-triangle table)
**Summary.** A table of Pythagorean-triple ratios built from regular sexagesimal numbers — an exact,
*angle-free, irrational-free* trigonometric lookup using only ratios of integers.
**Math.** Rows are \((\,\mathrm{ratio}=d^2/b^2,\ s,\ l\,)\) with \(s^2 + (\text{leg})^2 = l^2\) and
all generating numbers regular (finite reciprocal). No \(\sin/\cos\), no angle measure.
**Citation.** Mansfield & Wildberger 2017 *Historia Mathematica* 44:395–419.
**PURIQ-organ map.** **Λ-spine** — orthogonal sub-score combination via a *precomputed exact-ratio
table* instead of floating-point trig — drift-free diagonal combine (complements §C.1 √2 enclosure).
**Lean stub.** `theorem plimpton_exact (r : RatioRow) : r.short^2 + r.leg^2 = r.diag^2 := sorry`
**Efficiency claim.** Λ-combine loop: rational-ratio lookups replace `sin/cos/sqrt` calls in the
spine — exact arithmetic, no transcendental-function cost, reproducible across machines.

## AN-3 — Babylonian reciprocal tables (division as multiplication)
**Summary.** Precomputed \(1/n\) for regular \(n\) turned every division into a table lookup +
multiply — caching the expensive operation.
**Math.** \( a / b = a \cdot (1/b),\ (1/b)\ \text{precomputed for regular } b. \)
**Citation.** Friberg 1981 *Historia Mathematica* 8(3):277–318.
**PURIQ-organ map.** **Kallpa** — memoize reciprocal weights of recurring denominators (e.g. fixed
fan-out factors) so budget splits are multiply-only at runtime.
**Lean stub.** `theorem recip_table_correct (b : Regular) : a / b = a * recipTable b := sorry`
**Efficiency claim.** Budget-split loop: precomputed reciprocals turn per-step division into a
multiply — removes the divide unit from the hot allocation path.

## AN-4 — Maya vigesimal place value with the 360-tun exception
**Summary.** A base-20 positional system whose *third* place is 18·20=360 (not 20²), a deliberate
mixed-radix tweak aligning the counter with a 360-unit administrative cycle.
**Math.** value \(= \sum_k d_k\,P_k,\ P_0=1,\ P_1=20,\ P_2=360,\ P_k=360\cdot20^{\,k-2}\,(k\ge2),\
0\le d_k<20\) (with \(d_2<18\)).
**Citation.** Aveni, *Skywatchers* (Univ. Texas Press); Maya numerals overview.
**PURIQ-organ map.** **Khipu / counters** — a mixed-radix sequence counter where one digit position
has a custom modulus, encoding a domain cycle directly into the place values.
**Lean stub.** `def mayaPlace (k : ℕ) : ℕ := if k = 0 then 1 else if k = 1 then 20 else 360 * 20^(k-2)` with
`theorem maya_unique_repr (n : ℕ) : ∃! ds, n = mixedRadixEval mayaPlace ds := sorry`
**Efficiency claim.** Counter loop: a mixed-radix counter with a built-in cycle length avoids a
separate modulo-cycle bookkeeping variable — one increment carries the cycle.

## AN-5 — Maya Calendar Round = lcm(260, 365) = 18,980
**Summary.** Two coprime-after-gcd cycles (Tzolkʼin 260, Haabʼ 365; gcd=5) realign every
lcm = 18,980 days — a least-common-multiple synchronization period.
**Math.** \( \mathrm{lcm}(260,365)=\dfrac{260\cdot365}{\gcd(260,365)}=\dfrac{94900}{5}=18980. \)
**Citation.** Maya calendar overview; Aveni, *Skywatchers*.
**PURIQ-organ map.** **Khipu archive cadence** — schedule a full reconciliation/archive at the lcm
of two independent rotation periods so both align exactly at the checkpoint.
**Lean stub.** `theorem calround_lcm : Nat.lcm 260 365 = 18980 := by decide` (provable, PROVED) with
`theorem realign_at_lcm (p q : ℕ) : ∀ k, p ∣ (k * Nat.lcm p q) ∧ q ∣ (k * Nat.lcm p q) := sorry`
**Efficiency claim.** Archive loop: aligning the heavy reconciliation to the lcm of two cycles means
it runs once per common period instead of once per shorter cycle — fewer full reconciles.

## AN-6 — Maya Long Count (positional long-period counter)
**Summary.** A mixed-radix day count from a fixed epoch in units {1,20,360,7200,144000} — a
monotone, overflow-safe long-period sequence number.
**Math.** \( N = \sum b_i\,W_i,\ W=(1,20,360,7200,144000),\ \text{epoch } 0=\text{4 Ahau 8 Kumkʼu}. \)
**Citation.** Mesoamerican Long Count overview; Aveni, *Skywatchers*.
**PURIQ-organ map.** **Khipu** — a monotone global sequence/version number with mixed-radix digits,
giving a total order over receipts with no wraparound for astronomically long horizons.
**Lean stub.** `theorem longcount_monotone : StrictMono longCountOf := sorry`
**Efficiency claim.** Ordering loop: a single monotone long counter replaces composite (time, nonce)
comparisons in receipt ordering — one integer compare per ordering decision.

## AN-7 — Chinese Remainder Theorem (Sunzi reconstruction)
**Summary.** An integer is uniquely recoverable from its residues modulo pairwise-coprime moduli,
within the product modulus — reconstruct a global value from local shards.
**Math.** \( x \equiv a_i \pmod{m_i},\ \gcd(m_i,m_j)=1 \Rightarrow \exists!\,x \bmod \textstyle\prod m_i. \)
**Citation.** Sunzi Suanjing (3rd–5th c.); Martzloff, *A History of Chinese Mathematics* (Springer 1997).
**PURIQ-organ map.** **Khipu sharding** — shard a global state across coprime-keyed nodes; reconcile
the global value by CRT recombination, with O(log n) divide-and-conquer recombination.
**Lean stub.** `theorem khipu_crt_recover (sh : Shards) (h : Coprime sh.moduli) : recombine sh = sh.global := sorry`
**Efficiency claim.** Distributed-reconcile loop: CRT recombination is O(log n) tree-merge vs O(n)
sequential gossip — faster cross-shard DAG reconciliation, parallelizable.

## AN-8 — Nine Chapters fangcheng (early Gaussian elimination)
**Summary.** The *Jiuzhang Suanshu* solves linear systems by counting-rod elimination — Gaussian
elimination with negative numbers, ~1st c. CE.
**Math.** Row-reduce augmented matrix \([A\,|\,b]\) to triangular form; back-substitute.
**Citation.** *Nine Chapters on the Mathematical Art*; Martzloff (1997).
**PURIQ-organ map.** **Λ-spine** — solve organ-weight balancing as a small linear system with
provable unique solution when the coefficient matrix is nonsingular.
**Lean stub.** `theorem fangcheng_unique (A : Matrix) (h : A.det ≠ 0) : ∃! x, A.mulVec x = b := sorry`
**Efficiency claim.** Weight-calibration loop: direct elimination gives exact weights in one pass vs
iterative gradient descent — deterministic, converges in O(n³) once instead of many epochs.

## AN-9 — Liu Hui / Zu Chongzhi π = 355/113 (best low-denominator rational)
**Summary.** 355/113 (Milü) approximates π to 6 decimals and is the best rational approximation with
denominator < 16604 — a maximally accurate cheap constant.
**Math.** \( \left|\,\pi - \tfrac{355}{113}\,\right| < 2.7\times10^{-7};\ \tfrac{355}{113}\ \text{is a convergent of }\pi. \)
**Citation.** Liu Hui (263 CE); Zu Chongzhi (5th c.); Martzloff (1997).
**PURIQ-organ map.** **Λ-spine / geometry (Killinchu)** — use the rational Milü for geographic
circumference math where a certified rational beats a truncated float for reproducibility.
**Lean stub.** `theorem milu_bound : |Real.pi - 355/113| < 2.7e-7 := sorry`
**Efficiency claim.** Geo-compute loop: integer-ratio π avoids float π rounding divergence across
nodes — bit-identical results, no cross-node reconciliation of rounding error.

## AN-10 — Yang Hui's triangle (binomial coefficients, combinatorial fan-out)
**Summary.** The binomial triangle (Pascal's, but 1261 in China) gives \(\binom{n}{k}\) by additive
recurrence — the count of paths / subsets, a combinatorial primitive.
**Math.** \( \binom{n}{k} = \binom{n-1}{k-1} + \binom{n-1}{k},\quad \sum_k \binom{n}{k} = 2^n. \)
**Citation.** Yang Hui (1261); overview.
**PURIQ-organ map.** **𝒜 (action space)** — count the size of a fan-out/combination action set
exactly via the binomial recurrence to bound \(|\mathcal{A}|\) before enumeration.
**Lean stub.** `theorem yanghui_recurrence (n k : ℕ) : Nat.choose n k = Nat.choose (n-1) (k-1) + Nat.choose (n-1) k := sorry`
**Efficiency claim.** Combination-planning loop: a closed binomial count lets the planner reserve the
right buffer size up front — no dynamic resize of the candidate-action array.

## AN-11 — Madhava–Leibniz arctan series with end correction
**Summary.** The Kerala school's power series \(\arctan x = \sum (-1)^k x^{2k+1}/(2k+1)\), plus
*end-correction* terms that dramatically accelerate convergence — a fast, certified π/arctan.
**Math.** \( \frac{\pi}{4} = 1 - \frac13 + \frac15 - \cdots + \frac{(-1)^{n-1}}{2n-1} + \underbrace{\frac{(-1)^n}{?}}_{\text{end correction}},\ \text{error} \to O(n^{-3}). \)
**Citation.** Madhava (14th c.); Plofker, *Mathematics in India* (Princeton 2009).
**PURIQ-organ map.** **Λ-spine / Killinchu geometry** — fast convergent series for trig/π used in
geographic transforms, with a provable truncation-error bound (early stop with guarantee).
**Lean stub.** `theorem madhava_error_bound (n : ℕ) : |arctanPartial x n - Real.arctan x| ≤ tailBound x n := sorry`
**Efficiency claim.** Geo-transform loop: end-correction means far fewer terms for target accuracy
(O(n^-3) vs O(n^-1)) — fewer iterations per coordinate conversion, with a proved stop condition.

## AN-12 — Archimedes' Method of indivisibles (proto-integration)
**Summary.** Archimedes computed areas/volumes by balancing infinitesimal "slices" on a lever — an
early integral via decomposition into indivisibles, then a rigorous exhaustion bound.
**Math.** \( \text{Area} = \lim_{n\to\infty}\sum_{i=1}^n f(x_i)\,\Delta x;\ \text{exhaustion: }
\underline{S}_n \le \text{Area} \le \overline{S}_n,\ \overline{S}_n-\underline{S}_n\to 0. \)
**Citation.** Archimedes, *The Method of Mechanical Theorems* (palimpsest, re-imaged 1998–2008);
Netz & Noel, *The Archimedes Codex* (Cambridge).
**PURIQ-organ map.** **Kallpa / metering** — accumulate a continuous resource cost as a Riemann sum
with provable upper/lower envelope, so the metered total is bracketed, never unbounded.
**Lean stub.** `theorem exhaustion_brackets (f : ℝ → ℝ) (n : ℕ) : lowerSum f n ≤ integral f ∧ integral f ≤ upperSum f n := sorry`
**Efficiency claim.** Metering loop: an explicit lower/upper bracket lets the meter stop refining
once the bracket is below tolerance — adaptive step count instead of fixed fine sampling.

## AN-13 — Tusi couple (circular ⇆ linear motion, no trigonometry)
**Summary.** A circle of radius \(r\) rolling inside a circle of radius \(2r\) makes a boundary point
trace a straight diameter — converts rotation to oscillation with pure geometry, no \(\sin/\cos\).
**Math.** \( z(\theta) = (2r-r)e^{i\theta}\cdot\tfrac12(\dots)\ \Rightarrow\
x(\theta)=2r\cos\theta\ \text{on the diameter};\ \text{point oscillates linearly}. \)
(Hypocycloid with ratio 2:1 degenerates to a line segment.)
**Citation.** al-Ṭūsī (13th c.); Ragep, "Origins of the Ṭūsī Couple Revisited" (NYU); Saliba,
*Islamic Science and the Making of the European Renaissance* (MIT 2007).
**PURIQ-organ map.** **Swarm geometry (Killinchu / drone formation)** — generate a linear sweep from
two rotation parameters with no trig calls — circular↔linear conversion in integer/rational rotor form.
**Lean stub.** `theorem tusi_linearizes (r θ : ℝ) : (tusiPoint r θ).im = 0 := sorry`
**Efficiency claim.** Swarm-pathing loop: rotor composition replaces per-agent `sin/cos` formation
math with two angle adds — cheaper formation updates, exact straight-line sweeps without drift.

## AN-14 — Bombelli's disciplined complex arithmetic (casus irreducibilis)
**Summary.** Bombelli (1572) defined consistent arithmetic of \(\sqrt{-1}\) so the cubic's
"impossible" intermediate values cancel to yield *real* roots — a complex bridge through an
imaginary intermediate.
**Math.** For \(x^3=15x+4\): \(x=\sqrt[3]{2+11i}+\sqrt[3]{2-11i}=(2+i)+(2-i)=4\) (real).
**Citation.** Bombelli, *L'Algebra* (1572); Cardano, *Ars Magna* (1545); overview.
**PURIQ-organ map.** **Λ-spine / solver** — permit a transiently "complex" (out-of-domain)
intermediate score as long as the final combined result is provably real/in-range.
**Lean stub.** `theorem complex_intermediate_real (c : Cubic) (h : c.casusIrreducibilis) : (bombelliSolve c).im = 0 := sorry`
**Efficiency claim.** Solver loop: allowing a complex intermediate lets the closed-form (Cardano)
path run instead of falling back to numeric root-finding — one formula vs an iterative solver.

## AN-15 — Connes spectral / noncommutative invariant (order-sensitive provenance)
**Summary.** Noncommutative geometry models spaces whose coordinate algebra is noncommutative; a
spectral triple \((\mathcal{A},\mathcal{H},D)\) carries the geometry — order of operations matters
and is itself an invariant.
**Math.** Spectral triple \((\mathcal{A},\mathcal{H},D)\); for \(a,b\in\mathcal{A}\) generally
\(ab\ne ba\); distance recovered from \(\sup\{|a(p)-a(q)| : \|[D,a]\|\le1\}\).
**Citation.** Connes, *Noncommutative Geometry* (Academic Press 1994).
**PURIQ-organ map.** **Khipu** — a *noncommutative* receipt-composition invariant: the order in
which receipts compose is part of the proof, so reordering is detectable (strengthens §J Noether to
a module/ring structure rather than an abelian charge).
**Lean stub.** `theorem khipu_noncommutative (r s : Receipt) : compose r s = compose s r ↔ r.commutesWith s := sorry`
**Efficiency claim.** Tamper-detect loop: an order-sensitive composition invariant catches receipt
*reordering* attacks that a commutative checksum misses — one algebraic check replaces a sequence
diff over the whole chain.

---

## Index: ancient primitive → PURIQ organ → Lean stub → feeds formula
| ID | Primitive | Organ | Lean stub | Feeds |
|----|-----------|-------|-----------|-------|
| AN-1 | Base-60 divisor richness | Kallpa/sched | `sexagesimal_exact_div` | F33 |
| AN-2 | Plimpton 322 exact ratios | Λ-spine | `plimpton_exact` | (Λ-combine) |
| AN-3 | Reciprocal tables | Kallpa | `recip_table_correct` | F33 |
| AN-4 | Maya vigesimal + 360-tun | Khipu | `maya_unique_repr` | F34 |
| AN-5 | Calendar Round lcm(260,365) | Khipu archive | `calround_lcm` (PROVED) | F34 |
| AN-6 | Long Count counter | Khipu | `longcount_monotone` | F34 |
| AN-7 | Chinese Remainder Theorem | Khipu shard | `khipu_crt_recover` | F35 |
| AN-8 | Fangcheng elimination | Λ-spine | `fangcheng_unique` | (calibration) |
| AN-9 | π = 355/113 (Milü) | Λ/Killinchu | `milu_bound` | F36 |
| AN-10 | Yang Hui triangle | 𝒜 | `yanghui_recurrence` | (planning) |
| AN-11 | Madhava arctan + end-corr | Λ/Killinchu | `madhava_error_bound` | F36 |
| AN-12 | Archimedes indivisibles | Kallpa/meter | `exhaustion_brackets` | (metering) |
| AN-13 | Tusi couple | Swarm/Killinchu | `tusi_linearizes` | F37 |
| AN-14 | Bombelli complex bridge | Λ/solver | `complex_intermediate_real` | (solver) |
| AN-15 | Connes NCG invariant | Khipu | `khipu_noncommutative` | F38 |

— Yachay (research organ), under CTO authority. Calendars/number systems admitted as number theory
ONLY — no cosmology, no divination. NO mysticism. Doctrine v12 additive over v11 LOCKED
(749/14/163, 13-axis). NO BANDAID.
