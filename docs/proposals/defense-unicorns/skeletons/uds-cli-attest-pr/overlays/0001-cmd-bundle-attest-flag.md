# Overlay 0001 — `src/cmd/bundle.go`: register `--attest` and `--offline`

**Apply mode:** Manual edit (insertion). These are insertion specs, not
git-applyable patches — line numbers in upstream `uds-cli` drift between
releases, so the cut-on-the-day helper (#5117) re-derives them via
`git format-patch` against a real upstream checkout.

**File:** `src/cmd/bundle.go`
**SPDX-License-Identifier:** Apache-2.0 OR AGPL-3.0-or-later

## Insertion 1 — bottom of the `createCmd` flag block

Find the existing block that registers flags on `createCmd` (the last
`createCmd.Flags().XxxVar(...)` call near the `init()` function). Append
the SZL block immediately after the last existing flag:

```go
// SZL Holdings — Fix A: in-bundle attestation manifest.
createCmd.Flags().BoolVar(&bundleCfg.CreateOpts.Attest, "attest", false,
    "Emit a hash-chained attestations.jsonl sidecar inside the bundle payload at /uds-bundle/attestations.jsonl. See docs/reference/attestations.mdx.")
createCmd.Flags().StringVar(&bundleCfg.CreateOpts.AttestSignerDID, "attest-signer-did", "",
    "DID published in each attestation record's signer_did field. Required when --attest is set.")
createCmd.Flags().StringVar(&bundleCfg.CreateOpts.AttestEd25519Seed, "attest-ed25519-seed", "",
    "Path to a hex-encoded Ed25519 seed used to sign attestation records.")
createCmd.Flags().StringVar(&bundleCfg.CreateOpts.AttestMLDSA65Priv, "attest-ml-dsa-65-priv", "",
    "Path to a hex-encoded ML-DSA-65 private key used to sign attestation records.")
createCmd.Flags().StringVar(&bundleCfg.CreateOpts.AttestTrustRoot, "attest-trust-root", "",
    "Path to a trust-root.json file to embed at /uds-bundle/trust-root.json for offline verify.")
```

## Insertion 2 — bottom of the `verifyCmd` flag block

Find the existing block that registers flags on `verifyCmd`. Append:

```go
// SZL Holdings — Fix A: registry-independent verification path.
verifyCmd.Flags().BoolVar(&bundleCfg.VerifyOpts.Offline, "offline", false,
    "Walk the in-bundle attestations.jsonl chain only. Does not contact any registry.")
```

## Companion struct additions

The five new `CreateOpts` fields and the one new `VerifyOpts` field
referenced above are spec'd in `overlays/0005-bundle-types.md`. Apply
that overlay before this one or the package will not compile.
