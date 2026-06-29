# GPU Maintenance Mode — honest graceful degradation (SZL doctrine)
2026-06-13. The RTX 5000 (betterwithage) is DOWN FOR MAINTENANCE. Serve on CPU/router
fallback, but say so HONESTLY — never claim sovereign while the GPU is down. This is
"HONEST BY DESIGN" applied to uptime: visible, controlled degradation, not a fake banner.

## What top teams do (researched, cited) — and our version
- **Visible controlled degradation, not seamless failover.** Try primary (GPU); if down,
  drop to fallback (CPU/HF router) AND attach metadata saying which served the turn.
  [Moltbook: graceful degradation; Zylos degradation hierarchy; Latitude fault-tolerance]
- **Three honest severity labels:** green=normal/sovereign, yellow=degraded/MAINTENANCE,
  red=down. "Degraded" must be concrete (what's affected, what still works).
  [Koder.ai maintenance templates; statuspage.me 2026 best practices]
- **Health endpoint reports real status, not a fake 200.** Performance/posture health, not
  binary. [OneInfer; Civo AI inference; fal GPU health]
- **OUR DOCTRINE:** the half-state (banner says sovereign while turns route to HF) is the ONE
  unacceptable outcome. Maintenance is an HONEST state, like the deterministic-stub is honest.

## Now (immediate, no new model needed) — CPU/router fallback, honestly labeled
Set on the a-11-oy.com deploy env and rebuild:
  A11OY_GPU_STATUS="maintenance"
  A11OY_GPU_MAINTENANCE_NOTE="RTX 5000 (betterwithage) down for maintenance — serving on CPU/HF-router fallback; sovereign GPU resumes when the node is back."
  # ensure NOT claiming sovereign while GPU down:
  unset A11OY_MODEL_BASE_URL   # (so _sovereign_inference_state can't flip true)
  unset A11OY_GPU_LABEL
  sudo a11oy-rebuild

healthz should then honestly report (add these fields to _sovereign_inference_state):
  "sovereign": false,
  "inference": "hf-router",        # or "cpu" if serving a local CPU model
  "posture": "maintenance",        # NEW: green=sovereign | maintenance | down
  "posture_note": "<the maintenance note>",
  "gpu": "RTX 5000 @ betterwithage — DOWN FOR MAINTENANCE"
Banner/console should show a YELLOW maintenance state, not green sovereign, not a red outage.

## Code (a11oy_code_orchestrator.py) — make posture a first-class honest field
- _sovereign_inference_state(): if A11OY_GPU_STATUS=="maintenance" -> sovereign:false,
  posture:"maintenance", posture_note from env; serve via the existing fallback path.
- Keep the #324 _serving_base patch + tier->local map READY so the moment the GPU is back
  (A11OY_GPU_STATUS unset/=="live" AND A11OY_MODEL_BASE_URL reachable) it flips to genuinely
  sovereign with turns on the GPU. One switch, both directions, always honest.
- key_resolution must report the TRUE active provider (router/cpu now; local when GPU back).

## When the RTX 5000 is back (auto-restore to genuine sovereign)
Follow SOVEREIGN_GPU_WIRING_SPEC.md: OLLAMA_HOST=0.0.0.0 + KEEP_ALIVE=-1, pick model by VRAM
(RTX 5000 Ada 32GB -> qwen2.5-coder:32b CODE + llama3.1:8b GENERAL; older RTX 5000 16GB ->
qwen2.5-coder:14b), confirm app->tailnet reachability, set A11OY_GPU_STATUS=live +
A11OY_MODEL_BASE_URL=http://100.125.77.31:11434/v1 + the tier->local map, rebuild. PROVE a real
T2/T3 turn serves the LOCAL tag (cost_usd 0) before calling it sovereign.

## Status cadence (defense-grade, matches the public "verify everything" promise)
- /healthz posture is the machine-readable source of truth (green/maintenance/down).
- The chaski_probe + auto-pilot already watch it; "maintenance" is an HONEST verdict, not a fail.
- Doctrine v11/v12: locked=8, Λ=Conjecture 1, BFT=Conjecture 2, open-weight only, never a key.
