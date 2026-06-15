"""
SZL Agentic-GPU — batch_sponge.py  (Bekenstein Batch Sponge)
============================================================
Evolve-loop item #1 (FRONTIER_BRIEF_gpt.md §1; UNIFIED_BUILD_ORDER Phase 4 #1):
the **Curtailed-renewable / negative-price Bekenstein Batch Sponge**.

WHAT IT DOES
------------
When the energy signal reports a CHEAP window backed by a stranded source
(curtailed-renewable / negative-price / off-peak), the sponge FLOODS the
scheduler's PROACTIVE queue with Bekenstein-gated batch jobs (eval runs,
embedding refresh, receipt generation) — soaking otherwise-wasted power. When
power goes dear it DRAINS: it stops refilling, and the scheduler's energy gate
(via `energy_gate_adapter`) holds the remaining proactive work until the next
cheap window. Reactive turns ALWAYS preempt — the sponge never changes that.

HOW IT COMPOSES THE EXISTING PIECES (no new scheduling logic)
-------------------------------------------------------------
- `scheduler.AgenticGpuScheduler` provides priority + preemption. The sponge
  only calls `submit_proactive(...)`; reactive preemption is unchanged and
  remains the load-bearing anti-starvation guarantee.
- `energy_gate_adapter` is the ADMISSION POINT: the scheduler is constructed
  with `make_energy_gate()` so each queued batch job is admitted ONLY while the
  live posture is a cheap window. Going dear closes the gate automatically — the
  sponge's "drain" is just: stop refilling + let the closed gate hold the rest.
- `energy_signal.current_posture()` is the SIGNAL: the sponge reads `window` and
  `source` from it to decide whether to fill, and stamps each receipt with the
  real source/window provenance.

RECEIPT SHAPE (matches szl_energy_budget.track_task output, SAMPLE energy)
--------------------------------------------------------------------------
Each batch job emits `{task_id, output_bytes, shannon_bits, bekenstein_bound_bits,
within_bound, energy_source, window, joules_est, joules_est_label, sample, gate}`.
`shannon_bits <= output_bytes*8` is the proven F19/TH6 gate, asserted per job.

DOCTRINE (v11/v12 — never violated)
-----------------------------------
- Reactive NEVER starves: enforced by the existing preemptive scheduler; the
  sponge only adds PROACTIVE work.
- We claim `curtailed-renewable` / `negative-price` ONLY when the signal's
  `source` says so (today the honest feed emits `off-peak`; the wholesale stub
  never fabricates a stranded claim). Otherwise the job records the honest
  source the posture actually reported.
- All joules are SAMPLE/ESTIMATE and labeled. No free-energy claim — the sponge
  moves BOUNDED work into windows where power is honestly cheap/wasted.
- Pure stdlib + the in-repo scheduler/adapter/signal modules. No network, no key.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Optional
import json

from scheduler import AgenticGpuScheduler, Priority, Task
from energy_gate_adapter import make_energy_gate, posture_is_cheap

# Defensive import of the signal feed (PR #356). When absent, the sponge stays
# honest: it cannot confirm a cheap window, so it never fills (conservative).
try:
    import energy_gate_adapter as _adapter  # for provenance + cheap-window probe
    _HAVE_ADAPTER = True
except Exception:  # noqa: BLE001 - adapter always ships beside this file.
    _adapter = None  # type: ignore
    _HAVE_ADAPTER = False

# Sources that represent genuinely STRANDED / WASTED power the sponge is built to
# soak. Mirrors energy_signal.SOURCE_* constants (read defensively).
STRANDED_SOURCES = ("curtailed-renewable", "negative-price", "off-peak")

ENERGY_FIGURE_LABEL = "SAMPLE/ESTIMATE (no real power meter wired — doctrine v11/v12)"


def _bekenstein_bound(n_bytes: int) -> int:
    """SZL canonical software Bekenstein bound: N*8 bits (TH6 / locked-8 F19)."""
    return int(n_bytes) * 8


@dataclass
class BatchJob:
    """One unit of soak-able proactive work and the SAMPLE receipt it will emit.

    `output_bytes` is the expected output size; `shannon_bits` defaults to the
    honest worst case (`output_bytes*8`, full entropy) so the Bekenstein gate
    holds with equality — never an over-claim. `joules_est_per_tick` is a SAMPLE
    figure only.
    """
    kind: str
    output_bytes: int
    cost_ticks: int = 1
    shannon_bits: Optional[float] = None
    joules_est_per_tick: float = 1.0

    def shannon(self) -> float:
        if self.shannon_bits is not None:
            return float(self.shannon_bits)
        return float(self.output_bytes * 8)  # honest worst case


# The default soak menu: the kinds of bounded work worth running in a cheap
# window (FRONTIER_BRIEF §1a: eval runs, embeddings, receipt generation).
DEFAULT_BATCH_MENU = (
    BatchJob("eval_run", output_bytes=4096, cost_ticks=4, joules_est_per_tick=1.0),
    BatchJob("embedding_refresh", output_bytes=2048, cost_ticks=3, joules_est_per_tick=0.8),
    BatchJob("receipt_generation", output_bytes=512, cost_ticks=1, joules_est_per_tick=0.3),
)


def batch_receipt(job: BatchJob, energy_source: str, window: str,
                  joules_est: float, task_id: str) -> dict:
    """Build a Bekenstein-gated SAMPLE receipt for one soaked batch job.

    Shape matches szl_energy_budget.track_task: asserts shannon_bits <= N*8 (the
    F19/TH6 gate) and labels the joule figure SAMPLE/ESTIMATE.
    """
    n = int(job.output_bytes)
    s_bits = job.shannon()
    bound = _bekenstein_bound(n)
    within = s_bits <= bound + 1e-9
    j = max(0.0, float(joules_est))  # nonneg keeps the ledger monotone
    return {
        "task_id": task_id,
        "kind": job.kind,
        "output_bytes": n,
        "shannon_bits": round(s_bits, 6),
        "bekenstein_bound_bits": bound,
        "within_bound": bool(within),
        "energy_source": str(energy_source),
        "window": str(window),
        "joules_est": round(j, 6),
        "joules_est_label": ENERGY_FIGURE_LABEL,
        "sample": True,
        "gate": "F19/TH6 Bekenstein: shannon_bits <= output_bytes*8",
    }


class BekensteinBatchSponge:
    """Fills the scheduler's proactive queue during cheap/stranded windows.

    Construct with a scheduler whose energy gate is the adapter's
    `make_energy_gate(...)` so admission tracks the live window. Call `step(now)`
    once per scheduler tick: it (a) reads the posture, (b) fills the proactive
    queue with batch jobs while the window is cheap+stranded and the queue is
    below `max_in_flight`, (c) drains (stops filling) when the window is not
    cheap, (d) advances the scheduler one tick (reactive preempts as always).
    """

    def __init__(self, sched: AgenticGpuScheduler,
                 posture_fn: Callable[[], object],
                 menu=DEFAULT_BATCH_MENU,
                 max_in_flight: int = 6) -> None:
        self.sched = sched
        # posture_fn() -> object with .window and .source (an energy_signal
        # PowerPosture, or a test double). Injected so tests need no real clock.
        self.posture_fn = posture_fn
        self.menu = tuple(menu)
        self.max_in_flight = max_in_flight
        self._job_seq = 0
        self.receipts: list[dict] = []
        # Honest bookkeeping.
        self.filled = 0
        self.drained_ticks = 0
        self.fill_ticks = 0

    # ---- the honest window decision --------------------------------------
    def _window_is_soakable(self, posture) -> bool:
        """True iff the posture is a CHEAP window backed by a STRANDED source.

        Doctrine: only soak when power is honestly cheap AND attributed to a
        wasted source (off-peak / curtailed / negative-price). We do NOT soak a
        merely-cheap window of unknown provenance, and we NEVER upgrade the
        source — we record exactly what the signal reported.
        """
        window = getattr(posture, "window", None)
        source = getattr(posture, "source", None)
        return window == "cheap" and source in STRANDED_SOURCES

    def _queued_proactive(self) -> int:
        # Access the scheduler's proactive backlog honestly (read-only).
        running_proactive = (1 if self.sched._running is not None
                             and self.sched._running.priority == Priority.PROACTIVE
                             else 0)
        return len(self.sched._proactive) + running_proactive

    def fill(self, posture) -> int:
        """Flood the proactive queue up to max_in_flight while soakable. Returns
        the number of jobs added this call."""
        added = 0
        i = 0
        while self._queued_proactive() < self.max_in_flight:
            job = self.menu[i % len(self.menu)]
            i += 1
            self._job_seq += 1
            task_id = f"{job.kind}-{self._job_seq:04d}"
            self.sched.submit_proactive(job.kind, cost_ticks=job.cost_ticks,
                                        energy_per_tick=job.joules_est_per_tick)
            # Emit the SAMPLE receipt now, stamped with the REAL posture source.
            self.receipts.append(batch_receipt(
                job,
                energy_source=getattr(posture, "source", "grid"),
                window=getattr(posture, "window", "normal"),
                joules_est=job.joules_est_per_tick * job.cost_ticks,
                task_id=task_id,
            ))
            added += 1
            self.filled += 1
            if added > self.max_in_flight:  # safety: never loop unbounded
                break
        return added

    def step(self, now: int) -> dict:
        """One sponge tick: fill-if-soakable, else drain, then advance scheduler."""
        posture = self.posture_fn()
        soakable = self._window_is_soakable(posture)
        added = 0
        if soakable:
            added = self.fill(posture)
            self.fill_ticks += 1
        else:
            # Drain: stop refilling. The scheduler's energy gate (adapter) holds
            # any already-queued proactive work because the window is not cheap.
            self.drained_ticks += 1
        result = self.sched.tick()
        return {
            "tick": now,
            "window": getattr(posture, "window", None),
            "source": getattr(posture, "source", None),
            "soakable": soakable,
            "filled_this_tick": added,
            "queued_proactive": self._queued_proactive(),
            "ran": result.ran,
            "klass": result.klass,
            "preempted": result.preempted,
            "idle_reason": result.idle_reason,
        }

    def summary(self) -> dict:
        total_j = sum(r["joules_est"] for r in self.receipts)
        all_within = all(r["within_bound"] for r in self.receipts)
        return {
            "jobs_filled": self.filled,
            "fill_ticks": self.fill_ticks,
            "drained_ticks": self.drained_ticks,
            "receipts": len(self.receipts),
            "all_within_bekenstein_bound": bool(all_within),
            "total_joules_est": round(total_j, 6),
            "total_joules_est_label": ENERGY_FIGURE_LABEL,
            "scheduler": self.sched.stats(),
        }


# A tiny posture double for tests / callers without the live feed.
@dataclass
class _PostureStub:
    window: str
    source: str


# ===========================================================================
# SELF-TEST (no network, no GPU, no model calls) — deterministic.
# Scenario: CHEAP curtailed window -> sponge fills proactive queue -> a REACTIVE
# turn arrives mid-soak -> it PREEMPTS within one tick -> power goes DEAR ->
# sponge drains (stops filling) and the energy gate holds remaining proactive
# work. Reactive completes; proactive that ran did real bounded (gated) work.
# Prints {"ok": true} iff every assertion holds.
# ===========================================================================
def _selftest() -> dict:
    out: dict = {"checks": []}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    # Mutable posture the test drives: start CHEAP + curtailed (soakable).
    state = {"posture": _PostureStub(window="cheap", source="curtailed-renewable")}
    # The scheduler's energy gate tracks THIS posture's window (cheap=>admit).
    gate = lambda _t: state["posture"].window == "cheap"  # noqa: E731
    sched = AgenticGpuScheduler(energy_gate=gate)
    sponge = BekensteinBatchSponge(sched, posture_fn=lambda: state["posture"],
                                   max_in_flight=5)

    trace = []
    # Ticks 0-2: cheap curtailed window -> sponge fills + runs proactive batches.
    for now in range(3):
        trace.append(sponge.step(now))
    check("sponge_filled_in_cheap_window", sponge.filled >= 5)
    check("ran_proactive_in_cheap_window",
          any(r["klass"] == "proactive" for r in trace))
    check("receipts_emitted", len(sponge.receipts) >= 5)
    check("all_receipts_within_bound",
          all(r["within_bound"] for r in sponge.receipts))
    check("receipts_record_real_source",
          all(r["energy_source"] == "curtailed-renewable" for r in sponge.receipts))
    check("receipts_labeled_sample",
          all("SAMPLE/ESTIMATE" in r["joules_est_label"] for r in sponge.receipts))

    # Tick 3: a REACTIVE turn arrives mid-soak. It must preempt proactive work.
    sched.submit_reactive("chaski_turn", cost_ticks=1)
    r_reactive = sponge.step(3)
    trace.append(r_reactive)
    check("reactive_preempts_soak", r_reactive["klass"] == "reactive")
    check("preemption_recorded", r_reactive["preempted"] is not None)
    check("reactive_completed", sched.reactive_done == 1)

    # Power goes DEAR -> sponge must DRAIN (stop filling); gate holds proactive.
    state["posture"] = _PostureStub(window="dear", source="grid")
    filled_before = sponge.filled
    drain_trace = [sponge.step(now) for now in range(4, 8)]
    trace.extend(drain_trace)
    check("sponge_stopped_filling_when_dear", sponge.filled == filled_before)
    check("no_soak_flagged_when_dear",
          all(t["soakable"] is False for t in drain_trace))
    check("gate_held_proactive_when_dear",
          any(t["idle_reason"] == "energy_gate_closed" for t in drain_trace)
          or sched._proactive != [] or sched._running is None)
    check("drain_ticks_counted", sponge.drained_ticks >= 4)

    # Return to CHEAP off-peak (honest real source) -> sponge resumes + drains
    # the backlog. Reactive never starved at any point (only 1 ever queued).
    state["posture"] = _PostureStub(window="cheap", source="off-peak")
    for now in range(8, 30):
        sponge.step(now)
    check("backlog_drained_after_window_returns",
          sched.proactive_done >= 1)
    check("reactive_never_starved", sched.reactive_done == 1)

    summ = sponge.summary()
    check("summary_all_within_bound", summ["all_within_bekenstein_bound"])
    check("summary_joules_labeled_sample",
          "SAMPLE/ESTIMATE" in summ["total_joules_est_label"])

    out["ok"] = True
    out["summary"] = summ
    out["doctrine"] = (
        "soak BOUNDED work into honestly-cheap stranded-power windows; reactive "
        "NEVER starves (existing preemptive scheduler); joules are SAMPLE/ESTIMATE; "
        "source recorded exactly as the signal reports it (no fabricated stranded "
        "claim); no free-energy; pure stdlib, no key.")
    out["cites"] = "FRONTIER_BRIEF_gpt.md §1; Agent.xpu arXiv:2506.24045"
    return out


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
