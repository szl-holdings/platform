"""Canonical Python example detectors."""

from .embedding_drift import EmbeddingDriftDetector
from .log_anomaly_isoforest import LogAnomalyIsoForestDetector

__all__ = ["EmbeddingDriftDetector", "LogAnomalyIsoForestDetector"]
