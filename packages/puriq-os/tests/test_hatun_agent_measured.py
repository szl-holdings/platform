"""Hatun must take caller context through the real gate and fail closed."""

import math
import random

import pytest

from puriq_os.khipu_emit import KhipuLedger
from puriq_os.loop import LoopStatus
from puriq_os.organs import build_all
from puriq_os.organs.hatun_agent import HatunAgent

NOW = 1_700_000_000
PROVENANCE = "ab" * 32


def _world(proposals, **overrides):
    base = {
        "authorized": True,
        "tenant": "public",
        "config_proposals": proposals,
        "measurability": 1.0,
        "provenance": PROVENANCE,
        "not_before": NOW - 10,
        "expires_at": NOW + 60,
        "operation": "evaluate_proposal",
    }
    base.update(overrides)
    return base


def _agent(evaluator=None):
    return HatunAgent(KhipuLedger(), evaluator=evaluator, clock=lambda: NOW)


def _ok(proposals):
    return {
        "state": "AVAILABLE",
        "evidence": [{"node_id": f"node-{proposals}", "sha256": "c" * 64}],
    }


def test_explicit_proposals_do_not_consume_rng(monkeypatch):
    def _boom(*_args, **_kwargs):
        raise AssertionError("rng")

    monkeypatch.setattr(random, "randint", _boom)
    observed = _agent().observe(_world(2))
    assert observed["proposals"] == 2
    assert "random" not in HatunAgent.observe.__code__.co_names
    assert "randint" not in HatunAgent.observe.__code__.co_names


def test_counts_reach_evaluation_instead_of_idle():
    scores = []
    for count in (1, 2, 100):
        seen = []

        def evaluator(payload, seen=seen):
            seen.append(payload["proposals"])
            return _ok(payload["proposals"])

        agent = _agent(evaluator)
        result = agent.tick(_world(count))
        assert result.chosen == "evaluate_proposal"
        assert result.receipt is not None
        assert seen == [count]
        assert result.decision_value > 0
        scores.append(result.decision_value)
        observed = agent.observe(_world(count))
        actions = agent.candidate_actions(observed)
        action_scores, _, _ = agent.score(actions, observed)
        assert action_scores[1] > action_scores[0]
    assert scores[0] == scores[1] == scores[2]


def test_stop_provenance_and_measurability_use_the_real_gate():
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(1))
    stopped = agent.tick(_world(1, stop="STOP"))
    assert stopped.status == LoopStatus.HALTED
    assert stopped.receipt is not None
    assert "T10" in stopped.hukulla.tripped
    assert seen == []

    low = _agent(lambda payload: seen.append(payload) or _ok(1))
    refused = low.tick(_world(1, measurability=0.5))
    assert refused.chosen is None
    assert refused.decision_value == 0.0
    assert low.gate.failures
    assert seen == []

    missing = _agent(lambda payload: seen.append(payload) or _ok(1))
    unproven = missing.tick(_world(1, provenance=None))
    assert unproven.chosen is None
    assert seen == []


def test_null_health_does_not_stay_open():
    observed = _agent().observe(_world(1, governance_health=None, measurability=None))
    assert observed["governance_health"] == 0.0
    assert isinstance(observed["governance_health"], float)
    result = _agent(lambda payload: (_ for _ in ()).throw(AssertionError("backend"))).tick(
        _world(1, governance_health=1.0, measurability=None)
    )
    assert result.chosen is None
    assert result.decision_value == 0.0
    assert result.receipt is not None


def test_authorized_proposal_reaches_evaluator_and_denied_does_not():
    seen = []

    def evaluator(payload):
        seen.append(payload)
        return _ok(payload["proposals"])

    agent = _agent(evaluator)
    allowed = agent.tick(_world(2))
    assert allowed.chosen == "evaluate_proposal"
    assert allowed.receipt is not None
    assert allowed.receipt.payload["result"]["state"] == "AVAILABLE"
    assert allowed.receipt.payload["x"]["provenance"] == PROVENANCE
    assert seen[0]["measurability"] == 1.0

    denied = agent.tick(_world(2, authorized=False))
    wrong_tenant = agent.tick(_world(2, tenant="other"))
    expired = agent.tick(_world(2, expires_at=NOW))
    unsupported = agent.tick(_world(2, operation="policy_evaluate"))
    assert denied.chosen is None
    assert wrong_tenant.chosen is None
    assert expired.chosen is None
    assert unsupported.chosen is None
    assert len(seen) == 1


def test_absent_backend_has_terminal_evidence_and_no_invented_result():
    agent = _agent()
    result = agent.tick(_world(1))
    assert result.chosen == "evaluate_proposal"
    assert result.receipt is not None
    body = result.receipt.payload["result"]
    assert body["state"] == "ABSENT_BACKEND"
    assert body["backend_called"] is False
    assert body["evidence"] == []
    assert body["terminal"] is True


@pytest.mark.parametrize(
    "payload,state",
    [
        ("not-a-dict", "UNCERTAIN"),
        ({"state": "MAYBE", "evidence": []}, "UNCERTAIN"),
        ({"state": "AVAILABLE", "documents": [{"text": "private"}]}, "UNCERTAIN"),
        ({"state": "TIMEOUT"}, "TIMEOUT"),
    ],
)
def test_malformed_or_uncertain_backend_is_terminal(payload, state):
    agent = _agent(lambda _payload: payload)
    result = agent.tick(_world(1))
    assert result.receipt is not None
    body = result.receipt.payload["result"]
    assert body["state"] == state
    assert body["evidence"] == []
    assert body["terminal"] is True
    assert "private" not in str(body)


def test_execution_failure_keeps_a_receipt():
    def evaluator(_payload):
        raise RuntimeError("backend exploded")

    agent = _agent(evaluator)
    result = agent.tick(_world(4))
    assert result.receipt is not None
    assert agent.ledger.count() == 1
    assert result.receipt.payload["result"]["state"] == "EXECUTION_FAILURE"
    assert result.receipt.payload["result"]["evidence"] == []


def test_timeout_is_terminal_evidence():
    def evaluator(_payload):
        raise TimeoutError("deadline")

    result = _agent(evaluator).tick(_world(1))
    assert result.receipt is not None
    assert result.receipt.payload["result"]["state"] == "TIMEOUT"
    assert result.receipt.payload["result"]["evidence"] == []


def test_observe_exception_does_not_leave_alive_without_a_receipt():
    agent = _agent()

    def _boom(_world):
        raise RuntimeError("malformed observation")

    agent.observe = _boom
    result = agent.tick(_world(1))
    assert result.receipt is not None
    assert agent.ledger.count() == 1
    assert result.status == LoopStatus.PAUSED
    assert result.status != LoopStatus.ALIVE
    assert result.receipt.payload["terminal"] is True
    assert result.receipt.payload["evidence"] == []


def test_get_loop_constructor_has_no_external_evaluator():
    organs = build_all(KhipuLedger())
    agent = organs["Hatun"]
    assert agent._evaluator is None
    empty = agent.tick({})
    assert empty.chosen is None
    assert empty.receipt is not None
    seen = []
    # A later real adapter must not run on the empty GET-loop world.
    agent._evaluator = seen.append
    result = agent.tick({})
    assert result.chosen is None
    assert result.receipt is not None
    assert seen == []


def test_private_world_fields_are_not_evidence():
    agent = _agent(lambda _payload: _ok(1))
    result = agent.tick(_world(1, content="secret", text="hidden"))
    encoded = str(result.receipt.payload)
    assert "secret" not in encoded
    assert "hidden" not in encoded


@pytest.mark.parametrize("meas", [float("nan"), float("inf"), float("-inf")])
def test_nonfinite_measurability_is_rejected_before_admission(meas):
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(1))
    observed = agent.observe(_world(1, measurability=meas))
    assert observed["admissible"] is False
    assert observed["governance_health"] == 0.0
    assert math.isfinite(observed["governance_health"])
    result = agent.tick(_world(1, measurability=meas))
    assert result.chosen is None
    assert seen == []


@pytest.mark.parametrize(
    "overrides",
    [
        {"stop": "STOP", "measurability": None},
        {"stop": "STOP", "measurability": 0.5},
        {"stop": "STOP", "measurability": float("nan")},
        {"stop_directive": True, "authorized": False},
        {"stop": "STOP", "tenant": "other"},
        {"stop": "STOP", "expires_at": NOW},
        {"stop": "STOP", "operation": "policy_evaluate"},
    ],
)
def test_stop_stays_halted_and_a_later_valid_tick_does_not_execute(overrides):
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(1))
    stopped = agent.tick(_world(1, **overrides))
    assert stopped.status == LoopStatus.HALTED
    assert seen == []
    later = agent.tick(_world(1))
    assert later.status == LoopStatus.HALTED
    assert later.chosen is None
    assert seen == []


def test_validation_failure_after_backend_keeps_the_call_and_request_provenance():
    seen = []

    def evaluator(payload):
        seen.append(payload)
        return {"state": ["UNCERTAIN"], "evidence": [{"node_id": "leak-node", "sha256": "a" * 64}]}

    result = _agent(evaluator).tick(_world(1))
    assert seen == [{"proposals": 1, "provenance": PROVENANCE, "measurability": 1.0, "tenant": "public"}]
    assert result.status != LoopStatus.PAUSED
    assert result.receipt is not None
    body = result.receipt.payload["result"]
    assert body["backend_called"] is True
    assert body["provenance"] == PROVENANCE
    assert body["evidence"] == []
    assert body["terminal"] is True
    assert "leak-node" not in str(body)
