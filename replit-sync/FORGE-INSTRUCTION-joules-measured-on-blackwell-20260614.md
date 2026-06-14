# FORGE ORDER — make joules ACTUALLY MEASURED on the Blackwell GPU + mint receipts (demo-critical, surgical)

Issued 2026-06-14 by CTO. Doctrine v11. PROVE-OR-DOWNGRADE. Demo June 18.

## SITUATION (verified live by CTO)
Great work on the safe FORGE_LLM_SPEC cutover — inference path on the mesh, energy monitors kept on the raw GPU, reversible w/ fallback. Confirmed: stub_mode:false, operator computing on rtx-betterwithage (Blackwell RTX 5050), jobs=2546, tokens=499k climbing, 2 GPUs reachable, sovereign_gpu_live:true.

BUT two things are NOT yet true and they are the heart of the energy demo:
1. `joules_measured_total` is STUCK at 22899.74 (the old stub figure) — the NVML joule meter is NOT incrementing real joules from the Blackwell GPU even though jobs run there. nodes_computing still includes 'local-stub'.
2. ledger receipts STUCK at 318 — no NEW JouleCharge receipts are minting from the live Blackwell jobs.

## TASK (surgical — do NOT disturb the inference cutover or the energy-monitor split you correctly made)
1. Point the ENERGY METERING path (szl-joule.env / the NVML exporter that feeds /harvest/posture joules_evidence and the operator's joules_measured) at the now-reachable Blackwell GPU (rtx-betterwithage, the direct raw GPU at 100.125.77.31:11434 — NOT the mesh router, metering must read raw hardware). Confirm the NVML exporter is actually sampling the 5050's power draw and that joules_measured_total starts CLIMBING from real samples (label MEASURED, fresh <30s).
2. Ensure the operator's per-job JobRecords now carry REAL joules_measured (not the stale stub total) so the operator->ledger subscriber mints NEW signed JouleCharge receipts. Drop 'local-stub' from nodes_computing once the real GPU is the source.
3. PROVE (paste real values in AUTO_STATE.json + a report):
   - /api/a11oy/v1/energy/operator/status: stub_mode false, nodes_computing = [rtx-betterwithage] only, joules_measured_total CLIMBING (capture two readings a minute apart showing the increase), label MEASURED.
   - /api/a11oy/v1/energy/ledger: chain length > 318 and climbing (new receipts minting), chain_ok true.
   - /api/a11oy/v1/harvest/posture: joules_evidence shows a fresh power_w_sample from the betterwithage exporter (real watts off the 5050).

## DO NOT
- Do NOT fabricate a joule or a power sample. If the NVML exporter genuinely can't read the 5050 (e.g. Windows NVML/driver access over tailnet), report that HONESTLY as BLOCKED with the exact error — an honest "metering blocked, jobs real" beats a fake MEASURED number. We can demo the 318 signed receipts + the honest reason if metering can't reach the Windows GPU.
- Do NOT revert the FORGE_LLM_SPEC inference cutover or point energy monitors at the router.
- Revenue stays DRY-RUN/MODELED. sovereign:true only on live probe. Never commit a key.
