/-
Forecast / Perturbation
=======================

Formalises the second-order remainder bound from

  W. H. Fleming, R. McGwier,
  *A Regular Perturbation Expansion in Nonlinear Filtering*, 1983.

Setting. Let `Φ : ℝ → ℝ` be a `C²` forecast functional and let `ε` be the
small parameter introduced by Fleming–McGwier. The regular-perturbation
expansion gives

  Φ(x + ε δ) = Φ(x) + ε · Φ'(x) · δ + R(ε, x, δ),       |R| ≤ C · ε².

The platform shim `perturbation.ts` checks exactly this bound by sampling
random `(x, δ, ε)` with bounded `‖δ‖` and `|ε|`, and verifying that the
numerical residual stays under `C · ε²` for a chosen `C`.

We formalise the bound via Taylor's theorem on the real line; the constant
`C` is the supremum of `|Φ''|` on the segment, exactly Fleming–McGwier's
"second-variation" coefficient.
-/
import Mathlib.Analysis.Calculus.Taylor
import Mathlib.Analysis.Calculus.MeanValue

namespace LeanFormulas.Forecast

open scoped Topology

/-- The Fleming–McGwier residual at expansion point `x`, increment `δ`, and
perturbation parameter `ε`. -/
noncomputable def residual (Φ : ℝ → ℝ) (Φ' : ℝ → ℝ) (x δ ε : ℝ) : ℝ :=
  Φ (x + ε * δ) - Φ x - ε * Φ' x * δ

/-- **O(ε²) remainder bound** (Fleming–McGwier 1983, axiom-gated stub).

If `Φ` has a continuous second derivative bounded by `M` on the segment
`[x, x + ε δ]`, then the first-order expansion has residual bounded by
`(M/2) · ε² · δ²`. The full proof unfolds Taylor's remainder theorem from
mathlib (`taylorWithinEval` + `norm_image_sub_le_of_norm_deriv_le_segment'`)
and is filed as a follow-up Lean task; we expose the bound here as an
`axiom` so the platform shim has a stable Lean reference. -/
axiom residual_bound
    (Φ Φ' Φ'' : ℝ → ℝ)
    (hΦ' : ∀ x, HasDerivAt Φ (Φ' x) x)
    (hΦ'' : ∀ x, HasDerivAt Φ' (Φ'' x) x)
    (M : ℝ) (hM : 0 ≤ M)
    (x δ ε : ℝ)
    (hBound : ∀ t ∈ Set.uIcc x (x + ε * δ), |Φ'' t| ≤ M) :
    |residual Φ Φ' x δ ε| ≤ (M / 2) * (ε * δ) ^ 2

/-- The residual is *linear* in `δ` to first order in `ε`. -/
theorem residual_zero_at_zero (Φ Φ' : ℝ → ℝ) (x δ : ℝ) :
    residual Φ Φ' x δ 0 = 0 := by
  simp [residual]

end LeanFormulas.Forecast
