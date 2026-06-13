"""
SZL Agentic-GPU Scheduler — scheduler.py
========================================
A RESIDENT, preemptive scheduler for the betterwithage RTX 5000, following the
Agent.xpu on-device agentic-flow pattern (Han et al., "Agent.xpu: Efficient
Scheduling of Agentic LLM Workloads on Heterogeneous SoC",
arXiv:2506.24045, 2025). It co-schedules two workload classes on ONE GPU:

  - REACTIVE   : user-facing Chaski turns. Latency-critical. Preempts.
  - PROACTIVE  : self-initiated work (energy-aware batch, self-monitor,
                 receipt loop, governance refresh). Throughput-oriented.
                 Fills idle cycles. NEVER starves a reactive turn.

DOCTRINE (v11/v12) — read first:
- PROACTIVE WORK NEVER STARVES REACTIVE WORK. This is enforced structurally by
  strict preemptive priority: any waiting reactive task is admitted before any
  proactive task, and a running proactive task is preempted (paused, requeued
  at its saved progress) the moment a reactive task arrives. No proactive task
  can hold the GPU against a reactive turn.
- This module is PURE stdlib and does NO network and NO real inference. It is a
  deterministic, testable CONTROL PLANE — the policy/skeleton. Real serving is a
  separate Forge/box step (see daemon.py + README "Deployment").
- Energy figures are SAMPLE/ESTIMATE until a real meter is wired (label them).
  The energy_budget hook is a policy gate, not a power measurement.
- open-weight only; never commit a key; sovereign:true only when local serves.

The scheduler is a single-GPU model: one task runs at a time (the GPU is the
single resource). "Preemption" = pause the running proactive task at a tick
boundary, save its remaining work, and run the reactive task; the proactive
task resumes later from saved progress (no lost work). Reactive tasks run to
completion once started (a single forward/decode step is the atomic unit; we
model that a reactive turn, once admitted, is short and not itself preempted).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import IntEnum
from typing import Callable, Optional
import heapq
import itertools
import json


class Priority(IntEnum):
    """Lower value = scheduled first. REACTIVE strictly precedes PROACTIVE."""
    REACTIVE = 0
    PROACTIVE = 1


@dataclass(order=True)
class Task:
    """A unit of GPU work.

    `cost_ticks` is the remaining work in scheduler ticks (1 tick = 1 atomic
    GPU step). Proactive tasks decrement it as they run and can be paused with
    progress preserved; reactive tasks model a short, run-to-completion turn.
    `seq` breaks ties FIFO-within-priority so scheduling is deterministic.
    """
    priority: Priority
    seq: int
    name: str = field(compare=False)
    cost_ticks: int = field(default=1, compare=False)
    # Estimated energy units this task draws per tick (SAMPLE/ESTIMATE, not a
    # measured joule figure). Used only by the energy_budget gate for proactive
    # admission; reactive work is never gated on energy (it must always serve).
    energy_per_tick: float = field(default=1.0, compare=False)
    done_ticks: int = field(default=0, compare=False)

    @property
    def remaining(self) -> int:
        return self.cost_ticks - self.done_ticks

    @property
    def finished(self) -> bool:
        return self.remaining <= 0


# An energy gate decides whether a PROACTIVE task may start/continue right now.
# It receives the task and returns True iff power is cheap/available enough to
# admit it. Reactive work is NEVER passed through this gate. The default gate
# always admits (no real meter yet — honest default is "don't block on a figure
# we can't measure"); the daemon wires a real STRANDED_ENERGY signal here.
EnergyGate = Callable[[Task], bool]


def always_admit(_task: Task) -> bool:
    """Default energy gate: admit all proactive work (no real meter wired)."""
    return True


@dataclass
class TickResult:
    """What the GPU did in one tick (for tracing / tests)."""
    ran: Optional[str]
    klass: Optional[str]
    preempted: Optional[str] = None
    idle_reason: Optional[str] = None


class AgenticGpuScheduler:
    """Single-GPU preemptive scheduler: reactive preempts proactive.

    Invariant (the doctrine guarantee): at every tick, if any reactive task is
    runnable it gets the GPU; a running proactive task is preempted in favor of
    it within the SAME tick it arrives. Proactive work resumes from saved
    progress — never restarted, never starved indefinitely while the reactive
    queue is empty.
    """

    def __init__(self, energy_gate: EnergyGate = always_admit) -> None:
        self._reactive: list[Task] = []
        self._proactive: list[Task] = []
        self._seq = itertools.count()
        self._running: Optional[Task] = None
        self.energy_gate = energy_gate
        # Bookkeeping for honest reporting / tests.
        self.preemptions = 0
        self.reactive_done = 0
        self.proactive_done = 0
        self.energy_spent = 0.0
        self.proactive_blocked_ticks = 0

    # ---- submission -------------------------------------------------------
    def submit_reactive(self, name: str, cost_ticks: int = 1,
                        energy_per_tick: float = 1.0) -> Task:
        t = Task(Priority.REACTIVE, next(self._seq), name, cost_ticks,
                 energy_per_tick)
        heapq.heappush(self._reactive, t)
        return t

    def submit_proactive(self, name: str, cost_ticks: int = 1,
                         energy_per_tick: float = 1.0) -> Task:
        t = Task(Priority.PROACTIVE, next(self._seq), name, cost_ticks,
                 energy_per_tick)
        heapq.heappush(self._proactive, t)
        return t

    # ---- introspection ----------------------------------------------------
    @property
    def idle(self) -> bool:
        return (self._running is None and not self._reactive
                and not self._proactive)

    def pending_reactive(self) -> int:
        return len(self._reactive) + (
            1 if self._running and self._running.priority == Priority.REACTIVE
            else 0)

    # ---- the core scheduling decision ------------------------------------
    def _next_reactive(self) -> Optional[Task]:
        return self._reactive[0] if self._reactive else None

    def tick(self) -> TickResult:
        """Advance the GPU by one atomic step. Returns what ran.

        Decision order (this IS the anti-starvation guarantee):
          1. If a reactive task is waiting and the GPU is running proactive
             work -> PREEMPT it (save progress, requeue), then run reactive.
          2. If a reactive task is waiting and GPU is free -> run it.
          3. Else continue the running task if any.
          4. Else admit the highest-priority queued task. Proactive admission
             passes the energy gate; reactive never does.
        """
        waiting_reactive = self._next_reactive()

        # 1. Preempt running proactive work for a newly-waiting reactive turn.
        preempted_name = None
        if (waiting_reactive is not None and self._running is not None
                and self._running.priority == Priority.PROACTIVE):
            paused = self._running
            self._running = None
            heapq.heappush(self._proactive, paused)  # resume later, progress kept
            self.preemptions += 1
            preempted_name = paused.name

        # 2/4. If nothing is running, admit the best eligible task.
        if self._running is None:
            if self._reactive:
                self._running = heapq.heappop(self._reactive)
            else:
                # Proactive admission is gated on energy AND on no reactive work.
                cand = self._proactive[0] if self._proactive else None
                if cand is not None and self.energy_gate(cand):
                    self._running = heapq.heappop(self._proactive)
                elif cand is not None:
                    # Power too dear / budget exhausted: hold proactive work.
                    self.proactive_blocked_ticks += 1
                    return TickResult(ran=None, klass=None,
                                      preempted=preempted_name,
                                      idle_reason="energy_gate_closed")

        # 3. Run the current task for one tick.
        if self._running is None:
            return TickResult(ran=None, klass=None, preempted=preempted_name,
                              idle_reason="no_work")

        t = self._running
        t.done_ticks += 1
        self.energy_spent += t.energy_per_tick
        klass = t.priority.name.lower()
        ran_name = t.name
        if t.finished:
            if t.priority == Priority.REACTIVE:
                self.reactive_done += 1
            else:
                self.proactive_done += 1
            self._running = None
        return TickResult(ran=ran_name, klass=klass, preempted=preempted_name)

    def run_until_idle(self, max_ticks: int = 10_000) -> list[TickResult]:
        trace: list[TickResult] = []
        for _ in range(max_ticks):
            if self.idle:
                break
            trace.append(self.tick())
        return trace

    def stats(self) -> dict:
        return {
            "preemptions": self.preemptions,
            "reactive_done": self.reactive_done,
            "proactive_done": self.proactive_done,
            "energy_spent_sample_units": round(self.energy_spent, 3),
            "proactive_blocked_ticks": self.proactive_blocked_ticks,
        }


# ===========================================================================
# SELF-TEST (no network, no GPU, no model calls) — deterministic.
# Simulates the headline Agent.xpu scenario:
#   a long PROACTIVE batch is running -> a REACTIVE Chaski turn arrives ->
#   it PREEMPTS within ONE tick -> after the reactive turn completes the
#   PROACTIVE batch RESUMES from saved progress (no lost work).
# Also checks the doctrine invariant under an interleaving and the energy gate.
# Prints {"ok": true} iff every assertion holds.
# ===========================================================================
def _selftest() -> dict:
    out: dict = {}

    # --- Scenario A: preempt-within-one-tick + resume-from-progress --------
    s = AgenticGpuScheduler()
    batch = s.submit_proactive("energy_aware_batch", cost_ticks=5)
    # Tick 1: only proactive work exists -> it runs, 1/5 done.
    r1 = s.tick()
    assert r1.klass == "proactive" and batch.done_ticks == 1, r1
    # A reactive Chaski turn arrives mid-batch.
    turn = s.submit_reactive("chaski_turn", cost_ticks=1)
    # Tick 2: reactive PREEMPTS the batch in the SAME tick and runs.
    r2 = s.tick()
    assert r2.klass == "reactive", f"reactive must preempt: {r2}"
    assert r2.preempted == "energy_aware_batch", f"batch must be preempted: {r2}"
    assert turn.finished, "1-tick reactive turn should complete"
    # Batch progress was preserved across preemption (still 1/5, not restarted).
    assert batch.done_ticks == 1, f"progress must be saved, got {batch.done_ticks}"
    # Tick 3+: with reactive queue empty, the batch RESUMES from tick 2/5.
    r3 = s.tick()
    assert r3.klass == "proactive" and batch.done_ticks == 2, r3
    s.run_until_idle()
    assert batch.finished and s.reactive_done == 1 and s.proactive_done == 1
    assert s.preemptions == 1, s.stats()
    out["scenario_preempt_resume"] = s.stats()

    # --- Scenario B: a burst of reactive turns NEVER starves, proactive
    #     always eventually completes once reactive drains (no indefinite hold).
    s2 = AgenticGpuScheduler()
    s2.submit_proactive("receipt_loop", cost_ticks=3)
    for i in range(4):
        s2.submit_reactive(f"turn_{i}", cost_ticks=1)
    trace = s2.run_until_idle()
    # Every reactive turn ran before the proactive task finished its last tick.
    last_reactive = max(i for i, t in enumerate(trace) if t.klass == "reactive")
    last_proactive = max(i for i, t in enumerate(trace) if t.klass == "proactive")
    assert last_reactive < last_proactive, "proactive finished only after reactive drained"
    assert s2.reactive_done == 4 and s2.proactive_done == 1, s2.stats()
    out["scenario_no_starvation"] = s2.stats()

    # --- Scenario C: energy gate holds PROACTIVE when power is "dear", but
    #     NEVER blocks REACTIVE. ---------------------------------------------
    power_cheap = {"v": False}
    gate: EnergyGate = lambda _t: power_cheap["v"]
    s3 = AgenticGpuScheduler(energy_gate=gate)
    s3.submit_proactive("batch_when_cheap", cost_ticks=2)
    s3.submit_reactive("urgent_turn", cost_ticks=1)
    # Power dear: reactive still serves; proactive is held.
    r = s3.tick()
    assert r.klass == "reactive", f"reactive must serve regardless of energy: {r}"
    r = s3.tick()
    assert r.ran is None and r.idle_reason == "energy_gate_closed", r
    assert s3.proactive_blocked_ticks >= 1
    # Power turns cheap -> proactive admitted.
    power_cheap["v"] = True
    s3.run_until_idle()
    assert s3.proactive_done == 1, s3.stats()
    out["scenario_energy_gate"] = s3.stats()

    out["ok"] = True
    out["doctrine"] = ("preemptive priority: proactive NEVER starves reactive; "
                       "energy figures are SAMPLE/ESTIMATE; control-plane only, "
                       "no model calls here (Forge box owns serving).")
    out["cites"] = "Agent.xpu arXiv:2506.24045"
    return out


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
