# Forge report — P0 PNT/quantum-sensing mesh wired + LIVE on HF (no bandaids)
**When:** 2026-06-14 (PM) · **Order:** NEXT_ORDER re-pin 07:17 EDT "PNT mesh + WebGPU Holographic Ops" · **Doctrine v11 / PROVE-OR-DOWNGRADE**
**Window:** FREEZE.json active but activates_at 2026-06-16 → today is normal work (not yet read-only).

Founder re-issued "check github from perplexity to replit of forge — get it all done, no bandaids".
The newest directive (committed 14:18Z, AFTER the 10:48Z recheck) re-pins **P0 = mesh the PNT engine
into serve.py so /api/a11oy/v1/pnt/* serve 200**. Verified live: the 5 endpoints were genuinely 404.

## P0 — DONE-PROVEN (on main + LIVE on HF Space)
Merged to a11oy main: squash `36b9c191` (PR #369, GitHub-signed → satisfies required_signatures).

Changes (3 files, additive, doctrine-clean):
- `serve.py` — added the `szl_pnt_mesh.register(app, ns="a11oy")` try/except block mirroring
  `szl_pinn_bounds` exactly, before the SPA catch-all.
- `Dockerfile` — `COPY szl_pnt_mesh.py quantum_sensing_limits.py pnt_resilience.py nav_coasting.py
  fundamental_limits.py ./` (szl_pnt_mesh loads the 4 engines via importlib at runtime → all 5 must
  ship or the mesh falls back to a stub).
- `szl_pnt_mesh.py` — **real fix, not a bandaid**: the 5 handlers were `def _h_*(req):` (unannotated),
  so FastAPI's `add_api_route` treated `req` as a REQUIRED query param → bare GET returned **422**, not
  200. Annotated `req: Request` to match the `szl_pinn_bounds` contract EXACTLY → FastAPI injects the
  Request. (The module's 77 built-in self-tests passed because they exercise a dict/fake-app path that
  never hits FastAPI param resolution — the bug was invisible to them.)

GATE P0 evidence (PROVE-OR-DOWNGRADE):
- **HF Space LIVE:** `szlholdings-a11oy.hf.space/api/a11oy/v1/pnt` = **200**, `/pnt/sensor` = **200** (root 200).
- **Local proof on real app:** `TestClient(serve.app)` → all 5 (`/pnt`, `/pnt/sensor`, `/pnt/resilience`,
  `/pnt/coast`, `/pnt/limits`) = **200** with honest MODELED / deny-by-default / doctrine-v11 labels.
- copy-sync lockstep guard = OK; serve.py `ast.parse` OK; szl_pnt_mesh self-test `ok=true`.
- **Box `a-11-oy.com/api/a11oy/v1/pnt` = 404 → BLOCKED on the founder box git-pull** (FREEZE.json:
  "Box orchestrator git-pull pending (founder)"). Code is complete + proven; the box flip is a
  founder-gated hardware step, never faked.

## P1 — WebGPU Holographic Ops: RECOMMENDED (largely already landed)
The FRONTIER 3D/HOLOGRAPHIC WAVE already shipped live: `/holo`, `/estate-hologram`, and the `*-3d`
surfaces (F1–F5) on the vendored 0-CDN szl_holo3d.js kit. A net-new "Holographic Ops" tab would
overlap; the honest next unit is a gap-assessment of the six named views (esp. view 6 = `/pnt/coast`,
now live) against what already renders — a real PR, not a duplicate. Not fake-built.

## Net
P0 flipped 404 → 200 (HF live + main), with the underlying 422 contract bug fixed properly. No gate
weakened, no fabrication, no bandaid. Box live-flip awaits the founder git-pull.

— Forge
