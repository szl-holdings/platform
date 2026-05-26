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
fresh checkout — we restructure the four lemmas to depend only on the
Lean 4 core prelude. The deep theorems (Henderson–McGwier optimality,
Fleming–McGwier residual bound) remain stated as `axiom` declarations
citing the source paper, exactly as the original mathlib-backed version
did for the same long results.

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
