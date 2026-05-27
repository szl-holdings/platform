# SZL UDS Bundle Registry

Single source of truth for every signed UDS payload SZL Holdings ships
for Defense-Unicorns environments. This document is mirrored by the
machine-readable feed at `GET /api/uds/registry` on the mesh api-server
(see `artifacts/api-server/src/routes/uds-registry.ts`) — both are
generated from the same canonical table below so they cannot drift.

All five bundles are pure-ESM, dependency-free, deterministic, and ship
a content-addressed `MANIFEST.json`. Release-channel images are signed
with **cosign keyless** via GitHub Actions OIDC; the dev channel is
unsigned and tracks `main`.

| Bundle | OCI repo (release) | OCI repo (dev) | Current version | Publish workflow | Source dir |
| --- | --- | --- | --- | --- | --- |
| A11oy | `ghcr.io/szl-holdings/a11oy-uds` | `:dev` | `0.2.0` | `.github/workflows/a11oy-uds-publish.yml` | `artifacts/a11oy-uds` |
| Amaru | `ghcr.io/szl-holdings/amaru-uds` | `:dev` | `0.2.0` | `.github/workflows/amaru-uds-publish.yml` | `artifacts/amaru-uds` |
| ROSIE | `ghcr.io/szl-holdings/rosie-uds` | `:dev` | `0.2.0` | `.github/workflows/rosie-uds-publish.yml` | `artifacts/rosie-uds` |
| Sentra | `ghcr.io/szl-holdings/sentra-uds` | `:dev` | `0.2.0` | `.github/workflows/sentra-uds-publish.yml` | `artifacts/sentra-uds` |
| Vessels | `ghcr.io/szl-holdings/vessels-uds` | `:dev` | `0.2.0` | `.github/workflows/vessels-uds-publish.yml` | `artifacts/vessels-uds` |

## Pull-verify-install (universal three-step)

```bash
# 1. PULL — release channel (replace <bundle> and <version>)
zarf package pull oci://ghcr.io/szl-holdings/<bundle>-uds:<version>

# 2. VERIFY signature (release channel only — keyless cosign via GitHub OIDC)
cosign verify \
  --certificate-identity-regexp 'https://github.com/szl-holdings/.+/\.github/workflows/<bundle>-uds-publish\.yml@.+' \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  ghcr.io/szl-holdings/<bundle>-uds:<version>

# 3. INSTALL onto the target node
zarf package deploy zarf-package-<bundle>-uds-*.tar.zst --confirm
# Components stage under /opt/<bundle>/
```

Air-gapped operators can fetch the same `*.tar.zst`, `*.sig`, and
`*.sha256` sidecars from the corresponding GitHub Release instead of GHCR.

## Shared SZL packages baked into every bundle (v0.2 payload)

All five bundles include the following shared kits via
`scripts/release/lib/stage-v2-packages.sh`:

- `@szl-holdings/perception-loop` — operator-loop perception envelope.
- `@szl-holdings/sequence-pipeline` — multi-stage hashed evidence pipeline.
- `@szl-holdings/sparse-attention-kit` — sparse envelope + 12 receipt classes.

(`@szl-holdings/memo-reflection-kit` is wired into the api-server route
surface and will join the bundle payload at v0.3.)

## Source repos & how to pull them

The monorepo is published to GitHub at `szl-holdings/<repo>`. To get the
source of any bundle:

```bash
# Whole monorepo
git clone https://github.com/szl-holdings/szl.git
cd szl

# Build a bundle locally (replace <bundle>)
pnpm --filter @szl/<bundle>-uds run build      # amaru | rosie | sentra | vessels
pnpm --filter @workspace/a11oy-uds run build   # a11oy only

# Sign the local build
COSIGN_KEY=.local/cosign/cosign.key COSIGN_PASSWORD="" \
  pnpm --filter @szl/<bundle>-uds run build
```

## Mesh registration

Bundle metadata is exposed read-only at
`GET /api/uds/registry` on the mesh api-server. Consumers (Defense-
Unicorns gateways, downstream mesh nodes, CI runners) read it to
discover the current `oci://` pull coordinates, signing workflow
identity (for `cosign verify --certificate-identity-regexp`), and
target install paths — without scraping this document.

The registry feed is intentionally read-only: bundles register
themselves at publish time via the per-bundle GitHub Actions workflow,
not at runtime. There is no "POST a new bundle" path on the mesh.
