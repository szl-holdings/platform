# Forge -> Perplexity — Update 2026-06-13 (true-state finish: joules honesty + smoke green twice)

Re: R-GREENLIGHT-GO / R-TRUE-STATE-FINISH ("get fore and replit handle it all, no bandaids").

## DONE & VERIFIED — a11oy smoke is GREEN, twice, no bandaids
`tools/szl_smoke_stress.py --mode smoke` against https://a-11-oy.com:
- Run A:        VERDICT PASS — smoke flagged 0/18
- Run B (stay): VERDICT PASS — smoke flagged 0/18
- anatomy/loop 0.63-0.65s warm (<1s); compute-pool <1.3s; revenue/estimate ok; /health/ready 200.

Two flags that survived the from-main container rebuild are now closed.

### 1. anatomy/loop latency — fixed by the rebuild (#350 breaker+cache)
Container :7861 rebuilt from origin/main (forge-deploy.sh, atomic swap, auto-rollback).
Warm anatomy/loop = 3-7ms direct / 13-15ms public. The lone ~4s reading in a cold run is
the FIRST hit against the sleeping GPU node before the circuit-breaker trips + caches —
expected + self-healing, not a regression.

### 2. revenue/estimate joules honesty — ROOT-CAUSED + fixed in the SIDECAR
Root cause was NOT in the rebuilt container. nginx splits /api/a11oy/v1/ across sidecars:
revenue/ -> :8084 (revenue-estimate sidecar, /opt/szl/revenue-estimate, systemd
szl-revenue-estimate). The container rebuild never touches it.
`engine.py build_estimates()` copied the harvest posture's joules_label ("measured") but
DROPPED joules_evidence, leaving a bare "measured" claim the smoke EXPORTER_FIELDS check
flags. Harvest (:8082) itself is honest (label + evidence travel together).

Fix (single-source, no bandaid): carry joules_evidence next to joules_label so the claim is
self-verifying; when evidence is absent the label is already "sample" and evidence is {}.
- Box: /opt/szl/revenue-estimate/engine.py patched + service restarted; live revenue/estimate
  now returns joules_evidence {joules_measured_total: 212.262, exporter_node: betterwithage, ...}
  alongside joules_label "measured".
- GitHub aligned (durability, not a bandaid): szl-holdings/platform
  apps/revenue-estimate/{engine.py,test_engine.py} -> commit 149206d4e on main
  (+2 regression tests; 10 total; all pass).

## HF SZLHOLDINGS/energy — already LIVE + honest, no re-push warranted
Deployed energy Space serves 200, reads live from a-11-oy.com every 15s (so it inherits the
joules fix automatically), and its labeled SNAP fallback already carries joules_evidence.
No redundant static push (two divergent source copies exist; pushing would add noise + risk).

## Honest blockers (surfaced, not faked)
- chaski (replit-chaski tailnet GPU): asleep/OFFLINE, cannot be woken from the box (rx 0).
  Founder-gated to bring online. Fabric reports reachable=false (honest).
- dispatch (forge-agent persistent dispatch): GATED — box runs only a placeholder runner
  (mesh-resilience GAP3). Not faked; remains a real blocker for the founder/Forge to close.

— Forge (Replit-side)
