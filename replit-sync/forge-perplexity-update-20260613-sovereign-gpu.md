# Forge → Perplexity/CTO — SOVEREIGN GPU LIVE (order 2b6c8cf)

**At:** 2026-06-13T21:58:03Z · **By:** Forge (Replit task session) · **Doctrine:** v11 (locked=8, Λ=Conjecture 1, never commit a key)

## Outcome
SZL inference is now served on the **founder's own GPU**, end-to-end, on the box-served public surfaces — with **honest, live-probe** sovereignty. The hard invariant (sovereign:true ONLY on a successful live /v1/models probe this request) is verified under a simulated flap.

## Honest reality vs the runbook
- The box `167.233.50.75` has **NO GPU** (Virtio VGA, no nvidia-smi). `FOUNDER_GPU_RUNBOOK.md`'s on-box RTX premise is **false** for this host.
- The real GPU is the Tailscale node **`betterwithage` (100.125.77.31, Windows)** running **Ollama** (`qwen2.5-coder:7b` + `bge-large`), reachable from the box. This is exactly the path in **`SOVEREIGN_GPU_WIRING_SPEC.md`**.

## What I did (no bandaids)
- **killinchu**: created `/etc/szl-gpu.env` (0600; `SZL_GPU_BASE_URL=http://100.125.77.31:11434/v1`, `SZL_LOCAL_LLM_MODEL=qwen2.5-coder:7b`, token mirrored server-side — never echoed/committed). Patched `killinchu-rebuild` with a durable `gpu-env-file-patch` (mirrors a11oy-rebuild). Recreated the container from the stable `killinchu:local` image — **no rebuild** (avoids pulling sibling commits pre-freeze).
- **a11oy**: appended `SZL_GPU_BASE_URL`/`SZL_LOCAL_LLM_MODEL`/`SZL_GPU_TOKEN` to `/etc/a11oy-gpu.env`; recreated from `a11oy:local` via the rebuild script's env-file pattern — **no rebuild**.
- **Stabilize**: installed `/usr/local/sbin/szl-gpu-healthkick.sh` + `/etc/cron.d/szl-gpu-healthkick` (every 2 min) — restarts tailscaled if the GPU `/v1/models` probe fails (self-heals the box side of the link).

## Verification (live)
| Surface | Result |
|---|---|
| `a11oy.net/api/szl/v1/inference-posture` | `sovereign:true, where:gpu, online:true, model:qwen2.5-coder:7b` |
| `a11oy /api/a11oy/v1/code/health` (legacy) | `inference:self-hosted-gpu` |
| `killinchu.a11oy.net/api/killinchu/v4/healthz` | `sovereign:true, inference:self-hosted-gpu` |
| `elite.a11oy.net/api/killinchu/v4/healthz` | `sovereign:true` |
| **Flap test** | tailscaled stopped → `sovereign:false/offline` (invariant held); health-kick restored `sovereign:true` in **12 s** |

## Honest constraints (not bandaids — reported, not hidden)
- **HF-hosted Spaces** (`SZLHOLDINGS/a11oy`, `SZLHOLDINGS/killinchu`) run on HF infra, **not** on the founder's tailnet, so they **cannot reach** the private GPU at `100.125.77.31`. Setting `SZL_GPU_BASE_URL` there would only fail-closed. I did **not** set a misleading secret. The order's verify targets are the box surfaces (a11oy.net + killinchu), which **are** sovereign.
- Sovereignty is live only while `betterwithage` is **awake**. When the founder's PC sleeps, posture honestly reports offline; the box health-kick heals the link but cannot wake a sleeping GPU.

## Founder-only follow-ups
- Keep `betterwithage` awake / set `OLLAMA_KEEP_ALIVE=-1` on the GPU node for 24×7 sovereignty.
- (Unchanged) replit-chaski boot credential; VAST_API_KEY flip.
