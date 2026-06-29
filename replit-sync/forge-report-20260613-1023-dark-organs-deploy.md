# Forge report — deploy dark a11oy organ surfaces (public 200 confirmed)

**When:** 20260613-1023 UTC
**Scope:** a11oy only. Doctrine v11. Additive. No PR merged (Dockerfile/module fixes committed directly to main via Contents API; deploy via a11oy-rebuild).

## Order actioned
Deploy the still-404 a11oy "dark" organ surfaces and confirm public 200.

## Root cause
The a11oy Dockerfile uses **explicit per-file `COPY`** (never `COPY . .`). Six organ modules existed in the repo on main but were in **no COPY line**, so the image lacked them and serve.py's guarded `try/except import` raised `ModuleNotFoundError` -> routes silently 404. (`docker logs a11oy` showed `Revenue layer NOT registered ... ModuleNotFoundError`.)

A secondary FastAPI trap: `/energy/provenance` and `/heart/pulse` handlers were `def _h(req):` with **no type annotation**, so FastAPI treated `req` as a required query param -> 422 (`query.req missing`), not a real 200.

## Fixes committed to a11oy main
1. `4dcd830` build(Dockerfile): COPY szl_energy_budget / szl_energy_provenance / szl_heart_blood / szl_engine_status / revenue_endpoints / a11oy_harvest_endpoints into the image.
2. `3f9c547` fix(energy/provenance): annotate handler `req: Request` (module-scope import) -> 200 not 422.
3. `4d85d8d` fix(heart/pulse): same annotation fix.

Deployed via `/usr/local/sbin/a11oy-rebuild` (REBUILD_EXIT=0, running `main@4d85d8d`).

## Public verification (https://a-11-oy.com)
| endpoint | before | after |
|---|---|---|
| /api/a11oy/v1/energy/budget | 404 | 200 |
| /api/a11oy/v1/energy/provenance | 404 | 200 |
| /api/a11oy/v1/heart/pulse | 404 | 200 |
| /api/a11oy/v1/engine/status | 404 | 200 |
| /v1/ayni (+ /v1/tinkuy) | mis-tested 404 | 200 (mounts at /v1/, not /api/a11oy/v1/) |

Bodies are honest per v11: provenance/heart report `length:0`/`beat_count:0` (no fabricated receipts); engine/status reports `sovereign:false, reachable:false` (GPU asleep — not faked). No /ingest joule samples self-POSTed.

## Still genuinely unbuilt (NOT a deploy gap — route string absent from every repo .py; needs real code)
- `/anatomy/loop`
- `/formula/sovereign`

These require building the route logic (the `/formula/sovereign` handler logic is hinted in a11oy_formula_endpoints.py but the route is not wired). Flagged for a follow-up build order — out of scope for "deploy already-written surfaces".

— Forge
