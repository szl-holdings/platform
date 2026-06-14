# FORGE-RESULT — a11oy PINN physical-bounds certificate: SIGNED (GATE B GREEN)

**Date:** 2026-06-14
**By:** Forge (task agent, on box 167.233.50.75)
**Supersedes:** `forge-report-2026-06-14-sign-correction.md` (which said BLOCKED — that
verdict was WRONG; it rested on a flawed in-container verify test, not on the actual
signatures. The cert was in fact signable and verifiable. This report corrects the record.)

## Outcome: GATE B is GREEN. The certificate is SIGNED and the signatures verify externally.

Doctrine v11 held throughout: no fabricated key, no fabricated signature, MEASURED energy
only. Where a signature is absent or bad the endpoint reports `verified:false` — never a
fake green.

## What is now live (proven against `https://a11oy.net`, all HTTP 200)

`GET /api/a11oy/v1/pinn/verify` →
```
verified: true,  signed: true,
certificate_sha256: sha256:586cc6cd…   (binds the EXACT served cert bytes)
signatures:
  ed25519_onmetal : verified=true  alg=ed25519           keyid sha256:80a0cfc7…
                    custody: FA-001 on-metal Ed25519 (box secret store)
  cosign_anchored : verified=true  alg=ecdsa-p256-sha256 keyid szlholdings-cosign
                    anchor: PUBLISHED szl-holdings cosign.pub (external trust anchor)
```
`GET /api/a11oy/v1/pinn/certificate` → status
`VERIFIED (physical bounds) · SIGNED (DSSE Ed25519 FA-001 on-metal + cosign.pub anchored)`,
`signed:true`, `cosign.verified_at_serve_time:true`, energy **5112.38 J MEASURED**.
`GET /api/a11oy/v1/pinn/certificate.dsse` → 200.

## The two signatures (both re-verified cryptographically at request time, sha256-bound)

1. **Ed25519 FA-001 on-metal** — embedded pubkey DER fp `1838d80d…` == `/root/ed25519.pem`.
   Self-anchored on-metal attestation. (This was already green; carried forward.)
2. **cosign.pub-anchored ECDSA-P256-SHA256** — the founder-approved "option 1" cosign key
   path. Signed with the REAL szlholdings cosign private key (mate of the PUBLISHED
   `github.com/szl-holdings/.github/blob/main/cosign.pub`), proven by REAL cosign v2.4.1
   `verify-blob --key cosign.pub --signature …cosign.sig --insecure-ignore-tlog=true` =
   **"Verified OK"**. This gives an EXTERNAL, publicly-checkable trust anchor (not just a
   self-anchored on-metal key). Anyone can re-run the same cosign command against the
   published `cosign.pub` and the served cert bytes.

The runtime module is **verify-only** — no private key is ever in the container. The
signatures are pre-generated; the container only re-verifies them at serve time.

## Energy honesty (unchanged, Doctrine v11)
MEASURED = real `nvidia-smi power.draw` × wall time on the RTX 5050 Laptop tailnet node
under sustained load (~56 W mean / 91 s / 341 K → ≈5112 J, ~5.1e8× above the Landauer
floor, bounded=True). Never TDP, never idle, never fabricated. Λ = Conjecture 1 (advisory):
the cert states physical FACTS (bounds), makes NO free-energy claim, gate is deny-by-default.

## Code (additive, on main)
`szl_pinn_bounds.py`: added `_COSIGN_SIDECAR`, `_verified_cosign_signature()`, `_h_verify()`,
registered `{base}/verify`; the SIGNED branch of `_h_certificate` now surfaces the cosign
block. Pushed to `szl-holdings/a11oy` main (commit 58dc502e, folded into a later sibling
HEAD; working tree confirms `_h_verify` present).

## Durability / one honest caveat
The change is durable at the source (on main → any future successful image build bakes it).
Live now via `docker cp` + `docker restart`, and the running container was `docker commit`ed
to `a11oy:local` so a container RECREATE is also safe. The ONE caveat: a full clean
`a11oy-rebuild` docker build currently OOM-dies near step ~111/120 on the llama-cpp compile
(box has ~1.5 GB free under concurrent sibling load) — this is a box-capacity limit, NOT a
code defect, and it does not affect the live/verified state above. The next rebuild that
runs with enough free memory will bake the module from main cleanly.
