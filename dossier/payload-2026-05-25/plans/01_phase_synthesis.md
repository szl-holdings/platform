# Phase 1 — Payload Synthesis Dossier

## Goal
Produce a single navigable doc, `dossier/payload-2026-05-25/SYNTHESIS.md`, that
maps every attached source to:
1. its core formal contribution,
2. the existing platform primitive it strengthens
   (Connection / Substance / Transformation / Anatomy / Lutar / Forecast),
3. the concrete code surface to evolve in Phase 2+.

## Method
Dispatch three parallel explore subagents — math, signals, tooling — each
producing a tracked-list of `(source, claim, primitive, target_file)` rows.

### Math/stats track
- Henderson–McGwier 1987 — 4th-order Lipschitz BVP optimality
  → **Anatomy** invariant (boundary uniqueness on 4-tuple physiology nodes)
  → target: `packages/lean-formulas/Anatomy/Boundary.lean` (new).
- Fleming–McGwier 1983 — regular perturbation in nonlinear filtering
  → **Forecast** primitive (small-ε bounds for Lutar Readiness drift)
  → target: `packages/agi-forecast/src/perturbation.ts` (new) + Lean shim.
- Montanari — high-dim stats Part A
  → **Substance** primitive (covariance & concentration bounds for gauges)
  → target: `packages/agi-forecast/src/concentration.ts` (new).
- Hilbert's problems / continuum hypothesis (AlloyScape)
  → narrative section in SYNTHESIS.md, no code surface.

### Signals/RF track
- Sodagari et al. — null-space projection radar↔comms coexistence
  → **Connection** invariant (project Vessels signal onto null-space of
  shore-radar channel; enables real coexistence routes)
  → target: `artifacts/api-server/src/routes/vessels-coexistence.ts` (new)
  + `packages/lean-formulas/Connection/NullSpace.lean` (new).
- Kawamoto–McGwier — moment-based AMC w/ Gram–Charlier
  → **Substance** feature extractor (modulation fingerprints as substance
  vectors)
  → target: `packages/agi-forecast/src/moments.ts` (new).
- Clark–Ernst–McGwier — waveform-signature AMC
  → **Transformation** primitive (signature distance → routing decisions)
  → target: `packages/agi-forecast/src/waveform-signature.ts` (new).
- Kannan–Ravi — 2nd-order stats AMC w/ SVM/KNN
  → baseline classifier, used as comparator in tests (not a primitive).

### Tooling track
- VectifyAI/PageIndex — doc-tree retrieval
  → **Anatomy** crawl (build a per-artifact doc tree for the operator console)
  → target: `packages/payload/src/page-index.ts` (new).
- Glass-Box UMAP — interpretable embeddings
  → operator-console viz of gauge state-space
  → target: `artifacts/conduit/src/pages/operator-state-map.tsx` (new).
- Army CDR Dotterrer — cyber resilience taxonomy
  → **Sentra** scoring rubric refresh
  → target: `artifacts/sentra/src/lib/resilience-rubric.ts` (refactor).
- Springer s00521-026-12120-0 + arXiv:2605.09073
  → secondary references, narrative only.

## Done looks like
- `SYNTHESIS.md` exists with all rows filled.
- A `MAPPING.json` companion file enumerates `(source → target_file)` so
  Phases 2–4 can be sequenced without re-reading the dossier.
- No production code touched in this phase.
