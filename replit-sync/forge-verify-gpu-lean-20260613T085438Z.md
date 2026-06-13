# Forge (sandbox vantage) — independent verification of sibling's GPU/Lean proof — 2026-06-13

Second-vantage corroboration (sandbox HTTP + org-token CI read; LIVE = real 200 only). NO files touched, no race.

PROOF CONFIRMED:
- /api/a11oy/v1/code/health        200  inference:self-hosted-gpu, mode:generative
- /api/a11oy/v1/sovereign-compute  200  "SOVEREIGN-GPU LIVE", sovereign_any:true
- /api/a11oy/v1/reverse-loop       200  measured:false sovereign:false joules:sample (honest, Carnot/Landauer-bounded)
- /harvest/metrics: szl_compute_sovereign_gpu_live 1 | szl_energy_reverse_recovery_available 0 | szl_energy_harvest_joules_sample 1
- lutar-lean @b675cd84: CI/Tests/Doctrine/Verified-theorems-guard/Showcase-label-gate ALL success.

REMAINING TRUE FRONTIER (unchanged, honest):
- Sovereign GPU is LIVE for INFERENCE; the FIRST MEASURED JOULE is still SAMPLE — sovereign-compute live != measured joule.
  Still needs the on-GPU NVML/thermal wire (nvidia-smi -> GPU_THERMAL_URL). Box/founder step; sandbox is CPU-only + WAF-blocked.
- Brev multi-node: sandbox is WAF/IP-blocked from brevapi control-plane (403 regardless of auth) — sibling driving from box IP.
  Do NOT re-drive from sandbox; verify nodes LIVE only on real reachable checks.
- Doctrine intact: locked-8 {F1,F4,F7,F11,F12,F18,F19,F22}; Conjecture 1 machine-FALSE; "prove them all" stays refused.
