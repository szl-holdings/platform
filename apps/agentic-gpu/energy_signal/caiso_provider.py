#!/usr/bin/env python3
"""CAISO OASIS provider — REAL 5-minute nodal LMP, public (no key).

CAISO's OASIS API publishes 5-minute real-time nodal Locational Marginal Prices
($/MWh) at a public endpoint (no key). When LMP falls below ~$2/MWh (and
especially when negative), California is curtailing renewables RIGHT NOW — the
"wasted energy" surplus window the scheduler wants.

    http://oasis.caiso.com/oasisapi/SingleZip?queryname=PRC_INTVL_LMP&...

OASIS returns a zipped CSV/XML. Rather than couple the parser to OASIS's exact
(brittle, zip-wrapped) wire format, this module parses an already-extracted
list of {node, lmp} rows — the shape a thin OASIS client (or a GridStatus.io
fetch) hands us. The pure parser keeps the self-test offline and deterministic;
the live fetch is documented and degrades honestly to SAMPLE on any failure.

DOCTRINE (v11/v12):
  - A real LMP row => `measured=True`, source `curtailed-renewable` /
    `negative-price` per the documented threshold; the price is real.
  - No live row / fetch fails => honest SAMPLE (`measured=False`, `grid`/
    `normal`). NEVER fabricate a curtailment claim from a failed fetch.
  - public endpoint, no key; open-weight; source claims match the signal.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional

# Documented public OASIS endpoint (5-min real-time interval LMP).
CAISO_OASIS_BASE = "http://oasis.caiso.com/oasisapi/SingleZip"
CAISO_QUERYNAME = "PRC_INTVL_LMP"

# $/MWh. arXiv 2405.18526: LMP < ~$1.6 => ~50% curtailment likely. We use $2 as
# the documented curtailed threshold; < 0 => negative-price (paid to consume).
CURTAILED_THRESHOLD_USD_MWH = 2.0

# SAMPLE fallback (clearly labelled) used when no live LMP is available.
SAMPLE_LMP_USD_MWH = 35.0

WINDOW_CHEAP = "cheap"
WINDOW_NORMAL = "normal"
SOURCE_GRID = "grid"
SOURCE_NEGATIVE_PRICE = "negative-price"
SOURCE_CURTAILED = "curtailed-renewable"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class CaisoLmp:
    """One CAISO nodal LMP mapped to a power posture.

    node          : the pricing node (PNODE) id.
    lmp_usd_mwh   : real-time LMP in $/MWh. MEASURED when measured=True.
    price_signal  : $/kWh proxy (lmp / 1000) for the aggregator.
    window/source : scheduling gate + attributed source.
    interval_ts   : ISO-8601 interval start from the feed (or "" for sample).
    measured/ts/provider/note : provenance + honesty.
    """

    node: str
    lmp_usd_mwh: float
    price_signal: float
    window: str
    source: str
    interval_ts: str
    measured: bool
    ts: str
    provider: str = "caiso_oasis"
    note: str = ""

    def as_dict(self) -> dict:
        d = asdict(self)
        d["estimate_label"] = "MEASURED" if self.measured else "SAMPLE/ESTIMATE"
        return d


def classify_lmp(lmp_usd_mwh: float) -> tuple[str, str]:
    """Map a $/MWh LMP to (window, source) per the documented threshold."""
    if lmp_usd_mwh < 0:
        return WINDOW_CHEAP, SOURCE_NEGATIVE_PRICE
    if lmp_usd_mwh < CURTAILED_THRESHOLD_USD_MWH:
        return WINDOW_CHEAP, SOURCE_CURTAILED
    return WINDOW_NORMAL, SOURCE_GRID


def parse_caiso_lmp_rows(rows: list, pick: str = "min") -> CaisoLmp:
    """Parse extracted CAISO LMP rows into a CaisoLmp (MEASURED).

    `rows` is a list of dicts with at least `lmp` (or `LMP`/`value`) and
    optionally `node`/`pnode`/`interval`. `pick="min"` selects the cheapest
    node (the surplus pocket); `pick="first"` takes the first row. Raises
    ValueError on a malformed/empty list so the caller can fall back to SAMPLE.
    """
    if not isinstance(rows, list) or not rows:
        raise ValueError("CAISO rows is not a non-empty list")

    def _lmp_of(row: dict) -> float:
        for k in ("lmp", "LMP", "value", "MW"):
            if k in row:
                return float(row[k])
        raise ValueError(f"CAISO row missing lmp field: {row!r}")

    if pick == "first":
        row = rows[0]
    else:
        row = min(rows, key=_lmp_of)

    lmp = _lmp_of(row)
    window, source = classify_lmp(lmp)
    node = str(row.get("node") or row.get("pnode") or row.get("NODE") or "UNKNOWN")
    interval = str(row.get("interval") or row.get("interval_start") or "")
    return CaisoLmp(
        node=node,
        lmp_usd_mwh=lmp,
        price_signal=lmp / 1000.0,
        window=window,
        source=source,
        interval_ts=interval,
        measured=True,
        ts=_now_iso(),
        provider="caiso_oasis",
        note=("REAL CAISO OASIS 5-min nodal LMP ($/MWh), public/no key. "
              f"LMP < ${CURTAILED_THRESHOLD_USD_MWH:g} => curtailment likely."),
    )


def _sample_lmp(reason: str) -> CaisoLmp:
    """Honest SAMPLE fallback when no live LMP is available."""
    window, source = classify_lmp(SAMPLE_LMP_USD_MWH)
    return CaisoLmp(
        node="SAMPLE",
        lmp_usd_mwh=SAMPLE_LMP_USD_MWH,
        price_signal=SAMPLE_LMP_USD_MWH / 1000.0,
        window=window,
        source=source,
        interval_ts="",
        measured=False,
        ts=_now_iso(),
        provider="caiso_oasis",
        note=("SAMPLE/ESTIMATE — " + reason + ". Not a live LMP; never "
              "presented as a measured curtailment/negative-price claim."),
    )


def fetch_caiso(rows: Optional[list] = None,
                url: str = CAISO_OASIS_BASE,
                timeout_s: float = 5.0,
                pick: str = "min") -> CaisoLmp:
    """Return a CAISO posture. Honest SAMPLE fallback on any failure.

    If `rows` is provided (already extracted by a thin OASIS/GridStatus client),
    parse them directly. Otherwise this is the documented live path: a direct
    OASIS fetch returns a ZIP that needs unzip+CSV/XML parsing, which a thin
    client owns; absent that client we degrade honestly to SAMPLE rather than
    pretend. Never raises. No key. URL override via env CAISO_OASIS_URL.
    """
    if rows is not None:
        try:
            return parse_caiso_lmp_rows(rows, pick=pick)
        except (ValueError, TypeError) as exc:
            return _sample_lmp(f"provided CAISO rows unparseable: {exc}")

    # Live path: probe reachability honestly. We do NOT ship a zip/CSV parser
    # here (that is the thin OASIS client's job); reaching the endpoint without
    # a parser still yields no measured number, so we return SAMPLE labelled.
    url = (os.environ.get("CAISO_OASIS_URL") or url).strip()
    try:
        req = urllib.request.Request(
            f"{url}?queryname={CAISO_QUERYNAME}",
            headers={"Accept": "*/*"})
        with urllib.request.urlopen(req, timeout=timeout_s) as resp:  # noqa: S310 (public)
            _ = getattr(resp, "status", 200)
    except (urllib.error.URLError, OSError) as exc:
        return _sample_lmp(f"CAISO OASIS unreachable: {exc}")
    return _sample_lmp(
        "CAISO OASIS reachable but zip/CSV extraction is the thin-client's job; "
        "pass extracted rows= to get a MEASURED LMP")


# ---------------------------------------------------------------------------
# Self-test — no network. `python3 caiso_provider.py`.
# ---------------------------------------------------------------------------
def _selftest() -> dict:
    out: dict = {"checks": []}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    # Extracted-row sample (the shape a thin OASIS/GridStatus client hands us).
    rows = [
        {"node": "SP15", "lmp": 28.40, "interval": "2026-06-13T18:00-00:00"},
        {"node": "NP15", "lmp": 1.10, "interval": "2026-06-13T18:00-00:00"},
        {"node": "ZP26", "lmp": -3.75, "interval": "2026-06-13T18:00-00:00"},
    ]

    # min => ZP26 at -3.75 => cheap/negative-price, MEASURED.
    c = parse_caiso_lmp_rows(rows, pick="min")
    check("min_node_zp26", c.node == "ZP26")
    check("min_lmp_negative", c.lmp_usd_mwh < 0)
    check("min_window_cheap", c.window == WINDOW_CHEAP)
    check("min_source_negative", c.source == SOURCE_NEGATIVE_PRICE)
    check("min_is_measured", c.measured is True)
    check("min_price_signal_kwh", abs(c.price_signal - (-0.00375)) < 1e-9)
    check("min_has_interval", c.interval_ts != "")

    # first => SP15 at 28.40 => normal/grid.
    cf = parse_caiso_lmp_rows(rows, pick="first")
    check("first_node_sp15", cf.node == "SP15")
    check("first_window_normal", cf.window == WINDOW_NORMAL)
    check("first_source_grid", cf.source == SOURCE_GRID)

    # NP15 at 1.10 (< $2) => curtailed.
    one = parse_caiso_lmp_rows([{"node": "NP15", "lmp": 1.10}], pick="first")
    check("curtailed_below_threshold", one.source == SOURCE_CURTAILED)
    check("curtailed_window_cheap", one.window == WINDOW_CHEAP)

    # classify thresholds.
    check("classify_negative", classify_lmp(-1.0) == (WINDOW_CHEAP, SOURCE_NEGATIVE_PRICE))
    check("classify_curtailed", classify_lmp(1.5) == (WINDOW_CHEAP, SOURCE_CURTAILED))
    check("classify_normal", classify_lmp(50.0) == (WINDOW_NORMAL, SOURCE_GRID))
    check("classify_boundary_normal",
          classify_lmp(CURTAILED_THRESHOLD_USD_MWH) == (WINDOW_NORMAL, SOURCE_GRID))

    # Alternate field key + missing-field cases.
    check("alt_field_LMP", parse_caiso_lmp_rows([{"LMP": 5.0}]).lmp_usd_mwh == 5.0)
    for bad in (None, [], [{}], [{"node": "x"}], "rows"):
        raised = False
        try:
            parse_caiso_lmp_rows(bad)  # type: ignore[arg-type]
        except (ValueError, TypeError):
            raised = True
        check(f"bad_rows_raises[{type(bad).__name__}]", raised)

    # SAMPLE fallback honest.
    s = _sample_lmp("offline test")
    check("sample_not_measured", s.measured is False)
    check("sample_label", s.as_dict()["estimate_label"] == "SAMPLE/ESTIMATE")
    check("sample_never_claims_curtailed", s.source != SOURCE_CURTAILED)

    # fetch_caiso with rows= parses; bad rows= falls back to SAMPLE (no raise).
    check("fetch_with_rows_measured", fetch_caiso(rows=rows).measured is True)
    check("fetch_bad_rows_sample", fetch_caiso(rows=[{}]).measured is False)

    out["ok"] = True
    return out


def main() -> int:
    # No rows + no network => honest SAMPLE (expected off-box).
    live = fetch_caiso()
    print("[caiso_provider] CAISO LMP posture:")
    print(json.dumps(live.as_dict(), indent=2))
    result = _selftest()
    print("[caiso_provider] self-test:", json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
