# Vessels.UDS — UDS Bundle Integration (v0.1.0)

## Composing into a UDS mesh

`uds-bundle.yaml` declares `vessels-uds` as a single-package UDS bundle.
To compose it into a larger SZL mesh alongside A11oy / Sentra / Amaru,
add it as another `packages:` entry in the parent `uds-bundle.yaml`:

```yaml
kind: UDSBundle
metadata:
  name: szl-mesh
  version: 0.1.0
packages:
  - name: a11oy
    repository: ghcr.io/szl-holdings/packages/a11oy
    ref: 1.0.0-alpha
  - name: sentra
    repository: ghcr.io/szl-holdings/packages/sentra
    ref: 1.0.0-alpha
  - name: amaru
    repository: ghcr.io/szl-holdings/packages/amaru
    ref: 1.0.0-alpha
  - name: vessels
    repository: ghcr.io/szl-holdings/packages/vessels
    ref: 0.1.0
    optionalComponents:
      - vessels-docs
```

## Components shipped

| Component             | Required | Target path under deploy           |
|-----------------------|----------|------------------------------------|
| `vessels-core`        | ✅       | `/opt/vessels/lib/index.mjs`       |
| `vessels-demo`        | ✅       | `/opt/vessels/vessels-demo.mjs`    |
| `vessels-provenance`  | ✅       | `/opt/vessels/MANIFEST.json`       |
| `vessels-docs`        | ❌ (opt) | `/opt/vessels/docs/*.md`           |

## Smoke test after deploy

```bash
node /opt/vessels/vessels-demo.mjs /opt/vessels/lib
```

Expected: every primitive reports `PASS`, ending with a 5-row live verdict
table over synthetic fixtures (low-risk fixtures **ADMIT**, sanctions-hit /
dark-vessel-Λ fixtures **HALT**).

## Air-gap override

Drop the local tarball next to a parent `uds-bundle.yaml` and swap:

```yaml
- name: vessels
  path: ./vessels-uds-0.1.0.tar.zst
```

…in place of `repository:` + `ref:`. `uds-cli bundle create` will pick
up the tarball from disk; no registry round-trip required.
