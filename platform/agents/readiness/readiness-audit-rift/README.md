# READINESS-AUDIT-RIFT

The verifier of verifiers — independently re-checks the other 7.

| | |
|---|---|
| **Schedule** | `10 6 * * *` - daily (after the other 7) |
| **Entry point** | `executor.py` |
| **Inputs** | Outputs (signed receipts) of all 7 prior agents. |
| **Emits** | Meta-audit signed receipt with a list of flagged agents. |
| **Pass criteria** | Every peer has a verified signature and a completed independent claim recheck (`VERIFIED`). |
| **Receipt sink** | `SZLHOLDINGS/readiness-runs` → `receipts/readiness-audit-rift/<date>/<ts>.json` |

## What it does
Re-verifies receipt signatures and independently samples security workflow presence,
operability commit counts, and docs README presence. Security samples a reported
control by name, rather than treating the workflow directory alone as proof.

Reliability, observability, compliance, and DR currently have structural-only
checks. They remain `UNVERIFIED` until independent claim rechecks are implemented;
receipt structure alone does not establish the underlying claim. The current
implementation therefore cannot produce a fleet-wide `GREEN` verdict.

`FLAGGED`, `NO-RECEIPT`, `FETCH-ERROR`, `RESAMPLE-ERROR`, `UNVERIFIED`, and any
unrecognized status prevent a `GREEN` meta-verdict and appear in `flagged_agents`.
An unsigned receipt is `UNVERIFIED`; an invalid signature is `FLAGGED`.
Cryptographic validity is checked against the public key carried in the envelope.
It does not establish an externally pinned signer identity or receipt freshness.

## How it runs
- **Daily** via `.github/workflows/readiness-audit-rift.yml` (cron `10 6 * * *`).
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

## Offline verification

Run `python -B -m unittest discover -s platform/agents/readiness/_lib -p "test_*.py"`
from the repository root. State-transition regressions run with the standard
library before dependencies are installed. With PyNaCl available, additional
tests use fresh synthetic Ed25519 keys to verify valid signatures and reject
tampered payloads, invalid signatures, and malformed base64. All network and
publication operations in the tests are mocked.

A successful executor exit means that its audit receipt was emitted and the
publication contract passed. Inspect `meta_verdict` and each finding separately;
workflow success does not establish that every peer is verified.

---
Doctrine v11 (LOCKED) · 749/14/163 · Author: Yachay <yachay@szlholdings.dev>
