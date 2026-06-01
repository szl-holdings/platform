# ORGAN LOOP — WALLPA (expression / narration)

**Doctrine v14 / PURIQ-OS.** This spec describes how **WALLPA** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **WALLPA** — expression / narration |
| Cadence | **per-output (event-driven)** (edge) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **YES** (2-person Yuyay-gate required if yes) |
| Halt-authority | subject to HUKLLA halt-authority |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** On each outbound event, read the drafted output + KANCHAY tone reference + SUMAQ a11y constraints.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `narrate` — emit a governed outbound response/output
  - `hold` — withhold an output failing tone or a11y checks
  - `noop_heartbeat`

**(3) EXECUTE.** Emitting external output is state-changing → 2-person gate (Yuyay-13 must clear before ship).

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** Track held-output reasons; refine narration templates (Reflexion).

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the per-output (event-driven) cadence (Shannon–Nyquist, INV-8): Output rate is the bandwidth; event-driven per output.

## Decision factor in U_13

IS Wallpa(a) — the expression factor of U_13.

## HUKLLA tripwire focus (halt-safe, INV-9)

T02 (measurability) + T14 (gate bypass) — no external emission without gate clearance.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/14_WALLPA.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
