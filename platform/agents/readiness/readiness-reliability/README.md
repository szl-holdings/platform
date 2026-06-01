# READINESS-RELIABILITY

Probes flagship liveness, latency, and signed-receipt success.

| | |
|---|---|
| **Schedule** | `0 * * * *` — hourly |
| **Entry point** | `executor.py` |
| **Inputs** | List of flagships + their SLO docs. |
| **Emits** | Signed Khipu receipt with a GREEN/AMBER/RED verdict per flagship. |
| **Pass criteria** | >= 99.5% success on /healthz and /khipu/sign, p99 < 800 ms. |
| **Receipt sink** | `SZLHOLDINGS/readiness-runs` → `receipts/readiness-reliability/<date>/<ts>.json` |

## What it does
curl /healthz, /khipu/sign, /khipu/verify, /metrics on each flagship for a 60s window; measures p99 latency, success rate, and signed-receipt success rate.

## How it runs
- **Nightly/hourly** via `.github/workflows/readiness-reliability.yml` (cron `0 * * * *`).
- **Manually**: `python platform/agents/readiness/readiness-reliability/executor.py`
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
