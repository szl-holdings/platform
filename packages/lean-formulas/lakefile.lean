import Lake
open Lake DSL

package «lean-formulas» where
  -- Build settings for the platform's machine-checked formulas.
  leanOptions := #[⟨`pp.unicode.fun, true⟩]

require mathlib from git
  "https://github.com/leanprover-community/mathlib4.git" @ "v4.12.0"

@[default_target]
lean_lib «LeanFormulas» where
  roots := #[
    `Connection.NullSpace,
    `Substance.GCA,
    `Anatomy.Boundary,
    `Forecast.Perturbation
  ]
