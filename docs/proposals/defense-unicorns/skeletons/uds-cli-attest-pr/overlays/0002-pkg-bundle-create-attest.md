# Overlay 0002 — `src/pkg/bundle/create.go`: build attestation manifest on create

**Apply mode:** Manual edit (insertion + new method).
**Files:** `src/pkg/bundle/create.go`, `go.mod`
**SPDX-License-Identifier:** Apache-2.0 OR AGPL-3.0-or-later

## Insertion 1 — inside `Bundle.Create()`, after payload assembly, before seal

Find the existing call to `b.assembleBundlePayload(stagingDir)` (or
equivalent: the call that finalises the staging directory's layout
just before it gets sealed into `.tar.zst`). Immediately after that
call's error check, insert:

```go
// SZL Holdings — Fix A: emit hash-chained attestation sidecar
// before the payload is sealed into .tar.zst so the chain ends up
// inside the bundle bytes, verifiable offline.
if b.cfg.CreateOpts.Attest {
    if err := b.writeAttestations(stagingDir); err != nil {
        return fmt.Errorf("attestation manifest: %w", err)
    }
}
```

## Insertion 2 — new method at the bottom of `create.go`

```go
func (b *Bundle) writeAttestations(stagingDir string) error {
    opts := b.cfg.CreateOpts
    if opts.AttestSignerDID == "" || opts.AttestEd25519Seed == "" || opts.AttestMLDSA65Priv == "" {
        return fmt.Errorf("--attest requires --attest-signer-did, --attest-ed25519-seed, --attest-ml-dsa-65-priv")
    }
    signer, err := attest.NewFileSigner(opts.AttestSignerDID, opts.AttestEd25519Seed, opts.AttestMLDSA65Priv)
    if err != nil {
        return err
    }

    emitted, err := b.collectEmittedArtifacts(stagingDir)
    if err != nil {
        return err
    }

    outPath := filepath.Join(stagingDir, "uds-bundle", "attestations.jsonl")
    if err := os.MkdirAll(filepath.Dir(outPath), 0o755); err != nil {
        return err
    }
    f, err := os.Create(outPath)
    if err != nil {
        return err
    }
    defer f.Close()

    if err := attest.BuildManifest(f, signer, emitted, time.Now); err != nil {
        return err
    }

    if opts.AttestTrustRoot != "" {
        dst := filepath.Join(stagingDir, "uds-bundle", "trust-root.json")
        if err := copyFile(opts.AttestTrustRoot, dst); err != nil {
            return fmt.Errorf("copy trust-root: %w", err)
        }
    }
    return nil
}
```

## Companion: `collectEmittedArtifacts`

`b.collectEmittedArtifacts(stagingDir)` walks the staging tree and
returns one `attest.Artifact` per emitted file (image layer, chart,
file, manifest). The helper is spec'd in `overlays/0006-collect-artifacts.md`.

## `go.mod` addition

```
require (
    github.com/cloudflare/circl v1.6.1   // Apache-2.0, on UDS allowlist
)
```

No other new third-party deps. Run `go mod tidy` after the require is
added.

## Imports to add to `create.go`

```go
import (
    "os"
    "path/filepath"
    "time"

    "github.com/defenseunicorns/uds-cli/src/pkg/attest"
)
```
