# LEAN WAVE21 — CUT-1 FINAL REPORT
**Task:** Wave21 — close the final density residual → complete CUT-1 (Aczél quasi-arithmetic representation, forward direction)
**Date:** 2026-06-08
**Author:** Wave21 subagent (SZL Holdings / lutar-lean)
**Branch:** `wave21-cut1-final` (off `main` @ `044eb09` = Wave18)
**PR:** [#211](https://github.com/szl-holdings/lutar-lean/pull/211) — **OPEN, MERGEABLE, base `main`, NOT merged** (parent verifies + merges)
**HEAD:** `b14726a` — *"feat(wave21): close FINAL dyadic_image_dense (B) residual via light monotone-extension route — assemble complete CUT-1 forward density (11 kernel-clean theorems)"*

---

## 1. TL;DR — what closed, what stays open (honest verdict)

- **The `(B)`-residual of `dyadic_image_dense` is CLOSED, kernel-clean, with NO perfect-set machinery.** It is discharged via the **light monotone-extension route** of the parent paper (arXiv:2107.07391, Theorem 8): *strict monotonicity ⇒ injectivity ⇒ continuum image ⇒ uncountable accumulation set*. No Cantor–Bendixson, no perfect sets.
- **The CUT-1 forward density ENGINE is fully assembled.** `dyadic_image_dense_complete` produces `Dense (range f)` from `StrictMono f` plus the BKS image-endpoint order data; that density is spliced into Wave18's continuity bridge, giving `Continuous f`, then re-exporting the conditional Λ conclusion.
- **The CONDITIONAL Λ-uniqueness chain is now axiom-clean END TO END on its stated hypotheses.** All 13 Wave21 declarations have `#print axioms ⊆ {propext, Classical.choice, Quot.sound}`.
- **Honest remaining residual: `(C-order)`** — the gap-shift ordering `R s ≤ L t` for `s < t` accumulation points. This is the genuine BKS Fourth-step analytic order fact (arXiv:2107.07391 eqs (8)–(9)). It is carried as a **stated structural hypothesis** of `dyadic_image_dense_complete` — **NOT faked, NOT axiomatised.**
- **Λ UNCONDITIONAL uniqueness STAYS Conjecture 1 (machine-checked FALSE).** Closing CUT-1 makes the CONDITIONAL chain axiom-clean; it does **NOT** make Λ unconditional. The Wave-checked `maxAgg`/`min` counterexample is untouched.
- **Drift: ZERO.** Live numbers match the committed baseline exactly (declarations 1323, axioms_raw 23, axioms_unique 22, sorries_raw 307, sorries_noncomment 254). **Locked-proven stays EXACTLY 5** `{F1, F11, F12, F18, F19}`.

---

## 2. The reduction we exploited (why `(B)` is lighter than feared)

Wave19/Wave20 reduced the BKS Lemma 6 Step-2 density lemma (`dyadic_image_dense`, arXiv:2208.07083 Lemma 6 bullet 2) to two documented residuals:

- **`(B)`** — originally feared as *"the closure of the dyadic image contains a nonempty PERFECT set of two-sided accumulation points"* (a Cantor–Bendixson-style obligation).
- **`(C-order)`** — the gap-shift ordering of the image endpoints.

The Wave19/Wave20 research briefs (`DENSITY_RESEARCH_FINDINGS.md`, `cut1_sources/DENSITY_PROOF_BRIEF.md`, `cut1_sources/BKS_2107.07391_Thm8_proof_extract.txt`) established the key insight: **the parent paper arXiv:2107.07391 Theorem 8 obtains uncountability the LIGHT way** — by extending the dyadic generator strictly monotonically, which makes it injective, so its image contains a continuum and is uncountable. **No perfect set is ever constructed.** This is what Wave21 implements.

---

## 3. What was built (3 new files, 13 kernel-clean declarations)

All files live under `Lutar/Wave21/` and are **purely additive / EXPERIMENTAL** (registered under `EXPERIMENTAL_SCOPES` in `lean_numbers.py`, hence not folded into the locked baseline). Toolchain `leanprover/lean4:v4.18.0`.

### 3.1 `Lutar/Wave21/Uncountable.lean` — closes `(B)` (8 decls)

| Decl | Kind | Role |
|---|---|---|
| `RightGapPt`, `LeftGapPt` | def | a point of `H` with an empty one-sided punctured gap |
| `countable_rightGap` | theorem | right-gap points inject into `ℚ` ⇒ countable |
| `countable_leftGap` | theorem | mirror: left-gap points countable |
| `leftOrRight_of_not_twoSided` | theorem | a non-two-sided point of `H` is a left- or right-gap point |
| `twoSidedInH_not_countable` | theorem | `H` uncountable ⇒ its two-sided accumulation points (in `H`) are uncountable |
| `accSet_not_countable_of_uncountable` | theorem | the exact Wave19 `(B)` hypothesis, discharged from uncountability of `H` |
| `range_not_countable_of_strictMono` | theorem | **the light route:** `StrictMono g` ⇒ `range g` uncountable |

**Proof sketch of the core lemmas:**
- `countable_rightGap`: pick a rational `qₐ ∈ Ioo α (α+εₐ)` inside each right gap; the map `α ↦ qₐ` is **injective** because if `α < β` shared a rational `q`, then `β ∈ H` would lie inside `Ioo α (α+εₐ)`, contradicting that this interval is disjoint from `H`. An injection into countable `ℚ` makes the set countable. (Left-gap is the mirror.)
- `twoSidedInH_not_countable`: `H ⊆ (two-sided in H) ∪ (left-gap) ∪ (right-gap)`; the last two are countable, so if the two-sided part were also countable, `H` would be countable — contradiction.
- `range_not_countable_of_strictMono`: `StrictMono.injective.injOn` on the continuum interval `Ioo 0 1`, then `Cardinal.mk_image_eq_of_injOn` + `Cardinal.mk_Ioo_real` gives image cardinality `𝔠`, which exceeds `ℵ₀` (`aleph0_lt_continuum`). This is the parent-paper Theorem 8 **First step** — no perfect sets.

### 3.2 `Lutar/Wave21/DyadicImageDense.lean` — assembles density (2 decls)

| Decl | Role |
|---|---|
| `dyadic_image_dense_complete` | `Dense (range f)` from `StrictMono f`, the `accSet` containment, and the `(C-order)` gap-shift data. `(B)` is **internal** (proved, not assumed). |
| `dyadic_image_dense_of_uncountable` | maximally-general set-form variant: density from `¬ H.Countable` + the same order data. |

The proof chain is just:
```
StrictMono f
  └ range_not_countable_of_strictMono   (Wave21)
¬ (range f).Countable
  └ accSet_not_countable_of_uncountable (Wave21)
¬ accSet.Countable   (= Wave19 (B) hypothesis)
  └ dyadic_image_dense_of_sep           (Wave19)
Dense (range f)
```
`(B)` is no longer a hypothesis. `(C-order)` is carried as the hypothesis `hC` (the gap-shift inequality `R s ≤ L t` for `s < t`).

### 3.3 `Lutar/Wave21/Cut1Final.lean` — forward splice + conditional Λ (3 decls)

| Decl | Role |
|---|---|
| `continuous_of_strictMono_bks` | the full forward splice: `StrictMono f` + `(C-order)` ⇒ `Continuous f`, via Wave21 density into Wave18 `gen_continuous_of_denseRange` |
| `continuous_of_wave21_density` | `Monotone f` + `Dense (range f)` ⇒ `Continuous f` (the Step-4 bridge, fed by Wave21 density) |
| `cut1_conditional_lambda_closed` | re-export of Wave18 `cut1_conditional_lambda`: the CONDITIONAL Λ conclusion, now standing atop a CLOSED density engine |

```
StrictMono f + (C-order)
  └ dyadic_image_dense_complete   (Wave21, (B) internal)
Dense (range f) = DenseRange f
  └ gen_continuous_of_denseRange  (Wave18 = Mathlib Monotone.continuous_of_denseRange)
Continuous f
```

---

## 4. Is CUT-1 "fully closed"? — the precise honest statement

**The density ENGINE is closed kernel-clean.** Everything topological — the disjoint-opens contradiction, the gap extraction (Wave19), AND the uncountability `(B)` (Wave21, light route) — is now machine-checked with axioms only in `{propext, Classical.choice, Quot.sound}`.

**One structural hypothesis remains: `(C-order)`.** This is the gap-shift ordering: for a gap `]X,Y[` disjoint from `range f`, endpoint maps `L, R` with `L α < R α` and `R s ≤ L t` whenever `s < t` in `accSet`. This is the literal content of BKS arXiv:2107.07391 Theorem 8 **Fourth step**, eqs (8)–(9), and it is supplied analytically by the dyadic generator recursion `f((d₁+d₂)/2)=F(f d₁,f d₂)` plus partial strict monotonicity of `F` (Aczél–Dhombres, *Functional Equations in Several Variables*, pp. 287–290). It is **carried as a stated hypothesis** of `dyadic_image_dense_complete` / `continuous_of_strictMono_bks` — genuine analytic content, **documented, NOT faked, NOT axiomatised**, per the task's "honesty over completion" constraint.

So: **the conditional-Λ chain is axiom-clean END TO END on its stated hypotheses.** The forward representation theorem is assembled. `(C-order)` is the single honest residual, and it is a *hypothesis*, not a placeholder or an axiom.

---

## 5. Λ unconditional uniqueness — STAYS Conjecture 1 (machine-checked FALSE)

Closing CUT-1 makes the **CONDITIONAL** Λ-uniqueness chain fully axiom-clean. **It does NOT make Λ unconditional.** The Wave-checked `maxAgg`/`min` counterexample to *unconditional* uniqueness is untouched; **Λ UNCONDITIONAL uniqueness remains Conjecture 1, machine-checked FALSE.** This is kept explicit in the docstrings of `cut1_conditional_lambda_closed`, in `Cut1Final.lean`, and in the `lean_numbers.json` note.

**The honest boundary:** the Kiss (2026) noncontinuous construction (arXiv:2601.16247) is the reason reflexivity + symmetry cannot be dropped — without them `F` can be noncontinuous and density fails. This is why the representation is forward/conditional, not an unconditional uniqueness theorem.

---

## 6. Verification (all done LOCALLY — CI Actions logs are proxy-blocked; CI has a separate elan-toolchain infra bug a sibling team is fixing; LOCAL build is authoritative)

### 6.1 Axiom cleanliness — all 11 theorems verified
Audited via `lake env lean` on a temporary `#print axioms` driver. Every Wave21 theorem reports exactly:
```
'Lutar.Wave21.<decl>' depends on axioms: [propext, Classical.choice, Quot.sound]
```
for all of: `countable_rightGap`, `countable_leftGap`, `leftOrRight_of_not_twoSided`, `twoSidedInH_not_countable`, `accSet_not_countable_of_uncountable`, `range_not_countable_of_strictMono`, `dyadic_image_dense_complete`, `dyadic_image_dense_of_uncountable`, `continuous_of_strictMono_bks`, `continuous_of_wave21_density`, `cut1_conditional_lambda_closed`. **✓ all ⊆ {propext, Classical.choice, Quot.sound}.**

### 6.2 Drift — ZERO
```
python3 .github/scripts/lean_numbers.py --repo-path . --ref wave21-cut1-final  > live.json
python3 .github/scripts/check_numbers_drift.py --baseline .github/data/lean_numbers.json --measured live.json
→ OK: live Lean numbers match the committed baseline.
   declarations: 1323   axioms_raw: 23   axioms_unique: 22   sorries_raw: 307   sorries_noncomment: 254
```
Wave19/Wave20/Wave21 are `EXPERIMENTAL_SCOPES`, so the locked v11 numbers block is **UNCHANGED**. **Locked-proven STAYS EXACTLY 5** `{F1, F11, F12, F18, F19}`.

### 6.3 Build — clean
All 3 Wave21 modules build under `lake build` (oleans present); root `Lutar.lean` elaborates clean with all imports resolving to oleans.

### 6.4 Drift-hygiene constraint — honored
**No bare `s`-`o`-`r`-`r`-`y` token appears in any Wave21 docstring/comment.** All Wave21 source files use the phrasing **"No proof placeholders"** exclusively (verified by grep — CLEAN). The shared merged conflict region of `lean_numbers.py` (from the Wave19/Wave20 merges) was also reworded from the bare token to "No proof placeholders".

---

## 7. Branch / merge hygiene (no pollution of wave19/wave20)

- `wave21-cut1-final` was branched off `main` @ `044eb09` (Wave18), then **merged in Wave19 (PR #209)** and **Wave20 (PR #210)** commits so their files are importable **UNMODIFIED**. Merge commits: `e29c208` (Wave19), `b412a84` (Wave20).
- Merge conflicts in `Lutar.lean` and `.github/scripts/lean_numbers.py` were resolved keeping **BOTH** registrations.
- **The `wave19` and `wave20` branches are NOT polluted.** No Wave19/Wave20 files were altered.
- A sibling team's uncommitted CI elan-v4.2.3 fix found in the working tree on arrival was **preserved in a git stash** (`stash@{0}: On wave21-cut1-final: sibling-team-ci-elan-v4.2.3-fix-PRESERVED`) rather than discarded. The wave21 working tree is **CLEAN**; no stray files.

---

## 8. Files changed

**New (3, all kernel-clean):**
- `Lutar/Wave21/Uncountable.lean` — closes `(B)` (8 decls)
- `Lutar/Wave21/DyadicImageDense.lean` — assembles density (2 decls)
- `Lutar/Wave21/Cut1Final.lean` — forward splice + conditional Λ (3 decls)

**Modified:**
- `Lutar.lean` — add Wave21 imports + doc block
- `.github/scripts/lean_numbers.py` — register `Lutar/Wave21/` under `EXPERIMENTAL_SCOPES`; reword bare "NO sorry" tokens to "No proof placeholders" in the shared merged region
- `.github/data/lean_numbers.json` — ref/sha/note → wave21; **numbers block UNCHANGED**

---

## 9. Sources

- **Parent paper (light uncountability route, Thm 8):** Burai, Kiss, Szokol (2021), *Characterization of quasi-arithmetic means without regularity condition*, arXiv:2107.07391 — https://arxiv.org/abs/2107.07391 (First/Second step = uncountability via monotone extension; Fourth step = `(C-order)` eqs (8)–(9))
- **Target paper (the density lemma):** Burai, Kiss, Szokol (2022), arXiv:2208.07083 — Lemma 6, Step 2 — https://arxiv.org/abs/2208.07083
- **Honest boundary (why reflexivity+symmetry are essential):** G. Kiss (2026), *Noncontinuous bisymmetric strictly monotone operations*, arXiv:2601.16247 — https://arxiv.org/abs/2601.16247
- **Order data justification:** Aczél & Dhombres, *Functional Equations in Several Variables*, pp. 287–290
- **Mathlib v4.18.0 lemmas used:** `Cardinal.mk_Ioo_real`, `aleph0_lt_continuum`, `Cardinal.mk_image_eq_of_injOn`, `StrictMono.injective`, `StrictMono.injective.injOn`, `Function.Injective.countable`, `exists_rat_btwn`, `Set.countable_coe_iff`, `Cardinal.mk_le_aleph0_iff`
- **Internal:** Wave19 `dyadic_image_dense_of_sep`, `IsTwoSidedAccPt` (`Lutar/Wave19/Density.lean`); Wave18 `gen_continuous_of_denseRange` (= Mathlib `Monotone.continuous_of_denseRange`), `cut1_conditional_lambda`

---

## 10. Deliverables checklist (against the task's ABSOLUTE CONSTRAINTS)

- ✅ **No proof placeholders, no new axiom token** — all 13 decls `#print axioms ⊆ {propext, Classical.choice, Quot.sound}`
- ✅ **Zero drift** — baseline 1323/23/22/307/254 intact; Wave21 registered under `EXPERIMENTAL_SCOPES`
- ✅ **Locked-proven stays EXACTLY 5** `{F1, F11, F12, F18, F19}`
- ✅ **Drift-hygiene** — no bare placeholder token in any Wave21 docstring/comment; "No proof placeholders" used throughout
- ✅ **Verified locally** with `lake env lean` / `lake build` (CI proxy-blocked + elan infra bug; local is authoritative)
- ✅ **Built on Wave19+Wave20 by import** — their files UNMODIFIED; wave19/wave20 branches not polluted; no stray files
- ✅ **CUT-1 forward density closed on stated hypotheses; conditional-Λ chain axiom-clean end to end**
- ✅ **Λ UNCONDITIONAL uniqueness STAYS Conjecture 1 (FALSE)** — kept honest and explicit
- ✅ **Honesty over completion** — `(C-order)` documented precisely as the single remaining stated structural hypothesis; NOT faked, NOT axiomatised
- ✅ **PR #211 opened off `wave21-cut1-final`, base `main`, MERGEABLE, NOT merged** (parent verifies + merges)
