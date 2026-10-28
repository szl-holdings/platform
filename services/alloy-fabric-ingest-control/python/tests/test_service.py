"""Behaviour of the Python port on its own (no Node needed). test_parity.py compares it to the original."""

from __future__ import annotations

import json
import math

import pytest
from fastapi.testclient import TestClient

from aef_ingest_control.app import create_app
from aef_ingest_control.contracts import IndexVerifyRequest, IngestRequest, is_production_runtime, safe_parse
from aef_ingest_control.jscompat import UNDEFINED, js_split_whitespace, js_trim, stringify, utf16_length

SECRET = "unit-secret"
AUTH = {"Authorization": f"Bearer {SECRET}"}


def _client(tmp_path, **env: str) -> TestClient:
    return TestClient(create_app({"AEF_S2S_SECRET": SECRET, "AEF_DATA_DIR": str(tmp_path), **env}))


def test_javascript_string_rules() -> None:
    assert utf16_length("a\U0001F600") == 3  # the emoji is two UTF-16 code units
    assert js_trim("﻿  x 　") == "x"
    assert js_trim("\x1c x") == "\x1c x"  # Python treats \x1c as whitespace; JavaScript does not
    assert js_split_whitespace(" a b\n\nc ") == ["a", "b", "c"]


def test_json_stringify_rules() -> None:
    assert stringify({"a": UNDEFINED, "b": [UNDEFINED, math.nan], "c": 2.0}) == '{"b":[null,null],"c":2}'
    assert stringify([["k", {"v": 1}]], indent=2) == '[\n  [\n    "k",\n    {\n      "v": 1\n    }\n  ]\n]'


@pytest.mark.parametrize("chunk_size", [0, 1.5, "5", True, 2**53, None])
def test_ingest_chunk_size_must_be_a_positive_safe_integer(chunk_size) -> None:
    body = {"requestId": "r", "tenantId": "t", "documents": [{"sourceId": "s", "content": "x"}],
            "chunkSize": chunk_size}
    parsed, issues = safe_parse(IngestRequest, body)
    assert parsed is None and issues


def test_optional_fields_accept_missing_but_not_null() -> None:
    parsed, _ = safe_parse(IndexVerifyRequest, {"requestId": "r", "tenantId": "t"})
    assert parsed is not None and parsed.sourceIds is UNDEFINED
    parsed, issues = safe_parse(IndexVerifyRequest, {"requestId": "r", "tenantId": "t", "sourceIds": None})
    assert parsed is None and issues


def test_production_markers_win_and_invalid_mode_is_refused() -> None:
    assert is_production_runtime({"NODE_ENV": "development", "SZL_ENV": " PROD "})
    assert not is_production_runtime({"NODE_ENV": "test"})
    with pytest.raises(ValueError, match="Invalid RUNTIME_MODE"):
        is_production_runtime({"RUNTIME_MODE": "staging"})


@pytest.mark.parametrize("env", [{"AEF_S2S_SECRET": " "}, {"AEF_ENV": "production"}])
def test_startup_refuses_without_required_secrets(tmp_path, env) -> None:
    with pytest.raises(RuntimeError):
        create_app({"AEF_S2S_SECRET": SECRET, "AEF_DATA_DIR": str(tmp_path), **env})


def test_auth_and_tenant_binding(tmp_path) -> None:
    client = _client(tmp_path, AEF_S2S_TENANT_ID="tenant-a")
    body = {"requestId": "r", "tenantId": "tenant-a"}
    assert client.post("/control/verify", json=body).status_code == 401
    assert client.post("/control/verify", json=body, headers={"Authorization": "Bearer x"}).status_code == 401
    assert client.post("/control/verify", json={**body, "tenantId": "tenant-b"}, headers=AUTH).json() == {
        "error": "credential_tenant_mismatch"}
    assert client.post("/control/verify", json={**body, "tenantId": "  "}, headers=AUTH).status_code == 400
    ok = client.post("/control/verify", json={**body, "tenantId": " tenant-a "}, headers=AUTH)
    assert ok.status_code == 200 and ok.json()["tenantId"] == "tenant-a" and ok.json()["steps"] == 2


def test_production_is_held(tmp_path) -> None:
    client = _client(tmp_path, AEF_S2S_TENANT_ID="tenant-a", AEF_ENV="production")
    ready = client.get("/readyz")
    assert ready.status_code == 503 and ready.headers["retry-after"] == "60"
    assert ready.json()["code"] == "INGEST_CONTROL_PRODUCTION_UNAVAILABLE"
    held = client.post("/control/verify", json={"requestId": "r", "tenantId": "tenant-a"}, headers=AUTH)
    assert held.status_code == 503 and held.json()["status"] == "HOLD"


def test_full_rebuild_waits_for_approval_then_completes(tmp_path) -> None:
    client = _client(tmp_path)
    started = client.post("/control/rebuild", json={"requestId": "r", "tenantId": "t", "fullRebuild": True},
                          headers=AUTH)
    assert started.status_code == 202 and started.json()["status"] == "waiting_approval"
    workflow_id, approval_id = started.json()["workflowId"], started.json()["approvalRequestId"]
    checkpoints = json.loads((tmp_path / "checkpoints.json").read_text(encoding="utf-8"))
    assert checkpoints[0][0] == workflow_id and checkpoints[0][1]["status"] == "waiting_approval"

    pending = client.post(f"/control/workflows/{workflow_id}/resume", json={"tenantId": "t"}, headers=AUTH)
    assert pending.json()["status"] == "waiting_approval"
    resolved = client.post(f"/control/approvals/{approval_id}/resolve",
                           json={"decision": "approved", "resolvedBy": "op"}, headers=AUTH)
    assert resolved.status_code == 200
    assert client.post(f"/control/approvals/{approval_id}/resolve", json={"decision": "approved"},
                       headers=AUTH).status_code == 404
    done = client.post(f"/control/workflows/{workflow_id}/resume", json={"tenantId": "t"}, headers=AUTH)
    assert done.json()["status"] == "completed" and done.json()["completedSteps"] == 4
    assert json.loads((tmp_path / "checkpoints.json").read_text(encoding="utf-8")) == []


def test_express_routing_rules(tmp_path) -> None:
    client = _client(tmp_path)
    assert client.get("/HEALTHZ/").status_code == 200
    assert client.get("/nope").status_code == 404
    assert client.options("/healthz").headers["allow"] == "GET, HEAD"
    malformed = client.post("/control/verify", content=b"{bad",
                            headers={**AUTH, "Content-Type": "application/json"})
    assert malformed.status_code == 400
