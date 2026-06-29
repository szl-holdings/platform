# FORGE RESULT — a11oy MEASURED energy proof: transparency-log anchor made FULLY FUNCTIONAL

**Date:** 2026-06-14  **Author:** Forge  **Doctrine:** v11 (never fake a measurement/signature; the half-state is the only unacceptable outcome)

## Mandate
Make the a11oy MEASURED physical-bounds energy proof's transparency-log anchoring
(Sigstore/Rekor, FA-001 path) fully functional across every surface. No half-states.

## Root cause of the half-state (found + fixed)
- The live site **a-11-oy.com** is served by the dockerized `a11oy` container, which reads
  artifacts from `SZL_PINN_ARTIFACT_DIR=/data/a11oy` — a bind mount of host
  `/opt/szl/a11oy-data`. Updates to `/opt/szl/a11oy` or to GitHub do **not** move the live
  site. The live dir held a real MEASURED-but-UNSIGNED orphan cert (`586cc6cd`,
  56.18 W x 91 s = 5112.38 J, 1 Hz) with no DSSE, while GitHub/HF/box carried an older,
  smaller signed cert (`d95dda0e`, 80.97 J). That mismatch was the half-state.

## What I did ("sign what you serve")
1. Promoted the **live** measured cert `586cc6cd` into `/opt/szl/a11oy`, signed it on-metal
   with `sign_cert_dsse.py` (FA-001 Ed25519 key `/root/ed25519.pem`,
   keyid `sha256:80a0cfc7...`); self-verified the DSSE. Backups in `/root/forge-cert-backups/`.
2. Anchored the DSSE in the **public** Sigstore Rekor log (`rekor.sigstore.dev`, REST `dsse`
   entry type): HTTP 201, payloadHash = `586cc6cd` (match).
   - UUID: `108e9186e8c5677ab543e542d7d01cff30eeb77e7b93463a7ebc92f41b0bd66abdaa8b85354e49df`
   - logIndex: `1814643067`  logID: `c0d23d6ad406973f9559f3ba2d1ca01f84147d8ffc5b8445c224f98b9591801d`
   - integratedTime: `1781430915`  retrieval: HTTP 200 (verified).
3. Injected an honest `_transparency_log` block (entry_uuid, log_index, log_id,
   integrated_time, full inclusion_proof, signed_entry_timestamp, retrieval_url) as a
   **sibling** field in the DSSE sidecar (does not affect signature verification), plus an
   honest `_transparency_note` stating this is an own-key Ed25519 Rekor anchor — NOT
   Sigstore keyless/Fulcio identity binding.
4. Propagated the anchored cert + DSSE to all surfaces: `/opt/szl/a11oy-data` (live),
   `/opt/szl/a11oy` (source), GitHub `szl-holdings/a11oy` main, and HF Space
   `SZLHOLDINGS/a11oy` (factory reboot).

## Verification (all green)
| Surface | signed | label | joules | anchored | uuid match |
|---|---|---|---|---|---|
| a-11-oy.com (live) | True | MEASURED | 5112.38 | True | yes |
| HF Space SZLHOLDINGS/a11oy | True | MEASURED | 5112.38 | True | yes |
| GitHub szl-holdings/a11oy main | n/a (raw) | MEASURED | 5112.38 | True | yes |
| Rekor public log | — | — | — | retrievable (HTTP 200) | yes |

## Durability finding (operational note)
- A plain `docker restart a11oy` **preserves** the anchor (verified).
- **Changing the cert file** in `/opt/szl/a11oy-data` triggers an anchor-stripping re-sign of
  the data-dir DSSE (~60s later, same key, fresh unanchored DSSE). So: DSSE-only edits
  persist, but **every new measurement (cert change) must be re-anchored** following the same
  promote -> sign -> rekor -> inject -> propagate sequence. Auto-re-anchoring on a new
  measurement is the natural next hardening step (separate from this mandate).

No measurement and no signature was fabricated. The energy number is the real on-metal
nvidia-smi measurement; the DSSE is a real FA-001 Ed25519 signature; the Rekor anchor is a
real public-log entry. Half-state resolved.

— Forge
