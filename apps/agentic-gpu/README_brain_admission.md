# BRAIN — PAC-Bayes belief-update admission (`brain_admission.py`)

**ORGAN 1 · BRAIN** of the anatomy shell. Upgrades the agentic-GPU scheduler's
**proactive** admission from a *binary energy gate* to a **PAC-Bayes
belief-update decision** backed by a real generalization bound. The GPU "mind"
admits a self-initiated (proactive) task only when the proven bound **certifies**
(w.p. ≥ 1−δ) that its expected value clears a threshold — *and* energy/headroom
honestly allow.

This is **proactive-only**. Reactive (latency-critical user) turns are **never**
belief-gated and **never starve**: the scheduler admits reactive work
structurally *before* any gate is consulted, and the self-test proves it on the
real `AgenticGpuScheduler` with the brain gate fully closed.

## The proven formula

The bound is the **McAllester PAC-Bayes** generalization bound (COLT 1999) — the
same inequality the round9 `BrainBeliefUpdate` kernel uses:

```
R(Q) ≤ R̂_S(Q) + sqrt( (KL(Q‖P) + ln(n/δ)) / (2n) )    w.p. ≥ 1 − δ
```

We work in **value space** (`value = 1 − risk`) and certify a **lower confidence
bound** on the true expected value of admitting the task:

```
value_lcb = v_hat − sqrt( (KL(Q‖P) + ln(n/δ)) / (2n) )
admit  ⟺  value_lcb ≥ value_threshold  ∧  power_cheap  ∧  gpu_headroom ≥ floor
```

| Symbol | Meaning here |
|---|---|
| `Q` | posterior belief this task is valuable — `Bern(task_value_estimate)` |
| `P` | the audited prior — `Bern(prior)` |
| `KL(Q‖P)` | **exact** Bernoulli KL `q·ln(q/p) + (1−q)·ln((1−q)/(1−p))` (nats, ≥ 0) |
| `v_hat` | running empirical value of past admissions (`min` with this estimate) |
| `n` | number of observed proactive admissions (evidence) |
| `δ` | `1 − δ` confidence; smaller `δ` ⇒ wider (more honest) slack |

The complexity term is **honest**: it grows when the posterior strays from the
prior (high `KL`), when evidence is scarce (small `n`), or when more confidence
is demanded (small `δ`). It can only certify value the data genuinely support —
the certified `value_lcb` is always strictly **below** the raw estimate.
`Λ` stays **Conjecture 1**; this module does not touch the locked kernel.

CITATION: McAllester, "Some PAC-Bayesian Theorems", **COLT 1999**; round9
`Lutar/Innovations/round9/BrainBeliefUpdate.lean`. (The measure-theoretic
discharge in `Lutar/PACBayes.lean::pac_bayes_bound`, TH13, takes
`BoundedIntegrability` + `ChernoffOptimisation` as **honest open hypotheses** —
Mathlib v4.13.0 lacks the sub-Gaussian MGF lemma — not fabricated theorems.)

## The belief update

`BrainAdmissionController.update(observed_value)` folds each observed admission
outcome into the running empirical mean (online), incrementing `n`. This is the
literal belief-update step: as valuable admissions accumulate, the McAllester
complexity term shrinks and the certified `value_lcb` rises. The self-test shows
`value_lcb` moving from **−0.78** (n=1) to **+0.73** (n=301) for the same task.

## How it maps to the live BRAIN organ

The live runtime for this formula is `pac_bayes_mcallester` on the BRAIN
endpoint:

```
amaru  /api/amaru/v1/formulas  →  pac_bayes_mcallester
```

`fetch_remote_formula()` reads that descriptor **best-effort, read-only, and
sends no key** (the endpoint is open); on any failure it returns `None`. It is
attached as **labeled `remote` provenance only** — the admit/defer **decision
always uses the local, self-contained honest bound**, so no network is required
and the self-test passes offline.

> Off-box today the endpoint is unreachable (expected); the module is fully
> functional standalone via the local bound.

## Integration with the scheduler (proactive-only, no scheduler change)

`scheduler.py` exposes the seam `energy_gate: Callable[[Task], bool]`, called
**only** on the proactive-admission path. `make_brain_gate(...)` returns exactly
that callable:

```python
from scheduler import AgenticGpuScheduler
from brain_admission import BrainAdmissionController, make_brain_gate

brain = BrainAdmissionController(prior=0.6, empirical_value=0.9, n_samples=500,
                                 value_threshold=0.5)
gate = make_brain_gate(
    brain,
    power_signal=lambda: power_is_cheap(),     # SAMPLE policy signal
    headroom_signal=lambda: gpu_headroom(),    # SAMPLE [0,1]
    task_value_fn=lambda t: t.value_estimate,  # per-task value estimate
)
sched = AgenticGpuScheduler(energy_gate=gate)   # reactive untouched
```

No scheduler change is required. `power_signal` defaults to conservative-honest
`False` (mirrors `daemon.power_not_cheap`); `task_value_fn` defaults to reading a
`.value_estimate` attribute, else a neutral `0.5`. The gate exposes `.controller`
for telemetry without breaking the `Callable[[Task], bool]` signature.

## Doctrine compliance (v11/v12)

- **Reactive NEVER starves** — proactive-only gate; proven on the real scheduler
  with a fully-closed brain gate (reactive serves tick 1, proactive held tick 2).
- **The bound is HONEST** — the real McAllester complexity term with **exact
  Bernoulli KL**; certified value is strictly below the raw estimate; open
  hypotheses surfaced, not a fudge.
- **SAMPLE labels** — value, power, and headroom are `SAMPLE/ESTIMATE` policy
  signals until a real meter is wired; every decision says so.
- **open-weight only; NEVER a key** — pure stdlib; remote read is unauthenticated.
- **`Λ` = Conjecture 1**; locked-8 untouched; additive module.

## Run the self-test (no network, no GPU)

```bash
python3 brain_admission.py    # → {"ok": true}
```

Proves: a high-confidence/high-value proactive task **admitted**; low-confidence
(tiny `n`), low-value, power-dear, and no-headroom tasks all **deferred**; the
belief update tightens the bound as evidence arrives; and **reactive always
serves** on the real scheduler under a fully-closed brain gate.
