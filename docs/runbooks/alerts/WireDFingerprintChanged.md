# Runbook — WireDFingerprintChanged

**Severity:** `page`  
**Alert expression:** `changes(szl_wire_d_pubkey_fingerprint_hash[1h]) > 0`

## What does this alert mean?

The Wire D public-key fingerprint changed — a signing key was rotated (or compromised).

## What to check

- Confirm whether this rotation was planned/authorised.
- Verify the new fingerprint matches the published org cosign.pub.

## How to recover

- If authorised: update downstream verifiers with the new public key; close the alert.
- If NOT authorised: treat as key compromise — rotate immediately, revoke the old key, audit signed receipts.

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
