"""Lyte Metrics Store — retrieval backend for the Substrate engine."""

from .corpus import LYTE_CORPUS, MetricsDocument, build_default_corpus
from .retrieval import score_document, top_k_documents

__all__ = [
    "LYTE_CORPUS",
    "MetricsDocument",
    "build_default_corpus",
    "score_document",
    "top_k_documents",
]
