"""
SZL Energy Budget + Provenance — honest harvest-budget surfaces (Doctrine v11).

Two additive, read-only surfaces on the energy-harvest microservice:
  /energy/budget      -> energy_budget()      the admissible compute-energy budget
                         for the CURRENT live grid posture, bounded by the proven
                         physical formulas (Bekenstein cap #239, Landauer floor
                         #240); the REALIZED budget counts ONLY measured joules
                         (settle-to-count).
  /energy/provenance  -> energy_provenance()  the provenance chain of measured-joule
                         EnergyReservoir entries -> DSSE receipt citing #239/#240 ->
                         validate vs canonical-formulas-v1 / lean-proofs-v1 -> Ayni F11.

HONESTY: there is NO on-box NVML meter yet (the box is CPU-only; the GPU node
exposes Ollama over Tailscale only), so joules are SAMPLE and the realized budget
and the provenance chain are EMPTY (genesis) until the FIRST measured joule. We
never fabricate a joule, a receipt, or a settled budget. The physical BOUNDS are
real: derived from cited CODATA constants and kernel-checked Lean theorems
(#239 Bekenstein, #240 Landauer). sovereign stays False; not one of the locked-8;
Lambda = Conjecture 1.
"""
from __future__ import annotations

import math
import time
from typing import Any, Dict

# Physical constants (SI, cited — never invented).
_K_B = 1.380649e-23       # Boltzmann constant, J/K (CODATA exact)
_HBAR = 1.054571817e-34   # reduced Planck constant, J*s (CODATA)
_C = 299792458.0          # speed of light in vacuum, m/s (exact)
_LN2 = math.log(2.0)
_T_AMBIENT_C = 22.0        # matches reverse.py ambient assumption
_T_AMBIENT_K = _T_AMBIENT_C + 273.15

# Kernel-checked Lean theorems that BOUND the budget (cited by id; resolve the
# commit via lutar-lean). Status is honest: these are REAL proofs, but they bound
# the budget — they are NOT a claim that any joule has been measured.
_LEAN_BOUNDS = {
    "bekenstein_cap": {
        "id": "#239",
        "name": "Bekenstein bound",
        "formula": "I_max = 2*pi*R*E / (hbar*c*ln2)  bits "
                   "(max information in a region of radius R holding energy E)",
        "role": "UPPER bound: a measured joule admits at most this many useful "
                "bits of computation in a bounded region.",
        "status": "REAL kernel-checked Lean theorem (lutar-lean #239); cite by commit.",
    },
    "landauer_floor": {
        "id": "#240",
        "name": "Landauer floor",
        "formula": "E_min = k_B*T*ln2  joules per irreversible bit erased",
        "role": "LOWER bound: each irreversible bit erasure costs at least this; "
                "waste heat may be recovered but the floor is never beaten.",
        "status": "REAL kernel-checked Lean theorem (lutar-lean #240); cite by commit.",
    },
}


def _landauer_floor_j_per_bit(t_k: float = _T_AMBIENT_K) -> float:
    """Real Landauer floor in joules per irreversible bit at temperature t_k."""
    return _K_B * t_k * _LN2


def energy_budget(posture: Dict[str, Any]) -> Dict[str, Any]:
    """Honest compute-energy budget for the CURRENT grid posture.

    `posture` is the dict from engine.posture_summary() (caller fetches it). The
    PHYSICAL bounds are real; the REALIZED budget counts ONLY measured joules and
    is 0.0 because there is no NVML meter yet. Nothing is fabricated."""
    window_open = bool(posture.get("wasted_energy_available"))
    floor = _landauer_floor_j_per_bit()
    return {
        "status": "live",
        "ns": "a11oy",
        "doctrine": "v11",
        "kind": "energy-harvest-budget",
        "window_open": window_open,
        "soak_admitted": window_open,
        "grid_price_posture": posture.get("grid_price_posture"),
        "price_now_eur_mwh": posture.get("price_now_eur_mwh"),
        "next_window_negative": posture.get("next_window_negative"),
        "joules_label": "sample",
        "measured_joules_to_date": 0,      # settle-to-count: no NVML meter yet
        "realized_budget_j": 0.0,          # only MEASURED joules count; none yet
        "bounds": _LEAN_BOUNDS,
        "landauer_floor_j_per_bit": floor,  # REAL: k_B * T * ln2 at 22 C
        "landauer_floor_basis": {
            "k_b_j_per_k": _K_B, "t_k": _T_AMBIENT_K, "ln2": _LN2,
            "worked": "E_min = k_B * T * ln2",
        },
        "admission_rule": (
            "PROACTIVE/batch compute is admitted ONLY in an open wasted-energy "
            "window (negative wholesale price / curtailed renewables); reactive/"
            "critical work ALWAYS serves and never consults this budget."
        ),
        "note": (
            "The budget's PHYSICAL bounds are real (cited CODATA constants + "
            "kernel-checked Lean #239/#240); the REALIZED budget is 0.0 J because "
            "no joule has been MEASURED yet (CPU-only box; GPU node exposes Ollama "
            "only — feed GPU_THERMAL_URL/NVML to begin counting). No joule is faked."
        ),
        "sovereign": False,
        "ts": time.time(),
    }


def energy_provenance(posture: Dict[str, Any]) -> Dict[str, Any]:
    """Honest provenance chain for measured-joule EnergyReservoir entries.

    Each MEASURED joule becomes an EnergyReservoir entry -> a DSSE receipt citing
    Bekenstein #239 + Landauer #240 -> validated against canonical-formulas-v1 /
    lean-proofs-v1 -> Ayni-balanced (F11). With no NVML meter there are ZERO
    measured entries, so the chain is at GENESIS — declared, never fabricated."""
    entries: list = []  # measured-joule reservoir entries; empty until first NVML joule
    return {
        "status": "live",
        "ns": "a11oy",
        "doctrine": "v11",
        "kind": "energy-provenance-chain",
        "chain_length": len(entries),
        "entries": entries,
        "genesis": len(entries) == 0,
        "settle_to_count": True,
        "joules_label": "sample",
        "window_open": bool(posture.get("wasted_energy_available")),
        "receipt_schema": {
            "cites": ["#239 Bekenstein cap", "#240 Landauer floor"],
            "validates_against": ["canonical-formulas-v1", "lean-proofs-v1"],
            "ayni_balance": "F11",
            "signing": "DSSE envelope per measured-joule reservoir entry",
        },
        "note": (
            "The provenance chain is GENESIS (0 entries): no joule has been MEASURED "
            "yet (no on-box NVML; GPU node exposes Ollama only). Each future MEASURED "
            "joule emits a DSSE receipt citing #239/#240, validated vs "
            "canonical-formulas-v1 / lean-proofs-v1 and Ayni-balanced (F11). We never "
            "fabricate a receipt or a joule."
        ),
        "sovereign": False,
        "ts": time.time(),
    }
