"""
Retriever adapter tests for the heavy-compute retrieval stage.

Covers the live-mode contract:
  * adapters resolved by id from the registry (mirroring nim-endpoint.ts)
  * synthetic fallback only allowed in non-live modes / opt-in dev flag
  * live mode without a configured adapter fails closed
  * adapter HTTP transport errors fail closed in live mode
"""

from __future__ import annotations

import pytest

import httpx

from worker.adapters.retriever import (
    RetrieverAdapterConfig,
    RetrieverAdapterManager,
    RetrieverAdapterUnavailable,
    retriever_adapter_manager,
)
from worker.stages.retrieval import execute as retrieval_execute


def _claim(input_data: dict, mode: str = "live", config: dict | None = None) -> dict:
    return {
        "stageType": "retrieval",
        "stageConfig": config or {"stageKind": "retrieval"},
        "input": input_data,
        "mode": mode,
        "runId": "run-adapter-test",
        "stageId": "stage-retrieval-adapter",
    }


# ─── Adapter registry ─────────────────────────────────────────────────────────


class TestAdapterRegistry:
    def test_predefined_lyte_adapter_present(self):
        cfg = retriever_adapter_manager.get("lyte-metrics-store")
        assert cfg is not None
        assert cfg.apiKeyEnvVar == "LYTE_METRICS_STORE_API_KEY"
        assert cfg.queryPath.startswith("/")

    def test_register_and_unregister(self):
        mgr = RetrieverAdapterManager(adapters=[])
        cfg = RetrieverAdapterConfig(
            id="test-adapter",
            name="Test",
            baseUrl="http://localhost:9999",
            apiKeyEnvVar="TEST_API_KEY",
        )
        mgr.register(cfg)
        assert mgr.has("test-adapter")
        assert mgr.unregister("test-adapter") is True
        assert mgr.has("test-adapter") is False

    def test_unknown_adapter_unavailable(self):
        mgr = RetrieverAdapterManager(adapters=[])
        ok, reason = mgr.is_available("does-not-exist")
        assert ok is False
        assert reason and "not registered" in reason

    def test_localhost_adapter_does_not_require_api_key(self, monkeypatch):
        mgr = RetrieverAdapterManager(adapters=[])
        mgr.register(RetrieverAdapterConfig(
            id="local",
            name="Local",
            baseUrl="http://localhost:9999",
            apiKeyEnvVar="UNUSED_KEY",
        ))
        monkeypatch.delenv("UNUSED_KEY", raising=False)
        ok, reason = mgr.is_available("local")
        assert ok, reason

    def test_remote_adapter_requires_api_key(self, monkeypatch):
        mgr = RetrieverAdapterManager(adapters=[])
        mgr.register(RetrieverAdapterConfig(
            id="remote",
            name="Remote",
            baseUrl="https://example.com",
            apiKeyEnvVar="REMOTE_API_KEY",
        ))
        monkeypatch.delenv("REMOTE_API_KEY", raising=False)
        ok, reason = mgr.is_available("remote")
        assert ok is False
        assert reason and "REMOTE_API_KEY" in reason

        monkeypatch.setenv("REMOTE_API_KEY", "secret")
        ok, _ = mgr.is_available("remote")
        assert ok

    def test_base_url_env_override(self, monkeypatch):
        cfg = RetrieverAdapterConfig(
            id="overridable",
            name="Overridable",
            baseUrl="http://default.example.com",
            apiKeyEnvVar="OV_KEY",
            baseUrlEnvVar="OV_URL_OVERRIDE",
        )
        mgr = RetrieverAdapterManager(adapters=[cfg])
        monkeypatch.setenv("OV_URL_OVERRIDE", "https://overridden.example.com")
        assert mgr._resolved_base_url(cfg) == "https://overridden.example.com"
        monkeypatch.delenv("OV_URL_OVERRIDE", raising=False)
        assert mgr._resolved_base_url(cfg) == "http://default.example.com"


# ─── Stage integration: live-mode fail-closed ─────────────────────────────────


class TestLiveFailsClosed:
    @pytest.mark.asyncio
    async def test_live_without_adapter_or_corpus_raises(self, monkeypatch):
        monkeypatch.delenv("SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC", raising=False)
        with pytest.raises(RuntimeError, match="retrieverAdapterId"):
            await retrieval_execute(_claim({"query": "audit risk"}, mode="live"))

    @pytest.mark.asyncio
    async def test_live_with_default_adapter_raises(self, monkeypatch):
        monkeypatch.delenv("SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC", raising=False)
        # The TS substrate registers a "default" no-op retriever — the python
        # stage must treat that as "no adapter configured" and fail closed.
        with pytest.raises(RuntimeError, match="retrieverAdapterId"):
            await retrieval_execute(_claim(
                {"query": "audit risk"},
                mode="live",
                config={"stageKind": "retrieval", "retrieverAdapterId": "default"},
            ))

    @pytest.mark.asyncio
    async def test_live_with_unreachable_adapter_raises(self, monkeypatch):
        monkeypatch.delenv("SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC", raising=False)
        # Unknown adapter id → adapter manager raises Unavailable; live mode
        # must propagate as a hard failure rather than silently fabricating
        # synthetic evidence.
        with pytest.raises(RetrieverAdapterUnavailable):
            await retrieval_execute(_claim(
                {"query": "audit risk"},
                mode="live",
                config={"stageKind": "retrieval", "retrieverAdapterId": "no-such-adapter"},
            ))

    @pytest.mark.asyncio
    async def test_live_with_inline_corpus_succeeds(self):
        corpus = [
            {"id": "c-1", "content": "audit risk score for portfolio"},
            {"id": "c-2", "content": "irrelevant"},
        ]
        result = await retrieval_execute(_claim(
            {"query": "audit risk", "corpus": corpus, "minScore": 0.0},
            mode="live",
        ))
        assert result["retrieverSource"] == "inline"
        assert result["rerankedCount"] >= 1


# ─── Stage integration: non-live fallback to synthetic ────────────────────────


class TestNonLiveFallback:
    @pytest.mark.asyncio
    async def test_replay_falls_back_to_synthetic(self):
        result = await retrieval_execute(_claim(
            {"query": "audit risk", "minScore": 0.4},
            mode="replay",
        ))
        assert result["retrieverSource"] == "synthetic"

    @pytest.mark.asyncio
    async def test_counterfactual_with_unreachable_adapter_falls_back(self):
        # Counterfactual mode is allowed to fall back since it isn't producing
        # operator-facing evidence chains.
        result = await retrieval_execute(_claim(
            {"query": "audit risk"},
            mode="counterfactual",
            config={"stageKind": "retrieval", "retrieverAdapterId": "no-such-adapter"},
        ))
        assert result["retrieverSource"] == "synthetic"

    @pytest.mark.asyncio
    async def test_dev_opt_in_allows_synthetic_in_live(self, monkeypatch):
        monkeypatch.setenv("SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC", "1")
        result = await retrieval_execute(_claim(
            {"query": "audit risk"},
            mode="live",
        ))
        assert result["retrieverSource"] == "synthetic"


# ─── Stage integration: adapter call path (mocked HTTP) ───────────────────────


class TestAdapterCallPath:
    @pytest.mark.asyncio
    async def test_adapter_response_is_normalised_and_used(self, monkeypatch):
        adapter_id = "unit-test-adapter"
        cfg = RetrieverAdapterConfig(
            id=adapter_id,
            name="Unit Test",
            baseUrl="http://localhost:65535",  # localhost → no API key required
            apiKeyEnvVar="UT_API_KEY",
            queryPath="/q",
        )
        retriever_adapter_manager.register(cfg)
        try:
            captured: dict = {}

            async def fake_retrieve(self, adapter_id_arg, query, top_k, min_relevance_score, filters=None):
                captured["adapter_id"] = adapter_id_arg
                captured["query"] = query
                captured["top_k"] = top_k
                captured["min_relevance_score"] = min_relevance_score
                return [
                    {
                        "id": "live-1",
                        "content": "audit risk score live document",
                        "relevanceScore": 0.91,
                        "source": "lyte-live",
                        "metadata": {"shard": "a"},
                    },
                    {
                        "id": "live-2",
                        "content": "unrelated text",
                        "relevanceScore": 0.2,
                        "source": "lyte-live",
                        "metadata": {},
                    },
                ]

            monkeypatch.setattr(
                "worker.adapters.retriever.RetrieverAdapterManager.retrieve",
                fake_retrieve,
            )

            result = await retrieval_execute(_claim(
                {"query": "audit risk", "minScore": 0.0, "topK": 5},
                mode="live",
                config={
                    "stageKind": "retrieval",
                    "retrieverAdapterId": adapter_id,
                    "topK": 5,
                    "minRelevanceScore": 0.0,
                },
            ))

            assert captured["adapter_id"] == adapter_id
            assert captured["query"] == "audit risk"
            assert captured["top_k"] == 5
            assert result["retrieverSource"] == "adapter"
            assert result["retrieverAdapterId"] == adapter_id
            assert result["rerankedCount"] == 2
            ids = {d["id"] for d in result["documents"]}
            assert ids == {"live-1", "live-2"}
        finally:
            retriever_adapter_manager.unregister(adapter_id)

    @pytest.mark.asyncio
    async def test_adapter_http_wire_contract(self, monkeypatch):
        """End-to-end through the real httpx client with a mock transport.

        Verifies the request shape (method, URL, auth header, JSON body) and
        the response normalisation at the httpx boundary.
        """
        cfg = RetrieverAdapterConfig(
            id="wire-test",
            name="Wire Test",
            baseUrl="https://retriever.example.com",
            apiKeyEnvVar="WIRE_API_KEY",
            queryPath="/v1/retrieve",
        )
        mgr = RetrieverAdapterManager(adapters=[cfg])
        monkeypatch.setenv("WIRE_API_KEY", "sk-test-123")

        captured: dict = {}

        def handler(request: httpx.Request) -> httpx.Response:
            captured["method"] = request.method
            captured["url"] = str(request.url)
            captured["auth"] = request.headers.get("authorization")
            captured["content_type"] = request.headers.get("content-type")
            import json as _json
            captured["body"] = _json.loads(request.content.decode())
            return httpx.Response(
                200,
                json={
                    "documents": [
                        {
                            "id": "wire-1",
                            "content": "live document content",
                            "relevanceScore": 0.81,
                            "source": "wire-source",
                            "metadata": {"k": "v"},
                        },
                        # Also exercise the score/text aliases + missing fields.
                        {"id": "wire-2", "text": "alt text", "score": 0.55},
                    ]
                },
            )

        original_init = httpx.AsyncClient.__init__

        def patched_init(self, *args, **kwargs):
            kwargs["transport"] = httpx.MockTransport(handler)
            original_init(self, *args, **kwargs)

        monkeypatch.setattr(httpx.AsyncClient, "__init__", patched_init)

        docs = await mgr.retrieve(
            "wire-test",
            query="audit risk",
            top_k=7,
            min_relevance_score=0.4,
            filters={"shard": "a"},
        )

        # Request shape
        assert captured["method"] == "POST"
        assert captured["url"] == "https://retriever.example.com/v1/retrieve"
        assert captured["auth"] == "Bearer sk-test-123"
        assert "application/json" in (captured["content_type"] or "")
        assert captured["body"] == {
            "query": "audit risk",
            "topK": 7,
            "minRelevanceScore": 0.4,
            "filters": {"shard": "a"},
        }

        # Response normalisation
        assert len(docs) == 2
        assert docs[0]["id"] == "wire-1"
        assert docs[0]["content"] == "live document content"
        assert docs[0]["relevanceScore"] == 0.81
        assert docs[0]["source"] == "wire-source"
        assert docs[0]["metadata"] == {"k": "v"}
        # text → content alias, score → relevanceScore alias, missing source default
        assert docs[1]["content"] == "alt text"
        assert docs[1]["relevanceScore"] == 0.55
        assert docs[1]["source"] == "wire-test"

    @pytest.mark.asyncio
    async def test_adapter_http_500_raises_unavailable(self, monkeypatch):
        cfg = RetrieverAdapterConfig(
            id="err-wire",
            name="Err Wire",
            baseUrl="http://localhost:65535",
            apiKeyEnvVar="EW_KEY",
        )
        mgr = RetrieverAdapterManager(adapters=[cfg])

        def handler(request: httpx.Request) -> httpx.Response:
            return httpx.Response(503, text="upstream down")

        original_init = httpx.AsyncClient.__init__

        def patched_init(self, *args, **kwargs):
            kwargs["transport"] = httpx.MockTransport(handler)
            original_init(self, *args, **kwargs)

        monkeypatch.setattr(httpx.AsyncClient, "__init__", patched_init)

        with pytest.raises(RetrieverAdapterUnavailable, match="HTTP 503"):
            await mgr.retrieve("err-wire", query="q", top_k=5, min_relevance_score=0.0)

    @pytest.mark.asyncio
    async def test_adapter_http_error_fails_closed_in_live(self, monkeypatch):
        adapter_id = "broken-adapter"
        cfg = RetrieverAdapterConfig(
            id=adapter_id,
            name="Broken",
            baseUrl="http://localhost:65535",
            apiKeyEnvVar="BR_API_KEY",
        )
        retriever_adapter_manager.register(cfg)
        try:
            async def fake_retrieve(self, *a, **kw):
                raise RetrieverAdapterUnavailable(adapter_id, "boom")

            monkeypatch.setattr(
                "worker.adapters.retriever.RetrieverAdapterManager.retrieve",
                fake_retrieve,
            )
            monkeypatch.delenv("SUBSTRATE_RETRIEVAL_ALLOW_SYNTHETIC", raising=False)

            with pytest.raises(RetrieverAdapterUnavailable):
                await retrieval_execute(_claim(
                    {"query": "audit"},
                    mode="live",
                    config={"stageKind": "retrieval", "retrieverAdapterId": adapter_id},
                ))
        finally:
            retriever_adapter_manager.unregister(adapter_id)
