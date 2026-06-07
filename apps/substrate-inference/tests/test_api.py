"""
API contract tests for the Substrate Inference service (STUB mode).

These exercise the real FastAPI app via TestClient with no GPU and no network.
The SubstrateRuntime auto-detects the absence of torch/CUDA and serves STUB
responses over the identical API contract, so every assertion below reflects
real, observed behavior of the shipped code path — not mocked stand-ins.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


def test_health_reports_idle_before_load(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    # No model loaded yet -> idle; engine string reflects STUB mode.
    assert body["status"] == "idle"
    assert "stub" in body["engine"].lower()
    assert body["loaded_models"] == []


def test_list_models_returns_registry(client):
    r = client.get("/v1/models")
    assert r.status_code == 200
    data = r.json()["data"]
    ids = {m["id"] for m in data}
    # The registry the service advertises.
    assert "llama-3.1-8b-instruct" in ids
    assert "qwen3-next-80b" in ids
    assert len(data) == 6
    for m in data:
        assert m["loaded"] is False


def test_load_then_chat_then_health_flips_to_ok(client):
    # Load a model (no SUBSTRATE_API_KEY set in tests -> management auth open).
    r = client.post("/v1/models/load", json={"model_id": "llama-3.1-8b-instruct"})
    assert r.status_code == 200
    assert r.json()["status"] == "loaded"

    # Loading again is idempotent.
    r = client.post("/v1/models/load", json={"model_id": "llama-3.1-8b-instruct"})
    assert r.json()["status"] == "already_loaded"

    # Chat completion returns a well-formed OpenAI-shaped response.
    r = client.post(
        "/v1/chat/completions",
        json={
            "model": "llama-3.1-8b-instruct",
            "messages": [{"role": "user", "content": "hello"}],
        },
    )
    assert r.status_code == 200
    body = r.json()
    assert body["object"] == "chat.completion"
    assert body["model"] == "llama-3.1-8b-instruct"
    assert body["choices"][0]["message"]["role"] == "assistant"
    assert "STUB MODE" in body["choices"][0]["message"]["content"]
    assert body["choices"][0]["finish_reason"] == "stop"
    assert body["usage"]["total_tokens"] >= 0

    # Health now reports the loaded model.
    r = client.get("/health")
    body = r.json()
    assert body["status"] == "ok"
    assert "llama-3.1-8b-instruct" in body["loaded_models"]

    # Unload cleans up.
    r = client.post("/v1/models/unload", json={"model_id": "llama-3.1-8b-instruct"})
    assert r.status_code == 200
    assert r.json()["status"] == "unloaded"


def test_chat_unknown_model_is_404(client):
    r = client.post(
        "/v1/chat/completions",
        json={"model": "does-not-exist", "messages": [{"role": "user", "content": "x"}]},
    )
    assert r.status_code == 404


def test_chat_on_unloaded_model_is_503(client):
    # gemma3-12b is in the registry but not loaded.
    r = client.post(
        "/v1/chat/completions",
        json={"model": "gemma3-12b", "messages": [{"role": "user", "content": "x"}]},
    )
    assert r.status_code == 503


def test_load_unknown_model_is_404(client):
    r = client.post("/v1/models/load", json={"model_id": "no-such-model"})
    assert r.status_code == 404


def test_streaming_chat_emits_sse_and_done(client):
    client.post("/v1/models/load", json={"model_id": "gpt-oss-20b"})
    with client.stream(
        "POST",
        "/v1/chat/completions",
        json={
            "model": "gpt-oss-20b",
            "messages": [{"role": "user", "content": "stream please"}],
            "stream": True,
        },
    ) as r:
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("text/event-stream")
        text = "".join(r.iter_text())
    assert "data: " in text
    assert "[DONE]" in text
    client.post("/v1/models/unload", json={"model_id": "gpt-oss-20b"})


def test_request_validation_rejects_bad_temperature(client):
    r = client.post(
        "/v1/chat/completions",
        json={
            "model": "llama-3.1-8b-instruct",
            "messages": [{"role": "user", "content": "x"}],
            "temperature": 9.0,  # > 2.0 upper bound
        },
    )
    assert r.status_code == 422
