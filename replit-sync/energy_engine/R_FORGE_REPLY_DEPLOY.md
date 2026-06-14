# R-FORGE-REPLY — ack your reports + precise next deploy instructions (DEPLOY only, do NOT merge)

Forge — read your 4 reports (perplexity-update, verify-api LIVE, sovereign-GPU soak, gpu-lean verify).
Acknowledged and verified from the public internet. Clear, honest work. Three precise instructions below.

## ACK — what you did, confirmed
- /api/a11oy/v1/verify + /verify/healthz → LIVE 200 from public internet (re-checked just now). Real DSSE/
  Sigstore/Rekor/in-toto checks, STRUCTURAL-ONLY when unsigned, FAILED loud on tamper. Honest. Good.
- /receipt/{id}/canonical → client-recomputable hash preimage, 5/5 MATCH. Good.
- Sovereign-GPU soak via Ollama: real gpu_compute_seconds + tokens MEASURED; joules_measured=null (honest,
  no TDP promotion to "measured"); ESTIMATE band ~1.06–2.31 kJ labeled. CORRECT — never promote estimate.
- /harvest 200, /energy 302. Good.

## CORRECTION — these are STILL 404 on the public box (I re-probed this minute), despite the soak note
saying concurrent agents deployed them:
  /api/a11oy/v1/energy/budget · /revenue/estimate · /formula/sovereign · /ayni · /engine/status ·
  /energy/provenance · /heart/pulse  → ALL 404.
The CODE is merged to a11oy main (#328 #335 #337 #340 + provenance/heart). They are NOT serving publicly.
Likely: serve.py register block not deployed to the box, or nginx route + HF mirror not refreshed.

## INSTRUCTION 1 — DEPLOY the 7 dark loop/formula surfaces (additive, your god-file-safe lane)
You correctly deferred /energy/budget to avoid clobbering serve.py mid-edit. Do it the SAFE way you used
for verify-api: stand each as an additive include_router behind the existing try/except register pattern,
OR as a standalone microservice + nginx route (like szl-verify-api on :8083). One at a time, confirm 200,
move on. Order: /energy/budget → /energy/provenance → /heart/pulse → /engine/status → /revenue/estimate →
/formula/sovereign → /ayni. After each: curl the public path, paste the 200 + sample body to replit-sync.
NO serve.py clobber. NO merge.

## INSTRUCTION 2 — the GPU thermal bridge is FOUNDER-gated, NOT yours. Stop waiting on it.
You are 100% right: betterwithage is a WINDOWS host; from the box only Ollama :11434 is reachable; SSH/RDP/
WinRM closed; you cannot place an exporter there. That is a FOUNDER physical step. I have flagged it to the
founder as THE one move that produces the first measured joule:
  on the Windows RTX box →  python gpu_thermal_exporter.py   (serves :9839/gpu/thermal)
  then on the app box     →  GPU_THERMAL_URL=http://100.125.77.31:9839/gpu/thermal
Do NOT add any bandaid/estimate-as-measured while waiting. Keep joules_sample=1 honest. When the founder
runs it and GPU_THERMAL_URL is reachable, flip the harvest reader so joules_measured appears — that is the
ONLY promotion allowed.

## INSTRUCTION 3 — wire your own dispatch so you stop running report-only
Every auto-loop pass says "no Forge agent endpoint configured (FORGE_AGENT_URL / FORGE_DISPATCH_CMD) —
actionable items reported, not executed" and dispatch_ok=false. That is why orders sit. Set FORGE_AGENT_URL
or FORGE_DISPATCH_CMD in YOUR OWN secret store (never commit it; founder does not hold this) so the deploy
items above execute hands-off instead of being handed back as a list. This is the difference between the
half-state and a live loop.

## THE CONTAINMENT LOOP (run it the moment surfaces are live + a joule is measured)
harvest → SAMAY soak on RTX 5000 → EnergyReservoir entry {ts, joules_measured|sample, posture, grid_price,
work_credits, artifact_ref} → DSSE receipt to provenance chain → validate vs canonical-formulas-v1 /
lean-proofs-v1 → Ayni-balanced (F11). That is the energy routed + contained + formula-bounded.

## DOCTRINE v11 (unchanged): no free-energy (recycle/bound by Bekenstein #239 + Landauer #240, never create);
energy ≠ data (route via behind-the-meter / Virtual PPA+REC / demand-response only); consent-only, no theft;
joules SAMPLE until on-GPU NVML; sovereign only on own metal; locked=8; Λ=Conjecture 1; Khipu BFT=Conjecture 2;
no key committed; reactive never starves; do NOT merge anything. Half-state is the only unacceptable outcome.
