"""HTTP-level tests for the Lyte metrics store."""

from __future__ import annotations

import httpx
import pytest

from lyte_metrics_store.corpus import (
    FIXTURE_CORPUS_ID,
    FIXTURE_EVIDENCE_STATE,
    FIXTURE_KIND,
    LYTE_CORPUS,
)
from lyte_metrics_store.main import (
    API_KEY_ENV,
    AUTH_BYPASS_ENV,
    SERVICE_ENV,
    TENANT_ID_ENV,
    app,
    lifespan,
)
from lyte_metrics_store.retrieval import top_k_documents


# ─── Pure scoring tests ───────────────────────────────────────────────────────


class TestScoring:
    def test_corpus_is_non_empty(self):
        assert len(LYTE_CORPUS) >= 25

    def test_every_bundled_document_is_labelled_as_a_deterministic_fixture(self):
        for document in LYTE_CORPUS:
            assert document.metadata["fixture"] is True
            assert document.metadata["fixtureKind"] == FIXTURE_KIND
            assert document.metadata["fixtureCorpusId"] == FIXTURE_CORPUS_ID
            assert document.metadata["evidenceState"] == FIXTURE_EVIDENCE_STATE

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


@pytest.fixture(autouse=True)
def explicit_test_security(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(SERVICE_ENV, "test")
    monkeypatch.setenv(AUTH_BYPASS_ENV, "1")
    monkeypatch.delenv(API_KEY_ENV, raising=False)
    monkeypatch.delenv(TENANT_ID_ENV, raising=False)
    for name in ("RUNTIME_MODE", "APP_ENV", "NODE_ENV", "SZL_ENV"):
        monkeypatch.delenv(name, raising=False)


def configure_bearer(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv(API_KEY_ENV, "unit-test-metrics-credential")
    monkeypatch.delenv(AUTH_BYPASS_ENV, raising=False)


class TestHttp:
    @pytest.mark.asyncio
    async def test_health(self, client: httpx.AsyncClient):
        async with client:
            r = await client.get("/health")
        assert r.status_code == 200
        assert r.json() == {"status": "ok"}

    @pytest.mark.asyncio
    async def test_retrieve_returns_documents_with_explicit_test_bypass(
        self, client: httpx.AsyncClient, monkeypatch
    ):
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
            assert d["metadata"]["fixture"] is True
            assert d["metadata"]["fixtureKind"] == FIXTURE_KIND
            assert d["metadata"]["fixtureCorpusId"] == FIXTURE_CORPUS_ID
            assert d["metadata"]["evidenceState"] == FIXTURE_EVIDENCE_STATE

    @pytest.mark.asyncio
    async def test_retrieve_rejects_bad_token_when_key_set(
        self, client: httpx.AsyncClient, monkeypatch
    ):
        configure_bearer(monkeypatch)
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
        configure_bearer(monkeypatch)
        async with client:
            r = await client.post(
                "/v1/retrieve",
                json={"query": "latency", "topK": 3, "minRelevanceScore": 0.0},
                headers={"Authorization": "Bearer unit-test-metrics-credential"},
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
        configure_bearer(monkeypatch)
        async with client:
            r = await client.post(
                "/v1/retrieve",
                json={"query": "latency", "topK": 3, "minRelevanceScore": 0.0},
                headers={"Authorization": "Bearer local-dev"},
            )
        assert r.status_code == 401, r.text

    @pytest.mark.asyncio
    async def test_missing_configuration_is_rejected_even_from_loopback(
        self, client: httpx.AsyncClient, monkeypatch
    ):
        monkeypatch.delenv(API_KEY_ENV, raising=False)
        monkeypatch.delenv(AUTH_BYPASS_ENV, raising=False)
        async with client:
            r = await client.post(
                "/v1/retrieve",
                json={"query": "latency", "topK": 3, "minRelevanceScore": 0.0},
                headers={"Authorization": "Bearer local-dev"},
            )
        assert r.status_code == 503, r.text
        assert r.json() == {
            "detail": "service security configuration is unavailable"
        }

    @pytest.mark.asyncio
    async def test_production_startup_rejects_missing_key(
        self, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv(SERVICE_ENV, "production")
        monkeypatch.delenv(API_KEY_ENV, raising=False)
        monkeypatch.delenv(AUTH_BYPASS_ENV, raising=False)

        with pytest.raises(RuntimeError, match=API_KEY_ENV):
            async with lifespan(app):
                pytest.fail("production must not start without an injected key")

    @pytest.mark.asyncio
    async def test_production_startup_rejects_auth_bypass(
        self, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv(SERVICE_ENV, "production")
        monkeypatch.setenv(AUTH_BYPASS_ENV, "1")
        monkeypatch.delenv(API_KEY_ENV, raising=False)

        with pytest.raises(RuntimeError, match="permitted only"):
            async with lifespan(app):
                pytest.fail("production must not start with the development bypass")

    @pytest.mark.asyncio
    @pytest.mark.parametrize(
        "marker",
        ["RUNTIME_MODE", "APP_ENV", "NODE_ENV", "SZL_ENV", SERVICE_ENV],
    )
    async def test_every_production_marker_dominates_test_bypass(
        self, monkeypatch: pytest.MonkeyPatch, marker: str
    ):
        monkeypatch.setenv(SERVICE_ENV, "test")
        monkeypatch.setenv(AUTH_BYPASS_ENV, "1")
        monkeypatch.setenv(marker, "production")
        with pytest.raises(RuntimeError, match="permitted only"):
            async with lifespan(app):
                pytest.fail("a production marker must disable the development bypass")

    @pytest.mark.asyncio
    async def test_invalid_runtime_mode_is_startup_fatal(
        self, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv("RUNTIME_MODE", "prodution")
        with pytest.raises(RuntimeError, match="RUNTIME_MODE must be one of"):
            async with lifespan(app):
                pytest.fail("invalid RUNTIME_MODE must not silently fall through")

    @pytest.mark.asyncio
    async def test_production_startup_rejects_unbound_credential(
        self, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv(SERVICE_ENV, "production")
        monkeypatch.setenv(API_KEY_ENV, "unit-test-metrics-credential")
        monkeypatch.delenv(TENANT_ID_ENV, raising=False)
        monkeypatch.delenv(AUTH_BYPASS_ENV, raising=False)

        with pytest.raises(RuntimeError, match=TENANT_ID_ENV):
            async with lifespan(app):
                pytest.fail("production must not start with an unbound credential")

    @pytest.mark.asyncio
    async def test_production_credential_rejects_cross_tenant_request(
        self, client: httpx.AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv(SERVICE_ENV, "production")
        monkeypatch.setenv(API_KEY_ENV, "unit-test-metrics-credential")
        monkeypatch.setenv(TENANT_ID_ENV, "tenant-bound")
        monkeypatch.delenv(AUTH_BYPASS_ENV, raising=False)

        async with client:
            response = await client.post(
                "/v1/retrieve",
                json={"query": "latency", "topK": 3},
                headers={
                    "Authorization": "Bearer unit-test-metrics-credential",
                    "X-Tenant-ID": "tenant-other",
                },
            )

        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_production_bound_credential_is_held_before_fixture_scoring(
        self, client: httpx.AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv(SERVICE_ENV, "production")
        monkeypatch.setenv(API_KEY_ENV, "unit-test-metrics-credential")
        monkeypatch.setenv(TENANT_ID_ENV, "tenant-bound")
        monkeypatch.delenv(AUTH_BYPASS_ENV, raising=False)

        def unexpected_scoring(*_args, **_kwargs):
            pytest.fail("production HOLD must run before fixture scoring")

        monkeypatch.setattr(
            "lyte_metrics_store.main.top_k_documents", unexpected_scoring
        )

        async with client:
            response = await client.post(
                "/v1/retrieve",
                json={"query": "latency", "topK": 3},
                headers={
                    "Authorization": "Bearer unit-test-metrics-credential",
                    "X-Tenant-ID": "tenant-bound",
                },
            )

        assert response.status_code == 503
        assert response.headers["x-evidence-state"] == "UNAVAILABLE"
        body = response.json()
        assert body["status"] == "HOLD"
        assert body["code"] == "PRODUCTION_RETRIEVAL_UNAVAILABLE"
        assert body["evidenceState"] == "UNAVAILABLE"
        assert body["capability"] == {
            "backendId": FIXTURE_CORPUS_ID,
            "backendKind": FIXTURE_KIND,
            "fixture": True,
            "tenantScoped": False,
            "backendQualified": False,
            "sourceReceiptId": None,
            "sourceReceiptVerified": False,
        }
        assert "documents" not in body
        assert "matched" not in body
        assert "corpusSize" not in body

    @pytest.mark.asyncio
    async def test_invalid_bypass_value_is_a_configuration_error(
        self, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv(SERVICE_ENV, "test")
        monkeypatch.setenv(AUTH_BYPASS_ENV, "maybe")

        with pytest.raises(RuntimeError, match="explicit boolean"):
            async with lifespan(app):
                pytest.fail("an invalid bypass value must fail closed")

    @pytest.mark.asyncio
    async def test_readiness_fails_when_security_config_is_missing(
        self, client: httpx.AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv(SERVICE_ENV, "production")
        monkeypatch.delenv(API_KEY_ENV, raising=False)
        monkeypatch.delenv(AUTH_BYPASS_ENV, raising=False)
        async with client:
            health = await client.get("/health")
            ready = await client.get("/ready")

        assert health.status_code == 200
        assert ready.status_code == 503
        assert ready.json()["status"] == "not-ready"

    @pytest.mark.asyncio
    async def test_production_readiness_holds_with_valid_bound_credential(
        self, client: httpx.AsyncClient, monkeypatch: pytest.MonkeyPatch
    ):
        monkeypatch.setenv(SERVICE_ENV, "production")
        monkeypatch.setenv(API_KEY_ENV, "unit-test-metrics-credential")
        monkeypatch.setenv(TENANT_ID_ENV, "tenant-bound")
        monkeypatch.delenv(AUTH_BYPASS_ENV, raising=False)

        async with client:
            health = await client.get("/health")
            ready = await client.get("/ready")

        assert health.status_code == 200
        assert ready.status_code == 503
        assert ready.headers["x-evidence-state"] == "UNAVAILABLE"
        body = ready.json()
        assert body["status"] == "HOLD"
        assert body["code"] == "PRODUCTION_RETRIEVAL_UNAVAILABLE"
        assert body["capability"]["backendQualified"] is False
        assert body["capability"]["sourceReceiptVerified"] is False

    @pytest.mark.asyncio
    async def test_retrieve_rejects_empty_query(self, client: httpx.AsyncClient):
        async with client:
            r = await client.post(
                "/v1/retrieve",
                json={"query": "", "topK": 3, "minRelevanceScore": 0.0},
            )
        assert r.status_code == 422
