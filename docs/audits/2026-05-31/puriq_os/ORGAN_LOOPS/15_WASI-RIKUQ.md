# ORGAN LOOP — WASI-RIKUQ (watchman / house monitoring)

**Doctrine v14 / PURIQ-OS.** This spec describes how **WASI-RIKUQ** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **WASI-RIKUQ** — watchman / house monitoring |
| Cadence | **every 60 s** (high-rate) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **NO (read-only loop)** (2-person Yuyay-gate required if yes) |
| Halt-authority | advisory only (no halt-authority) |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** Sweep house health: disk, memory, queue depths, loop liveness across all 16 organs.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `monitor` — collect + score house-health vitals
  - `raise_health_advisory` — advise (NOT halt) on a degraded vital
  - `noop_heartbeat`

**(3) EXECUTE.** Advisory only — WASI-RIKUQ has NO halt-authority (LOCKED: HUKLLA is sole halt-authority). Advisories are receipted.

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** Track which vitals trend toward thresholds; propose proactive-maintenance windows.

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the every 60 s cadence (Shannon–Nyquist, INV-8): House health is high-bandwidth → 60-s poll, matching HUKLLA/KILLINCHU.

## Decision factor in U_13

IS Wasi(a) — the monitoring/observability factor; advisory, cannot veto.

## HUKLLA tripwire focus (halt-safe, INV-9)

Feeds T05 (resource) + T11 (loop runaway) signals to HUKLLA; holds no halt-authority itself.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/15_WASI-RIKUQ.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
