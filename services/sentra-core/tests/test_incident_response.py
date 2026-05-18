from sentra_core.incident_response import (
    Incident,
    InMemoryEventSink,
    Runbook,
    RunbookContext,
    execute,
    runbook_for,
    ransomware_containment,
)

import pytest


def _inc(**overrides):
    base = dict(
        id="inc-1",
        title="Ransomware on prod",
        severity="critical",
        mitre_techniques=("T1486",),
        affected_assets=("srv-1", "srv-2"),
    )
    base.update(overrides)
    return Incident(**base)


def test_simple_runbook_emits_step_events():
    sink = InMemoryEventSink()
    rb = Runbook(name="basic", incident_class="generic").step(
        "a", lambda c: {"ok": True}
    ).step("b", lambda c: {"ok": True})
    res = execute(rb, RunbookContext(_inc()), sink)
    assert res.status == "completed"
    assert [e.step_name for e in sink.events] == ["a", "b"]
    assert all(e.status == "ok" for e in sink.events)


def test_failed_step_short_circuits():
    sink = InMemoryEventSink()

    def boom(_):
        raise RuntimeError("nope")

    rb = Runbook(name="rb", incident_class="g").step("first", lambda c: 1).step(
        "boom", boom
    ).step("never", lambda c: 1)
    res = execute(rb, RunbookContext(_inc()), sink)
    assert res.status == "failed"
    assert [e.step_name for e in sink.events] == ["first", "boom"]
    assert sink.events[-1].error and "nope" in sink.events[-1].error


def test_await_approval_pauses():
    sink = InMemoryEventSink()
    rb = Runbook(name="rb", incident_class="g").step(
        "a", lambda c: 1
    ).await_approval("ok?").step("b", lambda c: 2)
    ctx = RunbookContext(_inc())
    res = execute(rb, ctx, sink)
    assert res.status == "awaiting_approval"
    assert sink.events[-1].kind == "await_approval"
    assert sink.events[-1].status == "awaiting_approval"

    # Resume with approval
    ctx.approvals["ok?"] = True
    sink2 = InMemoryEventSink()
    res2 = execute(rb, ctx, sink2)
    assert res2.status == "completed"
    assert sink2.events[-1].step_name == "b"


def test_branch_chooses_true_path():
    sink = InMemoryEventSink()
    true_rb = Runbook(name="t", incident_class="g").step("on-true", lambda c: "T")
    false_rb = Runbook(name="f", incident_class="g").step("on-false", lambda c: "F")
    rb = Runbook(name="rb", incident_class="g").branch(
        "pick", lambda c: c.incident.severity == "critical", true_rb, false_rb
    )
    res = execute(rb, RunbookContext(_inc()), sink)
    assert res.status == "completed"
    names = [e.step_name for e in sink.events]
    assert "on-true" in names
    assert "on-false" not in names


def test_branch_false_path():
    rb = Runbook(name="rb", incident_class="g").branch(
        "pick", lambda c: False,
        Runbook(name="t", incident_class="g").step("t", lambda c: 1),
        Runbook(name="f", incident_class="g").step("f", lambda c: 1),
    )
    res = execute(rb, RunbookContext(_inc()))
    names = [e.step_name for e in res.events]
    assert "f" in names and "t" not in names


def test_branch_with_no_false_branch_continues():
    rb = Runbook(name="rb", incident_class="g").branch(
        "pick", lambda c: False,
        Runbook(name="t", incident_class="g").step("t", lambda c: 1),
    ).step("after", lambda c: 2)
    res = execute(rb, RunbookContext(_inc()))
    assert res.status == "completed"
    assert any(e.step_name == "after" for e in res.events)


def test_canonical_runbooks_registered():
    rb = runbook_for("ransomware")
    assert rb.name == "ransomware_containment"
    assert runbook_for("credential-compromise").name == "credential_compromise"
    assert runbook_for("data-exfiltration").name == "data_exfiltration"
    with pytest.raises(KeyError):
        runbook_for("nope")


def test_canonical_ransomware_pauses_on_approval():
    rb = ransomware_containment()
    res = execute(rb, RunbookContext(_inc()))
    assert res.status == "awaiting_approval"


def test_to_dict_shape():
    rb = Runbook(name="rb", incident_class="g").step("a", lambda c: 1)
    res = execute(rb, RunbookContext(_inc()))
    d = res.to_dict()
    assert d["status"] == "completed"
    assert d["events"][0]["duration_ms"] >= 0


class _FakeDenyGate:
    def guard(self, action, subject):
        from sentra_core.policy_gate import PolicyDecision, PolicyDeniedError
        raise PolicyDeniedError(PolicyDecision(False, "denied by test", "pol-1", None, {}))


class _FakeAllowGate:
    def __init__(self):
        self.calls = []
    def guard(self, action, subject):
        from sentra_core.policy_gate import PolicyDecision
        self.calls.append((action, subject))
        return PolicyDecision(True, "ok", "pol-1", None, {})


def test_execute_refuses_when_policy_gate_denies():
    from sentra_core.policy_gate import PolicyDeniedError
    rb = Runbook(name="rb", incident_class="g").step("a", lambda c: 1)
    with pytest.raises(PolicyDeniedError):
        execute(rb, RunbookContext(_inc()), policy_gate=_FakeDenyGate())


def test_execute_calls_policy_gate_with_op_metadata():
    rb = Runbook(name="rb", incident_class="ransomware").step("a", lambda c: 1)
    gate = _FakeAllowGate()
    execute(rb, RunbookContext(_inc()), policy_gate=gate)
    assert gate.calls and gate.calls[0][0] == "sentra.incident_response.execute"
    assert gate.calls[0][1]["runbook"] == "rb"
