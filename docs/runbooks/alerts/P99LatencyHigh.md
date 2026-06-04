# Runbook — P99LatencyHigh

**Severity:** `warning`  
**Alert expression:** `histogram_quantile(0.99, szl_request_duration_seconds) > 1.0 for 10m`

## What does this alert mean?

p99 request latency exceeds 1s for 10 minutes on a flagship.

## What to check

- Open the flagship-mesh-overview dashboard p99 panel; identify the slow flagship.
- Correlate with a trace in Tempo to find the slow span (DB? recall? external call?).
- Check CPU/memory pressure on the Space (cpu-basic hardware limits).

## How to recover

- Scale hardware tier if resource-bound.
- Cache or optimise the slow path identified in the trace.

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
