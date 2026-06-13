"""
SZL Reverse-Loop — honest GPU waste-heat recovery ENVELOPE (Doctrine v11).

Founder instinct ("jack the electricity, reverse-loop the semiconductors") maps to
TWO real published techniques — no fantasy:
  (1) Adiabatic / reversible CMOS — charge is ramped down in REVERSE and RECOVERED
      to source via a resonator (Vaire "Ice River" 22nm test chip, Sept 2025;
      published 76-90% switching-energy recovery). Needs chip-level hardware (a
      resonator); software CANNOT flip an existing RTX 5000 into reverse-recovery.
      ROADMAP ONLY — never claimed of our current GPU.
  (2) GPU waste-heat recovery via thermoelectric Seebeck — TEGs on a 60-90C GPU
      recover real electrical power from wasted heat. MEASURABLE once a TEG + a
      thermal sensor exist on the node.

This module computes the RECOVERABLE WASTE-HEAT ENVELOPE from REAL thermal data
when a source is reachable, bounded by Carnot and the Landauer floor (#240). It
NEVER claims captured power (no TEG mounted) and NEVER beats the floor. No
free-energy, no over-unity: reverse-recovery + Seebeck RECYCLE already-spent
energy, they do not create it.

Honesty: szl_gpu_temp_c + szl_energy_reverse_recovery_envelope_w are emitted to
/metrics ONLY when a REAL thermal source is read. The box is CPU-only (no
nvidia-smi) and the GPU node (betterwithage, Tailscale) exposes Ollama :11434 only
(no NVML/node-exporter reachable), so today the metrics report availability=0 and
the JSON returns a clearly-labelled ILLUSTRATIVE envelope, never a measurement.
Lambda = Conjecture 1; not one of the locked-8; sovereign stays False.
"""
import json
import os
import shutil
import subprocess
import urllib.request

# Documented physical constants (cited, not invented).
SEEBECK_RECOVERY_EFF = 0.06   # practical bulk-TEG conversion ~5-8% of thermal flux (ZT~1); midpoint
T_AMBIENT_C_DEFAULT = 22.0    # room/datacenter ambient
_K = 273.15

CITES = {
    "seebeck_recovery_eff": "practical bulk-TEG conversion ~5-8% of thermal flux (ZT~1); GPU-WHR study",
    "carnot_ceiling": "recoverable fraction <= 1 - T_ambient/T_hot (Carnot); a hard physical ceiling",
    "landauer_floor": "#240 Landauer floor: irreversible bit erasure costs >= kT ln2; you may recover "
                      "wasted heat but never the Landauer-floored minimum work of the computation",
    "penrose_analogue": "Penrose irreducible-mass analogue: extractable energy is bounded; a residue "
                        "is never recoverable",
    "adiabatic_cmos": "Vaire 'Ice River' 22nm reversible/adiabatic CMOS (Sept 2025), 76-90% "
                      "switching-energy recovery — chip hardware; ROADMAP",
}


def _try_nvidia_smi():
    exe = shutil.which("nvidia-smi")
    if not exe:
        return None
    try:
        out = subprocess.run(
            [exe, "--query-gpu=temperature.gpu,power.draw,power.limit",
             "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=5)
        if out.returncode != 0 or not out.stdout.strip():
            return None
        first = out.stdout.strip().splitlines()[0]
        parts = [x.strip() for x in first.split(",")]
        temp = float(parts[0])
        draw = float(parts[1]) if len(parts) > 1 and parts[1] not in ("", "[N/A]") else None
        lim = float(parts[2]) if len(parts) > 2 and parts[2] not in ("", "[N/A]") else None
        return {"temp_c": temp, "power_w": draw, "power_limit_w": lim,
                "source": "nvidia-smi (local)"}
    except Exception:
        return None


def _try_thermal_url():
    url = os.environ.get("GPU_THERMAL_URL")
    if not url:
        return None
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "szl-reverse-loop"})
        with urllib.request.urlopen(req, timeout=4) as r:
            if getattr(r, "status", 200) != 200:
                return None
            d = json.loads(r.read().decode("utf-8", "replace"))
        temp = d.get("temp_c", d.get("temperature_gpu"))
        if temp is None:
            return None
        return {"temp_c": float(temp), "power_w": d.get("power_w"),
                "power_limit_w": d.get("power_limit_w"),
                "source": "GPU_THERMAL_URL"}
    except Exception:
        return None


def read_gpu_thermal():
    """Return REAL thermal {temp_c, power_w, ...} or None. Never fabricates."""
    return _try_nvidia_smi() or _try_thermal_url()


def _envelope(temp_c, power_w, t_ambient_c=T_AMBIENT_C_DEFAULT):
    """Recoverable waste-heat envelope (W). Heat-flux proxy = power_w (≈ all GPU
    draw becomes heat). The Carnot ceiling caps the recoverable fraction; we apply
    the documented practical Seebeck efficiency OR the Carnot ceiling, whichever is
    SMALLER (can never exceed Carnot)."""
    t_hot = temp_c + _K
    t_amb = t_ambient_c + _K
    carnot = max(0.0, 1.0 - (t_amb / t_hot)) if t_hot > 0 else 0.0
    eff = min(SEEBECK_RECOVERY_EFF, carnot)
    recoverable_w = round(eff * float(power_w), 2) if power_w is not None else None
    return {
        "carnot_ceiling_frac": round(carnot, 4),
        "applied_recovery_eff": round(eff, 4),
        "recoverable_w": recoverable_w,
    }


def reverse_loop_status():
    th = read_gpu_thermal()
    measured = th is not None
    out = {
        "status": "live",
        "ns": "a11oy",
        "doctrine": "v11",
        "kind": "gpu-waste-heat-recovery-envelope",
        "measured": measured,
        "sovereign": False,
        "joules_label": "sample",
        "thermal_source": (th or {}).get("source"),
        "constants": {
            "seebeck_recovery_eff": SEEBECK_RECOVERY_EFF,
            "t_ambient_c_assumed": T_AMBIENT_C_DEFAULT,
        },
        "bounds": CITES,
        "adiabatic_cmos_roadmap": (
            "Reverse-recovering the RTX 5000's OWN switching energy needs adiabatic/"
            "reversible-CMOS hardware (a resonator) — software cannot do it on a "
            "non-adiabatic chip. Vaire-style; ROADMAP, never claimed of our current GPU."
        ),
    }
    if measured:
        env = _envelope(th["temp_c"], th.get("power_w"))
        out["gpu_temp_c"] = th["temp_c"]
        out["gpu_power_w"] = th.get("power_w")
        out["envelope"] = env
        out["note"] = ("MEASURED thermal from a real source. recoverable_w is the "
                       "RECOVERABLE ENVELOPE (Carnot/Seebeck-bounded), NOT captured "
                       "power — a TEG must be physically mounted to capture it.")
    else:
        ex_temp, ex_power = 75.0, 230.0
        ex = _envelope(ex_temp, ex_power)
        out["envelope_unavailable_reason"] = (
            "No reachable thermal source: box is CPU-only (no nvidia-smi) and the GPU "
            "node (betterwithage, Tailscale) exposes Ollama :11434 only — no NVML/"
            "nvidia-smi/node-exporter. Set GPU_THERMAL_URL or run nvidia-smi on the "
            "GPU node to feed real temp (founder hardware step)."
        )
        out["illustrative_estimate"] = {
            "label": "ILLUSTRATIVE — assumed inputs, NOT measured, NOT charted",
            "assumed_gpu_temp_c": ex_temp,
            "assumed_gpu_power_w_tdp": ex_power,
            "carnot_ceiling_frac": ex["carnot_ceiling_frac"],
            "applied_recovery_eff": ex["applied_recovery_eff"],
            "recoverable_w": ex["recoverable_w"],
            "worked": (f"recoverable_w = min(seebeck_eff={SEEBECK_RECOVERY_EFF}, "
                       f"carnot={ex['carnot_ceiling_frac']}) * {ex_power}W"),
        }
        out["note"] = ("Reverse-loop envelope CALCULATOR is live; the thermal INPUT is "
                       "founder-gated (no remote NVML). Numbers shown are illustrative, "
                       "never charted as real. No free-energy: bounded by Carnot + Landauer #240.")
    return out


def metrics_lines(_g):
    """Honest Prometheus lines for /metrics. Real gauges ONLY when measured; the
    availability gauge is always present. `_g` is the caller's None-skipping helper."""
    th = read_gpu_thermal()
    if th is not None:
        env = _envelope(th["temp_c"], th.get("power_w"))
        return "".join([
            _g("szl_energy_reverse_recovery_available", 1,
               "1 = a REAL GPU thermal source was read this scrape."),
            _g("szl_gpu_temp_c", th["temp_c"],
               "Real GPU temperature (C) from nvidia-smi/NVML."),
            _g("szl_energy_reverse_recovery_envelope_w", env["recoverable_w"],
               "Recoverable waste-heat ENVELOPE (W), Carnot/Seebeck-bounded; NOT captured power."),
            _g("szl_energy_reverse_recovery_carnot_frac", env["carnot_ceiling_frac"],
               "Carnot ceiling fraction (1 - T_amb/T_hot) for the current thermal reading."),
        ])
    return _g("szl_energy_reverse_recovery_available", 0,
              "0 = no reachable GPU thermal source (CPU-only box; GPU node exposes "
              "Ollama only). szl_gpu_temp_c / _envelope_w are intentionally absent, "
              "never fabricated. Feed GPU_THERMAL_URL or on-node nvidia-smi to enable.")
