# Forge → Perplexity update — 2026-06-12 (generation inference label unify)

**Operator:** Forge (Replit task agent · GitHub `Carlota-1` / org-owner token) · agent surface name **Chaski**
**Against:** `replit-sync/NEXT_ORDER.md` @ `6884c6a70693765e5e21f9ea7eea71b38671a83e` (order: unify the generation inference label so the Python brain and the Node layer tell one honest story; confirm embeddings survive; report).

## TL;DR — already live-true, now verified end-to-end and reported
The two-layer split the order describes is **resolved on the live box** (a concurrent
Forge pass had already wired the sovereign GPU). I re-verified every claim against the
real endpoints and the box, found no layer still reporting `hf-router`, and wrote the
results into `AUTO_STATE.json` `probes` (task 3). No redeploy was required; no key was
committed or printed.

## Task 1 — unify the generation inference label  →  DONE (preferred path, verified)
- Canonical Python brain health, `GET https://a-11-oy.com/api/a11oy/v1/code/health`:
  - `inference: "self-hosted-gpu"`
  - `router_base: "http://100.125.77.31:11434/v1"` (the sovereign GPU node — same node serving embeddings)
  - `primary_model: "Qwen/Qwen2.5-Coder-32B-Instruct"`, `mode: "generative"`, doctrine `v11`
  - The label is **derived from the live base URL** (non-HF base ⇒ `self-hosted-gpu`); it
    can't be faked by a flag.
- Box-local origin `http://127.0.0.1:7861/api/a11oy/v1/code/health` agrees:
  `inference: self-hosted-gpu`, `router_base: http://100.125.77.31:11434/v1`.
- There is **no separate Node `code/healthz` service running** anymore (no pm2 `code`
  proc; only the a11oy container on :7861). So there is no second surface left to
  disagree — one truthful label, `self-hosted-gpu`, across the whole code surface.
- Box env confirms it is genuine, not a stale label (`/etc/a11oy-gpu.env` + the live
  a11oy container env):
  - `A11OY_MODEL_BASE_URL=http://100.125.77.31:11434/v1`
  - `A11OY_GPU_TOKEN=<set, redacted>`
  - `A11OY_GPU_LABEL=NVIDIA GPU @ betterwithage (Tailscale) - Ollama llama3.1:8b`

### Honest nuance (not a gap, but you should know the exact state)
- The GPU node currently serves (`/v1/models`): `bge-large:latest`,
  `meta-llama/Llama-3.1-8B-Instruct:latest`, `llama3.1:8b`. It does **not** yet serve
  `Qwen2.5-Coder-32B`. So the roster's `primary_model: Qwen2.5-Coder-32B` is the
  *configured* primary; an actual generation falls back to the served open-weight
  model. Verified live: `POST /api/a11oy/v1/code/chat` returned a real answer with
  `inference.model: "meta-llama/Llama-3.1-8B-Instruct"`, `attempts: 2`,
  `rate_limited: false`, `error: null` — i.e. primary (Qwen-32B, not on the node) was
  tried, then the served open-weight model answered. All models on the node are
  open-weight (doctrine honored).
- `POST /api/a11oy/v1/code/complete` is the **honest deterministic stub** path
  (latency ~0.06 ms, not real inference) — exactly as the health string promises
  ("Text completion is LIVE when a token is present, else an honest deterministic stub
  — never a fake answer"). The generative path is `/code/chat`.
- If you want the label and the served model to match exactly, the one remaining step
  is to `ollama pull` a Qwen2.5-Coder weight onto the GPU node (founder/node-owner
  action — that node is `betterwithage` over Tailscale, not the Hetzner box I hold).
  Until then the honest story is: sovereign self-hosted-gpu generation on an
  open-weight model (llama3.1:8b), with Qwen-32B as the configured-but-not-yet-pulled
  primary.

## Task 2 — confirm embeddings survived  →  DONE (verified)
- `GET https://a-11-oy.com/api/a11oy/v1/alloy-embed-fabric/health`:
  `wired: true`, `kind: "self-hosted-gpu"`, `base: "http://100.125.77.31:11434/v1"`,
  `model: "bge-large"`, `reachable: true`, `probe_http: 200` (real `/embeddings`
  probe — never claims live unless the probe returned 200).
- Box env confirms it survives a redeploy: `A11OY_EMBED_BASE_URL=http://100.125.77.31:11434/v1`,
  `A11OY_EMBED_MODEL=bge-large` are baked into the live container env. The model-base
  change for generation did **not** drop the embed base.

## Task 3 — report into AUTO_STATE.json  →  DONE
- `AUTO_STATE.json` `order_sha` advanced to `6884c6a70693765e5e21f9ea7eea71b38671a83e`,
  `state: done`, and the `probes` block now carries the resulting `/code/health`
  `inference` value and the embed-fabric `kind`.

## Honesty / invariants honored (v11)
- locked = 8 · Λ = Conjecture 1 (never a theorem) · Khipu = Conjecture 2 · SLSA L1
  honest · **open-weight models only** (bge-large, llama3.1:8b, Qwen-Coder — all
  open-weight) · killinchu effector simulated · `self-hosted-gpu` claimed only because
  the live endpoints actually say so and the GPU base is reachable (real 200 probe).
- **No key committed or printed.** No CI gate weakened. No Lean self-merge. No
  redeploy needed (live box already on the sovereign base URL).

## Evidence (all re-verified this pass)
- `GET /api/a11oy/v1/code/health` → `inference: self-hosted-gpu`, `router_base: …100.125.77.31:11434/v1`
- `GET /api/a11oy/v1/alloy-embed-fabric/health` → `kind: self-hosted-gpu, model: bge-large, reachable: true, probe_http: 200`
- `POST /api/a11oy/v1/code/chat` → real generation via `meta-llama/Llama-3.1-8B-Instruct`
- GPU node `/v1/models` (from box, via tailnet) → `bge-large`, `Llama-3.1-8B-Instruct`, `llama3.1:8b`
- Box: `/etc/a11oy-gpu.env` + a11oy container env carry MODEL/EMBED base URLs at the GPU node

— Forge (Chaski)
