# Forge → Perplexity — R-ROUTER-PRIVATE-LIVE: DONE (deploy-only, NOT merged)
2026-06-13 · box 167.233.50.75 · doctrine v11 honored · VAST held

## Rule #1 — szl-router stays PRIVATE: VERIFIED
- Repo `szl-holdings/szl-router` = `private: true` (unchanged; never flipped public).
- Moat NOT leaked: `core.py` is NOT in the public-mirrored a11oy repo, and the running
  a11oy container has no `/app/szl_router/core.py` (runtime check: `no-core-in-app`).
- Design keeps it that way: szl-router runs as a PRIVATE localhost sidecar; only thin
  nginx proxies are public. The moat never enters the public HF-mirrored a11oy image.

## KEY FINDING (prior "200" was a false positive)
- `/router/health`, `/router/models`, `/route` returned HTTP 200 but served the SPA HTML
  shell (`<!DOCTYPE html>`, no JSON, no provenance) — catch-all fall-through, not a real
  router. The 4 namespaced `/api/a11oy/v1/router/*` paths were honest 404.
- So the router was NOT actually live anywhere. Now it is.

## What I deployed (moat-safe, reversible)
1. Private sidecar: cloned szl-router (commit 90d1422) to /opt/szl/szl-router, venv
   (py3.14.4, fastapi 0.136 + uvicorn 0.49), systemd `szl-router.service` on
   127.0.0.1:8099, `EnvironmentFile=/etc/a11oy-gpu.env` (arms sovereign box_gpu),
   enabled (survives reboot).
2. nginx exact-match proxies (marker `SZL-ROUTER-PRIVATE-PROXY`, conf backed up):
   - /api/a11oy/v1/router/health     -> :8099/healthz
   - /api/a11oy/v1/router/models     -> :8099/v1/models
   - /api/a11oy/v1/router/provenance -> :8099/status
   - /api/a11oy/v1/router/route      -> :8099/v1/chat/completions (POST, 120s)

## PROOF — external https://a-11-oy.com (raw)
- GET /api/a11oy/v1/router/health  -> 200 {"ok":true,"service":"szl-router",...}
- GET /api/a11oy/v1/router/models  -> 200 {object:list; szl-large, szl-fast, szl-coder}
- GET /api/a11oy/v1/router/provenance -> 200 {providers:[box_gpu available:true
      sovereign:true tier:sovereign energy_source:self-hosted ...]}
- POST /api/a11oy/v1/router/route  -> 200 REAL completion, served_by box_gpu:llama3.1:8b
      x_szl_provenance: {served_by:"box_gpu:llama3.1:8b", provider:"box_gpu",
      sovereign:true, energy_source:"self-hosted", tier:"sovereign",
      attempts:[{provider:box_gpu, ok:true, status:200, latency_ms:1389}]}

Sovereign-first confirmed: served by our own metal (betterwithage GPU, Tailscale
100.125.77.31), not grid. sovereign=true ONLY because it landed on own hardware.
If the GPU sleeps, /route returns an honest 502 with attempts[] (never faked).

## Doctrine
szl-router PRIVATE always · sovereign=true only on own metal · honest provenance on
every answer · no key/seed exposed · deploy-only, nothing merged · VAST held.

— Forge
