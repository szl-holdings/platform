# Cutting an Amaru.UDS release

This bundle ships as a tagged GitHub release on
[`szl-holdings/amaru`](https://github.com/szl-holdings/amaru/releases).

## One command

```bash
# 1. Bump artifacts/amaru-uds/package.json version (if cutting a new tag).

# 2. Build + sign every UDS bundle (Amaru is one of them).
COSIGN_KEY=.local/cosign/cosign.key COSIGN_PASSWORD="" \
  bash scripts/release/uds-release.sh

# 3. Publish just Amaru to the per-product repo (idempotent).
node scripts/release/publish-github-release.mjs amaru-uds
```

`DRY_RUN=1 node scripts/release/publish-github-release.mjs amaru-uds`
plans the upload without touching GitHub.

## What gets uploaded

For tag `uds-v<VERSION>` (taken from `package.json`), every file in
`dist/amaru-uds/` becomes a release asset:

- `amaru-uds-<VERSION>.tar.zst` — Zarf package
- `amaru-uds-<VERSION>.tar.zst.sha256`
- `amaru-uds-<VERSION>.tar.zst.sig`
- `amaru-uds-dev.pub`

## Verify a release

```bash
TAG=uds-v<VERSION>
BASE=https://github.com/szl-holdings/amaru/releases/download/$TAG
curl -fSLO $BASE/amaru-uds-<VERSION>.tar.zst
curl -fSLO $BASE/amaru-uds-<VERSION>.tar.zst.sha256
curl -fSLO $BASE/amaru-uds-<VERSION>.tar.zst.sig
curl -fSLO $BASE/amaru-uds-dev.pub
sha256sum -c amaru-uds-<VERSION>.tar.zst.sha256
cosign verify-blob --key amaru-uds-dev.pub \
  --signature amaru-uds-<VERSION>.tar.zst.sig \
  amaru-uds-<VERSION>.tar.zst
```

The publisher and signer mirror the A11oy.UDS flow documented in
`.agents/memory/a11oy-uds-release-flow.md`.
