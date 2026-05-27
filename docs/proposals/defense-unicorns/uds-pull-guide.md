# UDS Pull Guide — SZL Holdings Bundles

Audience: a Defense-Unicorns / UDS platform operator pulling one of the SZL
bundles into an air-gapped or restricted Kubernetes cluster.

This guide is deliberately three commands per bundle: **download → verify →
deploy**. Each bundle is shipped as a deterministic `tar.zst` payload with a
`sha256` sidecar (always present) and a `cosign` `.sig` sidecar (always
present on signed releases). The dev cosign public key ships on every
release as `<bundle>-dev.pub`.

**Each bundle lives on its own product repo under the `szl-holdings`
organization** — there is no combined "platform" release any more. The
repos and current tags are:

| Bundle | Repo | Latest tag |
|---|---|---|
| A11oy.UDS | [`szl-holdings/a11oy`](https://github.com/szl-holdings/a11oy/releases) | `uds-v0.1.1` |
| Sentra.UDS | [`szl-holdings/sentra`](https://github.com/szl-holdings/sentra/releases) | `uds-v0.2.0` |
| Amaru.UDS | [`szl-holdings/amaru`](https://github.com/szl-holdings/amaru/releases) | `uds-v0.1.0` |
| ROSIE.UDS | [`szl-holdings/rosie`](https://github.com/szl-holdings/rosie/releases) | `uds-v0.1.0` |
| Vessels.UDS | [`szl-holdings/vessels`](https://github.com/szl-holdings/vessels/releases) | `uds-v0.1.0` |

The commands below are parameterized by `PRODUCT` (e.g. `a11oy`, `sentra`),
`BUNDLE=${PRODUCT}-uds`, `TAG` (e.g. `uds-v0.1.0`), and `VERSION` (e.g.
`0.1.0`). The release notes for each tag list the exact filenames.

---

## 0. One-time setup

Tools required on the operator host:

| Tool      | Why                                | Minimum |
|-----------|------------------------------------|---------|
| `zarf`    | Deploy the bundle into a cluster   | v0.51+  |
| `cosign`  | Verify signatures (recommended)    | v2.2+   |
| `sha256sum` | Verify checksum (POSIX coreutils) | any     |

Each bundle ships its own `<bundle>-dev.pub` cosign public key as a release
asset. Download the key once per bundle you intend to verify — they are
repo-scoped so each product can be trusted independently.

---

## 1. `a11oy-uds` — Brand Orchestration Layer

```bash
PRODUCT=a11oy; BUNDLE=a11oy-uds; TAG=uds-v0.1.1; VERSION=0.1.1
BASE=https://github.com/szl-holdings/${PRODUCT}/releases/download/${TAG}

# 1. download
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sha256
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sig
curl -fSL -O ${BASE}/${BUNDLE}-dev.pub

# 2. verify (sha256 always, cosign if .sig present)
sha256sum -c ${BUNDLE}-${VERSION}.tar.zst.sha256 \
  && cosign verify-blob --key ${BUNDLE}-dev.pub \
       --signature ${BUNDLE}-${VERSION}.tar.zst.sig \
       ${BUNDLE}-${VERSION}.tar.zst

# 3. deploy
zarf package deploy ${BUNDLE}-${VERSION}.tar.zst --confirm
```

**Expected verify output:**

```
a11oy-uds-0.1.1.tar.zst: OK
Verified OK
```

The bundle ships a hash-chained `ATTESTATIONS.json` under
`/opt/a11oy/ATTESTATIONS.json` inside the deployed component — auditors can
re-run the chain check against `MANIFEST.json` to prove no in-flight
tampering.

---

## 2. `sentra-uds` — Cyber Resilience Command

```bash
PRODUCT=sentra; BUNDLE=sentra-uds; TAG=uds-v0.2.0; VERSION=0.2.0
BASE=https://github.com/szl-holdings/${PRODUCT}/releases/download/${TAG}

# 1. download
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sha256
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sig
curl -fSL -O ${BASE}/${BUNDLE}-dev.pub

# 2. verify
sha256sum -c ${BUNDLE}-${VERSION}.tar.zst.sha256 \
  && cosign verify-blob --key ${BUNDLE}-dev.pub \
       --signature ${BUNDLE}-${VERSION}.tar.zst.sig \
       ${BUNDLE}-${VERSION}.tar.zst

# 3. deploy
zarf package deploy ${BUNDLE}-${VERSION}.tar.zst --confirm
```

The Sentra Safety Gate is asset-scoped fail-closed — any
NIST CSF 2.0 / D3FEND policy a deployer hasn't acknowledged stays in
`DENY` until explicitly admitted. See
`artifacts/sentra-uds/docs/OPERATOR-QUICKSTART.md` for the admission flow.

---

## 3. `amaru-uds` — Convergent Data-Sync Runtime

```bash
PRODUCT=amaru; BUNDLE=amaru-uds; TAG=uds-v0.1.0; VERSION=0.1.0
BASE=https://github.com/szl-holdings/${PRODUCT}/releases/download/${TAG}

# 1. download
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sha256
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sig
curl -fSL -O ${BASE}/${BUNDLE}-dev.pub

# 2. verify
sha256sum -c ${BUNDLE}-${VERSION}.tar.zst.sha256 \
  && cosign verify-blob --key ${BUNDLE}-dev.pub \
       --signature ${BUNDLE}-${VERSION}.tar.zst.sig \
       ${BUNDLE}-${VERSION}.tar.zst

# 3. deploy
zarf package deploy ${BUNDLE}-${VERSION}.tar.zst --confirm
```

Amaru emits hash-chained proof receipts on every convergent step (Lutar Σ
family, Λ floor, Bekenstein admission). Tail the deployment logs to confirm
the first receipt chain reports `chain_ok: true`.

---

## 4. `rosie-uds` — Governed Decision Fabric

```bash
PRODUCT=rosie; BUNDLE=rosie-uds; TAG=uds-v0.1.0; VERSION=0.1.0
BASE=https://github.com/szl-holdings/${PRODUCT}/releases/download/${TAG}

# 1. download
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sha256
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sig
curl -fSL -O ${BASE}/${BUNDLE}-dev.pub

# 2. verify
sha256sum -c ${BUNDLE}-${VERSION}.tar.zst.sha256 \
  && cosign verify-blob --key ${BUNDLE}-dev.pub \
       --signature ${BUNDLE}-${VERSION}.tar.zst.sig \
       ${BUNDLE}-${VERSION}.tar.zst

# 3. deploy
zarf package deploy ${BUNDLE}-${VERSION}.tar.zst --confirm
```

ROSIE is deny-by-default: any `{subject, action}` event without a matching
admitted policy is rejected with reason `ROSIE_NO_POLICY_MATCH`. The
contradiction detector refuses to load any policy set containing both an
`allow` and a `deny` for the same pair. Every decision carries a witness
(`policy_id` + `reason` + `matched`) and is hash-chained into the receipt
log. See `artifacts/rosie-uds/docs/OPERATOR-QUICKSTART.md`.

---

## 5. `vessels-uds` — Maritime Intelligence Kernel

```bash
PRODUCT=vessels; BUNDLE=vessels-uds; TAG=uds-v0.1.0; VERSION=0.1.0
BASE=https://github.com/szl-holdings/${PRODUCT}/releases/download/${TAG}

# 1. download
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sha256
curl -fSL -O ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sig
curl -fSL -O ${BASE}/${BUNDLE}-dev.pub

# 2. verify
sha256sum -c ${BUNDLE}-${VERSION}.tar.zst.sha256 \
  && cosign verify-blob --key ${BUNDLE}-dev.pub \
       --signature ${BUNDLE}-${VERSION}.tar.zst.sig \
       ${BUNDLE}-${VERSION}.tar.zst

# 3. deploy
zarf package deploy ${BUNDLE}-${VERSION}.tar.zst --confirm
```

Vessels.UDS ships the pure-ESM maritime kernel: haversine distance + bearing,
CPA + collision cone, AIS-gap detector with Λ floor (Doctrine V6),
sanctions screen, and hash-chained voyage Λ-receipts. The included
`vessels-demo.mjs` exercises every formula end-to-end against synthetic
voyage data.

---

## Falling back to sha256-only

If a release was built without a cosign key, the `.sig` sidecar is absent.
In that case skip step 2's `cosign verify-blob` and rely on `sha256sum -c`.
Operators who require cryptographic provenance for that release should
request a re-tag from SZL once the key is configured. All current
production releases listed in the table above ship signatures.

## Reproducing what we shipped

The exact pipeline that built each release is `artifacts/<product>-uds/scripts/build.sh`
in the [`szl-holdings/platform`](https://github.com/szl-holdings/platform)
monorepo. Run it locally with `zarf` and `cosign` on `PATH` and a
`COSIGN_KEY=` environment variable set, and byte-compare the produced
tarball's sha256 against the release asset's `.sha256` sidecar. The build
is deterministic (sorted entries, `owner=0`, fixed mtime).

## Adding a new bundle

Register it in `scripts/release/uds-version-sync.json` (set
`release_repo: szl-holdings/<product>` for the bundle), then run
`bash artifacts/<product>-uds/scripts/build.sh` and upload the produced
assets to a new GitHub Release on that product repo with tag
`uds-v<version>`.
