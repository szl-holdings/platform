# Runbook — RSErasureExceeded

**Severity:** `page`  
**Alert expression:** `szl_khipu_rs_recovery_failures_total > 0`

## What does this alert mean?

Reed-Solomon RS(10,6) erasure recovery could not reconstruct a Khipu chain segment.

## What to check

- Identify the unrecoverable segment seq range.
- Check how many shards were lost (RS(10,6) tolerates up to 4 lost of 10).

## How to recover

- Restore shards from replica storage if available.
- If unrecoverable, escalate to founder — audit-chain data loss incident.

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
