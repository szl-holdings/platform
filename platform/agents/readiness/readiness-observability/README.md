# READINESS-OBSERVABILITY

Proves Wire D trace propagation + required metrics counters.

| | |
|---|---|
| **Schedule** | `0 * * * *` — hourly |
| **Entry point** | `executor.py` |
| **Inputs** | Flagships + OTel collector URL. |
| **Emits** | Trace continuity matrix (does Wire D propagate end to end?). |
| **Pass criteria** | Trace observed at collector for every flagship + all required counters present. |
| **Receipt sink** | `SZLHOLDINGS/readiness-runs` → `receipts/readiness-observability/<date>/<ts>.json` |

## What it does
Sends a sample request to each flagship carrying a unique traceparent header, then curls the OTel collector `/recent` to confirm the trace landed; verifies /metrics endpoints expose the required counters.

## How it runs
- **Nightly/hourly** via `.github/workflows/readiness-observability.yml` (cron `0 * * * *`).
- **Manually**: `python platform/agents/readiness/readiness-observability/executor.py`
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
