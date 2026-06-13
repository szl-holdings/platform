# NEXT_ORDER — Perplexity → Forge (2026-06-13 ~03:30 UTC / 2026-06-12 23:30 ET)

URGENT demo-risk fix at top. T-minus to founder demo (June 18). ALL doctrine-clean
(locked=8, Λ=Conj1, BFT=Conj2, SLSA L1, open-weight only, killinchu effector SIMULATED).
The box step is founder-gated by your Rule 4 (no prod/Hetzner change w/o human approval) —
founder approval for R0 is GRANTED here by Stephen.

## R0 (URGENT — #1 DEMO RISK) — a11oy.net is LIVE in the sovereign OVERCLAIM half-state. Fix tonight.
VERIFIED 23:30 ET: a11oy.net /api/a11oy/code/healthz reports sovereign:true / inference:self-hosted-gpu
WHILE key_resolution.base_url=https://router.huggingface.co/v1, env_used=HF_TOKEN, and its OWN
honest_note says "resolved via fallback HF_TOKEN (provider=hf-router)". Two live governed chat turns
were answered by HF Router (meta-llama/Llama-3.3-70B-Instruct, with cost_usd). The betterwithage GPU
node is asleep, so the banner is stale-sovereign while turns fall back to the router. This is the ONE
unacceptable outcome.
ROOT CAUSE: the box is running a STALE pre-#324/#327 build. The HF Space (same code, current main)
already reports HONESTLY sovereign:false/hf-router — because the #324/#327 wiring makes sovereign:true
gate on a REACHABLE local endpoint. The box just hasn't pulled current main.
=> FASTEST HONEST FIX (no GPU needed): on the box, redeploy current a11oy main and rebuild:
     cd <a11oy checkout on box> && git fetch origin && git checkout main && git pull --ff-only
     sudo a11oy-rebuild
   After this, healthz on a11oy.net will HONESTLY read sovereign:false / inference:hf-router (matching the
   HF Space) — overclaim GONE — even with the GPU asleep. This alone removes the #1 demo risk.
=> THEN (optional, to make it genuinely sovereign for the demo): wake/serve the GPU and set env, per below.

## R0-SOVEREIGN (optional upgrade after R0) — make it REAL on the GPU
1) serve open-weight model OpenAI-compatible on betterwithage: `ollama pull qwen2.5-coder:7b` (keep llama3.1:8b);
   `curl -s http://127.0.0.1:11434/v1/models` must list them BEFORE rebuild.
   (vLLM-with-key path also supported: a11oy now reads A11OY_GPU_TOKEN for the bearer — #327.)
2) set on the a11oy.net deploy env: A11OY_MODEL_BASE_URL=http://127.0.0.1:11434/v1 ;
   A11OY_GPU_LABEL="NVIDIA RTX 5000 @ Hetzner (betterwithage)" ; (vLLM only) A11OY_GPU_TOKEN=<key>.
3) sudo a11oy-rebuild. PROVE: healthz base_url = LOCAL endpoint (NOT router), env_used != HF_TOKEN,
   sovereign:true; one /chat/stream turn route.model = local tag with NO cost_usd. NO further a11oy code change needed.

## R0b — #323 autodeploy loop (while on box): systemctl status a11oy-autodeploy.timer;
sudo /usr/local/bin/a11oy-autodeploy-check; echo exit=$?; commit the real a11oy-rebuild to ops/a11oy-rebuild.

## R7 (founder-gated, unblocks all box steps hands-off): run WIRE_IT_UP.sh AS ROOT on 167.233.50.75 +
create /etc/forge-perplexity.env (dispatch_mode is currently none, so nothing on the box executes
automatically — this is why R0 needs a human until R7 is done).

## R1 extract szl_core shared lib; R2 de-commit stale .hf-mirror/serve.py; R3 Pepr real DSSE verify in receipt
gates (label "single-key DSSE verified; threshold=P2 roadmap, ledger=P3 roadmap"); R4 serve.py serialized
refactor into szl_core (exclusive lock, small PRs); R6 finance lineage (Polygon.io + Frankfurter, yfinance LABELED fallback).

## Gated (report, don't fake): R5 SLSA L1->L3 needs cosign key (founder).
## Honesty floor v11: never keystone self-merge, never commit a key, never weaken a gate, label live only on
real 200, locked=8, Λ=Conjecture 1, BFT=Conjecture 2.
