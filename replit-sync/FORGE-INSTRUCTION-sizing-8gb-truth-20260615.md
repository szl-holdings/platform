# SZL Forge — SIZING TRUTH (2026-06-15 01:21 EDT): 4060 Ti is the 8GB variant (nvidia-smi confirmed)

`nvidia-smi` on the desktop: RTX 4060 Ti, **8188 MiB total VRAM** = the **8GB** card. CUDA 13.2, driver 596.36.

## HONEST SIZING (no half-state)
- Desktop 8GB + laptop 5050 8GB = TWO 8GB CUDA nodes. Neither holds Qwen3-32B (needs ~20GB+ even Q4).
- THEREFORE: **SZL-Nemo at full 32B is NOT a single-node local story on this hardware.** Do NOT let any
  surface claim "32B running locally." Options: (a) PRIMARY served model = governed **7-14B** (Qwen3-8B/14B
  or the qwen2.5-coder:7b already loaded) — fast, sovereign, always-on on the desktop; (b) 32B = cross-machine
  TP shard ONLY if the tailnet link benchmarks fast enough (measure tok/s; cross-internet usually too slow ->
  skip); (c) 32B stays cloud-NIM / box ROADMAP tier, labeled ROADMAP.
- UPDATE the desktop always-on order accordingly: serve a governed 7-14B as the primary sovereign model on
  the 4060 Ti; keep 32B honestly labeled ROADMAP. Two-node mesh load-balances the 7-14B + embeddings/RAG.

## DOCTRINE: label model size + VRAM honestly everywhere (energy/sovereign, /honest, any tab). SZL-Nemo =
governed open Qwen3 Apache. Trust never 100%. The half-state (claiming a local 32B that doesn't fit) is the
only unacceptable outcome — size it to what 8GB+8GB actually serves.
