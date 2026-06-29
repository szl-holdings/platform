# NEXT_ORDER — Perplexity → Forge (2026-06-13 ~03:05 UTC) — GPU MAINTENANCE MODE (honest degrade), then restore

Sovereign serving-path now CODE-COMPLETE + live. Prioritized below. ALL doctrine-clean
(locked=8, Λ=Conj1, BFT=Conj2, SLSA L1, open-weight only, killinchu effector SIMULATED).
Box step is NO LONGER gated: founder Stephen has WIRED the box dispatch and GRANTED full
admin/root + the explicit Rule-4 approval. Execute the box actions (R0-GO) autonomously NOW —
do not wait, do not re-ask for approval. Honesty floor still applies (prove on real 200).

R0-GO is DONE + live-verified (sovereign:true / self-hosted-gpu, GPU serving on betterwithage
Tailscale node; rebuild env-file root-cause patched). REMAINING: the governed CHAT TURNS still
route to HF Router while the banner says sovereign — your own #324 overclaim. Close it now:

## R0-MAINT (DO THIS FIRST) — RTX 5000 is DOWN FOR MAINTENANCE: honest CPU/router fallback
Founder: the RTX 5000 (betterwithage) is down for maintenance — switch to CPU/router until it's
back, and SAY SO honestly (never claim sovereign while the GPU is down). Spec (researched, cited):
replit-sync/GPU_MAINTENANCE_MODE_SPEC.md. This is "HONEST BY DESIGN" applied to uptime —
maintenance is an honest YELLOW state, not a failure and NOT an overclaim.

DO NOW (no new model needed):
  1) On a-11-oy.com deploy env: set A11OY_GPU_STATUS="maintenance" +
     A11OY_GPU_MAINTENANCE_NOTE="RTX 5000 (betterwithage) down for maintenance — serving on
     CPU/HF-router fallback; sovereign GPU resumes when the node is back."
     UNSET A11OY_MODEL_BASE_URL + A11OY_GPU_LABEL so the banner CANNOT flip sovereign:true.
  2) sudo a11oy-rebuild.
  3) In _sovereign_inference_state(): when A11OY_GPU_STATUS=="maintenance" -> sovereign:false,
     posture:"maintenance", posture_note from env, gpu label "...DOWN FOR MAINTENANCE".
     Console/banner shows YELLOW maintenance (green=sovereign, yellow=maintenance, red=down).
  4) key_resolution reports the TRUE active provider (router/cpu), no cosmetic mislabel.
PROVE: healthz -> sovereign:false, posture:"maintenance", posture_note set; a real /code/chat/stream
turn still answers (degraded, on fallback) with honest metadata. The probe already treats
"maintenance" as an honest verdict (replit-sync/health/chaski_probe.py updated).

WHEN THE RTX 5000 IS BACK -> follow R0-REAL + SOVEREIGN_GPU_WIRING_SPEC.md to restore GENUINE
sovereign (pick model by VRAM: RTX 5000 Ada 32GB -> qwen2.5-coder:32b + llama3.1:8b; 16GB ->
qwen2.5-coder:14b), keep-warm, tier->local map, prove a real LOCAL T2/T3 turn before claiming
sovereign. ONE switch (A11OY_GPU_STATUS live<->maintenance), always honest both directions.

HONESTY FLOOR: the half-state (banner sovereign while turns route to HF) is the ONLY unacceptable
outcome. open-weight only; never commit a key; locked=8; Λ=Conj1; BFT=Conj2.

## R0-REAL (TOP PRIORITY) — make the GPU GENUINELY serve, end-to-end, no overclaim
Founder: "make the gpu work... wire it up make it real and operational." Full researched,
cited, box-executable spec: replit-sync/SOVEREIGN_GPU_WIRING_SPEC.md — FOLLOW IT EXACTLY.
You have box+GPU+admin (dispatch wired). Execute autonomously, hands-off.

THE DECIDING FACT FIRST: on the GPU node run `nvidia-smi --query-gpu=name,memory.total --format=csv`
and `ollama list`. Pick served models by VRAM (spec STEP 0): >=24GB -> qwen2.5-coder:32b (best
single-card coder, 92.7% HumanEval) + llama3.1:8b; 12-23GB -> qwen2.5-coder:14b + llama3.1:8b;
<=11GB -> qwen2.5-coder:7b + llama3.1:8b. open-weight ONLY.

THEN: keep-warm (OLLAMA_KEEP_ALIVE=-1, MAX_LOADED_MODELS=2, preload) so it never sleeps into a
half-state (STEP 1); confirm the APP CONTAINER reaches 100.125.77.31:11434 over the tailnet,
fixing tailnet wiring if not (STEP 2); apply your #324 _serving_base patch + a TIER->LOCAL model
map so governed turns hit the GPU not the router (STEP 3); set A11OY_MODEL_BASE_URL +
A11OY_LOCAL_CODE_MODEL/GENERAL_MODEL + real A11OY_GPU_LABEL, sudo a11oy-rebuild, commit
a11oy-rebuild to ops/ (STEP 4); fix key_resolution to report the true local provider.

PROVE (close #324 only when ALL true): a real T2 AND T3 /code/chat/stream turn serves the LOCAL
tag with cost_usd 0/absent (NOT a router 70B at per-token USD); healthz sovereign:true with
key_resolution.base_url=100.125.77.31:11434 and env_used!=HF_TOKEN; /v1/code/models endpoint=Ollama.

HONESTY FLOOR: if the GPU truly cannot serve the tier turns or the app can't reach the tailnet,
HONEST-REVERT to sovereign:false/hf-router (unset the envs + rebuild). The half-state is the ONLY
unacceptable outcome. open-weight only; never commit a key; locked=8; Λ=Conj1; BFT=Conj2.

## R0-FINISH (top priority) — CLOSE THE SOVEREIGN OVERCLAIM (a11oy #324), no bandaid

Dispatch is WIRED (forge-agent-manual, ok:true) and you have box+GPU access. Founder directive:
finish this AUTONOMOUSLY end-to-end — gather the box facts yourself, then complete the fix so
sovereign:true is GENUINELY TRUE (governed turns actually serve on the GPU), not just the banner.

### The gap (your own #324, verified live 02:40Z)
healthz banner = sovereign:true / self-hosted-gpu, BUT live POST /api/a11oy/code/chat/stream
turns still serve Llama-3.3-70B at per-token cost_usd = the HF ROUTER. `_call_model_stream` /
`_call_model` in a11oy_code_orchestrator.py are hard-coded to HF_ROUTER_BASE and never read
A11OY_MODEL_BASE_URL. key_resolution still cosmetically reports hf-router. THIS IS THE OVERCLAIM.

### Do all of it (you have the box — get the facts, don't ask):
1) On the betterwithage GPU node: `ollama list` — capture exactly what's pulled. If the tier
   primaries (T2 Llama-3.3-70B, T3 Qwen2.5-Coder-32B) are NOT served, EITHER `ollama pull` them
   if the GPU has capacity, OR build a tier->local-model map to a served open-weight tag
   (e.g. all tiers -> llama3.1:8b / qwen2.5-coder:7b). Open-weight ONLY.
2) From the a-11-oy.com APP container: `curl -s http://100.125.77.31:11434/v1/models` — confirm the
   Tailscale Ollama endpoint is reachable from where the app actually runs. If not reachable,
   fix the tailnet wiring so it is (the app must reach the GPU, not just the box).
3) Apply your Part-1 patch (the ast-validated _serving_base()/_serving_is_local()/_inference_headers
   diff in #324) so chat/stream + non-stream route through A11OY_MODEL_BASE_URL at call time, with
   the model-name map from step 1. Local endpoint needs NO HF token; never 503 a real local backend.
4) Also commit the patched `a11oy-rebuild` to a tracked path (ops/a11oy-rebuild) — close the R0b
   reproducibility hole (currently uncommitted on box).
5) Make key_resolution report the TRUE serving provider (local/self-hosted-gpu) when serving local,
   not the cosmetic hf-router fallback.

### PROVE (report to a11oy #324 + platform#343, close #324 when all true):
  - POST /api/a11oy/code/chat/stream (T2 AND T3): route.model is the LOCAL served tag,
    cost_usd absent/0 (NOT a 70B at per-token USD), provider != hf-router.
  - GET /api/a11oy/code/healthz: sovereign:true AND key_resolution.base_url = the local endpoint
    (NOT router.huggingface.co), env_used != HF_TOKEN.
  - GET /api/a11oy/v1/code/models: endpoint = the Ollama base, backend.sovereign:true.

### HONESTY FLOOR (v11/v12) — the half-state is the ONLY unacceptable outcome
If you CANNOT make the GPU genuinely serve the governed turns (model map incomplete, tailnet
unreachable, GPU asleep), then run the HONEST REVERT: unset A11OY_MODEL_BASE_URL + A11OY_GPU_LABEL,
sudo a11oy-rebuild -> banner honestly returns to sovereign:false / hf-router. Do NOT leave the
banner claiming sovereign while turns route to HF. open-weight only; never commit a key; locked=8;
Λ=Conjecture 1; BFT=Conjecture 2. Report which outcome you reached, with the proof turns.


--- (R0-GO record, completed) ---
## R0-GO (ADMIN GREEN LIGHT — 2026-06-13 ~02:16 UTC / 22:16 ET) — EXECUTE THE GPU FLIP NOW

Founder Stephen confirms: the box dispatch is WIRED and you have FULL ADMIN / root access to
the Hetzner box (167.233.50.75). This is the explicit human approval gate your Rule 4 requires —
it is GRANTED. You are cleared to make the prod/Hetzner change. Execute autonomously, hands-off.

DO IT NOW (open-weight, OpenAI-compatible, on the betterwithage GPU):
  1) ollama pull qwen2.5-coder:7b           # keep llama3.1:8b serving too
  2) curl -s http://127.0.0.1:11434/v1/models   # MUST 200 with the model BEFORE step 4
  3) set on the a-11-oy.com deploy env (NOT committed):
       A11OY_MODEL_BASE_URL=http://127.0.0.1:11434/v1
       A11OY_GPU_LABEL="NVIDIA RTX 5000 @ Hetzner (betterwithage)"
  4) sudo a11oy-rebuild

PROVE (report to platform#343, NOT to the token file):
  curl -s https://a-11-oy.com/api/a11oy/code/healthz \
    | jq '.sovereign,.inference,.key_resolution.base_url,.key_resolution.env_used'
  WANT: true  "self-hosted-gpu"  "http://127.0.0.1:11434/v1"  (env_used != "HF_TOKEN")
  + one /api/a11oy/code/chat/stream turn whose route.model is the local tag, cost_usd absent/0.

HONESTY FLOOR (v11) — non-negotiable:
  - Make /v1/models succeed FIRST. If the model server is NOT up at rebuild time, the app
    CORRECTLY stays sovereign:false / hf-router — that is fine, NOT an overclaim. The ONLY
    unacceptable outcome is the half-state (env set + server down). If you cannot serve the
    model, run the honest revert (unset both envs + sudo a11oy-rebuild -> sovereign:false).
  - open-weight ONLY, never commit a key, locked=8, Λ=Conjecture 1, BFT=Conjecture 2.
  - While on the box, also do R0b: systemctl status a11oy-autodeploy.timer; run
    /usr/local/bin/a11oy-autodeploy-check; commit the real a11oy-rebuild to ops/a11oy-rebuild.
Full detail + commands: replit-sync/forge-CODE-DONE-box-only-20260612-2148.md.


## R0 (NEW, top priority) — a-11-oy.com sovereign flip: CODE IS DONE, only the box remains
LIVE NOW (verified 02:13 UTC): /api/a11oy/code/healthz -> sovereign:false, inference:hf-router, base_url:router.huggingface.co/v1, model Qwen2.5-Coder-32B (open-weight, honest). Goal: flip to self-hosted-gpu. Root cause is NOT permission (founder-approved) — it is dispatch_mode:none (no FORGE_DISPATCH_CMD wired). Full box-only detail + exact commands: replit-sync/forge-CODE-DONE-box-only-20260612-2148.md.
The serving-path rewire (#324) shipped + verified live: a11oy main HEAD 730dc929
(blob 91a7fb28), deployed byte-identical to SZLHOLDINGS/a11oy (oid match), ast.parse-clean,
NO regression (HF Space stays HONEST: sovereign:false / hf-router; router turns work;
Khipu chain_verified:true). What changed: _call_model + _call_model_stream now POST to a
call-time _serving_base() that returns the LOCAL endpoint the instant A11OY_MODEL_BASE_URL
is non-router AND _local_endpoint_reachable() passes — else HF Router; _inference_headers
(is_local) drops the HF bearer for local; an env-overridable tier->local-model map
(A11OY_LOCAL_CODE_MODEL=qwen2.5-coder:7b, A11OY_LOCAL_GENERAL_MODEL=llama3.1:8b) maps tags;
cost_usd=0 on local turns. Serving path + reported posture derive from the SAME probe, so
the overclaim is now STRUCTURALLY impossible.
=> NO further app-code change is needed. To make a-11-oy.com genuinely sovereign, the only
remaining action is ON THE BOX (your Rule-4 founder-gate):
  1) serve an open-weight model on the betterwithage GPU, OpenAI-compatible
     (ollama pull qwen2.5-coder:7b; keep llama3.1:8b) — verify: curl -s http://127.0.0.1:11434/v1/models
  2) set on the a-11-oy.com deploy env: A11OY_MODEL_BASE_URL=http://127.0.0.1:11434/v1 and
     A11OY_GPU_LABEL="NVIDIA RTX 5000 @ Hetzner (betterwithage)"
  3) sudo a11oy-rebuild
PROVE (report to platform#343, not the token):
  curl -s https://a-11-oy.com/api/a11oy/code/healthz | jq '.sovereign,.inference,.key_resolution.base_url,.key_resolution.env_used'
  WANT: true "self-hosted-gpu" "http://127.0.0.1:11434/v1" (NOT router.huggingface.co), env_used != "HF_TOKEN";
  + one /api/a11oy/code/chat/stream turn whose route.model is the local tag with NO cost_usd.
If the model server isn't reachable at rebuild time the app CORRECTLY stays sovereign:false /
hf-router (no overclaim) — so make /v1/models succeed BEFORE the rebuild. If you cannot serve
the model before Warhacker, run the honest revert (unset A11OY_MODEL_BASE_URL + A11OY_GPU_LABEL,
sudo a11oy-rebuild -> sovereign:false). The half-state is the only unacceptable outcome.
Founder approval for the box step: GRANTED by Stephen (this order). Detail mirror:
a11oy/platform/replit-sync/forge-CODE-DONE-box-only-20260612-2148.md.

## R0b — #323 autodeploy loop (while on the box)
systemctl status a11oy-autodeploy.timer; sudo /usr/local/bin/a11oy-autodeploy-check; echo exit=$?;
commit the real a11oy-rebuild to ops/a11oy-rebuild (currently uncommitted = reproducibility hole).

## R1 (highest leverage) — extract szl_core shared library
verticals / receipts / health / connectors / governance_client — both a11oy + killinchu import it;
delete duplicated a11oy_vertical_feeds + shared connector code from app trees; feed responses stay
BYTE-IDENTICAL (golden-file tests). killinchu effector stays OUT of szl_core (SIMULATED enforced).

## R2 — de-commit the stale mirror
organs/amaru/.hf-mirror/serve.py (94KB) stale committed mirror -> generated + git-ignored; CI fails
if a committed mirror reappears. Verify the live Space imports the real source before deleting.

## R3 — Pepr P1: real single-key DSSE verify in the receipt gates
Implement actual signature verify in a11oy/killinchu-receipt-gate.ts; tampered/unsigned => DENIED
(neg+pos tests). Label EXACTLY "single-key DSSE verified; threshold=P2 roadmap, ledger=P3 roadmap".
Keys via Zarf, NEVER committed.

## R4 — serve.py god-file (470KB): SERIALIZED single-owner refactor into szl_core
Exclusive refactor lock (no parallel edits — live + cosign-signed + double-mirrored). Small PRs,
each preserving the route surface, per-step snapshot tests. NOT a big-bang.

## R6 — finance data lineage
Add Polygon.io (official API + WebSocket live ticks) and Frankfurter (ECB FX) alongside Coinbase;
keep yfinance as a LABELED fallback. Honest freshness labels.

## Gated (report, don't fake): R5 SLSA L1->L3 needs cosign key (founder); R7 box dispatch wiring
needs /etc/forge-perplexity.env (founder — WIRE_IT_UP.sh ready, run AS ROOT on 167.233.50.75 to
make Forge box-dispatch hands-off; that same one-paste also unblocks R0/R0b autonomously).

## Honesty floor (v11): never keystone self-merge, never commit a key, never weaken a gate, label
live only on real 200, locked=8, Λ=Conjecture 1, BFT=Conjecture 2.
