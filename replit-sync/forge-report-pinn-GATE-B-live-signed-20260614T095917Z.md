# Forge report — PINN physical-bounds cert: both binary gates LIVE-SIGNED (real 5112 J)

**Scope:** corroboration/finding for the prove-or-downgrade PINN directive (orig NEXT_ORDER 20f1e854). **Additive only — I did not touch NEXT_ORDER.md or AUTO_STATE.json (channel has moved on to 21450a57).**

## Result (verified live on the box, a-11-oy.com)
- **GATE A** ✓ `certificate.measured.label == "MEASURED"`.
- **GATE B** ✓ `/api/a11oy/v1/pinn/certificate` → `signed: true`; `/pinn/certificate.dsse` → HTTP 200; **independent openssl verify = "Signature Verified Successfully"** over the exact served bytes.
  - served cert: **5112.38 J** (56.18 W × 91 s sustained on-metal NVML, betterwithage RTX 5050, label MEASURED)
  - served-payload sha256 == env `_cert_sha256` = `sha256:586cc6cd…` (MATCH)
  - keyid `sha256:80a0cfc7…` (on-metal `/root/ed25519.pem`, FA-001). Real key, real measurement, no fabrication, Doctrine v11.

## Root cause that was keeping it UNSIGNED (for siblings/founder)
1. **Volume override is the authority.** Container `SZL_PINN_ARTIFACT_DIR=/data/a11oy` (bind-mount host `/opt/szl/a11oy-data`) → serve layer reads the **volume** cert (real 5112 J), NOT the baked `/app` pair (80.967 J + dsse). Rebuilds don't touch the volume, so volume signatures are durable.
2. **Signer targets the wrong dir.** `sign_cert_dsse.py` hardcodes `D="/opt/szl/a11oy"` (module dir = 80.967 J), so it never signed the served volume cert. Fix applied: ran identical signer logic with `D=/opt/szl/a11oy-data` (existing key, self-verified before write).
3. **`measured_gpu_cert.dsse.json` is a khipu anchor**, not the cert dsse (`payloadType vnd.szl.khipu+json`, `_cert_sha256: null`) — does not satisfy GATE B.

## Recommended durability fix (NOT yet applied — needs a committed-file edit)
Make `sign_cert_dsse.py` honor `SZL_PINN_ARTIFACT_DIR` (default `/opt/szl/a11oy`) so future re-signs auto-target the served volume. Until then, a regenerated volume cert (new sha) needs a manual re-sign in `/opt/szl/a11oy-data`.

## Honesty notes
- Per-surface divergence is honest: HF serves its baked **80.967 J** signed pair; the box serves its real on-metal **5112 J** signed cert — each MEASURED + signed for its own bytes.
- A sibling wrote a sidecar ~5 min before me; re-signing the **identical** cert bytes with the **same** key is corroboration (both verify), not a clobber.
