# @szl-holdings/szl-doctrine

Typed Doctrine V6 constants grounded in the SZL_FINAL_PAYLOAD v8
(`.local/payload-v8/`). Single source of truth for every artifact's
`GovernancePanels`.

Exports:

- `DOCTRINE_V6` — replay root, Λ floor, hard floors, license allowlist
- `AXES` — the 9-axis Λ table with hard-floor markers
- `BYLINE` — canonical Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
- `THESIS_LEDGER` — TH1–TH8 + VSP + FG with per-thesis acceptance status
- `ARXIV_ZENODO` — arXiv v2 bundle SHA + Zenodo deposit version
- `GAP_COUNTS` — P0/P1/P2 counts from `09_gaps_upgrades/GAP_REPORT.md`
- `ANATOMY_FIGURES` — 8-figure index from `05_anatomy/anatomy_INDEX.md`
- `SLO_STATUS` — org-posture counters
- `ARTIFACT_ACCEPTANCE` — per-artifact acceptance slice keyed by artifact slug
- Pre-formatted display strings (`LAMBDA_FLOOR_TEXT`, `HARD_FLOORS_TEXT`,
  `LICENSE_ALLOWLIST_TEXT`, etc.) so panels never duplicate copy.

License: Apache-2.0 (code) · CC-BY-4.0 (text).
