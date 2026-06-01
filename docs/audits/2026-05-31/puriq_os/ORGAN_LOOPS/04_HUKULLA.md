# ORGAN LOOP — HUKULLA (immune system / SOLE HALT-AUTHORITY)

**Doctrine v14 / PURIQ-OS.** This spec describes how **HUKULLA** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **HUKULLA** — immune system / SOLE HALT-AUTHORITY |
| Cadence | **every 60 s** (high-rate sweep) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **YES** (2-person Yuyay-gate required if yes) |
| Halt-authority | **SOLE halt-authority** (HUKLLA) |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** Sweep all organ contexts for the 20 tripwire predicates (T01–T20); read resource, harm, cadence, chain, swarm signals.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `threat_hunt` — evaluate T01–T20 across the empire
  - `halt` — latch HALTED on any tripwire (sole authority; T20 blocks override)
  - `clear` — confirm all-clear and continue

**(3) EXECUTE.** Halting is the highest-authority state change and is itself receipted; resume requires the 2-person admin gate.

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** Aggregate which tripwires fire most; propose new T-predicates (only ADD, never weaken T01–T10).

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the every 60 s cadence (Shannon–Nyquist, INV-8): Threats are the highest-bandwidth signal in the empire → fastest poll (60 s), per Nyquist INV-8.

## Decision factor in U_13

Provides e^(−β·HUKLLA(a)); any trip ⇒ veto factor 0 ⇒ U=0.

## HUKLLA tripwire focus (halt-safe, INV-9)

ALL of T01–T20 — this organ IS the tripwire authority. T20 guards against any organ overriding a halt.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/04_HUKULLA.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
