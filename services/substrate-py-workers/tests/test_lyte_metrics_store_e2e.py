"""
End-to-end test: substrate retrieval stage → live Lyte metrics store.

Spins the lyte-metrics-store FastAPI app up in-process and routes the
substrate retriever adapter's httpx client at it via ASGI transport.

Asserts the contract the production deploy needs:
  * the retrieval stage resolves the "lyte-metrics-store" adapter id,
  * POSTs the wire-shaped body to the live service,
  * receives a real document list,
  * emits an output with retrieverSource == "adapter".
"""

from __future__ import annotations

import sys
from pathlib import Path

import httpx
import pytest

# Make the lyte-metrics-store package importable in this test process.
_LYTE_SRC = Path(__file__).resolve().parents[2] / "lyte-metrics-store" / "src"
if _LYTE_SRC.exists() and str(_LYTE_SRC) not in sys.path:
    sys.path.insert(0, str(_LYTE_SRC))

from lyte_metrics_store.main import app as lyte_metrics_app  # noqa: E402

from worker.adapters.retriever import (
    RetrieverAdapterConfig,
    retriever_adapter_manager,
)
from worker.stages.retrieval import execute as retrieval_execute


@pytest.mark.asyncio
async def test_opportunity_audit_retrieval_hits_live_lyte_metrics_store(monkeypatch):
    """
    Full path: opportunity-audit retrieval stageConfig → registered adapter →
    httpx → live FastAPI lyte-metrics-store → ranked Lyte corpus documents.
    """

    # 1) Re-point the lyte-metrics-store adapter at the in-process ASGI app.
    #    We override the predefined adapter rather than registering a new one
    #    so the test exercises the exact id the production workflow uses.
    asgi_transport = httpx.ASGITransport(app=lyte_metrics_app)

    real_async_client_init = httpx.AsyncClient.__init__

    def patched_init(self, *args, **kwargs):
        kwargs["transport"] = asgi_transport
        real_async_client_init(self, *args, **kwargs)

    monkeypatch.setattr(httpx.AsyncClient, "__init__", patched_init)

    # ASGITransport accepts any URL; we just need a baseUrl that passes
    # availability checks (localhost → no API key required).
    monkeypatch.setattr(
        retriever_adapter_manager,
        "_adapters",
        {
            **retriever_adapter_manager._adapters,
            "lyte-metrics-store": RetrieverAdapterConfig(
                id="lyte-metrics-store",
                name="Lyte Metrics Store (e2e)",
                baseUrl="http://localhost:8081",
                apiKeyEnvVar="LYTE_METRICS_STORE_API_KEY",
                queryPath="/v1/retrieve",
            ),
        },
    )

    # 2) Build a claim shaped like the opportunity-audit retrieval stage.
    claim = {
        "stageType": "Retrieve",
        "stageConfig": {
            "stageKind": "retrieval",
            "retrieverAdapterId": "lyte-metrics-store",
            "topK": 10,
            "minRelevanceScore": 0.3,
        },
        "input": {
            "query": "latency spike on lyte-api-gateway and SLO drift across the fleet",
        },
        "mode": "live",
        "runId": "run-e2e-lyte",
        "stageId": "retrieve-lyte-data",
    }

    # 3) Execute and assert the live-data contract.
    result = await retrieval_execute(claim)

    assert result["retrieverSource"] == "adapter", result
    assert result["retrieverAdapterId"] == "lyte-metrics-store"
    assert result["rerankedCount"] >= 1
    assert result["documents"], "expected at least one document from the live store"

    # The corpus is Lyte-domain — the top result must reference a Lyte service.
    top = result["documents"][0]
    assert "lyte-" in top["content"].lower() or "lyte-" in top["source"].lower()
    # Source should be one of the Lyte corpus sources (not synthetic-index).
    assert top["source"] != "synthetic-index"
