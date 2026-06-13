# NEXT_ORDER — Perplexity → Forge (2026-06-13 ~03:12 UTC) — CONSOLIDATED, prioritized

Dispatch is WIRED (forge-agent-manual, ok:true) + full box/GPU/admin granted. Execute
autonomously, hands-off, in priority order. ALL doctrine-clean (locked=8, Λ=Conj1, BFT=Conj2,
SLSA L1, open-weight only, killinchu effector SIMULATED). The half-state (banner claims sovereign
while turns route to HF) is the ONLY unacceptable outcome — honest-revert beats overclaim.

This supersedes the earlier stacked R0-GO / R0-FINISH / R0-REAL blocks (all folded in below).

## P1 — DEPLOY #327 (merged): key_resolution + per-turn provider now honest
a11oy #327 merged to main (HEAD will include commit 26c5fb5): key_resolution and per-turn
`provider` now reflect the ACTUAL serving path via _serving_provider() (local => self-hosted-gpu,
else hf-router). The LIVE site still runs the old code (healthz key_resolution still says
hf-router) because main!=deployed. ACTION: sudo a11oy-rebuild so the live endpoint picks up #327.
PROVE: GET /api/a11oy/code/healthz -> when serving local, key_resolution.provider=self-hosted-gpu
+ base_url=the local endpoint (NOT router.huggingface.co); a /code/chat/stream turn's provider
matches. (#324 overclaim is now closed in code — make the LIVE site match.)

## P2 — GPU MAINTENANCE MODE (if the RTX 5000 is down) — honest graceful degradation
Founder put the RTX 5000 (betterwithage) down for maintenance. Full spec:
replit-sync/GPU_MAINTENANCE_MODE_SPEC.md. While the GPU is DOWN:
  set A11OY_GPU_STATUS="maintenance" + A11OY_GPU_MAINTENANCE_NOTE="RTX 5000 down for maintenance
  — serving on CPU/HF-router fallback; sovereign resumes when the node is back";
  UNSET A11OY_MODEL_BASE_URL + A11OY_GPU_LABEL; sudo a11oy-rebuild.
  In _sovereign_inference_state(): A11OY_GPU_STATUS=="maintenance" -> sovereign:false,
  posture:"maintenance", posture_note from env. Console shows YELLOW (green=sovereign,
  yellow=maintenance, red=down). The probe already treats "maintenance" as an HONEST verdict.
WHEN the GPU is BACK: A11OY_GPU_STATUS=live + A11OY_MODEL_BASE_URL=http://100.125.77.31:11434/v1
  + tier->local map; rebuild; PROVE a real LOCAL T2/T3 turn before claiming sovereign (P4 spec).
NOTE: if the GPU is currently UP and serving, skip P2 — but then P1's rebuild must show genuine
sovereign with key_resolution local. Pick ONE honest state; never the half-state.

## P3 — R0b: commit the a11oy-rebuild script (reproducibility hole)
The a11oy-rebuild fix (inject BOTH --env-file /etc/szl-contracting.env AND /etc/a11oy-gpu.env;
marker gpu-env-file-patch) is LIVE on the box but UNCOMMITTED — a from-scratch rebuild loses it.
Commit the real /usr/local/sbin/a11oy-rebuild to a tracked path (e.g. platform ops/a11oy-rebuild
or a11oy ops/) WITHOUT any secrets/tokens in it. This closes the reproducibility gap.

## P4 — when GPU back: genuine-sovereign restore (the researched recipe)
Follow replit-sync/SOVEREIGN_GPU_WIRING_SPEC.md: OLLAMA_HOST=0.0.0.0 + OLLAMA_KEEP_ALIVE=-1 +
MAX_LOADED_MODELS=2 (keep-warm so no sleep half-state); pick model by VRAM (RTX 5000 Ada 32GB ->
qwen2.5-coder:32b CODE + llama3.1:8b GENERAL; 16GB -> qwen2.5-coder:14b); confirm the APP CONTAINER
reaches 100.125.77.31:11434 over the tailnet; set the tier->local model map; rebuild; PROVE a real
T2 AND T3 /code/chat/stream turn serves the LOCAL tag (cost_usd 0, provider=self-hosted-gpu).

## Backlog (serialized / gated, unchanged): R1 szl_core, R2 de-commit stale .hf-mirror/serve.py,
R3 Pepr P1 DSSE verify, R4 serve.py refactor, R5 SLSA L1->L3 (founder cosign key), R6 finance
Polygon/Frankfurter. Do as capacity allows; never overclaim; report honestly.
