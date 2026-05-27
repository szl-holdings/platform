# ROSIE.UDS — Operator Quickstart

After `zarf package deploy rosie-uds-<version>.tar.zst --confirm`:

```bash
# 1. Smoke the kernel
node /opt/rosie/doctrine-demo.mjs

# 2. Re-verify the provenance manifest
sha256sum /opt/rosie/lib/index.mjs
# compare against the entry in /opt/rosie/MANIFEST.json

# 3. Wire your policy set
node -e "import('/opt/rosie/lib/index.mjs').then(({ admit, detectContradictions }) => {
  const policies = JSON.parse(require('fs').readFileSync('/etc/rosie/policies.json'));
  const c = detectContradictions(policies);
  if (c.length) { console.error('contradictions:', c); process.exit(1); }
  console.log('policies admitted:', policies.length);
});"
```

If `doctrine-demo.mjs` exits 0 and the chain prints `verifyChain = true`, the
kernel is healthy.

---

## v0.2.0 — shared-package addendum

`v0.2.0` adds three cross-cutting SZL shared packages under
`/opt/rosie/shared/` (component name `rosie-shared`, default-enabled
but `required: false` — operators can disable with
`--components=-rosie-shared` at `zarf package deploy` time):

| Package                              | Purpose                                                                                                              | Receipt classes                |
|--------------------------------------|----------------------------------------------------------------------------------------------------------------------|--------------------------------|
| `@szl-holdings/perception-loop`      | Operator-loop perception envelope. **Privacy invariant: raw frames never leave the loop**; only feature-vector summaries enter the receipt stream. | `perception.observation.v1` family |
| `@szl-holdings/sequence-pipeline`    | Multi-stage hashed evidence pipeline (per-stage `evidence.stage.v1` linked into a sealed `evidence.sealed.v1`).        | `evidence.*.v1`                |
| `@szl-holdings/sparse-attention-kit` | Sparse-attention envelope (NSA / MoBA / MiniMax / FlashAttention re-expressed). **Non-negotiable contradiction-probe + fail-up-to-full escalation** — the MiniMax M2 lesson. | 12 `sparse.*.v1` receipts        |

### Pull v0.2.0 (verify + install)

```bash
BASE=https://github.com/szl-holdings/rosie/releases/download/uds-v0.2.0
curl -fsSLO $BASE/rosie-uds-0.2.0.tar.zst
curl -fsSLO $BASE/rosie-uds-0.2.0.tar.zst.sha256
curl -fsSLO $BASE/rosie-uds-0.2.0.tar.zst.sig
curl -fsSLO $BASE/rosie-uds-dev.pub
sha256sum -c rosie-uds-0.2.0.tar.zst.sha256
cosign verify-blob --key rosie-uds-dev.pub \
  --signature rosie-uds-0.2.0.tar.zst.sig rosie-uds-0.2.0.tar.zst
zarf package deploy rosie-uds-0.2.0.tar.zst --confirm
```

### Disable shared (kernel-only deploy)

```bash
zarf package deploy rosie-uds-0.2.0.tar.zst --confirm --components=-rosie-shared
```
