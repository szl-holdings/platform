import base64
import io
import json
import sys

import pytest

from sentra_core import cli


def _run(req: dict, monkeypatch) -> tuple[int, dict]:
    monkeypatch.setattr(sys, "stdin", io.StringIO(json.dumps(req)))
    out = io.StringIO()
    monkeypatch.setattr(sys, "stdout", out)
    rc = cli.main([])
    return rc, json.loads(out.getvalue())


def test_invalid_json(monkeypatch):
    monkeypatch.setattr(sys, "stdin", io.StringIO("not-json"))
    out = io.StringIO()
    monkeypatch.setattr(sys, "stdout", out)
    rc = cli.main([])
    assert rc == 1
    assert json.loads(out.getvalue())["error"]["code"] == "invalid_json"


def test_unknown_op(monkeypatch):
    rc, resp = _run({"op": "nope"}, monkeypatch)
    assert rc == 1
    assert resp["error"]["code"] == "unknown_op"


def test_threat_model_op(monkeypatch):
    req = {
        "op": "threat_model.build",
        "payload": {
            "assets": [{"id": "a", "name": "a", "kind": "server", "exposure": "high"}],
            "sources": [{"id": "s", "name": "S", "techniques": ["T1190"]}],
        },
    }
    rc, resp = _run(req, monkeypatch)
    assert rc == 0
    assert resp["ok"]
    assert resp["result"]["edges"]


def test_posture_drift_op(monkeypatch):
    snap = lambda sid, ctrls: {
        "snapshot_id": sid,
        "captured_at": "t",
        "controls": ctrls,
    }
    req = {
        "op": "posture_drift.compute",
        "payload": {
            "baseline": snap("b", [{"id": "x", "name": "x", "severity": "critical", "state": "enabled"}]),
            "current": snap("c", []),
        },
    }
    rc, resp = _run(req, monkeypatch)
    assert rc == 0
    assert resp["result"]["removed"][0]["control_id"] == "x"


def test_incident_response_op(monkeypatch):
    req = {
        "op": "incident_response.run",
        "payload": {
            "incident": {
                "id": "i", "title": "t", "severity": "critical",
                "affected_assets": ["a"],
            },
            "runbook_name": "credential-compromise",
            "policy_allow_open": True,
        },
    }
    rc, resp = _run(req, monkeypatch)
    assert rc == 0
    assert resp["result"]["status"] == "completed"


def test_incident_response_refuses_without_policy_gate(monkeypatch):
    monkeypatch.delenv("A11OY_RUNTIME_URL", raising=False)
    req = {
        "op": "incident_response.run",
        "payload": {
            "incident": {"id": "i", "title": "t", "severity": "critical", "affected_assets": ["a"]},
            "runbook_name": "credential-compromise",
        },
    }
    rc, resp = _run(req, monkeypatch)
    assert rc == 1
    assert resp["error"]["code"] == "PolicyDeniedError"


def test_evidence_pack_op(monkeypatch):
    req = {
        "op": "evidence_pack.build",
        "payload": {
            "incident_id": "i",
            "signer_secret": "k",
            "policy_allow_open": True,
            "items": [
                {"id": "e1", "kind": "report", "payload_b64": base64.b64encode(b"x").decode()},
                {"id": "e2", "kind": "log_excerpt", "payload": "raw text"},
            ],
        },
    }
    rc, resp = _run(req, monkeypatch)
    assert rc == 0
    assert len(resp["result"]["pack_hash"]) == 64
    # Truthful publication outcome: no yawar_url means no publication attempt.
    assert resp["result"]["publication"] == {
        "attempted": False,
        "ok": False,
        "reason": "no_publisher_configured",
    }


def test_evidence_pack_op_dev_signer_opt_in(monkeypatch):
    monkeypatch.delenv("SENTRA_EVIDENCE_SECRET", raising=False)
    req = {
        "op": "evidence_pack.build",
        "payload": {
            "incident_id": "i",
            "allow_dev_signer": True,
            "policy_allow_open": True,
            "items": [{"id": "e1", "kind": "report", "payload": "x"}],
        },
    }
    rc, resp = _run(req, monkeypatch)
    assert rc == 0
    assert resp["result"]["signer_id"] == "sentra-hmac-dev"


def test_evidence_pack_op_refuses_without_secret_or_optin(monkeypatch):
    monkeypatch.delenv("SENTRA_EVIDENCE_SECRET", raising=False)
    req = {
        "op": "evidence_pack.build",
        "payload": {
            "incident_id": "i",
            "policy_allow_open": True,
            "items": [{"id": "e1", "kind": "report", "payload": "x"}],
        },
    }
    rc, resp = _run(req, monkeypatch)
    assert rc == 1
    assert resp["error"]["code"] == "RuntimeError"


def test_policy_gate_op_transport_error(monkeypatch):
    req = {
        "op": "policy_gate.evaluate",
        "payload": {
            "runtime_url": "http://127.0.0.1:1",
            "action": "x",
            "subject": {},
        },
    }
    rc, resp = _run(req, monkeypatch)
    assert rc == 0
    assert resp["result"]["allow"] is False


def test_op_raises_returns_error(monkeypatch):
    req = {"op": "incident_response.run", "payload": {"incident": {"id": "i", "title": "t", "severity": "low"}}}
    rc, resp = _run(req, monkeypatch)
    assert rc == 1
    assert resp["error"]["code"] == "ValueError"
