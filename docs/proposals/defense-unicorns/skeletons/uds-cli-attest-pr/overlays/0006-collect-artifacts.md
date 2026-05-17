# Overlay 0006 — `src/pkg/bundle/`: `collectEmittedArtifacts` + `extractPaths`

**Apply mode:** New file (`src/pkg/bundle/attest_helpers.go`).
**SPDX-License-Identifier:** Apache-2.0 OR AGPL-3.0-or-later

These two helpers are used by overlays 0002 and 0003. They are tiny
wrappers around the bundle's existing staging-dir walker and `.tar.zst`
reader; isolating them in their own file keeps the diff in
`create.go` / `verify.go` small enough to read at a glance.

## New file — `src/pkg/bundle/attest_helpers.go`

```go
// Copyright 2026 SZL Holdings
// SPDX-License-Identifier: Apache-2.0 OR AGPL-3.0-or-later
package bundle

import (
    "fmt"
    "io"
    "io/fs"
    "os"
    "path/filepath"

    "github.com/defenseunicorns/uds-cli/src/pkg/attest"
)

// collectEmittedArtifacts walks the staging directory and returns one
// attest.Artifact per emitted file (image layer, chart, file, manifest).
// The component name is derived from the staging-dir layout
// (stagingDir/components/<name>/...).
func (b *Bundle) collectEmittedArtifacts(stagingDir string) ([]attest.Artifact, error) {
    componentsRoot := filepath.Join(stagingDir, "components")
    var out []attest.Artifact

    err := filepath.WalkDir(componentsRoot, func(path string, d fs.DirEntry, err error) error {
        if err != nil {
            return err
        }
        if d.IsDir() {
            return nil
        }
        rel, err := filepath.Rel(componentsRoot, path)
        if err != nil {
            return err
        }
        // First path segment is the component name.
        parts := filepath.SplitList(rel)
        if len(parts) == 0 {
            return nil
        }
        component := filepath.Dir(rel)
        if i := filepath.VolumeName(rel); i == "" {
            // Take just the leading dir.
            for component != "." && filepath.Dir(component) != "." {
                component = filepath.Dir(component)
            }
        }

        sha, err := attest.SHA256File(path)
        if err != nil {
            return err
        }
        out = append(out, attest.Artifact{
            Component: component,
            Ref:       rel,
            SHA256:    sha,
        })
        return nil
    })
    if err != nil {
        return nil, fmt.Errorf("walk components dir: %w", err)
    }
    return out, nil
}

// extractPaths writes the named entries from the bundle's .tar.zst
// payload into dst. It deliberately does not extract the whole bundle.
func (b *Bundle) extractPaths(dst string, paths []string) error {
    want := make(map[string]struct{}, len(paths))
    for _, p := range paths {
        want[p] = struct{}{}
    }
    r, err := b.openPayloadReader() // existing upstream helper
    if err != nil {
        return err
    }
    defer r.Close()

    return walkTarZst(r, func(name string, body io.Reader) error {
        if _, ok := want[name]; !ok {
            return nil
        }
        outPath := filepath.Join(dst, name)
        if err := os.MkdirAll(filepath.Dir(outPath), 0o755); err != nil {
            return err
        }
        f, err := os.Create(outPath)
        if err != nil {
            return err
        }
        defer f.Close()
        _, err = io.Copy(f, body)
        return err
    })
}
```

## Companion upstream symbols

- `b.openPayloadReader()` — already exists upstream as the helper that
  opens the bundle's `.tar.zst` for streaming reads. If the helper has
  been renamed in a future uds-cli release, swap the call accordingly.
- `walkTarZst(r, fn)` — already exists upstream as the tar-iteration
  helper used by `bundle inspect`. Same swap rule applies.

The cut-on-the-day helper (#5117) verifies both symbol names exist on
the target upstream commit before applying this overlay; if either has
been renamed, the helper aborts with a clear error rather than emitting
a broken patch.
