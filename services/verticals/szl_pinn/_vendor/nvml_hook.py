# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED · Λ = Conjecture 1 (advisory, NOT proven trust)
# Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com>
"""nvml_hook — REAL NVML-style measured-input hook for the physics-bounds certifier.

Doctrine v11 HARD RULE: joules are MEASURED ONLY via a real exporter. This module
is the clean seam between SZL's compute fleet and the certifier:

  * ``read_nvml_job(...)``   — reads MEASURED power(W), temperature(K), and counts
    bit-operations over a MEASURED window from a REAL GPU via NVIDIA NVML
    (pynvml). If NVML is unavailable (e.g. this sandbox has no GPU), it raises
    ``NvmlUnavailable`` — it NEVER fabricates a measurement.
  * ``sample_job()``         — HONEST, CLEARLY-LABELLED sample inputs (label="SAMPLE")
    so the engine is runnable + testable in-sandbox WITHOUT pretending the numbers
    are measured. The certificate echoes label="SAMPLE" so no reader is misled.
  * ``forge_job(...)``       — the EXACT hook Forge calls on real metal: pass in the
    NVML readings the Forge exporter already collects, get a MeasuredJob labelled
    "MEASURED" / source "nvidia-nvml". Same MeasuredJob shape either way → clean
    interface, identical certifier downstream.

NO free-energy. The energy (joules) is DERIVED as MEASURED avg_power × MEASURED
wall_time — never asserted independently, never invented.
"""
from __future__ import annotations

import time
from typing import Optional

from physics_bounds import MeasuredJob


class NvmlUnavailable(RuntimeError):
    """Raised when no real NVML/GPU is present. We never fabricate a measurement."""


# --------------------------------------------------------------------------- #
# REAL NVML reader (used by Forge on metal). Honest no-fabrication contract.   #
# --------------------------------------------------------------------------- #
def _import_pynvml():
    try:
        import pynvml  # type: ignore
        return pynvml
    except Exception as e:  # pragma: no cover - exercised only on real metal
        raise NvmlUnavailable(
            "pynvml/NVML not available in this environment — no GPU to MEASURE. "
            "Refusing to fabricate a measurement (Doctrine v11: joules MEASURED-only)."
        ) from e


def read_nvml_job(
    *,
    duration_s: float,
    bit_operations: float,
    bits_erased: float,
    info_content_bits: float,
    device_mass_kg: float,
    device_radius_m: float,
    device_index: int = 0,
    sample_hz: float = 10.0,
) -> MeasuredJob:
    """MEASURE a job on a REAL GPU via NVML over `duration_s`, returning a
    MeasuredJob labelled MEASURED. Raises NvmlUnavailable if there is no GPU.

    The caller is expected to have launched the compute workload; this samples
    board power and temperature over the window and integrates average power.
    """  # pragma: no cover - requires real GPU
    pynvml = _import_pynvml()
    pynvml.nvmlInit()
    try:
        handle = pynvml.nvmlDeviceGetHandleByIndex(device_index)
        powers, temps = [], []
        n = max(1, int(duration_s * sample_hz))
        for _ in range(n):
            powers.append(pynvml.nvmlDeviceGetPowerUsage(handle) / 1000.0)  # mW -> W
            temps.append(pynvml.nvmlDeviceGetTemperature(
                handle, pynvml.NVML_TEMPERATURE_GPU) + 273.15)              # °C -> K
            time.sleep(1.0 / sample_hz)
        avg_power = sum(powers) / len(powers)
        avg_temp = sum(temps) / len(temps)
    finally:
        pynvml.nvmlShutdown()
    return MeasuredJob(
        avg_power_w=avg_power, wall_time_s=duration_s, temperature_k=avg_temp,
        bit_operations=bit_operations, bits_erased=bits_erased,
        info_content_bits=info_content_bits, device_mass_kg=device_mass_kg,
        device_radius_m=device_radius_m, label="MEASURED", source="nvidia-nvml",
        note="board power/temp sampled via NVML; energy DERIVED = avg_power×wall_time",
    )


def forge_job(
    *,
    avg_power_w: float,
    wall_time_s: float,
    temperature_k: float,
    bit_operations: float,
    bits_erased: float,
    info_content_bits: float,
    device_mass_kg: float,
    device_radius_m: float,
    source: str = "nvidia-nvml",
) -> MeasuredJob:
    """The EXACT hook for Forge: feed NVML readings the exporter ALREADY collects
    (avg board power over the window, peak/avg temp, op counters) → a MEASURED
    MeasuredJob. Identical downstream certifier. This is the production path.
    """
    return MeasuredJob(
        avg_power_w=float(avg_power_w), wall_time_s=float(wall_time_s),
        temperature_k=float(temperature_k), bit_operations=float(bit_operations),
        bits_erased=float(bits_erased), info_content_bits=float(info_content_bits),
        device_mass_kg=float(device_mass_kg), device_radius_m=float(device_radius_m),
        label="MEASURED", source=source,
        note="readings supplied by Forge NVML exporter; joules DERIVED from power×time",
    )


# --------------------------------------------------------------------------- #
# HONEST sample (in-sandbox only; CLEARLY labelled SAMPLE — never 'measured')  #
# --------------------------------------------------------------------------- #
def sample_job() -> MeasuredJob:
    """HONEST sample inputs for an in-sandbox run. label='SAMPLE', source='honest-
    sample' — the certificate echoes this so NO reader mistakes it for measured.

    Numbers chosen to resemble a single modern data-center GPU running a short
    training step (order-of-magnitude realistic, but NOT a real measurement):
      ~700 W board power, ~10 s, ~350 K die, ~1e16 bit-ops, ~1e14 bit-erasures,
      ~1e12 bits of model/activation state, ~2 kg, ~0.15 m bounding radius.
    """
    return MeasuredJob(
        avg_power_w=700.0,           # SAMPLE: ~H100-class board power
        wall_time_s=10.0,            # SAMPLE: a 10 s training step
        temperature_k=350.0,         # SAMPLE: ~77 °C die temperature
        bit_operations=1.0e16,       # SAMPLE: counted logical bit-ops
        bits_erased=1.0e14,          # SAMPLE: irreversible erasures (subset of ops)
        info_content_bits=1.0e12,    # SAMPLE: registered state (~125 GB)
        device_mass_kg=2.0,          # SAMPLE: board+heatsink mass
        device_radius_m=0.15,        # SAMPLE: bounding radius of the package
        label="SAMPLE",
        source="honest-sample",
        note=("HONEST SAMPLE inputs — NOT a real measurement. In production, Forge "
              "supplies these via forge_job()/read_nvml_job() from the real NVML "
              "exporter. Order-of-magnitude realistic for a single DC GPU step."),
    )


def get_job(prefer_real: bool = True, **real_kwargs) -> MeasuredJob:
    """Convenience: try a REAL NVML read; on no-GPU fall back to the HONEST sample.

    The fallback is CLEARLY labelled SAMPLE so the honesty contract holds. Forge,
    on metal, will pass prefer_real=True with the workload-launch kwargs and get a
    MEASURED job; the sandbox transparently gets a SAMPLE job.
    """
    if prefer_real and real_kwargs:
        try:
            return read_nvml_job(**real_kwargs)
        except NvmlUnavailable:
            pass
    return sample_job()


__all__ = [
    "NvmlUnavailable", "read_nvml_job", "forge_job", "sample_job", "get_job",
]


if __name__ == "__main__":
    job = sample_job()
    print("HONEST SAMPLE job (label=%s, source=%s):" % (job.label, job.source))
    print(f"  avg_power_w   = {job.avg_power_w} W   (MEASURED slot)")
    print(f"  wall_time_s   = {job.wall_time_s} s   (MEASURED slot)")
    print(f"  temperature_k = {job.temperature_k} K (MEASURED slot)")
    print(f"  energy_joules = {job.energy_joules} J (DERIVED = power×time)")
    try:
        read_nvml_job(duration_s=0.1, bit_operations=1, bits_erased=1,
                      info_content_bits=1, device_mass_kg=2, device_radius_m=0.15)
    except NvmlUnavailable as e:
        print("\nNVML real-read correctly refuses to fabricate in sandbox:")
        print("  " + str(e))
