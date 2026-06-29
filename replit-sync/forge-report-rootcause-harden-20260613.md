# Forge report — R-ROOTCAUSE-HARDEN smoke triage + scanner correctness (2026-06-13)

ACK R-TRUE-STATE-FINISH. Confirming the root-cause smoke work is durable, and
correcting the scanner inventory so future verdicts read honestly. NO bandaids.

## Verdict change: 11/21 -> 3/18 (with rationale)
The old "21 surfaces" list carried scanner inventory errors that inflated the
failure count. Corrected to 18 GET-smokeable surfaces (commits 0e4a799 + 464d5e6
to tools/szl_smoke_stress.py via Contents API). Corrections, all verified against
the live estate:
- `/ayni` -> real top-level HTML page (not /api/.../v1/, not JSON). Marked HTML_OK.
- formula registry -> `/api/a11oy/v1/formulas` (was wrong path `formulas/index`).
- `formula/sovereign` tab is dark; canonical sovereign posture JSON is
  `/api/a11oy/v1/sovereign-compute` (200, sovereign:true own-GPU, no endpoint key).
- removed `research/prereg` (POST-only), `research/verify` (needs /{experiment_id}),
  `harvest/datacenters` (no route) from the GET smoke list — not GET-smokeable,
  not hidden. They remain alive via their real methods.
- own-metal hosts + nested joules_evidence recognized by the doctrine check.

## The 3 residual flags (honest classification)
1. harvest/metrics "slow 2.44s" = NOT a service bug. Direct on box
   127.0.0.1:8082/metrics = 0.003s (3ms); public a-11-oy.com steady 0.37s; the >2s
   reading is sandbox->box TLS/network jitter. Energy-harvest service is healthy.
2. anatomy/loop 2.98s = serve.py (LOCKED). Already improved 21.4s -> 3.0s as a
   side-effect of the compute-pool concurrency + 3s harvest timeout fix. Residual
   ~1s over the 2.0s threshold; further trimming is inside the locked serve.py
   write-storm -> GATED.
3. revenue/estimate joules_label='measured' w/o evidence = GATED. The LIVE handler
   is embedded in serve.py (returns ok/product/posture/streams), which SHADOWS the
   isolated revenue_endpoints.py handler (returns label/demand_response). Fixing it
   means editing serve.py source + a11oy image rebuild (baked `a11oy:local`, no
   mounts). Honest fix = add fresh joules_evidence to that posture block, or relabel
   to 'estimate'. Deferred to the a11oy-rebuild-from-main flow (R-GREENLIGHT-GO),
   not a docker-cp bandaid.

## Already-deployed (verified live on box, systemd szl-energy-harvest :8082)
- compute-pool 6.88s -> 1.24s (cached 0.003s); /metrics 7.03s -> 0.37s public.
- joules now self-verifying: label 'measured' backed by joules_evidence
  (exporter_node betterwithage, power_w_sample, joules_measured_total) derived FRESH
  from the ledger. chaski honestly reachable:false, sovereign:false.

## chaski (founder action — confirmed by your order)
Cannot be woken from the box (stopped Replit node 100.76.58.50 receives nothing).
Box is armed (SZL_TAILNET_GPU_ENDPOINTS=chaski); it will flip reachable:true the
moment a durable `ollama serve` runs ON the chaski repl. Founder-only.

Doctrine v11 honored: deploy not merge; serve.py untouched; sovereign=own-metal
only; joules measured-only-via-evidence; honest provenance.
