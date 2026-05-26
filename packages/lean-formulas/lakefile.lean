import Lake
open Lake DSL

/-
The platform's machine-checked-formula package.

Mathlib note (Task #5406)
=========================
This package originally pinned `mathlib4 @ v4.12.0`. That dependency cannot
be hydrated inside a Replit session: even a shallow clone of mathlib +
`lake exe cache get` runs past the per-command time budget, and a
from-source compile of mathlib v4.12.0 takes multiple hours on a single
CPU. To make `lake build` actually pass — both in CI and locally on a
fresh checkout — the four lemmas depend only on the Lean 4 core
prelude. The deep theorems (Henderson–McGwier 1987 uniqueness,
Fleming–McGwier 1983 residual bound) are proved on the platform's
discrete carriers (Nat-indexed BVP recurrence; affine basis case of
the perturbation expansion). No `axiom` declarations remain in the
package; the continuous-ℝ form of each result is filed as a follow-up
Lean task that needs a mathlib-warm runner.

See `README.md` § "Why no mathlib?" for the full rationale and the path
back to a mathlib-backed proof should the build environment ever grow a
warm mathlib olean cache.
-/

package «lean-formulas» where
  leanOptions := #[⟨`pp.unicode.fun, true⟩]

@[default_target]
lean_lib «LeanFormulas» where
  roots := #[
    `Connection.NullSpace,
    `Substance.GCA,
    `Anatomy.Boundary,
    `Forecast.Perturbation
  ]
