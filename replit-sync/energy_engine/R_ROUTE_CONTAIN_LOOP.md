# R-ROUTE-CONTAIN-LOOP — route the energy to us, CONTAIN it in a loop, run the formulas (FOUNDER, TOP)

Founder order: "I want the energy routed to me, contained with loops and formulas."
The CODE is now MERGED to main (platform #371 harvest-budget formulas + Ouroboros loop, #372 security,
#373 ops runner; a11oy #328–#340 energy/engine/revenue/provenance/heart surfaces; anatomy organs).
The MISSING piece is NOT code — it is DEPLOY + the GPU thermal bridge. Close it.

## STATE RIGHT NOW (verified live this minute)
- LIVE 200: /harvest/metrics, /harvest/posture (wasted_energy=1, joules_sample=1, reverse_recovery_available=0).
- DARK 404 (merged in code, NOT deployed): /energy/budget, /engine/status, /revenue/estimate,
  /formula/sovereign, /ayni, /energy/provenance, /heart/pulse.
- GPU SPLIT STILL OPEN: szl_energy_reverse_recovery_available 0 — "no reachable GPU thermal source
  (CPU-only box; GPU node exposes Ollama only)". This is why there is ZERO measured joule.

## FORGE — DO IN THIS ORDER
1) WIRE THE GPU NODE (the one missing piece). Set GPU_THERMAL_URL or run a tiny on-node agent on the
   RTX 5000 @ betterwithage that exposes `nvidia-smi --query-gpu=power.draw,temperature.gpu` to the app
   box over Tailscale. The node_thermal_agent.py from the on-site node package (#374, MERGED) does exactly
   this — deploy it on the GPU node. Once the app can READ NVML: joules_sample flips to joules_measured,
   reverse_recovery_available flips to 1 → the FIRST MEASURED JOULE exists.

2) DEPLOY the dark surfaces to the box behind serve.py (same try/except register pattern), so every loop +
   formula tab serves real data, not 404:
   - /energy/budget (Bekenstein-gated energy receipt — the FORMULA gate)
   - /energy/provenance (tamper-evident hash-linked LEDGER — the CONTAINMENT loop)
   - /engine/status (whole-organism honest aggregate)
   - /revenue/estimate (demand-response + arbitrage ESTIMATE layer — the ROUTING $ )
   - /formula/sovereign (sovereignty gate: sovereign:true ONLY on own metal)
   - /heart/pulse (sigma-bus receipt heartbeat — every routed joule is a BEAT)
   - /ayni (reciprocity balance — F11 Ayni-balanced loop)

3) RUN THE LOOP once joules are measured: harvest → SAMAY soak on the RTX 5000 → EnergyReservoir entry
   {ts, joules_measured, posture, grid_price, work_credits, artifact_ref} → DSSE receipt to the
   provenance chain → validate against canonical-formulas-v1 / lean-proofs-v1 → Ayni-balanced (F11).
   This is the CONTAINMENT LOOP the founder asked for: energy in, work out, receipt persisted, formula-bounded.

4) CONFIRM tab-by-tab: paste raw curl results for each of the 7 surfaces above + the raw nvidia-smi readings
   + the first computed measured joule to replit-sync.

## DOCTRINE (v11, NON-NEGOTIABLE)
- NO free-energy / over-unity. Harvest WASTED/stranded energy only; PROVE bounded work (Bekenstein cap +
  Landauer floor — both proven witnesses #239/#240, additive). The loop RECYCLES spent energy, never creates it.
- Energy cannot travel as data. Route only via: behind-the-meter (private wire), Virtual PPA + REC (contract),
  or demand-response (cash). NEVER take energy without consent — that is theft and destroys the moat.
- Joules are SAMPLE until the app reads on-GPU NVML; then honest MEASURED. Never fabricate a joule.
- sovereign:true ONLY on own metal (the RTX 5000). locked-proven = exactly 8. Λ = Conjecture 1 (advisory,
  never "proven trust"). Khipu BFT = Conjecture 2. No key ever committed. Reactive turns never starve.
- Do NOT merge anything (founder/Forge merge gate). This is a DEPLOY + WIRE order, not a merge order.

The half-state is the only unacceptable outcome. Wire the node FIRST — that single bridge unblocks
measured joules, the loop, and every formula gate at once.
