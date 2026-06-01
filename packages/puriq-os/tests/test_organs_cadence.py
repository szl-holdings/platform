# SPDX-License-Identifier: Apache-2.0
"""Phase-3 proof: all 12 canonical organs exist, tick at their cadence, and the
synthetic scheduler ticks each organ at its declared interval."""
from __future__ import annotations

from puriq_os.khipu_emit import KhipuLedger
from puriq_os.organs import build_all, CANONICAL_ORGANS, ORGAN_CLASSES
from puriq_os.scheduler import PuriqScheduler

EXPECTED = {
    "Amaru": 7, "Yuyay": 12, "Yawar": 12, "Hukulla": 7, "Kallpa": 49,
    "Khipu": 12, "Lambda": 49, "OTel-VSP": 7, "Kanchay": 12, "Hatun": 49,
    "Sumaq": 12, "Killinchu-bridge": 7,
}


def test_exactly_twelve_canonical_organs():
    assert len(ORGAN_CLASSES) == 12
    assert set(CANONICAL_ORGANS) == set(EXPECTED.keys())


def test_each_organ_declares_expected_cadence():
    organs = build_all()
    for name, agent in organs.items():
        assert agent.cadence_seconds == EXPECTED[name], name


def test_each_organ_ticks_and_receipts():
    led = KhipuLedger()
    organs = build_all(led)
    for agent in organs.values():
        r = agent.tick()
        assert r.tick == 1
        assert r.receipt is not None
    assert led.count() == 12, "one receipt per organ tick"
    assert led.verify_chain() is True


def test_synthetic_scheduler_respects_cadence():
    led = KhipuLedger()
    organs = build_all(led)
    sched = PuriqScheduler()
    for a in organs.values():
        sched.register(a)
    # 98s horizon: a 7s organ ticks 14x, a 12s organ 8x, a 49s organ 2x
    results = sched.run_synthetic(horizon_seconds=98.0)
    by_organ = {}
    for r in results:
        by_organ.setdefault(r.organ, 0)
        by_organ[r.organ] += 1
    assert by_organ["Amaru"] == 98 // 7      # 14
    assert by_organ["Yuyay"] == 98 // 12     # 8
    assert by_organ["Kallpa"] == 98 // 49    # 2
    # receipts == total ticks
    assert led.count() == len(results)
    assert led.verify_chain() is True
