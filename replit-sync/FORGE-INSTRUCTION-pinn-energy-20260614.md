# FORGE-INSTRUCTION — PINN physics-ML capability + energy evolution — 2026-06-14

**To:** Forge + Replit. **Authority:** Founder, full green light. New capability seeded by the founder (Physics-Informed Neural Networks / heat-transfer PINNs).

## WHAT IS THIS
SZL now has a clean-room, sovereign Physics-Informed Neural Network (PINN) capability — the founder's seed (the heat equation u_t = α·u_xx baked into a physics_loss) made ours, and extended to the ENERGY side (thermal modeling of the GPU/compute fabric). It complements the existing FE-NO operator solver: PINN = mesh-free PDE solve; FE-NO = fast operator surrogate. One unified physics-ML stack. Clean-room from the published method (Raissi/Perdikaris/Karniadakis 2019, JCP), attributed; Modulus (Apache-2.0) + neurodiffeq (MIT) cited as prior art NOT copied; DeepXDE (LGPL copyleft) = method-only, not vendored; jaxpi (non-commercial) = REJECTED.

## MERGED TO MAIN (deploy these)
- **platform #381** — new vertical `services/verticals/szl_pinn/` (sibling of szl_mechanics). Service: `solve_heat(domain,alpha,bc,ic)->{field,receipt}` + `solve_thermal(load_map)->{temperature_field,landauer_floor_MODELED,receipt}`. Endpoints `POST /pinn/solve-heat`, `POST /pinn/thermal`, `GET /pinn/healthz`. 12/12 module tests, 100/100 verticals:validate, 4/4 meridian gates. Receipt = in-toto/DSSE matching szl_mechanics schema, honest UNSIGNED.
- **a11oy #359** — honest "Thermal PINN (MODELED)" panel on the energy/harvest tab (probes /pinn/thermal, degrades to "capability in-deployment").
- Static surfaces (agent redeployed previews): energy space got a full THERMAL PINN section (GPU-die T(x,y) heatmap + the heat-equation physics_loss + MODELED metrics); mechanics space notes the FE-NO/PINN sibling stack.

## FORGE — DEPLOY (when dispatched)
1. Rebuild the **platform** runtime / a11oy image FROM MAIN so `/pinn/solve-heat`, `/pinn/thermal`, `/pinn/healthz` go live + the a11oy energy-tab Thermal PINN panel resolves. Confirm GET /pinn/healthz = 200.
2. Push the evolved **energy** + **mechanics** HF static spaces (sources in replit-sync/hf_spaces/).
3. OPTIONAL (real-GPU, when chaski is up): train the PINN on the real thermal/load data from the fabric exporter; report MODELED field accuracy. The PINN output is MODELED — it is NEVER a measured joule. Only the real NVML exporter produces MEASURED joules (212.262 J milestone stands as the only measured number).
4. Validation numbers from the agent's run (honest, reproduce on metal): heat PINN rel-L2 = 1.14%, PDE residual 2.1e-3, conformal coverage 0.90; thermal app rel residual 4.3%, MODELED Landauer floor 3.35e-6 W.

## DOCTRINE v11 (never violate — energy-critical)
**NO free-energy / over-unity / perpetual-motion.** A PINN MODELS heat dissipation; it does NOT create energy. Energy harvest = WASTED/stranded electricity only. Joules MEASURED only via the real exporter; PINN thermal fields are MODELED — label every PINN number MODELED/ESTIMATE, never measured. Λ=Conjecture 1 advisory · locked-proven=8 · Khipu BFT=Conjecture 2 · SLSA L1 honest · sovereign own-metal · NEVER fabricate numbers/signatures · cite-never-plagiarize (Raissi 2019 clean-room) · no banned codenames · szl-router PRIVATE.

## REPORT into AUTO_STATE.json
platform/a11oy rebuilt + /pinn/* live? · energy+mechanics spaces pushed? · (if chaski up) MODELED thermal accuracy on real fabric data? · any founder gate needed flagged as `needs:`.
