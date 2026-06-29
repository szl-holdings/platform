# SZL Forge — EXECUTE NOW (2026-06-15 10:44 EDT): dispatch is ON — RESTART THE ENERGY WORKER for real

Confirmed: AUTO_STATE dispatch_mode=dispatch-cmd, dispatch_ok=true (14:33Z). You now have a real exec
channel. Founder wants this DONE via you, not by hand. Run the actual commands; PROVE with live values.

## CONTEXT
`/api/a11oy/v1/energy/operator/status` = running:false, stub_mode:false, joules_measured_total:271855.062
(PRESERVE — never reset/backfill/zero), jobs_done:9885, tokens climbing (~4.37M = inference flowing but
UNMETERED). The box redeploy restarted a11oy but did NOT re-arm the energy operator's measurement worker.

## EXECUTE (via dispatch-cmd, in order; these are real shell ops on the boxes you admin)
1. **Laptop exporter** (`betterwithage`, exporter bound 100.96.129.45:9471): confirm alive —
   `curl -s http://100.96.129.45:9471/ | head`. If dead, restart the NVML/Prometheus exporter unit
   (`systemctl restart nvml_exporter` || `gpu_energy_exporter`) so it emits live gpu power.draw.
2. **Box operator worker** (a-11-oy.com / 167.233.50.75): restart the a11oy energy-operator measurement
   worker so `running` flips true. Discover the unit: `systemctl list-units --type=service | grep -iE
   'a11oy|energy|operator'`, then `systemctl restart <that-unit>`. OR if the operator exposes a resume
   endpoint, POST its start signal. DO NOT reset totals — resume forward from 271,855 J.
3. Confirm the worker re-attaches to rtx-betterwithage (node_status idle -> computing during a job).

## PROVE (paste real values from two reads ~60s apart)
- `/api/a11oy/v1/energy/operator/status`: running:true, uptime_s>0, power_w_sample a real number (~9-15 W),
  nodes_computing contains rtx-betterwithage.
- joules_measured_total INCREASING past 271,855; jobs_done incrementing.
- `/api/a11oy/v1/energy/ledger`: receipt count >0 and climbing; fresh JouleCharge receipt minted; chain ok.

## HONEST / DOCTRINE
If the exporter genuinely can't be revived, report BLOCKED with the exact error + we demo the existing
271,855 J + signed receipts honestly. NEVER fabricate power_w_sample or a receipt. NEVER reset totals.
Never commit a key. This is reversible (a restart). Report DONE only with the pasted climbing proof —
a "RECOMMENDED / cannot verify" status is NOT acceptable now that dispatch-cmd is live; actually run it.
