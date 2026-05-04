"""
Evidence ranker — Python source-of-truth for evidence ranking.

Called by the TypeScript bridge via stageType='EvidenceRank' instead of
performing ranking in TypeScript. This keeps ranking logic in Python where
it can use real NLP tools (TF-IDF, BM25, cross-encoder) and be iterated
independently of the TS API server.

Ranking strategy (progressive degradation):
  1. Cross-encoder rerank (requires sentence-transformers cross-encoder)
  2. BM25 (requires rank_bm25)
  3. TF-IDF cosine similarity (pure Python, always available)
  4. Original-score pass-through (fallback if input has pre-scored evidence)

The /claim endpoint accepts stageType='EvidenceRank' with input:
  {
    "query": str,
    "evidence": [{"id": str, "text": str, "score"?: float, ...}],
    "top_k": int,             # default 10
    "method": str,            # "auto" | "tfidf" | "bm25" | "cross-encoder"
  }

Returns:
  {
    "ranked": [{"id": str, "score": float, "rank": int, "text": str}],
    "method_used": str,
    "query": str,
  }
"""

from __future__ import annotations

import math
import os
import re
from typing import Any

import structlog

log = structlog.get_logger(__name__)

EVIDENCE_RANK_TOP_K_DEFAULT = int(os.environ.get("EVIDENCE_RANK_TOP_K", "10"))
EVIDENCE_RANK_METHOD = os.environ.get("EVIDENCE_RANK_METHOD", "auto")


# ── Tokeniser ─────────────────────────────────────────────────────────────────

def _tokenise(text: str) -> list[str]:
    return re.findall(r"\b[a-z]{2,}\b", text.lower())


# ── TF-IDF cosine similarity (always available) ───────────────────────────────

def _tfidf_scores(query: str, texts: list[str]) -> list[float]:
    """Compute TF-IDF cosine similarity between query and each text."""
    corpus = [query] + texts
    tokenised = [_tokenise(t) for t in corpus]

    # Build IDF over query + corpus
    df: dict[str, int] = {}
    N = len(corpus)
    for doc in tokenised:
        for term in set(doc):
            df[term] = df.get(term, 0) + 1

    idf = {term: math.log((1 + N) / (1 + freq)) + 1.0 for term, freq in df.items()}

    def tf_idf_vec(tokens: list[str]) -> dict[str, float]:
        tf: dict[str, int] = {}
        for t in tokens:
            tf[t] = tf.get(t, 0) + 1
        total = max(len(tokens), 1)
        return {t: (count / total) * idf.get(t, 1.0) for t, count in tf.items()}

    def cosine(a: dict[str, float], b: dict[str, float]) -> float:
        dot = sum(a.get(t, 0) * b.get(t, 0) for t in a)
        mag_a = math.sqrt(sum(v * v for v in a.values())) or 1.0
        mag_b = math.sqrt(sum(v * v for v in b.values())) or 1.0
        return dot / (mag_a * mag_b)

    query_vec = tf_idf_vec(tokenised[0])
    return [cosine(query_vec, tf_idf_vec(doc)) for doc in tokenised[1:]]


# ── BM25 (optional; requires rank_bm25) ───────────────────────────────────────

def _bm25_scores(query: str, texts: list[str]) -> list[float] | None:
    try:
        from rank_bm25 import BM25Okapi  # type: ignore[import-untyped]
        tokenised = [_tokenise(t) for t in texts]
        bm25 = BM25Okapi(tokenised)
        scores = bm25.get_scores(_tokenise(query))
        return list(scores)
    except ImportError:
        return None


# ── Cross-encoder (optional; requires sentence-transformers) ──────────────────

def _cross_encoder_scores(query: str, texts: list[str]) -> list[float] | None:
    try:
        from sentence_transformers import CrossEncoder  # type: ignore[import-untyped]
        model_name = os.environ.get(
            "EVIDENCE_CROSS_ENCODER_MODEL",
            "cross-encoder/ms-marco-MiniLM-L-6-v2",
        )
        model = CrossEncoder(model_name)
        pairs = [[query, t] for t in texts]
        scores = model.predict(pairs)
        return [float(s) for s in scores]
    except (ImportError, Exception):
        return None


# ── Public API ────────────────────────────────────────────────────────────────

def rank_evidence(
    query: str,
    evidence: list[dict[str, Any]],
    top_k: int = EVIDENCE_RANK_TOP_K_DEFAULT,
    method: str = EVIDENCE_RANK_METHOD,
) -> dict[str, Any]:
    """
    Rank a list of evidence items by relevance to query.

    Args:
        query: The query string used to assess relevance.
        evidence: List of dicts with at least {"id": str, "text": str}.
                  May include a "score" float from upstream retrieval.
        top_k: Number of top results to return.
        method: "auto" | "tfidf" | "bm25" | "cross-encoder"

    Returns:
        {
            "ranked": [{"id", "score", "rank", "text"}],
            "method_used": str,
            "query": str,
        }
    """
    if not evidence:
        return {"ranked": [], "method_used": "none", "query": query}

    texts = [item.get("text", "") for item in evidence]
    method_used = "tfidf"
    scores: list[float] | None = None

    if method in ("auto", "cross-encoder"):
        scores = _cross_encoder_scores(query, texts)
        if scores is not None:
            method_used = "cross-encoder"

    if scores is None and method in ("auto", "bm25"):
        scores = _bm25_scores(query, texts)
        if scores is not None:
            method_used = "bm25"

    if scores is None:
        scores = _tfidf_scores(query, texts)
        method_used = "tfidf"

    # Blend with upstream scores when available (0.7 ranker + 0.3 upstream)
    blended = []
    for i, (item, score) in enumerate(zip(evidence, scores)):
        upstream = float(item.get("score", 0.0))
        blended.append((i, 0.7 * score + 0.3 * upstream))

    blended.sort(key=lambda x: x[1], reverse=True)

    top = blended[:top_k]
    ranked = [
        {
            "id": evidence[i]["id"],
            "score": round(score, 6),
            "rank": rank + 1,
            "text": evidence[i].get("text", ""),
        }
        for rank, (i, score) in enumerate(top)
    ]

    log.info(
        "evidence_ranked",
        query_length=len(query),
        evidence_count=len(evidence),
        top_k=top_k,
        method_used=method_used,
    )

    return {
        "ranked": ranked,
        "method_used": method_used,
        "query": query,
    }


async def handle_evidence_rank_claim(claim: dict[str, Any]) -> dict[str, Any]:
    """
    Stage handler for stageType='EvidenceRank'.
    Registered in STAGE_REGISTRY by stages/__init__.py.
    """
    inp = claim.get("input", {})
    query = inp.get("query", "")
    evidence = inp.get("evidence", [])
    top_k = int(inp.get("top_k", EVIDENCE_RANK_TOP_K_DEFAULT))
    method = inp.get("method", EVIDENCE_RANK_METHOD)

    result = rank_evidence(query=query, evidence=evidence, top_k=top_k, method=method)
    return {**result, "confidence": 0.9}
