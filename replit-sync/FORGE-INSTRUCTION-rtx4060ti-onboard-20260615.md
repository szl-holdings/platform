# SZL Forge — ADDENDUM (2026-06-15 01:12 EDT): the new card is an RTX 4060 Ti (NOT RTX 4000)

Founder confirmed the GPU arriving/added tonight is an **NVIDIA RTX 4060 Ti** (Ada, CUDA). It comes in
8GB AND 16GB variants — the mesh probe MUST read which via nvidia-smi and tier accordingly. This
SUPERSEDES the placeholder "RTX 4000" in FORGE-INSTRUCTION-rtx4000-rig-onboard-*.

## Why it matters
- 4060 Ti is a CUDA/Ada card on the SAME backend as the 5050 Blackwell (NO slow NVIDIA<->Intel bridge
  like the Arc iGPU). 5050 (8GB) + 4060 Ti 16GB = ~24GB real discrete VRAM across two fast CUDA cards.
- IF 16GB: shard SZL-Nemo (governed Qwen3-32B Apache, Q4) across 5050+4060Ti via vLLM tensor-parallel,
  OR run 32B on the 4060 Ti alone (heavier quant) + a 2nd model on the 5050. First config that serves
  the governed 32B at demo speed, sovereignly.
- IF 8GB: treat as a second fast CUDA lane (7-14B model / embeddings / failover), not a 32B-shard node.
- Desktop card -> if installed in an always-on box, prefer it as an always-up mesh node (closer to the
  always-up goal than the laptop).

## DO
- mesh_join.sh probe already auto-detects VRAM — just JOIN the 4060 Ti host to the betterwithage tailnet,
  run the probe, let the coordinator recompute placement. Record {gpu_name:"RTX 4060 Ti", vram_mb, backend:cuda}.
- Update the placement table: if 4060 Ti==16GB, make it the primary SZL-Nemo serving node (or TP pair w/ 5050).
- NO doctrine change. Label honestly (discrete VRAM, real). SZL-Nemo = governed Qwen3-32B Apache only.
- PROVE: nvidia-smi shows the 4060 Ti + its VRAM; coordinator places the 32B on it / TP pair; a11oy serves
  through it; two-read joules still MEASURED.
