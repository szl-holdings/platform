# READINESS-SECURITY

Confirms supply-chain controls + signed releases across public repos.

| | |
|---|---|
| **Schedule** | `0 * * * *` — hourly |
| **Entry point** | `executor.py` |
| **Inputs** | List of all public szl-holdings/* repos. |
| **Emits** | Signed report with a per-repo verdict + missing-controls list. |
| **Pass criteria** | All required workflows present + recent runs green, SECURITY.md present and non-stale. |
| **Receipt sink** | `SZLHOLDINGS/readiness-runs` → `receipts/readiness-security/<date>/<ts>.json` |

## What it does
`gh api` to check SBOM, Trivy, Gitleaks workflows are present + their recent runs succeeded; verifies cosign signatures on the latest releases via cosign verify; checks SECURITY.md is present and non-stale.

## How it runs
- **Nightly/hourly** via `.github/workflows/readiness-security.yml` (cron `0 * * * *`).
- **Manually**: `python platform/agents/readiness/readiness-security/executor.py`
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
