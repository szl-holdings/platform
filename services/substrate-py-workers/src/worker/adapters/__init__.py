"""
Backend adapter registries for the Python worker fleet.

These mirror the TypeScript adapter pattern (e.g.
``packages/nvidia-adapters/src/nim-endpoint.ts``) so a stage can resolve a
real backend endpoint by id, fail-closed when the endpoint is unavailable
in live mode, and fall back to deterministic synthetic output only in
non-live / dev modes.
"""

from .retriever import (
    RetrieverAdapterConfig,
    RetrieverAdapterManager,
    RetrieverAdapterUnavailable,
    PREDEFINED_RETRIEVER_ADAPTERS,
    retriever_adapter_manager,
)

__all__ = [
    "RetrieverAdapterConfig",
    "RetrieverAdapterManager",
    "RetrieverAdapterUnavailable",
    "PREDEFINED_RETRIEVER_ADAPTERS",
    "retriever_adapter_manager",
]
