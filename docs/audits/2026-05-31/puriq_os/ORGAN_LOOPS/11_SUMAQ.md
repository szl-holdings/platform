# ORGAN LOOP — SUMAQ (designer / WCAG regeneration)

**Doctrine v14 / PURIQ-OS.** This spec describes how **SUMAQ** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **SUMAQ** — designer / WCAG regeneration |
| Cadence | **on CSS change + every 12 h** (mod 12 (hours)) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **YES** (2-person Yuyay-gate required if yes) |
| Halt-authority | subject to HUKLLA halt-authority |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** Read current CSS/design tokens; run WCAG contrast + structure checks; detect accessibility drift.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `regenerate` — regenerate styles to restore WCAG AA/AAA conformance
  - `flag_a11y_regression` — raise an advisory when a change breaks conformance
  - `noop_heartbeat`

**(3) EXECUTE.** Shipping regenerated CSS is state-changing → 2-person gate.

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** If a regeneration fixed contrast but broke layout, record a constraint-balancing refinement.

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the on CSS change + every 12 h cadence (Shannon–Nyquist, INV-8): CSS changes are event-driven; the 12-h floor catches slow token drift.

## Decision factor in U_13

Contributes to Wallpa(a) presentation-quality factor.

## HUKLLA tripwire focus (halt-safe, INV-9)

T02 (measurability) — accessibility is a measured WCAG ratio, not opinion.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/11_SUMAQ.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
