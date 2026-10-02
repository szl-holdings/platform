"""AEF development embedding/reranking endpoints plus governed Ovis router.

The text endpoints remain deterministic and model-free for local smoke tests.
The Ovis router is a separate, feature-gated evaluation path with exact artifact
identity and must never be confused with the development hash embedder.
"""

from __future__ import annotations

import hashlib
import math
import struct
from typing import Any

import structlog
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from .ovis_omni import ovis_router

log = structlog.get_logger(__name__)
aef_router = APIRouter(prefix="/aef", tags=["AEF"])

AEF_EMBED_DIM = 384
AEF_DEV_MODEL = "aef-dev-hash"
AEF_FALLBACK_RERANK_MODEL = "aef-dev-rerank"


def _hash_embed(text: str, dim: int = AEF_EMBED_DIM) -> list[float]:
    """Produce a deterministic unit vector for development and smoke tests."""
    seed = text.encode("utf-8")
    raw_floats: list[float] = []
    index = 0
    while len(raw_floats) < dim:
        digest = hashlib.sha256(seed + index.to_bytes(4, "big")).digest()
        for offset in range(0, len(digest) - 3, 4):
            raw_floats.append(struct.unpack_from("!f", digest, offset)[0])
        index += 1

    floats = raw_floats[:dim]
    norm = math.sqrt(sum(value * value for value in floats))
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
    pooling: str = "mean"
    normalize: bool = True


class AefEmbedResponse(BaseModel):
    vectors: list[list[float]]
    model: str
    dimensions: int
    token_counts: list[int] | None = None


class AefRerankCandidate(BaseModel):
    id: str
    text: str
    score: float | None = None


class AefRerankRequest(BaseModel):
    query: str
    candidates: list[AefRerankCandidate] = Field(..., min_length=1, max_length=512)
    top_k: int = 10
    model: str = AEF_FALLBACK_RERANK_MODEL


class AefRerankResult(BaseModel):
    id: str
    score: float
    rank: int


class AefRerankResponse(BaseModel):
    results: list[AefRerankResult]
    model: str


@aef_router.post("/embed", response_model=AefEmbedResponse)
async def aef_embed(req: AefEmbedRequest, request: Request) -> Any:
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
        client=str(request.client),
    )
    vectors = [_hash_embed(text, AEF_EMBED_DIM) for text in req.texts]
    token_counts = [max(1, len(text.split())) for text in req.texts]
    return AefEmbedResponse(
        vectors=vectors,
        model=req.model,
        dimensions=AEF_EMBED_DIM,
        token_counts=token_counts,
    )


@aef_router.post("/rerank", response_model=AefRerankResponse)
async def aef_rerank(req: AefRerankRequest, request: Request) -> Any:
    if not req.candidates:
        raise HTTPException(status_code=400, detail="candidates must contain at least one item")

    log.info(
        "aef_rerank_request",
        model=req.model,
        candidate_count=len(req.candidates),
        top_k=req.top_k,
        client=str(request.client),
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
    top_k = min(req.top_k, len(scored)) if req.top_k > 0 else len(scored)
    results = [
        AefRerankResult(
            id=item["id"],
            score=round(0.7 * item["tf_score"] + 0.3 * item["original_score"], 6),
            rank=index + 1,
        )
        for index, item in enumerate(scored[:top_k])
    ]
    return AefRerankResponse(results=results, model=req.model)


# Nested deliberately under /aef so the public TypeScript API remains the only
# product-facing boundary. The Python endpoint is an internal execution target.
aef_router.include_router(ovis_router)
