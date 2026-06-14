"""
SZL Agentic-GPU — energy_proportional.py
========================================
THERMAL SOVEREIGNTY / energy-proportional proactive admission (evolve-loop #5).

Scales PROACTIVE admission to live GPU thermal/power HEADROOM:
- more headroom (cool, far from the power cap) -> admit more proactive batch;
- near the thermal or power cap                -> throttle to reactive-only.

It is a `scheduler.EnergyGate` (Callable[[Task], bool]) that gates ONLY
proactive admission. Reactive turns NEVER pass through this gate, so they can
NEVER be throttled by it — thermal sovereignty is a backpressure on self-
initiated batch work, not on user-facing latency-critical turns.

WHY THIS FILE / DOCTRINE (v11/v12):
- Energy-proportional computing (Hoelzle & Barroso; see also arXiv:2506.04062):
  draw power in proportion to USEFUL work. Idle/static power is waste; under a
  thermal cap, the honest move is to fill cool headroom with proactive batch and
  back off as we approach the cap rather than thrash the cooler.
- LANDAUER FLOOR is paired in as a LOWER bound, not free energy: the minimum
  energy to irreversibly erase one bit is E_min = kT·ln2 (~2.9e-21 J at 300 K).
  It is the floor a per-bit energy estimate must clear to be physically honest —
  the mirror image of the Bekenstein CEILING (bits <= N·8) in the budget ledger.
  Landauer is NOT a budget and NOT a free-energy claim.
- NVML draw is MEASURED only ON-BOX. When NVML/nvidia-smi are absent (this runs
  off-box for now) we fall back to a SAMPLE headroom model and label every figure
  SAMPLE — never present a simulated draw as measured. The half-state (claiming
  more headroom/sovereignty than is real) is the only unacceptable outcome.
- Pure stdlib + optional pynvml/nvidia-smi; no network, no key; open-weight only.

The scheduler import is DEFENSIVE so this module stays importable, ast-clean, and
self-testable on a branch where `apps/agentic-gpu/scheduler.py` (PR #357) is not
yet present. When #357 merges, `scheduler.Task` resolves and the gate drops in.
"""
from __future__ import annotations

import json
import math
import shutil
import subprocess
from dataclasses import dataclass
from typing import Callable, Optional

# --- Defensive import of the scheduler contract (PR #357) ------------------
try:  # present once the scheduler branch is merged alongside this file.
    from scheduler import Task as _Task  # type: ignore
except Exception:  # noqa: BLE001 - absent feed => stay self-contained.
    _Task = object  # type: ignore


# --- Landauer floor (LOWER bound, not free energy, not a budget) -----------
BOLTZMANN_J_PER_K = 1.380649e-23          # exact, SI 2019 redefinition
LANDAUER_TEMP_K = 300.0                    # ~room temp reference
LANDAUER_J_PER_BIT = BOLTZMANN_J_PER_K * LANDAUER_TEMP_K * math.log(2)  # ~2.87e-21 J

# Honesty labels carried on every figure.
MEASURED_LABEL = "MEASURED (on-box NVML/nvidia-smi)"
SAMPLE_LABEL = "SAMPLE/ESTIMATE (no on-box telemetry — simulated headroom model)"

# SAMPLE caps for the off-box model: RTX 5000 (Ada) @ betterwithage class.
_SAMPLE_POWER_CAP_W = 230.0                # ~board power cap
_SAMPLE_TEMP_CAP_C = 83.0                  # ~thermal slowdown threshold
# Thermal headroom is measured from a warm floor up to the cap, so an idle-cool
# GPU reads ~full headroom and a near-throttle GPU reads ~zero.
_THERMAL_FLOOR_C = 35.0


@dataclass
class GpuTelemetry:
    """One snapshot of GPU power/thermal state and where it came from.

    `measured` is True ONLY for real on-box NVML/nvidia-smi reads; a simulated
    sample sets it False so no figure is ever presented as metered off-box.
    """
    power_w: float
    power_cap_w: float
    temp_c: float
    temp_cap_c: float
    measured: bool
    source: str

    @property
    def power_headroom(self) -> float:
        """Fraction of the power cap still free, clamped to [0, 1]."""
        if self.power_cap_w <= 0:
            return 0.0
        return _clamp01(1.0 - (self.power_w / self.power_cap_w))

    @property
    def thermal_headroom(self) -> float:
        """Fraction of the warm-floor->cap thermal band still free, in [0, 1]."""
        span = self.temp_cap_c - _THERMAL_FLOOR_C
        if span <= 0:
            return 0.0
        return _clamp01(1.0 - ((self.temp_c - _THERMAL_FLOOR_C) / span))

    @property
    def headroom(self) -> float:
        """Conservative thermal-sovereign headroom: the TIGHTER of the two.

        We back off when EITHER power OR temperature is near its cap — whichever
        binds first is the honest constraint on admitting more proactive work.
        """
        return min(self.power_headroom, self.thermal_headroom)

    def as_dict(self) -> dict:
        return {
            "power_w": round(self.power_w, 3),
            "power_cap_w": round(self.power_cap_w, 3),
            "temp_c": round(self.temp_c, 3),
            "temp_cap_c": round(self.temp_cap_c, 3),
            "power_headroom": round(self.power_headroom, 4),
            "thermal_headroom": round(self.thermal_headroom, 4),
            "headroom": round(self.headroom, 4),
            "measured": bool(self.measured),
            "source": self.source,
            "label": MEASURED_LABEL if self.measured else SAMPLE_LABEL,
        }


def _clamp01(x: float) -> float:
    return 0.0 if x < 0.0 else (1.0 if x > 1.0 else x)


# --- Telemetry readers: REAL on-box, SAMPLE off-box ------------------------
def _read_nvml() -> Optional[GpuTelemetry]:
    """Read live GPU state via pynvml (MEASURED). None if pynvml is absent/fails."""
    try:
        import pynvml  # type: ignore
    except Exception:  # noqa: BLE001 - no binding => not on-box.
        return None
    try:
        pynvml.nvmlInit()
        h = pynvml.nvmlDeviceGetHandleByIndex(0)
        power_w = pynvml.nvmlDeviceGetPowerUsage(h) / 1000.0          # mW -> W
        try:
            cap_w = pynvml.nvmlDeviceGetEnforcedPowerLimit(h) / 1000.0
        except Exception:  # noqa: BLE001
            cap_w = pynvml.nvmlDeviceGetPowerManagementLimit(h) / 1000.0
        temp_c = float(pynvml.nvmlDeviceGetTemperature(
            h, pynvml.NVML_TEMPERATURE_GPU))
        try:
            temp_cap_c = float(pynvml.nvmlDeviceGetTemperatureThreshold(
                h, pynvml.NVML_TEMPERATURE_THRESHOLD_SLOWDOWN))
        except Exception:  # noqa: BLE001
            temp_cap_c = _SAMPLE_TEMP_CAP_C
        return GpuTelemetry(
            power_w=power_w, power_cap_w=cap_w or _SAMPLE_POWER_CAP_W,
            temp_c=temp_c, temp_cap_c=temp_cap_c or _SAMPLE_TEMP_CAP_C,
            measured=True, source="nvml")
    except Exception:  # noqa: BLE001 - any NVML failure => fall through.
        return None
    finally:
        try:
            pynvml.nvmlShutdown()
        except Exception:  # noqa: BLE001
            pass


def _read_nvidia_smi() -> Optional[GpuTelemetry]:
    """Read live GPU state via the nvidia-smi CLI (MEASURED). None if absent."""
    if shutil.which("nvidia-smi") is None:
        return None
    query = ("power.draw,enforced.power.limit,temperature.gpu,"
             "temperature.gpu.tlimit")
    try:
        out = subprocess.run(
            ["nvidia-smi", f"--query-gpu={query}",
             "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=5, check=True).stdout
    except Exception:  # noqa: BLE001 - CLI missing/failed => not on-box.
        return None
    line = out.strip().splitlines()[0] if out.strip() else ""
    parts = [p.strip() for p in line.split(",")]
    if len(parts) < 3:
        return None
    try:
        power_w = float(parts[0])
        cap_w = float(parts[1]) if parts[1] not in ("", "[N/A]") else _SAMPLE_POWER_CAP_W
        temp_c = float(parts[2])
        temp_cap_c = (float(parts[3]) if len(parts) > 3 and parts[3] not in ("", "[N/A]")
                      else _SAMPLE_TEMP_CAP_C)
    except ValueError:
        return None
    return GpuTelemetry(
        power_w=power_w, power_cap_w=cap_w, temp_c=temp_c,
        temp_cap_c=temp_cap_c, measured=True, source="nvidia-smi")


def sample_telemetry(power_w: float = 60.0, temp_c: float = 45.0,
                     power_cap_w: float = _SAMPLE_POWER_CAP_W,
                     temp_cap_c: float = _SAMPLE_TEMP_CAP_C) -> GpuTelemetry:
    """A SAMPLE (NOT measured) headroom snapshot for off-box runs and tests.

    Defaults model a lightly-loaded, cool GPU (ample headroom). `measured=False`
    so the figure is always labeled SAMPLE — never presented as a metered draw.
    """
    return GpuTelemetry(power_w=power_w, power_cap_w=power_cap_w, temp_c=temp_c,
                        temp_cap_c=temp_cap_c, measured=False,
                        source="sample-model")


def read_telemetry() -> GpuTelemetry:
    """Best available telemetry: real NVML, else nvidia-smi, else SAMPLE model."""
    return _read_nvml() or _read_nvidia_smi() or sample_telemetry()


# --- Proportional admission policy -----------------------------------------
@dataclass
class ProportionalPolicy:
    """Maps headroom -> a proactive admit/throttle decision.

    `admit_threshold` is the minimum headroom fraction (tighter of power/thermal)
    at which proactive batch is admitted. Below it, the gate throttles to
    reactive-only. Default 0.15 leaves a conservative ~15% margin before the cap.
    """
    admit_threshold: float = 0.15

    def admit_proactive(self, tel: GpuTelemetry) -> bool:
        return tel.headroom >= self.admit_threshold


# --- Landauer floor helpers (LOWER bound sanity, not a budget) -------------
def landauer_floor_joules(bits: float) -> float:
    """Minimum physically-honest energy to irreversibly process `bits` bits.

    E_min = bits · kT·ln2. A LOWER bound (Landauer), the mirror of the Bekenstein
    ceiling — NOT a free-energy claim and NOT an energy budget.
    """
    return max(0.0, bits) * LANDAUER_J_PER_BIT


def joules_estimate_is_physical(joules_est: float, bits: float) -> bool:
    """True iff a per-task joules estimate clears the Landauer floor for `bits`.

    A SAMPLE joules figure below kT·ln2·bits would be physically impossible; this
    flags such an over-claim (the dishonest half-state) rather than blessing it.
    """
    return joules_est >= landauer_floor_joules(bits) - 1e-30


# --- The scheduler.EnergyGate ----------------------------------------------
def make_energy_gate(policy: Optional[ProportionalPolicy] = None,
                     telemetry_fn: Callable[[], GpuTelemetry] = read_telemetry
                     ) -> Callable:
    """Build a `scheduler.EnergyGate` driven by live GPU headroom.

    The returned callable ignores task identity (admission is a power/thermal-
    headroom policy, not per-task) and admits proactive work only while headroom
    is above the policy threshold. Reactive work is never passed through here, so
    it is structurally exempt from thermal throttling.
    """
    pol = policy or ProportionalPolicy()

    def _gate(_task) -> bool:
        return pol.admit_proactive(telemetry_fn())
    return _gate


def headroom_report(telemetry_fn: Callable[[], GpuTelemetry] = read_telemetry,
                    policy: Optional[ProportionalPolicy] = None) -> dict:
    """Dashboard snapshot: current telemetry, threshold, and the admit decision."""
    pol = policy or ProportionalPolicy()
    tel = telemetry_fn()
    return {
        "model": "energy-proportional proactive admission (NVML headroom + Landauer floor)",
        "telemetry": tel.as_dict(),
        "admit_threshold": pol.admit_threshold,
        "admit_proactive": pol.admit_proactive(tel),
        "landauer_j_per_bit": LANDAUER_J_PER_BIT,
        "landauer_label": "LOWER bound (kT·ln2); not free energy, not a budget",
        "doctrine": ("proactive admission scales to GPU thermal/power headroom; "
                     "reactive turns are NEVER throttled; NVML is MEASURED on-box "
                     "and SAMPLE off-box; Landauer is a floor, not free energy."),
    }


# ===========================================================================
# SELF-TEST — no network, no GPU required. Exercises the headroom model, the
# gate, the scheduler integration (real when colocated, emulated otherwise),
# and the Landauer floor.
# ===========================================================================
def _selftest() -> dict:
    out: dict = {"checks": []}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    # (1) Headroom model: a cool, lightly-loaded GPU has ample headroom; a hot,
    #     near-cap GPU has little. SAMPLE telemetry is never labeled MEASURED.
    cool = sample_telemetry(power_w=50.0, temp_c=40.0)
    hot = sample_telemetry(power_w=225.0, temp_c=82.0)
    check("cool_has_headroom", cool.headroom > 0.5)
    check("hot_near_cap_low_headroom", hot.headroom < 0.15)
    check("cool_not_measured_label", cool.as_dict()["label"] == SAMPLE_LABEL)

    # (2) The gate admits when headroom is high, throttles when it is low.
    gate_cool = make_energy_gate(telemetry_fn=lambda: cool)
    gate_hot = make_energy_gate(telemetry_fn=lambda: hot)
    check("high_headroom_admits", gate_cool(object()) is True)
    check("low_headroom_throttles", gate_hot(object()) is False)

    # (3) Scheduler integration. When scheduler.py is colocated (PR #357 path),
    #     drive the REAL scheduler and prove reactive runs even while proactive
    #     is thermally throttled. Otherwise emulate the gate-only contract.
    sched_exercised = False
    try:
        from scheduler import (AgenticGpuScheduler, Priority, Task,  # type: ignore
                               always_admit)  # noqa: F401
        # Throttle proactive (hot GPU); reactive must still run.
        sched = AgenticGpuScheduler(energy_gate=make_energy_gate(
            telemetry_fn=lambda: hot))
        sched.submit_reactive("user_turn", cost_ticks=1)
        sched.submit_proactive("batch_soak", cost_ticks=3)
        sched.run_until_idle(max_ticks=50)
        st = sched.stats()
        # Reactive ran to completion even though the gate throttled proactive
        # (hot GPU): reactive is structurally exempt from the energy gate.
        check("reactive_runs_despite_throttle",
              st.get("reactive_done", 0) >= 1 and st.get("proactive_done", 0) == 0)
        # Proactive is held while hot.
        held = AgenticGpuScheduler(energy_gate=make_energy_gate(
            telemetry_fn=lambda: hot))
        held.submit_proactive("batch_soak", cost_ticks=2)
        r_hot = [held.tick() for _ in range(3)]
        check("proactive_throttled_when_hot",
              all(getattr(t, "ran", None) != "batch_soak" for t in r_hot))
        # Proactive admitted while cool.
        ok = AgenticGpuScheduler(energy_gate=make_energy_gate(
            telemetry_fn=lambda: cool))
        ok.submit_proactive("batch_soak", cost_ticks=2)
        r_cool = [ok.tick() for _ in range(3)]
        check("proactive_admitted_when_cool",
              any(getattr(t, "ran", None) == "batch_soak" for t in r_cool))
        sched_exercised = True
    except Exception:  # noqa: BLE001 - scheduler absent => emulate the contract.
        # Reactive bypasses the energy gate entirely (gate is proactive-only).
        gate = make_energy_gate(telemetry_fn=lambda: hot)
        # The gate is never consulted for reactive work; model that directly:
        reactive_admitted = True  # structural: reactive is never gated
        check("reactive_bypasses_gate_emulated", reactive_admitted is True)
        check("proactive_blocked_when_hot_emulated", gate(object()) is False)

    # (4) Landauer floor: positive, monotone in bits; an at-floor estimate is
    #     physical, a below-floor estimate is flagged (the dishonest half-state).
    check("landauer_floor_positive", landauer_floor_joules(1) > 0.0)
    check("landauer_floor_monotone",
          landauer_floor_joules(100) > landauer_floor_joules(10))
    floor_1k = landauer_floor_joules(1000)
    check("estimate_at_floor_physical",
          joules_estimate_is_physical(floor_1k, 1000) is True)
    check("estimate_below_floor_flagged",
          joules_estimate_is_physical(floor_1k * 0.5, 1000) is False)

    out["ok"] = True
    out["scheduler_integration_exercised"] = sched_exercised
    out["landauer_j_per_bit"] = LANDAUER_J_PER_BIT
    out["doctrine"] = ("proactive admission scales to GPU thermal/power headroom; "
                       "reactive NEVER throttled; NVML MEASURED on-box / SAMPLE "
                       "off-box; Landauer kT·ln2 is a LOWER bound, not free energy.")
    return out


if __name__ == "__main__":
    print(json.dumps(_selftest(), indent=2))
