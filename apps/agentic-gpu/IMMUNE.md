# IMMUNE — Neyman-Pearson admission gate (`immune_gate.py`)

The **IMMUNE organ** of the agentic-GPU anatomy shell. It makes the agentic
GPU's **PROACTIVE-admission** decision a Neyman-Pearson **optimal (most-powerful)
test**: admit batch / proactive work only when the evidence (cheap power + GPU
headroom + task safety + value) passes an NP likelihood-ratio test at a
controlled false-admit rate `alpha` — and **denies by default** otherwise.

- File: `apps/agentic-gpu/immune_gate.py`
- Composes with (does **not** modify) `apps/agentic-gpu/scheduler.py`.

## Proven backing

**ImmuneNeymanPearson** (lutar-lean round9, kernel-proven). By the
**Neyman-Pearson lemma**, among all tests of `H0` vs `H1` with type-I
(false-positive) rate `<= alpha`, the **likelihood-ratio test**
`Λ(x) = p1(x)/p0(x) >= k` is the **most powerful** — it maximizes
true-positive (admit-good) power at that `alpha`. So a deny-by-default immune
gate that thresholds the LR at the `k` matching the chosen `alpha` is provably
the best admit/deny rule for a given false-admit budget.

Hypotheses, per proactive task, given evidence `x`:

- `H0`: the task should **NOT** be admitted now (power dear / no headroom / unsafe).
- `H1`: the task **SHOULD** be admitted now (cheap power + headroom + safe + valuable).

Decision: **ADMIT iff** `Λ(x) >= k(alpha)`, else **DENY** (deny-by-default).

### The model (honest, pure stdlib)

Each evidence feature in `[0,1]` is modeled as an independent Gaussian with a
shared variance. `H1` ("admit") centers features high (`mu1=0.80`); `H0`
("deny") centers them low (`mu0=0.20`). For shared-variance Gaussians the
per-feature log-LR has the exact closed form
`(mu1-mu0)/sigma^2 * (x_i - (mu1+mu0)/2)`, so the joint `log Λ(x)` is a weighted
sum (weights let safety/power matter more) and is **monotone** in each feature —
the most-powerful statistic.

### Honest `alpha` -> threshold control (no fudge factor)

`log Λ` is **linear in `x`**, so under `H0` it is itself Gaussian with a
closed-form mean and SD. The threshold is the exact `(1-alpha)` quantile of that
H0 distribution: `log k = mu0_loglr + z_{1-alpha} * sd0_loglr`, where the
z-quantile comes from a stdlib inverse-normal (Acklam) approximation. This makes
the false-admit rate honestly controlled at `alpha` — **not** a hand-tuned knob.
Raising `alpha` lowers the threshold (admits more); lowering it admits less. The
self-test verifies this monotonicity and a Monte-Carlo realized false-admit rate
near `alpha`.

## Live runtime: the 8 sentra gates

The live IMMUNE endpoint is `sentra /api/sentra/v1/gates` — **8 deny-by-default
gates**: `overclaim`, `sovereignty`, `energy_honesty`, `consent`,
`key_exposure`, `open_weight`, `provenance`, `safety`. `immune_gate.py` names
them in `SENTRA_GATES` (reported as `gates_consulted`) and treats a hard rejection
from any of them as an immediate DENY regardless of the soft LR.

`sentra_gates_reachable()` is a best-effort, pure-stdlib, short-timeout liveness
probe that **never raises** and **sends no key**. It is **off-box by default**
(unreachable -> fall back to the self-contained NP test). It is advisory only: a
reachable endpoint never auto-admits, and an unreachable one keeps
deny-by-default via the local test.

## Composition with the energy gate (logical AND)

`scheduler.EnergyGate = Callable[[Task], bool]` decides whether a **proactive**
task may be admitted now; the scheduler calls it **only** for proactive
candidates. `make_immune_gate(...)` returns an `EnergyGate`-compatible callable,
and `compose_gates(*gates)` ANDs it with an existing energy gate:

```python
from scheduler import AgenticGpuScheduler
from immune_gate import make_immune_gate, compose_gates

energy_gate = ...                      # existing energy/power gate
immune_gate = make_immune_gate(evidence_fn=my_evidence, alpha=0.05)
gate = compose_gates(energy_gate, immune_gate)   # admit iff BOTH admit
sched = AgenticGpuScheduler(energy_gate=gate)
```

A task is admitted **only if every gate admits**; any gate that denies (or
raises) denies the whole — deny-by-default composition. The immune gate stacks
**on top of** the energy gate without touching either module.

## Why reactive is never gated

REACTIVE turns (user-facing Chaski) are latency-critical and **must always
serve**. This is enforced two ways:

1. **Structurally** — the scheduler routes reactive work around every gate; the
   energy/immune gate is only ever called for proactive candidates.
2. **Defense in depth** — `make_immune_gate` short-circuits to **ADMIT** for any
   task whose `priority == Priority.REACTIVE`, so even if the gate were
   mis-applied to reactive work it could never deny it.

## Doctrine compliance

- **Deny-by-default**: missing/weak/ambiguous evidence, any error, malformed
  features, or an unreachable endpoint all resolve to **DENY** (fail-closed).
- **Reactive never gated** (structural + defense-in-depth guard).
- **Honest test**: a real NP likelihood-ratio with a derived, `alpha`-controlled
  threshold — not a fudge factor.
- **SAMPLE/ESTIMATE** labels on all energy-derived evidence (no metered joule).
- **Open-weight only; no key ever sent; pure stdlib** (`math`, `json`, `urllib`).

## Self-test

Run from inside `apps/agentic-gpu/` (so `from scheduler import ...` resolves; the
module also adds its own dir to `sys.path` defensively):

```bash
cd apps/agentic-gpu
python3 immune_gate.py
```

Expected (last line of the JSON report):

```json
"ok": true,
```

The self-test (27 checks) covers: strong evidence -> ADMIT; weak evidence ->
DENY; conservative default -> DENY; hard sentra-gate rejection -> DENY despite
strong evidence; Monte-Carlo realized false-admit rate near `alpha` with real
test power; `alpha` monotonicity (raising `alpha` admits more); composition with
an energy gate (either denying -> DENY); a raising gate denies; real-scheduler
integration where a **REACTIVE turn serves despite a deny-all immune gate** while
proactive is held then completes once admitted; and the structural reactive guard
(`is_reactive`). `out["ok"]` is `true` only if every assertion passes.

ast-parse check:

```bash
python3 -c "import ast; ast.parse(open('immune_gate.py').read()); print('ast OK')"
```
