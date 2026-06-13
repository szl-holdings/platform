# forge-report 2026-06-13 — R-ZOOMOUT-GPU step 1: GPU-node exporter shipped

**Order:** R-ZOOMOUT-GPU (NEXT_ORDER.md). Founder's diagnosis confirmed live: the
measured-joule gap is **wiring, not code**. The a11oy app box (`167.233.50.75`) is
CPU-only; the RTX 5000 (`betterwithage`, Tailscale `100.125.77.31`) is reachable
**only as Ollama** — no NVML/thermal source the app can read. So energy stays SAMPLE.

## Done (additive — NO merge, NO key committed, box untouched)
- Built `replit-sync/energy_engine/gpu-node-exporter/`:
  - `gpu_thermal_exporter.py` — stdlib-only, shells `nvidia-smi`, serves
    `/gpu/thermal` (JSON, both `power.draw`/`temperature.gpu` native keys + normalized
    aliases), `/metrics`, `/healthz`. Honest `ok:false`/503 when no GPU → the app can
    never fabricate a measured reading. Optional `GPU_EXPORTER_TOKEN`.
  - `README.md` (install + box-wiring) and `install-systemd.sh` (Linux unit).
- Smoke-tested in no-GPU sandbox: returns `ok:false` (no fabrication). ✅

## Founder action to flip the FIRST measured joule (2 steps)
1. On the RTX 5000 node: `python3 gpu_thermal_exporter.py` (binds `:9839`); verify
   `curl http://127.0.0.1:9839/gpu/thermal` → `ok:true`.
2. On the app box, append to `/etc/a11oy-gpu.env`:
   `GPU_THERMAL_URL=http://100.125.77.31:9839/gpu/thermal` then `a11oy-rebuild`.

## Still gated (deliberately not done)
- **Did NOT merge** any PR; **did NOT touch the box deployment** (heavy concurrent
  agent + box auto-loop activity this window = clobber risk).
- The harvest **reader** (consumes `GPU_THERMAL_URL`, exposes `/harvest/*`) lives in
  UNMERGED a11oy PRs #328/#335 — order step 2, founder/lead-gated deploy.

— Forge
