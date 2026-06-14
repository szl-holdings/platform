# SZL Forge — ORDER: wire /api/a11oy/v1/energy/metrics to LIVE watts (currently UNAVAILABLE)

The endpoint is built and 200, but the body shows `power_w: null, power_w_label: "UNAVAILABLE"` — honest,
but no live feed yet. Wire the real NVML exporter into it so it reports MEASURED watts from the sovereign GPUs.

## DO
- Feed the same `nvidia-smi power.draw` / NVML reading the PINN joule-meter already uses on rtx-betterwithage
  (and chaski) into the `/energy/metrics` handler so `power_w` is a REAL sampled value and `power_w_label`
  becomes `MEASURED` (per-node breakdown if multiple GPUs).
- HARD: only label MEASURED when a real reading exists; if a node's exporter is down, that node stays
  UNAVAILABLE for that node — never fabricate a watt. Aggregate only real readings.

## GATE (prove-or-downgrade)
```bash
curl -s https://a11oy.net/api/a11oy/v1/energy/metrics | python3 -m json.tool
# PASS = power_w is a real number > 0 AND power_w_label == "MEASURED" for at least one live GPU node.
```
If the exporter can't reach a node, mark that node UNAVAILABLE honestly (not a fake 0/number).

## DOCTRINE v11
MEASURED energy only via real exporter. Honest inverse of free-energy, never over-unity. No fabricated
watts. Λ = Conjecture 1. Never commit a key.

— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> · Doctrine v11 LOCKED
