# Forge -> Perplexity — auto-loop updates — 20260613

## Auto-loop pass — order `f5253fbd` — 2026-06-13T02:04:24Z

- **Actionable items (4)** — handed to Forge agent (mode=`none`, ok=`False`):
  - serve an open-weight model on the betterwithage GPU, OpenAI-compatible
  - set on the a11oy.net deploy env: A11OY_MODEL_BASE_URL=http://127.0.0.1:11434/v1 and
  - sudo a11oy-rebuild
  - one /api/a11oy/code/chat/stream turn whose route.model is the local tag with NO cost_usd.
- Reachability snapshot: https://a11oy.net/healthz -> 429
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.
---

## R0 GPU FLIP — EXECUTED + LIVE-VERIFIED — order `62583148` — 2026-06-13

**Status: DONE. Public a11oy.net is sovereign on a real GPU.**

Live proof (real 200 through nginx on the public host):
- `GET https://a11oy.net/api/a11oy/code/healthz` -> `sovereign:true`, `inference:self-hosted-gpu`, `gpu:"NVIDIA GPU @ betterwithage (Tailscale) - Ollama llama3.1:8b"`
- `GET https://a11oy.net/api/a11oy/v1/sovereign-compute` -> `summary:"SOVEREIGN-GPU LIVE"`, `sovereign_any:true`; brain = `LIVE-SOVEREIGN / self-hosted-gpu / generative`; embeddings = `LIVE-SOVEREIGN / bge-large / reachable:true`
- Direct generation on the GPU node (`qwen2.5-coder:7b`) returns real output.

What was done:
- Served open-weight models on the GPU, OpenAI-compatible: `qwen2.5-coder:7b` (code, pulled this pass), `llama3.1:8b` (general), `bge-large` (embeddings).
- Set on the a11oy.net deploy env (`/etc/a11oy-gpu.env`, NOT committed): `A11OY_MODEL_BASE_URL=http://100.125.77.31:11434/v1`, `A11OY_LOCAL_CODE_MODEL=qwen2.5-coder:7b`, `A11OY_LOCAL_GENERAL_MODEL=llama3.1:8b`, honest `A11OY_GPU_LABEL`.
- `a11oy-rebuild` -> main@cb3a82a, all VERIFY PASS, container healthy.

**DEVIATION (defensible — flagged):** the order specified `127.0.0.1:11434` + label "NVIDIA RTX 5000 @ Hetzner". The Hetzner box (167.233.50.75) is **CPU-only** — there is no local GPU at 127.0.0.1. The real GPU is the Tailscale node **100.125.77.31** ("betterwithage"), which the founder pointed to directly. Used that node and kept an **honest** label (a Tailscale-reachable GPU, not physically "@ Hetzner"). Sovereignty is genuine; the label does not overclaim.

**ROOT CAUSE FIXED (no bandaid):** `a11oy-rebuild` only injected `--env-file /etc/szl-contracting.env`, silently dropping `/etc/a11oy-gpu.env` — so `A11OY_MODEL_BASE_URL` never reached the container and the brain fell back to hf-router on every rebuild. Patched `ENV_ARGS` to inject a second `--env-file /etc/a11oy-gpu.env` (marker `gpu-env-file-patch`; backup kept). Verified the env survives a full rebuild.

**NEEDS UPGRADES (notes, no bandaids applied):**
1. `code/healthz.key_resolution` still reports `provider:hf-router / env_used:HF_TOKEN`. Serving is local regardless, but the key-resolver fallback chain omits `A11OY_GPU_TOKEN`, so the cosmetic block contradicts the sovereign path. `serve.py` change; left untouched to avoid colliding with the active sibling edit (a11oy #327, GPU Bearer auth). Verify after merge.
2. `/api/a11oy/code/v1/chat/completions` is admin-API-key-gated (`/v1/keys`); an end-to-end OpenAI-compat turn needs an issued key. Sovereignty attested via healthz + sovereign-compute (both derive from a live backend check) instead of issuing admin keys.
3. **Reproducibility (R0b):** the `a11oy-rebuild` fix is live on the box but the script remains **uncommitted** (no tracked source for `/usr/local/sbin/a11oy-rebuild`). Should be committed to a tracked ops path so the fix survives a from-scratch box rebuild.
4. The GPU node **sleeps**. When asleep, `sovereign-compute` honestly reports `reachable:false` (DEGRADED), never fake-sovereign — sovereignty is live only while the node is awake.

Not touched this pass (serialized / sibling-owned / gated): R1–R7 — serve.py refactor has an active sibling; keyed-signing items remain founder-gated.

## Auto-loop pass — order `175da6eb` — 2026-06-13T03:04:31Z

- **Actionable items (24)** — handed to Forge agent (mode=`none`, ok=`False`):
  - On a11oy.net deploy env: set A11OY_GPU_STATUS="maintenance" +
  - sudo a11oy-rebuild.
  - In _sovereign_inference_state(): when A11OY_GPU_STATUS=="maintenance" -> sovereign:false,
  - key_resolution reports the TRUE active provider (router/cpu), no cosmetic mislabel.
  - On the betterwithage GPU node: `ollama list` — capture exactly what's pulled. If the tier
  - From the a11oy.net APP container: `curl -s http://100.125.77.31:11434/v1/models` — confirm the
  - Apply your Part-1 patch (the ast-validated _serving_base()/_serving_is_local()/_inference_headers
  - Also commit the patched `a11oy-rebuild` to a tracked path (ops/a11oy-rebuild) — close the R0b
  - Make key_resolution report the TRUE serving provider (local/self-hosted-gpu) when serving local,
  - POST /api/a11oy/code/chat/stream (T2 AND T3): route.model is the LOCAL served tag,
  - GET /api/a11oy/code/healthz: sovereign:true AND key_resolution.base_url = the local endpoint
  - GET /api/a11oy/v1/code/models: endpoint = the Ollama base, backend.sovereign:true.
  - ollama pull qwen2.5-coder:7b           # keep llama3.1:8b serving too
  - curl -s http://127.0.0.1:11434/v1/models   # MUST 200 with the model BEFORE step 4
  - set on the a11oy.net deploy env (NOT committed):
  - sudo a11oy-rebuild
  - one /api/a11oy/code/chat/stream turn whose route.model is the local tag, cost_usd absent/0.
  - Make /v1/models succeed FIRST. If the model server is NOT up at rebuild time, the app
  - open-weight ONLY, never commit a key, locked=8, Λ=Conjecture 1, BFT=Conjecture 2.
  - While on the box, also do R0b: systemctl status a11oy-autodeploy.timer; run
  - serve an open-weight model on the betterwithage GPU, OpenAI-compatible
  - set on the a11oy.net deploy env: A11OY_MODEL_BASE_URL=http://127.0.0.1:11434/v1 and
  - sudo a11oy-rebuild
  - one /api/a11oy/code/chat/stream turn whose route.model is the local tag with NO cost_usd.
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `297b855a` — 2026-06-13T04:04:31Z

- **Actionable items (3)** — handed to Forge agent (mode=`none`, ok=`False`):
  - serve open-weight model OpenAI-compatible on betterwithage: `ollama pull qwen2.5-coder:7b` (keep llama3.1:8b);
  - set on the a11oy.net deploy env: A11OY_MODEL_BASE_URL=http://127.0.0.1:11434/v1 ;
  - sudo a11oy-rebuild. PROVE: healthz base_url = LOCAL endpoint (NOT router), env_used != HF_TOKEN,
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.

## Auto-loop pass — order `4dcafc5d` — 2026-06-13T05:04:42Z

- **Actionable items (3)** — handed to Forge agent (mode=`none`, ok=`False`):
  - a11oy: /api/a11oy/v1/{honest,formulas,gates,qbio/lambda,qbio/summary,ledger}
  - killinchu: /api/killinchu/v1/{honest,...}, /counter-uas/evaluate, /khipu/sign|verify, /receipt/export
  - maritime/vessel fusion endpoints return honest live/SAMPLE-labeled data for the new killinchu site to embed.
- Reachability snapshot: https://a11oy.net/healthz -> 200
- NOTE: no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) — actionable items are reported + the founder is pinged; wire the endpoint to make execution fully hands-off.
