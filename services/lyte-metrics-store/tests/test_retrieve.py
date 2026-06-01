"""HTTP-level tests for the Lyte metrics store."""

from __future__ import annotations

import os

import httpx
import pytest

from lyte_metrics_store.corpus import LYTE_CORPUS
from lyte_metrics_store.main import app
from lyte_metrics_store.retrieval import top_k_documents


# ─── Pure scoring tests ───────────────────────────────────────────────────────


class TestScoring:
    def test_corpus_is_non_empty(self):
        assert len(LYTE_CORPUS) >= 25

    def test_latency_query_surfaces_latency_anomaly_first(self):
        docs = top_k_documents(
            "latency spike on lyte-api-gateway",
            top_k=5,
            min_relevance_score=0.0,
            filters=None,
            corpus=LYTE_CORPUS,
        )
        assert docs
        assert "lyte-api-gateway" in docs[0]["content"]
        assert docs[0]["metadata"]["kind"] in {
            "latency-anomaly",
            "slo-snapshot",
            "alert-digest",
        }

    def test_capacity_query_surfaces_capacity_docs(self):
        docs = top_k_documents(
            "capacity headroom drift across the fleet",
            top_k=10,
            min_relevance_score=0.0,
            filters=None,
            corpus=LYTE_CORPUS,
        )
        assert docs
        assert any(d["metadata"]["kind"] == "capacity-trend" for d in docs)

    def test_filter_restricts_to_service(self):
        docs = top_k_documents(
            "anomaly",
            top_k=20,
            min_relevance_score=0.0,
            filters={"service": "lyte-data-pipeline"},
            corpus=LYTE_CORPUS,
        )
        assert docs
        assert all(d["metadata"]["service"] == "lyte-data-pipeline" for d in docs)

    def test_min_relevance_score_filters(self):
        docs = top_k_documents(
            "completely irrelevant string xyzzy",
            top_k=10,
            min_relevance_score=0.6,
            filters=None,
            corpus=LYTE_CORPUS,
        )
        assert docs == []


# ─── HTTP wire tests ──────────────────────────────────────────────────────────


@pytest.fixture
def client() -> httpx.AsyncClient:
    transport = httpx.ASGITransport(app=app)
    return httpx.AsyncClient(transport=transport, base_url="http://testserver")


class TestHttp:
    @pytest.mark.asyncio
    async def test_health(self, client: httpx.AsyncClient):
        async with client:
            r = await client.get("/health")
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "ok"
        assert body["corpusSize"] == len(LYTE_CORPUS)

    @pytest.mark.asyncio
    async def test_retrieve_returns_documents_locally_without_key(
        self, client: httpx.AsyncClient, monkeypatch
    ):
        # No key configured + localhost caller → allowed.
        monkeypatch.delenv("LYTE_METRICS_STORE_API_KEY", raising=False)
        async with client:
            r = await client.post(
                "/v1/retrieve",
                json={"query": "latency spike", "topK": 5, "minRelevanceScore": 0.0},
            )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["matched"] >= 1
        assert body["corpusSize"] == len(LYTE_CORPUS)
        for d in body["documents"]:
            assert {"id", "content", "relevanceScore", "source", "metadata"} <= set(d)

    @pytest.mark.asyncio
    async def test_retrieve_rejects_bad_token_when_key_set(
        self, client: httpx.AsyncClient, monkeypatch
    ):
        monkeypatch.setenv("LYTE_METRICS_STORE_API_KEY", "sk-test-secret")
        async with client:
            r = await client.post(
                "/v1/retrieve",
                json={"query": "latency", "topK": 3, "minRelevanceScore": 0.0},
                headers={"Authorization": "Bearer wrong"},
            )
        assert r.status_code == 401

    @pytest.mark.asyncio
    async def test_retrieve_accepts_correct_bearer(
        self, client: httpx.AsyncClient, monkeypatch
    ):
        monkeypatch.setenv("LYTE_METRICS_STORE_API_KEY", "sk-test-secret")
        async with client:
            r = await client.post(
                "/v1/retrieve",
                json={"query": "latency", "topK": 3, "minRelevanceScore": 0.0},
                headers={"Authorization": "Bearer sk-test-secret"},
            )
        assert r.status_code == 200, r.text
        assert r.json()["matched"] >= 1

    @pytest.mark.asyncio
    async def test_local_dev_token_rejected_when_key_is_set(
        self, client: httpx.AsyncClient, monkeypatch
    ):
        # When a real key is configured, the "local-dev" fallback must be
        # refused even from localhost — otherwise a misconfigured proxy
        # surfacing remote callers as 127.0.0.1 would silently bypass auth.
        monkeypatch.setenv("LYTE_METRICS_STORE_API_KEY", "sk-test-secret")
        async with client:
            r = await client.post(
                "/v1/retrieve",
                json={"query": "latency", "topK": 3, "minRelevanceScore": 0.0},
                headers={"Authorization": "Bearer local-dev"},
            )
        assert r.status_code == 401, r.text

    @pytest.mark.asyncio
    async def test_local_dev_token_works_when_no_key_configured(
        self, client: httpx.AsyncClient, monkeypatch
    ):
        # No key configured + localhost caller → the substrate adapter's
        # "Bearer local-dev" fallback continues to work for dev/test loops.
        monkeypatch.delenv("LYTE_METRICS_STORE_API_KEY", raising=False)
        async with client:
            r = await client.post(
                "/v1/retrieve",
                json={"query": "latency", "topK": 3, "minRelevanceScore": 0.0},
                headers={"Authorization": "Bearer local-dev"},
            )
        assert r.status_code == 200, r.text

    @pytest.mark.asyncio
    async def test_retrieve_rejects_empty_query(self, client: httpx.AsyncClient):
        async with client:
            r = await client.post(
                "/v1/retrieve",
                json={"query": "", "topK": 3, "minRelevanceScore": 0.0},
            )
        assert r.status_code == 422
