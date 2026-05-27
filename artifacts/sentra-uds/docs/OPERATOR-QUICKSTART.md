# Sentra.UDS — Operator Quickstart (v0.1.0)

```bash
# 1. Download verification assets
BASE=https://github.com/szl-holdings/sentra/releases/download/uds-v0.1.0
curl -fsSLO $BASE/sentra-uds-0.1.0.tar.zst
curl -fsSLO $BASE/sentra-uds-0.1.0.tar.zst.sha256
curl -fsSLO $BASE/sentra-uds-0.1.0.tar.zst.sig
curl -fsSLO $BASE/sentra-uds-dev.pub

# 2. Verify
sha256sum -c sentra-uds-0.1.0.tar.zst.sha256
cosign verify-blob \
  --key sentra-uds-dev.pub \
  --signature sentra-uds-0.1.0.tar.zst.sig \
  sentra-uds-0.1.0.tar.zst

# 3. Inspect
zarf package inspect definition sentra-uds-0.1.0.tar.zst
zarf package inspect sbom       sentra-uds-0.1.0.tar.zst --output ./sbom-out

# 4. Run the 30-second doctrine demo
curl -fsSLO $BASE/doctrine-demo.mjs
zstd -d sentra-uds-0.1.0.tar.zst -o pkg.tar
mkdir staged && tar -xf pkg.tar -C staged
for c in staged/components/*.tar; do tar -xf "$c" -C staged; done
node doctrine-demo.mjs staged/sentra-core/files/0/lib
```

Expected: every pillar reports `PASS`, including the demonstration that
offensive action classes (`attack`, `exploit`, `ddos`, `hack_back`,
`offensive_recon`, `implant`) throw at the boundary; ending with a live
5-row verdict table where in-scope assets `ALLOW` and out-of-scope or
offensive requests `BLOCK`.

---

## v0.2.0 — shared-package addendum

`v0.2.0` adds three cross-cutting SZL shared packages under
`/opt/sentra/shared/` (component name `sentra-shared`, default-enabled
but `required: false` — operators can disable with
`--components=-sentra-shared` at `zarf package deploy` time):

| Package                              | Purpose                                                                                                              | Receipt classes                |
|--------------------------------------|----------------------------------------------------------------------------------------------------------------------|--------------------------------|
| `@szl-holdings/perception-loop`      | Operator-loop perception envelope. **Privacy invariant: raw frames never leave the loop**; only feature-vector summaries enter the receipt stream. | `perception.observation.v1` family |
| `@szl-holdings/sequence-pipeline`    | Multi-stage hashed evidence pipeline (per-stage `evidence.stage.v1` linked into a sealed `evidence.sealed.v1`).        | `evidence.*.v1`                |
| `@szl-holdings/sparse-attention-kit` | Sparse-attention envelope (NSA / MoBA / MiniMax / FlashAttention re-expressed). **Non-negotiable contradiction-probe + fail-up-to-full escalation** — the MiniMax M2 lesson. | 12 `sparse.*.v1` receipts        |

### Pull v0.2.0 (verify + install)

```bash
BASE=https://github.com/szl-holdings/sentra/releases/download/uds-v0.2.0
curl -fsSLO $BASE/sentra-uds-0.2.0.tar.zst
curl -fsSLO $BASE/sentra-uds-0.2.0.tar.zst.sha256
curl -fsSLO $BASE/sentra-uds-0.2.0.tar.zst.sig
curl -fsSLO $BASE/sentra-uds-dev.pub
sha256sum -c sentra-uds-0.2.0.tar.zst.sha256
cosign verify-blob --key sentra-uds-dev.pub \
  --signature sentra-uds-0.2.0.tar.zst.sig sentra-uds-0.2.0.tar.zst
zarf package deploy sentra-uds-0.2.0.tar.zst --confirm
```

### Disable shared (kernel-only deploy)

```bash
zarf package deploy sentra-uds-0.2.0.tar.zst --confirm --components=-sentra-shared
```
