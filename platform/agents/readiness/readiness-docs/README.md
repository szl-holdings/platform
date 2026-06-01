# READINESS-DOCS

Scores community-health doc completeness + flags stale doctrine.

| | |
|---|---|
| **Schedule** | `30 4 * * *` — daily |
| **Entry point** | `executor.py` |
| **Inputs** | All public repos. |
| **Emits** | Per-repo docs completeness score (0..7). |
| **Pass criteria** | Score 7/7 + no stale-doctrine markers in README/CITATION. |
| **Receipt sink** | `SZLHOLDINGS/readiness-runs` → `receipts/readiness-docs/<date>/<ts>.json` |

## What it does
Verifies README + LICENSE + SECURITY.md + CITATION.cff + CONTRIBUTING.md + CODE_OF_CONDUCT.md + STATUS.md are present in each repo; checks for stale Doctrine numbers (626/189/168, v7/v9/v10).

## How it runs
- **Nightly/hourly** via `.github/workflows/readiness-docs.yml` (cron `30 4 * * *`).
- **Manually**: `python platform/agents/readiness/readiness-docs/executor.py`
  (set the relevant `*_URL`, `OTEL_COLLECTOR_URL`, `HF_TOKEN`, and
  `KHIPU_SIGNING_KEY_B64` env vars first).

## Output contract
Every run emits a single Khipu receipt (DSSE envelope) to stdout and, when
`HF_TOKEN` is set, uploads it to the runs dataset. The receipt carries a
`payload` with the per-target verdicts and the Doctrine v11 stamp
(`749/14/163`).

## Honesty
This agent never fabricates a green. Missing inputs produce `SKIPPED` /
`NO-RECEIPT` / honest failure states, surfaced verbatim on the dashboard.

---
Doctrine v11 (LOCKED) · 749/14/163 · Author: Yachay <yachay@szlholdings.dev>
