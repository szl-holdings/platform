# FORGE REPORT — Public joule bridge LIVE (R-ENERGY-COMES-HOME #1)

**When:** 2026-06-13
**Order:** R-ENERGY-COMES-HOME #1 (BRIDGE meter -> public) + GO.txt R-TAKE-IT-NOW
**Mode:** DEPLOY to box, NOT merged. Doctrine v11 throughout.

## What was wrong
A REAL measured joule (212.262 J, 8 NVML samples on betterwithage RTX 5050, during a
negative grid price) already lived in the on-box meter ledger
(`/var/lib/szl/joules-status.json` + `joules.ndjson`, `measured:true`). The JSON
surfaces `/harvest/reservoir` and `/harvest/budget` already read it as
`joules_label:"measured"`. But the PUBLIC Prometheus endpoint
`/api/a11oy/v1/harvest/metrics` still hardcoded `szl_energy_harvest_joules_sample 1`
and had NO measured gauge — so scrapers/estate badges still saw SAMPLE.

## Fix (bridge)
`server.py metrics()` now reads `reservoir.read_ledger()` (which counts `measured:true`
entries ONLY, never fabricates) and emits:
- NEW `szl_energy_harvest_joules_measured` = real ledger total
- `szl_energy_harvest_joules_sample` flips to 0 iff a real measured total exists (else 1)

Backup saved (`server.py.bak.joulebridge.*`), `py_compile` OK, `szl-energy-harvest.service`
restarted.

## RAW verification (public a11oy.net, through nginx)
```
szl_energy_harvest_joules_measured 212.262
szl_energy_harvest_joules_sample 0
szl_energy_reverse_recovery_available 0
szl_energy_harvest_grid_price_eur_mwh -27.42
```
```
/harvest/budget    -> joules_label=measured  measured_joules_to_date=212.262  window_open=true  price=-27.42
/harvest/reservoir -> joules_label=measured  total_measured_joules=212.262    entries=8
```

## Honesty (what I did NOT do)
- `szl_energy_reverse_recovery_available` stays **0**. The box is CPU-only; the GPU node
  exposes Ollama only — no reachable thermal source. `gpu_temp_c` / `envelope_w` remain
  intentionally absent (never fabricated). It auto-flips to 1 and emits real thermal ONLY
  when `GPU_THERMAL_URL` or on-node `nvidia-smi` is present (truly feeding).
- No SAMPLE was promoted to MEASURED — the measured number is the ledger's own
  `measured:true` total.
- sovereign stays False at the signal level. No key committed. No free-energy claim
  (Bekenstein #239 / Landauer #240 / Carnot bounds cited in the modules).

## Gaps still open (honest)
- Repo source `packages/energy-harvest/app/server.py` is NOT in lockstep (the live deploy
  dir `/opt/szl/energy-harvest` is not a git checkout). Carry this gauge in a merge-gated PR.
- `/energy/budget` + `/energy/reservoir` nginx aliases still 404 (data IS served under
  `/harvest/budget` + `/harvest/reservoir`); only an nginx route addition remains.
- Real reverse-recovery needs a TEG/thermal feed on the GPU node (hardware-gated).
