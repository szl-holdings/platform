# SZL Forge — INSPECTION + VERIFY-ON-GPU-ONLINE (founder is at the box NOW)

Read replit-sync/FREEZE.json first. (Freeze not yet active → alignment + verify allowed.)

## SITUATION
The founder is at home running team/AUDIT/gpu/BOX_GPU_RUNBOOK.md RIGHT NOW: bringing up
Qwen2.5-7B on the box GPU (vLLM/Ollama :8000), Tailscale, and setting SZL_GPU_BASE_URL in BOTH
HF Spaces' secret store, then factory-restarting them. The box itself is FOUNDER-GATED — you do
NOT touch the box. Your job is the INSPECTION + everything around it.

## INSPECTION (run a full estate inspection, report to AUTO_STATE + notify only if a real issue)
1. INFERENCE POSTURE: poll GET https://szlholdings-killinchu.hf.space/api/killinchu/v4/inference-posture
   and .../a11oy/api/szl/v1/inference-posture. Confirm they report HONESTLY:
   - while the box link is down → where:offline/fallback, sovereign:false (CORRECT, not a bug).
   - the MOMENT the founder's GPU is reachable + secret set + Space restarted → where:gpu,
     sovereign:true, gpu_reachable:true, local_llm_online:true. Confirm the flip happened.
   KEY INVARIANT to verify: sovereign:true ONLY when a live /v1/models probe succeeded this request.
   A dropped link must NEVER show sovereign:true. If you ever see sovereign:true with
   gpu_reachable:false → that's a real defect, notify immediately.
2. HEALTHZ HONESTY: both Spaces' /v4/healthz + a11oy.net/v4/healthz — doctrine v11, locked=8
   {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17, Λ=Conjecture 1. Flag any stale/overclaim.
3. BYTE-IDENTICAL: operator_shell_v4.py (the LLM router) + shared szl_*.py + the maritime/feeds/asw
   modules — GitHub HEAD == HF Space, all present in serve.py register + Dockerfile COPY + hf-sync
   APP_FILES. Re-mirror via workflow_dispatch if any module was skipped by the per-push detect gate.
4. CI: szl-holdings/killinchu + a11oy main green; drift guards + Overclaim + Doctrine + Dockerfile-copy
   + hf-sync-paths guards green.
5. LIVE SURFACES: /elite, /elite/globe, /jackin, the maritime endpoints (/feeds/*, /maritime/*, /asw/*)
   all 200. Effector SIMULATED everywhere.

## ON GPU-ONLINE (when posture flips sovereign:true)
Confirm both Spaces show sovereign:true honestly, the box a11oy.net/v4/healthz shows sovereign:true,
and notify the founder: "SZL inference now sovereign on your GPU — verified by live /models probe."

## DOCTRINE HARD GATE
locked=8 @ c7c0ba17 · Λ=Conjecture 1 · Khipu=Conjecture 2 · trust never 100% · effector SIMULATED ·
no vessel control · real LIVE / FORECAST / SAMPLE labeled · 0 runtime CDN · GitHub↔HF byte-identical ·
never commit a key · box=founder gate · sovereign only on a live successful GPU probe.

## FREEZE: activates 06-16. Inspection/verify/alignment allowed now; read-only in the window.
NOTIFY only on: sovereign flip confirmed, a real overclaim/half-state, byte-drift, or CI red.
