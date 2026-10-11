from __future__ import annotations

import hashlib
from pathlib import Path

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from starlette.requests import Request

from worker import ovis_omni
from worker.aef_endpoints import aef_router


class FakeRuntime:
    def __init__(self) -> None:
        self.embed_calls = 0

    def embed_items(self, items: list[ovis_omni.OvisItem]) -> list[ovis_omni.OvisVector]:
        self.embed_calls += 1
        return [
            ovis_omni.OvisVector(
                item_id=item.item_id,
                vector=[0.0] * ovis_omni.NATIVE_DIMENSIONS,
                input_digest=ovis_omni._input_digest(item),
                modalities=["text"],
                token_count=3,
            )
            for item in items
        ]


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    monkeypatch.setenv("OVIS_OMNI_ENABLED", "1")
    monkeypatch.setenv("OVIS_PROMOTION_STATE", "EVALUATION_HOLD")
    monkeypatch.setenv("NODE_ENV", "test")
    monkeypatch.delenv("OVIS_INTERNAL_API_KEY", raising=False)
    monkeypatch.delenv("OVIS_INTERNAL_TENANT_ID", raising=False)
    monkeypatch.setattr(ovis_omni, "_runtime", FakeRuntime())
    app = FastAPI()
    app.include_router(aef_router)
    return TestClient(app)


def _request(dimensions: int = 2048) -> dict:
    return {
        "requestId": "req-1",
        "tenantId": "tenant-1",
        "modelId": ovis_omni.MODEL_ID,
        "modelRevision": ovis_omni.MODEL_REVISION,
        "dimensions": dimensions,
        "normalize": True,
        "items": [
            {
                "itemId": "item-1",
                "instruction": "Retrieve matching evidence.",
                "segments": [{"kind": "text", "text": "governed retrieval"}],
            }
        ],
        "metadata": {},
    }


def test_exact_revision_response_is_receipt_bound(client: TestClient) -> None:
    response = client.post("/aef/ovis/embed", json=_request())
    assert response.status_code == 200
    body = response.json()
    assert body["modelId"] == ovis_omni.MODEL_ID
    assert body["modelRevision"] == ovis_omni.MODEL_REVISION
    assert body["execution"]["artifactSetDigest"] == ovis_omni.ARTIFACT_SET_DIGEST
    assert body["execution"]["promotionState"] == "EVALUATION_HOLD"
    assert len(body["vectors"][0]["vector"]) == ovis_omni.NATIVE_DIMENSIONS


def test_projection_without_admitted_asset_is_rejected(client: TestClient) -> None:
    response = client.post("/aef/ovis/embed", json=_request(dimensions=1024))
    assert response.status_code == 409
    assert response.json()["detail"] == "PROJECTION_ASSET_NOT_ADMITTED"


def test_production_gate_requires_qualification_receipt(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OVIS_OMNI_ENABLED", "1")
    monkeypatch.setenv("NODE_ENV", "production")
    monkeypatch.setenv("OVIS_PROMOTION_STATE", "EVALUATION_HOLD")
    monkeypatch.delenv("OVIS_QUALIFICATION_RECEIPT_SHA256", raising=False)
    with pytest.raises(ovis_omni.OvisRuntimeError, match="not qualified") as caught:
        ovis_omni._assert_runtime_gate()
    assert caught.value.code == "OVIS_NOT_QUALIFIED"


def test_worker_environment_production_marker_enforces_all_ovis_gates(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OVIS_OMNI_ENABLED", "1")
    monkeypatch.setenv("SUBSTRATE_PYTHON_WORKER_ENV", "production")
    monkeypatch.setenv("OVIS_PROMOTION_STATE", "EVALUATION_HOLD")
    for name in (
        "NODE_ENV",
        "APP_ENV",
        "SZL_ENV",
        "OVIS_QUALIFICATION_RECEIPT_SHA256",
        "OVIS_INTERNAL_API_KEY",
        "OVIS_INTERNAL_TENANT_ID",
    ):
        monkeypatch.delenv(name, raising=False)

    with pytest.raises(ovis_omni.OvisRuntimeError, match="not qualified") as caught:
        ovis_omni._assert_runtime_gate()
    assert caught.value.code == "OVIS_NOT_QUALIFIED"

    request = Request({"type": "http", "headers": []})
    with pytest.raises(HTTPException) as auth_error:
        ovis_omni._require_internal_auth(request)
    assert auth_error.value.status_code == 503
    assert auth_error.value.detail == "OVIS_INTERNAL_API_KEY is required"


def test_production_ovis_credential_is_bound_to_request_tenant(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OVIS_OMNI_ENABLED", "1")
    monkeypatch.setenv("SUBSTRATE_PYTHON_WORKER_ENV", "production")
    monkeypatch.setenv("OVIS_PROMOTION_STATE", "QUALIFIED")
    monkeypatch.setenv("OVIS_QUALIFICATION_RECEIPT_SHA256", "a" * 64)
    monkeypatch.setenv("OVIS_VERIFY_ARTIFACTS", "1")
    monkeypatch.setenv("OVIS_INTERNAL_API_KEY", "production-ovis-test-credential")
    monkeypatch.setenv("OVIS_INTERNAL_TENANT_ID", "tenant-bound")
    monkeypatch.setattr(ovis_omni, "_runtime", FakeRuntime())

    app = FastAPI()
    app.include_router(aef_router)
    with TestClient(app) as production_client:
        response = production_client.post(
            "/aef/ovis/embed",
            headers={"Authorization": "Bearer production-ovis-test-credential"},
            json={**_request(), "tenantId": "tenant-other"},
        )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "Authenticated Ovis credential is not authorized for this tenant"
    }


def test_fake_qualification_digest_holds_before_runtime(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OVIS_OMNI_ENABLED", "1")
    monkeypatch.setenv("SUBSTRATE_PYTHON_WORKER_ENV", "production")
    monkeypatch.setenv("OVIS_PROMOTION_STATE", "QUALIFIED")
    monkeypatch.setenv("OVIS_QUALIFICATION_RECEIPT_SHA256", "a" * 64)
    monkeypatch.setenv("OVIS_VERIFY_ARTIFACTS", "1")
    monkeypatch.setenv("OVIS_INTERNAL_API_KEY", "production-ovis-test-credential")
    monkeypatch.setenv("OVIS_INTERNAL_TENANT_ID", "tenant-1")
    fake_runtime = FakeRuntime()
    runtime_lookups = 0

    def observed_runtime() -> FakeRuntime:
        nonlocal runtime_lookups
        runtime_lookups += 1
        return fake_runtime

    monkeypatch.setattr(ovis_omni, "get_runtime", observed_runtime)

    app = FastAPI()
    app.include_router(aef_router)
    with TestClient(app) as production_client:
        response = production_client.post(
            "/aef/ovis/embed",
            headers={"Authorization": "Bearer production-ovis-test-credential"},
            json=_request(),
        )

    assert response.status_code == 503
    assert response.json() == {"detail": "OVIS_NOT_QUALIFIED"}
    assert runtime_lookups == 0
    assert fake_runtime.embed_calls == 0


def test_production_ovis_requires_server_side_tenant_binding(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("SUBSTRATE_PYTHON_WORKER_ENV", "production")
    monkeypatch.setenv("OVIS_INTERNAL_API_KEY", "production-ovis-test-credential")
    monkeypatch.delenv("OVIS_INTERNAL_TENANT_ID", raising=False)
    request = Request(
        {
            "type": "http",
            "headers": [(b"authorization", b"Bearer production-ovis-test-credential")],
        }
    )

    with pytest.raises(HTTPException) as caught:
        ovis_omni._require_internal_auth(request)

    assert caught.value.status_code == 503
    assert "OVIS_INTERNAL_TENANT_ID" in str(caught.value.detail)


def test_cas_resolution_verifies_path_size_and_digest(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = b"immutable-image-bytes"
    digest = hashlib.sha256(payload).hexdigest()
    root = tmp_path / "cas"
    asset_path = root / "sha256" / digest
    asset_path.parent.mkdir(parents=True)
    asset_path.write_bytes(payload)
    monkeypatch.setenv("OVIS_ASSET_ROOT", str(root))

    asset = ovis_omni.OvisAsset(
        asset_id="asset-1",
        uri=f"cas://sha256/{digest}",
        sha256=digest,
        media_type="image/png",
        byte_length=len(payload),
        modality="image",
    )
    assert ovis_omni._resolve_asset(asset) == asset_path.resolve()

    asset_path.write_bytes(b"tampered")
    with pytest.raises(ovis_omni.OvisRuntimeError) as caught:
        ovis_omni._resolve_asset(asset)
    assert caught.value.code in {"CAS_SIZE_MISMATCH", "CAS_DIGEST_MISMATCH"}
