# lean-formulas

Machine-checked Lean 4 / mathlib4 formalisations of the four highest-leverage
results that underpin the platform's six primitives. Each lemma here is the
formal counterpart of a TypeScript shim in `@workspace/agi-forecast`, and is
referenced from the synthesis dossier at
`dossier/payload-2026-05-25/SYNTHESIS.md`.

This is **not a pnpm package** — it is a Lean 4 project built with `lake`.
pnpm ignores it because it has no `package.json`.

## Layout

| File                          | Lemma                                                | Citation                                                                                       | Primitive   |
|-------------------------------|------------------------------------------------------|------------------------------------------------------------------------------------------------|-------------|
| `Connection/NullSpace.lean`   | Null-space projection annihilates the channel matrix | Sodagari, Khawar, Clancy, McGwier (Globecom 2012)                                              | Connection  |
| `Substance/GCA.lean`          | Hermite-coefficient ↔ raw-moment bridge for GCA      | Kawamoto, McGwier (GNU Radio Conf 2016)                                                        | Substance   |
| `Anatomy/Boundary.lean`       | 4th-order Lipschitz BVP solution uniqueness          | Henderson, McGwier, *J. Diff. Eq.* (1987)                                                      | Anatomy     |
| `Forecast/Perturbation.lean`  | O(ε²) residual bound for regular-perturbation filter | Fleming, McGwier (1983)                                                                        | Forecast    |

## Building

```sh
cd packages/lean-formulas
lake update    # one-time, pulls mathlib4 @ v4.12.0
lake build
```

`lake build` is registered as a platform validation step (`lean`). In CI it
runs with `mathlib`'s cached oleans; locally the first build downloads them.

## Proof discipline

Per `dossier/payload-2026-05-25/plans/02_phase_lean.md`:

- Prefer short proofs over mathlib primitives.
- If a result needs more than ~200 lines of Lean to finish, ship an
  `axiom`-gated stub here and file a follow-up Lean task. Each `axiom` in this
  package must cite the source paper it is standing in for.

## TypeScript shims

Every lemma has a typed shim in `packages/agi-forecast/src/`:

- `null-space.ts`
- `moments.ts`
- `anatomy-boundary.ts`
- `perturbation.ts`

Each shim has a Vitest property test that samples ≥ 1k random inputs and
checks the Lean post-condition numerically within tolerance.
