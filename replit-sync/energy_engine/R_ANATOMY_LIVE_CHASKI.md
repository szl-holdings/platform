# R-ANATOMY-LIVE + WAKE-CHASKI — wire the anatomy to the REAL metered loop + bring chaski online. DEPLOY, do NOT merge.

ACK Forge: outstanding work. Verified live from the public net: /revenue/marketplace 200 (honest ESTIMATE
$108-244/mo, settled=$0 settle-to-count, energy_gated reading -15.7 EUR/MWh, NO mining); /compute-pool 200
(6-node fabric, rtx-betterwithage sovereign-live, chaski tailnet offline ~22h honest, no hidden fleet);
real qwen2.5-coder inference proven on the RTX; the push-model JOULE METER is UP at 100.96.129.45:9471 with
exporter.ps1 token-injected, awaiting_exporter=0 J (honest, never estimated). One founder PowerShell command
flips the first MEASURED joule — and the grid is NEGATIVE right now. This is the real loop substrate. Now make
the ANATOMY circulate THIS real energy, and wake chaski.

## PART 1 — WIRE THE ANATOMY TO THE REAL METERED LOOP (founder: "route all jacked-in energy into my anatomy in a loop")
Build /api/a11oy/v1/anatomy/loop (404 now) and drive the organ pulse from REAL fabric data, not synthetic:
- INTAKE = harvest/posture (live -15.7 EUR/MWh) + the joule-meter total at 100.96.129.45:9471/text.
  When exporter is live -> SAMAY (lungs) intake = real measured watts; until then intake = SAMPLE soak envelope.
- METABOLIZE = KALLPA turns measured/sample W·s into work_credits, bounded by Bekenstein #239 + Landauer #240.
- CIRCULATE = heart/pulse emits a DSSE BEAT per cycle on the YAWAR blood bus; YARQA flow-router disperses to
  WAQAYCHAQ/KAMAY/RIKUY. Each organ glows in /living-anatomy ONLY when it has real flow (no fake pulse).
- STORE = EnergyReservoir holds the circulating charge {ts, joules(measured|SAMPLE), posture, grid_price,
  work_credits, node:rtx-betterwithage, artifact_ref}.
- RECEIPT + CLOSE = persist to provenance chain -> HF uds-governance-receipts; validate vs canonical-formulas-v1
  / lean-proofs-v1; Ayni-balance F11 (intake == output+stored+proven, never net-positive) -> back to SAMAY.
- DEPLOY the dark loop organs so it actually circulates: /heart/pulse /energy/provenance /ayni /energy/budget
  /engine/status (all 404 now). Expose /anatomy/loop returning {intake, beats_last_cycle, reservoir_charge,
  organs_touched, last_receipt_id, ayni_balance, joules_label, node}. HONEST: joules MEASURED only when the
  exporter is live (meter says nvidia-smi), else SAMPLE; loop carries soaked-WORK+receipts, not electrons; no
  free-energy; Ayni must balance. Drive /living-anatomy + the HF anatomy static space animation FROM this state.

## PART 2 — WAKE CHASKI (founder: "get chaski online")
chaski (100.76.58.50) is a registered tailnet-GPU node, reachable=false because its Ollama is DOWN (offline
~22h). The fabric already registers it honestly and will flip reachable=true the instant its Ollama answers.
FOUNDER — on the chaski machine (the second tailnet node), bring Ollama up:
  ollama serve        (or start the Ollama app/service; confirm `ollama list` shows models)
  # ensure it binds reachable on the tailnet: set OLLAMA_HOST=0.0.0.0:11434 then restart
Then verify from the box / anywhere: curl http://100.76.58.50:11434/v1/models  -> 200.
FORGE — the moment chaski's Ollama answers: confirm /compute-pool flips chaski reachable=true +
gpu_nodes_reachable 1->2; add chaski as a second SAMAY intake lung so the anatomy loop circulates across BOTH
sovereign GPUs; if chaski also runs the exporter.ps1 (Windows) or a Linux nvidia-smi push, its joules accrue
too. Do NOT fabricate chaski as up before its Ollama answers — it registers honestly until then.

## DOCTRINE v11: no free-energy (loop recycles, Ayni-balanced, bounded by #239/#240); no mining; energy != data
(physical soak on owned metal only); consent-only; joules MEASURED only via real exporter, SAMPLE otherwise;
organs EXPERIMENTAL tier; sovereign only on own metal; locked=8; Lambda=Conjecture 1; Khipu BFT=Conjecture 2;
NEVER commit a key/seed; do NOT merge. Founder steps: (1) run exporter.ps1 on betterwithage for first measured
joule, (2) bring chaski Ollama up. Everything else is Forge. Half-state is the only unacceptable outcome.
