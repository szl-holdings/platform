# Energy-Proportional Proactive Admission (Thermal Sovereignty)

`energy_proportional.py` — evolve-loop **#5** for SZL's Proven Energy Engine.

Scales **PROACTIVE** GPU admission to live **thermal / power HEADROOM**:

- More headroom (cool, far from the power cap) → admit more proactive batch.
- Near the thermal **or** power cap → throttle to **reactive-only**.

It is a `scheduler.EnergyGate` (`Callable[[Task], bool]`) that gates **only**
proactive admission. **Reactive turns never pass through this gate**, so they can
never be throttled by it — thermal sovereignty is backpressure on self-initiated
batch work, never on user-facing latency-critical turns.

## Physics: a FLOOR and a CEILING (neither is free energy)

- **Landauer floor (LOWER bound).** The minimum energy to irreversibly erase one
  bit is `E_min = kT·ln2 ≈ 2.87e-21 J` at 300 K (Landauer 1961; experimentally
  confirmed, Bérut et al., *Nature* 2012; see also the bit-reset measurement in
  *Sci. Rep.* 4:05394, 2014). This is the energy a per-bit estimate must *clear*
  to be physically honest — **not** a budget and **not** a free-energy claim.
  `landauer_floor_joules(bits)` and `joules_estimate_is_physical(joules, bits)`
  flag any SAMPLE joules figure that falls below the floor (the dishonest
  half-state) rather than blessing it.
- **Bekenstein ceiling (UPPER bound).** Its mirror image: information content
  `bits ≤ N·8` (TH6/F19), enforced in the monotone energy-budget ledger
  (`szl_energy_budget.py`). Floor ≤ real work ≤ ceiling.

## Energy-proportional computing

Draw power in proportion to **useful work**; idle/static power is waste
(Barroso & Hölzle, *The Case for Energy-Proportional Computing*, 2007; see also
recent surveys, e.g. arXiv:2506.04062). Under a fixed thermal cap, the honest
move is to fill **cool headroom** with proactive batch and back off smoothly as
the cap approaches — not to thrash the cooler or to claim capacity that isn't
there.

## Headroom model

`headroom = min(power_headroom, thermal_headroom)` — the **tighter** of the two
binds, so we back off when *either* power *or* temperature nears its cap.

| Source        | `measured` | Label      | When |
|---------------|------------|------------|------|
| `pynvml`      | `True`     | `MEASURED` | on-box, NVML binding present |
| `nvidia-smi`  | `True`     | `MEASURED` | on-box, CLI present |
| `sample-model`| `False`    | `SAMPLE`   | off-box (this runs off-box for now) |

`read_telemetry()` prefers real NVML, then `nvidia-smi`, then the SAMPLE model.
A simulated draw is **never** presented as measured. SAMPLE caps model the
RTX 5000 (Ada) class at betterwithage: ~230 W board cap, ~83 °C slowdown.

## Self-test

```bash
python3 energy_proportional.py
```

Prints `{"ok": true, ...}`. No network, no GPU required. It exercises:

- headroom model: cool → ample headroom; hot/near-cap → little; SAMPLE labeled SAMPLE;
- the gate: high headroom **admits**, low headroom **throttles**;
- scheduler integration — when `scheduler.py` (PR #357) is colocated it drives
  the **real** scheduler and proves reactive runs while proactive is throttled
  (`reactive_runs_despite_throttle`, `proactive_throttled_when_hot`,
  `proactive_admitted_when_cool`); otherwise it emulates the gate-only contract;
- the Landauer floor: positive, monotone in bits, at-floor estimate physical,
  below-floor estimate flagged.

`scheduler_integration_exercised` in the output reports which path ran.

## Integration

```python
from scheduler import AgenticGpuScheduler
from energy_proportional import make_energy_gate

sched = AgenticGpuScheduler(energy_gate=make_energy_gate())  # NVML headroom drives proactive admission
```

Composes with the cheap-window gate (`energy_gate_adapter.make_energy_gate`) and
the batch sponge (#1): the sponge floods proactive when power is cheap, this gate
holds it back when the GPU is thermally saturated. The receipt loop
(`szl_energy_budget.track_task`) can attach `headroom_report()` for a dashboard
snapshot. Defensive `scheduler` import keeps this file importable, ast-clean, and
self-testable on a branch where PR #357 is not yet merged.

## Doctrine (v11/v12)

- NVML draw is **MEASURED only on-box**; off-box figures are **SAMPLE** — never
  the half-state of claiming more headroom/sovereignty than is real.
- **Landauer is a FLOOR, not free energy**; Bekenstein is the ceiling.
- **Reactive never starves** — the gate is proactive-only, by construction.
- Joules are SAMPLE/ESTIMATE off-box until a real meter is wired.
- Pure stdlib + optional `pynvml`/`nvidia-smi`; no network, no key; open-weight only.
