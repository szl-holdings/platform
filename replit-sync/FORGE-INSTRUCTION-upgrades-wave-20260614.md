# SZL Forge — ORDER: UPGRADES wave (build on the PNT mesh + Holographic Ops once they land)

Runs AFTER the PNT-mesh + Holographic-Ops order. PROVE-OR-DOWNGRADE in force (DONE only with a pushed
commit SHA / HTTP 200 from a named endpoint / a verifying signature; else RECOMMENDED or BLOCKED).
Clean-room, doctrine v11, 2D fallback, 0 runtime CDN, sovereign own-metal, MEASURED/MODELED labels.

=====================================================================
## U1 — Make the PNT mesh REAL on the GPU (not just closed-form web answers)
=====================================================================
The web /pnt/* routes return closed-form stdlib answers (correct, instant). UPGRADE: run the heavy
engines on the sovereign GPUs and feed their artifacts back, exactly like the PINN MEASURED path:
- quantum_sensing_limits + nav_coasting: run a real parameter sweep on rtx-betterwithage; write a
  signed sensor/coasting certificate artifact the mesh serves (label MEASURED only on a real run).
- pnt_resilience: run the fused detector over the TEXBAT-class library; publish a /pnt/resilience
  history endpoint (last-N verdicts, content-addressed).
GATE U1: /pnt/sensor + /pnt/coast carry a MEASURED (not just MODELED) field sourced from a GPU run,
with a per-run receipt; /pnt/resilience history returns 200 + >=1 entry. If a GPU run can't be done
this pass, keep MODELED honestly and mark U1 RECOMMENDED — never fake a MEASURED.

=====================================================================
## U2 — Sign the PNT certificates (DSSE) + add to the unified verify
=====================================================================
Run the PNT/sensor/coast certificates through the same khipu/szl_lake Ed25519 DSSE signer as the PINN
cert (FA-001 key). UPGRADE /api/a11oy/v1/verify to cover BOTH pillars (compute-bounds + sensing-limits).
GATE U2: /verify returns a real signed receipt referencing a PNT cert. If FA-001 not reachable -> BLOCKED:
needs founder (do NOT fake a signature).

=====================================================================
## U3 — Holographic Ops upgrades (after the 6 views render)
=====================================================================
- Add the WebGPU volumetric "estate hologram" hero (live on-GPU compute) as the landing view of the tab,
  with the 2D fallback.
- Wire view #2 (compute-fabric hex heightmap) to auto-include the founder's NEW RTX-4000 rig the moment
  it joins the tailnet (read /compute-pool; a 3rd GPU column appears with no code change).
- Add a live "Λ-gate verdict ticker" overlay (deny=red/allow=teal) reading the governance feed.
- Performance: 60fps cap, WebGPU Render Bundles where available, graceful 2D under ~31% no-WebGPU.
GATE U3: hero hologram renders on WebGPU + degrades to 2D; hex heightmap shows live node count matching
/compute-pool; no console errors; mobile-safe. Honest "feed unavailable" if a source endpoint is down.

=====================================================================
## U4 — Unify + consolidate
=====================================================================
- Fold fundamental_limits.py into ONE library surface so /api/a11oy/v1/pnt/limits AND the PINN bounds
  cert share a single "fundamental-limits" index (both pillars: compute + sensing) with shared constants.
- Keep copy-sync lockstep GREEN + GitHub<->HF byte-identical across all new files.
- Update the digest/anatomy loop so the new PNT + holographic surfaces show in /anatomy/loop honestly.
GATE U4: /pnt/limits lists both pillars wired; lockstep guard green; one unified verify.

## P3 [FOUNDER] (report BLOCKED, never fake)
RTX-4000 rig tailnet IP (founder bringing up) · VAST_API_KEY · killinchu domain registration · FA-001 for U2.

## DOCTRINE v11 (HARD)
No fabricated DONE/flags/numbers/geometry/signatures. MEASURED only via real run/exporter. Λ = Conjecture 1.
Honest inverse of free-energy. Clean-room, cite-never-plagiarize. 0 CDN, system fonts, sovereign. 2D fallback.
Never commit a key. Never merge a lutar-lean keystone PR. Honest BLOCKED beats a false DONE.

— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> · Doctrine v11 LOCKED · Λ = Conjecture 1
