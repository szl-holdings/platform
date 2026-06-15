# Bekenstein Batch Sponge (evolve-loop #1)

The **Curtailed-renewable / negative-price Bekenstein Batch Sponge**
(`batch_sponge.py`) soaks otherwise-wasted power: when the energy signal reports
a CHEAP window backed by a genuinely STRANDED source, it FLOODS the scheduler's
proactive queue with bounded batch jobs (eval runs, embedding refresh, receipt
generation); when power goes dear it DRAINS — it stops refilling and the
scheduler's energy gate holds the rest until the next cheap window.

It **adds no scheduling logic.** It composes the three existing pieces in this
directory + the in-tree feed:

- `scheduler.AgenticGpuScheduler` — priority + preemption (unchanged). The sponge
  only calls `submit_proactive(...)`; **reactive preemption remains the
  load-bearing anti-starvation guarantee.**
- `energy_gate_adapter.make_energy_gate(...)` — the ADMISSION POINT. Each queued
  batch job is admitted only while the live posture is cheap; going dear closes
  the gate automatically, so "drain" is just *stop refilling + let the closed
  gate hold the rest*.
- `energy_signal.current_posture()` — the SIGNAL. The sponge reads `window` and
  `source` to decide whether to fill, and stamps each receipt with the **real**
  source/window provenance.

## Soakable window (the honest decision)
A window is soakable iff `window == "cheap"` **and** `source` is in
`STRANDED_SOURCES = ("curtailed-renewable", "negative-price", "off-peak")`. A
merely-cheap window of unknown provenance is **not** soaked, and the source is
**never upgraded** — the receipt records exactly what the signal reported. Today
the honest feed emits `off-peak`; the wholesale stub never fabricates a
`curtailed-renewable`/`negative-price` claim until a real keyed feed is wired.

## Receipt shape (per batch job)
Matches `szl_energy_budget.track_task`:
`{task_id, kind, output_bytes, shannon_bits, bekenstein_bound_bits, within_bound,
energy_source, window, joules_est, joules_est_label, sample, gate}`. The
**F19/TH6 Bekenstein gate** `shannon_bits <= output_bytes*8` is asserted per job;
`shannon_bits` defaults to the honest worst case (full entropy, `output_bytes*8`)
so the bound holds with equality — never an over-claim. Every `joules_est` is
labeled **SAMPLE/ESTIMATE**.

## Self-test scenario (`python3 batch_sponge.py`)
Deterministic, no network/GPU/model: cheap curtailed window → sponge fills the
proactive queue → a reactive turn arrives mid-soak and **preempts within one
tick** → power goes dear → sponge **drains** (stops filling; gate holds the
backlog) → window returns cheap → backlog drains. Asserts reactive never
starved, all receipts within the Bekenstein bound and SAMPLE-labeled. Prints
`{"ok": true}`.

## Doctrine (v11/v12 — never violated)
- **Reactive NEVER starves** — enforced by the existing preemptive scheduler; the
  sponge only adds PROACTIVE work.
- We claim `curtailed-renewable` / `negative-price` **only** when the signal's
  `source` says so; otherwise the job records the honest source the posture
  actually reported (today: `off-peak`).
- All joules are **SAMPLE/ESTIMATE** and labeled. No free-energy claim — the
  sponge moves BOUNDED work into windows where power is honestly cheap/wasted.
- Pure stdlib + the in-repo `scheduler` / `energy_gate_adapter` / `energy_signal`
  modules. No network, no key.

## Dependency
`batch_sponge.py` imports `scheduler` and `energy_gate_adapter` (this PR is
branched on **#357** so those resolve in-tree). The adapter auto-wires the live
`energy_signal` feed (**#356**) when present; absent the feed it is
conservative-honest (cannot confirm a cheap window) and the sponge simply never
fills.

Cites: `FRONTIER_BRIEF_gpt.md §1`; Agent.xpu [arXiv:2506.24045](https://arxiv.org/abs/2506.24045).
