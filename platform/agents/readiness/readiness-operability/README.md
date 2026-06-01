# READINESS-OPERABILITY

Scores rollback readiness, active maintenance, Docker + env docs.

| | |
|---|---|
| **Schedule** | `30 3 * * *` — daily |
| **Entry point** | `executor.py` |
| **Inputs** | Flagships. |
| **Emits** | Per-flagship operability score (0..4). |
| **Pass criteria** | Score 4/4 (all four operability signals satisfied). |
| **Receipt sink** | `SZLHOLDINGS/readiness-runs` → `receipts/readiness-operability/<date>/<ts>.json` |

## What it does
Verifies a rollback runbook exists, each flagship has >= 2 commits in the last 7 days (active maintenance), the Dockerfile is structurally sound (FROM + CMD/ENTRYPOINT; full build when DOCKER_BUILD=1), and env-var documentation is present.

## How it runs
- **Nightly/hourly** via `.github/workflows/readiness-operability.yml` (cron `30 3 * * *`).
- **Manually**: `python platform/agents/readiness/readiness-operability/executor.py`
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
