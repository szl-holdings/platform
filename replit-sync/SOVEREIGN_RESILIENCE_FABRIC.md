# Sovereign Resilience Fabric — "always good, no matter what"
2026-06-13. Goal: the whole SZL ecosystem (Chaski brain + verticals + governed turns) stays UP
and stays SOVEREIGN even if the laptop dies, the betterwithage GPU sleeps, or any one node drops.
No single point of failure. Researched + cited. Doctrine v11/v12, open-weight only, never overclaim.

## The problem today (verified)
EVERYTHING hangs on ONE node: 100.125.77.31 (betterwithage, Ollama) over Tailscale. If that
GPU sleeps OR the laptop hosting it goes off -> local path dies -> falls to HF router (loses
sovereignty). There is a credential fallback chain but no SOVEREIGN redundancy and no always-on
node. One sleepy laptop = the whole brain degrades.

## The architecture (proven pattern, converges across all sources)
A health-checked ROUTER in front of a MULTI-NODE compute fabric, local-priority with automatic
failover. [LiteLLM reliability; SOLLOL; Binadit HAProxy; Rohan-Paul HA inference; Tailscale HA]

  client -> a-11-oy.com -> [LiteLLM/SOLLOL router] --health-checked--> 
      Tier A (always-on dedicated GPU, PRIMARY sovereign)   <- new, the "always good" anchor
      Tier B (betterwithage laptop GPU, BONUS sovereign)    <- current node, now optional
      Tier C (cloud burst GPU, RunPod, on-demand sovereign) <- for spikes / both A+B down
      Tier D (HF router / API fallback, HONEST non-sovereign)<- last resort, labeled clearly

Local tiers (A/B/C) = sovereign:true. Tier D = sovereign:false (honest). The router picks the
highest-available tier and the response METADATA always names which node actually served.

## STEP 1 — add an ALWAYS-ON primary node (so the laptop is never the dependency) [founder]
Pick ONE always-on 24GB GPU (zero cold-start, flat-rate, 99.9% SLA) — the new Tier A primary:
- GPU Mart RTX Pro 4000 (24GB Blackwell ECC): $159-199/mo flat, unlimited bandwidth, dedicated.
  Handles qwen2.5-coder:32b. [gpu-mart.com/best-value-gpu-hosting]
- (bigger) RTX Pro 5000 48GB $269-349/mo for multi-model concurrent; RTX Pro 6000 96GB for 70B.
- (burst only) RunPod RTX 4090 ~$0.34/hr on-demand — Tier C, not always-on.
On it: install Ollama, OLLAMA_HOST=0.0.0.0, OLLAMA_KEEP_ALIVE=-1, pull qwen2.5-coder:32b +
llama3.1:8b, join the tailnet. This box NEVER sleeps -> sovereign survives the laptop going off.

## STEP 2 — put a failover ROUTER in front (LiteLLM, self-hosted, OpenAI-compatible) [Forge]
Run LiteLLM proxy (or SOLLOL) on the always-on box (co-located with Tier A). Config:
  model_list:
    - model_name: code
      litellm_params: {model: openai/qwen2.5-coder:32b, api_base: http://<TierA-ip>:11434/v1, api_key: local}
    - model_name: code-bonus
      litellm_params: {model: openai/qwen2.5-coder:7b, api_base: http://100.125.77.31:11434/v1, api_key: local}
    - model_name: code-cloud
      litellm_params: {model: openai/qwen2.5-coder:32b, api_base: <RunPod-ip>/v1, api_key: os.environ/RUNPOD_KEY}
    - model_name: code-router
      litellm_params: {model: huggingface/..., api_key: os.environ/A11OY_GPU_TOKEN}
  router_settings: {num_retries: 2, timeout: 30}
  litellm_settings:
    fallbacks: [{code: ["code-bonus","code-cloud","code-router"]}]
Point a-11-oy.com's A11OY_MODEL_BASE_URL at the LiteLLM proxy (NOT a single Ollama). Now the app
calls ONE stable endpoint and the router handles which node serves + failover.

## STEP 3 — Tailscale HA mesh (so the tailnet itself survives a node dropping) [founder+Forge]
Run >=2 subnet routers / exit nodes (always-on box + one more), approve routes, set route
priorities + 30s failover checks. If the laptop's tailscale drops, the mesh still reaches Tier A.
[Tailscale set-up-high-availability; Binadit site-to-site redundancy]

## STEP 4 — honest posture at every tier (doctrine) [Forge, in orchestrator]
- healthz: sovereign:true if served by Tier A/B/C (local GPU); sovereign:false only on Tier D.
- ALWAYS report served_by (tier-A-dedicated / tier-B-betterwithage / tier-C-runpod / tier-D-router)
  + the real base_url + cost (0 on local). Never claim sovereign when Tier D served.
- posture field: green=sovereign-multi-node, yellow=degraded (only router left / GPU maint),
  red=down. keep-warm (KEEP_ALIVE=-1) on every local node to avoid sleep flapping.

## Cost reality (so "take more power" is a decision, not a surprise)
- Always-on 24GB dedicated: ~$159-199/mo flat (vs ~$1,440/mo hourly cloud 24/7) — 86% cheaper.
- Laptop GPU: $0 extra (bonus tier when awake).
- Cloud burst (RunPod): pay-per-second, only when both local tiers are down.
Net: one ~$159-199/mo box makes the whole ecosystem always-sovereign and laptop-independent.

## Doctrine floor
open-weight only; never commit a key (RUNPOD_KEY/A11OY_GPU_TOKEN via env/secret store only);
locked=8; Λ=Conjecture 1; BFT=Conjecture 2; the half-state (sovereign banner while Tier D serves)
is the ONLY unacceptable outcome. A multi-node fabric that HONESTLY reports its tier is the goal.
