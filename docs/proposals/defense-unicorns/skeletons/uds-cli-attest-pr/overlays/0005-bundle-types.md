# Overlay 0005 — `src/types/bundle.go`: option-struct fields

**Apply mode:** Manual edit (field additions to existing structs).
**File:** `src/types/bundle.go` (or whichever upstream file currently
defines `BundleCreateOptions` / `BundleVerifyOptions` — its path has
moved across uds-cli releases).
**SPDX-License-Identifier:** Apache-2.0 OR AGPL-3.0-or-later

## Why

Overlays 0001–0004 reference five new `CreateOpts` fields and two new
`VerifyOpts` fields. They must be added to the option structs before
the rest of the overlays will compile. Apply this overlay first.

## Append to `BundleCreateOptions` (or equivalent struct)

```go
// SZL Holdings — Fix A: in-bundle attestation manifest fields.
Attest             bool   `json:"attest,omitempty"`
AttestSignerDID    string `json:"attestSignerDID,omitempty"`
AttestEd25519Seed  string `json:"attestEd25519Seed,omitempty"`
AttestMLDSA65Priv  string `json:"attestMLDSA65Priv,omitempty"`
AttestTrustRoot    string `json:"attestTrustRoot,omitempty"`
```

## Append to `BundleVerifyOptions` (or equivalent struct)

```go
// SZL Holdings — Fix A: registry-independent verify mode.
Offline           bool              `json:"offline,omitempty"`
// ExpectedArtifacts maps artifact ref → expected sha256. When set,
// verifyOffline asserts every key appears in the chain with a
// matching hash. Populated from the bundle's own uds-bundle.yaml if
// --expect is not supplied.
ExpectedArtifacts map[string]string `json:"expectedArtifacts,omitempty"`
```

## Note for the cut-on-the-day helper

The `gh pr create` step's diff for this file is small enough (≤ 10
lines) that the helper script (#5117) can append it directly with
`go run ./tools/append-fields` rather than maintaining a fragile
patch with hardcoded line numbers.
