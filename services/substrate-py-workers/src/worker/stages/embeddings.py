"""
Governed stage: deterministic embeddings and reranking.

This stage is intentionally model-free by default. It gives the Python worker
fleet a real embeddings/rerank execution path for local smoke tests,
counterfactual runs, and replay without downloading models or activating a
third-party provider. Live use of the deterministic dev model is fail-closed
unless an operator explicitly enables the environment gate documented below.

External providers such as Hugging Face can be added later only through a
licensed model registry record. Do not call external inference from this stage
without adding license metadata, env-gated activation, and tests.
"""

from __future__ import annotations

import hashlib
import json
import math
import os
import time
from dataclasses import asdict, dataclass
from typing import Any

EMBED_DIM = 384
DEFAULT_EMBED_MODEL = "aef-dev-hash"
DEFAULT_RERANK_MODEL = "aef-dev-rerank"
DEV_MODEL_ENV_GATE = "SUBSTRATE_EMBEDDINGS_ALLOW_DEV_MODEL"


@dataclass(frozen=True)
class StageModelRecord:
    model_id: str
    provider: str
    capabilities: tuple[str, ...]
    license: str
    env_gate: str | None
    production_enabled: bool
    notes: str

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


_MODEL_REGISTRY: dict[str, StageModelRecord] = {
    DEFAULT_EMBED_MODEL: StageModelRecord(
        model_id=DEFAULT_EMBED_MODEL,
        provider="internal-deterministic",
        capabilities=("embedding",),
        license="internal-model-free-deterministic",
        env_gate=DEV_MODEL_ENV_GATE,
        production_enabled=False,
        notes="CPU-only deterministic vectors for smoke, replay, and counterfactual runs.",
    ),
    DEFAULT_RERANK_MODEL: StageModelRecord(
        model_id=DEFAULT_RERANK_MODEL,
        provider="internal-deterministic",
        capabilities=("rerank",),
        license="internal-model-free-deterministic",
        env_gate=DEV_MODEL_ENV_GATE,
        production_enabled=False,
        notes="CPU-only deterministic lexical rerank for smoke, replay, and counterfactual runs.",
    ),
}


def _truthy_env(name: str | None) -> bool:
    if not name:
        return False
    return os.environ.get(name, "").lower() in {"1", "true", "yes", "on"}


def _resolve_model(model_id: str, capability: str, mode: str) -> StageModelRecord:
    record = _MODEL_REGISTRY.get(model_id)
    if record is None:
        raise ValueError(
            f"Unknown Python worker model {model_id!r}. Register a model record with "
            "provider, capability, and license metadata before activation."
        )
    if capability not in record.capabilities:
        raise ValueError(
            f"Model {model_id!r} does not support capability {capability!r}; "
            f"available capabilities: {record.capabilities!r}."
        )
    if not record.license:
        raise ValueError(f"Model {model_id!r} is missing license metadata.")
    if mode == "live" and not record.production_enabled and not _truthy_env(record.env_gate):
        raise RuntimeError(
            f"Live {capability} stage refused to use non-production model {model_id!r}. "
            f"Set {record.env_gate}=1 for an explicit local/dev opt-in, or register a "
            "production-enabled model with license metadata."
        )
    return record


def _stable_json(payload: Any) -> str:
    return json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _input_hash(payload: Any) -> str:
    return hashlib.sha256(_stable_json(payload).encode("utf-8")).hexdigest()[:16]


def _hash_embed(text: str, dim: int = EMBED_DIM) -> list[float]:
    values: list[float] = []
    round_idx = 0
    seed = text.encode("utf-8")

    while len(values) < dim:
        digest = hashlib.sha256(seed + round_idx.to_bytes(4, "big")).digest()
        for offset in range(0, len(digest), 4):
            if len(values) >= dim:
                break
            n = int.from_bytes(digest[offset : offset + 4], "big", signed=False)
            values.append((n / 0xFFFFFFFF) * 2.0 - 1.0)
        round_idx += 1

    norm = math.sqrt(sum(v * v for v in values))
    if norm == 0.0:
        return [round(1.0 / math.sqrt(dim), 8)] * dim
    return [round(v / norm, 8) for v in values]


def _terms(text: str) -> list[str]:
    return [term.lower() for term in text.split() if len(term) > 2]


def _lexical_score(query: str, text: str) -> float:
    query_terms = _terms(query)
    if not query_terms:
        return 0.0
    text_lower = text.lower()
    hits = sum(1 for term in query_terms if term in text_lower)
    return hits / len(query_terms)


def _normalize_texts(raw_input: dict[str, Any]) -> list[str]:
    texts = raw_input.get("texts")
    if isinstance(texts, str):
        texts = [texts]
    if not isinstance(texts, list) or not texts:
        raise ValueError("embedding stage requires input.texts as a non-empty string list")
    out = []
    for idx, text in enumerate(texts):
        if not isinstance(text, str) or not text.strip():
            raise ValueError(f"input.texts[{idx}] must be a non-empty string")
        out.append(text)
    return out


def _normalize_candidates(raw_input: dict[str, Any]) -> list[dict[str, Any]]:
    candidates = raw_input.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        raise ValueError("rerank stage requires input.candidates as a non-empty list")
    out: list[dict[str, Any]] = []
    for idx, candidate in enumerate(candidates):
        if not isinstance(candidate, dict):
            raise ValueError(f"input.candidates[{idx}] must be an object")
        candidate_id = candidate.get("id")
        text = candidate.get("text") or candidate.get("content")
        if not isinstance(candidate_id, str) or not candidate_id:
            raise ValueError(f"input.candidates[{idx}].id must be a non-empty string")
        if not isinstance(text, str) or not text.strip():
            raise ValueError(f"input.candidates[{idx}].text must be a non-empty string")
        raw_score = candidate.get("score")
        base_score = float(raw_score) if isinstance(raw_score, (int, float)) else 0.0
        out.append({"id": candidate_id, "text": text, "score": max(0.0, min(1.0, base_score))})
    return out


async def execute(claim: dict[str, Any]) -> dict[str, Any]:
    start = time.monotonic()
    config = claim.get("stageConfig", {}) or {}
    raw_input = claim.get("input") or {}
    mode = claim.get("mode", "live")

    operation = str(config.get("operation") or raw_input.get("operation") or "embed").lower()
    if operation not in {"embed", "rerank", "embed_and_rerank"}:
        raise ValueError("embedding stage operation must be one of: embed, rerank, embed_and_rerank")

    dim = int(config.get("dimensions") or raw_input.get("dimensions") or EMBED_DIM)
    if dim <= 0 or dim > 4096:
        raise ValueError("embedding dimensions must be between 1 and 4096")

    top_k = int(
        config.get("topK")
        or config.get("top_k")
        or raw_input.get("topK")
        or raw_input.get("top_k")
        or 10
    )
    if top_k <= 0:
        raise ValueError("rerank topK/top_k must be positive")

    embed_model_id = str(
        config.get("embeddingModel") or raw_input.get("embeddingModel") or DEFAULT_EMBED_MODEL
    )
    rerank_model_id = str(
        config.get("rerankModel") or raw_input.get("rerankModel") or DEFAULT_RERANK_MODEL
    )

    replay_payload = {
        "operation": operation,
        "texts": raw_input.get("texts"),
        "query": raw_input.get("query"),
        "candidates": raw_input.get("candidates"),
        "dimensions": dim,
        "topK": top_k,
        "embeddingModel": embed_model_id,
        "rerankModel": rerank_model_id,
    }
    replay_hash = _input_hash(replay_payload)

    if mode == "replay" and raw_input.get("replayHash") and raw_input["replayHash"] != replay_hash:
        raise ValueError(
            f"Replay hash mismatch: expected {raw_input['replayHash']!r}, got {replay_hash!r}."
        )

    embed_model: StageModelRecord | None = None
    rerank_model: StageModelRecord | None = None
    if operation in {"embed", "embed_and_rerank"}:
        embed_model = _resolve_model(embed_model_id, "embedding", mode)
    if operation in {"rerank", "embed_and_rerank"}:
        rerank_model = _resolve_model(rerank_model_id, "rerank", mode)

    evidence_ids = [f"py-embedding:{replay_hash}"]
    if mode == "dry-run":
        return {
            "operation": operation,
            "vectors": [],
            "results": [],
            "dimensions": dim,
            "inputHash": replay_hash,
            "evidenceIds": evidence_ids,
            "models": [m.to_dict() for m in (embed_model, rerank_model) if m],
            "confidence": 0.9,
            "dryRun": True,
            "worker": "python-fleet",
            "mode": mode,
        }

    vectors: list[list[float]] = []
    token_counts: list[int] = []
    if operation in {"embed", "embed_and_rerank"}:
        texts = _normalize_texts(raw_input)
        vectors = [_hash_embed(text, dim) for text in texts]
        token_counts = [max(1, len(text.split())) for text in texts]

    results: list[dict[str, Any]] = []
    if operation in {"rerank", "embed_and_rerank"}:
        query = raw_input.get("query")
        if not isinstance(query, str) or not query.strip():
            raise ValueError("rerank stage requires input.query as a non-empty string")
        candidates = _normalize_candidates(raw_input)
        scored = []
        for candidate in candidates:
            lexical = _lexical_score(query, candidate["text"])
            score = 0.7 * lexical + 0.3 * candidate["score"]
            scored.append({**candidate, "score": round(score, 6)})
        scored.sort(key=lambda c: c["score"], reverse=True)
        results = [
            {
                "id": candidate["id"],
                "score": candidate["score"],
                "rank": idx + 1,
            }
            for idx, candidate in enumerate(scored[: min(top_k, len(scored))])
        ]

    elapsed_ms = int((time.monotonic() - start) * 1000)
    confidence = 0.9 if operation == "embed" else (results[0]["score"] if results else 0.75)

    return {
        "operation": operation,
        "vectors": vectors,
        "results": results,
        "dimensions": dim,
        "tokenCounts": token_counts,
        "inputHash": replay_hash,
        "evidenceIds": evidence_ids,
        "models": [m.to_dict() for m in (embed_model, rerank_model) if m],
        "confidence": round(float(confidence), 4),
        "elapsedMs": elapsed_ms,
        "worker": "python-fleet",
        "mode": mode,
    }


__all__ = ["execute", "EMBED_DIM", "DEFAULT_EMBED_MODEL", "DEFAULT_RERANK_MODEL"]
