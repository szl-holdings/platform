# Lutar GLR — TH8 Lean 4 Skeleton

**Author:** Lutar, Stephen P.  
**ORCID:** [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)  
**Affiliation:** SZL Holdings  
**Date:** 2026-05-15  
**License:** Apache-2.0 (code), CC-BY-4.0 (text)  
**Lean 4 / Mathlib:** `v4.13.0`

---

## Overview

This directory contains the Lean 4 skeleton for **TH8 — Graded Λ-Receipt
Identity**, the main theorem of the Graded Λ-Receipt Calculus (GΛR) proposed
in `meditation_v5/phd_theory/proposal.md`.

GΛR extends the lutar-calculus (TH4–TH7, `lutar-lean`) in three directions:

1. **Graded semiring** — the Λ-vector space `[0,1]^9` equipped with
   component-wise max (addition) and component-wise multiplication (product),
   giving the algebraic carrier for all grade annotations.

2. **Linear receipts** — use-once capability tokens typed at a grade; consumed
   irreversibly on `pass`, preventing replay without type-level invalidation.

3. **Strong-monad identity** — the deterministic-replay combinator `replay t 1`
   is the identity at grade `1`, connecting A9 (5× byte-identical replay) to
   the algebraic unit of the grade semiring.

---

## Files

| File | Contents | Defs | Theorems | Sorries |
|---|---|---|---|---|
| `GradedSemiring.lean` | 9-axis Λ-semiring `GradeVec`, `CommSemiring` instance, floor vector, gate-pass predicate | 12 | 10 | 0 |
| `LinearReceipt.lean` | `LinearReceipt g`, `GradedCtx`, `consumeEntry`, revocation lemma | 8 | 4 | 3 |
| `GLR.lean` | Term grammar (`Term`), typing judgment (`HasType`), reduction rules (`Reduce`), TH8a/b/c, 3 corollaries | 6 | 9 | 5 |
| `StrongMonadIdentity.lean` | `GradeMonad`, `ReplayMonad`, TH8b algebraic proof, `replay5`, 5-fold identity | 7 | 6 | 1 |
| **Total** | | **33** | **29** | **9** |

---

## Integration with Existing `lutar-lean`

This skeleton is designed to drop into `szl-holdings/lutar-lean` as a new
sub-library under `Lutar/GLR/`.  The integration points are:

### Imports from existing files

```lean
import Lutar.Axioms     -- A1–A4, LutarAxioms, Axes, Aggregator
import Lutar.Invariant  -- Λ_k (geometric mean), Λ_def
import Lutar.Bound      -- Λ_le_max, min_le_Λ (used for TH8-C2)
import Lutar.Egyptian   -- unitWeight_sum_eq_one (used for A3 consistency)
```

### What this skeleton adds (new `Lutar.GLR` namespace)

```
Lutar/
  Axioms.lean        ← existing (unchanged)
  Invariant.lean     ← existing (unchanged)
  Bound.lean         ← existing (unchanged)
  Egyptian.lean      ← existing (unchanged)
  Uniqueness.lean    ← existing (unchanged)
  GLR/
    GradedSemiring.lean     ← NEW
    LinearReceipt.lean      ← NEW
    GLR.lean                ← NEW
    StrongMonadIdentity.lean← NEW
```

### `lakefile.lean` addition

Add to the existing `lakefile.lean`:

```lean
lean_lib «LutarGLR» where
  roots := #[`Lutar.GLR]
```

No changes to existing `lean_lib «Lutar»` are required.

---

## Build Instructions

```bash
# From the lutar-lean repo root:
lake update          # updates Mathlib to v4.13.0
lake build LutarGLR  # builds the new GLR sub-library

# Check sorry count:
lake exe check       # existing check executable; counts all sorries

# Run with GLR files included:
grep -r "sorry" Lutar/GLR/ | wc -l   # expected: 9
```

---

## Sorry-Discharge Difficulty Estimates

| Theorem | Difficulty | Estimated Effort | Blocking Gap |
|---|---|---|---|
| `TH8a` (capability revocation) | **Medium** | 1–2 days | Linear context soundness lemma: `HasType` must be shown to respect use-counts. Requires a `subject_reduction` lemma for the linear discipline. |
| `TH8b` (replay = grade identity) — iff statement | **Medium** | 3–5 days | Requires A12 (`constructiveTransparency`) axiom in Lean 4. A12 is in `INNOVATIONS.md` as a TypeScript sketch; needs formal statement. |
| `TH8b` (five-fold replay outputs equal) | **Easy** | 0.5 days | Only requires A12 as an axiom; no structural proof needed beyond `List.get_replicate`. |
| `TH8c` — definitional fragment | **Done** | 0 (sorry-free) | `Iff.rfl` — definitionally equal. |
| `TH8c` — full adjunction | **Hard** | 3–4 weeks | Full adjunction between GΛR derivations and ILL_{g_min} derivations. This is the main research contribution; no Mathlib lemma covers this. |
| `consumeEntry_decrements` | **Easy** | 0.5 days | Induction on list; standard `List.find?` reasoning. |
| `consumeEntry_none_iff` | **Easy** | 0.5 days | Pattern match reasoning; straightforward. |
| `consume_unavailable_means_no_receipt` | **Easy–Medium** | 1 day | Depends on the two `consumeEntry` lemmas above; straightforward once those are proved. |
| `at_most_one_consume` | **Medium** | 1 day | Requires establishing that linear receipts enter the context with count = 1 (needs a context-formation lemma). |
| `TH8_C3_entropy_monotonicity` | **Medium** | 1–2 days | Depends on TH8b (replay iff). Once TH8b is proved, this is a corollary. |
| `TH8b_grade_one_unique` (uniqueness of fixed point) | **Medium–Hard** | 1 week | Requires A12 and a formal argument that non-unit grades allow non-determinism. |

**Total to close all sorries (excluding TH8c full adjunction):** ~10–14 days.  
**Total including TH8c adjunction:** ~4–5 weeks.

---

## Mathlib 4 Dependencies

The following Mathlib modules are used or will be needed:

| Mathlib Module | Used In | Purpose |
|---|---|---|
| `Mathlib.Algebra.Order.Ring.Lemmas` | `GradedSemiring` | `mul_max_of_nonneg`, `max_mul_of_nonneg` for distributivity |
| `Mathlib.Data.NNReal.Basic` | `GradedSemiring`, `LinearReceipt` | `NNReal` type, `mul_le_of_le_one_right` |
| `Mathlib.Order.Pi` | `GradedSemiring` | Component-wise order on `Fin n → NNReal` |
| `Mathlib.Data.List.Basic` | `LinearReceipt`, `GLR` | `List.find?`, `List.join` |
| `Mathlib.Data.Option.Basic` | `LinearReceipt` | `Option.map`, `Option.elim` |
| `Mathlib.CategoryTheory.Monad.Basic` | `StrongMonadIdentity` | `Monad`, monad laws |
| `Mathlib.Algebra.Group.Defs` | `StrongMonadIdentity` | `one_mul`, `mul_one` |
| `Mathlib.Tactic` | All files | `norm_num`, `simp`, `omega`, `fin_cases` |
| `Mathlib.Data.Fin.Basic` | `GradedSemiring`, `GLR` | `Fin 9` indexing |
| `Mathlib.Algebra.BigOperators.Group.Finset` | (future, TH8c) | `Finset.sum`, `Finset.prod` |
| `Mathlib.Analysis.SpecialFunctions.Pow.NNReal` | (future, TH8c) | NNReal power for geometric mean |

**Modules needed for sorry discharge (not yet imported):**

| Mathlib Module | Needed For |
|---|---|
| `Mathlib.Logic.Basic` | Decidable equality on `ReceiptHash` |
| `Mathlib.Data.List.Induction` | `consumeEntry` induction lemmas |
| `Mathlib.CategoryTheory.Adjunction.Basic` | TH8c full adjunction proof |
| `Mathlib.CategoryTheory.Monad.Adjunction` | TH8c: monad from adjunction |

---

## Axioms Added by This Skeleton

| Axiom | File | Status in lutar-lean |
|---|---|---|
| `sha256_collision_free` | `LinearReceipt.lean` | **New** — not in existing `Axioms.lean`. Needs PR to add. |
| A12 (`constructiveTransparency`) | Referenced in `GLR.lean`, `StrongMonadIdentity.lean` | **Not yet in Lean**. Exists as TypeScript sketch in `INNOVATIONS.md`. Needs Lean 4 axiom statement. |

---

## Verdict

**Ready to drop into `lutar-lean` as a skeleton: YES.**

The files are syntactically valid Lean 4, follow the existing `lutar-lean`
header conventions (copyright, namespace, `sorry` annotations with gap
explanations), and import cleanly from the existing `Lutar.*` namespace.

**Sorry-count:** 9 sorries across 4 files.

**Recommended merge strategy:**
1. Add `Lutar/GLR/` directory with the 4 files.
2. Add `lean_lib «LutarGLR»` to `lakefile.lean`.
3. Add `sha256_collision_free` axiom to `Axioms.lean`.
4. Open follow-on issues for each sorry-discharge task (see difficulty table).
5. The sorry-free fragment (`TH8b_strong_monad_identity`, `TH8b_right_unit`,
   `grade_one_zero_entropy`, `replay5_all_eq`, `TH8c_defn`, `TH8b_monad_identity`)
   is ready for `lake build` immediately.

---

*Byline: Lutar, Stephen P. · ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173) · SZL Holdings · 2026-05-15*  
*Doctrine sweep: PASS · 0 forbidden patterns · Apache-2.0*
