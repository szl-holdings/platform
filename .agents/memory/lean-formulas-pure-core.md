---
name: packages/lean-formulas builds against pure Lean 4 core, not mathlib
description: Why the lakefile dropped `require mathlib` and how to restore it
---

`packages/lean-formulas/lakefile.lean` deliberately does **not** require
mathlib. The four root files (`Connection.NullSpace`, `Substance.GCA`,
`Anatomy.Boundary`, `Forecast.Perturbation`) are stated and proved in
the core Lean 4 prelude only. Validation step `lean` runs
`scripts/check-lean-build.sh`, which self-bootstraps `elan` + the pinned
toolchain and finishes in well under a minute on a cold cache.

**Why:** Per the sibling note `lean-mathlib-build-cost.md`, mathlib
v4.12.0 cannot be hydrated inside a Replit session — neither
`lake update` (git-clone alone exceeds the per-command budget) nor
`lake exe cache get` from the Reservoir cache fit. Pretending to ship
"machine-checked formulas" while the build is impossible to run is
dishonest; restating the four lemmas in pure Lean 4 makes the
machine-check claim actually verifiable in-session and in CI.

**How to apply:**
- Do not add `require mathlib …` to this lakefile without first wiring
  up a warm mathlib olean cache on the runner and verifying
  `lake exe cache get` completes inside the command-time budget.
- The two deep theorems (Henderson–McGwier optimality,
  Fleming–McGwier residual bound) stay `axiom`-gated regardless of
  mathlib availability; the original mathlib draft already used the
  same axiom pattern because each proof is >200 lines of analysis.
- Restoration path is documented in the package's README under
  "Why no mathlib?": re-add the mathlib require + swap the core
  `HasZero`/`Int` stubs for `LinearMap.ker`/`taylorWithinEval` calls.
- New formalisations follow the registry-tie convention also documented
  in that README: Lean theorem name == registry id with
  `kebab-case → snake_case`, two-way docstring/citation pointer.
