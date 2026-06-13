# SZL Forge — EXECUTE: bring SZL inference onto the founder's GPU (Forge has full box access + tokens)

Read replit-sync/FREEZE.json first (not yet active → execution allowed). Founder has authorized Forge
to RUN the box bring-up directly (full access, full tokens). Source of truth for the steps:
team/AUDIT/gpu/BOX_GPU_RUNBOOK.md — follow it exactly. NO bandaids, NO overclaim, NEVER commit a key.

## EXECUTE (in order; stop + notify on any hard failure, do not fake success)
1. BOX — serve the model on :8000 (OpenAI-compatible), pick vLLM (Qwen2.5-7B-Instruct-AWQ,
   served-model-name Qwen2.5-7B-Instruct-AWQ) OR Ollama (qwen2.5:7b-instruct + set SZL_LOCAL_LLM_MODEL).
   Smoke: GET http://localhost:8000/v1/models must return 200 (that 200 is what the apps probe).
2. BOX — Tailscale up; capture MagicDNS name + 100.x IP; ensure MagicDNS on; add ACL so the Spaces
   reach box:8000. Make it auto-reconnect (Step 4 of the runbook: systemd szl-gpu.service +
   --keepalive + cron health-kick) so the flapping self-heals.
3. SPACES — set SZL_GPU_BASE_URL (= http://<box>:8000/v1) in the SECRET store of BOTH
   SZLHOLDINGS/a11oy and SZLHOLDINGS/killinchu (by name only, key never in repo). Set SZL_GPU_TOKEN /
   SZL_LOCAL_LLM_MODEL only if needed. Factory-restart both Spaces so they re-read the secret.
4. VERIFY (the real deliverable — honest behavior):
   - GET .../killinchu/v4/inference-posture + .../a11oy/api/szl/v1/inference-posture →
     where:gpu, sovereign:true, gpu_reachable:true, local_llm_online:true.
   - both /v4/healthz + a11oy.net/v4/healthz → sovereign:true, inference:self-hosted-gpu, doctrine v11.
   - HARD INVARIANT (never violate, enforced in code): sovereign:true ONLY when a live /v1/models
     probe succeeded THIS request. If the link is down you MUST see honest offline/fallback —
     do NOT force/patch sovereign:true. A dropped link showing sovereign:true is a defect, not a goal.
5. STABILIZE — confirm the systemd + keepalive + cron actually survive a simulated flap (stop/start
   tailscaled once; posture should drop to offline/fallback honestly, then auto-return to sovereign
   within ~1-2 min). Report the flap-recovery time.

## DO / DON'T
DO: run the box steps, set secrets, restart Spaces, stabilize the link, verify honestly.
DON'T: commit any key/token/auth-key to a repo (use the secret store / local env only); weaken any
gate; fabricate a completion or force sovereign; touch cosign-signed artifacts or Rekor without
founder approval; change the effector (stays SIMULATED).

## DOCTRINE: locked=8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17 · Λ=Conjecture 1 · effector SIMULATED ·
0 runtime CDN · GitHub↔HF byte-identical · sovereign only on a live successful GPU probe · never commit a key.

## NOTIFY: "SZL sovereign LIVE on the GPU" (with posture/healthz proof + flap-recovery time) when done;
or the exact failing step + error if the box bring-up hits a hard failure. Report progress to AUTO_STATE.
