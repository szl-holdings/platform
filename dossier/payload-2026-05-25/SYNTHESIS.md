# Payload 2026-05-25 — Synthesis

Owner: task agent (delegated 2026-05-25)
Phase: 1 — synthesis dossier.
Status: ROWS FILLED. Phase 2 (Lean formalisation) executes against this map.

This document is the canonical mapping from the attached source material to the
platform primitive each result strengthens, and to the concrete code surface
that carries the result into production. Phase 2+ tasks are sequenced from this
table — no further re-reading of the dossier should be necessary.

## Source → primitive → target file

| # | Source                                                                                           | Core formal contribution                                          | Primitive     | Target file (new unless noted)                                  | Phase  |
|---|--------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|---------------|-----------------------------------------------------------------|--------|
| 1 | Sodagari, Khawar, Clancy, McGwier — *Projection Based Approach for Radar/Comms Coexistence* (Globecom 2012) | Null-space projection annihilates the radar channel matrix        | Connection    | `packages/lean-formulas/Connection/NullSpace.lean` + `packages/agi-forecast/src/null-space.ts` (+ `artifacts/api-server/src/routes/vessels-coexistence.ts` in Phase 4) | 2, 4   |
| 2 | Fleming, McGwier — *Regular Perturbation Expansion in Nonlinear Filtering* (1983)                | O(ε²) residual bound for first-order forecast linearisation       | Forecast      | `packages/lean-formulas/Forecast/Perturbation.lean` + `packages/agi-forecast/src/perturbation.ts` | 2      |
| 3 | Kawamoto, McGwier — *Rigorous Moment-Based AMC* (GNU Radio Conf 2016)                            | Moment ↔ Hermite (Gram–Charlier A) bridge for modulation fingerprints | Substance     | `packages/lean-formulas/Substance/GCA.lean` + `packages/agi-forecast/src/moments.ts` | 2      |
| 4 | Clark, Ernst, McGwier — *AMC via Waveform Signature* (arXiv:2404.01119)                          | Signature distance as routing decision metric                     | Transformation | `packages/agi-forecast/src/waveform-signature.ts` (planned)     | 4      |
| 5 | Henderson, McGwier — *Uniqueness/Existence/Optimality for 4th-Order Lipschitz Equations* (J. Diff. Eq. 1987) | Uniqueness on 4-tuple physiology nodes (`L < 384/(b−a)⁴`)         | Anatomy       | `packages/lean-formulas/Anatomy/Boundary.lean` + `packages/agi-forecast/src/anatomy-boundary.ts` | 2      |
| 6 | Kannan, Ravi — *Second-Order Statistical AMC with SVM/KNN*                                       | Baseline comparator only                                          | (comparator)  | Used in Phase 6 test harness, no new primitive                  | 6      |
| 7 | AlloyScape — *Exploring Frameworks for the Continuum Hypothesis* (internal)                      | Narrative framing                                                 | —             | Narrative section below; no code surface                         | 1      |
| 8 | Stanford Montanari — *High-Dimensional Statistics, Part A*                                       | Concentration / covariance bounds for gauge state                 | Substance     | `packages/agi-forecast/src/concentration.ts` (planned)          | 4      |
| 9 | VectifyAI / PageIndex                                                                            | Doc-tree retrieval                                                | Anatomy (ops) | `packages/payload/src/page-index.ts` (planned)                  | 4      |
| 10 | thestacks.org Glass-Box UMAP                                                                    | Interpretable embeddings for operator console                     | (viz)         | `artifacts/conduit/src/pages/operator-state-map.tsx` (planned)  | 4      |
| 11 | Army CDR Vol 11 No 3 — Dotterrer                                                                 | Cyber resilience taxonomy refresh                                 | (Sentra)      | `artifacts/sentra/src/lib/resilience-rubric.ts` (refactor)      | 4      |
| 12 | Springer s00521-026-12120-0 (NC&A 2026)                                                          | Secondary reference                                               | —             | Narrative only                                                  | 1      |
| 13 | arXiv:2605.09073                                                                                 | Secondary reference                                               | —             | Narrative only                                                  | 1      |
| 14 | Wikipedia — Hilbert's problems                                                                   | Narrative framing                                                 | —             | Narrative only                                                  | 1      |

## Phase 2 status — Lean formalisations (this task)

Rows **1, 2, 3, 5** above are the four highest-leverage results promoted to
machine-checked Lean lemmas in this task. Each row has:

1. A Lean 4 file under `packages/lean-formulas/` that states the post-condition
   over mathlib primitives and either proves it or files an `axiom`-gated stub
   (per the ≥ 200-LOC escape hatch in `plans/02_phase_lean.md`).
2. A TypeScript shim in `packages/agi-forecast/src/` with the same input/output
   signature the Lean statement quantifies over.
3. A Vitest property test under `packages/agi-forecast/src/__tests__/` that
   samples 1 000 random inputs and checks the Lean post-condition numerically
   within tolerance.
4. A registered platform validation step (`lean`) that runs `lake build` so
   any future drift between the formal statement and the shim is caught in CI.

| Row | Lean theorem                                | TS shim entry point          | Property test                                | Stub kind |
|-----|---------------------------------------------|------------------------------|----------------------------------------------|-----------|
| 1   | `null_space_coexistence`                    | `projectOntoNullSpace`       | `null-space.test.ts`                         | full proof |
| 2   | `residual_bound` (Fleming–McGwier)          | `perturbationResidual`       | `perturbation.test.ts`                       | axiom      |
| 3   | `heCoeff3_homogeneous`, `heCoeff4_homogeneous` | `heCoeff3`, `heCoeff4`     | `moments.test.ts`                            | full proof |
| 5   | `boundary_uniqueness`                       | `picardDisagreement`, `withinUniquenessRegime` | `anatomy-boundary.test.ts`        | axiom (`hm_uniqueness`) |

Each axiom-gated row has a follow-up Lean task filed against the
`lean-formulas` package: discharge `hm_uniqueness` from
Henderson–McGwier 1987 §3, and discharge `residual_bound` via
`Mathlib.Analysis.Calculus.Taylor`.

## Narrative — Hilbert / continuum / AlloyScape

The AlloyScape note frames the platform's six primitives as a *typed*
continuum: each primitive is a level of abstraction analogous to Hilbert's
ordering of mathematical problems by the type of structure they presuppose.
This is recorded here for orientation only; it does not introduce a code
surface and is excluded from Phase 2's Lean targets.

## Companion mapping

A machine-readable `MAPPING.json` is intentionally deferred to Phase 4 when
the remaining rows (4, 8, 9, 10, 11) ship their target files. The table above
is the authoritative source until then.
