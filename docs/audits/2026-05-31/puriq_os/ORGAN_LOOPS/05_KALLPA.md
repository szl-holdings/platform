# ORGAN LOOP — KALLPA (wires / routing optimization)

**Doctrine v14 / PURIQ-OS.** This spec describes how **KALLPA** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **KALLPA** — wires / routing optimization |
| Cadence | **every 7 min** (mod 7) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **YES** (2-person Yuyay-gate required if yes) |
| Halt-authority | subject to HUKLLA halt-authority |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** Measure inter-organ wire latency + error rates; compute drift from the routing reference.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `reroute` — pick a lower-latency route for a wire above its latency budget
  - `rebalance` — shift load across redundant wires
  - `noop_heartbeat`

**(3) EXECUTE.** Applying a new routing table is state-changing → 2-person gate.

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** If a reroute increased end-to-end latency (Δ<0), revert and record a refinement meta-receipt.

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the every 7 min cadence (Shannon–Nyquist, INV-8): Wire-latency drift is mid-bandwidth; 7-min poll tracks it without aliasing.

## Decision factor in U_13

Contributes to Λ(x) via the connectivity axis.

## HUKLLA tripwire focus (halt-safe, INV-9)

T05 (unbounded resource) — routing must stay within the wire fuel budget; T18 drift.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/05_KALLPA.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
