# Sovereign GPU — Operational Wiring Spec (the real way, researched)
2026-06-13. Goal: governed chat turns GENUINELY serve on the betterwithage GPU over Tailscale,
so sovereign:true is TRUE end-to-end (no overclaim). Doctrine v11/v12; open-weight only.

## Proven facts (researched, cited)
- Ollama is OpenAI-compatible: POST http://<host>:11434/v1/chat/completions, api_key "ollama"
  (ignored). [Ollama docs: openai-compatibility]
- Remote GPU over Tailscale: set OLLAMA_HOST=0.0.0.0 on the GPU node; point the app at
  http://<tailscale-ip>:11434/v1. The app container must be ON the tailnet to reach 100.x.
  [logarithmicspirals; OpenClaw+Tailscale]
- Model-name mapping is the standard fix for "tier asks model X, server has tag Y": a
  model_mappings dict resolved exact->mapped->default->passthrough. [ollama_openai proxy;
  ollama-openai-proxy PyPI]
- VRAM decides what can serve (Q4_K_M): 7-8B~5-8GB, 14B~9GB, 32B~20GB(24GB card),
  70B~40GB(2x24GB/A100). [Hyperion enterprise guide; LocalLLM.in]
- Best open coder per tier: qwen2.5-coder:32b (92.7% HumanEval, best on a single 24GB card);
  qwen2.5-coder:14b (12-16GB); qwen2.5-coder:7b + llama3.1:8b (<=8GB).
  [RunAIHome; WhatLLM 2026]
- Keep-warm (the sleeping-GPU fix): OLLAMA_KEEP_ALIVE=-1 (load indefinitely),
  OLLAMA_MAX_LOADED_MODELS=N by VRAM budget, preload with keep_alive:-1 at startup.
  [ML Journey; Ollama FAQ; GoPenAI]

## STEP 0 — get the one fact that decides everything (Forge, on the GPU node)
  nvidia-smi --query-gpu=name,memory.total --format=csv   # capture total VRAM
  ollama list                                             # what's already pulled
Then pick the served set by VRAM:
  >=40GB : pull qwen2.5-coder:32b (CODE primary) + llama3.1:70b or llama3.3:70b (GENERAL)
  24-39GB: pull qwen2.5-coder:32b (CODE) + llama3.1:8b (GENERAL/fast)  <-- best single-card
  12-23GB: pull qwen2.5-coder:14b (CODE) + llama3.1:8b (GENERAL)
  <=11GB : qwen2.5-coder:7b (CODE) + llama3.1:8b (GENERAL)   [already have 8b]
Open-weight only. Verify each: curl -s http://127.0.0.1:11434/v1/models | jq '.data[].id'

## STEP 1 — keep the GPU warm (so it never silently sleeps into a half-state)
On the GPU node's ollama service env (systemd drop-in or /etc/default/ollama):
  Environment=OLLAMA_HOST=0.0.0.0
  Environment=OLLAMA_KEEP_ALIVE=-1
  Environment=OLLAMA_MAX_LOADED_MODELS=2
  Environment=OLLAMA_NUM_PARALLEL=2
systemctl restart ollama; then preload:
  curl http://127.0.0.1:11434/api/chat -d '{"model":"qwen2.5-coder:32b","messages":[],"keep_alive":-1}'
  curl http://127.0.0.1:11434/api/chat -d '{"model":"llama3.1:8b","messages":[],"keep_alive":-1}'

## STEP 2 — confirm reachability FROM THE APP CONTAINER (not just the box)
From wherever a-11-oy.com actually runs:
  curl -s http://100.125.77.31:11434/v1/models   # MUST 200 list the served tags
If not reachable: the app container isn't on the tailnet -> install/authorize tailscale in the
app's environment (tailscale up; tailscale ip) OR run an in-container SOCKS5/sidecar to the
tailnet [inference.club tsnet pattern]. The app MUST reach the GPU; this is non-negotiable.

## STEP 3 — make the SERVING PATH actually use the GPU (close #324, Part 1 + map)
In a11oy_code_orchestrator.py apply your ast-validated patch:
  - _serving_base(): return A11OY_MODEL_BASE_URL when non-router (call time), else HF_ROUTER_BASE.
  - route _call_model_stream / _call_model through _serving_base() (NOT hard-coded HF_ROUTER_BASE).
  - _inference_headers(): when serving local, no HF bearer; never 503 a local backend.
  - TIER->LOCAL MODEL MAP (env-overridable), e.g.:
      A11OY_LOCAL_CODE_MODEL=qwen2.5-coder:32b   (T2/T3 code tiers)
      A11OY_LOCAL_GENERAL_MODEL=llama3.1:8b      (general tiers)
    Resolve tier-primary hf_repo -> local tag before the call; unknown -> default local tag,
    never a router 70B. cost_usd=0 on local turns.
  - key_resolution: report provider/base_url of the ACTUAL serving path (local when local),
    not the cosmetic hf-router fallback.

## STEP 4 — set env + rebuild (Forge already patched a11oy-rebuild to inject /etc/a11oy-gpu.env)
  A11OY_MODEL_BASE_URL=http://100.125.77.31:11434/v1
  A11OY_GPU_LABEL="<real GPU name from nvidia-smi> @ betterwithage (Tailscale)"
  A11OY_LOCAL_CODE_MODEL=<chosen code tag>; A11OY_LOCAL_GENERAL_MODEL=llama3.1:8b
  sudo a11oy-rebuild
Also: commit the patched a11oy-rebuild to ops/a11oy-rebuild (close R0b reproducibility hole).

## PROVE (report to a11oy #324 + platform#343; close #324 only when ALL true)
  POST /api/a11oy/code/chat/stream (T2 AND T3): route.model == the LOCAL tag, cost_usd 0/absent,
    provider != hf-router.
  GET /api/a11oy/code/healthz: sovereign:true AND key_resolution.base_url == 100.125.77.31:11434
    (NOT router.huggingface.co), env_used != HF_TOKEN.
  GET /api/a11oy/v1/code/models: endpoint == the Ollama base, backend.sovereign:true.

## HONESTY FLOOR — the half-state is the ONLY unacceptable outcome
If the GPU genuinely cannot serve the governed turns (VRAM too small for the tier model AND no
acceptable map, or app cannot reach the tailnet), run the HONEST REVERT: unset
A11OY_MODEL_BASE_URL + A11OY_GPU_LABEL, sudo a11oy-rebuild -> banner honestly returns to
sovereign:false / hf-router. NEVER leave the banner claiming sovereign while turns route to HF.
open-weight only; never commit a key; locked=8; Λ=Conjecture 1; BFT=Conjecture 2.
