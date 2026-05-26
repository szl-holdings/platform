---
name: A11oy.UDS release flow
description: End-to-end recipe for cutting a new signed A11oy UDS/Zarf release and proving it from the public URL.
---

## Build + sign

Requires `tsc` (root `node_modules/.bin`), `zarf`, `cosign`, `zstd` —
all already in this repl (`.local/bin/` for the binaries, root for tsc).

1. Bump `artifacts/a11oy-uds/package.json` version.
2. `COSIGN_KEY=.local/cosign/cosign.key COSIGN_PASSWORD="" bash artifacts/a11oy-uds/scripts/build.sh`
   - Writes `dist/a11oy-uds/a11oy-uds-<ver>.tar.zst` + `.sig`.
   - cosign hits Sigstore Rekor (network) — produces a tlog index in stdout.
3. Hand-write `<tarball>.sha256` (build.sh skips it when COSIGN is set).
4. Stage docs alongside the tarball:
   - `cp .local/cosign/cosign.pub dist/a11oy-uds/a11oy-uds-dev.pub`
   - `cp artifacts/a11oy-uds/docs/{ARCHITECTURE,SECURITY,UDS-BUNDLE}.md dist/a11oy-uds/`
   - `cp artifacts/a11oy-uds/uds-bundle.yaml dist/a11oy-uds/`
5. Pack the convenience bundle: tar.gz of `<tarball> + .sig + .sha256 + .pub`
   with deterministic flags (`--sort=name --owner=0 --group=0 --numeric-owner --mtime=…`).

**Why:** `build.sh` won't both sign AND write the sha256 sidecar; the smoke
test downloads BOTH. The deterministic-tar flags keep the bundle.tar.gz
sha256 stable across rebuilds.

## Publish

Use `listConnections('github')[0].settings.access_token`. Create release
via REST (`POST /repos/{o}/{r}/releases`), then `POST` each asset to
`upload_url.replace(/\{.*$/, '')?name=…` with correct Content-Type
(`application/zstd`, `application/gzip`, `text/markdown`, `application/x-yaml`).
Idempotent flow: DELETE existing release + tag ref first.

## Smoke-test from public URL

Run `.local/smoke-runner.sh` — downloads everything via curl from
`https://github.com/szl-holdings/a11oy/releases/download/uds-vX.Y.Z/`,
verifies sha256 + cosign + zarf inspect + SBOM + MANIFEST round-trip,
then sed-rewrites extensionless ESM imports (`from './foo'` → `from './foo.js'`)
on the unpacked dist and runs an in-process doctrine harness.

**Why smoke-test the public URL, not the local file:** the whole point is
to prove what an air-gap operator running `curl` from a clean box would
see. Smoking the local `dist/` build hides upload corruption, missing
assets, MIME-type bugs, and stale releases.

## Common gotchas
- `zarf package create` puts output at `zarf-package-a11oy-uds-multi-<ver>.tar.zst`;
  build.sh renames to `a11oy-uds-<ver>.tar.zst`.
- The shipped JS uses extensionless relative imports (TS bundler/tsx target).
  Pure-node consumers must `sed` add `.js` (the harness in smoke-runner.sh
  does this; doctrine-demo.mjs documents it inline).
- Pre-existing failed workflows in this repl (`sentra-sidecar`, `conduit`,
  `lean`) are unrelated to A11oy — don't chase them during a UDS release.
