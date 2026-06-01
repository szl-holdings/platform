# ORGAN LOOP — AMARU (cortex / memory synthesis)

**Doctrine v14 / PURIQ-OS.** This spec describes how **AMARU** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **AMARU** — cortex / memory synthesis |
| Cadence | **every 5 min** (mod 5) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **YES** (2-person Yuyay-gate required if yes) |
| Halt-authority | subject to HUKLLA halt-authority |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** Read recent Khipu receipts across all organs + working-memory buffer; compute the error signal = distance of the current synthesis from the Doctrine reference.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `synthesize` — merge recent receipts into an updated empire memory summary
  - `flag_contradiction` — raise a YUYAY re-eval request if two organs' receipts conflict
  - `noop_heartbeat` — keep the loop alive when no new evidence has arrived

**(3) EXECUTE.** Write the synthesis to the working-memory buffer (read-mostly; the published summary is a state change requiring the 2-person gate).

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** Compare this synthesis's decision value to the previous tick (Δ); if Δ<0 three ticks running, propose a synthesis-strategy refinement (Reflexion meta-receipt).

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the every 5 min cadence (Shannon–Nyquist, INV-8): Synthesis is mid-bandwidth (memory changes slowly); 5-min poll ≥ 2× the memory-update rate.

## Decision factor in U_13

Contributes to Λ(x) via the cortex axis; never a factor >1.

## HUKLLA tripwire focus (halt-safe, INV-9)

T03/T04 (self-deception / goal-drift) — synthesis must not confabulate; T16 reflection-divergence.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/01_AMARU.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
