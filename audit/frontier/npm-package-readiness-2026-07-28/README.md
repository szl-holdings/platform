# Preserved public npm readiness artifacts

These are the exact tarballs created from the reviewed source tree on
2026-07-28. They are retained as primary package-readiness evidence; they are
not evidence of npm registry publication.

## SHA-256

```text
dd87f0bd083c000eb2ed15c731ddec67669e4497f2e746dd93e2bc0431d644c1  szl-mcp-governor-0.1.0.tgz
bc13cfcacecbb71105e0c806d3ad750ed962fd1ff902c1bc71971bc29243028a  szl-verify-0.1.0.tgz
```

## Verification

```bash
sha256sum -c SHA256SUMS
tar -tzf szl-mcp-governor-0.1.0.tgz
tar -tzf szl-verify-0.1.0.tgz
```

The complete file inventories are stored in `inventory.json`.
