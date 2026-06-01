# READINESS-DR

Backs up Unay LMDB stores and proves restore.

| | |
|---|---|
| **Schedule** | `0 5 * * *` — daily |
| **Entry point** | `executor.py` |
| **Inputs** | Flagships. |
| **Emits** | Backup-and-restore proof receipts. |
| **Pass criteria** | Dump readable + restores into sqlite with >= 1 queryable row. |
| **Receipt sink** | `SZLHOLDINGS/readiness-runs` → `receipts/readiness-dr/<date>/<ts>.json` |

## What it does
Triggers a backup dump of each flagship's Unay LMDB (where applicable) to the HF dataset; verifies the dump is readable; tests restore by loading a fresh sqlite from the dump and querying it back.

## How it runs
- **Nightly/hourly** via `.github/workflows/readiness-dr.yml` (cron `0 5 * * *`).
- **Manually**: `python platform/agents/readiness/readiness-dr/executor.py`
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
