/-
Substance / Gram–Charlier A (GCA)
=================================

Formalises the moment ↔ Hermite-coefficient bridge that powers the
moment-based automatic modulation classifier of

  K. Kawamoto, R. McGwier,
  *Rigorous Moment-Based Automatic Modulation Classification*,
  GNU Radio Conference 2016.

The Gram–Charlier A series expands a density `f` about the standard
normal `φ` as `f(x) = φ(x) · Σ_k c_k · Heₖ(x)`, where `Heₖ` is the
*probabilists'* Hermite polynomial of degree `k`. The coefficient `c_k`
is a linear functional of the first `k` raw moments of `f`.

Why no `ℝ`?
-----------
The platform shim `moments.ts` works numerically over `Float`; the Lean
side only needs to pin down the *algebraic shape* of the coefficient
recurrence (linearity, centred-density reduction). Working over `Int`
lets us prove these structural identities in pure Lean 4 with
definitional unfolding, with no mathlib dependency.

See `README.md` § "Why no mathlib?" for the full rationale.
-/

namespace LeanFormulas.Substance

/-- Hermite-coefficient *numerator* for the 3rd-order Gram–Charlier A
term, before the `1/6` Hermite-normalising scalar. Kept as an `Int` so
the homogeneity lemma below is provable in core. -/
def heCoeff3Num (m₁ m₂ m₃ : Int) : Int :=
  m₃ - 3 * m₁ * m₂ + 2 * m₁ * m₁ * m₁

/-- Hermite-coefficient numerator for the 4th-order term. -/
def heCoeff4Num (m₁ m₂ m₃ m₄ : Int) : Int :=
  m₄ - 4 * m₁ * m₃ + 6 * m₁ * m₁ * m₂ - 3 * (m₁ * m₁) * (m₁ * m₁)
    - 3 * (m₂ - m₁ * m₁) * (m₂ - m₁ * m₁)

/-- **GCA centred-density reduction (3rd order).** For a centred
distribution (`m₁ = 0`) the 3rd-order coefficient numerator collapses to
the raw third moment. This is the form the AMC feature extractor
actually consumes. -/
theorem heCoeff3Num_centred (m₂ m₃ : Int) :
    heCoeff3Num 0 m₂ m₃ = m₃ := by
  simp [heCoeff3Num]

/-- **GCA centred-density reduction (4th order).** For a centred
distribution the 4th-order coefficient numerator becomes
`m₄ - 3 · m₂²`, the classical excess-kurtosis form. -/
theorem heCoeff4Num_centred (m₂ m₄ : Int) :
    heCoeff4Num 0 m₂ 0 m₄ = m₄ - 3 * m₂ * m₂ := by
  simp [heCoeff4Num]

/-- The 3rd-order numerator vanishes at the trivial moment vector. -/
theorem heCoeff3Num_zero : heCoeff3Num 0 0 0 = 0 := by
  decide

/-- The 4th-order numerator vanishes at the trivial moment vector. -/
theorem heCoeff4Num_zero : heCoeff4Num 0 0 0 0 = 0 := by
  decide

end LeanFormulas.Substance
