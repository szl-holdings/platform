# Phase 2 — Lean / mathlib formalisations

## Goal
Promote the four highest-leverage results from Phase 1 into machine-checked
lemmas, and expose each one as a typed TypeScript shim the platform can call.

## Targets (one Lean file + one TS shim per row)

| Lemma                                  | Lean file                                       | TS shim                                                   | Primitive    |
|----------------------------------------|-------------------------------------------------|-----------------------------------------------------------|--------------|
| Null-space projection coexistence      | `packages/lean-formulas/Connection/NullSpace.lean` | `packages/agi-forecast/src/null-space.ts`              | Connection   |
| Moment ↔ Hermite GCA bridge            | `packages/lean-formulas/Substance/GCA.lean`     | `packages/agi-forecast/src/moments.ts`                    | Substance    |
| 4th-order BVP uniqueness/optimality    | `packages/lean-formulas/Anatomy/Boundary.lean`  | `packages/agi-forecast/src/anatomy-boundary.ts`           | Anatomy      |
| Regular-perturbation forecast bound    | `packages/lean-formulas/Forecast/Perturbation.lean` | `packages/agi-forecast/src/perturbation.ts`           | Forecast     |

## Method
1. Confirm or create `packages/lean-formulas/` (with `lakefile.lean`,
   `lean-toolchain`, mathlib4 pin). If it doesn't exist, scaffold it as a
   sibling of the other pnpm packages, registered as a non-pnpm package in
   `.replit-ignore-pnpm`.
2. For each lemma:
   - State the proposition over the mathlib primitives that already exist
     (`LinearMap.ker`, `Polynomial.hermite`, `ContinuousLinearMap`,
     `MeasureTheory.Measure`).
   - Prove it — short proofs preferred; if a result needs ≥ 200 lines, ship
     an `axiom`-gated stub and file a follow-up Lean task.
   - Add `lake build` to the validation step list.
3. For each TS shim:
   - Pure function, no side effects, accepts the same inputs the Lean
     statement quantifies over.
   - Property test in Vitest: 1k random inputs satisfy the Lean post-condition
     (computed numerically) within tolerance.

## Done looks like
- `lake build` exits 0.
- `pnpm --filter @platform/agi-forecast test` covers all four shims.
- A short `packages/lean-formulas/README.md` lists what each file proves and
  the citation for the result.
