# Forge → Perplexity — Per-turn provenance plumbing LIVE (R-FREEPOWER #4 + R-RESILIENCE #2)

Date: 2026-06-13 ~06:30 UTC. Author: Forge. Surface: a11oy orchestrator (`a11oy_code_orchestrator.py`).
Doctrine v11 throughout (locked=8, Λ=Conj1, BFT=Conj2, never commit a key, never weaken a gate,
byte-identical GitHub main / HF Space / box).

## What shipped (DONE + live-verified)

R0/R0b (prior): local turns now report the on-box served tag, `cost_usd=0.0`, `served_locally`/
`sovereign:true` — telemetry stopped lying about logical router id + estimated cost on sovereign turns.

NEW this pass — additive provenance on EVERY turn receipt (route event + done event, both the
agentic and non-agentic done paths):
- `served_by`  — coarse honest tier label: `"local-gpu"` when a LOCAL tier served, else `"hf-router"`.
- `base_url`   — the REAL resolved serving base (`_serving_base()`): local GPU URL when local,
  `HF_ROUTER_BASE` otherwise. Never None, never fabricated.
- `energy_source` — `"grid"` today (honest plumbing so stranded-energy nodes can populate it later).
- `sovereign` stays TRUE only when local actually served (reachability-gated by `_serving_base`, so
  it can never overclaim). Router/free-tier turns will read `sovereign:false`.

Reachability gate unchanged: GPU asleep → `_serve_local=false` → `served_by:"hf-router"`,
`base_url:HF_ROUTER_BASE`, `sovereign:false`. Never fakes sovereign.

## Proof
- GitHub main commit `8997b00` (additive only; router path byte-unchanged; `python3 -m py_compile` OK;
  diff = exactly the 6 inserted field/computation lines).
- Box `167.233.50.75` rebuilt from main (HEAD `8997b00`), container `a11oy:local` live on :7861.
- HF Space `SZLHOLDINGS/a11oy`: `hf-sync-backend.yml` ran SUCCESS on `8997b00` (06:22Z) → backend
  mirrored. All three surfaces byte-identical.
- Live turn (`/api/a11oy/code/chat/stream`, GPU warm) — route AND done both carried:
  `served_by:"local-gpu"`, `base_url:"http://100.125.77.31:11434/v1"`, `energy_source:"grid"`,
  `served_locally:true`, `sovereign:true`, `cost_usd:0.0`, `model:"llama3.1:8b"`.

## Design note for the heavy build (intentionally left for you)
`served_by` is COARSE on purpose (`local-gpu`/`hf-router`). The R-RESILIENCE #2 tier-A/B/C/D taxonomy
is meant to ride on the LiteLLM proxy (#1), which doesn't exist yet — so the schema field is in place
now and the values refine themselves once the proxy is the single endpoint. No re-plumbing needed:
just map the proxy's chosen model_name → tier letter at the same emission points.

## Upgrade / build-on from here (handoff)
1. **LiteLLM proxy (R-RESILIENCE #1)** — self-hosted OpenAI-compatible single endpoint; fallback
   chain code → [betterwithage → RunPod → HF router]; point `A11OY_MODEL_BASE_URL` at the proxy;
   `num_retries:2 timeout:30`. Then refine `served_by` to tier-A/B/C/D from the proxy's served model.
2. **Free tiers (R-FREEPOWER #1)** — GLM-Flash / SiliconFlow / Groq / GitHub Models / OVH Kepler /
   NVIDIA NIM as zero-cost fallbacks; label `served_by` + `sovereign:false` (honest). Keys via secret
   store, NEVER committed.
3. **Energy-aware scheduler (R-FREEPOWER #3)** — gate heavy/batch + model pulls to off-peak/cheap
   windows; log the window; populate `energy_source` with the real window when a metered node exists.
4. **Own the weights (R-FREEPOWER #2)** — mirror glm-4.6 + qwen2.5-coder:32b + a deepseek coder to
   the SZL HF org.
5. **Posture in /healthz** — green=multi-node-sovereign, yellow=only-router-left, red=down; KEEP_ALIVE=-1.
6. **[FOUNDER]** always-on 24GB Tier-A GPU + Tailscale HA subnet routers (removes the laptop SPOF;
   Forge configures once it exists).

`energy_source:"grid"` is plumbing, NOT a green claim — keep it honest (no greenwashing) until a real
meter / stranded-energy node reports otherwise. Box hourly loop owns `AUTO_STATE.json`; not touched.
