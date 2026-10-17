"""Admission must refuse a new Hatun invocation while paused or a receipt write is open."""

import threading
from pathlib import Path

from puriq_os.khipu_emit import KhipuLedger, KhipuReceipt
from puriq_os.loop import LoopStatus
from puriq_os.organs.hatun_agent import HatunAgent
from puriq_os.scheduler import PuriqScheduler, invocation_blocked
from tests.test_hatun_agent_measured import NOW, _agent, _ok, _world

ROOT = Path(__file__).resolve().parents[3]
MEASURED_COMMAND = "python -m pytest packages/puriq-os/tests -q -p no:cacheprovider"


def _open_transaction(agent):
    agent.ledger._conn.execute("BEGIN")
    assert agent.ledger.transaction_unresolved() is True


def _schedule(agent, world):
    scheduler = PuriqScheduler()
    scheduler.register(agent)
    synthetic = scheduler.run_synthetic(agent.cadence_seconds, world)
    fired = scheduler._fire(agent.organ, world)
    return synthetic, fired


def test_measured_job_discovers_receipt_regressions():
    workflow = (ROOT / ".github" / "workflows" / "tests.yml").read_text(encoding="utf-8")
    assert MEASURED_COMMAND in workflow
    assert "packages/puriq-os/tests/test_hatun_agent_measured.py" not in workflow


def test_paused_scheduler_does_not_invoke_while_transaction_unresolved():
    calls = []
    agent = _agent(lambda payload: calls.append(payload) or _ok(1))
    agent.status = LoopStatus.PAUSED
    _open_transaction(agent)
    before_count = agent.ledger.count()
    before_tick = agent.tick_count

    synthetic, fired = _schedule(agent, _world(1))

    assert synthetic == []
    assert fired is None
    assert calls == []
    assert agent.status == LoopStatus.PAUSED
    assert agent.tick_count == before_tick
    assert agent.ledger.count() == before_count
    assert agent.ledger.transaction_unresolved() is True
    assert invocation_blocked(agent) is True


def test_paused_scheduler_does_not_invoke_after_the_ledger_commits():
    calls = []
    agent = _agent(lambda payload: calls.append(payload) or _ok(1))
    committed = agent.tick(_world(1))
    assert committed.receipt is not None
    assert agent.ledger.transaction_unresolved() is False
    agent.status = LoopStatus.PAUSED
    calls.clear()
    before_count = agent.ledger.count()
    before_tick = agent.tick_count

    synthetic, fired = _schedule(agent, _world(1))

    assert synthetic == []
    assert fired is None
    assert calls == []
    assert agent.status == LoopStatus.PAUSED
    assert agent.tick_count == before_tick
    assert agent.ledger.count() == before_count


def test_alive_scheduler_does_not_invoke_while_transaction_unresolved():
    calls = []
    agent = _agent(lambda payload: calls.append(payload) or _ok(1))
    agent.status = LoopStatus.ALIVE
    _open_transaction(agent)

    synthetic, fired = _schedule(agent, _world(1))

    assert synthetic == []
    assert fired is None
    assert calls == []
    assert agent.status == LoopStatus.ALIVE
    assert agent.ledger.transaction_unresolved() is True


def test_resolved_alive_scheduler_still_invokes():
    calls = []
    agent = _agent(lambda payload: calls.append(payload) or _ok(1))
    assert agent.status == LoopStatus.INIT
    assert agent.ledger.transaction_unresolved() is False
    assert invocation_blocked(agent) is False

    synthetic, fired = _schedule(agent, _world(1))

    assert len(synthetic) == 1
    assert synthetic[0].chosen == "evaluate_proposal"
    assert fired is not None
    assert fired.chosen == "evaluate_proposal"
    assert len(calls) == 2
    assert agent.ledger.transaction_unresolved() is False
    assert agent.ledger.verify_chain() is True


def test_paused_direct_call_does_not_invoke_or_resume():
    calls = []
    agent = _agent(lambda payload: calls.append(payload) or _ok(1))
    agent.status = LoopStatus.PAUSED
    before_count = agent.ledger.count()
    before_tick = agent.tick_count

    result = agent.tick(_world(1, operation_id="op-fresh"))

    assert result.note == "admission-blocked"
    assert result.receipt is None
    assert calls == []
    assert "op-fresh" not in agent._replay
    assert agent.status == LoopStatus.PAUSED
    assert agent.tick_count == before_tick
    assert agent.ledger.count() == before_count
    assert agent.ledger.transaction_unresolved() is False


def test_paused_replay_stays_deduplicated_without_resuming():
    calls = []
    agent = _agent(lambda payload: calls.append(payload) or _ok(1))
    first = agent.tick(_world(1, operation_id="op-replay"))
    assert first.receipt.payload["result"]["backend_called"] is True
    agent.status = LoopStatus.PAUSED
    calls.clear()

    replay = agent.tick(_world(1, operation_id="op-replay"))

    assert calls == []
    assert replay.receipt.payload["result"]["replayed"] is True
    assert replay.receipt.payload["result"]["backend_called"] is False
    assert agent.status == LoopStatus.PAUSED
    assert agent._replay["op-replay"][1]["backend_called"] is True


def test_unresolved_ledger_blocks_a_fresh_id_and_a_replay():
    calls = []
    agent = _agent(lambda payload: calls.append(payload) or _ok(1))
    stored = agent.tick(_world(1, operation_id="op-stored"))
    assert stored.receipt.payload["result"]["backend_called"] is True
    calls.clear()
    before_count = agent.ledger.count()
    before_tick = agent.tick_count
    _open_transaction(agent)

    fresh = agent.tick(_world(2, operation_id="op-fresh"))
    replay = agent.tick(_world(1, operation_id="op-stored"))

    assert fresh.note == "admission-blocked"
    assert replay.note == "admission-blocked"
    assert calls == []
    assert "op-fresh" not in agent._replay
    assert agent._replay["op-stored"][1]["backend_called"] is True
    assert agent.tick_count == before_tick
    assert agent.ledger.count() == before_count
    assert agent.ledger.transaction_unresolved() is True
    agent.ledger._conn.rollback()
    assert agent.ledger.transaction_unresolved() is False
    resumed = agent.tick(_world(2, operation_id="op-fresh"))
    assert resumed.chosen == "evaluate_proposal"
    assert calls and calls[-1]["proposals"] == 2
    assert agent.ledger.verify_chain() is True


def test_second_agent_fresh_id_blocks_on_the_shared_ledger():
    calls = []
    ledger = KhipuLedger()
    first = HatunAgent(ledger, evaluator=lambda payload: _ok(1), clock=lambda: NOW)
    first.tick(_world(1, operation_id="op-first"))
    _open_transaction(first)
    second = HatunAgent(
        ledger,
        evaluator=lambda payload: calls.append(payload) or _ok(1),
        clock=lambda: NOW,
    )
    before_count = ledger.count()

    blocked = second.tick(_world(1, operation_id="op-second"))

    assert blocked.note == "admission-blocked"
    assert calls == []
    assert "op-second" not in second._replay
    assert second.tick_count == 0
    assert ledger.count() == before_count
    assert ledger.transaction_unresolved() is True
    ledger._conn.rollback()
    admitted = second.tick(_world(1, operation_id="op-second"))
    assert admitted.chosen == "evaluate_proposal"
    assert len(calls) == 1
    assert ledger.transaction_unresolved() is False
    assert ledger.verify_chain() is True


def test_concurrent_tick_sees_the_open_transaction():
    calls = []
    agent = _agent(lambda payload: calls.append(payload) or _ok(1))
    started = threading.Event()
    release = threading.Event()
    outcome = {}

    def hold_transaction():
        with agent.ledger._lock:
            agent.ledger._conn.execute("BEGIN")
            started.set()
            assert release.wait(5)

    def invoke():
        outcome["tick"] = agent.tick(_world(1, operation_id="op-race"))

    holder = threading.Thread(target=hold_transaction)
    holder.start()
    assert started.wait(5)
    invoker = threading.Thread(target=invoke)
    invoker.start()
    release.set()
    holder.join(5)
    invoker.join(5)

    assert not holder.is_alive()
    assert not invoker.is_alive()
    result = outcome["tick"]
    assert result.note == "admission-blocked"
    assert calls == []
    assert "op-race" not in agent._replay
    assert agent.ledger.transaction_unresolved() is True
    agent.ledger._conn.rollback()
    assert agent.ledger.transaction_unresolved() is False


def _receipt(action: str, tick: int) -> KhipuReceipt:
    return KhipuReceipt(
        organ="Hatun",
        tick=tick,
        action=action,
        decision_value=0.0,
        yuyay_value=0.0,
        hukulla_clear=True,
        payload={"backend_called": False},
    )


def test_absent_operation_id_is_not_a_replay_and_stays_blocked_while_unresolved():
    calls = []
    agent = _agent(lambda payload: calls.append(payload) or _ok(1))
    agent.status = LoopStatus.PAUSED
    paused = agent.tick(_world(1))
    assert paused.note == "admission-blocked"
    assert calls == []
    assert agent.status == LoopStatus.PAUSED

    agent.status = LoopStatus.INIT
    _open_transaction(agent)
    blocked = agent.tick(_world(1))
    assert blocked.note == "admission-blocked"
    assert calls == []
    assert agent.ledger.transaction_unresolved() is True
    agent.ledger._conn.rollback()

    first = agent.tick(_world(1))
    second = agent.tick(_world(1))
    assert first.chosen == "evaluate_proposal"
    assert second.chosen == "evaluate_proposal"
    assert len(calls) == 2
    assert agent.ledger.transaction_unresolved() is False
    assert agent.ledger.verify_chain() is True


def test_nested_append_does_not_commit_or_deadlock():
    agent = _agent(lambda payload: _ok(1))
    ledger = agent.ledger
    ledger._conn.execute("BEGIN")
    with ledger._lock:
        ledger.emit(_receipt("outer", 1))
        ledger.emit(_receipt("inner", 2))
    assert ledger.transaction_unresolved() is True
    assert ledger._conn.in_transaction is True
    assert [row["action"] for row in ledger.all_receipts()] == ["outer", "inner"]
    ledger._conn.rollback()
    assert ledger.count() == 0
    assert ledger.transaction_unresolved() is False
    committed = agent.tick(_world(1, operation_id="op-after-rollback"))
    assert committed.receipt is not None
    assert ledger.count() == 1
    assert ledger.transaction_unresolved() is False
    assert ledger.verify_chain() is True
