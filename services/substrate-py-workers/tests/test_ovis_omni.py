from __future__ import annotations

import hashlib
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from starlette.requests import Request

from worker import ovis_omni
from worker.aef_endpoints import aef_router
from worker.ovis_boundary import OvisBoundaryMiddleware


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
    monkeypatch.delenv("OVIS_INTERNAL_API_KEY_FILE", raising=False)
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


def test_embed_route_maps_runtime_gate_failure(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OVIS_OMNI_ENABLED", "0")

    response = client.post("/aef/ovis/embed", json=_request())

    assert response.status_code == 503
    assert response.json()["detail"] == "OVIS_RUNTIME_DISABLED"


def test_ovis_boundary_authenticates_before_json_parsing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OVIS_INTERNAL_API_KEY", "evaluation-secret")
    monkeypatch.delenv("OVIS_INTERNAL_API_KEY_FILE", raising=False)
    app = FastAPI()
    app.include_router(aef_router)
    app.add_middleware(OvisBoundaryMiddleware, max_body_bytes=128)

    with TestClient(app) as boundary_client:
        response = boundary_client.post(
            "/aef/ovis/embed",
            content=b"this is deliberately invalid json",
            headers={"Content-Type": "application/json"},
        )

    assert response.status_code == 401
    assert response.json() == {"detail": "Unauthorized"}


def test_ovis_boundary_rejects_oversized_body_before_parsing(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OVIS_INTERNAL_API_KEY", "evaluation-secret")
    monkeypatch.delenv("OVIS_INTERNAL_API_KEY_FILE", raising=False)
    app = FastAPI()
    app.include_router(aef_router)
    app.add_middleware(OvisBoundaryMiddleware, max_body_bytes=128)

    with TestClient(app) as boundary_client:
        response = boundary_client.post(
            "/aef/ovis/embed",
            content=b"x" * 129,
            headers={
                "Authorization": "Bearer evaluation-secret",
                "Content-Type": "application/json",
            },
        )

    assert response.status_code == 413
    assert response.json() == {
        "detail": "Ovis request body exceeds the admitted size"
    }


@pytest.mark.asyncio
async def test_ovis_boundary_limits_streamed_body_without_content_length(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OVIS_INTERNAL_API_KEY", "evaluation-secret")
    monkeypatch.delenv("OVIS_INTERNAL_API_KEY_FILE", raising=False)
    app = FastAPI()
    app.include_router(aef_router)
    app.add_middleware(OvisBoundaryMiddleware, max_body_bytes=128)

    async def body_chunks():
        yield b"x" * 65
        yield b"y" * 64

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as boundary_client:
        response = await boundary_client.post(
            "/aef/ovis/embed",
            content=body_chunks(),
            headers={
                "Authorization": "Bearer evaluation-secret",
                "Content-Type": "application/json",
            },
        )

    assert response.status_code == 413
    assert response.json() == {
        "detail": "Ovis request body exceeds the admitted size"
    }


def test_ovis_request_rejects_oversized_metadata(client: TestClient) -> None:
    request = _request()
    request["metadata"] = {"payload": "x" * ovis_omni.MAX_METADATA_BYTES}

    response = client.post("/aef/ovis/embed", json=request)

    assert response.status_code == 422


def test_production_gate_requires_qualification_receipt(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OVIS_OMNI_ENABLED", "1")
    monkeypatch.setenv("NODE_ENV", "production")
    monkeypatch.setenv("OVIS_PROMOTION_STATE", "EVALUATION_HOLD")
    monkeypatch.delenv("OVIS_QUALIFICATION_RECEIPT_SHA256", raising=False)
    with pytest.raises(ovis_omni.OvisRuntimeError, match="not qualified") as caught:
        ovis_omni._assert_runtime_gate()
    assert caught.value.code == "OVIS_NOT_QUALIFIED"


def test_evaluation_gate_rejects_parallel_inference_configuration(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OVIS_OMNI_ENABLED", "1")
    monkeypatch.setenv("OVIS_MAX_CONCURRENCY", "2")
    monkeypatch.setenv("NODE_ENV", "test")

    with pytest.raises(ovis_omni.OvisRuntimeError) as caught:
        ovis_omni._assert_runtime_gate()

    assert caught.value.code == "OVIS_CONCURRENCY_NOT_ADMITTED"


def test_canonical_hold_cannot_be_bypassed_by_receipt_environment(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OVIS_OMNI_ENABLED", "1")
    monkeypatch.setenv("OVIS_MAX_CONCURRENCY", "1")
    monkeypatch.setenv("OVIS_PROMOTION_STATE", "QUALIFIED")
    monkeypatch.setenv("NODE_ENV", "test")
    monkeypatch.delenv("OVIS_QUALIFICATION_RECEIPT_SHA256", raising=False)

    with pytest.raises(ovis_omni.OvisRuntimeError) as caught:
        ovis_omni._assert_runtime_gate()

    assert caught.value.code == "OVIS_NOT_QUALIFIED"

    monkeypatch.setenv("OVIS_QUALIFICATION_RECEIPT_SHA256", "0" * 64)
    monkeypatch.setenv("OVIS_VERIFY_ARTIFACTS", "0")
    with pytest.raises(ovis_omni.OvisRuntimeError) as caught:
        ovis_omni._assert_runtime_gate()
    assert caught.value.code == "OVIS_NOT_QUALIFIED"


def test_dependency_version_drift_fails_closed(monkeypatch: pytest.MonkeyPatch) -> None:
    admitted = {
        "accelerate": ovis_omni.ACCELERATE_VERSION,
        "transformers": ovis_omni.TRANSFORMERS_VERSION,
        "torch": ovis_omni.TORCH_VERSION,
        "qwen-omni-utils": ovis_omni.QWEN_OMNI_UTILS_VERSION,
    }

    monkeypatch.setattr(
        ovis_omni.importlib_metadata,
        "version",
        lambda distribution: "5.10.1"
        if distribution == "transformers"
        else admitted[distribution],
    )

    with pytest.raises(ovis_omni.OvisRuntimeError) as caught:
        ovis_omni._assert_dependency_versions()
    assert caught.value.code == "OVIS_DEPENDENCY_VERSION_MISMATCH"


def test_health_fails_closed_on_dependency_drift(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    admitted = {
        "accelerate": ovis_omni.ACCELERATE_VERSION,
        "transformers": ovis_omni.TRANSFORMERS_VERSION,
        "torch": ovis_omni.TORCH_VERSION,
        "qwen-omni-utils": ovis_omni.QWEN_OMNI_UTILS_VERSION,
    }
    monkeypatch.setattr(
        ovis_omni.importlib_metadata,
        "version",
        lambda distribution: "5.10.1"
        if distribution == "transformers"
        else admitted[distribution],
    )

    response = client.get("/aef/ovis/health")

    assert response.status_code == 503
    assert response.json()["detail"]["gateCode"] == "OVIS_DEPENDENCY_VERSION_MISMATCH"


def test_health_maps_invalid_promotion_state(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OVIS_PROMOTION_STATE", "invalid")

    response = client.get("/aef/ovis/health")

    assert response.status_code == 503
    assert response.json()["detail"]["gateCode"] == "INVALID_PROMOTION_STATE"
    assert response.json()["detail"]["promotionState"] is None


def test_internal_auth_accepts_secret_file(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    secret_path = tmp_path / "internal-api-key"
    secret_path.write_text("evaluation-secret\n", encoding="utf-8")
    monkeypatch.setenv("OVIS_OMNI_ENABLED", "1")
    monkeypatch.setenv("OVIS_PROMOTION_STATE", "EVALUATION_HOLD")
    monkeypatch.setenv("NODE_ENV", "test")
    monkeypatch.delenv("OVIS_INTERNAL_API_KEY", raising=False)
    monkeypatch.setenv("OVIS_INTERNAL_API_KEY_FILE", str(secret_path))

    request = _request()
    app = FastAPI()
    app.include_router(aef_router)
    monkeypatch.setattr(ovis_omni, "_runtime", FakeRuntime())
    with TestClient(app) as test_client:
        unauthorized = test_client.post("/aef/ovis/embed", json=request)
        authorized = test_client.post(
            "/aef/ovis/embed",
            json=request,
            headers={"Authorization": "Bearer evaluation-secret"},
        )

    assert unauthorized.status_code == 401
    assert authorized.status_code == 200


def test_internal_auth_rejects_secret_file_symlink(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    secret_path = tmp_path / "internal-api-key"
    secret_path.write_text("evaluation-secret\n", encoding="utf-8")
    secret_link = tmp_path / "internal-api-key-link"
    secret_link.symlink_to(secret_path)
    monkeypatch.delenv("OVIS_INTERNAL_API_KEY", raising=False)
    monkeypatch.setenv("OVIS_INTERNAL_API_KEY_FILE", str(secret_link))

    with pytest.raises(ovis_omni.OvisRuntimeError) as caught:
        ovis_omni._internal_api_key()

    assert caught.value.code == "OVIS_INTERNAL_API_KEY_FILE_INVALID"


def test_internal_auth_rejects_oversized_secret_file(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    secret_path = tmp_path / "internal-api-key"
    secret_path.write_bytes(b"x" * (ovis_omni.MAX_INTERNAL_API_KEY_BYTES + 1))
    monkeypatch.delenv("OVIS_INTERNAL_API_KEY", raising=False)
    monkeypatch.setenv("OVIS_INTERNAL_API_KEY_FILE", str(secret_path))

    with pytest.raises(ovis_omni.OvisRuntimeError) as caught:
        ovis_omni._internal_api_key()

    assert caught.value.code == "OVIS_INTERNAL_API_KEY_FILE_INVALID"


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
        "OVIS_INTERNAL_API_KEY_FILE",
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
    assert auth_error.value.detail == (
        "OVIS_INTERNAL_API_KEY or OVIS_INTERNAL_API_KEY_FILE is required"
    )


def test_production_ovis_credential_is_bound_to_request_tenant(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("OVIS_OMNI_ENABLED", "1")
    monkeypatch.setenv("SUBSTRATE_PYTHON_WORKER_ENV", "production")
    monkeypatch.setenv("OVIS_PROMOTION_STATE", "QUALIFIED")
    monkeypatch.setenv("OVIS_QUALIFICATION_RECEIPT_SHA256", "a" * 64)
    monkeypatch.setenv("OVIS_VERIFY_ARTIFACTS", "1")
    monkeypatch.setenv("OVIS_INTERNAL_API_KEY", "production-ovis-test-credential")
    monkeypatch.delenv("OVIS_INTERNAL_API_KEY_FILE", raising=False)
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
    monkeypatch.delenv("OVIS_INTERNAL_API_KEY_FILE", raising=False)
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
    monkeypatch.delenv("OVIS_INTERNAL_API_KEY_FILE", raising=False)
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


def test_model_snapshot_requires_flattened_regular_files(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    payload = b"admitted-model-artifact"
    digest = hashlib.sha256(payload).hexdigest()
    relative_path = "model/weights.bin"
    monkeypatch.setattr(
        ovis_omni,
        "EXPECTED_ARTIFACTS",
        {relative_path: (digest, len(payload))},
    )

    flat_snapshot = tmp_path / "flat"
    flat_artifact = flat_snapshot / relative_path
    flat_artifact.parent.mkdir(parents=True)
    flat_artifact.write_bytes(payload)
    ovis_omni._verify_snapshot(flat_snapshot)

    cache_snapshot = tmp_path / "cache" / "snapshots" / "revision"
    cache_artifact = cache_snapshot / relative_path
    cache_artifact.parent.mkdir(parents=True)
    blob = tmp_path / "cache" / "blobs" / digest
    blob.parent.mkdir(parents=True)
    blob.write_bytes(payload)
    cache_artifact.symlink_to(blob)

    with pytest.raises(ovis_omni.OvisRuntimeError) as caught:
        ovis_omni._verify_snapshot(cache_snapshot)
    assert caught.value.code == "MODEL_SNAPSHOT_SYMLINK_REJECTED"

    unlisted_snapshot = tmp_path / "unlisted"
    admitted_artifact = unlisted_snapshot / relative_path
    admitted_artifact.parent.mkdir(parents=True)
    admitted_artifact.write_bytes(payload)
    outside_config = tmp_path / "config.json"
    outside_config.write_text("{}", encoding="utf-8")
    (unlisted_snapshot / "model" / "config.json").symlink_to(outside_config)

    with pytest.raises(ovis_omni.OvisRuntimeError) as caught:
        ovis_omni._verify_snapshot(unlisted_snapshot)
    assert caught.value.code == "MODEL_SNAPSHOT_SYMLINK_REJECTED"


def test_verified_snapshot_requires_an_explicit_root(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("OVIS_MODEL_SNAPSHOT_ROOT", raising=False)
    monkeypatch.setenv("OVIS_VERIFY_ARTIFACTS", "1")

    with pytest.raises(ovis_omni.OvisRuntimeError) as caught:
        ovis_omni._resolve_model_snapshot(lambda **_kwargs: tmp_path)
    assert caught.value.code == "MODEL_SNAPSHOT_ROOT_REQUIRED"

    monkeypatch.setenv("OVIS_MODEL_SNAPSHOT_ROOT", str(tmp_path))
    assert ovis_omni._resolve_model_snapshot(lambda **_kwargs: None) == tmp_path.resolve()


def test_runtime_serializes_embedding_requests(monkeypatch: pytest.MonkeyPatch) -> None:
    runtime = ovis_omni.OvisOmniRuntime()
    item = ovis_omni.OvisItem(
        item_id="item-1",
        instruction="Retrieve matching evidence.",
        segments=[ovis_omni.TextSegment(kind="text", text="governed retrieval")],
    )
    state_lock = threading.Lock()
    first_started = threading.Event()
    overlap_detected = threading.Event()
    release = threading.Event()
    active = 0

    def blocked_embed(_item: ovis_omni.OvisItem) -> ovis_omni.OvisVector:
        nonlocal active
        with state_lock:
            active += 1
            if active > 1:
                overlap_detected.set()
        first_started.set()
        release.wait(timeout=2)
        with state_lock:
            active -= 1
        return ovis_omni.OvisVector(
            item_id="item-1",
            vector=[0.0] * ovis_omni.NATIVE_DIMENSIONS,
            input_digest="0" * 64,
            modalities=["text"],
            token_count=1,
        )

    monkeypatch.setattr(runtime, "_embed_one", blocked_embed)
    with ThreadPoolExecutor(max_workers=2) as executor:
        first = executor.submit(runtime.embed_items, [item])
        assert first_started.wait(timeout=1)
        second = executor.submit(runtime.embed_items, [item])
        try:
            assert not overlap_detected.wait(timeout=0.1)
        finally:
            release.set()
        assert first.result(timeout=1)
        assert second.result(timeout=1)


def test_embed_route_rejects_concurrent_request(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    started = threading.Event()
    release = threading.Event()

    class BlockingRuntime(FakeRuntime):
        def embed_items(
            self,
            items: list[ovis_omni.OvisItem],
        ) -> list[ovis_omni.OvisVector]:
            started.set()
            release.wait(timeout=2)
            return super().embed_items(items)

    monkeypatch.setattr(ovis_omni, "_runtime", BlockingRuntime())
    with ThreadPoolExecutor(max_workers=1) as executor:
        first = executor.submit(client.post, "/aef/ovis/embed", json=_request())
        assert started.wait(timeout=1)
        try:
            second = client.post("/aef/ovis/embed", json=_request())
            assert second.status_code == 429
            assert second.json()["detail"] == "OVIS_INFERENCE_BUSY"
        finally:
            release.set()
        assert first.result(timeout=1).status_code == 200
