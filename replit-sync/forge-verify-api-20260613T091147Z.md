# Forge report — Public offline-receipt VERIFY API (LIVE)

**Surface:** a-11-oy.com -> `/api/a11oy/v1/verify`
**Lane:** standalone microservice (additive; serve.py untouched/locked)

## What shipped
A public, honest, offline-first verification API for a11oy receipts, DSSE
envelopes (incl. Sigstore-keyless), and in-toto attestations. Anyone can
verify our claims themselves without trusting us. FastAPI on the box
(`127.0.0.1:8083`, systemd `szl-verify-api`), nginx reverse-proxied, CORS `*`.

## Endpoints (LIVE, proven 200 from the public internet)
- `GET  /api/a11oy/v1/verify` — landing: checks + a worked sample verdict
- `GET  /api/a11oy/v1/verify?url=<raw receipt url>` — fetch + verify a public receipt
- `POST /api/a11oy/v1/verify` — verify a receipt/DSSE/in-toto JSON body
- `GET  /api/a11oy/v1/verify/healthz`

## Real checks (no bandaids)
- DSSE PAE + signature math via `cryptography` (Ed25519 / ECDSA-P256 / RSA)
- Sigstore certificate SAN + OIDC-issuer identity binding
- Rekor transparency-log inclusion lookup (degrades to `unreachable`, never faked)
- in-toto predicateType + subject digest well-formedness
- Lean-citation existence in public lutar-lean@main

Full Fulcio-chain-to-root is honestly DELEGATED to `cosign` /
`scripts/verify_dsse_real.py` (the heavy `sigstore` lib is not importable on the
box's Python 3.14) — the API says so rather than pretending.

## Honesty (doctrine v11)
- Unsigned input -> `STRUCTURAL-ONLY` (never "verified")
- Any failed check -> `FAILED` (loud)
- Online source unreachable -> degrade, never green

## Proof
Public a-11-oy.com: `/verify/healthz` 200; landing+sample, a POSTed real in-toto
receipt, and `?url=` of the real `governance-receipts/...HomflyReceipt.json` all
returned `STRUCTURAL-ONLY` (correct — those receipts carry subject digests but
no DSSE signature). CORS preflight -> `access-control-allow-origin: *`.
Box crypto self-test (`selftest_crypto.py`, exit 0): genuine Ed25519-signed
DSSE -> `VERIFIED`; one-byte-tampered payload -> `FAILED`; unsigned ->
`STRUCTURAL-ONLY`.

## Source
`apps/verify-api/{verify_engine.py, server.py, selftest_crypto.py}` (byte-matches box).

## Doctrine guardrails honored
Additive only; no serve.py edit; no key committed; no PR merged; locked-8 +
Lambda=Conjecture 1 unchanged; joules/sovereign untouched.

## Still founder-gated (NOT done — honest)
GPU thermal/joule wiring (`joules_sample`->1, `reverse_recovery_available`->0)
needs a real exporter on Stephen's Windows RTX host; I only have Tailscale
Ollama. No bandaid added.

— Forge
