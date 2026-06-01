# ORGAN LOOP — YAWAR (blood / Merkle ledger reconcile)

**Doctrine v14 / PURIQ-OS.** This spec describes how **YAWAR** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **YAWAR** — blood / Merkle ledger reconcile |
| Cadence | **every 12 h** (mod 12 (hours)) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **YES** (2-person Yuyay-gate required if yes) |
| Halt-authority | subject to HUKLLA halt-authority |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** Read the full Khipu DAG for the window; recompute the Merkle root; compare to the last reconciled root.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `reconcile` — recompute + commit the Merkle root over the receipt set
  - `raise_fork_alarm` — fire T13 ledger-fork if a prev_hash does not chain
  - `noop_heartbeat`

**(3) EXECUTE.** Commit the reconciled Merkle root (state-changing → 2-person gate). A fork alarm routes to HUKLLA.

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** Track reconcile latency and fork incidence over windows; propose a tighter reconcile cadence if forks rise.

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the every 12 h cadence (Shannon–Nyquist, INV-8): Ledger reconciliation is low-bandwidth (the chain only grows); 12-h poll is well above Nyquist.

## Decision factor in U_13

Feeds the ∏Khipu_i(a) provenance factors; a broken chain zeroes them.

## HUKLLA tripwire focus (halt-safe, INV-9)

T08 (provenance gap) + T13 (ledger fork) — YAWAR is the chain-integrity organ.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/03_YAWAR.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
