# Overlay 0003 — `src/pkg/bundle/verify.go`: `verify --offline` walks in-bundle chain

**Apply mode:** Manual edit (insertion + new method).
**File:** `src/pkg/bundle/verify.go`
**SPDX-License-Identifier:** Apache-2.0 OR AGPL-3.0-or-later

## Insertion 1 — top of `Bundle.Verify()`

```go
func (b *Bundle) Verify() error {
    if b.cfg.VerifyOpts.Offline {
        return b.verifyOffline()
    }
    // ... existing registry-touching path unchanged ...
}
```

## Insertion 2 — new method at the bottom of `verify.go`

```go
func (b *Bundle) verifyOffline() error {
    tmp, err := os.MkdirTemp("", "uds-verify-offline-*")
    if err != nil {
        return err
    }
    defer os.RemoveAll(tmp)

    if err := b.extractPaths(tmp, []string{
        "uds-bundle/attestations.jsonl",
        "uds-bundle/trust-root.json",
    }); err != nil {
        return fmt.Errorf("extract attestation sidecar: %w", err)
    }

    trust, err := attest.LoadTrustRoot(filepath.Join(tmp, "uds-bundle/trust-root.json"))
    if err != nil {
        return fmt.Errorf("load trust root: %w", err)
    }

    f, err := os.Open(filepath.Join(tmp, "uds-bundle/attestations.jsonl"))
    if err != nil {
        return err
    }
    defer f.Close()

    return attest.VerifyOffline(f, trust, b.cfg.VerifyOpts.ExpectedArtifacts)
}
```

## Companion: `extractPaths` and `ExpectedArtifacts`

- `b.extractPaths(dst, paths)` is a thin wrapper around the bundle's
  existing `.tar.zst` reader that extracts only the named entries.
  Spec'd in `overlays/0006-collect-artifacts.md`.
- `VerifyOpts.ExpectedArtifacts` is `map[string]string` (ref → sha256)
  populated either from a `--expect` flag or from the bundle's own
  `uds-bundle.yaml`. Spec'd in `overlays/0005-bundle-types.md`.

## Imports to add to `verify.go`

```go
import (
    "os"
    "path/filepath"

    "github.com/defenseunicorns/uds-cli/src/pkg/attest"
)
```

## Why the CLI exit-code mapping lives in `cmd/`, not here

`verifyOffline` deliberately returns the raw `*attest.VerifyError` so
the caller can map `Code` → process exit code at the CLI boundary.
That mapping is in `overlays/0004-cmd-bundle-verify-exit-codes.md`.
