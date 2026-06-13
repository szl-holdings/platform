#!/usr/bin/env python3
"""aWATTar spot-price provider — REAL hourly EUR/MWh market price, NO key.

aWATTar publishes the DE/AT hourly day-ahead spot price (incl. NEGATIVE-price
hours) at a fully public endpoint with NO registration / key:

    https://api.awattar.de/v1/marketdata   (DE)
    https://api.awattar.at/v1/marketdata   (AT)

A negative or very low marketprice means the grid has surplus renewable power
RIGHT NOW — exactly the "wasted energy" window the scheduler wants to soak.

DOCTRINE (v11/v12):
  - When a LIVE fetch returns a real marketprice => `measured=True`, source is
    `negative-price` (price < 0) / `cheap` window (price below a low threshold)
    / `grid` otherwise. The price IS a real published figure, not a sample.
  - When the fetch fails / no network => honest SAMPLE fallback (`measured=
    False`, source `grid`, window `normal`) with a note. We NEVER fabricate a
    negative-price claim from a failed fetch.
  - no key (the endpoint needs none); open-weight; source claims match signal.

The JSON parser `parse_awattar_marketdata()` is pure (takes the decoded dict,
returns an `AwattarPrice`) so the self-test runs offline against a captured
sample. `fetch_awattar()` is the only function that touches the network and
degrades honestly to SAMPLE on any error.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional

AWATTAR_DE = "https://api.awattar.de/v1/marketdata"
AWATTAR_AT = "https://api.awattar.at/v1/marketdata"

# aWATTar prices are EUR per MWh. Convert to EUR/kWh for the posture price_signal
# so it is comparable to the off-peak SAMPLE proxy (~0.04-0.12 $/kWh).
_MWH_TO_KWH = 1000.0

# Window thresholds in EUR/MWh (documented, tunable). < 0 => negative-price
# (they pay you); < CHEAP => cheap surplus window; else normal.
CHEAP_THRESHOLD_EUR_MWH = 30.0

# SAMPLE fallback (clearly labelled) used when no live fetch is possible.
SAMPLE_PRICE_EUR_MWH = 80.0

# Posture vocabulary (mirrors energy_signal.py so the aggregator can fuse).
WINDOW_CHEAP = "cheap"
WINDOW_NORMAL = "normal"
SOURCE_GRID = "grid"
SOURCE_NEGATIVE_PRICE = "negative-price"
SOURCE_CURTAILED = "curtailed-renewable"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class AwattarPrice:
    """One aWATTar market-data slot mapped to a power posture.

    price_eur_mwh : the published spot price (EUR/MWh). MEASURED when measured.
    price_signal  : EUR/kWh proxy (price_eur_mwh / 1000) for the aggregator.
    window        : "cheap" | "normal" scheduling gate.
    source        : "negative-price" | "curtailed-renewable" | "grid".
    start_ts/end_ts: ISO-8601 slot bounds (from the feed), or "" for sample.
    measured      : True => real published price; False => SAMPLE/ESTIMATE.
    ts            : ISO-8601 UTC time of this reading.
    provider/note : provenance + honesty note.
    """

    price_eur_mwh: float
    price_signal: float
    window: str
    source: str
    start_ts: str
    end_ts: str
    measured: bool
    ts: str
    provider: str = "awattar"
    note: str = ""

    def as_dict(self) -> dict:
        d = asdict(self)
        d["estimate_label"] = "MEASURED" if self.measured else "SAMPLE/ESTIMATE"
        return d


def classify_price(price_eur_mwh: float) -> tuple[str, str]:
    """Map a EUR/MWh price to (window, source) per the documented thresholds."""
    if price_eur_mwh < 0:
        # Negative price: surplus so large the market pays consumers to absorb.
        return WINDOW_CHEAP, SOURCE_NEGATIVE_PRICE
    if price_eur_mwh < CHEAP_THRESHOLD_EUR_MWH:
        # Very low but non-negative: cheap renewable-heavy hour.
        return WINDOW_CHEAP, SOURCE_CURTAILED
    return WINDOW_NORMAL, SOURCE_GRID


def parse_awattar_marketdata(payload: dict,
                             pick: str = "first") -> AwattarPrice:
    """Parse aWATTar `/v1/marketdata` JSON into an AwattarPrice (MEASURED).

    Shape: {"object":"list","data":[{"start_timestamp":<ms>,"end_timestamp":<ms>,
    "marketprice":<EUR/MWh float>,"unit":"Eur/MWh"}, ...]}. `pick` selects the
    "first" slot (current hour) or "min" (cheapest upcoming slot). Raises
    ValueError on a malformed payload so the caller can fall back to SAMPLE.
    """
    if not isinstance(payload, dict):
        raise ValueError("aWATTar payload is not a JSON object")
    data = payload.get("data")
    if not isinstance(data, list) or not data:
        raise ValueError("aWATTar payload has no non-empty 'data' list")

    def _slot_price(slot: dict) -> float:
        if "marketprice" not in slot:
            raise ValueError("aWATTar slot missing 'marketprice'")
        return float(slot["marketprice"])

    if pick == "min":
        slot = min(data, key=_slot_price)
    else:
        slot = data[0]

    price = _slot_price(slot)
    window, source = classify_price(price)

    def _iso_from_ms(ms) -> str:
        if ms is None:
            return ""
        return datetime.fromtimestamp(float(ms) / 1000.0,
                                      tz=timezone.utc).isoformat()

    return AwattarPrice(
        price_eur_mwh=price,
        price_signal=price / _MWH_TO_KWH,
        window=window,
        source=source,
        start_ts=_iso_from_ms(slot.get("start_timestamp")),
        end_ts=_iso_from_ms(slot.get("end_timestamp")),
        measured=True,
        ts=_now_iso(),
        provider="awattar",
        note=("REAL aWATTar published spot price (EUR/MWh), no key. "
              "Negative => grid pays you (surplus renewables NOW)."),
    )


def _sample_price(reason: str) -> AwattarPrice:
    """Honest SAMPLE fallback when no live price is available."""
    window, source = classify_price(SAMPLE_PRICE_EUR_MWH)
    return AwattarPrice(
        price_eur_mwh=SAMPLE_PRICE_EUR_MWH,
        price_signal=SAMPLE_PRICE_EUR_MWH / _MWH_TO_KWH,
        window=window,
        source=source,
        start_ts="",
        end_ts="",
        measured=False,
        ts=_now_iso(),
        provider="awattar",
        note=("SAMPLE/ESTIMATE — " + reason + ". Not a live price; never "
              "presented as a measured negative-price/curtailment claim."),
    )


def fetch_awattar(url: str = AWATTAR_DE,
                  timeout_s: float = 4.0,
                  pick: str = "first") -> AwattarPrice:
    """Fetch the LIVE aWATTar price; honest SAMPLE fallback on any error.

    Never raises. No key/header required (public endpoint). An override URL may
    be supplied via env AWATTAR_URL (e.g. to switch DE<->AT); never a key.
    """
    url = (os.environ.get("AWATTAR_URL") or url).strip()
    try:
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:  # noqa: S310 (https only, public)
            if getattr(resp, "status", 200) != 200:
                return _sample_price(f"aWATTar HTTP {resp.status}")
            payload = json.loads(resp.read().decode("utf-8"))
    except (urllib.error.URLError, OSError, ValueError, json.JSONDecodeError) as exc:
        return _sample_price(f"aWATTar fetch failed: {exc}")
    try:
        return parse_awattar_marketdata(payload, pick=pick)
    except ValueError as exc:
        return _sample_price(f"aWATTar payload unparseable: {exc}")


# ---------------------------------------------------------------------------
# Self-test — no network. `python3 awattar_provider.py`.
# ---------------------------------------------------------------------------
def _selftest() -> dict:
    out: dict = {"checks": []}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    # Captured-shape sample marketdata (mirrors api.awattar.de/v1/marketdata).
    sample = {
        "object": "list",
        "data": [
            {"start_timestamp": 1749790800000, "end_timestamp": 1749794400000,
             "marketprice": 42.51, "unit": "Eur/MWh"},
            {"start_timestamp": 1749794400000, "end_timestamp": 1749798000000,
             "marketprice": -8.30, "unit": "Eur/MWh"},
            {"start_timestamp": 1749798000000, "end_timestamp": 1749801600000,
             "marketprice": 12.00, "unit": "Eur/MWh"},
        ],
    }

    # First slot = 42.51 EUR/MWh => normal/grid, MEASURED.
    p0 = parse_awattar_marketdata(sample, pick="first")
    check("first_price_parsed", abs(p0.price_eur_mwh - 42.51) < 1e-6)
    check("first_price_signal_kwh", abs(p0.price_signal - 0.04251) < 1e-6)
    check("first_window_normal", p0.window == WINDOW_NORMAL)
    check("first_source_grid", p0.source == SOURCE_GRID)
    check("first_is_measured", p0.measured is True)
    check("first_has_slot_bounds", p0.start_ts != "" and p0.end_ts != "")

    # Min slot = -8.30 EUR/MWh => cheap/negative-price.
    pmin = parse_awattar_marketdata(sample, pick="min")
    check("min_price_negative", pmin.price_eur_mwh < 0)
    check("min_window_cheap", pmin.window == WINDOW_CHEAP)
    check("min_source_negative_price", pmin.source == SOURCE_NEGATIVE_PRICE)
    check("min_is_measured", pmin.measured is True)

    # classify_price thresholds.
    check("classify_negative", classify_price(-1.0) == (WINDOW_CHEAP, SOURCE_NEGATIVE_PRICE))
    check("classify_cheap", classify_price(10.0) == (WINDOW_CHEAP, SOURCE_CURTAILED))
    check("classify_normal", classify_price(99.0) == (WINDOW_NORMAL, SOURCE_GRID))
    check("classify_boundary_normal",
          classify_price(CHEAP_THRESHOLD_EUR_MWH) == (WINDOW_NORMAL, SOURCE_GRID))

    # Malformed payloads raise (so fetch can fall back).
    for bad in (None, {}, {"data": []}, {"data": [{}]}, {"data": "x"}, []):
        raised = False
        try:
            parse_awattar_marketdata(bad)  # type: ignore[arg-type]
        except (ValueError, TypeError):
            raised = True
        check(f"bad_payload_raises[{type(bad).__name__}]", raised)

    # SAMPLE fallback is honest.
    s = _sample_price("offline test")
    check("sample_not_measured", s.measured is False)
    check("sample_label", s.as_dict()["estimate_label"] == "SAMPLE/ESTIMATE")
    check("sample_never_claims_negative", s.source != SOURCE_NEGATIVE_PRICE)

    out["ok"] = True
    return out


def main() -> int:
    # Try live (will SAMPLE-fall-back off-box; that is honest + expected here).
    live = fetch_awattar()
    print("[awattar_provider] aWATTar price posture:")
    print(json.dumps(live.as_dict(), indent=2))
    result = _selftest()
    print("[awattar_provider] self-test:", json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
