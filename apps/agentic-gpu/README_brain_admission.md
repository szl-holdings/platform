# BRAIN — PAC-Bayes belief-update admission (`brain_admission.py`)

**ORGAN 1 · BRAIN** of the anatomy shell. Upgrades the agentic-GPU scheduler's
**proactive** admission from a *binary energy gate* to a **PAC-Bayes
belief-update decision** backed by a real generalization bound. The GPU "mind"
admits a self-initiated (proactive) task only when its value, certified under
uncertainty by the proven bound, clears a threshold — so it never spends GPU
cycles on work whose generalization slack isn't covered by the evidence it has.

This is **proactive-only**. Reactive (latency-critical user) turns are **never**
belief-gated and **never starve** — the doctrine guarantee is preserved exactly.

## The proven formula

The bound is the **McAllester / Catoni PAC-Bayes** generalization bound — the
SAME formula proven in the round9 kernel
(`Lutar/Innovations/round9/BrainBeliefUpdate.lean`):

```
R(Q) ≤ R̂_S(Q) + sqrt( (KL(Q‖P) + ln(2√n/δ)) / (2n) )    w.p. ≥ 1 − δ
```

| Symbol | Meaning here |
|---|---|
| `R̂_S(Q)` | empirical **risk** over `n` cited observations — here `1 − value_hat` |
| `KL(Q‖P)` | KL divergence of the posterior belief `Q` from the **audited prior** `P` — how far the mind has moved from its receipts |
| `n` | evidence count (cited receipts / past task outcomes) |
| `δ` | `1 − δ` is the confidence; smaller `δ` ⇒ wider (more honest) slack |

We turn the risk **upper** bound into a value **lower** bound (`value = 1 − risk`):

```
value_lower_bound = value_hat − halfwidth(n, δ, KL)
admit  ⟺  value_lower_bound ≥ threshold
```

The brain admits a proactive task iff its **worst-case certified value** clears
the threshold. Two monotonicity properties (proved **sorry-free** in the Lean
surrogate, `BrainBeliefUpdate.lean` KEY 1 / KEY 2) make the policy honest:

- **`slack_mono_in_kl`** — moving farther from the audited prior (larger `KL`)
  can only **widen** the certified slack. A belief that wandered from its
  receipts pays for it.
- **`evidence_tightens`** — more cited evidence (larger `n`) can only **tighten**
  the bound. Confidence is earned with data, not asserted.

### Honesty about the proof (no overclaim)

The full measure-theoretic discharge (`Lutar/PACBayes.lean::pac_bayes_bound`,
TH13) takes two **explicit open hypotheses** because Mathlib v4.13.0 lacks the
sub-Gaussian MGF lemma:

- `BoundedIntegrability`
- `ChernoffOptimisation`

These are **honest open obligations, NOT fabricated theorems**. Every
`AdmissionDecision` carries them in `open_hypotheses` so no decision overclaims
its rigor. The half-width is the **real** McAllester/Catoni term — not a fudge
factor. `Λ` stays **Conjecture 1**; this module does not touch the locked kernel.

CITATION: `thesis_v22.pdf §2` · LEAN: `Lutar/PACBayes.lean::pac_bayes_bound (TH13)`
· ORGAN: `Lutar/Innovations/round9/BrainBeliefUpdate.lean`
(McAllester 1999 COLT / 2003 ML 51(1):5–21; Catoni 2007, IMS LNMS 56).

## How it maps to the live BRAIN organ

The live runtime for this formula is `pac_bayes_mcallester` on the BRAIN
endpoint:

```
amaru  /api/amaru/v1/formulas  →  pac_bayes_mcallester
```

When `use_endpoint=True` and the endpoint is reachable, the controller reads the
server's half-width for `(n, δ, KL)` and labels the decision `brain-endpoint`.
The endpoint computes the **same proven bound**, so it is an **oracle for the
formula, not a different policy** — a mismatch would be a server bug. The read is
**read-only, sends no key, and never raises**; on any miss it falls back to the
**identical self-contained local bound** (`local-formula`). The admit/defer
decision is the same either way.

> Off-box today this endpoint is unreachable (DNS/`000`), which is expected — the
> module is fully functional standalone via the local bound.

## Integration with the scheduler (proactive-only, no scheduler change)

`scheduler.py` exposes the seam `energy_gate: Callable[[Task], bool]`, called
**only** on the proactive-admission path (reactive work is never routed through
it). `BrainAdmissionController.as_energy_gate()` returns exactly that callable:

```python
from scheduler import AgenticGpuScheduler
from brain_admission import BrainAdmissionController

brain = BrainAdmissionController(threshold=0.5, delta=0.05)
sched = AgenticGpuScheduler(energy_gate=brain.as_energy_gate())
# Proactive tasks now pass the PAC-Bayes belief-update; reactive is untouched.
```

No scheduler change is required. The default `*_of` extractors derive
conservative **SAMPLE** `(value_hat, n, KL)` from the stock `Task` shape
(cheaper-per-tick ⇒ higher value; longer ⇒ more evidence; `KL=0` ⇒ belief at the
audited prior); the daemon can inject richer signals later via `value_of=`,
`evidence_of=`, `kl_of=`.

## Doctrine compliance (v11/v12)

- **Reactive NEVER starves** — proactive-only gate; `admit_reactive()` always
  admits with an infinite bound; the self-test proves a reactive turn completes
  even under a **deny-all** brain gate.
- **The bound is HONEST** — the real generalization half-width, with the Lean
  proof's open hypotheses surfaced verbatim.
- **SAMPLE labels** — value/evidence inputs are `SAMPLE/ESTIMATE` until a real
  task-outcome meter is wired; every decision says so.
- **open-weight only; NEVER a key** — pure stdlib; endpoint read is unauthenticated.
- **`Λ` = Conjecture 1**; locked-8 untouched; additive module.

## Run the self-test (no network, no GPU)

```bash
python3 brain_admission.py    # → {"ok": true}  (24 checks)
```

Simulates: a high-confidence valuable proactive task **admitted**; a
low-confidence / far-from-prior proactive task **deferred**; a reactive task
**always admitted** (even under a strict threshold); the half-width's
monotonicity in `n` and `KL`; the endpoint-oracle path with honest local
fallback; and the real scheduler wiring (reactive completes despite a deny-all
gate, proactive held).
