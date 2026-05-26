# Sentra.UDS — UDS bundle integration

The shipped tarball is a `zarf package` produced via `zarf package create`.
Deploy standalone:

```bash
zarf package deploy sentra-uds-0.1.0.tar.zst
```

or wrapped inside a `UDSBundle`:

```yaml
kind: UDSBundle
metadata:
  name: sentra-uds-bundle
  version: 0.1.0
packages:
  - name: sentra-uds
    repository: ghcr.io/szl-holdings/sentra-uds
    ref: 0.1.0
    optionalComponents:
      - sentra-docs
```

For air-gap, replace `repository` + `ref` with `path: ./sentra-uds-0.1.0.tar.zst`.

## What lands where

| Component | Target |
|---|---|
| `sentra-core` | `/opt/sentra/lib/` |
| `sentra-demo` | `/opt/sentra/doctrine-demo.mjs` |
| `sentra-provenance` | `/opt/sentra/MANIFEST.json` |
| `sentra-docs` | `/opt/sentra/docs/` |

The defensive kernel is pure ESM and dependency-free — `node
/opt/sentra/lib/index.mjs` importable; `node
/opt/sentra/doctrine-demo.mjs /opt/sentra/lib` for live exercise.
