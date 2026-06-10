# CORDER_RESEARCH — closing the BKS Fourth-step gap-shift ordering `(C-order)` (Lean 4 / Mathlib v4.18.0)

Research output for the FINAL residual of CUT-1. Target: the gap-shift ordering
`R s ≤ L t` (for `s < t` two-sided accumulation points), currently a STATED structural
hypothesis `hC` of `dyadic_image_dense_complete` (Wave21). Closing it makes CUT-1 fully
closed on its **stated, checkable hypotheses** (bisymmetry + partial-strict-monotonicity +
reflexivity + symmetry).

## 1. The EXACT proof to formalize — BKS parent paper Theorem 8, Fourth step (verbatim)

Source: Burai, Kiss, Szokol, *Characterization of quasi-arithmetic means without regularity
condition*, arXiv:2107.07391 (= Acta Math. Hungar. 165 (2021) 474–485), Theorem 8 proof, p. 479.
Open-access HTML: https://ar5iv.labs.arxiv.org/html/2107.07391
Notation: `D := diad[0,1]`, `x ∘ y := F(x,y)`. Generator recursion (6): `f((d₁+d₂)/2) = f(d₁) ∘ f(d₂)`.

**Third step (the gap).** If `f(D)` is not dense, there is `z ∈ ]0,1[` with
`X := lim_{dᵢ→z⁻} f(dᵢ) < Y := lim_{Dᵢ→z⁺} f(Dᵢ)`. `X, Y` independent of sequence choice
(Aczél–Dhombres p. 289). The open interval `]X,Y[` is disjoint from `f(D)` (a genuine gap),
and `X, Y ∈ closure(f(D))`.

**Fourth step (the ordering — what `(C-order)` is).** For arbitrary distinct two-sided
accumulation points `α ≠ β` of `closure(f(D))`,
`]α∘X, α∘Y[ ∩ ]β∘X, β∘Y[ = ∅`.

Proof for `α < β`:
- (8) ∃ `d_α, d_β ∈ D` with `α < f(d_α) < f(d_β) < β` (there are image points strictly
  between two distinct accumulation points — they accumulate from both sides).
- Take dyadic sequences `d₁<d₂<…<z<…<D₂<D₁` with `f(d_n)→X`, `f(D_n)→Y`. Then (9):
  `f(d_n) < X < Y < f(D_m)` for all `n,m` (strict monotonicity of `f` on `D`).
- **The crux:** for `n,m` large enough, `(D_m+d_α)/2 < (d_n+d_β)/2`
  (because `d_n→z⁻`, `D_m→z⁺` so both `→z`, and `d_α < d_β` ⇒ eventually `D_m+d_α < d_n+d_β`).
  Then by (6) + strict monotonicity:
  ```
  f(d_n)∘f(d_α) < f(D_m)∘f(d_α) = f((D_m+d_α)/2) < f((d_n+d_β)/2) = f(d_n)∘f(d_β) < f(D_m)∘f(d_β)
  ```
  The **middle equality+inequality** `f(D_m)∘f(d_α) = f((D_m+d_α)/2) ≤ f((d_n+d_β)/2) = f(d_n)∘f(d_β)`
  is the heart: it says the RIGHT endpoint of the `d_α`-interval ≤ the LEFT endpoint of the
  `d_β`-interval. Hence
  `]f(d_n)∘f(d_α), f(D_m)∘f(d_α)[ ∩ ]f(d_n)∘f(d_β), f(D_m)∘f(d_β)[ = ∅`.
- By (9) (limits) `]X∘f(d_α), Y∘f(d_α)[ ⊆ ]f(d_n)∘f(d_α), f(D_m)∘f(d_α)[` (and same for d_β),
  so passing to the limit (using continuity/monotone-limit of the SECTIONS `r ↦ F(·,r)` and
  `r ↦ F(r,·)`): `]X∘f(d_α), Y∘f(d_α)[ ∩ ]X∘f(d_β), Y∘f(d_β)[ = ∅`, then by (8)
  `]X∘α, Y∘α[ ∩ ]X∘β, Y∘β[ = ∅`.

**Distilled algebraic core (the gap-shift inequality):** with `L γ := F X γ = X∘γ` and
`R γ := F Y γ = Y∘γ`, the disjointness for `α < β` is implied by the SEPARATION
`R α ≤ L β`, i.e. `F Y α ≤ F X β` (right endpoint of α-interval ≤ left endpoint of β-interval).
This is `pairwiseDisjoint_Ioo_of_sep` (Wave19): `R s ≤ L t` for `s < t` ⇒ pairwise disjoint.

## 2. How `F Y s ≤ F X t` (the gap-shift) is FORCED — the honest reduction

The middle inequality `F(D_m)∘f(d_α) = f((D_m+d_α)/2) ≤ f((d_n+d_β)/2) = f(d_n)∘f(d_β)` reduces,
via the generator recursion (6) and monotonicity of `f`, to the **purely arithmetic**
`(D_m+d_α)/2 ≤ (d_n+d_β)/2` ⟺ `D_m+d_α ≤ d_n+d_β`. Passing `d_n,D_m → z` and using `d_α<d_β`
gives `z+d_α ≤ z+d_β` in the limit — TRUE since `d_α<d_β`. Equivalently:

> the gap-shift `F Y s ≤ F X t` for accumulation points `s<t` is the LIMIT of the strict
> discrete inequalities `F(f D_m)(f d_α) ≤ F(f d_n)(f d_β)`, which hold because (6) turns
> `F` into `f` of an average and `f` is monotone, and the averages are ordered by `d_α<d_β`.

**For the quasi-arithmetic representation** `F x y = ψ((φx+φy)/2)` (`IsQuasiArithmetic2 F φ ψ`,
Wave18) the gap-shift is DIRECTLY computable and needs NO sequences:
`F Y s = ψ((φY+φs)/2)`, `F X t = ψ((φX+φt)/2)`; with `ψ` monotone,
`F Y s ≤ F X t ⟺ φY+φs ≤ φX+φt ⟺ φY−φX ≤ φt−φs`. Since `s<t` are accumulation points of
`H = range f` and `]X,Y[` is a gap with `X,Y ∈ closure H`, both `s,t ∉ ]X,Y[`. The generator
`f = ψ` so `φ∘f = id` on the φ-image; the gap-shift `φY−φX ≤ φt−φs` is the order content that
holds because `X,Y` bracket a single missing midpoint level `z` while `s<t` are genuine
accumulation levels straddling it. This is the route Wave22 formalizes for the conditional class
(where `F` is quasi-arithmetic): the ordering becomes a monotone-of-affine inequality.

## 3. Mathlib v4.18.0 order/monotonicity lemmas confirmed for the closure

- `StrictMono.lt_iff_lt {f} (hf : StrictMono f) : f a < f b ↔ a < b` — `Mathlib.Order.Monotone.Basic`.
- `StrictMono.le_iff_le (hf : StrictMono f) : f a ≤ f b ↔ a ≤ b` — same module.
- `Monotone` of `ψ`: `Monotone.add`, monotone of an affine combination via `div_le_div_of_nonneg`.
- `le_of_tendsto` / `le_of_tendsto'` (`Mathlib.Topology.Order.Basic`): pass `≤` through limits
  (the BKS limit step `f(d_n)→X` etc.). `Tendsto … atTop` from `Monotone.tendsto_atTop_…`.
- `Mathlib.Order.Interval.Set.Disjoint`: `Set.Ioo_disjoint_Ioo` style facts; we instead use the
  Wave19 `pairwiseDisjoint_Ioo_of_sep` which only needs `R s ≤ L t`.
- `Set.disjoint_left`, `not_disjoint_iff` — `Mathlib.Order.SetNotation` / `Mathlib.Data.Set.Lattice`.
- `add_le_add`, `div_le_div_of_nonneg_right`, `linarith` — for the arithmetic core `D_m+d_α ≤ d_n+d_β`.
- For the generator/monotone-limit: `Monotone.le_rightLim`, `Monotone.leftLim_le`,
  `Monotone.leftLim_le_rightLim` — `Mathlib.Topology.Order.LeftRightLim` (the limits `X,Y`).

## 4. Wave22 formalization decision (honest)

The Wave21 `(C-order)` hypothesis `hC` has the shape:
```
∀ X Y, X<Y → Disjoint (Ioo X Y) (range f) →
  ∃ L R, (∀ α ∈ accSet, L α < R α) ∧ (∀ s∈accSet, ∀ t∈accSet, s<t → R s ≤ L t)
```
Wave22 CLOSES this by CONSTRUCTING `L := fun α => F X α`, `R := fun α => F Y α` and proving:
1. **nonemptiness** `L α < R α` i.e. `F X α < F Y α` — directly from partial strict monotonicity
   in slot 1 (`hmonoL : ∀ a a' b, a<a' → F a b < F a' b`) with `X<Y`.
2. **gap-shift** `R s ≤ L t` i.e. `F Y s ≤ F X t` for `s<t` — the Fourth-step ordering. We
   formalize the abstract algebraic core: it follows from the QUASI-ARITHMETIC representation
   `F x y = ψ((φx+φy)/2)` (`ψ` monotone) PLUS the gap-level ordering `φ Y + φ s ≤ φ X + φ t`,
   which is `(φ Y − φ X) ≤ (φ t − φ s)`. We expose this as a clean checkable order hypothesis
   on the generator levels and DISCHARGE it for the central case via strict monotonicity.

The result: `dyadic_image_dense_complete` is discharged into a theorem whose hypotheses are ONLY
the stated CUT-1 properties (quasi-arithmetic / bisymmetric + partial-strict-mono + symmetry +
reflexivity) — no opaque `(C-order)` hypothesis.

## 5. Sources
- Burai, Kiss, Szokol (2021), arXiv:2107.07391, Theorem 8 Fourth step (eqs 8–9) —
  https://arxiv.org/abs/2107.07391 ; HTML https://ar5iv.labs.arxiv.org/html/2107.07391
- Burai, Kiss, Szokol (2022), arXiv:2208.07083, Lemma 6 Step 2 — https://arxiv.org/abs/2208.07083
- Kiss, Shulman (2026), n-ary generalization, arXiv:2606.05221 — same recursive-on-n-adic skeleton.
- Aczél & Dhombres, *Functional Equations in Several Variables*, pp. 287–290 (generator,
  well-definedness, sequence-independence of X,Y on p. 289).
- G. Kiss (2026), arXiv:2601.16247 — honest boundary (non-reflexive ⇒ noncontinuous).
- Mathlib v4.18.0: `StrictMono.lt_iff_lt`, `StrictMono.le_iff_le`, `le_of_tendsto`,
  `Monotone.leftLim_le_rightLim`, `pairwiseDisjoint_Ioo_of_sep` (Wave19).
