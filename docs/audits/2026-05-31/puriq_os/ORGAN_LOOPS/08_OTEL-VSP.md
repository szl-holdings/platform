# ORGAN LOOP — OTEL-VSP (nervous system / anomaly detection)

**Doctrine v14 / PURIQ-OS.** This spec describes how **OTEL-VSP** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **OTEL-VSP** — nervous system / anomaly detection |
| Cadence | **every 7 min** (mod 7) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **YES** (2-person Yuyay-gate required if yes) |
| Halt-authority | advisory only (no halt-authority) |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** Read OpenTelemetry traces + vital-sign panels; compute anomaly z-scores against rolling baselines.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `flag_anomaly` — raise T19 when a trace z-score exceeds threshold
  - `baseline_update` — refresh the rolling baseline on clean windows
  - `noop_heartbeat`

**(3) EXECUTE.** Baseline updates are read-mostly; routing an anomaly to HUKLLA is the consequential action (receipted).

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** Track false-positive rate; propose z-threshold tuning (Reflexion) without disabling detection.

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the every 7 min cadence (Shannon–Nyquist, INV-8): Trace anomalies are mid/high-bandwidth; 7-min poll with rolling baselines avoids aliasing.

## Decision factor in U_13

Advisory: contributes to Wasi(a) observability factor; cannot itself veto.

## HUKLLA tripwire focus (halt-safe, INV-9)

T19 (anomaly burst) — the nervous system feeds HUKLLA but does NOT hold halt-authority.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/08_OTEL-VSP.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
