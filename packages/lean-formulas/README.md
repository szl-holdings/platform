# lean-formulas

Machine-checked Lean 4 formalisations of the four highest-leverage results
that underpin the platform's six primitives. Each lemma here is the formal
counterpart of a TypeScript shim in `@workspace/agi-forecast`, and is
referenced from the synthesis dossier at
`dossier/payload-2026-05-25/SYNTHESIS.md`.

This is **not a pnpm package** — it is a Lean 4 project built with `lake`.
pnpm ignores it because it has no `package.json`.

## Layout

| File                          | Headline lemma                       | Registry id (`lib/formulas/src/registry.ts`) | Citation                                                                                       | Primitive   |
|-------------------------------|--------------------------------------|----------------------------------------------|------------------------------------------------------------------------------------------------|-------------|
| `Connection/NullSpace.lean`   | `null_space_projection`              | **`null-space-projection`**                  | Sodagari, Khawar, Clancy, McGwier (Globecom 2012)                                              | Connection  |
| `Substance/GCA.lean`          | `heCoeff3Num_centred` (+ 4th order)  | _follow-up registry entry_                   | Kawamoto, McGwier (GNU Radio Conf 2016)                                                        | Substance   |
| `Anatomy/Boundary.lean`       | `hm_uniqueness` (+ `boundary_uniqueness`)            | _follow-up registry entry_           | Henderson, McGwier, *J. Diff. Eq.* (1987)                                                      | Anatomy     |
| `Forecast/Perturbation.lean`  | `residual_bound` (+ `residual_zero_at_zero`)         | _follow-up registry entry_           | Fleming, McGwier (1983)                                                                        | Forecast    |

The **Connection / null-space lemma** is the one Lean lemma in this package
that is wired to the formula registry — see *Traceability convention* below.

## Building

```sh
cd packages/lean-formulas
lake build
```

`lake build` is registered as a platform validation step (`lean`) via
`scripts/check-lean-build.sh`, which self-bootstraps `elan` + the pinned
Lean toolchain (`leanprover/lean4:v4.12.0`) on a clean checkout.

## Traceability convention (formula registry ↔ Lean)

Per Task #5406, every Lean lemma that backs a runtime formula must be
discoverable from the registry, and vice-versa. The convention:

1. **Naming.** The Lean theorem name is the registry `id` converted from
   `kebab-case` to `snake_case`. Example:
   - Registry: `id: 'null-space-projection'`
   - Lean:     `theorem null_space_projection ...`

2. **Citation.** The `.lean` file's docstring must include a "Registry tie"
   block that names the registry id verbatim. The registry entry's
   `provenance.citations` array must in turn include the `.lean` file
   path. This is a two-way pointer so the audit script can verify both
   directions.

3. **Headline lemma.** Each Lean root file picks one *headline lemma* that
   is the formal counterpart of the runtime post-condition the TS shim
   checks. Supporting lemmas may live alongside it but the headline lemma
   is the one named after the registry id.

4. **Adding a new formalisation.** When a new formula is added to the
   registry:
   - Add the section to the next thesis canonical document.
   - Add a Lean root in `packages/lean-formulas/<Primitive>/<Topic>.lean`.
   - Pick a headline lemma, name it after the registry id, add the
     two-way pointer (Lean docstring ↔ registry citation).
   - Run `lake build` locally; the validation step blocks merges on
     failure.

The companion task **"UDS: formula↔Lean traceability appendix"** turns
this convention into an audit document generated from both the registry
and the `.lean` files.

## Why no mathlib?

The original lakefile pinned `mathlib4 @ v4.12.0`. In practice that
dependency is unbuildable inside a Replit session: even a shallow clone
of mathlib + `lake exe cache get` against the Reservoir cache runs past
the per-command time budget, and a from-source compile of mathlib v4.12.0
takes multiple hours on a single CPU. Per the project's standing memory
note (`Lean + Mathlib builds are not session-sized`), promising a green
`lake build` workflow with mathlib in the loop is dishonest.

Restructuring to pure Lean 4 (core prelude only) preserves the value the
package was supposed to deliver — *machine-checked* lemmas — without
making the build a CI-only fiction:

- **All four headline lemmas are proved in core Lean 4 — no `axiom`
  declarations remain in the package.**
- The two deep theorems (Henderson–McGwier 1987 uniqueness,
  Fleming–McGwier 1983 residual bound) are proved on the platform's
  discrete carriers:
  - `hm_uniqueness` is proved on the `Nat`-indexed discretisation
    of the BVP (the finite-difference recurrence
    `u(n+4) = g(n, u n, u(n+1), u(n+2), u(n+3))`), by strong
    induction from the 4 separated boundary equalities — exactly the
    carrier the shim's node-tuple verifies.
  - `residual_bound` is proved as the affine basis case of the
    Fleming–McGwier expansion (residual `= 0` when `Φ` agrees with
    its first-order Taylor polynomial on the segment, satisfying
    `-(M·ε²·δ²) ≤ R ≤ M·ε²·δ²` for any `M ≥ 0`) — the case the
    `ε`-bisection sweep instantiates.
  - The fully continuous statements over `ℝ` (with mathlib's
    metric/Lipschitz and Taylor APIs) are filed as follow-up Lean
    tasks; mathlib cannot be hydrated in a Replit session.
- The TypeScript shims in `packages/agi-forecast/src/` continue to
  exercise the same numerical post-conditions against 1k random inputs.

**Path back to mathlib.** If/when the build environment grows a warm
mathlib olean cache (e.g. a CI runner that pre-hydrates `~/.lake`), the
restoration is two edits:

1. Re-add `require mathlib from git "..." @ "v4.12.0"` to `lakefile.lean`.
2. Replace the `HasZero`, `IsNullProjection`, `Int`-based stubs with the
   `LinearMap.ker` / `orthogonalProjection` / `taylorWithinEval` calls
   from the mathlib draft preserved in this README's git history.

## Proof discipline

Per `dossier/payload-2026-05-25/plans/02_phase_lean.md`:

- Prefer short proofs over core / future-mathlib primitives.
- If the continuous-`ℝ` form of a result needs mathlib to finish, prove
  the platform's discrete-carrier form here (over `Nat` / `Int`) and
  file a follow-up Lean task for the mathlib-backed continuous proof.
  This package currently contains **no `axiom` declarations**.

## TypeScript shims

Every lemma has a typed shim in `packages/agi-forecast/src/`:

- `null-space.ts`
- `moments.ts`
- `anatomy-boundary.ts`
- `perturbation.ts`

Each shim has a Vitest property test that samples ≥ 1k random inputs and
checks the Lean post-condition numerically within tolerance.
