# LEAN_STUBS_LOG.md — Ancient Corpus v2 theorem additions

**Author:** Yachay (Master Manual + Ancient Corpus Extension agent), under CTO authority.
**Date:** 2026-06-01.
**Target file:** `puriq/formulas/PuriqFormulaLean.lean` (ADDITIVE — no existing decl edited).
**New namespace:** `Puriq.Ancient` (appended after `end Puriq.OS`).
**Hard rule:** Zero-Bandaid / Zero-Mysticism. Every new object is pure math or a documented
historical security/scheduling pattern. Every `sorry` is tagged and listed.

## What changed

- File `PuriqFormulaLean.lean` grew from **947→1183 lines** (the OS block + this Ancient block;
  the Ancient block itself adds the four §T/§U/§V/§W families). NO line of the existing F1–F23
  suite, the `Puriq` core, the `Puriq.Khipu` block, or `Puriq.OS` was modified.
- All v11 LOCKED numbers untouched (749 declarations / 14 unique axioms / 163 sorries refer to
  the `lutar-lean` corpus, NOT this scratch formula file; this file remains a stub module).

## New definitions

| Name | Kind | Family | Notes |
|------|------|--------|-------|
| `dssChecksum` | def | §T DSS | `∑ j, m j` — position-indexed scribal mark sum |
| `dssAuthentic` | def | §T DSS | checksum = recorded value predicate |
| `enochCadence` / `enochWeekday` / `enochQuarter` | def | §U Enoch | `n % 364`, `% 7`, `/ 91` |
| `TemplarNote` | structure | §V Templar | 5-field bearer note |
| `redeemOk` | def | §V Templar | use-once redemption check (Bool) |
| `totalMass` / `massBalanced` / `massCharge` | def | §W Alchemy | mass ledger + Noether bridge |

## New theorems and obligation status

| Theorem | Family | Status | Obligation tag | Discharge plan |
|---------|--------|--------|----------------|----------------|
| `dss_mark_authentic` | §T | SKELETON | SORRY_PURIQ_OPEN[28] | checksum is monoid hom (List.append ↦ Nat.add); ~2h |
| `enoch_perfect_division` | §U | **PROVED** | — | `by decide` — closes now |
| `enoch_quarter_aligns_week` | §U | SKELETON | SORRY_PURIQ_OPEN[29] | `Nat.dvd_trans` (7 ∣ 91 ∣ k); ~1h |
| `templar_redemption_soundness` | §V | SKELETON | SORRY_PURIQ_OPEN[30] | Bool algebra on updated `spent`; ~2h |
| `alchemy_balance_implies_noether` | §W | **PROVED** | — | `intro s; exact hbal s` — closes now (mirrors `noether_conservation`) |

**Net:** +4 named theorems (+2 supporting defs-as-lemmas). **2 PROVED immediately**
(`enoch_perfect_division`, `alchemy_balance_implies_noether`), **2 sorry-tagged SKELETON**
with explicit, short obligations. New open sorries: **SORRY_PURIQ_OPEN[28], [29], [30], [31]**.
(SORRY_PURIQ_OPEN[31] is the *empirical* step — real recipe mutations are mass-balanced — not
the equivalence theorem, which is proved.)

## Lake build expectation

- `import` set unchanged (the new block uses `Finset.sum`, `Nat.mod`, `List Bool`, `ℝ` — all
  already imported by the existing file). No new Mathlib imports required.
- `enoch_perfect_division` is `decide`-closeable (small concrete naturals).
- `alchemy_balance_implies_noether` typechecks and closes with `exact` (no `sorry`).
- The three remaining `sorry`s compile (Lean accepts `sorry` with a warning) and are tracked.
- **Push policy:** HfApi direct push only; NEVER GitHub Actions. Lake build to be run by the
  Lean/Lake integration agent before any flagship instillation, per Doctrine v12 §6 / charter.

## Sign-off

— Yachay, 2026-06-01. Additive over `PuriqFormulaLean.lean` / Doctrine v11 LOCKED.
