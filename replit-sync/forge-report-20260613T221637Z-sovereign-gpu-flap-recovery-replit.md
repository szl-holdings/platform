# Forge (Replit) — SOVEREIGN-GPU order: flap-recovery PROVEN, all 5 steps honest & live

Order: replit-sync/NEXT_ORDER.md @ 2b6c8cf ("bring SZL inference onto the founder's GPU").
AUTO_STATE already state=done (sibling Forge) — this is an ADDITIVE corroboration that closes
the one remaining un-proven deliverable: step 5 STABILIZE (real flap, measured recovery).
FREEZE.json: active=true but window is 2026-06-16..06-19; today is BEFORE activates_at →
normal work allowed (the order itself says "not yet active → execution allowed"). No keys committed,
no gate weakened, sovereign never forced.

## Live verification (read-only)
- a11oy /api/szl/v1/inference-posture -> where:gpu, sovereign:true, gpu_reachable:true, online:true,
  fallback_allowed:false, model qwen2.5-coder:7b, "verified by a live /models probe this request".
- killinchu /api/killinchu/v4/inference-posture -> same.
- killinchu /v4/healthz -> sovereign:true, inference:self-hosted-gpu, gpu_reachable:true,
  local_llm_online:true, doctrine v11, counts 749/14/163, lean_sha c7c0ba17.
- a11oy /healthz -> ok, doctrine v11, commit c7c0ba17 (a11oy carries the sovereign signal on its
  posture endpoint; its /v4 healthz path is killinchu-only, so a11oy uses /healthz + posture).
- Box (167.233.50.75) -> GPU betterwithage 100.125.77.31:11434 /v1/models returns 200 with
  qwen2.5-coder:7b + bge-large + llama3.1 present. tailscaled active, direct connection.
- Self-heal machinery present: tailscaled.service + szl-compute-gateway.service (OpenAI-compat LB
  over awake GPU nodes) + gpu-fabric-watch (wake-watcher). No literal "szl-gpu.service" — same capability.

## Step 5 — real flap test (no bandaid), measured on the box
SSH is over the PUBLIC box IP, so flapping the tailnet does NOT drop SSH or the public sites; it only
breaks box->GPU, which is exactly what must fall back honestly.
- BEFORE:  sovereign=True  gpu_reachable=True  where=gpu
- DURING (systemctl stop tailscaled): sovereign=False gpu_reachable=False where=offline,
  fallback_allowed=false  -> HONEST offline, NOT forced sovereign. HARD INVARIANT held under a real drop.
- RECOVERY (systemctl start tailscaled): back to sovereign:true,where:gpu in ~6 seconds (target 1-2 min).
- AFTER:   sovereign=True  gpu_reachable=True  where=gpu ; betterwithage link re-established (direct).

## Verdict
SZL inference is sovereign and LIVE on the founder's GPU on both organs, the honest-offline invariant
is enforced under a real link flap, and the link self-heals in ~6 s. Effector stays SIMULATED;
doctrine v11; locked=8 @ c7c0ba17; Lambda=Conjecture 1; GitHub<->HF byte-identical unaffected.
Measured-joule remains founder-gated (no NVML/exporter reachable on the Windows GPU node) — unchanged.
