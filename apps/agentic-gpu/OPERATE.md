# OPERATE.md — Harvest Runner Runbook (betterwithage RTX 5000)

Operational runbook for Forge. Covers: start, verify soaking, confirm the first
MEASURED joule, and clean stop.

---

## 0. Prerequisites

```bash
# On the betterwithage RTX 5000, from the platform checkout:
cd ~/platform
git checkout feat/harvest-ops
pip install --user --break-system-packages --quiet \
    requests 2>/dev/null || true   # harvest_runner uses stdlib only; pip not required
```

All feeds are free, public, no-key. Python 3.9+ stdlib is the only hard dependency.

---

## 1. Start the runner

### Option A — systemd user unit (recommended for persistent resident loop)

```bash
mkdir -p ~/.config/systemd/user
cp deploy/agentic-gpu-harvest.service ~/.config/systemd/user/
systemctl --user daemon-reload
systemctl --user enable --now agentic-gpu-harvest.service
```

Verify it started:
```bash
systemctl --user status agentic-gpu-harvest.service
journalctl --user -u agentic-gpu-harvest.service -n 20 -f
```

Expected first log line (structured JSON):
```json
{"event": "harvest_runner.start", "interval_s": 60, "nvml_present": true, ...}
```

### Option B — foreground (Forge manual test)

```bash
cd ~/platform/apps/agentic-gpu
python3 harvest_runner.py run_forever --interval 60
```

### Option C — single tick

```bash
cd ~/platform/apps/agentic-gpu
python3 harvest_runner.py run_once
```

---

## 2. Verify soaking during a negative-price window

The runner emits a tick log every 60 seconds. To confirm active soaking:

```bash
# Watch for wasted_energy_available=true and admitted_jobs > 0
journalctl --user -u agentic-gpu-harvest.service -f -o json \
  | python3 -c "
import sys, json
for line in sys.stdin:
    try:
        r = json.loads(line)
        msg = r.get('MESSAGE','')
        if not msg: continue
        d = json.loads(msg)
        if d.get('event') == 'harvest_runner.tick':
            print(f\"tick={d['tick']} posture={d['posture']} \
wasted={d['wasted_energy_available']} admitted={d['admitted_jobs']} \
joules_label={d['joules_label']} price={d['price']} {d.get('price_unit','')}\")
    except: pass
"
```

A soaking tick looks like:
```
tick=5 posture=negative-price wasted=True admitted=4 joules_label=sample price=-12.3 EUR/MWh
```

To force-verify against live feeds right now:
```bash
cd ~/platform/apps/agentic-gpu
python3 harvest_runner.py run_once | python3 -m json.tool
```

Check the receipt block:
```json
{
  "posture": "negative-price",
  "price": -12.3,
  "price_label": "measured:feed",
  "joules": 0.0,
  "joules_label": "sample",
  "wasted_energy_available": true,
  "admitted_jobs": 4
}
```

`price_label: measured:feed` confirms the aWATTar feed responded with a real
wholesale price. `joules_label: sample` is correct until NVML is wired (see §3).

---

## 3. Confirm the first MEASURED joule (once NVML is wired)

On the betterwithage RTX 5000 with `nvidia-smi` installed, the runner
automatically reads NVML power.draw each tick. No configuration is needed:
`nvml_joules()` calls `nvidia-smi --query-gpu=power.draw --format=csv,noheader,nounits`
and the result appears in the tick receipt.

**Verify nvidia-smi is reachable:**
```bash
nvidia-smi --query-gpu=power.draw --format=csv,noheader,nounits
# Expected output: something like  47.23
```

**Confirm MEASURED joule in the next tick log:**
```bash
journalctl --user -u agentic-gpu-harvest.service -f -o json \
  | python3 -c "
import sys, json
for line in sys.stdin:
    try:
        r = json.loads(line)
        msg = r.get('MESSAGE','')
        d = json.loads(msg)
        if d.get('joules_label') == 'measured:nvml':
            print('FIRST MEASURED JOULE:', d)
            break
    except: pass
"
```

Expected output once NVML fires:
```
FIRST MEASURED JOULE: {'event': 'harvest_runner.tick', 'tick': 3,
  'joules_label': 'measured:nvml', 'joules': 2814.0, ...}
```

`joules_label: measured:nvml` is the on-box MEASURED label. Off-box (CI, dev)
you will only ever see `sample` — this is correct and expected.

**One-shot NVML check:**
```bash
cd ~/platform/apps/agentic-gpu
python3 -c "
from harvest_runner import nvml_joules
j = nvml_joules(interval_s=1.0)
print('nvml_joules()=', j, '  label=', 'measured:nvml' if j else 'sample')
"
```

---

## 4. Stop cleanly

systemd sends SIGTERM; the runner's signal handler finishes the current tick
and emits a shutdown receipt before exiting.

```bash
# Graceful stop (SIGTERM → clean exit, ledger receipt emitted)
systemctl --user stop agentic-gpu-harvest.service

# Confirm clean stop in journal
journalctl --user -u agentic-gpu-harvest.service -n 10
# Look for: {"event": "harvest_runner.stopped", "ticks_completed": N, ...}
```

If you need to kill it immediately:
```bash
systemctl --user kill --signal=SIGKILL agentic-gpu-harvest.service
```

---

## 5. Self-test (Forge CI or local verify)

```bash
cd ~/platform/apps/agentic-gpu
python3 harvest_runner.py selftest
# Expected: ok:true checks:N
```

Or run directly against live feeds and print the full result:
```bash
python3 harvest_runner.py run_once | python3 -m json.tool
```

---

## 6. Key doctrine reminders

| Claim | Policy |
|---|---|
| `joules_label: sample` | Off-box (no nvidia-smi) — ALWAYS. Never fabricate. |
| `joules_label: measured:nvml` | On-box only, when nvidia-smi returns a real watt reading. |
| `price_label: measured:feed` | aWATTar/Energy-Charts feed responded. Real wholesale price. |
| `wasted_energy_available: false` | Soak gate closed. Zero jobs admitted. |
| Reactive preemption | Checked first every tick. Proactive soak NEVER starves reactive. |
| Ouroboros bound | Session ledger is monotone; loop bounded at 32 steps max per window. |
| No key | All feeds are free and public. No token committed or used. |
