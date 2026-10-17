"""Hatun must take caller context through the real gate and fail closed."""

import random

import pytest

from puriq_os.khipu_emit import KhipuLedger
from puriq_os.hukulla_tripwires import TripwireResult
from puriq_os.loop import Action, LoopStatus, OrganAgent, TickResult
from puriq_os.organs import build_all
from puriq_os.organs.hatun_agent import HatunAgent
from puriq_os.yuyay_gate import YuyayScores

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
        "evidence": [{
            "node_id": f"node-{proposals}",
            "source": "public-corpus",
            "sha256": "c" * 64,
            "document_revision": "d" * 40,
            "license": "CC-BY-4.0",
            "rights": "public_handles",
            "tenant": "public",
        }],
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
    assert body["backend_called"] is True
    assert result.receipt.payload["backend_called"] is True
    assert body["provenance"] == PROVENANCE
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


def test_get_world_does_not_call_the_evaluator():
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(1))
    result = agent.tick(_world(1, method="GET"))
    assert seen == []
    assert result.chosen is None
    assert result.receipt is not None


def test_replay_does_not_call_the_evaluator_twice():
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(payload["proposals"]))
    first = agent.tick(_world(1, operation_id="op-1"))
    second = agent.tick(_world(1, operation_id="op-1"))
    assert first.receipt.payload["result"]["state"] == "AVAILABLE"
    assert second.receipt.payload["result"]["replayed"] is True
    assert second.receipt.payload["result"]["backend_called"] is False
    assert second.receipt.payload["backend_called"] is False
    assert len(seen) == 1
    conflict = agent.tick(_world(2, operation_id="op-1"))
    assert conflict.receipt.payload["result"]["state"] == "DENIED"
    assert conflict.receipt.payload["result"]["reason"] == "REPLAY_CONFLICT"
    assert len(seen) == 1


def test_expired_window_is_rechecked_before_the_evaluator():
    ticks = iter((NOW, NOW + 1000))
    seen = []
    agent = HatunAgent(
        KhipuLedger(),
        evaluator=lambda payload: seen.append(payload) or _ok(1),
        clock=lambda: next(ticks),
    )
    result = agent.tick(_world(1))
    assert seen == []
    assert result.receipt is not None
    assert result.receipt.payload["result"]["state"] == "DENIED"
    assert result.receipt.payload["result"]["reason"] == "EXPIRED"
    assert result.receipt.payload["result"]["backend_called"] is False


def test_withdrawn_or_unbound_evidence_is_not_available():
    withdrawn = _ok(1)
    withdrawn["evidence"][0]["rights"] = "withdrawn"
    unbound = _ok(1)
    unbound["evidence"][0].pop("license")
    promoted = _ok(1)
    promoted["execution_authority"] = "EXECUTE"
    agent = _agent(lambda payload: withdrawn)
    first = agent.tick(_world(1, operation_id="w"))
    assert first.receipt.payload["result"]["state"] == "ABSTAIN"
    assert first.receipt.payload["result"]["reason"] == "WITHDRAWN"
    assert first.receipt.payload["result"]["evidence"] == []
    assert first.receipt.payload["result"]["backend_called"] is True
    assert first.receipt.payload["backend_called"] is True
    second = _agent(lambda payload: unbound).tick(_world(1))
    assert second.receipt.payload["result"]["reason"] == "RIGHTS_UNBOUND"
    assert second.receipt.payload["result"]["backend_called"] is True
    assert second.receipt.payload["backend_called"] is True
    third = _agent(lambda payload: promoted).tick(_world(1))
    assert third.receipt.payload["result"]["state"] == "DENIED"
    assert third.receipt.payload["result"]["reason"] == "AUTHORITY_PROMOTION"
    assert third.receipt.payload["backend_called"] is True
    assert third.receipt.payload["result"]["execution_authority"] == "NONE"
    assert "EXECUTE" not in str(third.receipt.payload["result"])


def test_private_world_fields_are_not_evidence():
    agent = _agent(lambda _payload: _ok(1))
    result = agent.tick(_world(1, content="secret", text="hidden"))
    encoded = str(result.receipt.payload)
    assert "secret" not in encoded
    assert "hidden" not in encoded


def test_timeout_then_conflicting_operation_does_not_call_again():
    seen = []

    def evaluator(payload):
        seen.append(payload)
        raise TimeoutError("deadline")

    agent = _agent(evaluator)
    first = agent.tick(_world(1, operation_id="op-t"))
    assert first.receipt.payload["result"]["state"] == "TIMEOUT"
    assert first.receipt.payload["result"]["backend_called"] is True
    assert first.receipt.payload["result"]["evidence"] == []
    conflict = agent.tick(_world(2, operation_id="op-t"))
    assert conflict.receipt.payload["result"]["state"] == "DENIED"
    assert conflict.receipt.payload["result"]["reason"] == "REPLAY_CONFLICT"
    assert conflict.receipt.payload["result"]["backend_called"] is False
    assert len(seen) == 1


def test_execution_failure_is_replay_conflict_for_a_different_proposal():
    seen = []

    def evaluator(payload):
        seen.append(payload)
        raise RuntimeError("backend exploded")

    agent = _agent(evaluator)
    first = agent.tick(_world(1, operation_id="op-f"))
    assert first.receipt.payload["result"]["state"] == "EXECUTION_FAILURE"
    conflict = agent.tick(_world(2, operation_id="op-f"))
    assert conflict.receipt.payload["result"]["reason"] == "REPLAY_CONFLICT"
    assert conflict.receipt.payload["result"]["backend_called"] is False
    assert len(seen) == 1


def test_window_expiring_during_evaluation_releases_nothing():
    ticks = iter((NOW, NOW, NOW + 1000, NOW, NOW))
    seen = []
    agent = HatunAgent(
        KhipuLedger(),
        evaluator=lambda payload: seen.append(payload) or _ok(1),
        clock=lambda: next(ticks),
    )
    result = agent.tick(_world(1, operation_id="op-e"))
    body = result.receipt.payload["result"]
    assert len(seen) == 1
    assert body["state"] == "DENIED"
    assert body["reason"] == "EXPIRED"
    assert body["evidence"] == []
    assert body["backend_called"] is True
    assert body["execution_authority"] == "NONE"
    conflict = agent.tick(_world(2, operation_id="op-e"))
    assert conflict.receipt.payload["result"]["state"] == "DENIED"
    assert conflict.receipt.payload["result"]["reason"] == "REPLAY_CONFLICT"
    assert conflict.receipt.payload["result"]["backend_called"] is False
    assert len(seen) == 1


@pytest.mark.parametrize(
    "label,first",
    [
        ("missing", {"measurability": None}),
        ("low", {"measurability": 0.5}),
        ("zero-measurement", {"measurability": 0.0}),
        ("invalid-provenance", {"provenance": "not-a-digest"}),
        ("missing-provenance", {"provenance": None}),
        ("expired", {"expires_at": NOW}),
        ("zero-proposals", {"config_proposals": 0}),
    ],
)
def test_stop_remains_terminal_across_the_measurement_matrix(label, first):
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(1))
    stopped = agent.tick(_world(1, stop="STOP", **first))
    assert label
    assert stopped.status == LoopStatus.HALTED
    assert "T10" in stopped.hukulla.tripped
    assert stopped.receipt.payload["backend_called"] is False
    assert seen == []
    followed = agent.tick(_world(1))
    assert followed.status == LoopStatus.HALTED
    assert followed.receipt.payload["backend_called"] is False
    assert followed.receipt.payload.get("result") is None
    assert seen == []


@pytest.mark.parametrize("measurement", [float("nan"), float("inf"), float("-inf")])
def test_non_finite_measurability_does_not_call_the_backend(measurement):
    """Reject NaN and both infinities before any backend call.

    The previous range comparison returned NaN. It already rejected positive
    and negative infinity because those comparisons succeed.
    """
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(1))
    result = agent.tick(_world(1, measurability=measurement))
    assert seen == []
    assert result.chosen is None
    assert result.receipt is not None
    observed = result.receipt.payload["x"]
    assert observed["admissible"] is False
    assert observed["governance_health"] == 0.0
    assert observed["measurability"] == 0.0
    assert result.receipt.payload["backend_called"] is False


def test_stop_keeps_zero_health_and_records_that_the_backend_was_not_called():
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(1))
    first = agent.tick(_world(1, stop="STOP"))
    assert first.status == LoopStatus.HALTED
    assert seen == []
    assert "T10" in first.hukulla.tripped
    assert first.receipt.payload["x"]["governance_health"] == 0.0
    assert first.receipt.payload["x"]["admissible"] is False
    assert first.receipt.payload["backend_called"] is False
    second = agent.tick(_world(1, stop="STOP"))
    assert second.status == LoopStatus.HALTED
    assert second.receipt.payload["backend_called"] is False
    assert second.receipt.payload.get("result") is None
    assert seen == []


def test_clear_action_is_not_halted_by_an_unselected_trip():
    class Probe(HatunAgent):
        def candidate_actions(self, x):
            halted = Action(
                name="halted",
                yuyay=YuyayScores(),
                khipu_factors=[0.1],
                context={"stop_directive": True},
            )
            clear = Action(
                name="clear",
                yuyay=YuyayScores(),
                khipu_factors=[1.0],
                context={"stop_directive": False},
            )
            return [halted, clear]

        def execute(self, action, x):
            return {"ok": action.name}

    result = Probe(KhipuLedger(), clock=lambda: NOW).tick(_world(1))
    assert result.status == LoopStatus.ALIVE
    assert result.chosen == "clear"


def test_hatun_operation_cache_is_not_capped_at_the_adapter_replay_limit():
    """The Second Brain adapter refuses a 33rd id. This organ cache does not."""
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(1))
    for index in range(33):
        result = agent.tick(_world(1, operation_id=f"op-{index}"))
        assert result.receipt.payload["result"]["state"] == "AVAILABLE"
        assert result.receipt.payload["result"].get("reason") != "REPLAY_CAPACITY"
    assert len(seen) == 33
    assert len(agent._replay) == 33
    stored = agent._replay["op-0"][1]
    assert stored["backend_called"] is True
    assert stored["provenance"] == PROVENANCE
    replay = agent.tick(_world(1, operation_id="op-0"))
    assert replay.receipt.payload["result"]["replayed"] is True
    assert replay.receipt.payload["result"]["backend_called"] is False
    assert replay.receipt.payload["result"]["provenance"] == PROVENANCE
    assert "op-0" in agent._replay
    assert len(agent._replay) == 33
    assert len(seen) == 33


def test_malformed_result_receipt_records_that_the_evaluator_ran():
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or "not-a-dict")
    result = agent.tick(_world(1))
    assert len(seen) == 1
    assert result.receipt.payload["result"]["backend_called"] is True
    assert result.receipt.payload["backend_called"] is True
    assert result.receipt.payload["result"]["reason"] == "MALFORMED"


def _actions(agent):
    return [row["action"] for row in agent.ledger.all_receipts()]


def _patch_emit(agent, mode):
    """Fail the first receipt once, either before its append or after it."""
    real = HatunAgent.emit_receipt
    used = {"once": False}

    def patched(self, *args, **kwargs):
        if used["once"]:
            return real(self, *args, **kwargs)
        used["once"] = True
        if mode == "none-before":
            return None
        if mode == "raise-before":
            raise RuntimeError("receipt failed before append")
        receipt = real(self, *args, **kwargs)
        if mode == "none-after":
            return None
        if mode == "raise-after":
            raise RuntimeError("receipt failed after append")
        return receipt

    agent.emit_receipt = patched.__get__(agent, HatunAgent)


def test_malformed_state_and_rights_record_the_call():
    malformed_state = {"state": ["AVAILABLE"], "evidence": []}
    malformed_rights = _ok(1)
    malformed_rights["evidence"][0]["rights"] = {"public": True}
    bad_digest = _ok(1)
    bad_digest["evidence"][0]["sha256"] = "not-a-digest"
    cases = (
        (malformed_state, "UNEXPECTED_STATE"),
        (malformed_rights, "RIGHTS_UNBOUND"),
        (bad_digest, "MALFORMED"),
    )
    for payload, reason in cases:
        seen = []
        result = _agent(lambda _payload, payload=payload, seen=seen: seen.append(1) or payload).tick(_world(1))
        assert seen == [1]
        body = result.receipt.payload["result"]
        assert body["reason"] == reason
        assert body["backend_called"] is True
        assert body["evidence"] == []
        assert result.receipt.payload["backend_called"] is True


def test_none_before_append_emits_one_replacement():
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(1))
    _patch_emit(agent, "none-before")
    result = agent.tick(_world(1, operation_id="op-none-before"))
    assert seen == [_world_call()]
    assert agent.ledger.count() == 1
    assert _actions(agent) == ["__terminal__"]
    assert result.status == LoopStatus.PAUSED
    assert result.receipt.payload["reason"] == "MISSING_RECEIPT"
    assert result.receipt.payload["backend_called"] is True
    assert result.receipt.payload["evidence"] == []
    replay = agent.tick(_world(1, operation_id="op-none-before"))
    assert len(seen) == 1
    assert agent.ledger.count() == 2
    assert replay.receipt.payload["result"]["replayed"] is True
    assert replay.receipt.payload["result"]["backend_called"] is False


def _world_call():
    return {
        "proposals": 1,
        "provenance": PROVENANCE,
        "measurability": 1.0,
        "tenant": "public",
    }


def test_none_after_append_does_not_emit_a_second_receipt():
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(1))
    _patch_emit(agent, "none-after")
    result = agent.tick(_world(1, operation_id="op-none-after"))
    assert len(seen) == 1
    assert result.receipt is None
    assert result.status == LoopStatus.ALIVE
    assert agent.ledger.count() == 1
    assert _actions(agent) == ["evaluate_proposal"]
    assert agent.ledger.verify_chain()
    replay = agent.tick(_world(1, operation_id="op-none-after"))
    assert len(seen) == 1
    assert agent.ledger.count() == 2
    assert replay.receipt.payload["result"]["replayed"] is True
    assert replay.receipt.payload["result"]["backend_called"] is False
    assert agent._replay["op-none-after"][1] is not None


def test_raise_after_append_keeps_the_appended_receipt():
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(1))
    _patch_emit(agent, "raise-after")
    with pytest.raises(RuntimeError, match="after append"):
        agent.tick(_world(1, operation_id="op-raise-after"))
    assert len(seen) == 1
    assert agent.status == LoopStatus.ALIVE
    assert agent.ledger.count() == 1
    assert _actions(agent) == ["evaluate_proposal"]
    replay = agent.tick(_world(1, operation_id="op-raise-after"))
    assert len(seen) == 1
    assert agent.ledger.count() == 2
    assert replay.receipt.payload["result"]["replayed"] is True
    assert replay.receipt.payload["backend_called"] is False


@pytest.mark.parametrize("mode", ["none-before", "raise-before", "none-after", "raise-after"])
def test_stop_stays_halted_when_the_receipt_fails(mode):
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(1))
    _patch_emit(agent, mode)
    if mode == "raise-after":
        with pytest.raises(RuntimeError, match="after append"):
            agent.tick(_world(1, stop="STOP"))
        assert agent.ledger.count() == 1
        assert _actions(agent) == ["__noop__"]
    else:
        result = agent.tick(_world(1, stop="STOP"))
        assert result.status == LoopStatus.HALTED
        assert agent.ledger.count() == 1
        if mode == "none-after":
            assert result.receipt is None
            assert _actions(agent) == ["__noop__"]
        else:
            assert result.receipt.payload["backend_called"] is False
            assert result.receipt.payload["evidence"] == []
            assert _actions(agent) == ["__terminal__"]
            assert "T10" in result.hukulla.tripped
    assert agent.status == LoopStatus.HALTED
    assert seen == []
    followed = agent.tick(_world(1))
    assert followed.status == LoopStatus.HALTED
    assert followed.receipt.payload["backend_called"] is False
    assert seen == []
    assert agent.ledger.count() == 2


def test_uncertain_outcome_replays_without_reopening():
    seen = []

    def evaluator(payload):
        seen.append(payload)
        return {"state": "UNCERTAIN", "evidence": [{"rights": "public_handles"}]}

    agent = _agent(evaluator)
    first = agent.tick(_world(1, operation_id="op-uncertain"))
    body = first.receipt.payload["result"]
    assert body["state"] == "UNCERTAIN"
    assert body["reason"] == "UNCERTAIN"
    assert body["backend_called"] is True
    assert body["evidence"] == []
    assert first.receipt.payload["backend_called"] is True
    stored = agent._replay["op-uncertain"]
    assert stored[1] is not None
    assert stored[1]["state"] == "UNCERTAIN"
    second = agent.tick(_world(1, operation_id="op-uncertain"))
    assert len(seen) == 1
    assert second.receipt.payload["result"]["replayed"] is True
    assert second.receipt.payload["result"]["state"] == "UNCERTAIN"
    assert second.receipt.payload["result"]["backend_called"] is False
    assert second.receipt.payload["backend_called"] is False
    assert agent._replay["op-uncertain"][1] is not None
    assert agent._replay["op-uncertain"][1]["reason"] == "UNCERTAIN"


def test_uncertain_receipt_failure_does_not_reopen_the_operation():
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or {"state": "INDETERMINATE"})
    _patch_emit(agent, "raise-before")
    failed = agent.tick(_world(1, operation_id="op-uncertain-fail"))
    assert len(seen) == 1
    assert failed.status == LoopStatus.PAUSED
    assert failed.receipt.payload["reason"] == "TERMINAL_EXCEPTION"
    assert failed.receipt.payload["backend_called"] is True
    assert agent._replay["op-uncertain-fail"][1] is not None
    assert agent._replay["op-uncertain-fail"][1]["state"] == "UNCERTAIN"
    replay = agent.tick(_world(1, operation_id="op-uncertain-fail"))
    assert len(seen) == 1
    assert replay.receipt.payload["result"]["replayed"] is True
    assert replay.receipt.payload["result"]["state"] == "UNCERTAIN"
    assert replay.receipt.payload["result"]["backend_called"] is False
    assert agent._replay["op-uncertain-fail"][1]["state"] == "UNCERTAIN"


def test_terminal_exception_after_the_evaluator_records_the_call():
    seen = []
    agent = _agent(lambda payload: seen.append(payload) or _ok(1))
    real = HatunAgent.emit_receipt
    calls = {"n": 0}

    def fail_once(self, *args, **kwargs):
        calls["n"] += 1
        if calls["n"] == 1:
            raise RuntimeError("receipt failed")
        return real(self, *args, **kwargs)

    agent.emit_receipt = fail_once.__get__(agent, HatunAgent)
    result = agent.tick(_world(1))
    assert len(seen) == 1
    assert result.receipt.payload["reason"] == "TERMINAL_EXCEPTION"
    assert result.receipt.payload["backend_called"] is True
    assert result.receipt.payload["evidence"] == []
