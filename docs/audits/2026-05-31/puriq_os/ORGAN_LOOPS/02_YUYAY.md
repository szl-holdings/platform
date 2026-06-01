# ORGAN LOOP — YUYAY (heart / 13-axis conscience)

**Doctrine v14 / PURIQ-OS.** This spec describes how **YUYAY** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **YUYAY** — heart / 13-axis conscience |
| Cadence | **on new evidence + every 7 min** (mod 7) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **YES** (2-person Yuyay-gate required if yes) |
| Halt-authority | subject to HUKLLA halt-authority |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** Pull any action awaiting clearance + new evidence that could change a prior score; read the 13-axis state.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `re_evaluate` — re-score a pending or recently-scored action on the 13 axes
  - `revoke_clearance` — withdraw a prior PASS if new evidence drops an axis below floor
  - `noop_heartbeat`

**(3) EXECUTE.** Emit the Yuyay-13 verdict (PASS scalar or 0.0). Revoking a clearance is state-changing → 2-person gate.

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** If an axis repeatedly hovers near its floor, log a calibration meta-receipt (uncertainty_calibration axis).

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the on new evidence + every 7 min cadence (Shannon–Nyquist, INV-8): Conscience must re-fire on every new evidence event AND on a 7-min floor; event-driven + periodic.

## Decision factor in U_13

Yuyay_13(a) itself — the conjunctive gate; any sub-floor axis ⇒ 0 (INV-1, no compensation).

## HUKLLA tripwire focus (halt-safe, INV-9)

T01 (moral grounding), T03/T04/T09/T10 (the four introspection tripwires are heart-linked).
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/02_YUYAY.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
