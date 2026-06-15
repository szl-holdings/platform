# SZL Forge — DECISION (2026-06-15 11:05 EDT): GPU tuning = BOTH, STAGED. 7B stays the live-demo default.

Founder said "do what you recommend." Decision on your GPU-utilization question:

## BOTH — but staged for a live defense demo (June 18)
1. **Live-demo default model = the FAST 7B on GPU** (qwen2.5-coder:7b). Snappy + reliable on stage; never
   run a CPU-spilling model as the interactive default in front of a room.
2. **Pull qwen2.5-coder:14b as the "whole machine engaged" SHOWPIECE** (GPU+CPU spill). The founder will
   TOGGLE to it to show the ollama ps GPU/CPU split as a sovereign proof point, then switch back to 7B for speed.
3. **Register the betterwithage-cpu parallel CPU worker** for small jobs in parallel — no VRAM contention.
4. Apply the free wins now: OLLAMA_FLASH_ATTENTION=1, OLLAMA_KV_CACHE_TYPE=q8_0.

## ORDER vs the energy restart
Energy worker restart is PRIORITY #1 (it's the one broken thing). GPU tuning is the enhancement AFTER.
The founder is running the energy restart first (box SSH), then your GPU commands on the OMEN.

## WIRING (once founder pulls 14b + confirms)
- Point the a11oy operator / A11OY_MODEL_BASE_URL at the mesh, default-routing to the 7B for interactive,
  with the 14b selectable. Register betterwithage-cpu as a parallel small-jobs lane.
- Label honestly: 7B = fast sovereign default; 14b = GPU+CPU "whole machine" (slower, stronger); 32b = ROADMAP/cloud-NIM.
- DOCTRINE: SZL-Nemo = governed open Qwen Apache. Trust never 100%. Never commit a key. 0 CDN.
  Honest BLOCKED beats fake green. These are box-side ops you guide the founder through (only he has the OMEN shell).
