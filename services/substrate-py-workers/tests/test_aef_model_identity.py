"""The development AEF endpoints must never mint a caller-selected model identity."""

from __future__ import annotations

import math

import pytest
from httpx import ASGITransport, AsyncClient

from worker.aef_endpoints import AEF_DEV_MODEL, AEF_FALLBACK_RERANK_MODEL
from worker.main import app

_TENANT_HEADERS = {"X-Tenant-ID": "tenant-test"}


@pytest.mark.asyncio
async def test_embed_returns_only_server_owned_model_identity() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/aef/embed",
            headers=_TENANT_HEADERS,
            json={"texts": ["governed evidence"], "model": AEF_DEV_MODEL},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["model"] == AEF_DEV_MODEL
    vector = body["vectors"][0]
    assert len(vector) == body["dimensions"]
    assert all(math.isfinite(value) for value in vector)
    assert math.isclose(
        math.sqrt(sum(value * value for value in vector)),
        1.0,
        rel_tol=1e-12,
        abs_tol=1e-12,
    )


@pytest.mark.asyncio
async def test_embed_rejects_false_external_model_identity() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/aef/embed",
            headers=_TENANT_HEADERS,
            json={"texts": ["governed evidence"], "model": "BAAI/bge-m3"},
        )

    assert response.status_code == 422
    assert "BAAI/bge-m3" not in response.text
    assert AEF_DEV_MODEL in response.text


@pytest.mark.asyncio
async def test_rerank_returns_only_server_owned_model_identity() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/aef/rerank",
            headers=_TENANT_HEADERS,
            json={
                "query": "governed",
                "candidates": [{"id": "candidate-1", "text": "governed evidence"}],
                "model": AEF_FALLBACK_RERANK_MODEL,
            },
        )

    assert response.status_code == 200
    body = response.json()
    assert body["model"] == AEF_FALLBACK_RERANK_MODEL
    assert body["model_revision"] == "builtin-lexical-overlap-v1"
    assert body["artifact_set_digest"] is None
    assert body["promotion_state"] == "DEVELOPMENT"


@pytest.mark.asyncio
async def test_rerank_rejects_false_external_model_identity() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post(
            "/aef/rerank",
            headers=_TENANT_HEADERS,
            json={
                "query": "governed",
                "candidates": [{"id": "candidate-1", "text": "governed evidence"}],
                "model": "cross-encoder/ms-marco-MiniLM-L-6-v2",
            },
        )

    assert response.status_code == 422
    assert "cross-encoder" not in response.text
    assert AEF_FALLBACK_RERANK_MODEL in response.text


@pytest.mark.asyncio
async def test_development_aef_backends_are_unavailable_in_production(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setenv("NODE_ENV", "production")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        embed = await client.post(
            "/aef/embed",
            headers=_TENANT_HEADERS,
            json={"texts": ["evidence"]},
        )
        rerank = await client.post(
            "/aef/rerank",
            headers=_TENANT_HEADERS,
            json={
                "query": "evidence",
                "candidates": [{"id": "candidate-1", "text": "evidence"}],
            },
        )

    assert embed.status_code == 503
    assert rerank.status_code == 503


@pytest.mark.asyncio
async def test_aef_helpers_require_tenant_context_even_in_test_bypass() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/aef/embed", json={"texts": ["evidence"]})

    assert response.status_code == 400
    assert "X-Tenant-ID" in response.json()["detail"]


@pytest.mark.asyncio
async def test_development_helpers_reject_ignored_execution_options() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        embed = await client.post(
            "/aef/embed",
            headers=_TENANT_HEADERS,
            json={"texts": ["evidence"], "pooling": "cls", "normalize": False},
        )
        rerank = await client.post(
            "/aef/rerank",
            headers=_TENANT_HEADERS,
            json={
                "query": "evidence",
                "candidates": [{"id": "candidate-1", "text": "evidence"}],
                "top_k": 0,
            },
        )

    assert embed.status_code == 422
    assert rerank.status_code == 422
