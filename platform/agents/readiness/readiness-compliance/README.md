# READINESS-COMPLIANCE

Records technical observations for a compliance-readiness review. It does not
assess NIST AI RMF or EU AI Act compliance.

| | |
|---|---|
| **Schedule** | `10 4 * * *` - daily |
| **Entry point** | `executor.py` |
| **Inputs** | Flagships + compliance-posture repo. |
| **Emits** | Technical observations and an explicitly `NOT_ASSESSED` framework matrix. |
| **Evidence limits** | Envelope structure and document presence establish neither signer trust nor durable logging, traceability or framework compliance. |
| **Receipt sink** | `SZLHOLDINGS/readiness-runs` → `receipts/readiness-compliance/<date>/<ts>.json` |

## What it does
Checks Doctrine v11 numbers (749/14/163), records the structure returned by
`/khipu/sign`, and observes accessibility of the legal-boundaries, privacy and
DPA documents. It does not verify signatures or probe a GDPR endpoint.

## How it runs
- **Daily** via `.github/workflows/readiness-compliance.yml` (cron `10 4 * * *`).
- **Manually**: `python platform/agents/readiness/readiness-compliance/executor.py`
  (set the relevant `*_URL`, `OTEL_COLLECTOR_URL`, `HF_TOKEN`, and
  `KHIPU_SIGNING_KEY_B64` env vars first).

## Output contract
Every run emits a single Khipu receipt (DSSE envelope) to stdout and, when
`HF_TOKEN` is set, uploads it to the runs dataset. The receipt carries a
`payload` with the per-target verdicts and the Doctrine v11 stamp
(`749/14/163`).

## Evidence contract
Missing URLs are `UNAVAILABLE`; failed reads are `FETCH_ERROR`. Returned
envelopes expose `envelope_structure_present`, but signature verification is
`NOT_MEASURED` and `verifiable` is unset. Nonempty samples are required before
the aggregate technical observations can be true.

The legacy framework booleans remain false with
`compliance_assessment.state = NOT_ASSESSED`. This means the assessment has not
been performed, rather than a finding of legal noncompliance. Document presence
and even a valid signature would not by themselves prove automatic logging or
an authenticated trace chain. Those observations remain `NOT_MEASURED`.

## Offline tests
`python -m unittest discover -s platform/agents/readiness/_lib -p 'test_*.py'`
runs synthetic evidence regressions without live signing or publication. The
existing Tests workflow runs this suite on Python 3.11 and 3.12 for PRs.

---
Doctrine v11 (LOCKED) · 749/14/163 · Author: Yachay <yachay@szlholdings.dev>
