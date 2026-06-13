#!/usr/bin/env python3
"""NVML GPU-power provider — the FIRST MEASURED number in the energy engine.

Reads the RTX 5000's REAL instantaneous power draw via `nvidia-smi` and turns it
into honest joules for a receipt:  joules = power_draw_W * task_seconds.

DOCTRINE (v11/v12):
  - MEASURED only when a real source feeds it. On-box (`nvidia-smi` present and
    parsing) => `measured=True`, the wattage is a meter reading, joules are REAL.
  - Off-box (no `nvidia-smi`, or the call fails/parses empty) => `measured=False`
    and the figure is a clearly-labelled SAMPLE/ESTIMATE. We NEVER present a
    sample as a meter reading, and we NEVER claim joules we did not measure.
  - source claims match the signal; open-weight; no key (NVML needs none).

The parser is pure and side-effect-free: `parse_nvidia_smi_csv()` takes the raw
CSV line(s) and returns a `GpuPower`. `read_gpu_power()` shells out to
`nvidia-smi` (with a SAMPLE fallback) and is the only function that touches the
process. This keeps the self-test deterministic and network/hardware-free.

Self-test: `python3 nvml_provider.py` -> parses a sample CSV to watts, computes
joules, checks the off-box SAMPLE fallback, prints `{"ok": true}`.
"""
from __future__ import annotations

import json
import shutil
import subprocess
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional

# The exact query the doctrine doc (DATA_SOURCES_WIRING TIER-A) specifies.
NVIDIA_SMI_QUERY = "power.draw,power.limit,temperature.gpu,utilization.gpu"
NVIDIA_SMI_ARGS = (
    "--query-gpu=" + NVIDIA_SMI_QUERY,
    "--format=csv,noheader,nounits",
)

# SAMPLE fallback figures used ONLY when no real meter is present (off-box).
# An RTX 5000-class card idles ~25 W and caps ~250 W; pick a mid sample so the
# estimate is plausible but it is ALWAYS labelled measured=False.
SAMPLE_POWER_DRAW_W = 90.0
SAMPLE_POWER_LIMIT_W = 250.0
SAMPLE_TEMP_C = 45.0
SAMPLE_UTIL_PCT = 30.0


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class GpuPower:
    """A single GPU power reading (per device).

    power_draw_w  : instantaneous board power in watts. MEASURED when measured=True.
    power_limit_w : the enforced power cap in watts (headroom = limit - draw).
    temperature_c : GPU core temperature, Celsius.
    utilization_pct: SM utilization, percent.
    measured      : True => real nvidia-smi reading; False => SAMPLE/ESTIMATE.
    ts            : ISO-8601 UTC timestamp.
    source        : "nvml" (real) or "sample" (fallback).
    note          : honesty note.
    """

    power_draw_w: float
    power_limit_w: float
    temperature_c: float
    utilization_pct: float
    measured: bool
    ts: str
    source: str
    note: str = ""

    @property
    def headroom_w(self) -> float:
        """Spare power budget under the cap (never negative)."""
        return max(0.0, self.power_limit_w - self.power_draw_w)

    def joules_for(self, task_seconds: float) -> float:
        """REAL joules for a task of `task_seconds` at this draw: W * s = J.

        The number is only MEASURED if this reading is measured; the caller must
        propagate `measured` onto the receipt (we expose it in as_dict()).
        """
        if task_seconds < 0:
            raise ValueError("task_seconds must be >= 0")
        return self.power_draw_w * float(task_seconds)

    def as_dict(self) -> dict:
        d = asdict(self)
        d["headroom_w"] = self.headroom_w
        d["estimate_label"] = "MEASURED" if self.measured else "SAMPLE/ESTIMATE"
        return d


def parse_nvidia_smi_csv(raw: str) -> GpuPower:
    """Parse one `nvidia-smi --query-gpu=... --format=csv,noheader,nounits` row.

    Expects 4 comma-separated numeric fields:
        power.draw, power.limit, temperature.gpu, utilization.gpu
    Multi-GPU output (several lines) uses the FIRST device line. Raises
    ValueError on a malformed/empty row so the caller can fall back to SAMPLE.
    """
    if not raw or not raw.strip():
        raise ValueError("empty nvidia-smi output")
    # First non-empty line = first device.
    line = next((ln for ln in raw.splitlines() if ln.strip()), "")
    parts = [p.strip() for p in line.split(",")]
    if len(parts) < 4:
        raise ValueError(f"expected 4 CSV fields, got {len(parts)}: {line!r}")
    try:
        draw, limit, temp, util = (float(parts[0]), float(parts[1]),
                                   float(parts[2]), float(parts[3]))
    except ValueError as exc:
        raise ValueError(f"non-numeric nvidia-smi field in {line!r}: {exc}")
    return GpuPower(
        power_draw_w=draw,
        power_limit_w=limit,
        temperature_c=temp,
        utilization_pct=util,
        measured=True,
        ts=_now_iso(),
        source="nvml",
        note=("REAL nvidia-smi reading (NVML). joules = power_draw_w * "
              "task_seconds is a MEASURED figure."),
    )


def _sample_reading(reason: str) -> GpuPower:
    """Honest SAMPLE fallback used when no real meter is available."""
    return GpuPower(
        power_draw_w=SAMPLE_POWER_DRAW_W,
        power_limit_w=SAMPLE_POWER_LIMIT_W,
        temperature_c=SAMPLE_TEMP_C,
        utilization_pct=SAMPLE_UTIL_PCT,
        measured=False,
        ts=_now_iso(),
        source="sample",
        note=("SAMPLE/ESTIMATE — " + reason + ". Not a meter reading; joules "
              "derived from this are estimates, never presented as measured."),
    )


def nvidia_smi_available() -> bool:
    """True iff an `nvidia-smi` binary is on PATH (necessary, not sufficient)."""
    return shutil.which("nvidia-smi") is not None


def read_gpu_power(timeout_s: float = 2.0) -> GpuPower:
    """Read REAL GPU power via nvidia-smi; honest SAMPLE fallback off-box.

    Never raises: any failure (missing binary, non-zero exit, timeout, parse
    error) degrades to a clearly-labelled `measured=False` SAMPLE reading.
    """
    if not nvidia_smi_available():
        return _sample_reading("nvidia-smi not on PATH (off-box)")
    try:
        proc = subprocess.run(
            ("nvidia-smi", *NVIDIA_SMI_ARGS),
            capture_output=True,
            text=True,
            timeout=timeout_s,
            check=False,
        )
    except (OSError, subprocess.SubprocessError) as exc:
        return _sample_reading(f"nvidia-smi call failed: {exc}")
    if proc.returncode != 0:
        return _sample_reading(
            f"nvidia-smi exit {proc.returncode}: {proc.stderr.strip()[:120]}")
    try:
        return parse_nvidia_smi_csv(proc.stdout)
    except ValueError as exc:
        return _sample_reading(f"nvidia-smi output unparseable: {exc}")


# ---------------------------------------------------------------------------
# Self-test — no hardware, no network. `python3 nvml_provider.py`.
# ---------------------------------------------------------------------------
def _selftest() -> dict:
    out: dict = {"checks": []}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    # Parse a realistic RTX-5000-style CSV row -> MEASURED watts.
    sample_csv = "87.34, 250.00, 51, 64"
    g = parse_nvidia_smi_csv(sample_csv)
    check("parsed_draw_watts", abs(g.power_draw_w - 87.34) < 1e-6)
    check("parsed_limit_watts", abs(g.power_limit_w - 250.0) < 1e-6)
    check("parsed_temp", abs(g.temperature_c - 51.0) < 1e-6)
    check("parsed_util", abs(g.utilization_pct - 64.0) < 1e-6)
    check("parsed_is_measured", g.measured is True)
    check("parsed_source_nvml", g.source == "nvml")
    check("headroom_correct", abs(g.headroom_w - (250.0 - 87.34)) < 1e-6)

    # joules = power_draw_W * task_seconds (REAL number on a measured reading).
    j = g.joules_for(10.0)
    check("joules_real", abs(j - 87.34 * 10.0) < 1e-6)
    check("joules_zero_task", g.joules_for(0.0) == 0.0)

    # Multi-GPU output uses the first device line.
    multi = "100.0, 300.0, 60, 90\n55.0, 300.0, 48, 20\n"
    gm = parse_nvidia_smi_csv(multi)
    check("multi_gpu_first_device", abs(gm.power_draw_w - 100.0) < 1e-6)

    # Malformed / empty input raises (so the live path can fall back).
    for bad in ("", "   ", "not,enough", "a,b,c,d"):
        raised = False
        try:
            parse_nvidia_smi_csv(bad)
        except ValueError:
            raised = True
        check(f"bad_input_raises[{bad!r}]", raised)

    # Off-box fallback is honest: measured=False, labelled SAMPLE, never claims
    # a real number. (We force this path by calling the fallback directly so the
    # test is deterministic regardless of whether this host has a GPU.)
    s = _sample_reading("test")
    check("sample_not_measured", s.measured is False)
    check("sample_source", s.source == "sample")
    check("sample_label", s.as_dict()["estimate_label"] == "SAMPLE/ESTIMATE")

    # read_gpu_power never raises and labels honestly on THIS host.
    live = read_gpu_power()
    check("read_returns_gpupower", isinstance(live, GpuPower))
    check("read_label_consistent",
          live.as_dict()["estimate_label"]
          == ("MEASURED" if live.measured else "SAMPLE/ESTIMATE"))
    # If nvidia-smi is absent (expected off-box) the reading MUST be sample.
    if not nvidia_smi_available():
        check("offbox_is_sample", live.measured is False)

    # negative task_seconds rejected.
    raised = False
    try:
        g.joules_for(-1.0)
    except ValueError:
        raised = True
    check("negative_task_seconds_rejected", raised)

    out["ok"] = True
    return out


def main() -> int:
    live = read_gpu_power()
    print("[nvml_provider] GPU power reading:")
    print(json.dumps(live.as_dict(), indent=2))
    example_seconds = 10.0
    print(f"[nvml_provider] joules for a {example_seconds:.0f}s task: "
          f"{live.joules_for(example_seconds):.1f} J "
          f"({'MEASURED' if live.measured else 'SAMPLE/ESTIMATE'})")
    result = _selftest()
    print("[nvml_provider] self-test:", json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
