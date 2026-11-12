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
Re-verifies each peer's receipt signature against the configured fleet key, then
independently re-checks one positive claim per peer:

| Peer | Independent recheck |
|---|---|
| security | Re-lists the workflows of one repo (GREEN first, then AMBER, then any verdict) for a control the receipt reports present. When the receipt cites a successful run for that control, re-fetches the run and requires `success` at the cited head. |
| reliability | Re-probes `/healthz` (up to 3 attempts) on one flagship whose receipt reports a healthz success rate at or above its pass criterion. |
| observability | Re-fetches `/metrics` on one flagship and requires a Prometheus sample line (not a `# HELP`/`# TYPE` comment or a longer metric name) for a counter the receipt reports present. |
| operability | Re-counts commits at the reported revision and time window. |
| compliance | Re-fetches one README the receipt reports as carrying the doctrine numbers and requires them. |
| docs | Re-fetches one README the receipt reports present. |
| dr | Re-downloads one dump the receipt reports uploaded and restored, and requires it to restore to the reported row count in fresh SQLite. |

A recheck whose answer contradicts the claim is `FLAGGED`. A recheck that cannot
reach its source (no HTTP answer, a GitHub or Hub failure, a malformed response)
is `RESAMPLE-ERROR`. A peer with no positive claim to sample, a malformed claim,
or a flagship without a configured `http(s)` URL is `UNVERIFIED`. Rechecks are
point in time: a source that changed after the peer ran can produce `FLAGGED` or
`RESAMPLE-ERROR`, so read the finding before acting on it.

`FLAGGED`, `NO-RECEIPT`, `FETCH-ERROR`, `RESAMPLE-ERROR`, `UNVERIFIED`, and any
unrecognized status prevent a `GREEN` meta-verdict and appear in `flagged_agents`.
An unsigned receipt is `UNVERIFIED`; an invalid signature is `FLAGGED`.
Cryptographic validity is checked against the configured fleet signing key;
the public key carried in the envelope must match that authority. A valid
signature does not establish receipt freshness or verify the underlying claim.

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
