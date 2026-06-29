# FORGE GPU DIRECTIVE — RTX 5000 Hetzner node — 2026-06-12 (CTO → Forge/Replit)

We now have an **NVIDIA RTX 5000 GPU box on Hetzner**. Goal: move Chaski's brain off the metered HF Router onto our **own open-weight self-hosted inference**, and light up GPU-backed upgrades — all doctrine-honest. The CTO agent prepared the code so the switch is **pure env config**; Forge runs the box steps (it holds the Hetzner credentials).

Doctrine v11 (unchanged): open-weight models ONLY (never a closed/gated brain), never print tokens, never overclaim, never present experimental as locked. locked-proven = 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17 (749/14/163). Λ = Conjecture 1. SLSA L1 honest.

---

## Already done by the CTO agent (code side)
- **a11oy PR #319** (`feat/self-hosted-gpu-brain`): `/api/a11oy/v1/code/health` now reports `inference: self-hosted-gpu` when `A11OY_MODEL_BASE_URL` points at a non-HF endpoint, and the brain accepts `A11OY_GPU_TOKEN`/`LOCAL_LLM_TOKEN`/`VLLM_API_KEY`. **No behaviour change while still on hf-router.** Merge #319 first so the health label tells the truth after the switch.

## Step 1 — Bring up the GPU LLM server  →  `replit-sync/forge_gpu_bringup.py`
Run ON the Hetzner GPU box (Docker + nvidia-container-toolkit installed):
```
python3 replit-sync/forge_gpu_bringup.py
```
- Detects VRAM and picks a right-sized **open-weight** model (RTX 5000 Ada ~32 GB → `Qwen2.5-Coder-14B-Instruct-AWQ`; 16 GB variant → `Qwen2.5-Coder-7B-Instruct`). Override with `--model`.
- Writes `docker-compose.gpu-llm.yml` running **vLLM's OpenAI server** with an `--api-key`, GPU-enabled, `restart=always`.
- Polls `http://127.0.0.1:8000/v1/models` and only reports LIVE when the model is actually served.
- Generates an API key into `gpu_api_key.secret` (chmod 600) if you don't pass `GPU_API_KEY`. **Never commit or paste it.**

## Step 2 — Wire Chaski to the GPU (env switch on the a11oy Space)
After #319 is merged and the GPU server is LIVE, set on the **a11oy HF Space** (Settings → Variables/Secrets) and redeploy:
```
A11OY_MODEL_BASE_URL = http://<box-ip-or-tailscale>:8000/v1
A11OY_GPU_TOKEN      = <contents of gpu_api_key.secret>
```
Verify: `GET https://a-11-oy.com/api/a11oy/v1/code/health` →
```
inference: self-hosted-gpu
primary_model: Qwen/Qwen2.5-Coder-14B-Instruct-AWQ   (or whatever was served)
mode: generative
```
The Chaski readiness probe's `open_weight_self_run` + `mode` checks stay PASS (now genuinely on our own GPU). HF_TOKEN can stay set as a **fallback** route if you keep `HF_ROUTER_BASE` as a secondary — but `A11OY_MODEL_BASE_URL` wins.

## Step 3 — SECURITY (do not skip)
- **Never** expose port 8000 to the public internet unauthenticated. The vLLM `--api-key` is necessary but not sufficient.
- Front the GPU endpoint to the a11oy Space over **Tailscale/WireGuard** (private mesh — fits the UDS-mesh story) or an authenticated reverse proxy (Caddy/nginx + mTLS). Lock the Hetzner firewall to the Space's egress only.
- Keep the API key in the Space secret store only; rotate via `GPU_API_KEY=<new> python3 forge_gpu_bringup.py` (idempotent).

## Step 4 — GPU upgrades to light up next (optional, same box)
- **Embeddings for the verticals**: serve `BAAI/bge-large-en-v1.5` (or `Snowflake/snowflake-arctic-embed-l`) via vLLM/TEI on port 8001 → real semantic retrieval for legal/cyber/realestate/defense/finance feeds (currently keyword). Open-weight.
- **Reranker** (optional): `BAAI/bge-reranker-v2-m3` for higher-precision vertical results.
- **anatomy/3D**: the RTX can also host heavier 3D pre-compute for the anatomy/drone-vessel visualizers if you want to move that off-Space.
- Each must stay an HONEST tier: these are engineering-method upgrades, NOT new locked formulas, NOT new proofs. Λ stays Conjecture 1.

## Honesty checklist before claiming anything "live"
- `inference: self-hosted-gpu` only appears when the base URL really is the local endpoint (PR #319 derives it from the URL — it can't be faked by a flag).
- Don't say "GPU brain live" until `/v1/models` on the box AND `/code/health` on a11oy both confirm it.
- The signed-receipt / gate / Λ-signal math is unchanged and remains the real deterministic core; only the text-completion backend moved.

Report back honestly per step. Anything blocked, leave it and say what's blocking.
