# ORGAN LOOP — LAMBDA (spine / Λ re-aggregation)

**Doctrine v14 / PURIQ-OS.** This spec describes how **LAMBDA** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **LAMBDA** — spine / Λ re-aggregation |
| Cadence | **on input drift + every 12 min** (mod 12) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **YES** (2-person Yuyay-gate required if yes) |
| Halt-authority | subject to HUKLLA halt-authority |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** Read the axis-score inputs to Λ(x); detect drift since the last aggregation.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `re_aggregate` — recompute Λ(x) = ∏ xᵢ^wᵢ on drifted inputs
  - `raise_drift_alarm` — fire T18 if drift exceeds tolerance
  - `noop_heartbeat`

**(3) EXECUTE.** Publishing a new Λ(x) is state-changing → 2-person gate. The A4 bound (Λ ≤ max xᵢ) is self-tested each tick.

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** If re-aggregation oscillates, log a smoothing-strategy refinement meta-receipt.

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the on input drift + every 12 min cadence (Shannon–Nyquist, INV-8): Input drift is event-driven; the 12-min floor catches slow drift below the event threshold.

## Decision factor in U_13

IS Λ(x) — the leading factor of U_13; weighted geometric mean, A1–A4 carried.

## HUKLLA tripwire focus (halt-safe, INV-9)

T18 (drift threshold) — the spine is the drift sentinel; also self-tests A4 IsBounded.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/07_LAMBDA.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
