# Vessels.UDS

Signed Zarf payload for the **Vessels maritime-intelligence runtime**:
closest-point-of-approach (Bowditch), collision-cone, AIS-gap dark-vessel
detector (Doctrine V6 Λ-floor 0.90), sanctions screen (OFAC / EU / UK / UN
list shapes), and a hash-chained voyage Λ-receipt chain.

Pure ESM. Zero runtime dependencies outside `node:*`. Deterministic build.

## Layout

```
artifacts/vessels-uds/
├── lib/index.mjs           # the runtime kernel
├── vessels-demo.mjs        # 30-second post-deploy harness
├── scripts/
│   ├── build.sh            # deterministic tar+zstd or `zarf package create`
│   └── verify-manifest.mjs # round-trip every sha256 in MANIFEST.json
├── docs/                   # ARCHITECTURE, SECURITY, UDS-BUNDLE, OPERATOR-QUICKSTART
├── uds-bundle.yaml         # uds-cli entry-point
├── zarf.yaml               # Zarf package definition
└── package.json            # build + verify scripts only (no runtime deps)
```

## Build + verify

```bash
pnpm --filter @szl/vessels-uds run build
pnpm --filter @szl/vessels-uds run verify
node artifacts/vessels-uds/vessels-demo.mjs artifacts/vessels-uds/lib
```

Output tarball: `dist/vessels-uds/vessels-uds-<version>.tar.zst` (+ `.sha256`,
+ `.sig` when `COSIGN_KEY` is set).

## Sign

```bash
COSIGN_KEY=.local/cosign/cosign.key COSIGN_PASSWORD="" \
  pnpm --filter @szl/vessels-uds run build
```

## Compose into a mesh

See `docs/UDS-BUNDLE.md` for the `szl-mesh` composition. The companion
operator pull guide for the Defense-Unicorns release gate lives at
`docs/proposals/defense-unicorns/vessels-pull-guide.md`.
