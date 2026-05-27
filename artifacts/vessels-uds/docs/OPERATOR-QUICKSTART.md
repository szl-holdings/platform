# Vessels.UDS — Operator Quickstart (v0.1.0)

Four commands to verify, four more to deploy + exercise.

```bash
# 1. Download verification assets
BASE=https://github.com/szl-holdings/vessels/releases/download/uds-v0.1.0
curl -fsSLO $BASE/vessels-uds-0.1.0.tar.zst
curl -fsSLO $BASE/vessels-uds-0.1.0.tar.zst.sha256
curl -fsSLO $BASE/vessels-uds-0.1.0.tar.zst.sig    # if signed
curl -fsSLO $BASE/vessels-uds-dev.pub              # if signed

# 2. Verify
sha256sum -c vessels-uds-0.1.0.tar.zst.sha256
cosign verify-blob \
  --key vessels-uds-dev.pub \
  --signature vessels-uds-0.1.0.tar.zst.sig \
  vessels-uds-0.1.0.tar.zst

# 3. Inspect (Zarf path)
zarf package inspect definition vessels-uds-0.1.0.tar.zst
zarf package inspect sbom       vessels-uds-0.1.0.tar.zst --output ./sbom-out

# 4. Run the 30-second vessels demo
curl -fsSLO $BASE/vessels-demo.mjs
zstd -d vessels-uds-0.1.0.tar.zst -o pkg.tar
mkdir staged && tar -xf pkg.tar -C staged
for c in staged/components/*.tar; do tar -xf "$c" -C staged; done
node vessels-demo.mjs staged/vessels-core/files/0/lib
```

Expected: every primitive reports `PASS`, ending with a 5-row live verdict
table over synthetic fixtures — low-risk vessels **ADMIT**, sanctions-hit /
AIS-gap-Λ vessels **HALT (HUKLLA)**.

## Deploy (UDS / Zarf)

```bash
uds-cli bundle deploy uds-bundle-vessels-uds-amd64-0.1.0.tar.zst --confirm
# or, single-package Zarf path:
zarf package deploy vessels-uds-0.1.0.tar.zst --confirm
```

Files land under `/opt/vessels/` (see `UDS-BUNDLE.md`).

---

## v0.2.0 — shared-package addendum

`v0.2.0` adds three cross-cutting SZL shared packages under
`/opt/vessels/shared/` (component name `vessels-shared`, default-enabled
but `required: false` — operators can disable with
`--components=-vessels-shared` at `zarf package deploy` time):

| Package                              | Purpose                                                                                                              | Receipt classes                |
|--------------------------------------|----------------------------------------------------------------------------------------------------------------------|--------------------------------|
| `@szl-holdings/perception-loop`      | Operator-loop perception envelope. **Privacy invariant: raw frames never leave the loop**; only feature-vector summaries enter the receipt stream. | `perception.observation.v1` family |
| `@szl-holdings/sequence-pipeline`    | Multi-stage hashed evidence pipeline (per-stage `evidence.stage.v1` linked into a sealed `evidence.sealed.v1`).        | `evidence.*.v1`                |
| `@szl-holdings/sparse-attention-kit` | Sparse-attention envelope (NSA / MoBA / MiniMax / FlashAttention re-expressed). **Non-negotiable contradiction-probe + fail-up-to-full escalation** — the MiniMax M2 lesson. | 12 `sparse.*.v1` receipts        |

### Pull v0.2.0 (verify + install)

```bash
BASE=https://github.com/szl-holdings/vessels/releases/download/uds-v0.2.0
curl -fsSLO $BASE/vessels-uds-0.2.0.tar.zst
curl -fsSLO $BASE/vessels-uds-0.2.0.tar.zst.sha256
curl -fsSLO $BASE/vessels-uds-0.2.0.tar.zst.sig
curl -fsSLO $BASE/vessels-uds-dev.pub
sha256sum -c vessels-uds-0.2.0.tar.zst.sha256
cosign verify-blob --key vessels-uds-dev.pub \
  --signature vessels-uds-0.2.0.tar.zst.sig vessels-uds-0.2.0.tar.zst
zarf package deploy vessels-uds-0.2.0.tar.zst --confirm
```

### Disable shared (kernel-only deploy)

```bash
zarf package deploy vessels-uds-0.2.0.tar.zst --confirm --components=-vessels-shared
```
