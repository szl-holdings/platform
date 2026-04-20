"""
Heavy-compute stage: Large-context retrieval and re-rank.

Used by:
  - Opportunity Audit workflow (Lyte / SZL Holdings)
  - Executive Brief workflow (Pulse)

Contract:
  input:
    query: str           — retrieval query text
    topK: int            — number of results to retrieve (default 20)
    minScore: float      — minimum relevance score to keep (default 0.5)
    corpus: list[dict]   — optional pre-loaded documents; empty = use index
    mode: str            — execution mode (live | dry-run | replay | counterfactual)
    replayHash: str|None — deterministic seed for replay mode

  output:
    documents: list[dict]  — ranked documents with id, content, score, source
    retrievedCount: int
    rerankedCount: int
    queryHash: str         — deterministic hash for replay verification
    worker: str
"""

from __future__ import annotations

import hashlib
import json
import time
from typing import Any


def _score_document(doc: dict, query: str) -> float:
    """
    Lightweight BM25-approximation scoring for CPU-only Phase 1.
    Returns a float in [0, 1].
    """
    content = (doc.get("content") or doc.get("text") or "").lower()
    terms = query.lower().split()
    if not terms or not content:
        return 0.0
    hit_count = sum(content.count(t) for t in terms)
    boost = min(hit_count / max(len(terms), 1), 1.0)
    base = doc.get("relevanceScore") or doc.get("score") or 0.5
    return min(1.0, base * 0.6 + boost * 0.4)


def _deterministic_hash(query: str, topK: int, minScore: float) -> str:
    payload = json.dumps({"query": query, "topK": topK, "minScore": minScore}, sort_keys=True)
    return hashlib.sha256(payload.encode()).hexdigest()[:16]


async def execute(claim: dict[str, Any]) -> dict[str, Any]:
    """
    Execute the retrieval stage.  Returns a dict matching StageResultMessage.output.
    """
    start = time.monotonic()
    config = claim.get("stageConfig", {})
    raw_input = claim.get("input") or {}
    mode = claim.get("mode", "live")

    query: str = raw_input.get("query", "")
    topK: int = int(config.get("topK") or raw_input.get("topK") or 20)
    minScore: float = float(config.get("minRelevanceScore") or raw_input.get("minScore") or 0.5)
    corpus: list[dict] = raw_input.get("corpus") or []

    query_hash = _deterministic_hash(query, topK, minScore)

    if mode in ("dry-run",):
        return {
            "documents": [],
            "retrievedCount": 0,
            "rerankedCount": 0,
            "queryHash": query_hash,
            "worker": "python-fleet",
            "dryRun": True,
        }

    if mode == "replay" and raw_input.get("replayHash"):
        expected = raw_input["replayHash"]
        if query_hash != expected:
            raise ValueError(
                f"Replay hash mismatch: expected {expected!r}, got {query_hash!r}. "
                "Input may have changed between original run and replay."
            )

    if not corpus:
        corpus = _build_synthetic_corpus(query, topK * 2)

    scored = [(doc, _score_document(doc, query)) for doc in corpus]
    scored.sort(key=lambda x: x[1], reverse=True)

    filtered = [(doc, s) for doc, s in scored if s >= minScore][:topK]

    documents = [
        {
            "id": doc.get("id", f"ret-{i}"),
            "content": doc.get("content", ""),
            "relevanceScore": round(score, 4),
            "source": doc.get("source", "retrieval-index"),
            "metadata": doc.get("metadata", {}),
        }
        for i, (doc, score) in enumerate(filtered)
    ]

    elapsed_ms = int((time.monotonic() - start) * 1000)

    return {
        "documents": documents,
        "retrievedCount": len(corpus),
        "rerankedCount": len(documents),
        "queryHash": query_hash,
        "elapsedMs": elapsed_ms,
        "worker": "python-fleet",
        "mode": mode,
    }


def _build_synthetic_corpus(query: str, count: int) -> list[dict]:
    """Synthetic corpus used when no external index is configured."""
    terms = query.split()
    return [
        {
            "id": f"doc-{i}",
            "content": f"Document {i} about {' '.join(terms[:2])} with additional context for scoring.",
            "source": "synthetic-index",
            "relevanceScore": max(0.3, 1.0 - i * 0.04),
            "metadata": {"synthetic": True, "index": i},
        }
        for i in range(count)
    ]
