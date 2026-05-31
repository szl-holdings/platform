"""
Auth tests for the model-management endpoints.

`SUBSTRATE_API_KEY` is read at import time, so this module sets it and imports
the app in an isolated module instance to assert the bearer-token gate on
/v1/models/load and /v1/models/unload.
"""
from __future__ import annotations

import importlib
import os
import sys

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def keyed_client(monkeypatch):
    monkeypatch.setenv("SUBSTRATE_API_KEY", "test-secret")
    # Drop any already-imported app module so module-level API_KEY re-reads env.
    for mod in ("src.main", "src.models"):
        sys.modules.pop(mod, None)
    main = importlib.import_module("src.main")
    try:
        with TestClient(main.app) as c:
            yield c
    finally:
        # Restore a clean import state for other test modules.
        for mod in ("src.main", "src.models"):
            sys.modules.pop(mod, None)


def test_load_without_token_is_401(keyed_client):
    r = keyed_client.post("/v1/models/load", json={"model_id": "llama-3.1-8b-instruct"})
    assert r.status_code == 401


def test_load_with_wrong_token_is_403(keyed_client):
    r = keyed_client.post(
        "/v1/models/load",
        json={"model_id": "llama-3.1-8b-instruct"},
        headers={"Authorization": "Bearer wrong"},
    )
    assert r.status_code == 403


def test_load_with_correct_token_succeeds(keyed_client):
    r = keyed_client.post(
        "/v1/models/load",
        json={"model_id": "llama-3.1-8b-instruct"},
        headers={"Authorization": "Bearer test-secret"},
    )
    assert r.status_code == 200
    assert r.json()["status"] in {"loaded", "already_loaded"}


def test_health_and_models_need_no_token(keyed_client):
    """Read-only/observability endpoints stay open even when a key is set."""
    assert keyed_client.get("/health").status_code == 200
    assert keyed_client.get("/v1/models").status_code == 200
