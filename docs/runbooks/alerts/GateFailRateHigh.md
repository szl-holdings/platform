# Runbook — GateFailRateHigh

**Severity:** `warning`  
**Alert expression:** `rate(szl_gate_failures_total[5m]) / rate(szl_gate_requests_total[5m]) > 0.05`

## What does this alert mean?

More than 5% of Yuyay-13 gate evaluations are failing on an organ.

## What to check

- Identify which gate axis is failing (gate-pass-rate dashboard, per-axis panel).
- Check for a recent policy or threshold change.
- Inspect sample failing requests for malformed input vs genuine policy denials.

## How to recover

- If a bad policy push, revert the gate config.
- If genuine load of denials, confirm upstream callers and rate-limit if abusive.

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
