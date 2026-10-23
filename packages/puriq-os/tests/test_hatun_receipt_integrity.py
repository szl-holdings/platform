"""Admission must refuse a new Hatun invocation while paused or a receipt write is open."""

import sqlite3
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


def test_foreign_thread_cannot_emit_into_caller_owned_transaction():
    ledger = KhipuLedger()
    ledger._conn.execute("BEGIN")
    outcome = {}

    def emit_from_worker():
        try:
            ledger.emit(_receipt("foreign", 1))
        except Exception as exc:
            outcome["error"] = exc

    worker = threading.Thread(target=emit_from_worker)
    worker.start()
    worker.join(5)

    assert not worker.is_alive()
    assert isinstance(outcome.get("error"), RuntimeError)
    assert str(outcome["error"]) == "LEDGER_TRANSACTION_UNRESOLVED"
    assert ledger.count() == 0
    ledger._conn.rollback()
    committed = ledger.emit(_receipt("after-rollback", 2))
    assert committed.receipt_hash
    assert ledger.count() == 1
    assert ledger.transaction_unresolved() is False
    assert ledger.verify_chain() is True


def test_foreign_begin_cannot_race_between_emit_check_and_insert():
    ledger = KhipuLedger()
    emit_checked = threading.Event()
    finish_emit = threading.Event()
    transaction_opened = threading.Event()
    release_transaction = threading.Event()
    outcomes = {}
    original_head_hash = ledger.head_hash

    def paused_head_hash():
        emit_checked.set()
        assert finish_emit.wait(5)
        return original_head_hash()

    def emit_receipt():
        outcomes["receipt"] = ledger.emit(_receipt("raced", 1))

    def open_transaction():
        ledger._conn.execute("BEGIN")
        transaction_opened.set()
        assert release_transaction.wait(5)
        ledger._conn.rollback()

    ledger.head_hash = paused_head_hash
    emitter = threading.Thread(target=emit_receipt)
    emitter.start()
    assert emit_checked.wait(5)
    opener = threading.Thread(target=open_transaction)
    opener.start()
    assert transaction_opened.wait(0.1) is False
    finish_emit.set()
    emitter.join(5)

    assert not emitter.is_alive()
    assert outcomes["receipt"].receipt_hash
    assert transaction_opened.wait(5)
    release_transaction.set()
    opener.join(5)
    assert not opener.is_alive()
    assert ledger.count() == 1
    assert ledger.verify_chain() is True


def test_cursor_and_executescript_transactions_preserve_same_thread_nesting():
    for begin, rollback in (
        (
            lambda ledger: ledger._conn.cursor().execute("BEGIN"),
            lambda ledger: ledger._conn.execute("-- resolve\nROLLBACK;"),
        ),
        (
            lambda ledger: ledger._conn.executescript("BEGIN;"),
            lambda ledger: ledger._conn.execute("/* resolve */ ROLLBACK;"),
        ),
    ):
        ledger = KhipuLedger()
        begin(ledger)
        ledger.emit(_receipt("nested", 1))
        assert ledger.transaction_unresolved() is True
        assert ledger.count() == 1
        rollback(ledger)
        assert ledger.count() == 0
        assert ledger.transaction_unresolved() is False


def test_raw_cursor_factory_and_base_connection_dispatch_cannot_bypass_wrapper():
    ledger = KhipuLedger()
    try:
        ledger._conn.cursor(sqlite3.Cursor)
    except RuntimeError as exc:
        assert str(exc) == "LEDGER_CURSOR_FACTORY_UNSUPPORTED"
    else:
        raise AssertionError("expected raw cursor factory to fail closed")

    try:
        sqlite3.Connection.execute(ledger._conn, "BEGIN")
    except TypeError:
        pass
    else:
        raise AssertionError("expected base connection dispatch to reject the wrapper")


def test_sql_transaction_close_clears_owner_before_next_thread_opens():
    ledger = KhipuLedger()
    ledger._conn.execute("BEGIN")
    ledger._conn.execute("COMMIT")
    worker_opened = threading.Event()
    release_worker = threading.Event()

    def hold_worker_transaction():
        ledger._conn.cursor().execute("BEGIN")
        worker_opened.set()
        assert release_worker.wait(5)
        ledger._conn.cursor().execute("ROLLBACK")

    worker = threading.Thread(target=hold_worker_transaction)
    worker.start()
    assert worker_opened.wait(5)
    try:
        ledger.emit(_receipt("foreign", 1))
    except RuntimeError as exc:
        assert str(exc) == "LEDGER_TRANSACTION_UNRESOLVED"
    else:
        raise AssertionError("expected foreign transaction ownership to fail closed")
    release_worker.set()
    worker.join(5)

    assert not worker.is_alive()
    assert ledger.count() == 0
    assert ledger.transaction_unresolved() is False
    committed = ledger.emit(_receipt("after-worker", 2))
    assert committed.receipt_hash
    assert ledger.verify_chain() is True


def test_orphan_context_manager_resolves_and_multiline_read_stays_available():
    ledger = KhipuLedger()
    opened = threading.Event()

    def abandon_transaction():
        ledger._conn.execute("BEGIN")
        opened.set()

    worker = threading.Thread(target=abandon_transaction)
    worker.start()
    assert opened.wait(5)
    worker.join(5)
    assert not worker.is_alive()

    assert ledger._conn.execute("SELECT\nCOUNT(*) FROM khipu").fetchone()[0] == 0
    with ledger._conn:
        pass
    assert ledger._conn.in_transaction is False
    assert ledger.transaction_unresolved() is False
    committed = ledger.emit(_receipt("after-orphan", 1))
    assert committed.receipt_hash
    assert ledger.verify_chain() is True


def test_self_started_insert_failure_rolls_back_and_recovers():
    ledger = KhipuLedger()
    ledger._conn.execute("""
        CREATE TRIGGER reject_khipu_insert
        BEFORE INSERT ON khipu
        BEGIN
            SELECT RAISE(ABORT, 'boom');
        END
    """)

    try:
        ledger.emit(_receipt("rejected", 1))
    except sqlite3.IntegrityError as exc:
        assert str(exc) == "boom"
    else:
        raise AssertionError("expected the trigger to reject the receipt")

    assert ledger._conn.in_transaction is False
    assert ledger.transaction_unresolved() is False
    assert ledger.count() == 0
    ledger._conn.execute("DROP TRIGGER reject_khipu_insert")
    committed = ledger.emit(_receipt("after-failure", 2))
    assert committed.receipt_hash
    assert ledger.count() == 1
    assert ledger.verify_chain() is True


def test_self_started_commit_failure_rolls_back_and_recovers():
    ledger = KhipuLedger()
    commit = ledger._conn.commit

    def fail_commit():
        raise sqlite3.OperationalError("forced commit failure")

    ledger._conn.commit = fail_commit
    try:
        ledger.emit(_receipt("rejected", 1))
    except sqlite3.OperationalError as exc:
        assert str(exc) == "forced commit failure"
    else:
        raise AssertionError("expected the forced commit failure")
    finally:
        ledger._conn.commit = commit

    assert ledger._conn.in_transaction is False
    assert ledger.transaction_unresolved() is False
    assert ledger.count() == 0
    committed = ledger.emit(_receipt("after-failure", 2))
    assert committed.receipt_hash
    assert ledger.count() == 1
    assert ledger.verify_chain() is True


def test_two_ledgers_serialize_chain_heads_on_one_database(tmp_path):
    database = tmp_path / "shared-khipu.db"
    first = KhipuLedger(str(database))
    second = KhipuLedger(str(database))
    first_reserved = threading.Event()
    release_first = threading.Event()
    second_finished = threading.Event()
    outcomes = {}
    original_head_hash = first.head_hash

    def paused_head_hash():
        first_reserved.set()
        assert release_first.wait(5)
        return original_head_hash()

    def emit_first():
        outcomes["first"] = first.emit(_receipt("first", 1))

    def emit_second():
        outcomes["second"] = second.emit(_receipt("second", 2))
        second_finished.set()

    first.head_hash = paused_head_hash
    first_thread = threading.Thread(target=emit_first)
    second_thread = threading.Thread(target=emit_second)
    first_thread.start()
    assert first_reserved.wait(5)
    second_thread.start()
    assert second_finished.wait(0.1) is False
    release_first.set()
    first_thread.join(5)
    second_thread.join(5)

    assert not first_thread.is_alive()
    assert not second_thread.is_alive()
    assert outcomes["first"].prev_hash == "0" * 64
    assert outcomes["second"].prev_hash == outcomes["first"].receipt_hash
    assert first.count() == 2
    assert second.count() == 2
    assert first.verify_chain() is True
    assert second.verify_chain() is True
