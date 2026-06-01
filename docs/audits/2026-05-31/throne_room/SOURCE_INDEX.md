# THRONE ROOM — SOURCE INDEX

**Author:** Yachay (CTO subagent) · **Date:** 2026-06-01 · **Doctrine v11 LOCKED.**

## Files shipped to SZLHOLDINGS/a11oy (Space, Docker SDK)

| Repo path | Purpose | Served at | Robustness |
|---|---|---|---|
| `console/throne-room.html` | Throne Room HTML shell (Kanchay-styled chrome, chips, pane, Cmd-K) | `/throne-room.html` | **Primary** — served by the existing static-file branch of `spa_fallback`; independent of any serve.py route, immune to serve.py rewrites |
| `console/throne-room.js` | R3F/Three.js r171 scene module (WebGPU+WebGL2, 5 heroes, live polling, interaction, palette) | `/throne-room.js` | Static, route-independent |
| `pages/throne-room.html` | Same HTML, for the explicit serve.py route | `/throne-room`, `/throne` (when serve.py route is in the running build) | Route-dependent |
| `pages/throne-room.js` | Same JS, for the route | `/throne-room.js` (route path) | Route-dependent |
| `serve.py` | + `@app.get("/throne-room")` / `/throne` / `/throne-room.js` handlers (mirrors the chaski/wallpa/wasi-rikuq pattern), inserted before the catch-all | route registration | Re-merged additively |

> **Why two hosting locations?** During this build a sibling agent (KHIPU-OS) repeatedly rewrote `serve.py`, dropping the route on some builds. Hosting the same files under `console/` (→ `/app/static/`) makes `/throne-room.html` resolve through the existing static-file branch with **zero serve.py dependency**, guaranteeing the scene is always reachable. The `pages/` copy + serve.py route provide the clean bare-path `/throne-room` when present.

## Local working copies (this deliverable)
- `SOURCE/throne-room.html` — exact HTML shipped
- `SOURCE/throne-room.js` — exact scene module shipped
- `SOURCE/serve.py.live_snapshot.py` — snapshot of the live serve.py at re-merge time (contains the throne route)

## External / open-source dependencies (all permissive)
| Dependency | Version | License | URL |
|---|---|---|---|
| Three.js | r171 (0.171.0) | MIT | https://github.com/mrdoob/three.js |
| three/examples OrbitControls | r171 | MIT | https://github.com/mrdoob/three.js |
| three/webgpu (WebGPURenderer) | r171 | MIT | https://github.com/mrdoob/three.js |
| esm.sh CDN (module delivery) | — | — | https://esm.sh/three@0.171.0 |
| Kanchay design tokens | 1.0.0 | Apache-2.0 | `round2/full_reaudit_2026-05-31/kanchay/tokens/COLOR_TOKENS.json` |

## Reference material read
- `puriq/PURIQ_CHARTER.md` — layer doctrine, HF push-auth hard rule, a11oy Dockerfile gotcha
- `411_3D_ANATOMY_V2_PLUS_ROSIE_3D.md` + `410_3D_ANATOMY_INTERACTIVE.md` — the existing anatomy-3d R3F-via-CDN static pattern (esm.sh import, procedural meshes, live flagship polling, organ-click side panel) which the Throne Room follows and extends.
- a11oy `serve.py` (live) — FastAPI route topology, `STATIC_DIR=/app/static`, `PAGES_DIR=/app/pages`, SPA history fallback, `/chaski` `/wallpa` `/wasi-rikuq` page-route pattern.
- a11oy `Dockerfile` (live) — `COPY console/ ./static/`, `COPY pages/ ./pages/` (so both hosting locations ship without any Dockerfile change).
