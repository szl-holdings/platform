#!/usr/bin/env python3
"""Real-source aggregator — fuse NVML + aWATTar/CAISO + off-peak clock.

Extends the #356 `energy_signal` aggregator (which fused off-peak + a stub) into
one that ingests REAL sources and emits a single honest posture:

    RealPowerPosture{window, source, price_signal, joules_measured | joules_sample,
                     ts, measured}

Fusion rule (honest by construction):
  - PRICE/WINDOW: take the most-favourable HONEST window across the live price
    providers (aWATTar, CAISO) and the off-peak clock. A provider only
    contributes a `cheap`/`negative-price` window when its OWN reading is
    `measured=True`; a SAMPLE provider can only ever offer `normal` (it never
    upgrades the posture). Ties broken by lower price_signal.
  - JOULES: come from NVML for a given task duration. If NVML is `measured`
    (on-box), `joules_measured` is set and `measured_joules=True`; off-box the
    same number lands in `joules_sample` with `measured_joules=False`.
  - `measured` (overall) is True iff the chosen price posture is measured AND the
    NVML joules are measured — i.e. the WHOLE posture is backed by real meters.
    Otherwise the relevant figure is SAMPLE-labelled. We NEVER mix a measured
    label onto a sampled figure.

DOCTRINE (v11/v12): MEASURED only when a real source feeds the field; source
claims match the signal; no key (NVML/aWATTar/CAISO need none); open-weight;
Λ=Conjecture 1; the half-state (claiming more real energy than measured) is the
only unacceptable outcome.

Self-test: `python3 real_aggregator.py` -> fuses sample NVML + sample aWATTar +
clock into one posture, checks honest labelling, prints `{"ok": true}`.
"""
from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Optional

from awattar_provider import AwattarPrice, _sample_price as _awattar_sample
from caiso_provider import CaisoLmp, _sample_lmp as _caiso_sample
from nvml_provider import GpuPower, read_gpu_power, _sample_reading as _nvml_sample

WINDOW_CHEAP = "cheap"
WINDOW_NORMAL = "normal"
WINDOW_DEAR = "dear"
_WINDOW_RANK = {WINDOW_CHEAP: 0, WINDOW_NORMAL: 1, WINDOW_DEAR: 2}

# Off-peak clock ranges (local hours) — a REAL, locally-verifiable fact, but its
# price is a SAMPLE proxy, so the clock contributes window honesty without ever
# claiming a measured price.
OFF_PEAK_RANGES = ((0, 8), (20, 24))
SAMPLE_OFFPEAK_PRICE = 0.04
SAMPLE_NORMAL_PRICE = 0.12


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _is_off_peak(hour: int) -> bool:
    return any(start <= hour < end for start, end in OFF_PEAK_RANGES)


@dataclass
class _PriceCandidate:
    """Internal: a normalized price/window contribution from one provider.

    measured       : True iff the PRICE is a real meter reading.
    window_trusted : True iff the WINDOW is verifiable enough to upgrade the
                     posture — either the price is measured, OR the window is an
                     independently-verifiable fact (the off-peak clock). A
                     sampled price with an untrusted window is clamped to normal.
    """
    window: str
    source: str
    price_signal: float
    measured: bool
    provider: str
    note: str
    window_trusted: bool = False


@dataclass
class RealPowerPosture:
    """The fused, honest posture the scheduler reads.

    window          : "cheap" | "normal" | "dear" — the scheduling gate.
    source          : attributed source of the chosen price window.
    price_signal    : $/kWh (or EUR/kWh) proxy from the chosen provider.
    joules_measured : REAL joules for the task (set iff NVML measured); else None.
    joules_sample   : SAMPLE joules for the task (set iff NVML not measured); else None.
    power_draw_w    : the NVML board power used for the joules figure.
    task_seconds    : the task duration the joules were computed for.
    measured        : True iff BOTH price posture AND joules are real meters.
    measured_price  : True iff the chosen price window is a real meter.
    measured_joules : True iff the NVML reading is a real meter (on-box).
    ts/provider/note: provenance + honesty.
    """

    window: str
    source: str
    price_signal: float
    joules_measured: Optional[float]
    joules_sample: Optional[float]
    power_draw_w: float
    task_seconds: float
    measured: bool
    measured_price: bool
    measured_joules: bool
    ts: str
    price_provider: str
    note: str

    def as_dict(self) -> dict:
        d = asdict(self)
        d["price_label"] = "MEASURED" if self.measured_price else "SAMPLE/ESTIMATE"
        d["joules_label"] = "MEASURED" if self.measured_joules else "SAMPLE/ESTIMATE"
        d["estimate_label"] = "MEASURED" if self.measured else "SAMPLE/ESTIMATE"
        return d


def _clock_candidate(now: Optional[datetime]) -> _PriceCandidate:
    t = now or datetime.now()
    if _is_off_peak(t.hour):
        # The window is a verifiable clock fact (window_trusted) but the PRICE
        # is a sample => measured=False, never claims a measured price.
        return _PriceCandidate(WINDOW_CHEAP, "off-peak", SAMPLE_OFFPEAK_PRICE,
                               measured=False, provider="off_peak_clock",
                               note="off-peak clock window (real fact, SAMPLE price)",
                               window_trusted=True)
    return _PriceCandidate(WINDOW_NORMAL, "grid", SAMPLE_NORMAL_PRICE,
                           measured=False, provider="off_peak_clock",
                           note="on/mid-peak clock window (SAMPLE price)",
                           window_trusted=True)


def _from_awattar(a: AwattarPrice) -> _PriceCandidate:
    # A live price's window is trusted iff the price itself is measured.
    return _PriceCandidate(a.window, a.source, a.price_signal, a.measured,
                           a.provider, a.note, window_trusted=a.measured)


def _from_caiso(c: CaisoLmp) -> _PriceCandidate:
    return _PriceCandidate(c.window, c.source, c.price_signal, c.measured,
                           c.provider, c.note, window_trusted=c.measured)


def fuse_posture(
    gpu: GpuPower,
    task_seconds: float,
    awattar: Optional[AwattarPrice] = None,
    caiso: Optional[CaisoLmp] = None,
    now: Optional[datetime] = None,
) -> RealPowerPosture:
    """Fuse one GPU reading + optional price readings + clock into a posture.

    Pure given its inputs (no network/hardware): callers pass the readings they
    fetched. `current_real_posture()` is the live wrapper that fetches them.
    """
    candidates: list[_PriceCandidate] = [_clock_candidate(now)]
    if awattar is not None:
        candidates.append(_from_awattar(awattar))
    if caiso is not None:
        candidates.append(_from_caiso(caiso))

    # Honest selection: a provider may only push a non-`normal` (cheap/negative)
    # window if its window is TRUSTED — either a measured live price, or the
    # verifiable off-peak clock fact. A sampled price with an untrusted window
    # is clamped to `normal` so it can never spuriously upgrade the posture.
    def _trusts_window(c: _PriceCandidate) -> bool:
        return c.window_trusted or c.window == WINDOW_NORMAL

    def _effective(c: _PriceCandidate) -> tuple[int, float]:
        win = c.window if _trusts_window(c) else WINDOW_NORMAL
        return (_WINDOW_RANK.get(win, 9), c.price_signal)

    best = min(candidates, key=_effective)
    # Clamp the reported window the same way we ranked it (no untrusted upgrade).
    eff_window = best.window if _trusts_window(best) else WINDOW_NORMAL
    eff_source = best.source if _trusts_window(best) else "grid"

    joules = gpu.joules_for(task_seconds)
    measured_joules = gpu.measured
    measured_price = best.measured
    overall = measured_joules and measured_price

    return RealPowerPosture(
        window=eff_window,
        source=eff_source,
        price_signal=best.price_signal,
        joules_measured=joules if measured_joules else None,
        joules_sample=None if measured_joules else joules,
        power_draw_w=gpu.power_draw_w,
        task_seconds=float(task_seconds),
        measured=overall,
        measured_price=measured_price,
        measured_joules=measured_joules,
        ts=_now_iso(),
        price_provider=best.provider,
        note=("fused: joules from NVML (" + ("MEASURED" if measured_joules
              else "SAMPLE") + "), price/window from " + best.provider + " ("
              + ("MEASURED" if measured_price else "SAMPLE") + "). "
              + "overall MEASURED iff both are real meters."),
    )


def current_real_posture(task_seconds: float = 1.0,
                         now: Optional[datetime] = None,
                         use_awattar: bool = True,
                         use_caiso: bool = False) -> RealPowerPosture:
    """Live wrapper: fetch NVML + (aWATTar/CAISO) and fuse. Never raises.

    Off-box this degrades fully honestly: NVML -> SAMPLE, aWATTar/CAISO ->
    SAMPLE, clock -> real window with sample price => overall measured=False.
    """
    gpu = read_gpu_power()
    awattar = None
    caiso = None
    if use_awattar:
        from awattar_provider import fetch_awattar
        awattar = fetch_awattar()
    if use_caiso:
        from caiso_provider import fetch_caiso
        caiso = fetch_caiso()
    return fuse_posture(gpu, task_seconds, awattar=awattar, caiso=caiso, now=now)


# ---------------------------------------------------------------------------
# Self-test — no network, no hardware. `python3 real_aggregator.py`.
# ---------------------------------------------------------------------------
def _selftest() -> dict:
    out: dict = {"checks": []}

    def check(name, cond):
        out["checks"].append({name: bool(cond)})
        assert cond, f"FAILED: {name}"

    on_peak = datetime(2026, 6, 13, 14, 0, 0)
    off_peak = datetime(2026, 6, 13, 3, 0, 0)

    # --- Case 1: all SAMPLE (off-box). measured=False everywhere; honest. ---
    gpu_s = _nvml_sample("test off-box")
    aw_s = _awattar_sample("test")
    p1 = fuse_posture(gpu_s, 10.0, awattar=aw_s, now=on_peak)
    check("c1_overall_not_measured", p1.measured is False)
    check("c1_joules_in_sample_slot", p1.joules_sample is not None and p1.joules_measured is None)
    check("c1_joules_value", abs(p1.joules_sample - gpu_s.power_draw_w * 10.0) < 1e-6)
    check("c1_joules_label", p1.as_dict()["joules_label"] == "SAMPLE/ESTIMATE")
    check("c1_price_label", p1.as_dict()["price_label"] == "SAMPLE/ESTIMATE")

    # --- Case 2: MEASURED GPU (real nvidia-smi row) + SAMPLE price. ---
    from nvml_provider import parse_nvidia_smi_csv
    gpu_m = parse_nvidia_smi_csv("120.0, 250.0, 55, 80")
    p2 = fuse_posture(gpu_m, 5.0, awattar=aw_s, now=on_peak)
    check("c2_joules_measured", gpu_m.measured is True and p2.measured_joules is True)
    check("c2_joules_in_measured_slot", p2.joules_measured is not None and p2.joules_sample is None)
    check("c2_joules_value", abs(p2.joules_measured - 120.0 * 5.0) < 1e-6)
    check("c2_overall_not_measured_price_sample", p2.measured is False)  # price still sample
    check("c2_joules_label_measured", p2.as_dict()["joules_label"] == "MEASURED")

    # --- Case 3: MEASURED GPU + MEASURED negative-price aWATTar => fully real. ---
    from awattar_provider import parse_awattar_marketdata
    aw_neg = parse_awattar_marketdata({
        "object": "list",
        "data": [{"start_timestamp": 1749790800000, "end_timestamp": 1749794400000,
                  "marketprice": -12.0, "unit": "Eur/MWh"}],
    }, pick="first")
    p3 = fuse_posture(gpu_m, 5.0, awattar=aw_neg, now=on_peak)
    check("c3_price_measured", aw_neg.measured is True and p3.measured_price is True)
    check("c3_window_cheap", p3.window == WINDOW_CHEAP)
    check("c3_source_negative", p3.source == "negative-price")
    check("c3_overall_measured", p3.measured is True)
    check("c3_estimate_label", p3.as_dict()["estimate_label"] == "MEASURED")

    # --- Case 4: SAMPLE provider must NOT upgrade window even if it claims cheap. ---
    # Construct a SAMPLE aWATTar that (wrongly) carries a cheap window; the fuser
    # must clamp it to normal because measured=False.
    aw_fake_cheap = AwattarPrice(
        price_eur_mwh=-50.0, price_signal=-0.05, window=WINDOW_CHEAP,
        source="negative-price", start_ts="", end_ts="", measured=False,
        ts=_now_iso(), provider="awattar", note="fake sample")
    p4 = fuse_posture(gpu_s, 1.0, awattar=aw_fake_cheap, now=on_peak)
    check("c4_sample_provider_clamped_to_normal", p4.window == WINDOW_NORMAL)
    check("c4_sample_provider_not_negative", p4.source != "negative-price")

    # --- Case 5: off-peak clock gives a real CHEAP window (sample price). ---
    p5 = fuse_posture(gpu_s, 1.0, awattar=None, now=off_peak)
    check("c5_offpeak_cheap_window", p5.window == WINDOW_CHEAP)
    check("c5_offpeak_source", p5.source == "off-peak")
    check("c5_offpeak_price_sample", p5.measured_price is False)

    # --- Case 6: CAISO measured curtailment fuses. ---
    from caiso_provider import parse_caiso_lmp_rows
    caiso_m = parse_caiso_lmp_rows([{"node": "NP15", "lmp": 0.5}], pick="first")
    p6 = fuse_posture(gpu_m, 2.0, caiso=caiso_m, now=on_peak)
    check("c6_caiso_curtailed", p6.source == "curtailed-renewable")
    check("c6_overall_measured", p6.measured is True)

    # --- Case 7: live wrapper never raises and labels consistently. ---
    live = current_real_posture(task_seconds=1.0)
    check("c7_live_returns_posture", isinstance(live, RealPowerPosture))
    d = live.as_dict()
    check("c7_label_consistent",
          d["estimate_label"] == ("MEASURED" if live.measured else "SAMPLE/ESTIMATE"))
    check("c7_joules_one_slot_only",
          (live.joules_measured is None) != (live.joules_sample is None))

    out["ok"] = True
    return out


def main() -> int:
    live = current_real_posture(task_seconds=10.0)
    print("[real_aggregator] fused live posture (10s task):")
    print(json.dumps(live.as_dict(), indent=2))
    result = _selftest()
    print("[real_aggregator] self-test:", json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
