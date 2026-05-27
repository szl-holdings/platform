# SZL Holdings UDS bundles — v0.2.0

**Date:** 2026-05-27
**Tag (per product repo):** `uds-v0.2.0`
**Status:** GA, signed, verified

## What shipped

Five signed Zarf payloads, each on its own product repo under
`szl-holdings/`:

| Bundle        | Repo                                                                 | Headline                                                                   |
|---------------|----------------------------------------------------------------------|----------------------------------------------------------------------------|
| `a11oy-uds`   | [`szl-holdings/a11oy`](https://github.com/szl-holdings/a11oy/releases/tag/uds-v0.2.0)     | Brand-orchestration kernel + KS-18 contextuality witness + attestation chain |
| `sentra-uds`  | [`szl-holdings/sentra`](https://github.com/szl-holdings/sentra/releases/tag/uds-v0.2.0)   | Cyber-resilience runtime with fail-closed asset-scoped Safety Gate         |
| `amaru-uds`   | [`szl-holdings/amaru`](https://github.com/szl-holdings/amaru/releases/tag/uds-v0.2.0)     | Convergent data-sync runtime, KL drift + hash-chained proof receipts       |
| `rosie-uds`   | [`szl-holdings/rosie`](https://github.com/szl-holdings/rosie/releases/tag/uds-v0.2.0)     | Governed decision fabric, mandatory witnesses on every decision            |
| `vessels-uds` | [`szl-holdings/vessels`](https://github.com/szl-holdings/vessels/releases/tag/uds-v0.2.0) | Maritime intelligence kernel, hash-chained voyage receipts                 |

Each release ships four assets — `.tar.zst`, `.tar.zst.sha256`,
`.tar.zst.sig`, and `<bundle>-dev.pub` — all under 35 KB total per
bundle.

## What's new

`v0.2.0` rolls three SZL Holdings cross-cutting shared packages into
every bundle as a new default-enabled but optional Zarf component
(`<bundle>-shared`):

### 1. `@szl-holdings/perception-loop`
Operator-loop perception envelope.

**Privacy invariant:** raw frame bytes never leave the loop. Only
feature-vector summaries enter the receipt stream. This is enforced by
a serialization test in `packages/perception-loop` — see
`.agents/memory/a11oy-perception-reviewer-wiring.md`.

### 2. `@szl-holdings/sequence-pipeline`
Multi-stage hashed evidence pipeline. Each stage emits an
`evidence.stage.v1` receipt; the seal step folds them into a single
`evidence.sealed.v1` receipt whose hash chains the entire stage list.

### 3. `@szl-holdings/sparse-attention-kit` *(new)*
Sparse-attention envelope re-expressing five external sparse-attention
families — DeepSeek NSA, Moonshot MoBA, MiniMax M1/M2, Tri Dao
FlashAttention, Songlin Yang FLA — into 12 `sparse.*.v1` receipt
classes (see `packages/sparse-attention-kit/src/receipts.ts`).

**Non-negotiable gate:** the kit enforces a contradiction probe before
every sparse forward pass and fails up to full attention if the probe
trips. This is the MiniMax M2 lesson distilled — M2 reverted to full
attention at scale because hybrid-sparse wins benchmarks but loses
multi-hop reasoning. The kit makes that escalation automatic.

## How to verify (any bundle)

```bash
PRODUCT=sentra            # one of: a11oy | sentra | amaru | rosie | vessels
BUNDLE=${PRODUCT}-uds
TAG=uds-v0.2.0; VERSION=0.2.0
BASE=https://github.com/szl-holdings/${PRODUCT}/releases/download/${TAG}

curl -fsSLO ${BASE}/${BUNDLE}-${VERSION}.tar.zst
curl -fsSLO ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sha256
curl -fsSLO ${BASE}/${BUNDLE}-${VERSION}.tar.zst.sig
curl -fsSLO ${BASE}/${BUNDLE}-dev.pub

sha256sum -c ${BUNDLE}-${VERSION}.tar.zst.sha256
cosign verify-blob --key ${BUNDLE}-dev.pub \
  --signature ${BUNDLE}-${VERSION}.tar.zst.sig \
  ${BUNDLE}-${VERSION}.tar.zst
```

## Deploy

```bash
# kernel + shared (default)
zarf package deploy ${BUNDLE}-${VERSION}.tar.zst --confirm

# kernel only
zarf package deploy ${BUNDLE}-${VERSION}.tar.zst --confirm \
  --components=-${PRODUCT}-shared
```

## Build + release reproduction

```bash
COSIGN_PASSWORD="" bash scripts/release/uds-release.sh   # build + sign + verify all 5 + lean
node /tmp/publish-uds.mjs                                # upload to per-product repos
```

The release gate runs the `lean` validation (pure-Lean-4, no mathlib —
see `.agents/memory/lean-formulas-pure-core.md`) and signs every
bundle with `.local/cosign/cosign.key`. Each artifact directory's
`scripts/build.sh` now auto-discovers `.local/bin/cosign` and the
default key/pub, so no extra env is required beyond `COSIGN_PASSWORD=""`.

## Doctrine receipts (cumulative)

After v0.2.0, the shared-package surface emits the following receipt
classes on top of each bundle's product-specific ones:

- `perception.observation.v1.*`
- `evidence.stage.v1`, `evidence.sealed.v1`
- `sparse.envelope.v1`, `sparse.probe.v1`, `sparse.escalation.v1`,
  `sparse.commit.l1.v1`, `sparse.commit.l2.v1`, `sparse.route.v1`,
  `sparse.budget.v1`, `sparse.budget.exceeded.v1`, `sparse.attention.v1`,
  `sparse.attention.full.v1`, `sparse.attention.sparse.v1`,
  `sparse.attention.hybrid.v1`
