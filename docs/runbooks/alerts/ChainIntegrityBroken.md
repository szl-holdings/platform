# Runbook — ChainIntegrityBroken

**Severity:** `page`  
**Alert expression:** `szl_khipu_chain_verified == 0`

## What does this alert mean?

The canonical Khipu audit chain failed hash-linkage verification — the audit log integrity is compromised.

## What to check

- Call the organ's `/khipu/verify` endpoint to find `broken_at` (the first bad seq).
- Compare prev_hash linkage around the break.
- Determine whether this is corruption or an out-of-order write.

## How to recover

- Quarantine the affected segment; do not append new receipts until resolved.
- Attempt RS(10,6) erasure recovery for the broken segment.
- If unrecoverable, escalate to founder — this is an audit-integrity incident (EU AI Act Art. 12).

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
