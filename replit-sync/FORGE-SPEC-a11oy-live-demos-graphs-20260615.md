# a-11-oy.com — LIVE DEMOS + BEAUTIFUL GRAPHS spec (founder request 2026-06-15)

GOAL: every demo tab on a-11-oy.com has BEAUTIFUL live graphs + real, interactive demos wired to REAL data that
updates constantly (poll every 2-5s). ~15 live demos total across the tabs. killinchu/elite is the polish BAR.
Doctrine v11: every value labeled MEASURED/MODELED/SAMPLE/ESTIMATE; 0 runtime CDN (charts vendored same-origin —
use the existing szl3d toolkit / a vendored chart lib, NOT a CDN); never fabricate a datapoint; honest empty-state
beats a fake graph. All data is REAL — the endpoints below are all live 200 right now.

## LIVE DATA ENDPOINTS (all 200, verified 2026-06-15) — wire graphs to THESE
- /api/a11oy/v1/energy/operator/status — running, jobs_done, joules_measured_total, tokens_total, power_w_sample,
  grid_price_eur_mwh, nodes_computing/degraded/standby, by_node, recent_jobs[], uptime_s. (poll 2-3s for live climb)
- /api/a11oy/v1/energy/ledger — 1008 hash-chained receipts: seq, prev_digest, receipt, job, billable, charge,
  entry_digest; totals{jobs, joules_total, tokens_total, blocked_count, kwh_total}. (receipt-rate + chain viz)
- /api/a11oy/v1/energy/projection?window=running — measured_inputs + projection_1day_single_node + scale_projection
  + flop_estimate (forecast curve; MODELED beyond the measured window)
- /api/a11oy/v1/energy/sovereign — per-panel measured/modeled status (measured_panels x/6)
- /api/a11oy/v1/harvest/posture — price_now_eur_mwh, next_min, next_negative_windows[], renewable_share_pct,
  uk_gco2_per_kwh, carbon_index (grid-market + carbon panel)
- /api/a11oy/v1/compute-pool — gpu_nodes_reachable, per-node reachable/backend (fabric topology graph)
- /api/a11oy/v1/pnt/limits + /pnt/sensor — MODELED nav: k_eff, accel sensitivity, ASD (sensor curves)
- /api/a11oy/v1/pinn/certificate — MEASURED PINN cert: watts/seconds/joules DERIVED, DSSE/cosign/Rekor (cert card + residual plot)
- /api/a11oy/v1/restraint/info — frugality/restraint gate posture
- /api/a11oy/v1/honest — git_sha, locked, version (build-truth badge)

## THE ~15 LIVE DEMOS (per tab) — all real, all interactive
### ENERGY tab (the one the founder called out — make it gorgeous)
1. LIVE JOULES CLIMB — area/line chart of joules_measured_total polling every 2-3s, ticking up in real time (MEASURED badge). The headline graph.
2. POWER DRAW gauge — power_w_sample live needle (~9-15 W), MEASURED.
3. TOKENS/SEC throughput — derived from tokens_total delta per poll (MEASURED).
4. RECEIPT-MINT RATE — receipts/min from the ledger seq stream + a scrolling live receipt feed (real digests). Click a receipt -> show its hash-chain link (prev_digest -> entry_digest) verifying offline.
5. GRID-PRICE + CARBON panel — price_now_eur_mwh sparkline + renewable_share_pct + carbon index from harvest/posture (LIVE), with the negative-price "should_soak" callout.
6. 1-DAY PROJECTION — projection_1day_single_node forecast curve overlaid on the measured window (MODELED clearly labeled, MEASURED solid / MODELED dashed).
### FABRIC / COMPUTE tab
7. GPU FABRIC topology — compute-pool nodes as a live graph (rtx-betterwithage computing, chaski standby), reachable=true/false animated.
8. PER-NODE joules split — by_node breakdown (MEASURED).
### PNT tab
9. SENSOR SENSITIVITY curves — k_eff / accel-sensitivity / ASD from /pnt/sensor (MODELED, math shown).
10. NAV-COASTING demo — interactive: run a MODELED GPS-denied coast, show drift bound (MODELED labeled).
### PINN tab
11. PINN CERTIFICATE card — live cert (MEASURED watts/seconds/joules DERIVED) + DSSE/cosign/Rekor verify badges; "verify this offline" button.
12. RESIDUAL plot — PINN physics residual converging (from cert data).
### GOVERNANCE / RESTRAINT tab
13. TRUST-POSTURE radar — the 13-axis spider (already renders on command center) bound live; click an axis -> what it measures.
14. GATE DECISION demo — interactive: submit an action, watch the gate ALLOW/DENY with a signed verdict receipt (deny-by-default shown). Real /restraint + decision API.
### CROSS-SURFACE
15. RECEIPT-CHAIN integrity viz — the full hash-chain from the ledger (1008 links) as a live-growing chain; tamper-a-link demo shows the break (mirror killinchu's "Tamper a Receipt"). 

## QUALITY BAR (match killinchu/elite)
- Charts animate + update on poll; smooth, dark theme, teal accents, system fonts.
- Every panel has a status chip (LIVE/MEASURED/MODELED/SAMPLE) + the source endpoint shown.
- Empty/error state is honest ("not yet wired" / "exporter offline") — never a fake line.
- Interactive demos have a clear button + a real signed result.
- 0 runtime CDN; vendor the chart lib same-origin.

## SPLIT OF WORK
- The current Opus full-stack team (PR in flight) is fixing the BROKEN basics: /holographic renderer dead,
  /energy-ops not reading live data, command-center hangs, /pnt+/pinn routing, the 2 HF Space URL fixes.
- THIS spec (beautiful live graphs + 15 demos) is the LAYER ON TOP once the basics populate. Forge (box) + the
  dev team build the chart components against the live endpoints above. Demo June 18 — energy tab graphs first.
