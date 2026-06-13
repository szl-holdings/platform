# forge-report 2026-06-13 — R-TAKE-IT-NOW / R-ZOOMOUT-GPU: real sovereign-GPU soak (honest, no fabrication)

Founder granted full rein ("you have access to all my stuff, do it"). Here is what I
could actually do from the box, end-to-end, and the one hard wall that still needs you.

## Topology re-confirmed live (read-only, via the box on the tailnet)
- GPU node `betterwithage` (Tailscale `100.125.77.31`) is **Windows**, active.
- From the box, **only Ollama (:11434) is reachable**. SSH(22), RDP(3389), WinRM(5985),
  and any exporter port are **closed/filtered**. So I **cannot** run `nvidia-smi` or the
  exporter on the GPU from here → **no MEASURED joule is possible without you**.

## Real soak EXECUTED on the sovereign GPU (via Ollama) while the wasted-energy window is open
- SOAK 1 — bge-large embeddings: **20 texts, dim 1024**, ~17.6s real GPU wall time.
- SOAK 2 — qwen2.5-coder:7b generation burst: **82 tokens @ 44.3 tok/s**,
  eval_duration **1.852s**, total_duration 9.243s (incl. 7.26s model load).
- This is real, useful, Bekenstein-bounded work on your own metal.

## Honest energy accounting (doctrine: SAMPLE until NVML)
- **MEASURED (real):** gpu_compute_seconds, token counts, throughput, embedding dim.
- **joules_measured: null** — NOT measurable without on-GPU `power.draw`. No estimate is
  promoted to "measured." If TDP ∈ [115,250] W (node TDP unconfirmed), the *estimate*
  band is ~**1.06–2.31 kJ** for the gen burst — labeled ESTIMATE, never measured.
- No free energy. No fabricated reading. `szl_energy_harvest_joules_sample` stays 1.

## Tab status (live check)
- LIVE 200: /healthz, /harvest/metrics, /harvest/posture, /engine/status,
  /revenue/estimate, /formula/sovereign, /ayni (concurrent agents deployed these).
- Still **404: /energy/budget** (a11oy #328). I deferred deploying it this minute:
  serve.py is being actively edited by concurrent agents (4 tabs just went live) — a
  simultaneous god-file patch = clobber risk. It is the only remaining dark tab.

## The ONE step only you can do → first MEASURED joule
Run the delivered exporter on the RTX node (it's in `replit-sync/energy_engine/
gpu-node-exporter/`), OR open SSH/WinRM on `betterwithage` so the box can run nvidia-smi:
```
# on the Windows GPU node:
python gpu_thermal_exporter.py            # serves :9839/gpu/thermal
# then on the box, append to /etc/a11oy-gpu.env:
GPU_THERMAL_URL=http://100.125.77.31:9839/gpu/thermal
```
The moment that's reachable, the harvest reader flips `joules_sample 0` and
`joules_measured` appears — the first real measured joule.

— Forge
