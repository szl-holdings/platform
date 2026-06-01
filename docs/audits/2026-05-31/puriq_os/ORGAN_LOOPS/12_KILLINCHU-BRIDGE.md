# ORGAN LOOP — KILLINCHU (drone / patrol + swarm)

**Doctrine v14 / PURIQ-OS.** This spec describes how **KILLINCHU** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **KILLINCHU** — drone / patrol + swarm |
| Cadence | **patrol every 60 s** (high-rate) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **YES** (2-person Yuyay-gate required if yes) |
| Halt-authority | subject to HUKLLA halt-authority |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** Patrol the perimeter: poll endpoint health, certificate validity, and swarm-member liveness.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `patrol` — sweep endpoints + swarm members for liveness/health
  - `swarm_vote` — cast a Yuyay-13 BFT vote in a cross-organ consensus round
  - `raise_split_brain` — fire T15 when swarm quorum is not reached

**(3) EXECUTE.** Casting a binding swarm vote is state-changing → 2-person gate; the consensus outcome is receipted.

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** Track patrol miss rate + vote latency; propose swarm-quorum tuning within BFT bounds.

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the patrol every 60 s cadence (Shannon–Nyquist, INV-8): Patrol watches a high-bandwidth perimeter → fastest poll (60 s).

## Decision factor in U_13

Cross-Organ Swarm Consensus (Frontier #2): Yuyay-13 BFT vote before a single response ships.

## HUKLLA tripwire focus (halt-safe, INV-9)

T15 (swarm split-brain) — the drone is the swarm-consensus sentinel.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/12_KILLINCHU-BRIDGE.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
