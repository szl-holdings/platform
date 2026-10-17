"""Hatun reports a measured read-port result and does not invent health."""

from puriq_os.khipu_emit import KhipuLedger
from puriq_os.loop import Action
from puriq_os.organs.hatun_agent import HatunAgent


def _agent(port=None):
    return HatunAgent(KhipuLedger(), read_port=port)


def test_absent_port_is_unavailable_and_not_a_constant_health():
    observed = _agent().observe({"governance_health": 1.0, "config_proposals": 4, "approved": True})
    assert observed["governance_health"] is None
    assert observed["state"] == "UNAVAILABLE"
    assert observed["proposals"] == 0
    assert observed["hydrated"] is False
    assert "random" not in HatunAgent.observe.__code__.co_names


def test_measured_result_is_reported_without_execution_authority():
    def port():
        return {
            "state": "AVAILABLE",
            "governance_health": None,
            "evidence": [{"node_id": "node-1", "sha256": "a" * 64}],
            "source_revision": "b" * 64,
            "backend": "MEASURED",
        }

    agent = _agent(port)
    observed = agent.observe({})
    assert observed["state"] == "AVAILABLE"
    assert observed["governance_health"] is None
    assert observed["evidence"][0]["node_id"] == "node-1"
    assert observed["source_revision"] == "b" * 64
    actions = agent.candidate_actions(observed)
    assert [item.name for item in actions] == ["idle"]
    executed = agent.execute(actions[0], observed)
    assert executed["evaluated"] is False
    assert executed["execution_authority"] == "NONE"
    assert executed["governance_health"] is None
    assert executed["state"] == "AVAILABLE"


def test_insufficient_evidence_abstains():
    agent = _agent(lambda: {"state": "AVAILABLE", "evidence": "not-a-list"})
    observed = agent.observe(None)
    assert observed["state"] == "ABSTAIN"
    assert observed["evidence"] == []


def test_port_failure_is_unavailable():
    def port():
        raise RuntimeError("backend down")

    observed = _agent(port).observe({})
    assert observed["state"] == "UNAVAILABLE"
    assert observed["governance_health"] is None


def test_idle_execute_does_not_copy_private_fields():
    agent = _agent()
    top = agent.execute(Action(name="idle"), {"state": "AVAILABLE", "content": "secret"})
    nested = agent.execute(
        Action(name="idle"),
        {
            "state": "AVAILABLE",
            "evidence": [{"node_id": "node-1", "sha256": "a" * 64, "text": "hidden"}],
            "source_revision": "b" * 64,
        },
    )
    encoded = str(top) + str(nested)
    assert "secret" not in encoded
    assert "hidden" not in encoded
    assert top["evidence"] == []
    assert nested["evidence"] == []
    assert top["state"] == "ABSTAIN"
    assert nested["state"] == "ABSTAIN"
    assert top["governance_health"] is None


def test_non_dict_port_is_unavailable():
    observed = _agent(lambda: ["not-a-dict"]).observe({})
    assert observed["state"] == "UNAVAILABLE"
    assert observed["governance_health"] is None


def test_non_idle_action_is_denied():
    executed = _agent().execute(Action(name="evaluate_proposal", state_changing=True), {})
    assert executed["evaluated"] is False
    assert executed["state"] == "DENIED"
    assert executed["execution_authority"] == "NONE"
