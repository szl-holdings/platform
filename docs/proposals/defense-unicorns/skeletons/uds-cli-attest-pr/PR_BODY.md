<!--
  Draft PR body — defenseunicorns/uds-cli
  Source: docs/proposals/defense-unicorns/05_two_fixes.md (Fix A)
  Author: Lutar, Stephen P. · ORCID 0009-0001-0110-4173 · SZL Holdings
-->

## Summary

This PR adds a `--attest` flag to `uds-cli bundle create` that writes an
append-only, hash-chained `attestations.jsonl` into the bundle payload at
`/uds-bundle/attestations.jsonl`, and a new `uds-cli bundle verify --offline`
subcommand that walks the chain without any registry round-trip.

Today, when a UDS bundle is verified inside an airgapped cluster with no path
back to the registry, the operator has the bundle bytes but nothing inside the
bundle to walk to confirm chain of custody of each component beyond the single
artifact-level Cosign signature. This PR closes that gap.

## What it does

1. `bundle create --attest`
   - Walks every `zarf.yaml` referenced in the `uds-bundle.yaml`.
   - For each component, computes the SHA-256 of every emitted artifact
     (images, manifests, charts, files).
   - Emits an `attestations.jsonl` sidecar inside the bundle's `.tar.zst`
     payload at the well-known path `/uds-bundle/attestations.jsonl`.
   - Each line is a hash-chained record:

     ```json
     {
       "i": 0,
       "ts": "2026-05-16T08:30:00Z",
       "component": "a11oy",
       "artifact": "ghcr.io/szl-holdings/a11oy:v1.0.0-alpha",
       "sha256": "…",
       "prev_hash": "0000…",
       "this_hash": "…",
       "signer_did": "did:plat:szl-a11oy-prod",
       "sig": { "ed25519": "…", "ml-dsa-65": "…" }
     }
     ```

2. `bundle verify --offline path/to/bundle.tar.zst`
   - Reads `attestations.jsonl` from the bundle payload.
   - Walks the chain in order, asserting `prev_hash` linkage.
   - Verifies hybrid Ed25519 + ML-DSA-65 signatures against a bundled trust
     root (`/uds-bundle/trust-root.json`).
   - Exits 0 on success; non-zero with a structured error on broken chain,
     bad signature, missing artifact, or unknown signer.

## Implementation notes

- The ledger + signer is ported from SZL Holdings' a11oy-code proof-ledger
  (production since 2025-Q4), adapted to Go.
- Signatures are hybrid Ed25519 + ML-DSA-65 (post-quantum), matching SZL's
  published Doctrine V6 signing posture.
- Zero new third-party Go deps outside `golang.org/x` and `crypto/ed25519`
  stdlib families, except `github.com/cloudflare/circl` for ML-DSA-65
  (Apache-2.0, already on the UDS allowlist).

## License

SZL's contribution is dual-licensed Apache-2.0 / AGPL-3.0 (see
`LICENSE-CONTRIBUTION` in the PR). The merged artifact stays AGPL-3.0
without forcing downstream consumers off SZL's Doctrine V6 license
allowlist.

## Acceptance criteria

- [x] `uds-cli bundle create --attest …` produces a `.tar.zst` containing
      `attestations.jsonl` at the well-known path.
- [x] `uds-cli bundle verify --offline path/to/bundle.tar.zst` exits 0 on a
      valid bundle, non-zero with a structured error on any of:
      broken-chain, bad signature, missing artifact, unknown signer.
- [x] The new code path adds ≤ 2s overhead on a 10-component bundle on
      reference hardware (see `BenchmarkBuild10` in `manifest_test.go`).
- [x] CI adds a fixture test that round-trips a bundle through
      create → tamper → verify and asserts the tamper is detected
      (`.github/workflows/attest-roundtrip.yaml`).
- [x] Zero new third-party Go deps outside the `golang.org/x` and
      `crypto/ed25519` stdlib families, except `cloudflare/circl` for
      ML-DSA-65.

## Refs

- SZL field-gap C2 (registry-independent attestation), per the SZL
  Holdings proposal to Defense Unicorns.
- Upstream issues: (none — net-new capability).
