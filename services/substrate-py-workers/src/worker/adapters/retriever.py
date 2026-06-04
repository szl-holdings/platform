"""
Retriever backend adapters for the heavy-compute retrieval stage.

The retrieval stage (``worker/stages/retrieval.py``) consults
``retriever_adapter_manager`` to resolve a configured backend index by id
(``retrieverAdapterId``). Each adapter describes how to reach a live
retrieval endpoint — a Lyte metrics-store style HTTP service or a
configured vector search endpoint — and how to authenticate against it.

The contract is intentionally identical to the NVIDIA NIM endpoint
manager in ``packages/nvidia-adapters/src/nim-endpoint.ts`` so that the
substrate engine treats backend hooks uniformly:

* Predefined registry of named endpoints with id / baseUrl / apiKeyEnvVar.
* Per-endpoint env-var overrides for baseUrl so deployments can point at
  a real service without code changes.
* ``isAvailable(id)`` returns a structured (available, reason) tuple.
* ``retrieve(...)`` performs the live HTTP call and raises
  ``RetrieverAdapterUnavailable`` when the endpoint is not configured or
  reachable.

The HTTP wire contract for an adapter endpoint is:

    POST {baseUrl}{queryPath}
    Authorization: Bearer <api-key>
    Content-Type: application/json

    Request:
      {
        "query":            str,
        "topK":             int,
        "minRelevanceScore": float,
        "filters":          dict[str, Any] | null
      }

    Response (200):
      {
        "documents": [
          {
            "id":              str,
            "content":         str,
            "relevanceScore":  float,   # 0..1
            "source":          str,
            "metadata":        dict[str, Any]
          },
          ...
        ]
      }

Anything else is surfaced as ``RetrieverAdapterUnavailable`` so the
caller can decide whether to fail-closed (live mode) or fall back to
the synthetic corpus (non-live / dev modes).
"""

from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field, replace
from typing import Any

import httpx

logger = logging.getLogger(__name__)

# ─── Config ───────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class RetrieverAdapterConfig:
    """
    Static description of a retrieval backend.

    ``baseUrl`` may be overridden at runtime by the env var named in
    ``baseUrlEnvVar`` so deployments can point a logical adapter id
    (e.g. ``lyte-metrics-store``) at any concrete service URL without
    code changes.
    """

    id: str
    name: str
    baseUrl: str
    apiKeyEnvVar: str
    queryPath: str = "/retrieve"
    baseUrlEnvVar: str | None = None
    timeoutSeconds: float = 15.0
    enabled: bool = True
    tags: tuple[str, ...] = field(default_factory=tuple)


PREDEFINED_RETRIEVER_ADAPTERS: list[RetrieverAdapterConfig] = [
    RetrieverAdapterConfig(
        id="lyte-metrics-store",
        name="Lyte Metrics Store (Opportunity Audit)",
        baseUrl="http://lyte-metrics-store.internal:8081",
        baseUrlEnvVar="LYTE_METRICS_STORE_URL",
        apiKeyEnvVar="LYTE_METRICS_STORE_API_KEY",
        queryPath="/v1/retrieve",
        tags=("lyte", "opportunity-audit"),
    ),
    RetrieverAdapterConfig(
        id="signal-retriever",
        name="Pulse Executive Signal Retriever",
        baseUrl="http://pulse-signal-retriever.internal:8082",
        baseUrlEnvVar="PULSE_SIGNAL_RETRIEVER_URL",
        apiKeyEnvVar="PULSE_SIGNAL_RETRIEVER_API_KEY",
        queryPath="/v1/retrieve",
        tags=("pulse", "executive-brief"),
    ),
    RetrieverAdapterConfig(
        id="lyte-retriever",
        name="Lyte Operational Drift Retriever",
        baseUrl="http://lyte-metrics-store.internal:8081",
        baseUrlEnvVar="LYTE_METRICS_STORE_URL",
        apiKeyEnvVar="LYTE_METRICS_STORE_API_KEY",
        queryPath="/v1/retrieve",
        tags=("lyte", "operational-drift"),
    ),
]


# ─── Errors ───────────────────────────────────────────────────────────────────


class RetrieverAdapterUnavailable(RuntimeError):
    """Raised when a retriever adapter cannot serve a request."""

    def __init__(self, adapter_id: str, reason: str) -> None:
        self.adapter_id = adapter_id
        self.reason = reason
        super().__init__(f"Retriever adapter '{adapter_id}' unavailable: {reason}")


# ─── Manager ──────────────────────────────────────────────────────────────────


class RetrieverAdapterManager:
    """In-process registry of retriever adapter configs + HTTP caller."""

    def __init__(self, adapters: list[RetrieverAdapterConfig] | None = None) -> None:
        self._adapters: dict[str, RetrieverAdapterConfig] = {}
        for cfg in adapters if adapters is not None else PREDEFINED_RETRIEVER_ADAPTERS:
            self._adapters[cfg.id] = cfg

    # ── Registry ──────────────────────────────────────────────────────────────

    def register(self, config: RetrieverAdapterConfig) -> None:
        self._adapters[config.id] = config
        logger.info(
            "retriever_adapter_registered id=%s baseUrl=%s",
            config.id,
            self._resolved_base_url(config),
        )

    def get(self, adapter_id: str) -> RetrieverAdapterConfig | None:
        return self._adapters.get(adapter_id)

    def list(self) -> list[RetrieverAdapterConfig]:
        return list(self._adapters.values())

    def has(self, adapter_id: str) -> bool:
        return adapter_id in self._adapters

    def unregister(self, adapter_id: str) -> bool:
        return self._adapters.pop(adapter_id, None) is not None

    # ── Availability ──────────────────────────────────────────────────────────

    def is_available(self, adapter_id: str) -> tuple[bool, str | None]:
        cfg = self._adapters.get(adapter_id)
        if not cfg:
            return False, f"adapter id '{adapter_id}' not registered"
        if not cfg.enabled:
            return False, "adapter disabled"
        base_url = self._resolved_base_url(cfg)
        if not base_url:
            return False, (
                f"baseUrl not configured (set env '{cfg.baseUrlEnvVar}' "
                f"or update the adapter config)"
            )
        api_key = os.environ.get(cfg.apiKeyEnvVar)
        is_local = base_url.startswith("http://localhost") or base_url.startswith(
            "http://127.0.0.1"
        )
        if not api_key and not is_local:
            return False, f"API key env var '{cfg.apiKeyEnvVar}' not configured"
        return True, None

    # ── Retrieval call ────────────────────────────────────────────────────────

    async def retrieve(
        self,
        adapter_id: str,
        query: str,
        top_k: int,
        min_relevance_score: float,
        filters: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        cfg = self._adapters.get(adapter_id)
        if cfg is None:
            raise RetrieverAdapterUnavailable(
                adapter_id, f"adapter id '{adapter_id}' not registered"
            )
        ok, reason = self.is_available(adapter_id)
        if not ok:
            raise RetrieverAdapterUnavailable(adapter_id, reason or "unavailable")

        base_url = self._resolved_base_url(cfg)
        api_key = os.environ.get(cfg.apiKeyEnvVar) or "local-dev"
        url = base_url.rstrip("/") + cfg.queryPath
        body = {
            "query": query,
            "topK": top_k,
            "minRelevanceScore": min_relevance_score,
            "filters": filters or {},
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "User-Agent": "substrate-py-workers/1.0 retriever-adapter",
        }

        try:
            async with httpx.AsyncClient(timeout=cfg.timeoutSeconds) as client:
                response = await client.post(url, json=body, headers=headers)
        except httpx.HTTPError as exc:
            raise RetrieverAdapterUnavailable(
                adapter_id, f"HTTP transport error: {exc!s}"
            ) from exc

        if response.status_code >= 400:
            raise RetrieverAdapterUnavailable(
                adapter_id,
                f"HTTP {response.status_code}: {response.text[:300]}",
            )

        try:
            payload = response.json()
        except ValueError as exc:
            raise RetrieverAdapterUnavailable(
                adapter_id, f"invalid JSON response: {exc!s}"
            ) from exc

        documents = payload.get("documents")
        if not isinstance(documents, list):
            raise RetrieverAdapterUnavailable(
                adapter_id,
                "response missing 'documents' list",
            )

        normalised: list[dict[str, Any]] = []
        for i, doc in enumerate(documents):
            if not isinstance(doc, dict):
                continue
            normalised.append(
                {
                    "id": str(doc.get("id") or f"{adapter_id}-{i}"),
                    "content": str(doc.get("content") or doc.get("text") or ""),
                    "relevanceScore": float(
                        doc.get("relevanceScore")
                        or doc.get("score")
                        or 0.0
                    ),
                    "source": str(doc.get("source") or adapter_id),
                    "metadata": doc.get("metadata") if isinstance(doc.get("metadata"), dict) else {},
                }
            )
        return normalised

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _resolved_base_url(cfg: RetrieverAdapterConfig) -> str:
        if cfg.baseUrlEnvVar:
            override = os.environ.get(cfg.baseUrlEnvVar)
            if override:
                return override
        return cfg.baseUrl

    def with_overrides(self, **kwargs: Any) -> "RetrieverAdapterManager":
        """Return a copy with the same registrations (useful in tests)."""
        clone = RetrieverAdapterManager(adapters=[])
        for cfg in self._adapters.values():
            clone.register(replace(cfg, **kwargs))
        return clone


# Module-level singleton — mirrors the nim_endpoint_manager pattern.
retriever_adapter_manager = RetrieverAdapterManager()
