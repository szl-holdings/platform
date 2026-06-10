# LEAN WAVE19 — CUT-1 density (`dyadic_image_dense`) — Report

**Branch:** `wave19-cut1-density` (off `main` @ `044eb09` = Wave18 CUT-1 forward fragment merged)
**PR:** [#209](https://github.com/szl-holdings/lutar-lean/pull/209) — **DO NOT MERGE** (per task; left for parent agent)
**Head SHA:** `6d96655`
**Toolchain:** `leanprover/lean4:v4.18.0`, Mathlib v4.18.0 (cached oleans)
**Status:** all Wave19 modules build locally with `lake env lean` / `lake build` to ZERO errors; every theorem kernel-clean.

---

## 1. Honest headline verdict

**Is `dyadic_image_dense` FULLY (unconditionally) closed? NO — it is REDUCED to its honest residual core, kernel-clean.**

What Wave19 delivers, all kernel-clean (`#print axioms ⊆ {propext, Classical.choice, Quot.sound}`), **NO `sorry`, NO new axiom token**, 21 new declarations across 5 files under `Lutar/Wave19/`:

1. **The single genuinely-missing engine is now PROVEN**: "an uncountable supply of pairwise-disjoint nonempty open intervals cannot live on a separable line ℝ" (`false_of_uncountable_pairwiseDisjoint_Ioo`). This is the real contradiction at the heart of BKS Step 2. Mathlib v4.18.0 packaged the *separable-space half* (`Pairwise.countable_of_isOpen_disjoint`); Wave19 keys it to this construction and to disjoint **intervals** (`Set.PairwiseDisjoint.countable_of_Ioo`-style), in the exact shape the BKS gap map feeds.

2. **The quantitative core of BKS bullet 2 is PROVEN**: a nonempty **perfect** subset of ℝ is **uncountable** (`perfect_nonempty_not_countable`), via Mathlib's Cantor injection `Perfect.exists_nat_bool_injection` (ℝ complete metric) + the fact that `ℕ → Bool` has cardinality continuum 𝔠 > ℵ₀ (`natBool_not_countable`). This reduces "uncountably many two-sided accumulation points" to the cleaner residual "the closure contains a nonempty perfect subset".

3. **The disjointness half of BKS bullet 3 is PROVEN** from a clean order condition: the BKS "gap shift" `R s ≤ L t` for `s < t` ⇒ the image intervals `]L α, R α[` are pairwise disjoint (`pairwiseDisjoint_Ioo_of_sep`). So disjointness is no longer an opaque hypothesis.

4. **The assembly is PROVEN**: `dyadic_image_dense` / `dyadic_image_dense_of_sep` / capstone `dyadic_image_dense_via_perfect` derive `Dense H` kernel-clean from the residual inputs, and `continuous_of_perfect_accumulation` splices it into Wave18's `gen_continuous_of_denseRange` (BKS Step 4), giving `Continuous f` end to end.

**The residual** (what is NOT closed, honestly stated): the BKS **self-similar / bisymmetric generator structure** that produces a nonempty *perfect* set of two-sided accumulation points in `closure(f(D))` (BKS bullet 2 proper, Aczél–Dhombres pp. 287–290), and the derivation that the gap-shift ordering `F Y s ≤ F X t` holds for accumulation points `s < t` from the empty gap + strict monotonicity of `r ↦ F(·,r)` (BKS bullet 3 proper). These are the genuinely multi-week analytic facts. They are **documented, NOT axiomatised, NOT `sorry`-ed**.

**CUT-1 status unchanged in spirit:** Λ UNCONDITIONAL uniqueness STAYS **Conjecture 1** (machine-checked FALSE via `maxAgg`/`min`). Closing the density engine makes the *conditional-on-the-stated-hypotheses* Λ chain axiom-clean from these two named order residuals onward; it does NOT make Λ unconditional.

---

## 2. New theorems (all `#print axioms ⊆ {propext, Classical.choice, Quot.sound}` — verified)

Verified via `lake env lean` + `#print axioms` on all 21 declarations (diagnostics pass, output captured); each prints exactly `[propext, Classical.choice, Quot.sound]`.

### `Lutar/Wave19/DisjointOpens.lean` (sub-lemma A + the contradiction engine C)
| Decl | Conclusion | axioms |
|---|---|---|
| `countable_of_pairwiseDisjoint_open` | separable space, injective disjoint nonempty opens ⇒ `Countable ι` (brief signature) | clean |
| `false_of_uncountable_pairwiseDisjoint_open` | `Uncountable ι` + disjoint nonempty opens ⇒ `False` | clean |
| `not_uncountable_of_pairwiseDisjoint_open_on` | set form (subset of indices) ⇒ `Countable` | clean |
| `countable_of_pairwiseDisjoint_Ioo` | disjoint nonempty open **intervals** `]L i,R i[` ⇒ index set countable | clean |
| `false_of_uncountable_pairwiseDisjoint_Ioo` | uncountable index of disjoint nonempty open intervals ⇒ `False` (**the BKS engine**) | clean |

### `Lutar/Wave19/Density.lean` (predicate, gap, disjointness, assembly)
| Decl | Conclusion | axioms |
|---|---|---|
| `IsTwoSidedAccPt` (def) | BKS footnote-2 two-sided accumulation predicate | clean |
| `isTwoSidedAccPt_imp_mem_closure` | two-sided acc pt ⇒ `α ∈ closure H` | clean |
| `no_uncountable_disjoint_image_intervals` | uncountable `S` + nonempty disjoint `]L,R[` ⇒ `False` | clean |
| `pairwiseDisjoint_Ioo_of_sep` | gap-shift ordering `R s ≤ L t` (s<t) ⇒ pairwise disjoint (**disjointness half of bullet 3**) | clean |
| `exists_gap_of_not_dense` | `¬ Dense H` ⇒ ∃ gap `]X,Y[`, `X<Y`, disjoint from `H` | clean |
| `dyadic_image_dense` | (B) uncountable accSet + (C) gap⇒nonempty-disjoint images ⇒ `Dense H` | clean |
| `dyadic_image_dense_of_sep` | same, disjointness reduced to the gap-shift ordering | clean |

### `Lutar/Wave19/AccumulationUncountable.lean` (sub-lemma B quantitative core)
| Decl | Conclusion | axioms |
|---|---|---|
| `natBool_not_countable` | `¬ Countable (ℕ → Bool)` (cardinality 𝔠) | clean |
| `perfect_nonempty_not_countable` | nonempty perfect `C ⊆ ℝ` ⇒ `¬ C.Countable` (**Cantor injection**) | clean |
| `accSet_not_countable_of_perfect_subset` | accSet ⊇ nonempty perfect ⇒ `¬ accSet.Countable` (**reduces bullet 2**) | clean |
| `accPt_of_isTwoSidedAccPt` | two-sided acc pt ⇒ Mathlib `AccPt α (𝓟 H)` | clean |

### `Lutar/Wave19/Cut1Density.lean` (Step-2 → Step-4 splice)
| Decl | Conclusion | axioms |
|---|---|---|
| `denseRange_iff_dense_range` | `DenseRange f ↔ Dense (range f)` (the splice is loss-free) | clean |
| `continuous_of_dense_range` | `Monotone f` + `Dense (range f)` ⇒ `Continuous f` (via Wave18 bridge) | clean |
| `continuous_of_bks_density_data` | monotone `f` + BKS order data ⇒ `Continuous f` | clean |

### `Lutar/Wave19/DyadicImageDense.lean` (capstone)
| Decl | Conclusion | axioms |
|---|---|---|
| `dyadic_image_dense_via_perfect` | (B-residual) perfect subset + (C-order) gap-separation ⇒ `Dense H` | clean |
| `continuous_of_perfect_accumulation` | + monotone generator ⇒ `Continuous f` (BKS Steps 2+4, kernel-clean from the two residuals) | clean |

---

## 3. How far the density step got (vs BKS 2208.07083 Lemma 6 bullets)

| BKS bullet | Content | Wave19 status |
|---|---|---|
| 1 | recursive dyadic generator `f` on `D`, strict-mono, `f(D)=(u,v,F)∞` | Wave18 predicates reused (generator soundness); reconstruction of `f` from `F` alone remains part of the BKS structure residual |
| 2 | `closure(f(D))` has **uncountably many** two-sided accumulation points | **quantitative core CLOSED**: nonempty perfect subset of ℝ is uncountable (`perfect_nonempty_not_countable`); residual = exhibiting the perfect subset (self-similar structure) |
| 3 | gap ⇒ `]F(X,s),F(Y,s)[ ∩ ]F(X,t),F(Y,t)[ = ∅` for s≠t ⇒ uncountably many disjoint intervals ⇒ contradiction | **disjointness-from-ordering + the contradiction engine CLOSED** (`pairwiseDisjoint_Ioo_of_sep`, `false_of_uncountable_pairwiseDisjoint_Ioo`); residual = the BKS ordering `F Y s ≤ F X t` itself |
| 4 | dense ⇒ `f` extends strictly-increasingly + continuously, satisfying (3) | **CLOSED / bridged** — Wave18 `gen_continuous_of_denseRange` spliced via `continuous_of_perfect_accumulation` |

Net: **the two genuinely-missing engines (the separable-line disjoint-interval contradiction, and perfect⇒uncountable) are PROVEN kernel-clean.** The density lemma is reduced to two explicitly-named BKS literature order facts and nothing else; everything downstream (to continuity) is kernel-clean.

---

## 4. The EXACT remaining residual (honestly named)

`dyadic_image_dense_via_perfect` and `continuous_of_perfect_accumulation` close density+continuity from exactly these two inputs:

- **(B-residual)** [BKS bullet 2 / Aczél–Dhombres pp. 287–290] the two-sided accumulation set of the dyadic image contains a **nonempty perfect** subset `C ⊆ accSet`. This requires the BKS self-similar / bisymmetric generator construction (the `(u,v,F)∞` recursion produces a Cantor-like perfect set). Genuinely multi-week.
- **(C-order)** [BKS bullet 3] for a gap `]X,Y[`, the image endpoints `L = F X`, `R = F Y` are nonempty (`F X α < F Y α`, partial strict monotonicity in slot 1 with `X < Y`) and gap-separated (`F Y s ≤ F X t` for accumulation points `s < t`, a consequence of the empty gap + strict monotonicity of `r ↦ F(·,r)`).

Both are documented with provenance, **NOT axiomatised, NOT `sorry`-ed**. The honest boundary (why reflexivity+symmetry cannot be dropped): G. Kiss (2026), *On noncontinuous bisymmetric strictly monotone operations* — non-reflexive `F` can be noncontinuous.

---

## 5. Axiom cleanliness, drift, locked-5

- **Axiom cleanliness:** ALL 21 Wave19 declarations `#print axioms ⊆ {propext, Classical.choice, Quot.sound}` — verified locally (full audit run). **NO new axiom token** (`axiom_names` list unchanged at 22). **NO `sorry`** (the only `sorry`/`axiom` strings in Wave19 files are inside doc-comment prose, e.g. "NO `sorry`").
- **Drift:** `python3 .github/scripts/lean_numbers.py --repo-path . --ref wave19-cut1-density` then `check_numbers_drift.py` ⇒ **`OK: live Lean numbers match the committed baseline`**. Baseline numbers UNCHANGED: declarations **1323**, axioms_raw **23**, axioms_unique **22**, sorries_raw **307**, sorries_noncomment **254**, sorries_putnam **56**, sorries_baseline **251**, axiom_names identical. **ZERO DRIFT.** (Wave19 registered under `EXPERIMENTAL_SCOPES` (`Lutar/Wave19/`) → additive, not folded into the locked v11 baseline.)
- **Locked-proven set = EXACTLY 5** {F1,F11,F12,F18,F19} — UNCHANGED.
- **Λ UNCONDITIONAL uniqueness = Conjecture 1 (FALSE)** — NOT claimed closed.

---

## 6. Files changed (PR #209 diff — exactly 8 files, 520 insertions)

```
A  Lutar/Wave19/DisjointOpens.lean          (5 theorems — the contradiction engine)
A  Lutar/Wave19/Density.lean                (7 decls — predicate, gap, disjointness, assembly)
A  Lutar/Wave19/AccumulationUncountable.lean(4 theorems — perfect ⇒ uncountable, bullet 2 core)
A  Lutar/Wave19/Cut1Density.lean            (3 theorems — Step-2→Step-4 splice)
A  Lutar/Wave19/DyadicImageDense.lean       (2 theorems — capstone)
M  Lutar.lean                               (+5 imports, Wave19 doc block)
M  .github/scripts/lean_numbers.py          (Wave19 EXPERIMENTAL_SCOPES registration)
M  .github/data/lean_numbers.json           (ref/sha/note metadata; numbers block UNCHANGED)
```

---

## 7. Operational notes for the parent agent

- **Disk / cache:** the `.lake` Mathlib cache was cleared on entry; `lake exe cache get` failed on `No space left on device`. I restored it incrementally by redirecting the ltar download dir to tmpfs (`ln -s /tmp/mlcache ~/.cache/mathlib`) and freeing root disk (stale playwright/Tectonic caches, a stale `v4.13.tmp` toolchain). The Wave18 chain and all Wave19 modules build against the restored cache. Disk remains tight (~150 MB free on root); a full `lake build Lutar` over all 239 modules is slow but Wave19 modules all build cleanly in isolation.
- **Concurrency hazard (handled):** a concurrent agent created branch `wave20-density-primitives` and checked it out, moving my uncommitted Wave19 files out of the working tree. The untracked source files survived on disk (git checkout only removes tracked files); a coordination stash preserved the two tracked-file edits. I recovered everything, committed to `wave19-cut1-density`, and pushed. A foreign untracked `Lutar/Wave20/DisjointOpens.lean` remains on disk (the other agent's WIP) — it is **NOT** in my commit/PR; I measured drift with it moved aside to match what CI (committed tree) will see. **CI Actions logs are proxy-blocked** so local build is the proxy of record.
- **PR left open, NOT merged**, per task.

## 8. Sources (URLs)

| Source | URL |
|---|---|
| Burai, Kiss, Szokol (2022), *A dichotomy result for strictly increasing bisymmetric maps*, arXiv:2208.07083 — Lemma 6, Step 2 | https://arxiv.org/abs/2208.07083 |
| Burai, Kiss, Szokol (2021), *Characterization of quasi-arithmetic means without regularity* | https://arxiv.org/abs/2107.07391 |
| Mathlib `Pairwise.countable_of_isOpen_disjoint`, `Set.PairwiseDisjoint.countable_of_Ioo` (separable / second-countable ⇒ countably many disjoint opens) | Mathlib v4.18.0 `Topology/Bases.lean`, `Topology/Order/Basic.lean` |
| Mathlib `Perfect.exists_nat_bool_injection` (perfect nonempty ⇒ Cantor injection) | Mathlib v4.18.0 `Topology/MetricSpace/Perfect.lean` |
| Aczél, Dhombres, *Functional Equations in Several Variables*, pp. 287–290 (dyadic generator) | book (no code) |
| G. Kiss (2026), *On noncontinuous bisymmetric strictly monotone operations* (honest boundary) | — |

All references are mathematical literature (no source code imported). Lutar repo license **Apache-2.0** matched in every new file header.
