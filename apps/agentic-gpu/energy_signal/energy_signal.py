#!/usr/bin/env python3
"""Energy-source signal feed for SZL's agentic-GPU scheduler.

Tells the scheduler WHEN power is cheap / free / wasted, so heavy or proactive
work (batch inference, model pulls, RAG re-index) runs in those windows and
stays idle when power is dear.

DOCTRINE (v11/v12 — non-negotiable, see energy_engine/shared/*):
  - NO free-energy / perpetual-motion claims. We harvest WASTED energy and we
    schedule against an HONEST signal of when that waste is available.
  - Every price / joule figure here is a SAMPLE / ESTIMATE and is LABELLED as
    such (`sample=True`). It is NOT a meter reading.
  - We only claim a stranded source ("curtailed-renewable", "negative-price")
    when a REAL signal verifies it. The off-peak provider claims ONLY "off-peak"
    (a clock fact, locally verifiable). The wholesale provider is a STUB that
    returns sample=True and source="grid" until a real API key is wired — it
    NEVER fabricates a curtailment / negative-price claim.
  - open-weight only; never commit a key (keys come from the env / secret store).

Self-contained: providers (a) off-peak time-window works with ZERO external
deps right now. Provider (b) is a documented stub for a real wholesale /
negative-price API. Run `python3 energy_signal.py` for a self-test.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Optional

# Posture vocabulary — kept as plain string constants (no external enum dep) so
# the shape is trivially JSON-serialisable and stable across the receipt wire.
WINDOW_CHEAP = "cheap"
WINDOW_NORMAL = "normal"
WINDOW_DEAR = "dear"
WINDOWS = (WINDOW_CHEAP, WINDOW_NORMAL, WINDOW_DEAR)

# Energy sources we may attribute power to. Per STRANDED_ENERGY spec, only the
# clock-verifiable "off-peak" and the honest default "grid" are emitted by the
# zero-dep providers; the stranded sources require a real verifying signal.
SOURCE_GRID = "grid"
SOURCE_CURTAILED = "curtailed-renewable"
SOURCE_NEGATIVE_PRICE = "negative-price"
SOURCE_OFF_PEAK = "off-peak"
SOURCE_SOLAR = "solar"
SOURCE_AMBIENT = "ambient"
SOURCES = (
    SOURCE_GRID,
    SOURCE_CURTAILED,
    SOURCE_NEGATIVE_PRICE,
    SOURCE_OFF_PEAK,
    SOURCE_SOLAR,
    SOURCE_AMBIENT,
)


@dataclass
class PowerPosture:
    """Current power posture the scheduler reads.

    Fields:
      window       : "cheap" | "normal" | "dear" — the scheduling gate.
      source       : which energy source this posture attributes power to.
      price_signal : SAMPLE price proxy (e.g. ~$/kWh). Negative => they pay you.
                     ALWAYS a sample/estimate unless `sample` is False.
      ts           : ISO-8601 UTC timestamp of the reading.
      sample       : True => figures are SAMPLE/ESTIMATE, not a meter/real feed.
                     The doctrine floor: we never present a sample as real.
      provider     : name of the provider that produced this posture.
      note         : honesty note (what is real vs estimated here).
    """

    window: str
    source: str
    price_signal: float
    ts: str
    sample: bool = True
    provider: str = "unknown"
    note: str = ""

    def as_dict(self) -> dict:
        d = asdict(self)
        # Surface the doctrine label explicitly in the serialised form so any
        # downstream consumer (receipt, dashboard) cannot miss it.
        d["estimate_label"] = "SAMPLE/ESTIMATE" if self.sample else "MEASURED"
        return d


def _now_iso(ts: Optional[datetime] = None) -> str:
    t = ts or datetime.now(timezone.utc)
    return t.astimezone(timezone.utc).isoformat()


# ---------------------------------------------------------------------------
# Provider base
# ---------------------------------------------------------------------------
class EnergyProvider:
    """Pluggable provider interface. `posture()` returns a PowerPosture."""

    name = "base"

    def posture(self, now: Optional[datetime] = None) -> PowerPosture:
        raise NotImplementedError


# ---------------------------------------------------------------------------
# Provider (a) — OFF-PEAK time window. Zero external deps, works NOW.
# ---------------------------------------------------------------------------
class OffPeakProvider(EnergyProvider):
    """Off-peak time-window provider — REAL signal, zero dependencies.

    Per STRANDED_ENERGY spec, wind oversupply at off-peak hours
    (00:00-08:00 and 20:00-24:00 local) is when spot prices fall / go negative.
    This provider claims ONLY the clock fact ("off-peak") — which is locally
    verifiable and NOT an overclaim. It does NOT assert curtailment or a
    negative price (that needs a real wholesale feed; see WholesaleStubProvider).

    The price_signal is an explicit SAMPLE proxy (off-peak cheaper than peak),
    labelled `sample=True`. The WINDOW is honest; the PRICE is an estimate.
    """

    name = "off_peak_time_window"

    # Inclusive-start, exclusive-end local-hour ranges considered cheap.
    OFF_PEAK_RANGES = ((0, 8), (20, 24))

    # SAMPLE price proxies (~$/kWh) — clearly estimates, not a meter reading.
    SAMPLE_PRICE_CHEAP = 0.04
    SAMPLE_PRICE_NORMAL = 0.12

    def __init__(self, off_peak_ranges=None):
        if off_peak_ranges is not None:
            self.OFF_PEAK_RANGES = tuple(off_peak_ranges)

    @classmethod
    def is_off_peak(cls, hour: int) -> bool:
        """True iff `hour` (0-23, local) falls in an off-peak range."""
        return any(start <= hour < end for start, end in cls.OFF_PEAK_RANGES)

    def posture(self, now: Optional[datetime] = None) -> PowerPosture:
        t = now or datetime.now()
        hour = t.hour
        off_peak = self.is_off_peak(hour)
        if off_peak:
            return PowerPosture(
                window=WINDOW_CHEAP,
                source=SOURCE_OFF_PEAK,
                price_signal=self.SAMPLE_PRICE_CHEAP,
                ts=_now_iso(t if t.tzinfo else None),
                sample=True,
                provider=self.name,
                note=("Off-peak clock window (REAL, locally verifiable). "
                      "price_signal is a SAMPLE proxy, not a meter reading. "
                      "Does NOT claim curtailment/negative-price."),
            )
        return PowerPosture(
            window=WINDOW_NORMAL,
            source=SOURCE_GRID,
            price_signal=self.SAMPLE_PRICE_NORMAL,
            ts=_now_iso(t if t.tzinfo else None),
            sample=True,
            provider=self.name,
            note=("On-peak / mid hours. Default to grid + normal. "
                  "price_signal is a SAMPLE proxy."),
        )


# ---------------------------------------------------------------------------
# Provider (b) — WHOLESALE / NEGATIVE-PRICE API stub (documented, honest SAMPLE)
# ---------------------------------------------------------------------------
class WholesaleStubProvider(EnergyProvider):
    """STUB for a real grid wholesale / negative-price signal. SAMPLE until keyed.

    REAL CANDIDATE APIs (document one, wire when a key exists; key from env /
    secret store, NEVER committed):
      - GridStatus.io API (US ISOs: CAISO, ERCOT, MISO, PJM, SPP) — real-time
        LMP / fuel mix; curtailment + negative-price visible in LMP.
        https://www.gridstatus.io/api   (env: GRIDSTATUS_API_KEY)
      - ENTSO-E Transparency Platform (EU day-ahead prices, incl. negative).
        https://transparency.entsoe.eu/  (env: ENTSOE_API_TOKEN)
      - CAISO OASIS (free, California LMP / curtailment reports).
        http://oasis.caiso.com/oasisapi/
      - Awattar / Tibber (consumer-facing hourly/negative spot, EU).

    HONESTY CONTRACT: with NO key configured, this stub returns
    window="normal", source="grid", sample=True and a note saying it is NOT
    live. It NEVER fabricates a "curtailed-renewable" or "negative-price"
    claim — per doctrine, those are emitted only when a real feed verifies them.
    When a key IS present we still mark sample=True here because no live HTTP
    call is implemented in this module yet (that lands with the keyed client).
    """

    name = "wholesale_negative_price_stub"

    # The env var a real client would read. Presence does NOT mean "live" here.
    API_KEY_ENV = "GRIDSTATUS_API_KEY"
    CANDIDATE_API = "https://www.gridstatus.io/api"

    def __init__(self, api_key_env: Optional[str] = None):
        if api_key_env:
            self.API_KEY_ENV = api_key_env

    def _has_key(self) -> bool:
        return bool((os.environ.get(self.API_KEY_ENV) or "").strip())

    def posture(self, now: Optional[datetime] = None) -> PowerPosture:
        t = now or datetime.now(timezone.utc)
        keyed = self._has_key()
        note = (
            "STUB — no live wholesale call implemented yet. "
            f"Candidate API: {self.CANDIDATE_API} (key env {self.API_KEY_ENV}). "
        )
        if keyed:
            note += ("Key detected but live fetch not wired; returning honest "
                     "grid/normal SAMPLE. Do NOT treat as a curtailment signal.")
        else:
            note += ("No key configured; returning honest grid/normal SAMPLE. "
                     "Never claims curtailed/negative-price without a real feed.")
        # Always honest default: never assert a stranded source from a stub.
        return PowerPosture(
            window=WINDOW_NORMAL,
            source=SOURCE_GRID,
            price_signal=0.10,
            ts=_now_iso(t),
            sample=True,
            provider=self.name,
            note=note,
        )


# ---------------------------------------------------------------------------
# Aggregator — choose the best (cheapest) honest posture across providers.
# ---------------------------------------------------------------------------
_WINDOW_RANK = {WINDOW_CHEAP: 0, WINDOW_NORMAL: 1, WINDOW_DEAR: 2}


def current_posture(providers=None, now: Optional[datetime] = None) -> PowerPosture:
    """Return the most favourable HONEST posture across the given providers.

    Default providers: [OffPeakProvider, WholesaleStubProvider]. We prefer the
    cheapest window; ties broken by lower price_signal. The off-peak provider
    (real clock signal) therefore wins during off-peak hours, while the stub
    can only ever offer "normal" — so it never spuriously upgrades the posture.
    """
    if providers is None:
        providers = [OffPeakProvider(), WholesaleStubProvider()]
    postures = [p.posture(now=now) for p in providers]
    postures.sort(key=lambda p: (_WINDOW_RANK.get(p.window, 9), p.price_signal))
    return postures[0]


# ---------------------------------------------------------------------------
# Provenance helper — fields to attach to the energy-budget receipt (Dev B).
# ---------------------------------------------------------------------------
def energy_provenance(posture: Optional[PowerPosture] = None,
                      joules_est: Optional[float] = None,
                      now: Optional[datetime] = None) -> dict:
    """Build the energy-provenance block for the energy-budget receipt.

    Coordinates with Dev B's receipt shape: emits `energy_source`, `window`,
    `price_signal`, `ts`, and an explicit `joules_est` (SAMPLE). All energy
    figures are labelled estimates per doctrine. Pass a `posture` to reuse one
    already computed for the scheduling decision; otherwise computes current.

    The returned dict is intended to be merged into the receipt alongside
    Dev B's {bytes, shannon_bits, bekenstein_bound} fields.
    """
    p = posture or current_posture(now=now)
    return {
        "energy_source": p.source,
        "window": p.window,
        "price_signal": p.price_signal,
        "joules_est": joules_est,            # SAMPLE/ESTIMATE — None until a meter
        "joules_est_label": "SAMPLE/ESTIMATE",
        "price_signal_label": "SAMPLE/ESTIMATE" if p.sample else "MEASURED",
        "signal_provider": p.provider,
        "ts": p.ts,
        "honest_note": p.note,
    }


# ---------------------------------------------------------------------------
# Self-test (no external deps, no network). `python3 energy_signal.py`.
# ---------------------------------------------------------------------------
def _selftest() -> dict:
    out = {"checks": []}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    op = OffPeakProvider()

    # Off-peak hour logic: 0-7 and 20-23 cheap; 8-19 not.
    check("hour_2_off_peak", op.is_off_peak(2))
    check("hour_5_off_peak", op.is_off_peak(5))
    check("hour_22_off_peak", op.is_off_peak(22))
    check("hour_8_not_off_peak", not op.is_off_peak(8))
    check("hour_12_not_off_peak", not op.is_off_peak(12))
    check("hour_19_not_off_peak", not op.is_off_peak(19))
    check("hour_20_off_peak", op.is_off_peak(20))

    # Posture at a known off-peak time => cheap / off-peak, labelled sample.
    cheap_t = datetime(2026, 6, 13, 3, 0, 0)
    pc = op.posture(now=cheap_t)
    check("offpeak_posture_cheap", pc.window == WINDOW_CHEAP)
    check("offpeak_posture_source", pc.source == SOURCE_OFF_PEAK)
    check("offpeak_posture_is_sample", pc.sample is True)

    # Posture at a known on-peak time => normal / grid.
    peak_t = datetime(2026, 6, 13, 14, 0, 0)
    pn = op.posture(now=peak_t)
    check("onpeak_posture_normal", pn.window == WINDOW_NORMAL)
    check("onpeak_posture_grid", pn.source == SOURCE_GRID)

    # Wholesale stub: NEVER claims a stranded source without a key/live feed.
    stub = WholesaleStubProvider()
    ps = stub.posture(now=peak_t)
    check("stub_is_sample", ps.sample is True)
    check("stub_never_claims_curtailed", ps.source == SOURCE_GRID)
    check("stub_never_negative_price", ps.source != SOURCE_NEGATIVE_PRICE)

    # Aggregator prefers the cheap off-peak posture during off-peak hours.
    agg_cheap = current_posture(now=cheap_t)
    check("aggregator_picks_cheap_offpeak", agg_cheap.window == WINDOW_CHEAP)
    agg_peak = current_posture(now=peak_t)
    check("aggregator_normal_onpeak", agg_peak.window == WINDOW_NORMAL)

    # Provenance helper shape (coordinates with Dev B receipt).
    prov = energy_provenance(posture=agg_cheap, joules_est=None)
    for k in ("energy_source", "window", "price_signal", "joules_est",
              "joules_est_label", "signal_provider", "ts", "honest_note"):
        check(f"provenance_has_{k}", k in prov)
    check("provenance_joules_labelled_sample",
          prov["joules_est_label"] == "SAMPLE/ESTIMATE")

    out["ok"] = True
    return out


def main() -> int:
    posture = current_posture()
    print("[energy_signal] current power posture:")
    print(json.dumps(posture.as_dict(), indent=2))
    print("[energy_signal] receipt provenance block (for Dev B's receipt):")
    print(json.dumps(energy_provenance(posture=posture), indent=2))
    result = _selftest()
    print("[energy_signal] self-test:", json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
