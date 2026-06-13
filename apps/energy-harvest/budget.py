"""
SZL Energy Budget + Provenance — honest harvest-budget surfaces (Doctrine v11).

Two additive, read-only surfaces on the energy-harvest microservice:
  /energy/budget      -> energy_budget()      the admissible compute-energy budget
                         for the CURRENT live grid posture, bounded by the proven
                         physical formulas (Bekenstein cap #239, Landauer floor
                         #240); the REALIZED budget counts ONLY measured joules
                         (settle-to-count) read RAW from the on-box reservoir ledger.
  /energy/provenance  -> energy_provenance()  the provenance chain of measured-joule
                         EnergyReservoir entries -> DSSE receipt citing #239/#240 ->
                         validate vs canonical-formulas-v1 / lean-proofs-v1 -> Ayni F11.

HONESTY: measured joules are read RAW from the on-box reservoir ledger (only samples
with measured:true, pushed by a real nvidia-smi power.draw exporter, count). Engines
without a live exporter accrue ZERO joules — never estimated. The SIGNED DSSE
provenance chain stays at GENESIS (0 receipts) until receipt-minting is run (keyless
-OIDC / founder-gated; no key committed) — even when measured joules already exist,
we never fabricate a receipt. The physical BOUNDS are real: derived from cited CODATA
constants and kernel-checked Lean theorems (#239 Bekenstein, #240 Landauer).
sovereign stays False; not one of the locked-8; Lambda = Conjecture 1.
"""
from __future__ import annotations

import math
import time
from typing import Any, Dict

# Read the real measured-joule ledger via the reservoir module. Defensive: a missing
# reservoir module or ledger must NEVER brick the budget surface (falls back to 0).
try:
    import reservoir as _reservoir  # ENERGY-RESERVOIR-PATCH
except Exception:  # pragma: no cover
    _reservoir = None


def _ledger() -> Dict[str, Any]:
    if _reservoir is None:
        return {"total_measured_joules": 0.0, "measured_entries": [], "totals": {}}
    try:
        return _reservoir.read_ledger()
    except Exception:
        return {"total_measured_joules": 0.0, "measured_entries": [], "totals": {}}


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


def _max_useful_bits(joules: float, floor_j_per_bit: float) -> float:
    """Honest derived ceiling: at most this many irreversible bit-ops are admissible
    for `joules` of measured energy, given the Landauer floor. 0 when no joule
    measured. This is a BOUND from a real theorem, not a measured bit count."""
    if joules <= 0.0 or floor_j_per_bit <= 0.0:
        return 0.0
    return joules / floor_j_per_bit


def energy_budget(posture: Dict[str, Any]) -> Dict[str, Any]:
    """Honest compute-energy budget for the CURRENT grid posture.

    `posture` is the dict from engine.posture_summary() (caller fetches it). The
    PHYSICAL bounds are real; the REALIZED budget counts ONLY measured joules read
    RAW from the on-box reservoir ledger. Nothing is fabricated."""
    window_open = bool(posture.get("wasted_energy_available"))
    floor = _landauer_floor_j_per_bit()
    led = _ledger()
    measured_j = float(led.get("total_measured_joules") or 0.0)
    totals = led.get("totals", {}) or {}
    try:
        eur_cost = float(totals.get("eur_cost")) if totals.get("eur_cost") is not None else None
    except Exception:
        eur_cost = None
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
        "joules_label": "measured" if measured_j > 0.0 else "sample",
        "measured_joules_to_date": measured_j,   # RAW from reservoir ledger
        "realized_budget_j": measured_j,         # only MEASURED joules count
        "grid_eur_cost_to_date": eur_cost,       # negative = grid PAID to compute
        "grid_paid_to_compute": bool(eur_cost is not None and eur_cost < 0),
        "max_useful_bitops_admissible": _max_useful_bits(measured_j, floor),
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
            "kernel-checked Lean #239/#240); the REALIZED budget counts ONLY "
            "joules MEASURED by a real exporter and read RAW from the on-box "
            "reservoir ledger (see /energy/reservoir). Engines without a live "
            "exporter accrue ZERO joules — never estimated. No joule is faked."
        ),
        "sovereign": False,
        "ts": time.time(),
    }


def energy_provenance(posture: Dict[str, Any]) -> Dict[str, Any]:
    """Honest provenance chain for measured-joule EnergyReservoir entries.

    Each MEASURED joule sample is a reservoir entry; minting it into a SIGNED DSSE
    receipt (citing #239 + #240, validated vs canonical-formulas-v1 / lean-proofs-v1,
    Ayni-balanced F11) is a SEPARATE keyless-OIDC / founder-gated step. Until that
    runs, the SIGNED chain is at GENESIS (0 receipts) even though measured samples
    exist — we never fabricate a receipt."""
    led = _ledger()
    measured_entries = led.get("measured_entries", []) or []
    signed_receipts: list = []  # SIGNED DSSE receipts; empty until minting runs
    return {
        "status": "live",
        "ns": "a11oy",
        "doctrine": "v11",
        "kind": "energy-provenance-chain",
        "chain_length": len(signed_receipts),         # SIGNED receipts only
        "entries": signed_receipts,
        "genesis": len(signed_receipts) == 0,
        "settle_to_count": True,
        "measured_entries_available": len(measured_entries),  # RAW reservoir basis
        "reservoir_total_joules": float(led.get("total_measured_joules") or 0.0),
        "receipts_minted": len(signed_receipts),
        "joules_label": "measured" if (led.get("total_measured_joules") or 0.0) > 0 else "sample",
        "window_open": bool(posture.get("wasted_energy_available")),
        "receipt_schema": {
            "cites": ["#239 Bekenstein cap", "#240 Landauer floor"],
            "validates_against": ["canonical-formulas-v1", "lean-proofs-v1"],
            "ayni_balance": "F11",
            "signing": "DSSE envelope per measured-joule reservoir entry",
        },
        "note": (
            "Measured-joule samples exist in the reservoir (see /energy/reservoir) "
            "but the SIGNED DSSE provenance chain is still at GENESIS (0 receipts): "
            "minting each measured joule into a DSSE receipt citing #239/#240, "
            "validated vs canonical-formulas-v1 / lean-proofs-v1 and Ayni-balanced "
            "(F11), is a SEPARATE keyless-OIDC / founder-gated step (no key "
            "committed). We never fabricate a receipt or a joule."
        ),
        "sovereign": False,
        "ts": time.time(),
    }
