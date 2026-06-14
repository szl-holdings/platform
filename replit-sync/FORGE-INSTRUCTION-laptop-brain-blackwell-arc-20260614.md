# SZL Forge — ORDER: Wire the founder laptop as sovereign BRAIN + secondary app-host (Blackwell 5050 + Arc 140T iGPU)

**Pinned: 2026-06-14 ~18:15 EDT. Founder-directed.**
**Demo: June 18 (founder demos). FREEZE activates 2026-06-18 02:00 ET — finish well before.**

## Context (verified live from the founder's `ollama serve` startup log, 2026-06-14 17:54 ET)
The founder laptop `betterwithage` (Tailscale `100.125.77.31`) has TWO usable compute devices,
both confirmed by Ollama's own GPU discovery:

1. **NVIDIA GeForce RTX 5050 Laptop GPU** — `library=CUDA driver=13.3 compute=12.0` (**BLACKWELL**,
   working, not CPU-fallback), `total=8.0 GiB / 6.9 GiB free`. PRIMARY inference lane.
2. **Intel Arc 140T iGPU (Core Ultra 9)** — Ollama logged
   `"dropping integrated GPU; to enable, set OLLAMA_IGPU_ENABLE=1"`, device
   `Intel(R) Arc(TM) 140T GPU (16GB)`, `OLLAMA_VULKAN:true` already set. **16 GB is SHARED system
   RAM, NOT dedicated VRAM** — label honestly everywhere. SECOND lane (small model / offload).
3. Current `OLLAMA_HOST:http://127.0.0.1:11434` → localhost only; the tailnet mesh CANNOT reach it.

## DO (in order)
1. **Expose the brain to the tailnet.** Set `OLLAMA_HOST=0.0.0.0:11434` so it answers at
   `100.125.77.31:11434` over Tailscale. Tailscale ACL keeps it tailnet-only — NEVER bind to the
   public internet iface. Use Task Scheduler to own `ollama serve` directly (detached, survives
   SSH close), per the founder's own working note.
2. **Enable the second lane.** Set `OLLAMA_IGPU_ENABLE=1` (Vulkan already on). Re-run discovery;
   confirm Ollama lists BOTH the RTX 5050 (CUDA) and Arc 140T (Vulkan).
3. **Fix the mesh probe to be multi-backend.** `team/AUDIT/mesh/mesh_join.sh` currently probes
   `nvidia-smi` only and would MISS the Arc iGPU. Extend it to also parse Ollama/Vulkan GPU
   discovery (`vulkaninfo --summary` or `ollama` GPU lines) and record per device:
   `{gpu_name, vram_mb, backend: cuda|vulkan, shared_ram: true|false}`.
4. **Run the coordinator + placement** (`team/AUDIT/mesh/mesh_serve.py`, plan-only emitter).
   Placement rules: SZL-Nemo = governed **Qwen3-32B Apache** at Q4_K_M/FP4 on the **5050**
   (largest that fits ~7 GiB); a SMALL model (e.g. 7B Q4) on the **Arc** lane. NEVER shard a 32B
   onto a `shared_ram:true` iGPU lane.
5. **Point a11oy at the mesh.** `A11OY_MODEL_BASE_URL` → coordinator (tailnet IP). Keep HF-router
   failover intact.
6. **Secondary app-host on the laptop (founder request).** Also run a11oy + killinchu LOCALLY on
   the laptop (docker compose or per-app `serve.py`), reachable over the tailnet, as a
   sovereignty/failover host. **KEEP HETZNER `a11oy.net` (167.233.50.75) AS PRIMARY PUBLIC HOST**
   for the demo — the laptop is NOT always-on, so the demo must not depend on it. HF = tertiary.
7. **Fold in tonight's RTX 4000 + other nodes** via the existing any-GPU auto-detect
   (`FORGE-INSTRUCTION-rtx4000-rig-onboard-20260614.md` + `mesh_join.sh`). Auto-detect VRAM,
   auto-tier, no hardcoded card/count.

## Reference artifacts (already in repo under team/AUDIT/mesh in the agent workspace; mirrored here)
`MESH_TOPOLOGY.md`, `mesh_join.sh`, `mesh_serve.py`, `A11OY_MESH_ROUTING.md`, `FORGE_MESH_ORDER.md`
(see the 2026-06-14 ADDENDUM in FORGE_MESH_ORDER.md for the full Blackwell/Arc detail + verification checklist).

## DOCTRINE (hard gates — never violate)
- SZL-Nemo = governed serving of OPEN Qwen3-32B Apache-2.0. NEVER from-scratch / 550B / local-Ultra
  (Nemotron Ultra = cloud-NIM verified tier only).
- Label honestly: 5050 = 8 GB **discrete Blackwell**; Arc 140T = **shared-RAM** (not 16 GB VRAM).
  Trust never 100%. Data labeled LIVE/SAMPLE/MODELED.
- **Never commit a key** (TS auth key, HF token, coordinator token → secret store / env only).
- 0 runtime CDN. Locked = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17. Λ=Conjecture 1.
- Honest BLOCKED beats a fake "wired." If a device won't expose or a lane won't serve, report it.

## VERIFY (paste proof in your report)
- `100.125.77.31:11434/api/version` reachable from another tailnet node (200).
- Ollama lists BOTH devices after `OLLAMA_IGPU_ENABLE=1`.
- `mesh_join.sh` capability JSON shows both, correct backend + shared_ram flags.
- Coordinator placement: SZL-Nemo on 5050, small model on Arc.
- Laptop secondary a11oy/killinchu reachable over tailnet; Hetzner still primary public.
- a11oy `A11OY_MODEL_BASE_URL` → coordinator; HF failover intact.
