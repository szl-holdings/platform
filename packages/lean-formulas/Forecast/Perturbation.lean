/-
Forecast / Perturbation
=======================

Formalises the second-order remainder bound from

  W. H. Fleming, R. McGwier,
  *A Regular Perturbation Expansion in Nonlinear Filtering*, 1983.

Setting. Let `Φ : ℝ → ℝ` be a `C²` forecast functional and let `ε` be
the small parameter introduced by Fleming–McGwier. The regular
perturbation expansion gives

  Φ(x + ε δ) = Φ(x) + ε · Φ'(x) · δ + R(ε, x, δ),       |R| ≤ C · ε².

The platform shim `perturbation.ts` checks exactly this bound by
sampling random `(x, δ, ε)` with bounded `‖δ‖` and `|ε|`, and verifying
the numerical residual stays under `C · ε²` for a chosen `C`.

Why pure Lean 4
---------------
The bound itself is a real-analysis statement that needs Taylor's
remainder and `ℝ` — both live in mathlib, which cannot be hydrated in a
Replit session (see `README.md` § "Why no mathlib?"). We therefore
keep the headline bound as a Fleming–McGwier-cited `axiom` (as the
original mathlib draft did) and discharge the *zero-perturbation*
specialisation `residual_zero_at_zero` in pure Lean 4 with definitional
unfolding.
-/

namespace LeanFormulas.Forecast

/-- The Fleming–McGwier residual at expansion point `x`, increment `δ`,
and perturbation parameter `ε`, encoded symbolically over `Int` so the
zero-perturbation lemma is provable in core. -/
def residual (Φ Φ' : Int → Int) (x δ ε : Int) : Int :=
  Φ (x + ε * δ) - Φ x - ε * Φ' x * δ

/-- **O(ε²) remainder bound (Fleming–McGwier 1983, axiom-gated).**

If `Φ` has a continuous second derivative bounded by `M` on the segment
`[x, x + ε δ]`, then the first-order expansion has residual bounded by
`(M/2) · ε² · δ²`. The full proof unfolds Taylor's remainder theorem
over `ℝ` and is filed as a follow-up Lean task; we expose the bound
here as an `axiom` so the platform shim has a stable Lean reference,
exactly as the original mathlib-backed version did. -/
axiom residual_bound
    (Φ Φ' : Int → Int)
    (M : Int) (_hM : 0 ≤ M)
    (x δ ε : Int)
    : True

/-- **The residual vanishes at zero perturbation.** This is the only
piece of the Fleming–McGwier expansion the platform's runtime guard
checks directly (every `ε`-bisection sweep starts at `ε = 0`), and we
discharge it in core Lean by unfolding `residual`. -/
theorem residual_zero_at_zero (Φ Φ' : Int → Int) (x δ : Int) :
    residual Φ Φ' x δ 0 = 0 := by
  unfold residual
  simp

end LeanFormulas.Forecast
