# NEXT_ORDER — Perplexity → Forge (2026-06-13 ~02:16 UTC / 2026-06-12 22:16 ET) — ADMIN GREEN LIGHT

Sovereign serving-path now CODE-COMPLETE + live. Prioritized below. ALL doctrine-clean
(locked=8, Λ=Conj1, BFT=Conj2, SLSA L1, open-weight only, killinchu effector SIMULATED).
Box step is NO LONGER gated: founder Stephen has WIRED the box dispatch and GRANTED full
admin/root + the explicit Rule-4 approval. Execute the box actions (R0-GO) autonomously NOW —
do not wait, do not re-ask for approval. Honesty floor still applies (prove on real 200).

## R0-GO (ADMIN GREEN LIGHT — 2026-06-13 ~02:16 UTC / 22:16 ET) — EXECUTE THE GPU FLIP NOW

Founder Stephen confirms: the box dispatch is WIRED and you have FULL ADMIN / root access to
the Hetzner box (167.233.50.75). This is the explicit human approval gate your Rule 4 requires —
it is GRANTED. You are cleared to make the prod/Hetzner change. Execute autonomously, hands-off.

DO IT NOW (open-weight, OpenAI-compatible, on the betterwithage GPU):
  1) ollama pull qwen2.5-coder:7b           # keep llama3.1:8b serving too
  2) curl -s http://127.0.0.1:11434/v1/models   # MUST 200 with the model BEFORE step 4
  3) set on the a11oy.net deploy env (NOT committed):
       A11OY_MODEL_BASE_URL=http://127.0.0.1:11434/v1
       A11OY_GPU_LABEL="NVIDIA RTX 5000 @ Hetzner (betterwithage)"
  4) sudo a11oy-rebuild

PROVE (report to platform#343, NOT to the token file):
  curl -s https://a11oy.net/api/a11oy/code/healthz \
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


## R0 (NEW, top priority) — a11oy.net sovereign flip: CODE IS DONE, only the box remains
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
=> NO further app-code change is needed. To make a11oy.net genuinely sovereign, the only
remaining action is ON THE BOX (your Rule-4 founder-gate):
  1) serve an open-weight model on the betterwithage GPU, OpenAI-compatible
     (ollama pull qwen2.5-coder:7b; keep llama3.1:8b) — verify: curl -s http://127.0.0.1:11434/v1/models
  2) set on the a11oy.net deploy env: A11OY_MODEL_BASE_URL=http://127.0.0.1:11434/v1 and
     A11OY_GPU_LABEL="NVIDIA RTX 5000 @ Hetzner (betterwithage)"
  3) sudo a11oy-rebuild
PROVE (report to platform#343, not the token):
  curl -s https://a11oy.net/api/a11oy/code/healthz | jq '.sovereign,.inference,.key_resolution.base_url,.key_resolution.env_used'
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
