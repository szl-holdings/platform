# SZL Holdings — Ouroboros Thesis Chain

Canonical record of the Ouroboros / Lutar Invariant thesis chain. Every published version is preserved; the live runtime always tracks the most recent canonical document.

## Live canonical

- **v9 — UNIFIED-OPERATIONAL** *(current, May 5 2026)* — `docs/thesis/v9-canonical.md`
  Adds Lutar v6 (Holographic-Twistor-Cyclic), Lutar Ω (Unified Master Invariant on the 5-simplex), Lutar v7 (Bianchi Closure / HUFT-inspired). Codex schema `alloy.supreme_knowledge/v11-UNIFIED-OPERATIONAL`, 75 nodes / 94 edges.

## Derivative artefacts (v9)

- **Long-form essay** (~1500 words) — `docs/thesis/v9-essay.md`
- **One-pager** — `docs/thesis/v9-onepager.md`
- **Social cards copy** — `docs/thesis/v9-social-cards.md`
- **Publishing checklist** — `docs/thesis/v9-publishing-checklist.md`
- **Formula ↔ thesis gap report** — `docs/audits/formula-thesis-gaps.md`

## Prior canonical versions (preserved for provenance)

| Version | Date       | Document                                                          | DOI / Release                   |
| ------- | ---------- | ----------------------------------------------------------------- | ------------------------------- |
| v1      | 2026-04-28 | `docs/research/ouroboros-thesis-v2.md` (compiled record)          | 10.5281/zenodo.19867281         |
| v2      | 2026-05-03 | `docs/research/ouroboros-thesis-v2.md`                            | 10.5281/zenodo.19944926         |
| v3      | 2026-05-04 | `attached_assets/ouroboros-thesis-v3_(1)_1777579374725.md`        | GitHub release v6.1.0           |
| v4–v6   | 2026-05-04 | `docs/ouroboros-v6/OUROBOROS_THESIS_V4_V5_V6_UNIFIED.md`          | unified operational              |
| v7–v9   | 2026-05-04 | `docs/ouroboros-v8/OUROBOROS_THESIS_V7_V8_V9_UNIFIED.md`          | v9-GLOBAL-NOETHER unified       |
| v9      | 2026-05-05 | `docs/thesis/v9-canonical.md` *(this chain)*                      | UNIFIED-OPERATIONAL             |

## Operational surfaces

- **A11oy thesis page** — `/thesis` (renders `docs/thesis/v9-canonical.md` with deep-links to formula endpoints)
- **A11oy Ouroboros page** — `/ouroboros` (frustum reconciliation surface)
- **A11oy Codex Receipts page** — `/codex-receipts`
- **API root** — `/api/ouroboros/codex`, `/api/ouroboros/lutar/{v1..v7,omega,evaluate-all}`, `/api/ouroboros/prisca/*`

## Authoring conventions (V1 → V9)

Each canonical thesis document follows the same structural cadence:

1. Title + cross-civilizational epigraphs
2. Author / ORCID / status / runtime reference / codex schema
3. Abstract — three to four crisp paragraphs
4. Version history table
5. Formula family — one subsection per version
6. Codex deltas
7. Extended Supreme Equation
8. Closure derivation chain (Noether / Bianchi)
9. Empirical lineages table
10. Live API test results
11. API endpoint reference
12. Source disclosure
13. File index

## v10 — EXHAUSTIVE-AUDIT (May 5, 2026)

| Document                                          | Purpose                                                                          |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `docs/thesis/v10-canonical.md`                    | Specification + closure theorem + live audit result                              |
| `docs/thesis/v10-essay.md`                        | Long-form essay (~1500 words)                                                    |
| `docs/thesis/v10-onepager.md`                     | One-pager / release notes                                                        |
| `paper/v10/`                                      | arXiv-ready manuscript bundle (canonical, abstract, CITATION.cff, .zenodo.json, references.bib, ARXIV_SUBMISSION.md) |

v10 introduces the **Audit Closure Operator Λ₁₀** as a meta-invariant on the v9 Lutar family. Λ₁₀ = Σ_k L_k · ∏_{j∈{CODE,CODEX,API,TEST,THESIS,SURFACE}} 𝟙[j_k]; auditClosed ⇔ closureRatio = 1. v10 is strictly inert when the chain is operational and quantifies drift by exactly the missing fraction otherwise. No new physical L-term. Shipping: `lutarV10Audit` exported from `@workspace/ouroboros-integrations`, `POST /api/ouroboros/lutar/v10`, codex node `lutar_v10`, 8 contract tests, A11oy `/thesis` row v10, Sentra `/thesis` mirror.

## Ingestion notes

Synthesis docs that catalog upstream bodies of work studied (URL,
license, ideas re-derived — never code copied) and map each extracted
idea to a specific A11oy surface that benefits.

- **Graph viz & dependency mapping** — `docs/ingestion/graph-viz.md`
  Survey of anvaka's `ngraph` / `pm` work, JiaxuanYou's GraphGym /
  GNN design-space papers, and ulab-uiuc's multi-agent topology
  writing. Re-derived ideas (Fruchterman-Reingold layout, degree
  centrality encoding, edge-weight modulated springs, focal-subgraph
  highlighting, LOD labels) landed in `A11oy AgentViz` topology;
  follow-ups queued for `AgentBom`, `AgentMesh`, and
  `AgentOrchestration`.

## Provenance policy

- No numbers are fabricated.
- Every claim cites either a prior canonical thesis, a published source, or a code-shipped function.
- The Lutar formula family is the intellectual property of Stephen P. Lutar / SZL Holdings.
- HUFT inspiration is fully credited: Moffat & Toth, arXiv:2510.06282 (2026).

## Author

**Stephen P. Lutar** — SZL Holdings / SZL Consulting Ltd
ORCID [0009-0001-0110-4173](https://orcid.org/0009-0001-0110-4173)
