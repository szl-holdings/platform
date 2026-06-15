# SZL Forge — HOT RECOVERY: energy operator worker stopped (2026-06-15 02:16 ET)

**PRIORITY: do this FIRST (before the other MASTER ORDER jobs).** The energy meter — the live demo
crescendo — has STALLED. This is a box-side restart, not a code change. Doctrine v11: never fabricate a
joule; if you can't truly restart measurement, report BLOCKED honestly. The frozen totals (271,855 J,
9,885 jobs) must NOT be reset or back-filled — only RESUME real measurement forward from here.

## SYMPTOM (verified live 02:16 ET)
`GET /api/a11oy/v1/energy/operator/status` shows:
- `running: false`, `uptime_s: 0.0`, `window_seconds: 0.0`  ← the measurement WORKER LOOP is stopped
- `power_w_sample: null`                                    ← no live NVML sample being pulled
- `node_status: {rtx-betterwithage: "idle", chaski: "idle"}`, `nodes_computing: []`
- `joules_measured_total: 271855`, `jobs_done: 9885`        ← FROZEN (last good values; do NOT reset)
- `tokens_total` still climbing (~4.37M)                    ← inference still flows via mesh, but it's UNMETERED right now
- `ledger` receipts in the running window = 0               ← no JouleCharge receipts minting (because worker stopped)
- `exporter: http://100.96.129.45:9471/` on `betterwithage` ← the NVML exporter endpoint

Likely cause: the recent box redeploy (which DID land — `nodes_standby` field is now present, chaski-standby code e67b073 is live) restarted the a11oy service but **did not re-arm the energy operator's measurement worker / exporter poll**.

## DO (box-side, reversible)
1. On the LAPTOP (`betterwithage`, Tailscale 100.125.77.31 / exporter bound 100.96.129.45:9471): confirm the NVML/Prometheus exporter process is alive and serving — `curl -s http://100.96.129.45:9471/ | head`. If dead, restart it (the systemd unit or the `nvml_exporter`/`gpu_energy_exporter` process that reads the Blackwell RTX 5050 power.draw). It must emit a live `gpu_power_watts` / energy counter.
2. On the BOX (a11oy.net, 167.233.50.75): restart the energy operator measurement worker so `running` flips true. This is the background task that polls `exporter` (`http://100.96.129.45:9471/`), accumulates `joules_measured_total`, increments `jobs_done`, and mints signed JouleCharge receipts. Restart the a11oy service worker (or send the operator its start/resume signal) WITHOUT resetting the accumulated totals — resume forward from 271,855 J.
3. Verify the worker re-attaches to `rtx-betterwithage` (`node_status` flips from `idle` -> `computing` while a job runs).

## PROVE (paste real values)
- `/api/a11oy/v1/energy/operator/status`: `running:true`, `uptime_s > 0`, `power_w_sample` a real number (~9-15 W), `nodes_computing` contains `rtx-betterwithage`.
- Two reads a minute apart: `joules_measured_total` INCREASING again (past 271,855) and `jobs_done` incrementing.
- `/api/a11oy/v1/energy/ledger`: receipts count > 0 and CLIMBING, `chain` integrity ok (a fresh JouleCharge receipt minted after restart).

## HONEST
If the exporter genuinely can't be revived before the demo, report BLOCKED with the exact error. The honest
fallback demo line: "the meter shows 271,855 J MEASURED to date with N signed receipts; it's a live exporter,
here are the receipts" — show the EXISTING signed receipts rather than faking a live climb. Never fabricate a
power_w_sample or a receipt. Never reset the totals to make it look fresh.
