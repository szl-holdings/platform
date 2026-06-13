# GPU-node NVML exporter — the FIRST MEASURED JOULE unblock (R-ZOOMOUT-GPU step 1)

**The missing piece (founder's own diagnosis, confirmed live):** the a11oy app runs on a
CPU-only box; the RTX 5000 (`betterwithage`, Tailscale `100.125.77.31`) is exposed **only as
Ollama** (`A11OY_MODEL_BASE_URL=http://100.125.77.31:11434/v1`). There is **no NVML/thermal
source the app can read**, so `szl_energy_harvest_joules_sample` stays SAMPLE and there is no
`joules_measured`. This package closes that gap. **No merge required. No key committed.**

This is the one physical step that can only run on the founder's metal. Once it's up, the app
box reads real `power.draw` + `temperature.gpu` over Tailscale and the first MEASURED joule flips.

## Step 1 — run the exporter ON the RTX 5000 node (`100.125.77.31`)

Copy `gpu_thermal_exporter.py` to the GPU node, then:

**Linux:**
```bash
python3 gpu_thermal_exporter.py          # binds 0.0.0.0:9839
# optional shared secret:  GPU_EXPORTER_TOKEN=<secret> python3 gpu_thermal_exporter.py
```

**Windows (PowerShell):**
```powershell
python .\gpu_thermal_exporter.py
```

Verify locally on the node:
```bash
curl http://127.0.0.1:9839/gpu/thermal
# -> {"ok": true, "source":"nvidia-smi", "gpu":{"power.draw":123.4,"temperature.gpu":56,...}}
```

(Optional, to survive reboot on a Linux GPU node — `install-systemd.sh` writes a unit.)

## Step 2 — wire the app box to read it

On the app box (`167.233.50.75`), append to `/etc/a11oy-gpu.env`:
```
GPU_THERMAL_URL=http://100.125.77.31:9839/gpu/thermal
```
(If you set `GPU_EXPORTER_TOKEN`, use `...:9839/gpu/thermal?token=<secret>`.)
Then restart the container so `--env-file` re-reads it (`a11oy-rebuild` or `docker restart a11oy`).

**Dependency note (honest):** the live `a11oy` container does **not yet** ship a `GPU_THERMAL_URL`
reader / `/harvest/*` route. That reader lives in the energy PRs (a11oy #328/#335) which are
**unmerged and not deployed** (order says "Do NOT merge"). So the full measured-joule flip needs:
(a) this exporter running [this package], **and** (b) the harvest reader deployed to the box behind
`serve.py` (R-ZOOMOUT-GPU step 2 — founder/lead-gated deploy, not done here to avoid clobbering the
agents currently editing the box). This package delivers (a) and the exact env line for (b).

## Contract the exporter serves (`GET /gpu/thermal`)
```json
{"ok": true, "source": "nvidia-smi", "ts": 1781339726.0,
 "gpu": {"power.draw": 123.4, "temperature.gpu": 56, "utilization.gpu": 40, "power.limit": 230.0,
         "power_draw_w": 123.4, "temperature_gpu_c": 56, "utilization_gpu_pct": 40, "power_limit_w": 230.0,
         "name": "NVIDIA RTX 5000"}}
```
Both nvidia-smi-native keys (`power.draw`, `temperature.gpu`) and normalized aliases are present so
any reader shape is satisfied. On any failure it returns `{"ok": false, "error": ...}` (HTTP 503) —
the app must keep SAMPLE joules, never fake a measured reading. No free energy.

Also: `GET /metrics` (Prometheus text), `GET /healthz` (`{"ok": ...}`).
