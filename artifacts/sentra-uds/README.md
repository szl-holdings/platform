# Sentra.UDS

Signed Zarf payload for the **Sentra cyber-resilience command runtime**:
asset-scoped fail-closed Safety Gate, NIST CSF 2.0 / SP 800-61r2 /
CISA CIRCIA / MITRE D3FEND mappings, risk + exposure + drift + Ising
allocation, hash-chained Proof Chain.

Pure ESM. Zero runtime dependencies outside `node:*`. Deterministic build.

## Layout

```
artifacts/sentra-uds/
├── lib/                    # the runtime kernel (pure ESM)
├── doctrine-demo.mjs       # 30-second post-deploy harness
├── scripts/
│   ├── build.sh            # deterministic tar+zstd or `zarf package create`
│   └── verify-manifest.mjs # round-trip every sha256 in MANIFEST.json
├── docs/                   # ARCHITECTURE, SECURITY, UDS-BUNDLE
├── uds-bundle.yaml         # uds-cli entry-point
├── zarf.yaml               # Zarf package definition
└── package.json            # build + verify scripts only (no runtime deps)
```

## Pull (consumer side)

```bash
# Release channel (signed, cosign keyless)
zarf package pull oci://ghcr.io/szl-holdings/sentra-uds:0.2.0

# Latest dev (unsigned, tracks main)
zarf package pull oci://ghcr.io/szl-holdings/sentra-uds:dev
```

## Verify

```bash
# 1. Signature (release channel only — keyless cosign via GitHub Actions OIDC)
cosign verify \
  --certificate-identity-regexp 'https://github.com/szl-holdings/.+/\.github/workflows/sentra-uds-publish\.yml@.+' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/szl-holdings/sentra-uds:0.2.0

# 2. Per-file integrity (run after unpack)
node artifacts/sentra-uds/scripts/verify-manifest.mjs /path/to/unpacked
```

## Install

```bash
zarf package deploy zarf-package-sentra-uds-*.tar.zst --confirm
# Components stage under /opt/sentra/ on the target node.
```

## Build + sign (release side)

```bash
pnpm --filter @szl/sentra-uds run build
# To sign:
COSIGN_KEY=.local/cosign/cosign.key COSIGN_PASSWORD="" \
  pnpm --filter @szl/sentra-uds run build
```

Output: `dist/sentra-uds/sentra-uds-<version>.tar.zst` (+ `.sha256`,
+ `.sig` when `COSIGN_KEY` is set).

## Mesh composition

Listed in the consolidated registry at `docs/uds/REGISTRY.md` and served
live at `GET /api/uds/registry` on the mesh api-server.
