"""
AEF CPU dev embed/rerank endpoints for substrate-py-workers.

These endpoints provide deterministic, model-free embedding and reranking
suitable for local development and smoke tests. No model downloads are required.

Swap the dev embedder for a real model by replacing `_hash_embed` with a call
to sentence-transformers or any other inference library, and update the
`aef_embed_model` function to call the real model.

To use a real local model (e.g. all-MiniLM-L6-v2):
    1. pip install sentence-transformers
    2. Replace _hash_embed with:
           model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
           return model.encode(texts, normalize_embeddings=normalize).tolist()
"""

from __future__ import annotations

import hashlib
import math
import struct
from typing import Any

import structlog
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

# ─── Hugging Face Xet startup check ──────────────────────────────────────────
# huggingface_hub>=0.32.0 (pinned in requirements.txt) pulls in hf_xet
# transitively. This non-fatal check confirms the Xet backend is importable
# so operators can verify Xet is active at startup. If the import fails (e.g.
# during a pip install --no-deps dry-run), the worker continues normally.
_log_xet = structlog.get_logger("xet-check")
try:
    import hf_xet as _hf_xet  # noqa: F401
    _log_xet.info("hf_xet_active", version=_hf_xet.__version__,
                  note="Hugging Face Xet transport available for Hub downloads")
except Exception as _xet_err:
    _log_xet.warning("hf_xet_unavailable", error=str(_xet_err),
                     note="Ensure huggingface_hub>=0.32.0 is installed; Hub downloads fall back to HTTP")

log = structlog.get_logger(__name__)

aef_router = APIRouter(prefix="/aef", tags=["AEF"])

AEF_EMBED_DIM = 384
AEF_DEV_MODEL = "aef-dev-hash"
AEF_FALLBACK_RERANK_MODEL = "aef-dev-rerank"


# ─── Dev-mode deterministic embedder (no model download) ─────────────────────

def _hash_embed(text: str, dim: int = AEF_EMBED_DIM) -> list[float]:
    """
    Produce a deterministic pseudo-random unit vector for `text`.

    Strategy: SHA-256 the text, extend with progressive HMAC rounds until
    we have `dim` floats, then L2-normalise. Identical text always returns
    identical vector. No ML model or GPU required.
    """
    seed = text.encode("utf-8")
    raw_floats: list[float] = []

    i = 0
    while len(raw_floats) < dim:
        digest = hashlib.sha256(seed + i.to_bytes(4, "big")).digest()
        for j in range(0, len(digest) - 3, 4):
            raw_floats.append(struct.unpack_from("!f", digest, j)[0])
        i += 1

    floats = raw_floats[:dim]

    norm = math.sqrt(sum(v * v for v in floats))
    if norm == 0.0:
        floats = [1.0 / math.sqrt(dim)] * dim
    else:
        floats = [v / norm for v in floats]

    return floats


def _tf_rerank_score(query: str, text: str) -> float:
    """Deterministic TF-based rerank score: fraction of query terms in text."""
    terms = [t.lower() for t in query.split() if len(t) > 2]
    if not terms:
        return 0.0
    text_lower = text.lower()
    hits = sum(1 for t in terms if t in text_lower)
    return hits / len(terms)


# ─── Request / response models ────────────────────────────────────────────────

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


# ─── Endpoints ────────────────────────────────────────────────────────────────

@aef_router.post("/embed", response_model=AefEmbedResponse)
async def aef_embed(req: AefEmbedRequest, request: Request) -> Any:
    """
    AEF CPU-dev embed endpoint.

    Returns deterministic hash-based embeddings of dimension 384.
    Suitable for integration tests and smoke runs without requiring a GPU or model download.
    """
    if not req.texts:
        raise HTTPException(status_code=400, detail="texts must contain at least one item")

    for i, text in enumerate(req.texts):
        if not text:
            raise HTTPException(status_code=400, detail=f"texts[{i}] must not be empty")

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
    """
    AEF CPU-dev rerank endpoint.

    Returns deterministic TF-based rerank scores. No cross-encoder model required.
    To swap in a real cross-encoder, replace `_tf_rerank_score` with a call to
    cross-encoder/ms-marco-MiniLM-L-6-v2 via sentence-transformers.
    """
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
            "id": c.id,
            "tf_score": _tf_rerank_score(req.query, c.text),
            "original_score": c.score or 0.0,
        }
        for c in req.candidates
    ]

    scored.sort(
        key=lambda x: 0.7 * x["tf_score"] + 0.3 * x["original_score"],
        reverse=True,
    )

    top_k = min(req.top_k, len(scored)) if req.top_k > 0 else len(scored)

    results = [
        AefRerankResult(
            id=s["id"],
            score=round(0.7 * s["tf_score"] + 0.3 * s["original_score"], 6),
            rank=idx + 1,
        )
        for idx, s in enumerate(scored[:top_k])
    ]

    return AefRerankResponse(results=results, model=req.model)
