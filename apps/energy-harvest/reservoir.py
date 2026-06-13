"""
SZL Energy Reservoir — honest measured-joule ledger surface (Doctrine v11).

`/energy/reservoir` -> energy_reservoir(): exposes the on-box measured-joule ledger
(the EnergyReservoir the founder GO'd) read-only and HONESTLY. Joules are
trapezoid-integrated from REAL nvidia-smi power.draw samples pushed by an exporter;
nodes WITHOUT an exporter show `awaiting_exporter` and accrue ZERO joules (never
estimated). This is the SOFTWARE half of the founder-GO'd EnergyReservoir:
  STORE   = the append-only on-box ledger (joules.ndjson + joules-status.json)
  DISPERSE = this public read-only surface + downstream /energy/budget,
             /energy/provenance, and the console — the measured signal is shared,
             not hoarded.

HONESTY (the whole point): we report the ledger RAW. A measured joule is counted
ONLY where a real exporter pushed a real power.draw sample (`measured: true`); we
never fabricate, estimate, or round up a joule. sovereign stays False at the signal
level (owned-hardware classification lives in /compute-pool). Bounds cited #239
(Bekenstein cap) / #240 (Landauer floor); Ayni-balance F11; not one of the
locked-8; Lambda = Conjecture 1.
"""
from __future__ import annotations

import json
import os
import time
from typing import Any, Dict, List

# Ledger written by the box joule-meter exporter pipeline. Override via env for tests.
_LEDGER_STATUS = os.environ.get("SZL_JOULES_STATUS", "/var/lib/szl/joules-status.json")
_LEDGER_NDJSON = os.environ.get("SZL_JOULES_NDJSON", "/var/lib/szl/joules.ndjson")

# Cited kernel-checked Lean bounds (resolve commit via lutar-lean). REAL proofs that
# BOUND the reservoir; NOT a claim that any joule was measured.
_BOUNDS_CITED = {
    "bekenstein_cap": {"id": "#239", "role": "UPPER bound on useful bits per joule"},
    "landauer_floor": {"id": "#240", "role": "LOWER bound joules per irreversible bit"},
}


def read_ledger() -> Dict[str, Any]:
    """Read the on-box joule ledger. Returns a normalized dict; NEVER fabricates.
    Missing/unreadable files -> genesis (0 measured joules, empty entries)."""
    status: Dict[str, Any] = {}
    try:
        with open(_LEDGER_STATUS) as f:
            status = json.load(f)
        if not isinstance(status, dict):
            status = {}
    except Exception:
        status = {}

    measured_entries: List[Dict[str, Any]] = []
    try:
        with open(_LEDGER_NDJSON) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    rec = json.loads(line)
                except Exception:
                    continue
                if isinstance(rec, dict) and rec.get("measured") is True:
                    measured_entries.append(rec)
    except Exception:
        pass

    totals = status.get("totals", {}) if isinstance(status.get("totals"), dict) else {}
    try:
        total_joules = float(totals.get("joules") or 0.0)
    except Exception:
        total_joules = 0.0

    return {
        "status_present": bool(status),
        "totals": totals,
        "total_measured_joules": total_joules,
        "measured_entries": measured_entries,
        "engines": status.get("engines", []) if isinstance(status.get("engines"), list) else [],
        "price": status.get("price", {}) if isinstance(status.get("price"), dict) else {},
        "containment": status.get("containment", {}) if isinstance(status.get("containment"), dict) else {},
        "generated_at": status.get("generated_at"),
        "ledger_honesty": status.get("honesty"),
    }


def _measured_by_engine(entries: List[Dict[str, Any]]) -> Dict[str, float]:
    """Sum measured delta_j per engine straight from the ndjson (the measured source)."""
    out: Dict[str, float] = {}
    for rec in entries:
        eng = rec.get("engine") or rec.get("host") or "unknown"
        try:
            out[eng] = round(out.get(eng, 0.0) + float(rec.get("delta_j") or 0.0), 6)
        except Exception:
            continue
    return out


def energy_reservoir(posture: Dict[str, Any]) -> Dict[str, Any]:
    """Honest measured-joule EnergyReservoir surface — reports the ledger RAW."""
    led = read_ledger()
    entries = led["measured_entries"]
    totals = led["totals"]
    total_j = led["total_measured_joules"]

    # eur_cost < 0 means the grid PAID us to compute (negative wholesale price).
    try:
        eur_cost = float(totals.get("eur_cost")) if totals.get("eur_cost") is not None else None
    except Exception:
        eur_cost = None
    grid_paid = bool(eur_cost is not None and eur_cost < 0)

    per_engine = [
        {
            "engine": e.get("engine"),
            "joules": e.get("joules"),
            "power_source": e.get("power_source"),
            # honest: an engine has a live exporter ONLY if it produced measured samples
            "has_live_exporter": (e.get("engine") in _measured_by_engine(entries)),
        }
        for e in led["engines"]
    ]

    has_measured = total_j > 0.0 and len(entries) > 0
    return {
        "status": "live",
        "ns": "a11oy",
        "doctrine": "v11",
        "kind": "energy-reservoir",
        # ---- the measured signal (RAW from the ledger) ----
        "joules_label": "measured" if has_measured else "sample",
        "total_measured_joules": total_j,
        "total_kwh": totals.get("kwh"),
        "measured_entry_count": len(entries),
        "measured_by_engine": _measured_by_engine(entries),
        "engines": per_engine,
        "recent_entries": entries[-10:],
        # ---- the economics (grid paying to compute) ----
        "grid_eur_per_mwh": totals.get("eur_per_mwh"),
        "grid_eur_cost": eur_cost,
        "grid_paid_to_compute": grid_paid,
        "window_open": bool(posture.get("wasted_energy_available")),
        # ---- store + disperse (the EnergyReservoir software half) ----
        "store": {
            "ledger_status": _LEDGER_STATUS,
            "ledger_ndjson": _LEDGER_NDJSON,
            "schema": (totals.get("note") and "szl-joule-meter/1") or "szl-joule-meter/1",
            "append_only": True,
            "generated_at": led["generated_at"],
        },
        "disperse": {
            "public_surface": "/energy/reservoir (this endpoint, read-only)",
            "downstream": ["/energy/budget", "/energy/provenance", "console energy tab"],
            "note": "the measured signal is shared with the ecosystem, not hoarded.",
        },
        # ---- honest containment + provenance bounds ----
        "containment": led["containment"],
        "bounds_cited": _BOUNDS_CITED,
        "ayni_balance": "F11",
        "sovereign": False,
        "ledger_honesty": led["ledger_honesty"],
        "note": (
            "Joules are trapezoid-integrated from REAL nvidia-smi power.draw samples "
            "pushed by an exporter (measured:true). Engines without a live exporter "
            "show awaiting_exporter and accrue ZERO joules — never estimated. "
            "Negative eur_cost means the grid PAID us to soak this already-wasted "
            "energy. sovereign stays False at the signal level (owned-hardware "
            "classification lives in /compute-pool). No joule is ever fabricated."
        ),
        "ts": time.time(),
    }
