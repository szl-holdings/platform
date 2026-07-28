# Preserved public npm readiness artifacts

These are the exact tarballs created from the reviewed source tree on
2026-07-28. They are retained as primary package-readiness evidence; they are
not evidence of npm registry publication.

## SHA-256

```text
e277c70b3d5c61724bba4a00f22242f260f9dc3c715f3abc97d829b56616a9ac  szl-mcp-governor-0.1.0.tgz
db50118722fbbc719a776d524ee377ebbedd8fc4e0d00800dc4eaac8302e5ac2  szl-verify-0.1.0.tgz
```

## Verification

```bash
sha256sum -c SHA256SUMS
tar -tzf szl-mcp-governor-0.1.0.tgz
tar -tzf szl-verify-0.1.0.tgz
```

The complete file inventories are stored in `inventory.json`.

pnpm executes `prepack` from the source manifest before creating each archive.
It then writes publish-transformed package metadata into the archive: workspace
catalog versions are resolved and preparation-only lifecycle hooks are omitted.
Each archive embeds a canonical `publication-contract.json` that binds the
exact source manifest hash, exact source `prepack` command, development
dependency names, and normalized publish manifest. `inventory.json` binds the
source manifest, packed manifest, embedded contract, tarball, and complete file
inventory so an updated source hash cannot make a stale archive appear current.
Verification also requires a non-empty source `prepack` gate and rejects any
packed manifest that unexpectedly retains that preparation-only hook.
