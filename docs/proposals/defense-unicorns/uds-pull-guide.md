# UDS Pull Guide — SZL Holdings Bundles

Audience: a Defense-Unicorns / UDS platform operator pulling one of the SZL
bundles into an air-gapped or restricted Kubernetes cluster.

This guide is deliberately three commands per bundle: **download → verify →
deploy**. Each bundle is shipped as a deterministic `tar.zst` payload with a
`sha256` sidecar (always present) and a `cosign` `.sig` sidecar (present when
the release was signed — every `szl-v*` GitHub Release built with cosign keys
configured produces one).

The release notes for a tag list the exact filenames; the commands below are
parameterized by `BUNDLE` (`a11oy-uds`, `sentra-uds`, `amaru-uds`,
`rosie-uds`) and `VERSION` (e.g. `0.1.1`).

---

## 0. One-time setup

Tools required on the operator host:

| Tool      | Why                                | Minimum |
|-----------|------------------------------------|---------|
| `zarf`    | Deploy the bundle into a cluster   | v0.35+  |
| `cosign`  | Verify signatures (recommended)    | v2.2+   |
| `sha256sum` | Verify checksum (POSIX coreutils) | any     |

Download the SZL cosign public key from the release page (`cosign.pub`) and
save it locally as `szl-cosign.pub`. The same key is used across all SZL
bundles within a release line.

---

## 1. `a11oy-uds` — Brand Orchestration Layer

```bash
# 1. download
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/a11oy-uds-${VERSION}.tar.zst
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/a11oy-uds-${VERSION}.tar.zst.sha256
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/a11oy-uds-${VERSION}.tar.zst.sig

# 2. verify (sha256 always, cosign if .sig present)
sha256sum -c a11oy-uds-${VERSION}.tar.zst.sha256 \
  && cosign verify-blob --key szl-cosign.pub \
       --signature a11oy-uds-${VERSION}.tar.zst.sig \
       a11oy-uds-${VERSION}.tar.zst

# 3. deploy
zarf package deploy a11oy-uds-${VERSION}.tar.zst --confirm
```

**Expected verify output:**

```
a11oy-uds-${VERSION}.tar.zst: OK
Verified OK
```

The bundle ships a hash-chained `ATTESTATIONS.json` under
`/opt/a11oy/ATTESTATIONS.json` inside the deployed component — auditors can
re-run the chain check against `MANIFEST.json` to prove no in-flight
tampering.

---

## 2. `sentra-uds` — Cyber Resilience Command

```bash
# 1. download
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/sentra-uds-${VERSION}.tar.zst
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/sentra-uds-${VERSION}.tar.zst.sha256
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/sentra-uds-${VERSION}.tar.zst.sig

# 2. verify
sha256sum -c sentra-uds-${VERSION}.tar.zst.sha256 \
  && cosign verify-blob --key szl-cosign.pub \
       --signature sentra-uds-${VERSION}.tar.zst.sig \
       sentra-uds-${VERSION}.tar.zst

# 3. deploy
zarf package deploy sentra-uds-${VERSION}.tar.zst --confirm
```

The Sentra Safety Gate is asset-scoped fail-closed — any
NIST CSF 2.0 / D3FEND policy a deployer hasn't acknowledged stays in
`DENY` until explicitly admitted. See
`artifacts/sentra-uds/docs/OPERATOR-QUICKSTART.md` for the admission flow.

---

## 3. `amaru-uds` — Convergent Data-Sync Runtime

```bash
# 1. download
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/amaru-uds-${VERSION}.tar.zst
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/amaru-uds-${VERSION}.tar.zst.sha256
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/amaru-uds-${VERSION}.tar.zst.sig

# 2. verify
sha256sum -c amaru-uds-${VERSION}.tar.zst.sha256 \
  && cosign verify-blob --key szl-cosign.pub \
       --signature amaru-uds-${VERSION}.tar.zst.sig \
       amaru-uds-${VERSION}.tar.zst

# 3. deploy
zarf package deploy amaru-uds-${VERSION}.tar.zst --confirm
```

Amaru emits hash-chained proof receipts on every convergent step (Lutar Σ
family, Λ floor, Bekenstein admission). Tail the deployment logs to confirm
the first receipt chain reports `chain_ok: true`.

---

---

## 4. `rosie-uds` — Governed Decision Fabric

```bash
# 1. download
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/rosie-uds-${VERSION}.tar.zst
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/rosie-uds-${VERSION}.tar.zst.sha256
curl -fSL -O https://github.com/szl-holdings/szl-holdings-platform/releases/download/${TAG}/rosie-uds-${VERSION}.tar.zst.sig

# 2. verify
sha256sum -c rosie-uds-${VERSION}.tar.zst.sha256 \
  && cosign verify-blob --key szl-cosign.pub \
       --signature rosie-uds-${VERSION}.tar.zst.sig \
       rosie-uds-${VERSION}.tar.zst

# 3. deploy
zarf package deploy rosie-uds-${VERSION}.tar.zst --confirm
```

ROSIE is deny-by-default: any `{subject, action}` event without a matching
admitted policy is rejected with reason `ROSIE_NO_POLICY_MATCH`. The
contradiction detector refuses to load any policy set containing both an
`allow` and a `deny` for the same pair. Every decision carries a witness
(`policy_id` + `reason` + `matched`) and is hash-chained into the receipt
log. See `artifacts/rosie-uds/docs/OPERATOR-QUICKSTART.md`.

---

## Falling back to sha256-only

If a release was built without a cosign key (the workflow surfaces this as a
warning rather than failing), the `.sig` sidecar is absent. In that case
skip step 2's `cosign verify-blob` and rely on `sha256sum -c`. Operators who
require cryptographic provenance for that release should request a re-tag
from SZL once the key is configured.

## Reproducing what we shipped

The exact pipeline that built the release is `scripts/release/uds-release.sh`
in this repo, wired to `pnpm test:uds-release`. Any operator can re-run that
locally and byte-compare the produced tarballs against the release assets;
the build is deterministic (sorted, owner=0, fixed mtime).

## Adding a new bundle

Register it in `scripts/release/uds-version-sync.json` (and as a `REQUIRED_BUNDLES`
entry in `scripts/release/uds-release.sh`) and the next `szl-v*` tag picks
it up automatically — release notes + pull-guide reference get rebuilt
from the manifest.
