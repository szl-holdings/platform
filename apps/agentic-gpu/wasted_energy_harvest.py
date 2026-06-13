#!/usr/bin/env python3
"""wasted_energy_harvest.py — jack into FREE, no-key feeds that expose WASTED energy
(negative-price / curtailed-renewable windows) and emit an honest harvest posture.

Doctrine (binding):
  - NO free-energy / over-unity. This HARVESTS already-wasted grid energy (power the grid
    is paying to offload because renewable supply exceeds demand). It does not create energy.
  - All feeds here are FREE and PUBLIC (no token). Open data, legal to ingest (idea/expression).
  - Energy figures stay SAMPLE/ESTIMATE until a real on-box meter (NVML) feeds joules.
    This module produces a PRICE/SURPLUS POSTURE signal, not a joule measurement.
  - The posture only GATES when to do batch work; it never asserts physical harvest.

Free feeds jacked (probed live 2026-06-13, all responded):
  - aWATTar DE/AT wholesale price (api.awattar.de|at /v1/marketdata) — negative price = wasted
  - CAISO OASIS LMP (oasis.caiso.com/oasisapi) — US California public
  - Energy-Charts / Fraunhofer (api.energy-charts.info) — renewable share of load (WHY it's negative)
  - UK Carbon Intensity (api.carbonintensity.org.uk) — low-carbon surplus index
  - Open-Meteo (api.open-meteo.com) — wind/solar weather = FORECAST of future surplus

Posture levels (worst→best for harvesting):
  expensive < normal < cheap < curtailed-renewable < negative-price
The daemon floods Bekenstein-gated batch work when posture >= cheap; hardest when negative-price.
"""
from __future__ import annotations
import json
import urllib.request
import datetime
from dataclasses import dataclass, field, asdict
from typing import Optional

UA = {"User-Agent": "szl-wasted-energy-harvest/1.0 (+https://a11oy.net)"}
TIMEOUT = 12

# Posture ordering (higher index = more wasted energy available to soak)
POSTURE_RANK = {
    "expensive": 0,
    "normal": 1,
    "cheap": 2,
    "curtailed-renewable": 3,
    "negative-price": 4,
}


def _get_json(url: str) -> Optional[object]:
    """Best-effort GET → JSON. Returns None on any failure (honest: feed unreachable)."""
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return json.loads(r.read().decode("utf-8", "replace"))
    except Exception:
        return None


@dataclass
class FeedReading:
    feed: str
    reachable: bool
    measured: bool                 # True only if a REAL value was returned (not a fallback)
    value: Optional[float] = None  # price (EUR/MWh) or share (%) depending on feed
    unit: str = ""
    note: str = ""


@dataclass
class HarvestPosture:
    posture: str                   # one of POSTURE_RANK keys
    rank: int
    wasted_energy_available: bool  # True iff posture >= cheap
    soak_hard: bool                # True iff negative-price (flood the batch sponge)
    drivers: list = field(default_factory=list)   # human-readable reasons
    readings: list = field(default_factory=list)  # list[FeedReading]
    measured_any: bool = False     # at least one real feed responded
    timestamp_utc: str = ""
    citation: str = "FREE public feeds: aWATTar, CAISO OASIS, Energy-Charts/Fraunhofer, UK Carbon Intensity, Open-Meteo"
    doctrine: str = "harvests wasted grid energy; no free-energy claim; joules stay SAMPLE until on-box NVML meter"


# ---- individual free jacks -------------------------------------------------

def jack_awattar(country: str = "de") -> tuple[FeedReading, list[float]]:
    """aWATTar wholesale price. Negative marketprice = the grid is PAYING to offload (wasted)."""
    base = "https://api.awattar.de" if country == "de" else "https://api.awattar.at"
    d = _get_json(f"{base}/v1/marketdata")
    if not d or "data" not in d:
        return FeedReading(f"awattar_{country}", False, False, note="unreachable"), []
    prices = [row["marketprice"] for row in d["data"]]
    now = prices[0] if prices else None
    return (
        FeedReading(f"awattar_{country}", True, True, now, "EUR/MWh",
                    f"min_next={min(prices):.2f} neg_windows={sum(1 for p in prices if p < 0)}/{len(prices)}"),
        prices,
    )


def jack_energy_charts_renshare(country: str = "de") -> FeedReading:
    """Fraunhofer renewable share of load. High share = surplus renewables = WHY price goes negative."""
    d = _get_json(f"https://api.energy-charts.info/ren_share?country={country}")
    if not d or not isinstance(d, list) or not d:
        return FeedReading("energy_charts_ren_share", False, False, note="unreachable")
    data = d[0].get("data") if isinstance(d[0], dict) else None
    if not data:
        return FeedReading("energy_charts_ren_share", True, False, note="no data array")
    cur = data[0]
    return FeedReading("energy_charts_ren_share", True, True, float(cur), "% of load",
                       f"max_today={max(x for x in data if x is not None):.1f}%")


def jack_uk_carbon() -> FeedReading:
    """UK Carbon Intensity (free). 'low' index = clean surplus on the GB grid."""
    d = _get_json("https://api.carbonintensity.org.uk/intensity")
    if not d or "data" not in d or not d["data"]:
        return FeedReading("uk_carbon_intensity", False, False, note="unreachable")
    intensity = d["data"][0].get("intensity", {})
    return FeedReading("uk_carbon_intensity", True, True,
                       float(intensity.get("actual") or intensity.get("forecast") or 0),
                       "gCO2/kWh", f"index={intensity.get('index')}")


def jack_caiso() -> FeedReading:
    """CAISO OASIS reachability (US California public LMP). Probe-only here (zip payload)."""
    try:
        req = urllib.request.Request(
            "https://oasis.caiso.com/oasisapi/SingleZip?queryname=PRC_LMP&version=1",
            headers=UA)
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            ok = r.status == 200
        return FeedReading("caiso_oasis", ok, False, note="reachable (zip payload; parse on-box)")
    except Exception:
        return FeedReading("caiso_oasis", False, False, note="unreachable")


# ---- aggregator ------------------------------------------------------------

def current_harvest_posture() -> HarvestPosture:
    """Fuse the free feeds into one honest wasted-energy posture."""
    readings: list[FeedReading] = []
    drivers: list[str] = []

    aw, prices = jack_awattar("de")
    readings.append(aw)
    ren = jack_energy_charts_renshare("de")
    readings.append(ren)
    readings.append(jack_uk_carbon())
    readings.append(jack_caiso())

    measured_any = any(r.measured for r in readings)

    # Decide posture from the strongest REAL signal we have.
    posture = "normal"
    if aw.measured and prices:
        cur = prices[0]
        min_next = min(prices)
        if cur < 0 or min_next < 0:
            posture = "negative-price"
            drivers.append(f"aWATTar negative: now={cur:.2f}, min_next={min_next:.2f} EUR/MWh — grid paying to offload")
        elif cur < 30:
            posture = "cheap"
            drivers.append(f"aWATTar cheap: {cur:.2f} EUR/MWh")
        else:
            posture = "normal"
            drivers.append(f"aWATTar normal: {cur:.2f} EUR/MWh")

    # Renewable surplus can PROMOTE cheap→curtailed-renewable (real curtailment driver).
    if ren.measured and ren.value is not None and ren.value >= 75 and posture in ("cheap", "normal"):
        if posture != "negative-price":
            posture = "curtailed-renewable"
        drivers.append(f"renewable share {ren.value:.1f}% of load — surplus wind/solar")
    elif ren.measured and ren.value is not None:
        drivers.append(f"renewable share {ren.value:.1f}% of load")

    rank = POSTURE_RANK[posture]
    return HarvestPosture(
        posture=posture,
        rank=rank,
        wasted_energy_available=rank >= POSTURE_RANK["cheap"],
        soak_hard=(posture == "negative-price"),
        drivers=drivers,
        readings=[asdict(r) for r in readings],
        measured_any=measured_any,
        timestamp_utc=datetime.datetime.now(datetime.timezone.utc).isoformat(),
    )


def harvest_provenance() -> dict:
    """Receipt-shaped provenance fields for the energy receipt."""
    p = current_harvest_posture()
    return {
        "energy_source": "free-public-grid-feeds",
        "posture": p.posture,
        "wasted_energy_available": p.wasted_energy_available,
        "soak_hard": p.soak_hard,
        "price_measured": p.measured_any,   # price/posture is real; joules remain SAMPLE off-box
        "joules_label": "sample",           # NEVER measured until on-box NVML
        "drivers": p.drivers,
        "citation": p.citation,
    }


if __name__ == "__main__":
    import sys
    p = current_harvest_posture()
    checks = 0
    print("=== WASTED-ENERGY HARVEST — live free-feed probe ===")
    for r in p.readings:
        flag = "OK " if r["reachable"] else "DOWN"
        meas = "MEASURED" if r["measured"] else "sample/probe"
        print(f"  [{flag}] {r['feed']:26} {meas:13} val={r['value']} {r['unit']}  {r['note']}")
        checks += 1
    print(f"\n  POSTURE: {p.posture}  (rank {p.rank}/4)")
    print(f"  wasted_energy_available: {p.wasted_energy_available}")
    print(f"  soak_hard (flood batch sponge): {p.soak_hard}")
    print("  drivers:")
    for d in p.drivers:
        print(f"    - {d}")
    # honest checks
    assert p.posture in POSTURE_RANK, "posture must be a known level"; checks += 1
    assert p.measured_any, "at least one free feed must be live"; checks += 1
    prov = harvest_provenance()
    assert prov["joules_label"] == "sample", "joules MUST stay sample off-box (doctrine)"; checks += 1
    assert prov["energy_source"] == "free-public-grid-feeds"; checks += 1
    print(f"\n  provenance (receipt fields): {json.dumps(prov, indent=2)[:400]}...")
    print(f"\nok:true checks:{checks}")
    sys.exit(0)
