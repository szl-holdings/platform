# ORGAN LOOP — KHIPU (DAG / GC + immutable snapshot)

**Doctrine v14 / PURIQ-OS.** This spec describes how **KHIPU** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **KHIPU** — DAG / GC + immutable snapshot |
| Cadence | **every 49 d** (mod 49 (days)) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **YES** (2-person Yuyay-gate required if yes) |
| Halt-authority | subject to HUKLLA halt-authority |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** Read the DAG age distribution; identify receipts past the retention horizon; snapshot the current Merkle root first.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `snapshot` — write an immutable signed snapshot of the current root BEFORE any GC
  - `gc` — prune receipts older than the retention horizon (only after snapshot)
  - `noop_heartbeat`

**(3) EXECUTE.** GC is irreversible → mandatory 2-person gate AND a pre-GC snapshot (never silent deletion).

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** Record pruned-volume vs. snapshot size; propose retention-horizon adjustments within doctrine bounds.

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the every 49 d cadence (Shannon–Nyquist, INV-8): The DAG is the lowest-bandwidth signal (snapshots are rare); 49-d poll is far above Nyquist.

## Decision factor in U_13

Owns the Khipu store that every ∏Khipu_i(a) factor reads from.

## HUKLLA tripwire focus (halt-safe, INV-9)

T07 (irreversibility unsigned) + T08 (provenance) — GC without snapshot+gate is forbidden.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/06_KHIPU.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
