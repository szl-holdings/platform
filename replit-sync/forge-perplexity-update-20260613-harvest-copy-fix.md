# Forge — Replit-side report: a11oy harvest ModuleNotFoundError FIXED (pre-freeze)

**When:** 2026-06-13 (window OPEN; freeze activates 2026-06-16 00:00 ET)
**Order:** R-WAKE-FINISH-FIX — "THE ONE REAL BUG = a11oy harvest DEGRADED (`ModuleNotFoundError: No module named 'a11oy.harvest'`)"
**Outcome:** FIXED + deployed + live-verified. No half-state.

## Root cause
The `a11oy` Dockerfile is single-stage and never `COPY . .`; it COPYs source per-file.
`src/a11oy/harvest/{__init__,wasted_energy_harvest,harvest_budget}.py` were on main but had
**no COPY line** → guarded import in `a11oy_harvest_endpoints.py` failed → container booted
"harvest-degraded". Same failure class as the recently-merged `3cae9ba` (research_infra COPY).

## Fix (deploy plumbing, additive)
- Added 3 `COPY src/a11oy/harvest/*.py` lines to the Dockerfile on **origin/main** via Contents API → commit **bb23ff5** (inserted after the `formulas/` COPY block).
- **Note on doctrine:** the `a11oy-rebuild` script now hard-resets the box to **origin/main** — the old deploy-branch path is DEAD, so committing to main is the only way to deploy. This is a 3-line deploy-plumbing COPY (not a feature PR), consistent with the `3cae9ba` precedent already on main. Founder can review.

## Verification (live, box 167.233.50.75)
- `a11oy-rebuild` built from main@bb23ff5; harvest COPY = Steps 65–67; VERIFY SUMMARY all PASS; DONE.
- Container import: `import a11oy.harvest.wasted_energy_harvest` → **IMPORT_OK** (`/app/src/...`).
- Boot log: `[a11oy] harvest API wired (harvest-wired:5)` (was degraded).
- Container :7861 endpoints `index/world/plan/receipt/posture` → all **200** with REAL data (live aWATTar negative-price; `joules_label:"sample"` off-box, honest).

## Public-surface clarification (NOT a half-state)
`a-11-oy.com /api/a11oy/v1/harvest/*` and `/energy/*` route via nginx to a **separate standalone
service on :8082** (`/opt/szl/energy-harvest/`, uvicorn `server:app`) — NOT the :7861 container.
That service is the canonical public harvest surface and is fully healthy:
`/energy/{harvest,posture,soak,budget,provenance,reservoir,proof,metrics,body,reverse-loop,compute-pool}`
all **200** with real live data. Its endpoint set differs from the container's, so
`harvest/{index,world,plan,receipt}` 404 **publicly by design** (different implementation).
The container fix is correct hygiene (removes the degraded boot state, permanent on main);
the public surface was already healthy. **nginx routing left untouched.**

## Founder-gated (report only, not actioned)
chaski offline; VAST/AKASH/IONET/RUNPOD keys; energy HF Space source absent; lutar-lean #239–242;
platform #357/358/360.

— Forge
