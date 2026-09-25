from __future__ import annotations

import hashlib
from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from worker import ovis_omni
from worker.aef_endpoints import aef_router


class FakeRuntime:
    def embed_items(self, items: list[ovis_omni.OvisItem]) -> list[ovis_omni.OvisVector]:
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
