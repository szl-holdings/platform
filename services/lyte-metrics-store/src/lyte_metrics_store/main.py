"""
Lyte Metrics Store — FastAPI application.

The Substrate Python worker fleet's retrieval stage POSTs to this service
when a workflow is configured with ``retrieverAdapterId =
"lyte-metrics-store"`` (or ``"lyte-retriever"``). See
``services/substrate-py-workers/src/worker/adapters/retriever.py`` for the
client side.

Endpoints:
  POST /v1/retrieve   — score the Lyte metrics corpus against a query
  GET  /health        — liveness probe
  GET  /ready         — readiness probe

Environment variables:
  PORT                            — port to bind (default: 8081)
  LYTE_METRICS_STORE_API_KEY      — required Bearer token in non-local deploys.
                                    When unset, requests from localhost are
                                    accepted (with or without the substrate
                                    adapter's "local-dev" fallback token) so
                                    dev/test loops can run without secrets.
                                    When *set*, only the configured token is
                                    accepted — the localhost / "local-dev"
                                    fallback is disabled to prevent silent
                                    auth bypass via misconfigured proxies.
"""

from __future__ import annotations

import os
from typing import Any

import structlog
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, Request, status
from pydantic import BaseModel, Field

from .corpus import LYTE_CORPUS
from .retrieval import top_k_documents

log = structlog.get_logger(__name__)


# ─── Schemas ──────────────────────────────────────────────────────────────────


class RetrieveRequest(BaseModel):
    query: str = Field(min_length=1)
    topK: int = Field(default=20, ge=1, le=200)
    minRelevanceScore: float = Field(default=0.0, ge=0.0, le=1.0)
    filters: dict[str, Any] | None = None


class RetrievedDocument(BaseModel):
    id: str
    content: str
    relevanceScore: float
    source: str
    metadata: dict[str, Any] = Field(default_factory=dict)


class RetrieveResponse(BaseModel):
    documents: list[RetrievedDocument]
    corpusSize: int
    matched: int


# ─── Auth ─────────────────────────────────────────────────────────────────────


def _is_local(request: Request) -> bool:
    host = (request.client.host if request.client else "") or ""
    return host in ("127.0.0.1", "::1", "localhost")


async def require_bearer(request: Request) -> None:
    """Validate Bearer auth. Local callers without a configured key are allowed
    so the substrate test loop and dev runs do not need secrets."""
    expected = os.environ.get("LYTE_METRICS_STORE_API_KEY")
    auth = request.headers.get("authorization") or ""
    presented = auth[len("Bearer ") :].strip() if auth.lower().startswith("bearer ") else None

    if expected:
        if presented and presented == expected:
            return
        # When a real key is configured, do NOT accept the "local-dev" fallback
        # — even from localhost. Otherwise a misconfigured proxy that surfaces
        # remote callers as 127.0.0.1 would be a silent auth bypass.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid or missing bearer token",
        )

    # No expected key configured: only accept localhost callers, otherwise refuse.
    if _is_local(request):
        return
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="LYTE_METRICS_STORE_API_KEY not configured",
    )


# ─── App ──────────────────────────────────────────────────────────────────────


app = FastAPI(
    title="Lyte Metrics Store",
    version="1.0.0",
    description=(
        "Retrieval backend for the SZL Holdings Substrate Opportunity Audit "
        "and Operational Drift workflows. Scores the Lyte metrics corpus "
        "against a natural-language query and returns ranked documents."
    ),
)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {"status": "ok", "corpusSize": len(LYTE_CORPUS)}


@app.get("/ready")
async def ready() -> dict[str, Any]:
    return {"status": "ready", "corpusSize": len(LYTE_CORPUS)}


@app.post("/v1/retrieve", response_model=RetrieveResponse)
async def retrieve(
    body: RetrieveRequest,
    _auth: None = Depends(require_bearer),
) -> RetrieveResponse:
    docs = top_k_documents(
        body.query,
        top_k=body.topK,
        min_relevance_score=body.minRelevanceScore,
        filters=body.filters,
        corpus=LYTE_CORPUS,
    )
    log.info(
        "lyte_metrics_retrieve",
        query=body.query[:120],
        topK=body.topK,
        minRelevanceScore=body.minRelevanceScore,
        matched=len(docs),
    )
    return RetrieveResponse(
        documents=[RetrievedDocument(**d) for d in docs],
        corpusSize=len(LYTE_CORPUS),
        matched=len(docs),
    )


def main() -> None:
    port = int(os.environ.get("PORT", "8081"))
    uvicorn.run(
        "lyte_metrics_store.main:app",
        host="0.0.0.0",
        port=port,
        log_level=os.environ.get("LOG_LEVEL", "info"),
    )


if __name__ == "__main__":
    main()
