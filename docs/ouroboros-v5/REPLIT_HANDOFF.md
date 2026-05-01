# Replit Handoff — Ouroboros Unified v0.3

This document is the single source of truth for what to do on Replit. Read top-to-bottom; everything else is reference.

## Step 1 — Import

Drop the `ouroboros-unified-payload` folder into a new Replit. Or upload the zip and unzip in place.

## Step 2 — One-shot verify

The `.replit` file is configured. Just hit Run.

```bash
npm install && npm test
```

Expected: **233/233 tests passing** across 8 workspaces (`@workspace/horizon` 62, `@workspace/resonance` 52, `@workspace/anchor` 18, `@workspace/adapters` 8, `@workspace/verifier` 9, `@workspace/reconciliation` 45, `@workspace/integrations` 21, `@workspace/invariant` 18).

## Step 3 — Demos

Each demo runs in isolation. `npm run demo:full` is the all-five orchestrator.

```bash
npm run demo:full       # end-to-end — all four axes + invariant
npm run demo:horizon:full          # black-hole primitives
npm run demo:resonance:full        # Tesla primitives
npm run demo:reconciliation:full   # Egyptian primitives (frustum, seked, fractions, doubling)
npm run demo:integrations:full     # A11oy / Amaru / Sentra adapters
npm run demo:invariant:full        # the Lutar Invariant Λ
```

## v3.1 axis map

This payload carries the v3.1 four-axis architecture:

- **Cleanliness** (anchor + adapters) — cryptographic verification of every released leaf
- **Horizon** (`@workspace/horizon`) — Page-curve bounded reversibility
- **Resonance** (`@workspace/resonance`) — handoff Q-factor, normalized by Landauer ceiling
- **Reconciliation** (`@workspace/reconciliation`) — three-witness Jaccard volume from Egyptian frustum dissection

Compounded by the **Lutar Invariant Λ** (`@workspace/invariant`) — the unique closed-form scalar law over the four axes (see `docs/LUTAR_INVARIANT.md` for proof and bound theorem).

## Step 4 — Verifier and bench

```bash
npm run verify   # property-based verifier (fast-check)
npm run bench    # throughput numbers
```

Bench targets on a single laptop core:
- Reflection coefficient: > 15M ops/s
- Q-factor: > 15M ops/s
- Kuramoto step on 1k oscillators: < 7ms/step
- Merkle root over 100k leaves: < 500ms

## Step 5 — Full deploy stack

If the Replit instance supports Docker (use a "Docker" template or external host):

```bash
npm run deploy:up      # docker compose up -d
# Grafana → :3000 (admin / ouroboros)
# Prometheus → :9090
# OTel collector → :4317 / :4318
npm run deploy:logs
npm run deploy:down
```

The Grafana dashboard `Ouroboros — Ten Primitives` is auto-provisioned.

## Step 6 — Wire to a real LLM

```ts
import { OpenAIAdapter } from "@workspace/adapters";

const transport = async ({ model, prompt }) => {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }] }),
  });
  const json = await r.json();
  return { completion: json.choices[0].message.content, latencyMs: 0 };
};

const adapter = new OpenAIAdapter(transport, { capacityBits: 8192 });
const result = await adapter.complete({ model: "gpt-4o-mini", prompt: "hi" });
```

For Perplexity, swap the URL to `https://api.perplexity.ai/chat/completions` and use `PerplexityAdapter`.

## Step 7 — Anchor witnesses

```ts
import { WitnessAnchor } from "@workspace/anchor";

const anchor = new WitnessAnchor({ driver: "LOCAL" });          // dev
// const anchor = new WitnessAnchor({ driver: "REKOR" });        // prod public
// const anchor = new WitnessAnchor({ driver: "INTERNAL_HSM", hsmKeyId: "k1" }); // air-gapped

const entry = await anchor.anchor("chain-id-1", witnessHashes);
console.log(entry.rootHash, entry.receipt);
```

## What's NOT in the box (yet)

- Real Sigstore Rekor HTTP client. The REKOR driver returns a placeholder receipt; v0.3 will add the real client.
- Production OTel exporter wired through the runtime. The bridge exists in `@workspace/horizon`; the runtime-wide auto-instrumentation hook is v0.3.
- Formal proofs in Lean/Coq. v3.1 thesis roadmap.
- LICENSE file. See [docs/LICENSE_STRATEGY.md](docs/LICENSE_STRATEGY.md) — pick one before public posting.

## Troubleshooting

- `npm install` fails on lockfile: delete `package-lock.json` and re-run.
- Workspace symbol not found: run `npm install` at root, not inside a package.
- Docker compose not available on Replit: deploy externally (Fly, Railway, Render); the runtime itself runs fine without the dashboard.

---

Built to ship. 144/144. Go.
