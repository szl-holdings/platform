# Runbook — SLOBudgetBurning

**Severity:** `page`  
**Alert expression:** `error budget burn rate > 14x normal (99.5% SLO)`

## What does this alert mean?

A flagship is burning its 99.5% error budget more than 14x faster than sustainable.

## What to check

- Open slo-burndown dashboard; identify the burning flagship.
- Correlate with error-rate and p99 panels to find the cause.

## How to recover

- Mitigate the root cause (errors or latency) before the budget is exhausted.
- If budget is exhausted, freeze risky deploys until it recovers.

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
