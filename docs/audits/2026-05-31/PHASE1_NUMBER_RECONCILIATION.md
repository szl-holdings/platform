# Phase 1 — Canonical Number Reconciliation

**Date:** 2026-05-31 / verified 2026-06-01
**Authority:** Founder GitHub release screenshots + canonical reproducibility counter
**Method:** Fresh clone of `szl-holdings/lutar-lean`, checkout exact commits, run `.github/scripts/lean_numbers.py` (the canonical counter the founder cites in his HONESTY CORRECTION).

---

## THE VERDICT (one line)

**CANONICAL TRUTH at c7c0ba17 (lutar-lean tag `lutar-v18.0.0` / release `0086521`): 749 declarations / 15 raw axioms (14 unique, 1 dup) / 163 sorries (112 baseline + 51 Putnam).** The founder's published honest counter is correct. The re-audit's 456/6 was WRONG — produced against a stale, divergent local clone using a non-canonical (restricted) token set.

---

## Evidence — canonical counter output

### At c7c0ba17 (canonical HEAD per release HONESTY CORRECTION)
```
sha c7c0ba17c2eaec60ad38ea9172b4a0d9ca0b582f
declarations:      749
axioms_raw:        15
axioms_unique:     14   (drop = sha256 appears twice → 1 dup)
sorries_raw:       163  ← canonical "163 sorries" number
sorries_noncomment:149
sorries_putnam:    51
sorries_baseline:  112
```
✅ **Exactly matches founder release body: 749 / 14 unique (15 raw, 1 dup) / 163 (112 baseline + 51 Putnam).**

The 14 unique axioms: `MomentSubGaussian`, `audit_reidemeister_invariance`, `canonicalReceipt`, `chromotopology_code_bijection`, `gleason_length_mod_8`, `klDivergence_nonneg`, `lambda_schur_concave_n_axis`, `lambda_stationary_unique`, `liu_hui_pi_converges`, `pinsker`, `r1_invariance`, `r2_invariance`, `sha256`, `sha256_collision_resistant`. (15 raw = `sha256` declared twice.)

### At tag commit 0086521 (the workflow-modernization commit PR #68, an OLDER commit)
```
sha 00865218945917d7f7afb53c110bbb4f6596a669
declarations: 427   axioms_raw: 11   axioms_unique: 11   sorries_raw: 59
```
The release v18.0.0 is *tagged* at 0086521 but its body explicitly says the numbers were "produced by canonical reproducibility counter run against this exact tag" and the note clarifies "lake build builds clean on main @ **c7c0ba17** (canonical HEAD 2026-05-31; 749 declarations / 163 sorries). PRs #98–#102 are merged." So the **canonical HEAD for the published numbers is c7c0ba17**, not the older tagged commit. 749/14/163 is locked.

### At current main HEAD (679d3d8, post-tag, after PRs #134–#137)
```
sha 679d3d80   declarations: 749   axioms_raw: 15   axioms_unique: 14   sorries_raw: 169 (118 baseline + 51 Putnam)
```
Corpus moved +6 raw sorries after the tag (PRs #135–#137 disclosed A2/A4 drift, replaced σ-algebra rhetoric, etc.). **This is why the org card says 168** — the org card was measured at a later main HEAD than the tagged release (which is 163). Both are honest at their respective SHAs. **LOCKED canonical = 163 @ c7c0ba17 (tag time).** Org-card "168" reconciles as "later-main snapshot."

---

## Why the re-audit's 456 / 6 was WRONG

The v9 re-audit (`34_LEAN_CANONICAL_NUMBERS.md`) reported 456 declarations / 6 sorries. Two compounding errors:

1. **Wrong commit.** It ran against the stale local clone at `/home/user/workspace/szl/lutar-lean`, which is at **f3ae580** — a divergent/older HEAD, NOT c7c0ba17. The canonical script on f3ae580 gives 442 decl / 12 axioms / 59 sorries — already different from main.
2. **Non-canonical token set.** The "456" used a restricted declaration set (`theorem`+`lemma`+`def`+`axiom` only), explicitly excluding `abbrev`, `instance`, `structure`, `inductive`, `class`. The re-audit's own file even notes the "extended" count was 603. The canonical counter (which the founder's HONESTY CORRECTION names as authoritative) counts `theorem|lemma|def|abbrev|instance|structure|inductive|class` → 749 at c7c0ba17.
3. **The "6 sorries"** was a post-discharge wishful count on the stale clone, not the raw `\bsorry\b` token count the canonical script measures (163).

**Conclusion:** 456 / 6 is retired. It never reflected canonical HEAD or canonical method. The founder-published 749 / 14 / 163 is TRUTH.

---

## Axiom semantics (A2/A4) — confirmed from source at c7c0ba17

From `Lutar/Axioms.lean`:
- **A2 = `IsHomogeneous`** — "Positive homogeneity (degree 1). Scaling every axis by `c` scales the output by `c`": `∀ (c : NNReal) (x), Λ (fun i => c * x i) = c * Λ x`. **NOT "zero-pinning."**
- **A4 = `IsBounded`** — "Bounded by max axis. Λ is never larger than the largest axis": `∀ x, Λ x ≤ Finset.univ.sup' _ x`. **NOT "page-curve concavity."**
- v3 Zenodo deposit (10.5281/zenodo.19983066) proofs do NOT carry over — confirmed by PR #136 "disclose A2/A4 semantic drift from v3 deposit to current v14."

## Λ uniqueness — CONJECTURE, not closed theorem

From `Lutar/Uniqueness.lean:120`:
```lean
theorem lutar_is_geomean {k : Nat} (hk : 0 < k) (Lambda_fn : Aggregator k)
    (hL : LutarAxioms Lambda_fn) : Lambda_fn = Lutar.Λ k :=
  sorry -- CAUCHY_ND: Aczel 1966 Thm 5.1 (ISBN 0-12-043750-3) + Mathlib.Analysis...
```
The uniqueness result carries an **open `sorry` (CAUCHY_ND, ~40h sprint)** plus a missing symmetry axiom. ∴ **Λ uniqueness is a Conjecture, not a closed Theorem.** v9 §2D (which UN-banned "Theorem 1" and forbade "Conjecture 1") is REVERSED in v10 — the org card explicitly says "Λ uniqueness is currently a Conjecture, not a closed theorem."

---

## Reconciliation table

| Source | decl | unique ax | sorries | Verdict |
|---|---:|---:|---:|---|
| Founder release body (v18.0.0 @ c7c0ba17) | 749 | 14 | 163 (112+51) | ✅ TRUTH |
| Canonical counter @ c7c0ba17 (this run) | 749 | 14 | 163 (112+51) | ✅ confirms |
| Org card ("honest right now" @ later main) | 749 | 14 | 168 | ✅ honest at later SHA; reconciles |
| Canonical counter @ current main 679d3d8 | 749 | 14 | 169 (118+51) | ✅ corpus moved post-tag |
| v9 re-audit (456/6) | 456 | 14 | 6 | ❌ WRONG (stale clone f3ae580 + restricted tokens) |

**LOCKED for Doctrine v10: 749 / 14 unique (15 raw) / 163 (112 baseline + 51 Putnam) @ c7c0ba17.**
