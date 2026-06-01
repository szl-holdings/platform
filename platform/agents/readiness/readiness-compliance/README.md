# READINESS-COMPLIANCE

Maps the mesh to NIST AI RMF + EU AI Act Article 12.

| | |
|---|---|
| **Schedule** | `0 4 * * *` — daily |
| **Entry point** | `executor.py` |
| **Inputs** | Flagships + compliance-posture repo. |
| **Emits** | NIST AI RMF + EU AI Act Article 12 compliance matrix. |
| **Pass criteria** | All RMF functions satisfied + Article 12 automatic logging verifiable. |
| **Receipt sink** | `SZLHOLDINGS/readiness-runs` → `receipts/readiness-compliance/<date>/<ts>.json` |

## What it does
Verifies Doctrine v11 numbers (749/14/163) consistency across the mesh, that Wire D DSSE signing produces verifiable envelopes, that LEGAL_BOUNDARIES.md on killinchu is accessible, and that a privacy policy + DPA template + GDPR endpoint are present.

## How it runs
- **Nightly/hourly** via `.github/workflows/readiness-compliance.yml` (cron `0 4 * * *`).
- **Manually**: `python platform/agents/readiness/readiness-compliance/executor.py`
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
