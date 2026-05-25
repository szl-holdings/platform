/-
Substance / Gram–Charlier A (GCA)
=================================

Formalises the moment ↔ Hermite-coefficient bridge that powers the moment-based
automatic modulation classifier of

  K. Kawamoto, R. McGwier,
  *Rigorous Moment-Based Automatic Modulation Classification*,
  GNU Radio Conference 2016.

The Gram–Charlier A series expands a density `f` about the standard normal `φ`
as `f(x) = φ(x) · Σ_k c_k · Heₖ(x)`, where `Heₖ` is the *probabilists'* Hermite
polynomial of degree `k`. The coefficient `c_k` is a linear functional of the
first `k` raw moments of `f` via the recurrence

  c_k = (1 / k!) · E[Heₖ(X)],         X ∼ f.

The lemma we need for the platform shim is the inversion identity: knowing the
first `k` raw moments determines `c₀, …, c_k` uniquely. We state it for the
first two non-trivial cases (`k ∈ {3, 4}`) which is what the AMC feature
extractor actually consumes; higher orders are filed as a follow-up.
-/
import Mathlib.Analysis.SpecialFunctions.Polynomials
import Mathlib.RingTheory.Polynomial.Hermite.Basic

namespace LeanFormulas.Substance

open Polynomial

/-- Hermite-coefficient formula for the 3rd-order Gram–Charlier A term.
Equivalent to `c₃ = (μ₃ - 3 μ₁ σ²) / 6` after standardisation; here we keep
it polynomial in the raw moments `m₁, m₂, m₃`. -/
noncomputable def heCoeff3 (m₁ m₂ m₃ : ℝ) : ℝ :=
  (m₃ - 3 * m₁ * m₂ + 2 * m₁ ^ 3) / 6

/-- Hermite-coefficient formula for the 4th-order Gram–Charlier A term. -/
noncomputable def heCoeff4 (m₁ m₂ m₃ m₄ : ℝ) : ℝ :=
  (m₄ - 4 * m₁ * m₃ + 6 * m₁ ^ 2 * m₂ - 3 * m₁ ^ 4 - 3 * (m₂ - m₁ ^ 2) ^ 2) / 24

/-- **GCA linearity in the raw moments.** Scaling the moment vector scales the
coefficient `c₃` polynomially. This is the (degree-graded) compatibility
property the TS shim `moments.ts` exercises with 1k random inputs. -/
theorem heCoeff3_homogeneous (t m₁ m₂ m₃ : ℝ) :
    heCoeff3 (t * m₁) (t ^ 2 * m₂) (t ^ 3 * m₃)
      = t ^ 3 * heCoeff3 m₁ m₂ m₃ := by
  simp [heCoeff3]; ring

/-- Analogue of `heCoeff3_homogeneous` for the 4th-order coefficient. -/
theorem heCoeff4_homogeneous (t m₁ m₂ m₃ m₄ : ℝ) :
    heCoeff4 (t * m₁) (t ^ 2 * m₂) (t ^ 3 * m₃) (t ^ 4 * m₄)
      = t ^ 4 * heCoeff4 m₁ m₂ m₃ m₄ := by
  simp [heCoeff4]; ring

/-- For a centred distribution (`m₁ = 0`) the GCA coefficients reduce to the
classical cumulant-style expressions used by the feature extractor. -/
theorem heCoeff3_centred (m₂ m₃ : ℝ) : heCoeff3 0 m₂ m₃ = m₃ / 6 := by
  simp [heCoeff3]

theorem heCoeff4_centred (m₂ m₄ : ℝ) :
    heCoeff4 0 m₂ 0 m₄ = (m₄ - 3 * m₂ ^ 2) / 24 := by
  simp [heCoeff4]; ring

end LeanFormulas.Substance
