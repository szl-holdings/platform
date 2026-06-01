# SPDX-License-Identifier: Apache-2.0
"""HUKLLA halt-safety: a tripwire trip zeroes utility AND latches the loop to HALTED."""
from __future__ import annotations

from puriq_os.khipu_emit import KhipuLedger
from puriq_os.loop import OrganAgent, Action, LoopStatus
from puriq_os.yuyay_gate import YuyayScores
from puriq_os.hukulla_tripwires import HukullaTripwires


class _HarmOrgan(OrganAgent):
    organ = "Harm"
    cadence_seconds = 7

    def observe(self, world):
        return {"axis": 1.0}

    def candidate_actions(self, x):
        # only candidate trips T06 (external_harm)
        return [Action(name="harmful", state_changing=True,
                       yuyay=YuyayScores(), context={"external_harm": True})]

    def execute(self, action, x):
        raise AssertionError("must never execute a tripped action")


def test_tripwire_halts_loop():
    led = KhipuLedger()
    agent = _HarmOrgan(led)
    res = agent.tick()
    assert res.chosen is None
    assert agent.status == LoopStatus.HALTED, "must latch HALTED on tripwire"
    assert led.count() == 1, "halt tick still emits a receipt"


def test_halted_organ_stays_halted_and_keeps_receipting():
    led = KhipuLedger()
    agent = _HarmOrgan(led)
    agent.tick()                 # halts
    r2 = agent.tick()            # halted tick
    assert r2.status == LoopStatus.HALTED
    assert led.count() == 2, "halted ticks still emit receipts (audit trail)"


def test_irreversible_needs_two_person_gate():
    tw = HukullaTripwires()
    # irreversible + not gated -> T07 trips
    res = tw.evaluate({"irreversible": True, "two_person_gated": False})
    assert "T07" in res.tripped
    # irreversible + gated -> clears
    res2 = tw.evaluate({"irreversible": True, "two_person_gated": True})
    assert "T07" not in res2.tripped


def test_only_ten_tripwires():
    tw = HukullaTripwires()
    assert tw.active_count == 10, "T01-T10 only; no invented T11-T20"
