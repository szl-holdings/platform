# SZL Forge — ORDER: mesh the PNT/quantum-sensing engine + build the WebGPU Holographic Ops tab

Two deliverables. PROVE-OR-DOWNGRADE in force (DONE only with a pushed commit SHA / HTTP 200 from a named
endpoint / a verifying signature; else RECOMMENDED or BLOCKED). Clean-room, doctrine v11, 2D fallback,
0 runtime CDN, system fonts, sovereign own-metal.

=====================================================================
## P0 — MESH the PNT engine into a11oy (files already on main)
=====================================================================
5 SZL-native engine files are committed to szl-holdings/a11oy main (clean-room re-derivation of
AshfordeOU/kshana physics; cited, no Rust copied; 77 tests green in build):
  quantum_sensing_limits.py · pnt_resilience.py · nav_coasting.py · fundamental_limits.py · szl_pnt_mesh.py

WIRE szl_pnt_mesh.register(app, ns="a11oy") into serve.py — EXACTLY like szl_pinn_bounds is registered
(find that try/except block; add an identical one for szl_pnt_mesh right after it):
```python
try:
    import szl_pnt_mesh as _szl_pnt_mesh
    _szl_pnt_mesh.register(app, ns="a11oy")
    print("[a11oy] PNT/quantum-sensing mesh registered: /api/a11oy/v1/pnt/*", file=__import__("sys").stderr)
except Exception as _szl_pnt_e:
    print(f"[a11oy] PNT mesh NOT registered: {_szl_pnt_e!r}", file=__import__("sys").stderr)
```
Add the 5 files to the Dockerfile COPY line (same line as szl_pinn_bounds.py) or they fall back to a stub.
Keep the copy-sync lockstep guard GREEN (mirror static/shared if needed) + GitHub<->HF byte-identical.

GATE P0 (all five 200 on box AND HF Space):
  /api/a11oy/v1/pnt · /pnt/sensor · /pnt/resilience · /pnt/coast · /pnt/limits
The web path is closed-form stdlib (never blocks); heavy numpy/UKF/PINN solves are the Forge/GPU path on
rtx-betterwithage + chaski. Λ = Conjecture 1 advisory. Every value labelled MEASURED/MODELED. No fabrication.

=====================================================================
## P1 — BUILD the WebGPU Holographic Ops tab (genius 3D, honest)
=====================================================================
Add a governed "Holographic Ops" surface to a11oy. WebGPU render path + MANDATORY WebGL/2D fallback
(~31% of users lack WebGPU drivers — non-negotiable). Three.js base (already vendored, 0 CDN). Glassmorphic
dark+gold theme matching the estate. Each 3D view binds to a REAL live endpoint; every dimension carries its
MEASURED/MODELED/SAMPLE label — NO decoration-as-data, no fabricated geometry.

Six views, each = a real signal:
1. Energy-Harvest orbital ring  <- /api/a11oy/v1/harvest/posture (price/renewable/carbon; pulse = MEASURED joules)
2. Compute-fabric hex heightmap  <- /api/a11oy/v1/compute-pool (each GPU node a column; height = watts, color = reachable/sovereign)
3. PINN thermal field volumetric surface  <- the Thermal-PINN T(x,y); deck.gl-style 3D surface / WebGPU raymarch
4. Physical-bounds ladder (3D)  <- /api/a11oy/v1/pinn/certificate (Landauer->Bekenstein planes; job far below = honest inverse of free-energy)
5. Governance quorum / mesh arc-flow  <- khipu 3-of-4 + Λ-gate verdicts (deny=red, allow=teal)
6. PNT coasting horizon  <- /api/a11oy/v1/pnt/coast (classical vs quantum time-to-exceed, diverging 3D trajectories)
Re-derive deck.gl's Hexagon / 3D-surface / Arc *patterns* clean-room (MIT — study, port, cite; don't vendor wholesale).
Frontier hero (optional this pass, RECOMMENDED): a single WebGPU volumetric "estate hologram" computed live on-GPU.

GATE P1: the tab renders 200 with a visible 3D scene on WebGPU AND degrades to a working 2D fallback when
WebGPU is absent; each view shows live values matching its API; 60fps cap; no console errors; mobile-safe.
If a view's source endpoint is down, that view shows an honest "feed unavailable" — never fake geometry.

## DOCTRINE v11 (HARD)
No fabricated DONE/flags/numbers/geometry. MEASURED vs MODELED on every value. Λ = Conjecture 1 (advisory).
Honest inverse of free-energy. Clean-room, cite-never-plagiarize. 0 runtime CDN, system fonts, sovereign.
2D fallback mandatory. Never commit a key. Honest BLOCKED beats a false DONE.

— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> · Doctrine v11 LOCKED · Λ = Conjecture 1
