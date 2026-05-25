# Payload 2026-05-25 — Master Plan

Owner: task agent (delegated by user, 2026-05-25)
Scope: ingest the attached papers + links, evolve the platform formulas, ship a
real A11oy UDS/Zarf payload, make Vessels fully operational, redesign Vessels in
the A11oy × Anthropic × Lambda visual language.

## Source material

Papers (attached):
- Sodagari, Khawar, Clancy, McGwier — *A Projection Based Approach for Radar and
  Telecommunication Systems Coexistence* (Globecom 2012).
- Fleming, McGwier — *A Regular Perturbation Expansion in Nonlinear Filtering*
  (1983).
- Kawamoto, McGwier — *Rigorous Moment-Based Automatic Modulation
  Classification* (GNU Radio Conf 2016).
- Clark, Ernst, McGwier — *Automatic Modulation Classification using a Waveform
  Signature* (arXiv:2404.01119).
- Henderson, McGwier — *Uniqueness, Existence, and Optimality for Fourth-Order
  Lipschitz Equations* (J. Diff. Eq. 1987).
- Kannan, Ravi — *Second-Order Statistical Approach for Digital Modulation
  Scheme Classification in Cognitive Radio Using SVM and KNN*.
- AlloyScape — *Exploring Frameworks for the Continuum Hypothesis* (internal).

Links:
- VectifyAI/PageIndex (doc-tree retrieval).
- Springer s00521-026-12120-0 (neural computing & applications 2026).
- arXiv:2605.09073.
- thestacks.org Glass-Box UMAP.
- Army Cyber Defense Review Vol 11 No 3 — Dotterrer.
- Stanford Montanari — *High-Dimensional Statistics, Part A*.
- Wikipedia — Hilbert's problems.

## Phases

| # | Name                                | Status     | Effort | Output                                          |
|---|-------------------------------------|------------|--------|-------------------------------------------------|
| 0 | Close task #5137 (gauge status)     | EXECUTING  | 30 min | Per-gauge status panel + working refresh button |
| 1 | Payload synthesis dossier           | PLANNED    | 1–2 d  | `SYNTHESIS.md` mapping each paper → primitive   |
| 2 | Lean / mathlib formalisations       | PLANNED    | 2–3 d  | 4 new lemmas + TS shims into `agi-forecast`     |
| 3 | A11oy UDS/Zarf payload              | PLANNED    | 2–3 d  | `artifacts/a11oy-uds/` producing signed tarball |
| 4 | Vessels real backend                | PLANNED    | 3–4 d  | 5 new API routes + DB persistence + UI rewire   |
| 5 | Vessels visual redesign             | PLANNED    | 2 d    | A11oy × Anthropic × Lambda look across Vessels  |
| 6 | E2E test pass + smoke               | PLANNED    | 1 d    | Vitest/Playwright/Lake green                    |

Only Phase 0 is in scope for the current task assignment. Phases 1–6 will be
filed as follow-up tasks at completion time so each gets its own focused PR
instead of a single sprawling change set.

See per-phase files (`01_phase_synthesis.md` … `06_phase_test.md`) for detail.
