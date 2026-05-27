# Amaru.UDS — Operator Quickstart (v0.1.0)

Four commands to verify, four more to deploy + exercise.

```bash
# 1. Download verification assets
BASE=https://github.com/szl-holdings/amaru/releases/download/uds-v0.1.0
curl -fsSLO $BASE/amaru-uds-0.1.0.tar.zst
curl -fsSLO $BASE/amaru-uds-0.1.0.tar.zst.sha256
curl -fsSLO $BASE/amaru-uds-0.1.0.tar.zst.sig
curl -fsSLO $BASE/amaru-uds-dev.pub

# 2. Verify
sha256sum -c amaru-uds-0.1.0.tar.zst.sha256
cosign verify-blob \
  --key amaru-uds-dev.pub \
  --signature amaru-uds-0.1.0.tar.zst.sig \
  amaru-uds-0.1.0.tar.zst

# 3. Inspect
zarf package inspect definition amaru-uds-0.1.0.tar.zst
zarf package inspect sbom       amaru-uds-0.1.0.tar.zst --output ./sbom-out

# 4. Run the 30-second doctrine demo
curl -fsSLO $BASE/doctrine-demo.mjs
zstd -d amaru-uds-0.1.0.tar.zst -o pkg.tar
mkdir staged && tar -xf pkg.tar -C staged
for c in staged/components/*.tar; do tar -xf "$c" -C staged; done
node doctrine-demo.mjs staged/amaru-core/files/0/lib
```

Expected: every pillar reports `PASS`, ending with a 5-row live verdict
table over synthetic source-priority reconciliations (low-risk merges
**ADMIT**, high-risk operations **HALT (HUKLLA)**).

---

## v0.2.0 — shared-package addendum

`v0.2.0` adds three cross-cutting SZL shared packages under
`/opt/amaru/shared/` (component name `amaru-shared`, default-enabled
but `required: false` — operators can disable with
`--components=-amaru-shared` at `zarf package deploy` time):

| Package                              | Purpose                                                                                                              | Receipt classes                |
|--------------------------------------|----------------------------------------------------------------------------------------------------------------------|--------------------------------|
| `@szl-holdings/perception-loop`      | Operator-loop perception envelope. **Privacy invariant: raw frames never leave the loop**; only feature-vector summaries enter the receipt stream. | `perception.observation.v1` family |
| `@szl-holdings/sequence-pipeline`    | Multi-stage hashed evidence pipeline (per-stage `evidence.stage.v1` linked into a sealed `evidence.sealed.v1`).        | `evidence.*.v1`                |
| `@szl-holdings/sparse-attention-kit` | Sparse-attention envelope (NSA / MoBA / MiniMax / FlashAttention re-expressed). **Non-negotiable contradiction-probe + fail-up-to-full escalation** — the MiniMax M2 lesson. | 12 `sparse.*.v1` receipts        |

### Pull v0.2.0 (verify + install)

```bash
BASE=https://github.com/szl-holdings/amaru/releases/download/uds-v0.2.0
curl -fsSLO $BASE/amaru-uds-0.2.0.tar.zst
curl -fsSLO $BASE/amaru-uds-0.2.0.tar.zst.sha256
curl -fsSLO $BASE/amaru-uds-0.2.0.tar.zst.sig
curl -fsSLO $BASE/amaru-uds-dev.pub
sha256sum -c amaru-uds-0.2.0.tar.zst.sha256
cosign verify-blob --key amaru-uds-dev.pub \
  --signature amaru-uds-0.2.0.tar.zst.sig amaru-uds-0.2.0.tar.zst
zarf package deploy amaru-uds-0.2.0.tar.zst --confirm
```

### Disable shared (kernel-only deploy)

```bash
zarf package deploy amaru-uds-0.2.0.tar.zst --confirm --components=-amaru-shared
```
