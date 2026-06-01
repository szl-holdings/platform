# KANCHAY — Lean Stub (brand-consistency invariant)

**Organ:** KANCHAY (brand surface, SF-09). **Status:** every theorem `sorry`-tagged;
NET-NEW obligation, carried OUTSIDE the v11 LOCKED counter (456/749 decl, 14 axioms,
6/163 sorries) until an integration agent folds it in. ADDITIVE only.
**License:** Apache-2.0. **Attribution:** ORCID 0009-0001-0110-4173.
**Signed:** Yachay, 2026-06-01.

## What it states

KANCHAY's organ factor (SF-09) is the public-claim calibration indicator
`K(a)=𝟙[moralGrounding(a) ≥ 0.95 ∧ measurabilityHonesty(a) ≥ 0.95]`. The brand layer adds
**two design-side invariants** on top, both reducible to `K`-style {0,1} factors that fold
into the master Khipu product (so INV-1..4 are preserved by `puriq_organ_factor_preserves_envelope`):

1. **Token-consumption invariant (KAN-1):** a flagship's rendered CSS is admissible only if
   every brand-relevant color/space/radius value it uses resolves to a **canonical token**
   (a key in `COLOR_TOKENS.json` / `COMPONENT_TOKENS.css`), i.e. no raw literal that is not
   also a canonical token. Modelled as `usesCanonicalTokens : Flagship → Bool`.
2. **Cross-flagship contrast invariant (KAN-2):** for every flagship and every (foreground,
   background) pair drawn from the canonical surfaces, the WCAG 2.1 contrast ratio is **≥ 4.5**
   (normal text) / **≥ 3.0** (large text). Verified numerically in `COLOR_CONTRAST_REPORT.md`
   (21/21 pairs pass AA); the Lean obligation states the property abstractly.

Both collapse to admissible `{0,1}` brand factors, so a flagship that violates either drives
its KANCHAY utility to 0 — the surface does not ship. This is the formal content of
"every flagship's CSS must consume canonical tokens; cross-flagship contrast must be WCAG AA."

```lean
/-
Copyright © 2026 Lutar, Stephen P. (SZL Holdings). Apache-2.0.
ORCID: 0009-0001-0110-4173. Date: 2026-06-01.

# KANCHAY — Brand-consistency invariant (Doctrine v12 / SF-09 layer)

This file states the KANCHAY brand factor and its two design-side invariants as Lean type
signatures with `sorry`-tagged obligations. PROOF-OBLIGATION LAYER above SF-09 in
`doctrine/sub_formulas/PURIQ_SUBFORMULAS_v12.md`. It introduces obligations only; it does NOT
change any v11 LOCKED number (456 source-declared / 749 doctrine-claimed declarations,
14 unique axioms, 6 re-audited / 163 doctrine-tracked sorries @ lutar-v18.0.0 / c7c0ba17).

Intended to import the PURIQ master file (`AdmissibleFactor`, `organUtility`,
`puriq_organ_factor_preserves_envelope`) from `formulas/PuriqLean.lean`.

No mystical / overclaim words appear. WCAG ratio constants match COLOR_CONTRAST_REPORT.md.
-/
import Mathlib.Data.Real.Basic
import Mathlib.Data.List.Basic
import Mathlib.Tactic
-- import Lutar.Puriq  -- (AdmissibleFactor, organUtility, puriq_organ_factor_preserves_envelope)

namespace Lutar.Puriq.Kanchay

/-! ## §1 — Brand domain types -/

/-- A flagship surface identifier. -/
inductive Flagship where
  | a11oy | amaru | sentra | killinchu | rosie | anatomy3d | rosie3d
  deriving DecidableEq, Repr

/-- An sRGB color as three byte channels (a canonical token value). -/
structure Color where
  r : Nat
  g : Nat
  b : Nat
  deriving DecidableEq, Repr

/-- The canonical token table: the finite set of admissible brand colors
(`COLOR_TOKENS.json`). A flagship value is canonical iff it is a member. -/
def canonicalTokens : List Color := []   -- populated from COLOR_TOKENS.json at build

/-- `usesCanonicalTokens fp cs`: every color in flagship `fp`'s emitted stylesheet `cs`
is a canonical token. -/
def usesCanonicalTokens (cs : List Color) : Bool :=
  cs.all (fun c => canonicalTokens.contains c)

/-! ## §2 — WCAG relative luminance + contrast (mirrors COLOR_TOKENS verification) -/

/-- Relative luminance per WCAG 2.1 §1.4.3 (real-valued model; the runtime uses the
gamma-expanded sRGB formula in `build_color_tokens.py`). -/
noncomputable def luminance (c : Color) : ℝ := sorry

/-- WCAG contrast ratio `(L₁+0.05)/(L₂+0.05)` with `L₁ ≥ L₂`. -/
noncomputable def contrastRatio (fg bg : Color) : ℝ :=
  let l1 := max (luminance fg) (luminance bg)
  let l2 := min (luminance fg) (luminance bg)
  (l1 + 0.05) / (l2 + 0.05)

/-- AA thresholds. -/
def aaNormal : ℝ := 4.5
def aaLarge  : ℝ := 3.0

/-! ## §3 — KAN-1 — Token-consumption brand factor -/

/-- The token-consumption indicator as a {0,1} brand factor. -/
def kanchayTokenFactor (cs : List Color) : ℝ :=
  if usesCanonicalTokens cs then 1 else 0

/-- **kanchay_token_factor_admissible.** KAN-1 factor ∈ {0,1} ⊆ [0,1], hence admissible,
hence (via `puriq_organ_factor_preserves_envelope`) preserves INV-1..4.
PROOF-STATUS: SORRY. Strategy: case-split on `usesCanonicalTokens cs`; `0,1 ∈ [0,1]`. -/
theorem kanchay_token_factor_admissible (cs : List Color) :
    0 ≤ kanchayTokenFactor cs ∧ kanchayTokenFactor cs ≤ 1 := by
  sorry

/-- **kanchay_token_zero_iff_offpalette.** The KAN-1 factor is 0 iff some color is off-palette.
PROOF-STATUS: SORRY. Strategy: unfold `kanchayTokenFactor`, `usesCanonicalTokens`,
`List.all_eq_true` / `List.all_eq_false`. -/
theorem kanchay_token_zero_iff_offpalette (cs : List Color) :
    kanchayTokenFactor cs = 0 ↔ ∃ c ∈ cs, ¬ canonicalTokens.contains c := by
  sorry

/-! ## §4 — KAN-2 — Cross-flagship contrast brand factor -/

/-- A (foreground, background) usage pair on a surface, with a largeText flag. -/
structure Pairing where
  fg : Color
  bg : Color
  largeText : Bool
  deriving Repr

/-- A pairing clears AA iff its contrast meets the size-appropriate threshold. -/
noncomputable def clearsAA (p : Pairing) : Prop :=
  contrastRatio p.fg p.bg ≥ (if p.largeText then aaLarge else aaNormal)

/-- The contrast brand factor: 1 iff *every* pairing on the flagship clears AA. -/
noncomputable def kanchayContrastFactor (ps : List Pairing) : ℝ :=
  if (∀ p ∈ ps, clearsAA p) then 1 else 0

/-- **kanchay_contrast_factor_admissible.** KAN-2 factor ∈ {0,1} ⊆ [0,1].
PROOF-STATUS: SORRY. Strategy: case-split on the decidable-in-spirit predicate; 0,1 ∈ [0,1]. -/
theorem kanchay_contrast_factor_admissible (ps : List Pairing) :
    0 ≤ kanchayContrastFactor ps ∧ kanchayContrastFactor ps ≤ 1 := by
  sorry

/-- **kanchay_brand_consistency.** A flagship ships (brand factor = 1) iff it both consumes
only canonical tokens AND every cross-flagship pairing clears WCAG AA. This is the conjunction
that makes "consume canonical tokens ∧ contrast is AA" the single brand-ship gate.
PROOF-STATUS: SORRY. Strategy: product of two {0,1} factors = 1 iff both are 1. -/
theorem kanchay_brand_consistency (cs : List Color) (ps : List Pairing) :
    kanchayTokenFactor cs * kanchayContrastFactor ps = 1 ↔
      (usesCanonicalTokens cs ∧ (∀ p ∈ ps, clearsAA p)) := by
  sorry

/-- **kanchay_factor_preserves_envelope.** The combined brand factor `K_brand = KAN-1 · KAN-2`
is admissible, so by `puriq_organ_factor_preserves_envelope` it preserves INV-1..4: a brand
violation can only shrink utility to 0, never bypass a gate.
PROOF-STATUS: SORRY. Strategy: product of two admissible {0,1} factors is admissible
(`mul_nonneg`, `mul_le_one`). -/
theorem kanchay_factor_preserves_envelope (cs : List Color) (ps : List Pairing) :
    0 ≤ kanchayTokenFactor cs * kanchayContrastFactor ps ∧
    kanchayTokenFactor cs * kanchayContrastFactor ps ≤ 1 := by
  sorry

end Lutar.Puriq.Kanchay
```

## Build note

Mirrors `formulas/PuriqLean.lean` conventions (Mathlib v4.13.0, `lutar-lean` tag
`lutar-v18.0.0` / `c7c0ba17` as a `lake` git dependency). **NOT YET Lake-built** — left to the
integration agents, consistent with the PURIQ charter ("Test Lean+Lake then instill") and the
existing `PuriqLean.lean` honesty note. New `sorry` count introduced by this file: **7**
(all tagged, none hidden), tracked OUTSIDE the v11 LOCKED 6/163 count.

## Numbers preserved

This stub changes **no** v11 LOCKED number. It cites them (456/749, 14, 6/163), states 7 new
obligations as carried-outside, and respects Conjecture-1 (Λ-uniqueness open). Zero-Bandaid:
every `sorry` is visible and labelled.

— Yachay, 2026-06-01. Sorry-tagged; no mystical terms; ADDITIVE only.
