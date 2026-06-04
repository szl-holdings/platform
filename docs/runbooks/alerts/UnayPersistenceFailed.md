# Runbook — UnayPersistenceFailed

**Severity:** `page`  
**Alert expression:** `szl_unay_lmdb_durable == 0 for 10m`

## What does this alert mean?

Unay LMDB durable writes are failing — memory writes may be lost on restart.

## What to check

- Check disk space / volume mount on the affected Space.
- Inspect logs for LMDB errors (`endpoint=/persist`).

## How to recover

- Free disk or remount the LMDB volume.
- Restart the organ; verify durable flag returns to 1.

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
