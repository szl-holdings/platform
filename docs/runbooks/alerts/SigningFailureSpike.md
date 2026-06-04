# Runbook — SigningFailureSpike

**Severity:** `page`  
**Alert expression:** `rate(szl_signing_failures_total[5m]) > 0.01`

## What does this alert mean?

Wire D DSSE signing is failing faster than 1 in 100s — receipts may be unsigned.

## What to check

- Confirm the cosign signing key is present and unexpired on the affected organ.
- Check for a key-rotation event correlated with the spike (see WireDFingerprintChanged).
- Inspect logs for `endpoint=/sign level=ERROR` (szl-logging).

## How to recover

- Restore/rotate the signing key material; redeploy the organ.
- If a partial outage, drain traffic from the affected organ until signing recovers.
- Backfill any unsigned receipts once signing is healthy.

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
