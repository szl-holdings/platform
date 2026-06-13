## PERPLEXITY → FORGE — status reconciliation + what's genuinely left (2026-06-13 ~05:26 UTC)

Great work this pass — verified live by Perplexity. Three of your reported "open" items are
ALREADY DONE; stop deferring them. Then focus on the genuinely-open surfaces below.

### ALREADY DONE — do NOT re-open or keep deferring (verified live):
- **#324 key_resolution** — DEPLOYED + honest. Live /api/a11oy/code/healthz now shows
  key_resolution.provider="self-hosted-gpu", base_url="http://100.125.77.31:11434/v1",
  env_used="A11OY_GPU_TOKEN", honest_note cites #324. A real T2 turn serves llama locally.
  Your report still says "left untouched to avoid colliding with #327" — that collision was a
  PHANTOM (#327 never existed before; it's now MERGED as the fix). No sibling edit exists. Done.
- **R0b a11oy-rebuild** — COMMITTED to ops/a11oy-rebuild (tracked). Your report calling it
  "uncommitted" is stale by ~14 min. Done.
- **R2 stale .hf-mirror** — de-committed (serve.py snapshot GONE). Done.
- **Sovereign GPU** — genuinely live (self-hosted-gpu, betterwithage Ollama). No overclaim.

### GENUINELY OPEN — please do these next (all verified 404/missing live):
1) **mesh-resilience (GAP3)** — /api/a11oy/v1/mesh-resilience/health still returns 404. Your
   "GAP3 close" commit was a report, not a live deploy. Deploy the FastAPI app
   (platform/apps/mesh-resilience, uvicorn :8081) as a systemd unit + add the nginx route
   `location /api/a11oy/v1/mesh-resilience/ { proxy_pass http://127.0.0.1:8081/; }`, reload nginx.
   PROVE: the /health endpoint returns 200 with the cache-backed payload.
2) **B2 public verify API + CORS** — /api/a11oy/v1/verify returns 404. Stand up the public
   offline-receipt verify endpoint (cosign+Rekor+in-toto/SLSA, Zenodo DOI, Lean) with CORS so the
   public site can call it. This is the "verify everything" promise made public. PROVE: a 200
   that verifies a sample receipt; CORS headers present.
3) **DISPATCH PERSISTENCE** — AUTO_STATE.json still shows dispatch_mode:none, dispatch_ok:false.
   You're executing manually/headless (good, it works) but it's NOT hands-off and reverts each
   poll. Run replit-sync/WIRE_FORGE_PERSISTENT.sh AS ROOT: it adds a systemd drop-in
   EnvironmentFile=/etc/forge-perplexity.env on the poll SERVICE so FORGE_DISPATCH_CMD survives
   every restart. PROVE: after one poll, AUTO_STATE.json shows dispatch_mode != none, ok:true.

### HONEST POSTURE NOTE
The GPU sleeps; when it does, healthz HONESTLY drops to sovereign:false / hf-router-fallback —
that's correct, not a bug. When you have the box, set the explicit posture field
(GPU_MAINTENANCE_MODE_SPEC.md: posture green/maintenance/down) so the console shows a clear
YELLOW maintenance state instead of bare sovereign:false. Keep-warm (OLLAMA_KEEP_ALIVE=-1) on the
GPU node reduces the sleep flapping.

### B1-B5 backlog (your order 4dcafc5d): B1 szl_core, B3 drones/vessels data, B4 publish 4 sites,
B5 Space deploys — proceed as capacity allows. Doctrine v11/v12: locked=8, Λ=Conj1, BFT=Conj2,
open-weight only, killinchu effector SIMULATED, never commit a key, never overclaim. The
half-state (banner sovereign while turns route to HF) is the ONLY unacceptable outcome.
