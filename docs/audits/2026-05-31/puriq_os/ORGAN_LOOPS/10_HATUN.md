# ORGAN LOOP — HATUN (doctrine / v15 proposal bot)

**Doctrine v14 / PURIQ-OS.** This spec describes how **HATUN** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **HATUN** — doctrine / v15 proposal bot |
| Cadence | **every 12 h** (mod 12 (hours)) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **YES** (2-person Yuyay-gate required if yes) |
| Halt-authority | subject to HUKLLA halt-authority |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** Read accumulated reflection meta-receipts + gap reports; identify candidate doctrine deltas.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `propose_delta` — open a PR proposing a Doctrine v15 addition (ADDITIVE only)
  - `withdraw_proposal` — retract a proposal that fails the additivity guard
  - `noop_heartbeat`

**(3) EXECUTE.** A proposal PR is state-changing (external) → 2-person gate; founder approval is required to merge. The additivity guard (SF-10) + HUKLLA forbid removing any safety axiom or editing a LOCKED number.

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** Track proposal acceptance rate; refine proposal quality (Reflexion) — never weaken safety to raise acceptance.

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the every 12 h cadence (Shannon–Nyquist, INV-8): Doctrine evolves slowly (lowest decision-bandwidth among active organs); 12-h poll suffices.

## Decision factor in U_13

Self-Modifying Doctrine (Frontier #1): the empire evolves doctrine within a safety envelope.

## HUKLLA tripwire focus (halt-safe, INV-9)

T17 (doctrine mutation unbounded) — proposals outside the HUKLLA-bounded envelope are vetoed.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/10_HATUN.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
