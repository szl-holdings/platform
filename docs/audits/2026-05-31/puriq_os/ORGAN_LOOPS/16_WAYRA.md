# ORGAN LOOP — WAYRA (ingestion / feed intake)

**Doctrine v14 / PURIQ-OS.** This spec describes how **WAYRA** stops *waiting for a call* and
instead runs its own **Agentic Loop** (observe → decide → execute → sign Khipu → reflect →
Bayesian-update → loop). Cybernetics, not mysticism. Sign as Yachay · Perplexity Computer Agent.

| Field | Value |
|---|---|
| Organ | **WAYRA** — ingestion / feed intake |
| Cadence | **always-on (event-driven)** (edge) |
| Runtime class | `OrganAgent` subclass (`puriq_os/organ_base.py`), loop in `puriq_os/loop.py` |
| State-changing? | **YES** (2-person Yuyay-gate required if yes) |
| Halt-authority | subject to HUKLLA halt-authority |

## The cycle (per Puriq-Tick)

**(1) OBSERVE.** On each feed event, read the incoming data chunk + source provenance.

**(2) DECIDE** — `a* = argmax_{a∈𝒜} U_13(a|x)`, with action repertoire 𝒜:
  - `ingest` — validate, dedupe, and admit a feed chunk into the RAG/store
  - `quarantine` — isolate a chunk failing provenance or schema checks
  - `noop_heartbeat`

**(3) EXECUTE.** Writing ingested data to the store is state-changing → 2-person gate; ingestion is receipted.

**(4) SIGN KHIPU.** Emit exactly **one** DSSE-signed, hash-chained Khipu receipt for this tick
(`khipu_signer.py`). Receipts are high-volume by design (empire-wide ≈50/min) and Merkle-linkable.

**(5) REFLECT (Reflexion).** Track quarantine rate + dedupe ratio; refine ingestion filters (Reflexion).

**(6) BAYESIAN UPDATE (INV-10).** Posterior over this organ's convergence ∝ prior · likelihood(receipt);
belief moves only through receipted evidence — fully auditable.

**(7) SLEEP / re-arm.** Re-arm at the always-on (event-driven) cadence (Shannon–Nyquist, INV-8): Feed rate is the bandwidth; event-driven per chunk.

## Decision factor in U_13

Contributes provenance inputs to ∏Khipu_i(a).

## HUKLLA tripwire focus (halt-safe, INV-9)

T08 (provenance) — unprovenanced feed chunks are quarantined, never silently ingested.
HUKLLA (60-s sweep) is the **sole halt-authority**; any trip latches this loop into `HALTED`,
and resume requires the 2-person admin gate.

## Invariants carried

- **INV-1** no compensation — a sub-floor Yuyay axis zeroes U_13 (algebraic root).
- **INV-8** cadence-boundedness — this organ polls at ≥ 2× its watched-signal bandwidth.
- **INV-9** halt-safety — a tripwire trip terminates the loop deterministically.
- **INV-10** Bayesian consistency — every receipt updates belief.

— Doctrine v14, ORGAN_LOOPS/16_WAYRA.md. Additive over v13/v12/v11 LOCKED. Sign as Yachay.
