# DENSITY_RESEARCH_FINDINGS — closing `dyadic_image_dense` (Lean 4 / Mathlib v4.18.0)

Research output for the last open gap in CUT-1. Target lemma: `dyadic_image_dense` =
BKS arXiv:2208.07083 Lemma 6 / Step 2 = the dense-domain argument of the parent paper
[arXiv:2107.07391](https://ar5iv.labs.arxiv.org/html/2107.07391), **Theorem 8**.

All Mathlib declarations below were verified **verbatim at the `v4.18.0` git tag**
(`raw.githubusercontent.com/leanprover-community/mathlib4/v4.18.0/...`), not just on the
current docs site. Names, signatures, module paths, and (where useful) the in-Mathlib
proof are quoted. **No Lean code is written here** — this is a wiring map for the dev teams.

> Maps to the formalization plan in `cut1_sources/DENSITY_PROOF_BRIEF.md`:
> **A** = countable-disjoint-opens engine, **B** = uncountably-many two-sided accumulation
> points, **C** = gap → disjoint-intervals map, **D** = continuous extension / assembly.

---

## ★ HEADLINE RESULT — Sub-lemma A is ALREADY IN MATHLIB (do not reinvent)

The brief's target signature `countable_of_pairwiseDisjoint_open` exists, in three flavors,
in **`Mathlib.Topology.Bases`**. The indexed `Countable ι` version matches the brief almost
character-for-character, and **its Mathlib proof is exactly the rational-injection proof the
brief proposed** (pick a dense point in each open set; disjointness ⇒ injective into a
countable dense set).

**A.1 — the engine (use this one).** Verified at v4.18.0 `Mathlib/Topology/Bases.lean:406`:
```lean
theorem Pairwise.countable_of_isOpen_disjoint [SeparableSpace α] {ι : Type*}
    {s : ι → Set α} (hd : Pairwise (Disjoint on s)) (ho : ∀ i, IsOpen (s i))
    (hne : ∀ i, (s i).Nonempty) : Countable ι
```
In-Mathlib proof (verbatim, confirms the rational-injection plan):
```
rcases exists_countable_dense α with ⟨u, u_countable, u_dense⟩
choose f hfu hfs using fun i ↦ u_dense.exists_mem_open (ho i) (hne i)
have f_inj : Injective f := fun i j hij ↦ hd.eq <| not_disjoint_iff.2 ⟨f i, hfs i, hij.symm ▸ hfs j⟩
have := u_countable.to_subtype
exact (f_inj.codRestrict hfu).countable
```
- **What it is:** In a separable space, any family of nonempty pairwise-disjoint open sets is countable.
- **Source:** [Mathlib `Topology/Bases.lean` @ v4.18.0](https://github.com/leanprover-community/mathlib4/blob/v4.18.0/Mathlib/Topology/Bases.lean#L406); [docs](https://leanprover-community.github.io/mathlib4_docs/Mathlib/Topology/Bases.html).
- **Plugs into A/C/D:** This is the contradiction engine. In Step 4 you build, for each
  two-sided accumulation point `α`, the open interval `U α := Ioo (F X α) (F Y α)` of ℝ.
  Sub-lemma C gives `Pairwise (Disjoint on U)` and each is nonempty open. Then
  `Pairwise.countable_of_isOpen_disjoint` ⇒ `Countable {two-sided acc pts}`, contradicting
  Sub-lemma B (uncountable). **No bespoke countability lemma needs to be built.**

**A.2 — `Set`-indexed sibling** (if you index over a `Set ι` instead of a type),
`Mathlib/Topology/Bases.lean:417`:
```lean
theorem Set.PairwiseDisjoint.countable_of_isOpen [SeparableSpace α] {ι : Type*}
    {s : ι → Set α} {a : Set ι} (h : a.PairwiseDisjoint s) (ho : ∀ i ∈ a, IsOpen (s i))
    (hne : ∀ i ∈ a, (s i).Nonempty) : a.Countable
```
- **Plugs into A/C:** use this if the accumulation-point set is carried as `a : Set ℝ`
  with `s = fun α => Ioo (F X α) (F Y α)`; you get `a.Countable` directly. Likely the most
  ergonomic form, since the accumulation-point set is naturally a `Set ℝ`.

**A.3 — nonempty-interior variant** `Mathlib/Topology/Bases.lean:423`:
```lean
theorem Set.PairwiseDisjoint.countable_of_nonempty_interior [SeparableSpace α] {ι : Type*}
    {s : ι → Set α} {a : Set ι} (h : a.PairwiseDisjoint s)
    (ha : ∀ i ∈ a, (interior (s i)).Nonempty) : a.Countable
```
- **Plugs into A:** drop-in if you ever carry the intervals as closed/general sets with
  nonempty interior rather than open `Ioo`.

### Instances that discharge `[SeparableSpace ℝ]` automatically (verified v4.18.0)
You do NOT supply separability by hand for ℝ — it is found by instance resolution:
- `instSecondCountableTopologyReal : SecondCountableTopology ℝ`
  — module `Mathlib.Topology.MetricSpace.ProperSpace` ([Loogle-confirmed]).
- `TopologicalSpace.SecondCountableTopology.to_separableSpace`
  `[SecondCountableTopology α] : SeparableSpace α` (priority-100 instance, `Topology/Bases.lean`).
- Chain: `SecondCountableTopology ℝ` ⇒ `SeparableSpace ℝ` ⇒ A.1/A.2/A.3 apply to `ℝ`.
- Also relevant: `instOrderTopologyReal : OrderTopology ℝ`
  (`Mathlib.Topology.MetricSpace.Pseudo.Lemmas`). `DenselyOrdered ℝ` is a standard instance
  (used widely, e.g. throughout `MeasureTheory.Measure.Stieltjes`).

---

## Sub-lemma D — continuous extension (Wave18 bridge): CONFIRMED in v4.18.0

**D.1 — `Monotone.continuous_of_denseRange`.** Verified verbatim at
`Mathlib/Topology/Order/MonotoneContinuity.lean:253`:
```lean
-- section context (lines 28-31):
-- variable {α β : Type*} [LinearOrder α] [TopologicalSpace α] [OrderTopology α]
-- variable [LinearOrder β] [TopologicalSpace β] [OrderTopology β]
theorem Monotone.continuous_of_denseRange [DenselyOrdered β] {f : α → β}
    (h_mono : Monotone f) (h_dense : DenseRange f) : Continuous f
```
- **Full typeclass bill:** `[LinearOrder α] [TopologicalSpace α] [OrderTopology α]`,
  `[LinearOrder β] [TopologicalSpace β] [OrderTopology β] [DenselyOrdered β]`.
- **Source:** [Mathlib `MonotoneContinuity.lean` @ v4.18.0](https://github.com/leanprover-community/mathlib4/blob/v4.18.0/Mathlib/Topology/Order/MonotoneContinuity.lean#L253); [docs/Loogle](https://leanprover-community.github.io/mathlib4_docs/Mathlib/Topology/Order/MonotoneContinuity.html).
- **Module name confirmation for Wave18:** the lemma lives in
  `Mathlib.Topology.Order.MonotoneContinuity` (NOT `Topology.Algebra.Order...`). The Wave18
  alias `gen_continuous_of_denseRange` should `import Mathlib.Topology.Order.MonotoneContinuity`.
- **Plugs into D:** consumes EXACTLY Step-3's output (`DenseRange f` + `Monotone f`) to give
  `Continuous f`, as the brief states. Both `ℝ`/`Icc`/`Ioo` carry `OrderTopology` +
  `DenselyOrdered`. Companion `Monotone.continuous_of_surjective` (line 261) is also present.

---

## Sub-lemma B — uncountably many two-sided accumulation points

### ★ Major de-risking: the parent-paper proof needs NO perfect-set machinery
The brief feared B might need `Perfect`/Cantor-Bendixson and warned it could be multi-week.
**The actual BKS argument (parent paper Thm 8, First+Second step) is much lighter** — full
extracted text in `cut1_sources/BKS_2107.07391_Thm8_proof_extract.txt`. The strategy:

1. **Extend `f` from dyadics `D` to all of `[0,1]` by left-limits** → the extension is
   **strictly increasing on all of `[0,1]`** → **injective** → its image, hence
   `closure(f(D))`, is **uncountable** (an injection out of the continuum `[0,1]`).
2. `closure(f(D))` has **at most countably many isolated points and at most countably many
   one-sided accumulation points** (each such point yields a disjoint interval ⇒ apply the
   A.1 engine) ⇒ since the set is uncountable, **uncountably many two-sided accumulation points**.

So B reduces to (i) "monotone extension is injective ⇒ image uncountable" and (ii) two more
applications of the SAME A.1 disjoint-opens engine. The relevant Mathlib pieces:

**B.1 — uncountability of the continuum image.**
- `Cardinal.mk_Ioo_real {a b : ℝ} (h : a < b) : #(Set.Ioo a b) = Cardinal.continuum`
  — verified v4.18.0 `Mathlib/Data/Real/Cardinality.lean:247` (module `Mathlib.Data.Real.Cardinality`).
- `Cardinal.not_countable_real : ¬(Set.univ : Set ℝ).Countable`
  — same file, line 207.
- **Source:** [Mathlib `Data/Real/Cardinality.lean` @ v4.18.0](https://github.com/leanprover-community/mathlib4/blob/v4.18.0/Mathlib/Data/Real/Cardinality.lean#L247).
- **Plugs into B:** gives "`(a,b)` is uncountable"; combine with an injection
  `Ioo a b ↪ closure(f(D))` (from strict monotonicity) to conclude `closure(f(D))` uncountable.
- Strict-mono ⇒ injective: `StrictMono.injective`
  (`Mathlib.Order.Monotone.Basic`); `Monotone.strictMono_of_injective`
  (`Mathlib.Order.Monotone.Defs`); `Monotone.strictMono_iff_injective`
  (`Mathlib.Order.Monotone.Basic`).

**B.2 — monotone left/right limits (build the `[0,1]` extension cleanly).** In
`Mathlib.Topology.Order.LeftRightLim` (verified v4.18.0; `Function.leftLim`/`rightLim`):
- `Monotone.tendsto_leftLim (x) : Tendsto f (𝓝[<] x) (𝓝 (Function.leftLim f x))`
  (`Mathlib/Topology/Order/LeftRightLim.lean:160`).
- `Monotone.tendsto_rightLim (x) : Tendsto f (𝓝[>] x) (𝓝 (rightLim f x))` (line 170).
- `Monotone.leftLim_le`, `Monotone.le_rightLim`, `Monotone.leftLim_le_rightLim` (lines 102/136/145).
- Also in `Mathlib.Topology.Order.Monotone`: `Monotone.tendsto_nhdsLT`/`tendsto_nhdsGT`
  (limits = `sSup (f '' Iio x)` / `sInf (f '' Ioi x)`) — verified v4.18.0
  `Mathlib/Topology/Order/Monotone.lean:312/321`. These directly model
  `X = lim_{d→z-} f(d)` and `Y = lim_{D→z+} f(D)` from Step 3.
- **Plugs into B/C/D:** the dyadic-to-[0,1] extension is literally `leftLim`/`rightLim`
  of the monotone dyadic map; these give the limits `X,Y` and that the extension is monotone.

**B.3 — "at most countably many discontinuities/one-sided points" (the clean shortcut).**
```lean
-- Mathlib/Topology/Order/LeftRightLim.lean:315  (Monotone version)
theorem Monotone.countable_not_continuousAt [SecondCountableTopology β] (hf : Monotone f) :
    {x | ¬ContinuousAt f x}.Countable
```
(MonotoneOn version at line 237.) Also `Monotone.countable_setOf_two_preimages`
(`Mathlib/Topology/Order/Monotone.lean`): the set of values with ≥2 preimages is countable.
- **Source:** [Mathlib `LeftRightLim.lean` @ v4.18.0](https://github.com/leanprover-community/mathlib4/blob/v4.18.0/Mathlib/Topology/Order/LeftRightLim.lean#L315).
- **Plugs into B:** This is the *Mathlib-native* statement of "a monotone function has at most
  countably many jumps." It lets you sidestep classifying isolated/one-sided points by hand:
  the points where `closure(f(D))` fails to be a two-sided accumulation point correspond to
  discontinuities/jumps of the monotone extension, which are countable. **Recommended path
  for B** — it directly yields the countable/uncountable split without `Perfect`.

### Alternative (heavier) machinery for B — available but probably unnecessary
If the team prefers a perfect-set route, Mathlib has it (all verified to exist at v4.18.0):
- **`Mathlib.Topology.Perfect`** (`Topology/Perfect.lean`, 258 lines @ v4.18.0):
  - `def Preperfect (C) := ∀ x ∈ C, AccPt x (𝓟 C)` (line 73).
  - `Preperfect.perfect_closure (hC : Preperfect C) : Perfect (closure C)` (line 115).
  - `exists_perfect_nonempty_of_isClosed_of_not_countable [SecondCountableTopology α]`
    `(hclosed : IsClosed C) (hunc : ¬C.Countable) : ∃ D, Perfect D ∧ D.Nonempty ∧ D ⊆ C`.
  - `exists_countable_union_perfect_of_isClosed` (Cantor–Bendixson).
  - `Perfect.closure_nhds_inter`, `Perfect.splitting` (T2.5), `AccPt.nhds_inter`,
    `preperfect_iff_nhds`.
- **`Mathlib.Topology.MetricSpace.Perfect`** (Cantor-space injection ⇒ uncountable):
  - `Perfect.exists_nat_bool_injection {α} [MetricSpace α] [CompleteSpace α] (hC : Perfect C)`
    `(hnonempty : C.Nonempty) : ∃ f, Set.range f ⊆ C ∧ Continuous f ∧ Function.Injective f`
    (injection from Cantor space `ℕ → Bool`).
  - `IsClosed.exists_nat_bool_injection_of_not_countable {α} [PolishSpace α]`
    `(hC : IsClosed C) (hunc : ¬C.Countable) : ∃ f, range f ⊆ C ∧ Continuous f ∧ Injective f`.
  - Source: [docs](https://leanprover-community.github.io/mathlib4_docs/Mathlib/Topology/MetricSpace/Perfect.html).
- **`AccPt` API** (`Mathlib.Topology.ClusterPt` / `Mathlib.Topology.Defs.Filter`):
  `AccPt x F := 𝓝[≠] x ⊓ F ≠ ⊥`; `accPt_principal_iff_nhdsWithin`,
  `accPt_iff_frequently` (`AccPt x (𝓟 C) ↔ ∃ᶠ y in 𝓝 x, y ≠ x ∧ y ∈ C`),
  `isClosed_iff_accPt`, `AccPt.mono`, `accPt_sup`. Use these to *define* "two-sided
  accumulation point" as a conjunction of one-sided `AccPt` over the `𝓝[<]`/`𝓝[>]` filters
  if a hand-rolled predicate is preferred over Mathlib `AccPt`.
- **Recommendation:** prefer the light path (B.1+B.2+B.3 + A.1). The perfect-set route works
  but `[CompleteSpace]`/`[PolishSpace]`/`[MetricSpace]` plumbing and the Cantor injection are
  strictly more than needed; BKS itself does not use them.

---

## Sub-lemma C — gap ⇒ pairwise-disjoint open intervals

This is pure order/strict-monotonicity bookkeeping; no exotic Mathlib lemma is required.
The exact inequalities to formalize are in the parent-paper **Fourth step** (extracted
verbatim in `cut1_sources/BKS_2107.07391_Thm8_proof_extract.txt`): for distinct two-sided
accumulation points `α<β`, using `f((d1+d2)/2)=F(f d1,f d2)` (Wave18 generator identity) plus
partial strict monotonicity of `F`, one shows
`]F X α, F Y α[ ∩ ]F X β, F Y β[ = ∅`.

Supporting Mathlib primitives (verified via Loogle against v4.18.0 docs):
- **`StrictMono.image_Ioo_subset {f} [Preorder α] [Preorder β] (h : StrictMono f) :`**
  `f '' Set.Ioo a b ⊆ Set.Ioo (f a) (f b)` — `Mathlib.Order.Interval.Set.Image`.
- **`StrictMono.mapsTo_Ioo (h : StrictMono f) : Set.MapsTo f (Ioo a b) (Ioo (f a) (f b))`**
  — `Mathlib.Order.Interval.Set.Image`. Use to push the section maps `x ↦ F x s`,
  `y ↦ F t y` (partially strictly increasing, a Wave18 hypothesis) through open intervals.
- Disjointness of two `Ioo`s: there is **no single packaged `Set.Ioo_disjoint_Ioo`**; derive
  it from order facts. Convert C's interval-endpoint inequalities to the
  `Pairwise (Disjoint on ·)` hypothesis of A.1 via `Set.disjoint_left` / `not_disjoint_iff`
  (`Mathlib.Order.SetNotation` / `Mathlib.Data.Set.Lattice`) plus `Set.Ioo_subset_Ioo`
  (`Mathlib.Order.Interval.Set.Basic`). I.e. show no `x` lies in both `Ioo (F X α)(F Y α)`
  and `Ioo (F X β)(F Y β)` from the endpoint ordering proven in C.
- `isOpen_Ioo : IsOpen (Set.Ioo a b)` — `Mathlib.Topology.Order.OrderClosed`
  (needs `[OrderClosedTopology α]`, satisfied by ℝ). And
  `Set.nonempty_Ioo [DenselyOrdered α] : (Ioo a b).Nonempty ↔ a < b`
  — `Mathlib.Order.Interval.Set.Basic` (`DenselyOrdered ℝ` holds). These discharge the
  `IsOpen`/`Nonempty` hypotheses of A.1.
- **Plugs into C→A:** C produces `Pairwise (Disjoint on fun α => Ioo (F X α) (F Y α))`,
  each open (`isOpen_Ioo`) and nonempty (`F X α < F Y α` from strict monotonicity since `X<Y`).
  Feed straight into A.1 / A.2.

---

## Primitives explicitly requested in the brief — status table

| Brief item | Mathlib v4.18.0 status | Exact name + module |
|---|---|---|
| pairwise-disjoint nonempty open ⇒ countable | **EXISTS** (3 forms) | `Pairwise.countable_of_isOpen_disjoint`, `Set.PairwiseDisjoint.countable_of_isOpen`, `…countable_of_nonempty_interior` — `Mathlib.Topology.Bases` |
| `Set.PairwiseDisjoint` | EXISTS | `Mathlib.Data.Set.Pairwise.Basic` / `…Lattice` |
| `Pairwise (Disjoint on ·)` | EXISTS (used by A.1) | `Mathlib.Order.SetNotation` / `Function.onFun` |
| `SecondCountableTopology` / `SeparableSpace` | EXISTS + ℝ instances | `Mathlib.Topology.Bases`; `instSecondCountableTopologyReal` |
| `Set.Countable`, `Set.Countable.mono` | EXISTS | `Mathlib.Data.Set.Countable` |
| `exists_rat_btwn (h : x<y) : ∃ q, x<↑q ∧ ↑q<y` | EXISTS | `Mathlib.Algebra.Order.Archimedean.Basic` |
| `Rat.denseRange_cast : DenseRange Rat.cast` | EXISTS (the `IsOpen.exists_rat` role) | `Mathlib.Topology.Algebra.Order.Archimedean` |
| `DenseRange` | EXISTS | `Mathlib.Topology.Dense` |
| `Monotone.continuous_of_denseRange` | **EXISTS** | `Mathlib.Topology.Order.MonotoneContinuity` |
| `Perfect`, `Preperfect`, Cantor–Bendixson | EXISTS (optional) | `Mathlib.Topology.Perfect`, `Mathlib.Topology.MetricSpace.Perfect` |
| `Set.Uncountable` (as a named predicate) | **NOT a Prop in v4.18.0** — express via `¬ s.Countable` or `Cardinal.continuum ≤ #s` | use `Cardinal.not_countable_real`, `Cardinal.mk_Ioo_real` |
| quasi-arithmetic mean / bisymmetry / Aczél | **NOT IN MATHLIB** (see below) | build from scratch |

> Note on `exists_rat_btwn`/`IsOpen.exists_rat`: there is no single `IsOpen.exists_rat`
> lemma; the rational-in-every-nonempty-open fact is what A.1's own proof uses internally
> (`u_dense.exists_mem_open`). For the C→A wiring you do NOT need to pick rationals by hand —
> A.1 does it for you. If you ever do, use `exists_rat_btwn` on the interval endpoints.

---

## Ecosystem search — no prior formalization to reuse (build B/C from scratch)

- **Mathlib has NO quasi-arithmetic mean / bisymmetric / Aczél functional-equation theory.**
  `gh search code` over `leanprover-community/mathlib4` for `quasi-arithmetic`, `bisymmetric`,
  `Aczel` returned **zero hits**. Mathlib's only "functional equation" hits are L-series/zeta
  (`NumberTheory.LSeries.*`, `RiemannZeta`) — unrelated.
- **Open PRs/issues:** `gh search prs/issues` on `leanprover-community/mathlib4` for
  `quasi-arithmetic` / `bisymmetric` → **none**. No in-flight work to wait on or rebase against.
- **Broader GitHub (language:Lean):** the only repo mentioning "quasi-arithmetic mean" /
  "bisymmetric" in a means/Aczél sense is **this project itself** (`szl-holdings/lutar-lean`,
  e.g. `Lutar/Wave4/LambdaBisymmetryWitness.lean`). The `teorth/equational_theories` project
  concerns magma equational laws, NOT means — not reusable here.
- **Lean Zulip:** no thread specifically on "uncountably many disjoint intervals",
  quasi-arithmetic means, or Aczél's theorem. The relevant Mathlib API (`Topology.Perfect`,
  `Topology.Bases` separable lemmas, `LeftRightLim`) is the de-facto community answer; the
  "perfect_space" discussions in the archive are Isabelle-side and not Lean formalizations.
  Zulip archive index: [leanprover-community archive](https://leanprover-community.github.io/archive/stream/287929-mathlib4/).
- **Implication:** Sub-lemmas **B and C must be built**, but they rest entirely on the
  general-topology/order primitives catalogued above. Sub-lemma **A is fully off-the-shelf**.

---

## Literature — citable, formalization-friendly sources

1. **PARENT PAPER (the rigorous proof to follow) — Burai, Kiss, Szokol,
   "Characterization of quasi-arithmetic means without regularity condition".**
   *Acta Math. Hungar.* **165** (2021) 474–485. arXiv:2107.07391.
   - Open-access HTML: [ar5iv.labs.arxiv.org/html/2107.07391](https://ar5iv.labs.arxiv.org/html/2107.07391).
   - Abstract page / DOI: [arXiv:2107.07391](https://arxiv.org/abs/2107.07391),
     [doi:10.48550/arXiv.2107.07391](https://doi.org/10.48550/arXiv.2107.07391).
   - **Why it matters:** **Theorem 8** is the FULL proof that BKS 2208.07083 Lemma 6 only
     sketches ("see [4, proof of Theorem 8 on p. 479]"). It is the cleanest, most
     formalization-friendly statement of the entire `dyadic_image_dense` argument, including
     the **light uncountability route** (monotone extension + injectivity, NO perfect sets).
     Step-by-step extract saved to `cut1_sources/BKS_2107.07391_Thm8_proof_extract.txt`.
     Use this as the line-by-line spec for B/C/D.

2. **TARGET PAPER — Burai, Kiss, Szokol, "A dichotomy result for strictly increasing
   bisymmetric maps".** *J. Math. Anal. Appl.* **528** (2023) 127269.
   - DOI: [10.1016/j.jmaa.2023.127269](https://doi.org/10.1016/j.jmaa.2023.127269)
     ([ScienceDirect S0022247X2300272X](https://www.sciencedirect.com/science/article/abs/pii/S0022247X2300272X)).
   - arXiv: [2208.07083](https://arxiv.org/abs/2208.07083); open-access PDF mirror:
     [real.mtak.hu/163273](https://real.mtak.hu/163273/1/2208.07083v1.pdf).
   - **Lemma 6** = the CUT-1 target. Its proof defers to paper #1's Theorem 8.

3. **BOUNDARY / HONESTY CITATION — Gergely Kiss, "On noncontinuous bisymmetric strictly
   monotone operations".** arXiv:**2601.16247** (submitted 2026-01-22).
   - [arXiv:2601.16247](https://arxiv.org/abs/2601.16247);
     HTML: [arxiv.org/html/2601.16247v2](https://arxiv.org/html/2601.16247v2).
   - **Why it matters (the honest limit):** constructs a bisymmetric, strictly increasing,
     symmetric, **non-reflexive** `F(x,y)=f⁻¹(αf(x)+βf(y))` (α+β≠1, `f` mapping onto a
     **perfect, nowhere-dense fractal set**) that is **discontinuous in every section**. This
     is the precise reason reflexivity+symmetry cannot be dropped from Lemma 6 — cite it so
     reviewers see the boundary is understood. It ALSO proves the complementary positive
     result (its **Theorem 2.4**): reflexive + partially-strictly-increasing + symmetric +
     bisymmetric ⇒ continuous quasi-arithmetic — i.e. an independent re-derivation of exactly
     the regime CUT-1 formalizes.

4. **MULTIVARIATE GENERALIZATION (optional context) — Kiss, Shulman, "N-ary quasi-arithmetic
   means and families without regularity".** arXiv:**2606.05221** (2026).
   - [arXiv:2606.05221](https://arxiv.org/abs/2606.05221);
     HTML: [arxiv.org/html/2606.05221v1](https://arxiv.org/html/2606.05221v1).
   - Confirms the method is "a **recursive construction on n-adic rationals** given by
     bisymmetry, and a **dense-domain continuity argument**" — the same skeleton, n-ary.
     Useful if the team later generalizes the generator.

5. **CLASSICAL GENERATOR SOURCE — J. Aczél & J. Dhombres, *Functional Equations in Several
   Variables*, Encyclopedia of Mathematics and its Applications 31, Cambridge Univ. Press
   (1989), pp. 287–290.** The original recursive dyadic generator `f((d1+d2)/2)=F(f d1,f d2)`,
   its well-definedness, strict monotonicity, and independence-of-sequence-choice for the
   left/right limits `X,Y` (p.289). Not open-access; the parent paper #1 reproduces every
   step needed, so #1 is the practical formalization reference.

---

## One-paragraph wiring summary for the dev teams

Build the disjoint-interval family `U : ℝ → Set ℝ`, `U α = Set.Ioo (F X α) (F Y α)`, indexed
over the two-sided accumulation points `a : Set ℝ` of `closure (f '' D)`. **Sub-lemma C**
(order bookkeeping with the Wave18 generator identity + partial strict monotonicity) proves
`a.PairwiseDisjoint U`, with each `U α` open (`isOpen_Ioo`) and nonempty (`F X α < F Y α`).
Feed into **Sub-lemma A = `Set.PairwiseDisjoint.countable_of_isOpen`** (separability of ℝ is
automatic) to get `a.Countable`. **Sub-lemma B** proves `a` is uncountable via: extend the
monotone dyadic `f` to `[0,1]` using `Monotone.rightLim`/`leftLim`, get strict monotonicity ⇒
injectivity ⇒ `closure(f '' D)` uncountable (`Cardinal.mk_Ioo_real`/`not_countable_real`),
then `Monotone.countable_not_continuousAt` shows only countably many non-two-sided points, so
two-sided points are uncountable. `Countable ∧ Uncountable` ⇒ ⊥ ⇒ `f '' D` dense
(`dyadic_image_dense`). Finally **D**: `DenseRange f` + `Monotone f` ⇒
`Monotone.continuous_of_denseRange` ⇒ the continuous strictly-increasing extension satisfying
(3), which Wave18's `gen_continuous_of_denseRange` consumes. **Axiom hygiene:** every cited
Mathlib lemma is ordinary (no extra axioms), so `#print axioms ⊆ {propext, Classical.choice,
Quot.sound}` is preserved. **Honesty:** closing CUT-1 makes the *conditional* Λ-uniqueness
chain axiom-clean end-to-end on the stated hypotheses; it does NOT make Λ unconditional
(Conjecture 1 stays), and Kiss 2026 (arXiv:2601.16247) is the cited reason
reflexivity+symmetry cannot be dropped.
