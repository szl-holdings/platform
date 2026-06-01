# ORGAN LOOP — CHASKI (reception / inbound messenger)

**Doctrine v14 / PURIQ-OS.** This spec describes how **CHASKI** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **CHASKI** — reception / inbound messenger |
| Cadence | **always-on (event-driven)** (edge) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **NO (read-only loop)** (2-person Yuyay-gate required if yes) |
| Halt-authority | subject to HUKLLA halt-authority |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** On each inbound event, read the request envelope + provenance headers.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `receive` — validate + admit an inbound request onto an organ wire
  - `reject` — refuse a malformed or unprovenanced inbound message
  - `noop_heartbeat`

**(3) EXECUTE.** Admitting a request that triggers a state change routes through the owning organ's 2-person gate.

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** Track reject reasons; propose inbound-validation refinements.

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the always-on (event-driven) cadence (Shannon–Nyquist, INV-8): Inbound rate is the bandwidth; the loop is event-driven (fires per arrival, no aliasing).

## Decision factor in U_13

Contributes Chaski(a) reception-integrity factor.

## HUKLLA tripwire focus (halt-safe, INV-9)

T08 (provenance) — inbound without provenance is rejected at the edge.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/13_CHASKI.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
