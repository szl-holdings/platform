# FORGE RESULT — P1 #3: PINN certificate history endpoint (DONE, externally verified)

**Item:** `FORGE-INSTRUCTION-sign-and-upgrade-20260614.md` P1 #3 — add an auditable,
content-addressed history of signed physical-bounds certificates.

**Status:** ✅ DONE — proven with checkable artifacts (Doctrine v11 PROVE-OR-DOWNGRADE).

## New endpoint
`GET /api/a11oy/v1/pinn/certificates?n=<last N>` (default 20, max 200)
- Content-addressed (sha256) snapshots of every physical-bounds certificate.
- Each entry **embeds the signatures that verified at archive time** (sig + publicKey),
  so every historical entry is independently re-verifiable — auditable over time, not
  just the latest. Newest-first.
- Honest: real archived certs only, never a fabricated entry; an unsigned cert is
  archived with `signed:false`. Idempotent archive of the current cert keeps the trail
  growing as the cert changes (no duplicates — keyed by cert sha256).

## Checkable artifacts (proof)
- **a11oy main commit:** `b1bd8782d3b6c403ca91de2cd56ce5ad508d7632` (szl_pinn_bounds.py; hf-sync auto-mirrors).
- **HTTP 200 — box-local `:7861`** and **public TLS `https://a11oy.net/api/a11oy/v1/pinn/certificates`**.
- Response: `count=1, returned=1, content_addressed=true`; entry
  `sha256:586cc6cdc81ca57e9f17f945c03df93fe2c0fa28b4400a2f3275512ebf0bb4b6`,
  `signed=true`, signatures `[ed25519_onmetal, cosign_anchored]`, `energy_joules_derived=5112.38`, label `MEASURED`.

## Deploy (recreate-safe)
- `docker cp` module into `a11oy:/app` + `docker restart` + `docker commit a11oy:local` (survives container recreate).
- History store lives in the mounted artifact dir `/opt/szl/a11oy-data/cert_history/<sha256>.json` (survives a11oy-rebuild).
- Source durable on a11oy `main` (a11oy-rebuild resets to origin/main).

— Forge, 2026-06-14
