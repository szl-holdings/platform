"""
Retrieval scoring for the Lyte metrics corpus.

Scoring is a lightweight BM25-ish blend of:
  * term-frequency hits in document content
  * the document's static `relevanceScore` (a per-doc prior)
  * an optional metadata-filter exact-match boost

This mirrors the contract of the substrate Python worker's retrieval stage
(see ``services/substrate-py-workers/src/worker/stages/retrieval.py``) so a
caller hitting this service sees the same ranking semantics it would see if
the worker had a built-in index.
"""

from __future__ import annotations

import re
from typing import Any, Iterable

from .corpus import MetricsDocument


_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def score_document(
    doc: MetricsDocument,
    query_terms: list[str],
    filters: dict[str, Any] | None,
) -> float:
    """Return a 0..1 relevance score for a single document."""
    if not query_terms:
        return 0.0

    content = doc.content.lower()
    hits = sum(content.count(term) for term in query_terms)
    coverage = sum(1 for t in query_terms if t in content) / len(query_terms)

    # tf component, capped so very long documents do not dominate
    tf = min(hits / max(len(query_terms), 1), 1.0)

    # blended score: prior + coverage + tf
    base = doc.relevanceScore * 0.4 + coverage * 0.4 + tf * 0.2

    # filter is exact-match; any mismatch (or missing key) drops the doc.
    if filters:
        for k, v in filters.items():
            if doc.metadata.get(k) != v:
                return 0.0
            base = min(1.0, base + 0.05)

    return min(1.0, max(0.0, base))


def top_k_documents(
    query: str,
    *,
    top_k: int,
    min_relevance_score: float,
    filters: dict[str, Any] | None,
    corpus: Iterable[MetricsDocument],
) -> list[dict[str, Any]]:
    """Score the corpus against a query and return the top-k as plain dicts."""
    query_terms = _tokenize(query)
    scored: list[tuple[MetricsDocument, float]] = []
    for doc in corpus:
        # Filter mismatches drop the document entirely (separate from the
        # relevance threshold), otherwise a min_relevance_score of 0.0 would
        # still admit them.
        if filters and any(doc.metadata.get(k) != v for k, v in filters.items()):
            continue
        s = score_document(doc, query_terms, filters)
        if s >= min_relevance_score:
            scored.append((doc, s))
    scored.sort(key=lambda x: x[1], reverse=True)
    scored = scored[: max(top_k, 0)]
    return [
        {
            "id": doc.id,
            "content": doc.content,
            "relevanceScore": round(score, 4),
            "source": doc.source,
            "metadata": doc.metadata,
        }
        for doc, score in scored
    ]
