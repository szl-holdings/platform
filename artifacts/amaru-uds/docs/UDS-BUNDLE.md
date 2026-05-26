# Amaru.UDS — UDS bundle integration

The shipped tarball is a `zarf package` produced via `zarf package create`.
It can be deployed standalone:

```bash
zarf package deploy amaru-uds-0.1.0.tar.zst
```

or wrapped inside a `UDSBundle` for declarative multi-package rollouts. A
reference bundle ships at `uds-bundle.yaml` next to the tarball:

```yaml
kind: UDSBundle
metadata:
  name: amaru-uds-bundle
  version: 0.1.0
packages:
  - name: amaru-uds
    repository: ghcr.io/szl-holdings/amaru-uds
    ref: 0.1.0
    optionalComponents:
      - amaru-docs
```

For air-gap, replace `repository` + `ref` with `path: ./amaru-uds-0.1.0.tar.zst`
pointing at the local artifact.

## What lands where (paths inside the cluster filesystem)

| Component | Target |
|---|---|
| `amaru-core` | `/opt/amaru/lib/` |
| `amaru-demo` | `/opt/amaru/doctrine-demo.mjs` |
| `amaru-provenance` | `/opt/amaru/MANIFEST.json` |
| `amaru-docs` | `/opt/amaru/docs/` |

The doctrine kernel is pure ESM and dependency-free — it can be consumed
under raw Node 20 by `node /opt/amaru/lib/index.mjs` (importable) or
exercised live by `node /opt/amaru/doctrine-demo.mjs /opt/amaru/lib`.
