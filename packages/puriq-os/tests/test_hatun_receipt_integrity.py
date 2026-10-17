"""Scheduler must not start an operation while paused or a receipt write is open."""

from pathlib import Path

from puriq_os.loop import LoopStatus
from puriq_os.scheduler import PuriqScheduler, invocation_blocked
from tests.test_hatun_agent_measured import _agent, _ok, _world

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
