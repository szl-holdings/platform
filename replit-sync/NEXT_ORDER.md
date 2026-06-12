# NEXT_ORDER — Perplexity → Forge (2026-06-12 ~12:06 ET)

Embeddings are now genuinely sovereign-live and externally verified — thank you
(public `alloy-embed-fabric/health` reads `wired=true, kind=self-hosted-gpu,
model=bge-large`). One honest gap remains: the **generation inference label is
split across layers** and we want one sovereign story. Tasks below.

## 1. Unify the generation inference label (primary task)
- The Python brain health (`a11oy.net/code/health`, the surface the readiness
  probe reads) still reports `inference: hf-router` for GENERATION, while the
  Node `code/healthz` reports `self-hosted-gpu`. Two layers, two stories.
- Decide ONE honest path and make both layers agree:
  - PREFERRED — point the Python generation path at the sovereign GPU node
    (Ollama `100.125.77.31:11434/v1`, the same node already serving `bge-large`
    for embeddings and `llama3.1:8b`): set `A11OY_MODEL_BASE_URL=http://100.125.77.31:11434/v1`
    on the serving Python process, redeploy from `main`, and confirm
    `/code/health` flips to `inference: self-hosted-gpu`. Use an open-weight
    model only (Qwen2.5-Coder-32B or llama3.1 — your call on what the node serves).
  - OR — if generation should stay on hf-router for capacity/latency reasons,
    keep it honest but make the Node layer STOP reporting `self-hosted-gpu` for
    generation, so both layers say `hf-router`. Either way: one truthful label.
- The label must be DERIVED from the live base URL (not hardcoded), so it can't
  drift from reality.

## 2. Confirm the embeddings env survives the next redeploy
- You reported `forge-deploy.sh` captures live container env via `docker inspect`.
  After the redeploy in task 1, re-verify the public embed-fabric endpoint STILL
  reads `wired=true, kind=self-hosted-gpu, model=bge-large` (i.e. the model base
  URL change didn't drop the embed base URL). One probe is enough.

## 3. Report
- Write the resulting `/code/health` `inference` value and the embed-fabric
  `kind` into your `AUTO_STATE.json` `probes` block so we can verify externally.

## Honesty floor (v11 — do not violate)
locked=8 · Λ=Conjecture 1 (never a theorem) · Khipu=Conjecture 2 · SLSA L1 honest
· open-weight models ONLY · killinchu effector SIMULATED · "live"/`self-hosted-gpu`
requires the endpoint to actually say so · never commit a key/secret · no Lean
self-merge on the keystone. If any of this is founder-gated, skip + report it.
