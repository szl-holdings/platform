"""AEF development embedding/reranking endpoints plus governed Ovis router.

The text endpoints remain deterministic and model-free for local smoke tests.
The Ovis router is a separate, feature-gated evaluation path with exact artifact
identity and must never be confused with the development hash embedder.
"""

from __future__ import annotations

import hashlib
import math
from typing import Any, Literal

import structlog
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from .ovis_omni import ovis_router
from .security import (
    ClaimAuthenticationError,
    WorkerSecurityConfigurationError,
    authenticate_claim,
    is_production_environment,
)

log = structlog.get_logger(__name__)
aef_router = APIRouter(prefix="/aef", tags=["AEF"])

AEF_EMBED_DIM = 384
AEF_DEV_MODEL = "aef-dev-hash"
AEF_FALLBACK_RERANK_MODEL = "lexical-overlap-v1"
AEF_FALLBACK_RERANK_REVISION = "builtin-lexical-overlap-v1"


def _authenticate_aef_request(request: Request) -> str:
    """Apply the worker bearer/tenant boundary to internal AEF helpers."""

    try:
        principal = authenticate_claim(
            authorization=request.headers.get("authorization"),
            header_tenant_id=request.headers.get("x-tenant-id"),
            claim_tenant_id=None,
        )
    except WorkerSecurityConfigurationError:
        raise HTTPException(
            status_code=503,
            detail="Worker security configuration is unavailable",
        ) from None
    except ClaimAuthenticationError as error:
        headers = {"WWW-Authenticate": "Bearer"} if error.authenticate_header else None
        raise HTTPException(
            status_code=error.status_code,
            detail=error.public_message,
            headers=headers,
        ) from None
    return principal.tenant_id


def _require_development_backend(requested_model: str, expected_model: str) -> None:
    """Reject false model identity and any use of dev heuristics in production."""

    if is_production_environment():
        raise HTTPException(
            status_code=503,
            detail="The deterministic AEF development backend is unavailable in production",
        )
    if requested_model != expected_model:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported model for this endpoint; expected {expected_model!r}",
        )


def _hash_embed(text: str, dim: int = AEF_EMBED_DIM) -> list[float]:
    """Produce a deterministic unit vector for development and smoke tests."""
    seed = text.encode("utf-8")
    raw_floats: list[float] = []
    index = 0
    while len(raw_floats) < dim:
        digest = hashlib.sha256(seed + index.to_bytes(4, "big")).digest()
        for offset in range(0, len(digest) - 3, 4):
            unsigned = int.from_bytes(digest[offset : offset + 4], "big")
            raw_floats.append((unsigned / 0xFFFFFFFF) * 2.0 - 1.0)
        index += 1

    floats = raw_floats[:dim]
    norm = math.sqrt(sum(value * value for value in floats))
    if not math.isfinite(norm):
        raise RuntimeError("development embedding produced a non-finite norm")
    if norm == 0.0:
        return [1.0 / math.sqrt(dim)] * dim
    return [value / norm for value in floats]


def _tf_rerank_score(query: str, text: str) -> float:
    terms = [term.lower() for term in query.split() if len(term) > 2]
    if not terms:
        return 0.0
    lowered = text.lower()
    return sum(1 for term in terms if term in lowered) / len(terms)


class AefEmbedRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=512)
    model: str = AEF_DEV_MODEL
    pooling: Literal["mean"] = "mean"
    normalize: Literal[True] = True


class AefEmbedResponse(BaseModel):
    vectors: list[list[float]]
    model: str
    dimensions: int
    token_counts: list[int] | None = None


class AefRerankCandidate(BaseModel):
    id: str = Field(min_length=1, max_length=512)
    text: str = Field(min_length=1, max_length=100_000)
    score: float | None = Field(default=None, ge=0.0, le=1.0, allow_inf_nan=False)


class AefRerankRequest(BaseModel):
    query: str = Field(min_length=1, max_length=10_000)
    candidates: list[AefRerankCandidate] = Field(..., min_length=1, max_length=512)
    top_k: int = Field(default=10, ge=1, le=512)
    model: str = AEF_FALLBACK_RERANK_MODEL


class AefRerankResult(BaseModel):
    id: str
    score: float
    rank: int


class AefRerankResponse(BaseModel):
    results: list[AefRerankResult]
    model: str
    model_revision: str | None = None
    artifact_set_digest: str | None = None
    promotion_state: Literal[
        "DEVELOPMENT", "EVALUATION_HOLD", "QUALIFIED", "REVOKED"
    ] | None = None


@aef_router.post("/embed", response_model=AefEmbedResponse)
async def aef_embed(req: AefEmbedRequest, request: Request) -> Any:
    tenant_id = _authenticate_aef_request(request)
    _require_development_backend(req.model, AEF_DEV_MODEL)
    if not req.texts:
        raise HTTPException(status_code=400, detail="texts must contain at least one item")
    for index, text in enumerate(req.texts):
        if not text:
            raise HTTPException(status_code=400, detail=f"texts[{index}] must not be empty")

    log.info(
        "aef_embed_request",
        model=req.model,
        text_count=len(req.texts),
        pooling=req.pooling,
        tenant_id=tenant_id,
    )
    vectors = [_hash_embed(text, AEF_EMBED_DIM) for text in req.texts]
    token_counts = [max(1, len(text.split())) for text in req.texts]
    return AefEmbedResponse(
        vectors=vectors,
        model=AEF_DEV_MODEL,
        dimensions=AEF_EMBED_DIM,
        token_counts=token_counts,
    )


@aef_router.post("/rerank", response_model=AefRerankResponse)
async def aef_rerank(req: AefRerankRequest, request: Request) -> Any:
    tenant_id = _authenticate_aef_request(request)
    _require_development_backend(req.model, AEF_FALLBACK_RERANK_MODEL)
    if not req.candidates:
        raise HTTPException(status_code=400, detail="candidates must contain at least one item")

    log.info(
        "aef_rerank_request",
        model=req.model,
        candidate_count=len(req.candidates),
        top_k=req.top_k,
        tenant_id=tenant_id,
    )
    scored = [
        {
            "id": candidate.id,
            "tf_score": _tf_rerank_score(req.query, candidate.text),
            "original_score": candidate.score or 0.0,
        }
        for candidate in req.candidates
    ]
    scored.sort(
        key=lambda item: 0.7 * item["tf_score"] + 0.3 * item["original_score"],
        reverse=True,
    )
    top_k = min(req.top_k, len(scored))
    results = [
        AefRerankResult(
            id=item["id"],
            score=round(0.7 * item["tf_score"] + 0.3 * item["original_score"], 6),
            rank=index + 1,
        )
        for index, item in enumerate(scored[:top_k])
    ]
    return AefRerankResponse(
        results=results,
        model=AEF_FALLBACK_RERANK_MODEL,
        model_revision=AEF_FALLBACK_RERANK_REVISION,
        # This built-in lexical heuristic has no qualified artifact set and
        # must never mint an artifact digest or QUALIFIED promotion receipt.
        artifact_set_digest=None,
        promotion_state="DEVELOPMENT",
    )


# Nested deliberately under /aef so the public TypeScript API remains the only
# product-facing boundary. The Python endpoint is an internal execution target.
aef_router.include_router(ovis_router)
