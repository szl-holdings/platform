# Forge (Replit task session) — SOVEREIGN-GPU order corroboration + drift catch

**Order:** `replit-sync/NEXT_ORDER.md` (blob f30b21bb / commit 2b6c8cf) — bring SZL inference onto the founder's GPU.
**Outcome:** CONFIRMED DONE. Both box-served public surfaces report honest live-probed sovereignty. A parallel Forge instance already wired + reported this (AUTO_STATE.json state=done, report forge-perplexity-update-20260613-sovereign-gpu.md); this is an independent Replit-side corroboration — AUTO_STATE.json left untouched (corroborate, don't clobber).

## Verified live (this session, 2026-06-13 ~22:00 UTC)
- **a-11-oy.com** `GET /api/szl/v1/inference-posture` → `where:gpu, provider:self-hosted-gpu, sovereign:true, gpu_reachable:true, online:true, model:qwen2.5-coder:7b, base_redacted:100.125.77.31:11434` (live `/models` probe THIS request; `fallback_allowed:false` = fails closed, never fake-sovereign). `/api/a11oy/v1/code/health` → `inference:self-hosted-gpu`. `/healthz` lock `749/14/163` commit `c7c0ba17` (unchanged).
- **killinchu.a-11-oy.com** `GET /api/killinchu/v4/inference-posture` (and `/api/szl/v1/inference-posture`) → `where:gpu, sovereign:true, gpu_reachable:true, model:qwen2.5-coder:7b`. `/healthz` commit `c7c0ba17`.
- GPU node `betterwithage` (Tailscale 100.125.77.31, Ollama qwen2.5-coder:7b) `/v1/models` → 200 live.

## Drift caught + repaired (no bandaid)
- On inspection, the **running a11oy container (created 21:16Z) lacked `SZL_GPU_BASE_URL`** — posture was `where:offline, gpu_configured:false` — even though `/etc/a11oy-gpu.env` already held the correct `SZL_GPU_BASE_URL=http://100.125.77.31:11434/v1` + `SZL_LOCAL_LLM_MODEL=qwen2.5-coder:7b`. The `/api/szl/v1/inference-posture` path (operator_shell_v4.py) reads a **separate `SZL_GPU_*` env contract**, distinct from the `A11OY_MODEL_BASE_URL` path that drives `/code/health` + `/sovereign-compute`.
- **Fix:** recreate-only from the existing `a11oy:local` image (NO git/build → frozen lock `c7c0ba17` preserved), `--env-file` = captured live env **+** `/etc/a11oy-gpu.env` (last-dup-wins), health-gated with auto-rollback to `a11oy:prev`. Posture flipped to sovereign:true on the live probe. No key committed; no forced sovereign.

## Honest constraints (concur with sibling)
- The box (167.233.50.75) has **no local GPU** (Virtio VGA). The runbook's on-box RTX/`docker run --gpus all`/box:8000 vLLM premise is physically impossible here; the goal is met via the founder's **Tailscale** GPU node, the only real GPU.
- **HF-hosted Spaces cannot reach the private tailnet GPU (100.x)** — setting `SZL_GPU_BASE_URL` there would only fail closed. Deliberately NOT set (would be a misleading secret). The order's verify targets (a-11-oy.com + killinchu) are the box surfaces and ARE sovereign.
- Sovereignty is live only while `betterwithage` is awake; when it sleeps, posture honestly drops to offline (founder-only to keep the node awake).
