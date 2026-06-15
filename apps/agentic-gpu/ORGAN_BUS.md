# SZL Agentic-GPU — Organ Bus (the integration spine)

The **organ bus** (`organ_bus.py`) is the integration layer that lets the
resident agentic-GPU daemon (`daemon.py` + `scheduler.py`, the Agent.xpu pattern
— [arXiv:2506.24045](https://arxiv.org/abs/2506.24045)) **call each LIVE anatomy
organ as a body function**. The RTX 5000 is the "mind"; this bus is the nervous
trunk that drives a proven anatomical **body** of organ formulas — each with a
live HTTP endpoint — while **honest-degrading** the instant an organ is
unreachable.

It is the **spine** connecting the other lanes (A1 `brain_admission.py`, A2
`immune_gate.py`, A3 heart/blood, A4 `nervous_monitor.py`): it defines stable
plug-in contracts those modules slot into, but it does **not** depend on their
files existing — the contracts are defined here and default to built-in
honest-degrading HTTP clients.

## Body wiring diagram — which organ gates which step

```
    proactive task
         |
         v
    [IMMUNE]  sentra /api/sentra/v1/gates          (Neyman-Pearson, 8 gates)
         |        deny-by-default: if DENY or DOWN -> DEFER, no run.
         |  admit?
         v
    [BRAIN]   amaru /api/amaru/v1/formulas          (PAC-Bayes McAllester)
         |        belief-update / decision: admit | defer (conservative).
         |  decide?
         v
      [RUN]   <local stub — the GPU body does the work>
         |
         +--> [HEART]  amaru /api/amaru/receipts     (sigma-algebra receipt bus)
         |        emit a receipt / heartbeat for the action.
         +--> [BLOOD]  sentra /api/sentra/khipu/sign  (DSSE-style provenance)
         |        sign the receipt (NO real key — read/probe + local digest).
         v
   [NERVOUS]  amaru /api/amaru/overwatch/snapshot     (Shannon-alarm drift)
                 proprioception: posture + drift snapshot after the action.

   [SKELETON] amaru /api/amaru/v1/math/lean/theorems  (the Lean proof spine)
                 claims trace to a proven theorem; available out-of-band so any
                 organ result can cite the formula it rests on.
```

**The order is the doctrine.** IMMUNE adjudicates first (deny-by-default), BRAIN
decides second (conservative defer), only an admitted+decided task RUNs, every
run is receipted (HEART) and signed (BLOOD), and NERVOUS takes a drift snapshot
after. If IMMUNE denies/​is-down, or BRAIN defers, the cycle **defers without
running** — the correct safe outcome.

## Organs, proven formulas, and live endpoints

| Organ | Proven formula | Live endpoint | Bus method |
|-------|----------------|---------------|------------|
| BRAIN | PAC-Bayes McAllester belief-update bound | `amaru /api/amaru/v1/formulas` | `brain_decide(evidence) -> Decision` |
| IMMUNE | Neyman-Pearson deny-by-default gates (8 gates) | `sentra /api/sentra/v1/gates` | `immune_admit(task) -> AdmitResult` |
| HEART | sigma-algebra receipt bus (measurable heartbeat) | `amaru /api/amaru/receipts` | `heart_beat(action) -> Receipt` |
| BLOOD | DSSE-style signed provenance (khipu) | `sentra /api/sentra/khipu/sign` | `blood_sign(receipt) -> SignedReceipt` |
| SKELETON | Lean-verified theorem spine | `amaru /api/amaru/v1/math/lean/theorems` | `skeleton_theorem(name) -> TheoremRef` |
| NERVOUS | Shannon-entropy drift / proprioception alarm | `amaru /api/amaru/overwatch/snapshot` | `nervous_snapshot() -> Snapshot` |

All claims trace to these formulas; the SKELETON method lets any result cite the
Lean theorem it rests on.

## Graceful degradation — per organ (honest-degrade)

Every organ call uses **pure stdlib** (`urllib` + `json` + `math`/`hashlib`), a
**short timeout**, **NEVER raises**, and returns a **labeled fallback** carrying
an `ok`/`reachable` flag and a `source` of `"live"` vs `"fallback/SAMPLE"`. A
configured endpoint is *intent*, not proof it serves.

- **IMMUNE down → DENY-BY-DEFAULT.** The single most important degrade: if the
  immune organ denies *or is unreachable*, the honest safe default is **deny**.
  The proactive cycle **defers, never runs**. We never admit proactive work past
  an immune organ we cannot consult.
- **BRAIN down → conservative defer.** Falls back to a local belief and
  `admit=False` — defer rather than overclaim a decision.
- **HEART down → local receipt stub.** A receipt is *always* produced; when the
  live bus is down it is a labeled local SAMPLE stub (`anchored=False`, id
  `local-…`) so the action is still accounted for and verifiable.
- **BLOOD down → keyless local digest-link.** **No real key is ever used.** The
  fallback signature is a `sha256:` content digest of the receipt — the
  provenance chain stays linked and verifiable, labeled SAMPLE.
- **SKELETON down → static proven reference.** Returns a static reference
  (`verified=False`) to the proven formula name so claims can still cite it.
- **NERVOUS down → local posture snapshot.** Returns a labeled local posture
  with unknown drift and no alarm.

## Reactive is NEVER gated

The bus's `immune_admit` / `brain_decide` inform **PROACTIVE admission only**
(the `scheduler.EnergyGate = Callable[[Task], bool]` seam). `proactive_cycle()`
touches **only** proactive work. The bus exposes **no reactive gating surface at
all** — there is no method whose name contains "reactive", and the self-test
asserts this. Reactive Chaski turns preempt proactive work in the scheduler and
are never blocked by any organ call.

## Plug-in contracts (A1–A4 injection)

`organ_bus.py` defines small `Protocol` interfaces so the lane modules can be
injected, each defaulting to the built-in honest-degrading HTTP client:

- `BrainDecider` ← A1 `brain_admission.py`
- `ImmuneAdmitter` ← A2 `immune_gate.py`
- `HeartBeater` / `BloodSigner` ← A3 heart/blood
- `NervousSensor` ← A4 `nervous_monitor.py`

```python
from organ_bus import OrganBus
bus = OrganBus()                       # built-in honest-degrading HTTP clients
bus = OrganBus(immune=my_a2_gate)      # inject the A2 lane module when present
result = bus.proactive_cycle({"name": "energy_aware_batch",
                              "evidence": {"prior": 0.8}})
```

The bus does **not** depend on the A1–A4 files existing; the contracts are
defined here and honest-degrade if a module is absent.

## Doctrine compliance

- Per-organ honest-degrade (stdlib, short timeout, never raises, labeled
  fallback).
- IMMUNE deny-by-default when down; reactive never gated.
- Claims trace to the proven formulas; SAMPLE/ESTIMATE figures are labeled.
- open-weight; **never commit a key** — all calls are read/probe with no auth
  header; BLOOD signing falls back to a keyless local digest.
- Pure stdlib; import-safe standalone.

## Self-test

No real network — every fetcher/client is injected/mocked.

```bash
cd apps/agentic-gpu && python3 organ_bus.py
```

Expected tail:

```json
{ "ok": true }
```

The self-test verifies: (a) with **all organs reachable**, a full
`proactive_cycle()` completes immune→brain→run→heart/blood→nervous and admits +
live-signs; (b) with an organ **down**, it honest-degrades — IMMUNE-down ⇒
deny-by-default (defer, no run); HEART/BLOOD-down ⇒ a receipt is still produced
as a labeled local SAMPLE stub, verifiably signed by a re-derivable keyless
digest; (c) the bus exposes **no reactive gating surface**. `out["ok"]` is
`true` only if all asserts pass.

---

Pattern + motivation: **Agent.xpu** — Han et al., *"Agent.xpu: Efficient
Scheduling of Agentic LLM Workloads on Heterogeneous SoC"*
([arXiv:2506.24045](https://arxiv.org/abs/2506.24045), 2025).
