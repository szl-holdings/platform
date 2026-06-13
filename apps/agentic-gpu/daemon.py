"""
SZL Agentic-GPU Resident Daemon — daemon.py
===========================================
The always-on loop SKELETON that turns the betterwithage RTX 5000 from a passive
model server into a resident autonomous engine (Agent.xpu pattern,
arXiv:2506.24045). It owns the PROACTIVE agenda on-device and yields instantly
to REACTIVE Chaski turns via the preemptive AgenticGpuScheduler in scheduler.py.

WHAT THIS FILE IS (honesty, doctrine v11/v12):
- A runnable CONTROL-PLANE skeleton + spec. It does NOT itself run inference.
  Real serving + deployment on the box is a separate Forge step (see README
  "Deployment"). This module is import-safe and ast-clean; its proactive task
  bodies are no-op stubs that represent the on-device agenda.
- It probes the OpenAI-compatible local endpoint at
  http://100.125.77.31:11434/v1 (Ollama today; vLLM at :8000/v1 after the
  upgrade) for health/warmth ONLY — using the stdlib, short timeout, never
  raising. NO key is read or sent here; the local box endpoint is open-weight,
  no-key (sovereign:true ONLY when this local endpoint actually serves).
- Energy figures are SAMPLE/ESTIMATE until a real meter is wired (labeled).

THE LOOP (one tick of the resident agenda):
  1. Health/warmth probe of the local model endpoint (self-monitor).
  2. Read the energy signal (STRANDED_ENERGY stub) -> open/close the energy gate.
  3. Enqueue due proactive work (self-monitor, energy-aware batch, receipt loop).
  4. Step the scheduler ONE tick. Any reactive turn that arrived preempts.
The reactive ingress (Chaski) is modeled as an injected callback so the box can
wire its real chat queue; here it is empty/optional for the skeleton.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Optional
import json
import time
import urllib.request

from scheduler import AgenticGpuScheduler, Task, EnergyGate

# Integration seam (PR #356 <-> #357): the energy-signal feed drives the gate.
# Defensive — if the feed module is not present on this branch, the adapter
# falls back to the SAME conservative-honest behaviour as power_not_cheap()
# (returns False), so this import never weakens the doctrine default.
try:
    from energy_gate_adapter import power_signal_from_feed as _feed_power_signal
except Exception:  # noqa: BLE001 - adapter/feed absent => keep stdlib default.
    _feed_power_signal = None


LOCAL_ENDPOINT = "http://100.125.77.31:11434/v1"  # Ollama today; vLLM :8000/v1 next.
VLLM_ENDPOINT = "http://100.125.77.31:8000/v1"      # STEP 1 upgrade target.


def probe_endpoint(base: str = LOCAL_ENDPOINT, timeout: float = 2.0) -> bool:
    """Liveness/warmth probe of the OpenAI-compatible local endpoint.

    HONEST GATE (mirrors the a11oy orchestrator's reachability check): a
    configured endpoint is INTENT, not proof it serves. We only treat the box
    as serving-local when /models (or root) actually answers. Pure stdlib, short
    timeout, never raises. No key sent — the box endpoint is open-weight/no-key.
    """
    for path in ("/models", ""):
        try:
            req = urllib.request.Request(base.rstrip("/") + path, method="GET")
            with urllib.request.urlopen(req, timeout=timeout) as r:  # noqa: S310
                if 200 <= getattr(r, "status", r.getcode()) < 500:
                    return True
        except Exception:  # noqa: BLE001 - any failure => not reachable, stay honest
            continue
    return False


# A power signal returns True iff power is currently cheap/stranded enough to
# run heavy proactive batches (negative-price / off-peak / curtailed-renewable
# / ambient surplus per the STRANDED_ENERGY spec). SAMPLE/ESTIMATE until a real
# meter is wired. The default is conservative-honest: assume power is NOT cheap
# unless a real signal says so, so we never overclaim free/cheap energy.
PowerSignal = Callable[[], bool]


def power_not_cheap() -> bool:
    """Default power signal: no real meter -> do not assume cheap power."""
    return False


def default_power_signal() -> bool:
    """The wired default: use the energy-signal feed when present, else honest.

    When the energy_signal feed (PR #356) is importable, proactive admission
    follows its honest power WINDOW (cheap/normal/dear). When it is not, this
    is identical to `power_not_cheap` (never assume cheap power). Either way,
    no joule figure is measured here — the window is a SAMPLE policy signal.
    """
    if _feed_power_signal is not None:
        return _feed_power_signal()
    return power_not_cheap()


@dataclass
class ProactiveJob:
    """A recurring on-device proactive task (the self-directed agenda)."""
    name: str
    every_ticks: int
    cost_ticks: int
    energy_per_tick: float = 1.0
    _last: int = -1

    def due(self, now: int) -> bool:
        # Never-run jobs (_last == -1) are due immediately on first sight.
        if self._last < 0:
            return True
        return now - self._last >= self.every_ticks

    def mark(self, now: int) -> None:
        self._last = now


# The default resident agenda (maps 1:1 to AGENTIC_GPU_ENGINE.md PROACTIVE list).
DEFAULT_AGENDA = [
    ProactiveJob("self_monitor", every_ticks=1, cost_ticks=1, energy_per_tick=0.2),
    ProactiveJob("energy_aware_batch", every_ticks=5, cost_ticks=4, energy_per_tick=1.0),
    ProactiveJob("receipt_loop", every_ticks=3, cost_ticks=1, energy_per_tick=0.3),
    ProactiveJob("governance_refresh", every_ticks=8, cost_ticks=2, energy_per_tick=0.5),
]


class ResidentDaemon:
    """The always-on resident loop. Owns proactive agenda; reactive preempts."""

    def __init__(self, agenda: Optional[list[ProactiveJob]] = None,
                 power_signal: PowerSignal = default_power_signal,
                 reactive_ingress: Optional[Callable[[int], list[tuple[str, int]]]] = None,
                 endpoint: str = LOCAL_ENDPOINT,
                 probe: Callable[[str], bool] = probe_endpoint) -> None:
        self.agenda = agenda if agenda is not None else list(DEFAULT_AGENDA)
        self.power_signal = power_signal
        # reactive_ingress(now) -> list of (name, cost_ticks) reactive turns that
        # arrived this tick. The box wires its real Chaski queue here.
        self.reactive_ingress = reactive_ingress or (lambda _now: [])
        self.endpoint = endpoint
        self._probe = probe
        # The energy gate closes proactive admission unless power is cheap.
        gate: EnergyGate = lambda _t: self.power_signal()
        self.sched = AgenticGpuScheduler(energy_gate=gate)
        self.serving_local = False
        self.posture = "unknown"

    def _update_posture(self) -> None:
        """Honest posture: sovereign:true ONLY when the local endpoint serves."""
        self.serving_local = self._probe(self.endpoint)
        self.posture = "sovereign:true (local serves)" if self.serving_local \
            else "sovereign:false (local endpoint not reachable; router fallback)"

    def step(self, now: int) -> dict:
        """One iteration of the resident loop. Returns an honest trace record."""
        self._update_posture()
        # Inject any reactive turns that arrived (they will preempt proactive).
        for name, cost in self.reactive_ingress(now):
            self.sched.submit_reactive(name, cost_ticks=cost)
        # Enqueue due proactive work.
        for job in self.agenda:
            if job.due(now):
                self.sched.submit_proactive(job.name, cost_ticks=job.cost_ticks,
                                            energy_per_tick=job.energy_per_tick)
                job.mark(now)
        result = self.sched.tick()
        return {
            "tick": now,
            "serving_local": self.serving_local,
            "posture": self.posture,
            "power_cheap": self.power_signal(),
            "ran": result.ran,
            "klass": result.klass,
            "preempted": result.preempted,
            "idle_reason": result.idle_reason,
        }

    def run_forever(self, period_s: float = 1.0) -> None:  # pragma: no cover
        """The real always-on loop (box deployment). Not exercised in self-test."""
        now = 0
        while True:
            rec = self.step(now)
            print(json.dumps(rec))
            now += 1
            time.sleep(period_s)


def _selftest() -> dict:
    """Deterministic loop self-test: NO network (probe + power are stubbed).

    Drives the resident loop for a window in which a reactive turn arrives mid
    proactive batch and verifies (a) honest posture tracks the (stubbed) probe,
    (b) the reactive turn preempts proactive work, (c) the loop never raises.
    """
    # Stub: endpoint "serves" (sovereign:true), power is cheap so the proactive
    # batch runs. A single long batch is in flight; a reactive Chaski turn
    # arrives mid-batch (tick 2) and must preempt it within that tick.
    serving = {"v": True}
    arrivals = {2: [("chaski_turn", 1)]}  # reactive turn arrives mid-batch

    d = ResidentDaemon(
        agenda=[ProactiveJob("energy_aware_batch", every_ticks=99,
                             cost_ticks=6, energy_per_tick=1.0)],
        power_signal=lambda: True,           # power cheap -> batch admitted
        reactive_ingress=lambda now: arrivals.get(now, []),
        probe=lambda _ep: serving["v"],
    )
    trace = []
    for now in range(8):
        trace.append(d.step(now))

    saw_reactive = any(r["klass"] == "reactive" for r in trace)
    saw_preempt = any(r["preempted"] for r in trace)
    posture_ok = all(r["posture"].startswith("sovereign:true") for r in trace)
    # The reactive turn must run, must have preempted the batch, and the batch
    # must still complete afterward (resume from saved progress, no lost work).
    batch_completed = d.sched.proactive_done == 1
    return {
        "ok": bool(saw_reactive and saw_preempt and posture_ok and batch_completed),
        "saw_reactive_turn": saw_reactive,
        "saw_preemption": saw_preempt,
        "batch_resumed_and_completed": batch_completed,
        "honest_posture_tracks_probe": posture_ok,
        "scheduler_stats": d.sched.stats(),
        "note": ("control-plane skeleton; probe/power/ingress stubbed in test. "
                 "Real serving + deployment is a Forge box step (see README)."),
        "endpoint_today": LOCAL_ENDPOINT,
        "endpoint_after_vllm_upgrade": VLLM_ENDPOINT,
        "cites": "Agent.xpu arXiv:2506.24045",
    }


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
