# SZL Forge — HARDWARE TRUTH (2026-06-15 01:17 EDT): the 4060 Ti is on a SEPARATE DESKTOP rig (2-node mesh)

Founder NVIDIA-App "My Rig" screenshot confirms a SECOND machine, distinct from the laptop:

## NODE 2 — DESKTOP "OMEN" (NEW)
- OS: Windows 11 Home (build 26200)
- CPU: **AMD Ryzen 7 8700G** w/ integrated **Radeon 780M** iGPU
- RAM: 16 GB · SSD: 954 GB
- GPU: **NVIDIA GeForce RTX 4060 Ti** (VRAM 8GB-vs-16GB NOT shown on panel — MUST detect via `nvidia-smi`)
- Display: HP OMEN 27i 1440p (irrelevant to serving)

## NODE 1 — LAPTOP "betterwithage" (100.70.130.45) — unchanged
- Intel Core Ultra 9 + Intel Arc 140T iGPU + **Blackwell RTX 5050 (8GB)**; llama/ollama RUNNING.

## CORRECTION
The Intel Arc 140T belongs to the LAPTOP, not this desktop. This desktop's iGPU is the **Radeon 780M**
(AMD, Vulkan/ROCm path). So the mesh now has TWO NVIDIA CUDA nodes + two different iGPUs. Update any
doc that implied one machine.

## DO
1. Join the DESKTOP to the `betterwithage` tailnet (Tailscale). Record its tailnet IP + MagicDNS name.
2. Run the multi-backend probe on it: `nvidia-smi` -> RTX 4060 Ti + EXACT VRAM (decides tier);
   detect Radeon 780M via Vulkan/ROCm as a possible 2nd lane (label shared-RAM, honest).
3. PLACEMENT (coordinator recompute):
   - IF 4060 Ti == 16GB: make the DESKTOP the PRIMARY SZL-Nemo node (governed Qwen3-32B Apache, Q4) —
     it's a desktop (better always-on than the laptop). Laptop 5050 = secondary / 2nd model / embeddings.
   - IF 4060 Ti == 8GB: desktop = strong 2nd CUDA lane (7-14B / failover); laptop stays primary brain.
   - Optionally TP-shard the 32B across 4060Ti(desktop)+5050(laptop) ONLY if the tailnet link is fast
     enough — measure tok/s first; if the cross-machine link is slow, do NOT shard across machines
     (same lesson as the 5050<->Arc slow bridge) — run whole models per node instead.
4. Prefer MagicDNS names over raw IPs everywhere (laptop IP already drifted once: 100.125.77.31 -> 100.70.130.45).
5. a11oy coordinator load-balances across both NVIDIA nodes; HF-router failover stays.

## PROVE: nvidia-smi on desktop shows 4060 Ti + VRAM; desktop reachable on tailnet (api/version 200);
coordinator placement table lists BOTH nodes with correct tiers; a chat turn served sovereignly; joules MEASURED.

## DOCTRINE: SZL-Nemo = governed Qwen3-32B Apache only (never from-scratch/Ultra/M3-derivative). Label VRAM
honestly (discrete vs shared). Trust never 100%. Never commit a key. Tailnet-only exposure (Tailscale ACL).
