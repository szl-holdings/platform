# BRAIN admission — PAC-Bayes belief-update (proactive-only)

`brain_admission.py` is the **BRAIN organ** of the agentic-GPU anatomy shell. It
upgrades the scheduler's PROACTIVE admission from a *binary energy gate* to a
**PAC-Bayes belief-update decision**: the GPU "mind" admits a proactive task only
when a real generalization bound *certifies* its expected value is above a
threshold — and energy/headroom honestly allow.

This file is **disjoint** from the shared `apps/agentic-gpu/README.md` (which is
edited by other lanes) on purpose, to avoid concurrent-lane merge conflicts.

## The proven formula (McAllester PAC-Bayes, 1999)

For posterior belief `Q`, prior belief `P`, `n` i.i.d. samples and confidence
`1 - delta`, with probability `>= 1 - delta` the TRUE risk `R(Q)` obeys:

```
R(Q) <= R_hat(Q) + sqrt( ( KL(Q||P) + ln(n/delta) ) / (2n) )
```

(McAllester, *"Some PAC-Bayesian Theorems"*, COLT 1999.) This is exactly the
round9 **BrainBeliefUpdate** kernel formula.

Working in **value space** (`value = 1 - risk`), the certified expected value is
the LOWER confidence bound:

```
value_lcb(Q) = v_hat(Q) - sqrt( ( KL(Q||P) + ln(n/delta) ) / (2n) )
```

- `Q = Bern(task_value_estimate)` — this task's value belief.
- `P = Bern(prior)` — the prior belief that an arbitrary proactive admission is
  valuable.
- `v_hat(Q)` — empirical mean value of "admitting was valuable" over `n`
  observed admissions (the running belief, updated online via `.update()`).
- `KL(Q||P) = q·ln(q/p) + (1-q)·ln((1-q)/(1-p))` — the **exact** Bernoulli KL
  divergence (implemented in `bernoulli_kl`), not an approximation.

## Why the bound is HONEST (not a fudge)

The complexity term `sqrt((KL + ln(n/delta)) / (2n))` is a genuine generalization
bound: it **grows** when the posterior strays from the prior (high `KL`), when
samples are few (small `n`), or when more confidence is demanded (small `delta`).
The decision uses the **lower** confidence bound, so `admit` means the inequality
*proves* (w.p. `>= 1-delta`) that expected value clears the threshold. A
low-confidence (tiny `n`) or low-value task simply fails to certify and is
deferred. The self-test demonstrates the term shrinking as evidence accrues
(`value_lcb` rises from `n=1` to `n=301`).

## The decision (proactive only)

```
ADMIT  iff  value_lcb >= value_threshold  AND  power_cheap  AND  gpu_headroom >= headroom_floor
DEFER  otherwise
```

`power_cheap` and `gpu_headroom` are **SAMPLE/ESTIMATE** policy signals — no
joule figure is measured here (labeled `joules_label: "SAMPLE/ESTIMATE"`).

## How it composes with the scheduler

`make_brain_gate(...)` returns a `scheduler.EnergyGate`-compatible callable
(`Callable[[Task], bool]`). The scheduler invokes `EnergyGate` **only** for
proactive admission — reactive turns are admitted structurally in `tick()` step 2,
**before** any gate is consulted. So this gate is proactive-only by construction.

```python
from brain_admission import make_brain_gate, BrainAdmissionController
from scheduler import AgenticGpuScheduler

gate = make_brain_gate(
    BrainAdmissionController(prior=0.6, empirical_value=0.9, n_samples=500),
    power_signal=lambda: True,          # SAMPLE power-window signal
    headroom_signal=lambda: 0.8,        # SAMPLE GPU headroom in [0,1]
    task_value_fn=lambda t: 0.9,        # per-task value estimate in [0,1]
)
sched = AgenticGpuScheduler(energy_gate=gate)
```

## Live BRAIN endpoint mapping

`fetch_remote_formula()` may read the live BRAIN endpoint
`amaru /api/amaru/v1/formulas` (key `pac_bayes_mcallester`) when reachable —
stdlib `urllib`, short timeout, **never raises, never sends a key** (open /
read-only). Any remote value is surfaced as **provenance only** (labeled
`remote: true`); the DECISION always uses the local honest bound, so the
self-test passes with **no network**.

## Doctrine floor

- **Reactive NEVER starves / never gated.** Proven on the real scheduler with the
  brain gate fully closed: the reactive turn still serves; only proactive is held.
- **The bound is HONEST** — a genuine McAllester generalization bound, not a
  fudge factor; every claim traces to the proven round9 BrainBeliefUpdate kernel.
- **Energy/joule figures are SAMPLE/ESTIMATE** (labeled).
- **Open-weight only; NEVER commit a key.**
- **Λ stays Conjecture 1** (skeleton killer formula untouched).

## Self-test

```
cd apps/agentic-gpu && python3 brain_admission.py
```

Prints a JSON object containing `"ok": true` iff all assertions pass:

1. a high-confidence, high-value proactive task is **ADMITTED**;
2. a low-confidence (tiny `n`) / low-value proactive task is **DEFERRED** (the
   bound does not certify it), as is a certified task under dear power / no
   headroom;
3. **reactive work is always admitted** (never gated), proven on the real
   `AgenticGpuScheduler` with the brain gate fully closed.

## Citations

- McAllester, D. *"Some PAC-Bayesian Theorems."* COLT 1999.
- round9 **BrainBeliefUpdate** kernel formula (lutar-lean).
- Live runtime: `amaru /api/amaru/v1/formulas` (`pac_bayes_mcallester`).
