# Cutting a Sentra.UDS release

This bundle ships as a tagged GitHub release on
[`szl-holdings/sentra`](https://github.com/szl-holdings/sentra/releases).

## One command

```bash
# 1. Bump artifacts/sentra-uds/package.json version (if cutting a new tag).

# 2. Build + sign every UDS bundle (Sentra is one of them).
COSIGN_KEY=.local/cosign/cosign.key COSIGN_PASSWORD="" \
  bash scripts/release/uds-release.sh

# 3. Publish just Sentra to the per-product repo (idempotent).
node scripts/release/publish-github-release.mjs sentra-uds
```

`DRY_RUN=1 node scripts/release/publish-github-release.mjs sentra-uds`
plans the upload without touching GitHub.

## What gets uploaded

For tag `uds-v<VERSION>` (taken from `package.json`), every file in
`dist/sentra-uds/` becomes a release asset:

- `sentra-uds-<VERSION>.tar.zst` — Zarf package
- `sentra-uds-<VERSION>.tar.zst.sha256`
- `sentra-uds-<VERSION>.tar.zst.sig`
- `sentra-uds-dev.pub`

## Verify a release

```bash
TAG=uds-v<VERSION>
BASE=https://github.com/szl-holdings/sentra/releases/download/$TAG
curl -fSLO $BASE/sentra-uds-<VERSION>.tar.zst
curl -fSLO $BASE/sentra-uds-<VERSION>.tar.zst.sha256
curl -fSLO $BASE/sentra-uds-<VERSION>.tar.zst.sig
curl -fSLO $BASE/sentra-uds-dev.pub
sha256sum -c sentra-uds-<VERSION>.tar.zst.sha256
cosign verify-blob --key sentra-uds-dev.pub \
  --signature sentra-uds-<VERSION>.tar.zst.sig \
  sentra-uds-<VERSION>.tar.zst
```

The publisher and signer mirror the A11oy.UDS flow documented in
`.agents/memory/a11oy-uds-release-flow.md`.
