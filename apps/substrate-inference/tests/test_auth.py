"""Authentication boundary tests for the Substrate inference service."""

from __future__ import annotations

import importlib
import sys
from collections.abc import Iterator
from dataclasses import replace

import pytest
from fastapi.testclient import TestClient

_AUTH_ENVIRONMENT_VARIABLES = (
    "SUBSTRATE_API_KEY",
    "SUBSTRATE_API_TENANT_ID",
    "SUBSTRATE_MODEL_ADMIN_API_KEY",
    "SUBSTRATE_INFERENCE_AUTH_BYPASS",
    "SUBSTRATE_INFERENCE_ENV",
    "RUNTIME_MODE",
    "APP_ENV",
    "NODE_ENV",
    "SZL_ENV",
    "SUBSTRATE_MODEL_REVISIONS_JSON",
    "SUBSTRATE_DEFAULT_MODEL",
    "SUBSTRATE_ALLOWED_ORIGINS",
)
_TEST_CREDENTIAL = "inference-unit-test-credential"
_TEST_TENANT = "inference-unit-test-tenant"
_TEST_ADMIN_CREDENTIAL = "model-admin-unit-test-credential"
_INFERENCE_HEADERS = {
    "Authorization": f"Bearer {_TEST_CREDENTIAL}",
    "X-Tenant-ID": _TEST_TENANT,
}
_ADMIN_HEADERS = {"Authorization": f"Bearer {_TEST_ADMIN_CREDENTIAL}"}


def _import_app(
    monkeypatch: pytest.MonkeyPatch,
    *,
    api_key: str | None = None,
    api_tenant_id: str | None = None,
    model_admin_api_key: str | None = None,
    environment: str | None = None,
    bypass: str | None = None,
    extra_environment: dict[str, str] | None = None,
):
    for name in _AUTH_ENVIRONMENT_VARIABLES:
        monkeypatch.delenv(name, raising=False)
    if api_key is not None:
        monkeypatch.setenv("SUBSTRATE_API_KEY", api_key)
    if api_tenant_id is not None:
        monkeypatch.setenv("SUBSTRATE_API_TENANT_ID", api_tenant_id)
    if model_admin_api_key is not None:
        monkeypatch.setenv("SUBSTRATE_MODEL_ADMIN_API_KEY", model_admin_api_key)
    if environment is not None:
        monkeypatch.setenv("SUBSTRATE_INFERENCE_ENV", environment)
    if bypass is not None:
        monkeypatch.setenv("SUBSTRATE_INFERENCE_AUTH_BYPASS", bypass)
    for name, value in (extra_environment or {}).items():
        monkeypatch.setenv(name, value)

    sys.modules.pop("src.main", None)
    return importlib.import_module("src.main")


@pytest.fixture()
def keyed_client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    main = _import_app(
        monkeypatch,
        api_key=_TEST_CREDENTIAL,
        api_tenant_id=_TEST_TENANT,
        model_admin_api_key=_TEST_ADMIN_CREDENTIAL,
        environment="test",
    )
    try:
        with TestClient(main.app) as client:
            yield client
    finally:
        sys.modules.pop("src.main", None)


@pytest.mark.parametrize(
    ("method", "path", "payload"),
    [
        ("get", "/v1/models", None),
        (
            "post",
            "/v1/chat/completions",
            {
                "model": "llama-3.1-8b-instruct",
                "messages": [{"role": "user", "content": "hello"}],
            },
        ),
        ("post", "/v1/models/load", {"model_id": "llama-3.1-8b-instruct"}),
        ("post", "/v1/models/unload", {"model_id": "llama-3.1-8b-instruct"}),
    ],
)
def test_all_operational_routes_require_auth(
    keyed_client: TestClient,
    method: str,
    path: str,
    payload: dict | None,
):
    response = keyed_client.request(method, path, json=payload)
    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


def test_wrong_or_malformed_credentials_are_rejected(keyed_client: TestClient):
    for authorization in ("Bearer wrong", "Basic wrong", "Bearer"):
        response = keyed_client.get(
            "/v1/models", headers={"Authorization": authorization}
        )
        assert response.status_code == 401


def test_correct_credential_authorizes_list_load_chat_and_unload(
    keyed_client: TestClient,
):
    assert keyed_client.get("/v1/models", headers=_INFERENCE_HEADERS).status_code == 200
    assert (
        keyed_client.post(
            "/v1/models/load",
            headers=_ADMIN_HEADERS,
            json={"model_id": "llama-3.1-8b-instruct"},
        ).status_code
        == 200
    )
    assert (
        keyed_client.post(
            "/v1/chat/completions",
            headers=_INFERENCE_HEADERS,
            json={
                "tenant_id": _TEST_TENANT,
                "model": "llama-3.1-8b-instruct",
                "messages": [{"role": "user", "content": "hello"}],
            },
        ).status_code
        == 200
    )
    assert (
        keyed_client.post(
            "/v1/models/unload",
            headers=_ADMIN_HEADERS,
            json={"model_id": "llama-3.1-8b-instruct"},
        ).status_code
        == 200
    )


def test_only_minimal_probes_remain_public(keyed_client: TestClient):
    assert keyed_client.get("/health").status_code == 401
    assert keyed_client.get("/healthz").status_code == 200
    assert keyed_client.get("/ready").status_code == 503
    assert (
        keyed_client.get(
            "/health", headers=_INFERENCE_HEADERS
        ).status_code
        == 200
    )


def test_inference_credential_cannot_administer_models(keyed_client: TestClient):
    for path in ("/v1/models/load", "/v1/models/unload"):
        response = keyed_client.post(
            path,
            headers=_INFERENCE_HEADERS,
            json={"model_id": "llama-3.1-8b-instruct"},
        )
        assert response.status_code == 401


def test_model_admin_credential_cannot_infer(keyed_client: TestClient):
    response = keyed_client.get("/v1/models", headers=_ADMIN_HEADERS)
    assert response.status_code == 401


def test_inference_tenant_header_and_payload_are_correlated(keyed_client: TestClient):
    assert (
        keyed_client.get(
            "/v1/models",
            headers={"Authorization": f"Bearer {_TEST_CREDENTIAL}"},
        ).status_code
        == 400
    )
    assert (
        keyed_client.get(
            "/v1/models",
            headers={
                "Authorization": f"Bearer {_TEST_CREDENTIAL}",
                "X-Tenant-ID": "different-tenant",
            },
        ).status_code
        == 403
    )

    keyed_client.post(
        "/v1/models/load",
        headers=_ADMIN_HEADERS,
        json={"model_id": "llama-3.1-8b-instruct"},
    )
    missing_payload = keyed_client.post(
        "/v1/chat/completions",
        headers=_INFERENCE_HEADERS,
        json={
            "model": "llama-3.1-8b-instruct",
            "messages": [{"role": "user", "content": "hello"}],
        },
    )
    assert missing_payload.status_code == 400

    mismatched_payload = keyed_client.post(
        "/v1/chat/completions",
        headers=_INFERENCE_HEADERS,
        json={
            "tenant_id": "different-tenant",
            "model": "llama-3.1-8b-instruct",
            "messages": [{"role": "user", "content": "hello"}],
        },
    )
    assert mismatched_payload.status_code == 403

    matching_payload = keyed_client.post(
        "/v1/chat/completions",
        headers=_INFERENCE_HEADERS,
        json={
            "tenant_id": _TEST_TENANT,
            "model": "llama-3.1-8b-instruct",
            "messages": [{"role": "user", "content": "hello"}],
        },
    )
    assert matching_payload.status_code == 200
    assert matching_payload.json()["tenant_id"] == _TEST_TENANT


def test_production_startup_fails_without_credential(monkeypatch: pytest.MonkeyPatch):
    main = _import_app(monkeypatch, environment="production")
    with pytest.raises(RuntimeError, match="SUBSTRATE_API_KEY"):
        with TestClient(main.app):
            pass


def test_production_rejects_auth_bypass(monkeypatch: pytest.MonkeyPatch):
    main = _import_app(monkeypatch, environment="production", bypass="true")
    with pytest.raises(RuntimeError, match="permitted only"):
        with TestClient(main.app):
            pass


def test_production_rejects_wildcard_cors(monkeypatch: pytest.MonkeyPatch):
    main = _import_app(
        monkeypatch,
        api_key=_TEST_CREDENTIAL,
        api_tenant_id=_TEST_TENANT,
        model_admin_api_key=_TEST_ADMIN_CREDENTIAL,
        environment="production",
        extra_environment={"SUBSTRATE_ALLOWED_ORIGINS": "*"},
    )
    with pytest.raises(RuntimeError, match="wildcard"):
        with TestClient(main.app):
            pass


def test_production_rejects_stub_engine_even_with_credential(
    monkeypatch: pytest.MonkeyPatch,
):
    main = _import_app(
        monkeypatch,
        api_key=_TEST_CREDENTIAL,
        api_tenant_id=_TEST_TENANT,
        model_admin_api_key=_TEST_ADMIN_CREDENTIAL,
        environment="production",
        extra_environment={
            "SUBSTRATE_MODEL_REVISIONS_JSON": (
                '{"llama-3.1-8b-instruct":"' + "a" * 40 + '"}'
            )
        },
    )
    with pytest.raises(RuntimeError, match="STUB mode is development/test only"):
        with TestClient(main.app):
            pass


def test_production_requires_an_immutable_model_revision_mapping(
    monkeypatch: pytest.MonkeyPatch,
):
    main = _import_app(
        monkeypatch,
        api_key=_TEST_CREDENTIAL,
        api_tenant_id=_TEST_TENANT,
        model_admin_api_key=_TEST_ADMIN_CREDENTIAL,
        environment="production",
    )
    with pytest.raises(RuntimeError, match="SUBSTRATE_MODEL_REVISIONS_JSON"):
        with TestClient(main.app):
            pass


def test_production_marker_wins_over_development_marker(
    monkeypatch: pytest.MonkeyPatch,
):
    main = _import_app(
        monkeypatch,
        environment="development",
        bypass="true",
        extra_environment={"NODE_ENV": "production"},
    )
    with pytest.raises(RuntimeError, match="permitted only"):
        with TestClient(main.app):
            pass


@pytest.mark.parametrize(
    "marker",
    ["RUNTIME_MODE", "APP_ENV", "NODE_ENV", "SZL_ENV", "SUBSTRATE_INFERENCE_ENV"],
)
def test_every_production_marker_dominates_conflicting_test_mode(
    monkeypatch: pytest.MonkeyPatch,
    marker: str,
):
    main = _import_app(
        monkeypatch,
        environment="test",
        bypass="true",
        extra_environment={marker: "production"},
    )
    with pytest.raises(RuntimeError, match="permitted only"):
        with TestClient(main.app):
            pass


def test_invalid_runtime_mode_is_startup_fatal(monkeypatch: pytest.MonkeyPatch):
    main = _import_app(
        monkeypatch,
        api_key=_TEST_CREDENTIAL,
        environment="test",
        extra_environment={"RUNTIME_MODE": "prodution"},
    )
    with pytest.raises(RuntimeError, match="RUNTIME_MODE must be one of"):
        with TestClient(main.app):
            pass


def test_bypass_requires_an_explicit_development_or_test_environment(
    monkeypatch: pytest.MonkeyPatch,
):
    main = _import_app(monkeypatch, bypass="true")
    with pytest.raises(RuntimeError, match="requires SUBSTRATE_INFERENCE_ENV"):
        with TestClient(main.app):
            pass


def test_credential_with_surrounding_whitespace_is_rejected(
    monkeypatch: pytest.MonkeyPatch,
):
    main = _import_app(
        monkeypatch,
        api_key=" credential-with-unsafe-whitespace ",
        environment="test",
    )
    with pytest.raises(RuntimeError, match="surrounding whitespace"):
        with TestClient(main.app):
            pass


def test_production_requires_tenant_and_separate_admin_credentials(
    monkeypatch: pytest.MonkeyPatch,
):
    missing_tenant = _import_app(
        monkeypatch,
        api_key=_TEST_CREDENTIAL,
        environment="production",
    )
    with pytest.raises(RuntimeError, match="SUBSTRATE_API_TENANT_ID"):
        with TestClient(missing_tenant.app):
            pass


def test_production_readiness_and_chat_hold_before_runtime_execution(
    monkeypatch: pytest.MonkeyPatch,
):
    main = _import_app(
        monkeypatch,
        api_key=_TEST_CREDENTIAL,
        api_tenant_id=_TEST_TENANT,
        model_admin_api_key=_TEST_ADMIN_CREDENTIAL,
        environment="test",
    )
    with TestClient(main.app) as client:
        main.app.state.security_config = replace(
            main.app.state.security_config,
            environment="production",
        )
        calls = {"complete": 0, "stream": 0, "load": 0, "unload": 0}

        async def forbidden_complete(**_kwargs):
            calls["complete"] += 1
            raise AssertionError("production HOLD must precede runtime.complete")

        async def forbidden_stream(**_kwargs):
            calls["stream"] += 1
            raise AssertionError("production HOLD must precede runtime.stream_complete")

        async def forbidden_load(*_args, **_kwargs):
            calls["load"] += 1
            raise AssertionError("production HOLD must precede runtime.load_model")

        async def forbidden_unload(*_args, **_kwargs):
            calls["unload"] += 1
            raise AssertionError("production HOLD must precede runtime.unload_model")

        monkeypatch.setattr(main.runtime, "complete", forbidden_complete)
        monkeypatch.setattr(main.runtime, "stream_complete", forbidden_stream)
        monkeypatch.setattr(main.runtime, "load_model", forbidden_load)
        monkeypatch.setattr(main.runtime, "unload_model", forbidden_unload)

        readiness = client.get("/ready")
        assert readiness.status_code == 503
        assert readiness.json()["code"] == "PRODUCTION_INFERENCE_UNQUALIFIED"

        for stream in (False, True):
            response = client.post(
                "/v1/chat/completions",
                headers=_INFERENCE_HEADERS,
                json={
                    "tenant_id": _TEST_TENANT,
                    "model": "llama-3.1-8b-instruct",
                    "messages": [{"role": "user", "content": "must not execute"}],
                    "stream": stream,
                },
            )
            assert response.status_code == 503
            assert (
                response.json()["detail"]["code"]
                == "PRODUCTION_INFERENCE_UNQUALIFIED"
            )
        for path in ("/v1/models/load", "/v1/models/unload"):
            response = client.post(
                path,
                headers=_ADMIN_HEADERS,
                json={"model_id": "llama-3.1-8b-instruct"},
            )
            assert response.status_code == 503
            assert (
                response.json()["detail"]["code"]
                == "PRODUCTION_INFERENCE_UNQUALIFIED"
            )
        assert calls == {"complete": 0, "stream": 0, "load": 0, "unload": 0}


def test_production_default_model_autoload_is_held(monkeypatch: pytest.MonkeyPatch):
    main = _import_app(
        monkeypatch,
        api_key=_TEST_CREDENTIAL,
        api_tenant_id=_TEST_TENANT,
        model_admin_api_key=_TEST_ADMIN_CREDENTIAL,
        environment="production",
        extra_environment={
            "SUBSTRATE_DEFAULT_MODEL": "llama-3.1-8b-instruct",
            "SUBSTRATE_MODEL_REVISIONS_JSON": (
                '{"llama-3.1-8b-instruct":"' + "a" * 40 + '"}'
            ),
        },
    )
    calls = {"load": 0}

    class FakeLiveRuntime:
        mode = main.EngineMode.LIVE

        def __init__(self, **_kwargs):
            self.loaded_model_ids = []

        async def load_model(self, *_args, **_kwargs):
            calls["load"] += 1

    monkeypatch.setattr(main, "SubstrateRuntime", FakeLiveRuntime)
    with TestClient(main.app) as client:
        response = client.get("/ready")
        assert response.status_code == 503
        assert response.json()["code"] == "PRODUCTION_INFERENCE_UNQUALIFIED"
    assert calls["load"] == 0

    missing_admin = _import_app(
        monkeypatch,
        api_key=_TEST_CREDENTIAL,
        api_tenant_id=_TEST_TENANT,
        environment="production",
    )
    with pytest.raises(RuntimeError, match="SUBSTRATE_MODEL_ADMIN_API_KEY"):
        with TestClient(missing_admin.app):
            pass

    shared_credential = _import_app(
        monkeypatch,
        api_key=_TEST_CREDENTIAL,
        api_tenant_id=_TEST_TENANT,
        model_admin_api_key=_TEST_CREDENTIAL,
        environment="production",
    )
    with pytest.raises(RuntimeError, match="must be distinct"):
        with TestClient(shared_credential.app):
            pass


def test_explicit_test_bypass_allows_local_contract_testing(
    monkeypatch: pytest.MonkeyPatch,
):
    main = _import_app(monkeypatch, environment="test", bypass="true")
    with TestClient(main.app) as client:
        assert client.get("/v1/models").status_code == 200
