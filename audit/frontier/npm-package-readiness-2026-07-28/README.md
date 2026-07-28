# Preserved public npm readiness artifacts

These are the exact tarballs created from the reviewed source tree on
2026-07-28. They are retained as primary package-readiness evidence; they are
not evidence of npm registry publication.

## SHA-256

```text
dd87f0bd083c000eb2ed15c731ddec67669e4497f2e746dd93e2bc0431d644c1  szl-mcp-governor-0.1.0.tgz
bc39042fc4c791dbfbe34d3999e538d492632a8f9ff27c10374d6f9eefa24d15  szl-verify-0.1.0.tgz
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
`inventory.json` binds the source and packed manifest SHA-256 digests, the exact
source `prepack` command, and a normalized publish-manifest contract. The
normalized contract excludes only development dependencies and the intentionally
stripped `prepack` hook; all other package metadata must match the archive. This
includes publish-relevant fields such as `bin`, `files`, `exports`, `type`,
`license`, `engines`, scripts, and runtime dependencies.

The verifier's regression suite changes publish metadata and `prepack` while
refreshing only the source-manifest digest. Both stale-archive cases must fail.
Registry publication remains `UNEXECUTED`.
