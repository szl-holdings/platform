# SPDX-License-Identifier: Apache-2.0
"""Phase-2 proof: a single OrganAgent runs 100 cycles, emits 100 valid Khipu receipts,
and respects the Yuyay gate (rejects actions below threshold)."""
from __future__ import annotations

import pytest

from puriq_os.khipu_emit import KhipuLedger
from puriq_os.loop import OrganAgent, Action, LoopStatus
from puriq_os.yuyay_gate import YuyayScores


class _ProbeOrgan(OrganAgent):
    organ = "Probe"
    cadence_seconds = 7

    def observe(self, world):
        return {"axis": 1.0}

    def candidate_actions(self, x):
        return [Action(name="noop"),
                Action(name="do_work", state_changing=True, yuyay=YuyayScores())]

    def execute(self, action, x):
        return {"did": action.name}


def test_100_cycles_100_receipts():
    ledger = KhipuLedger()
    agent = _ProbeOrgan(ledger)
    results = agent.run(100)
    assert len(results) == 100
    assert agent.tick_count == 100
    assert ledger.count() == 100, "exactly one receipt per tick"
    assert ledger.verify_chain() is True, "hash chain must verify (INV-3)"


def test_yuyay_gate_rejects_subthreshold():
    ledger = KhipuLedger()

    class _BadGateOrgan(OrganAgent):
        organ = "BadGate"
        cadence_seconds = 7

        def observe(self, world):
            return {"axis": 1.0}

        def candidate_actions(self, x):
            bad = YuyayScores(moral_grounding=0.5)   # sacred axis below 0.95 floor
            return [Action(name="blocked", state_changing=True, yuyay=bad)]

        def execute(self, action, x):
            raise AssertionError("must never execute a sub-threshold action")

    agent = _BadGateOrgan(ledger)
    res = agent.tick()
    assert res.chosen is None, "sub-threshold action must NOT be selected"
    assert res.decision_value == 0.0
    assert ledger.count() == 1, "no-op tick still emits a receipt"


def test_chain_persists_and_reloads(tmp_path):
    db = str(tmp_path / "ledger.sqlite")
    led1 = KhipuLedger(db_path=db)
    a1 = _ProbeOrgan(led1)
    a1.run(10)
    assert led1.count() == 10
    head = led1.head_hash()
    del led1
    # reopen the same on-disk db -> receipts persist and chain re-verifies
    led2 = KhipuLedger(db_path=db)
    assert led2.count() == 10
    assert led2.head_hash() == head
    assert led2.verify_chain() is True


def test_no_compensation_low_structural_zeroes_utility():
    ledger = KhipuLedger()
    agent = _ProbeOrgan(ledger)
    from puriq_os.yuyay_gate import YuyayGate
    g = YuyayGate()
    assert g.evaluate(YuyayScores(epistemic_humility=0.5)) == 0.0  # structural < 0.90
    assert g.evaluate(YuyayScores()) > 0.0                          # all pass
