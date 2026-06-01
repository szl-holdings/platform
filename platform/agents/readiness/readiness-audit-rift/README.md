# READINESS-AUDIT-RIFT

The verifier of verifiers — independently re-checks the other 7.

| | |
|---|---|
| **Schedule** | `0 6 * * *` — daily (after the other 7) |
| **Entry point** | `executor.py` |
| **Inputs** | Outputs (signed receipts) of all 7 prior agents. |
| **Emits** | Meta-audit signed receipt with a list of flagged agents. |
| **Pass criteria** | No peer agent flagged as OVER-CLAIMED or NO-RECEIPT. |
| **Receipt sink** | `SZLHOLDINGS/readiness-runs` → `receipts/readiness-audit-rift/<date>/<ts>.json` |

## What it does
Independently re-verifies a sample of each agent's claims (re-curl, re-walk chains, re-verify signatures); flags any agent that over-claimed or whose receipt is missing.

## How it runs
- **Nightly/hourly** via `.github/workflows/readiness-audit-rift.yml` (cron `0 6 * * *`).
- **Manually**: `python platform/agents/readiness/readiness-audit-rift/executor.py`
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
