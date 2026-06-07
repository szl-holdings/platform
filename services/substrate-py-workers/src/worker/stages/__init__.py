"""
Heavy-compute stage implementations for the Python worker fleet.

Registered stages:
  - retrieval    Large-context retrieval and re-rank (Opportunity Audit, Executive Brief)
  - ocr          Document chunking, OCR, clause extraction (PRISM Counsel)
  - geospatial   Geospatial intersection and anomaly detection (Vessels, Terra)
  - eval_grading Eval grading and scoring sweeps (Eval Console)
"""

from .retrieval import execute as execute_retrieval
from .ocr import execute as execute_ocr
from .geospatial import execute as execute_geospatial
from .eval_grading import execute as execute_eval_grading

STAGE_REGISTRY: dict[str, object] = {
    "retrieval": execute_retrieval,
    "ocr": execute_ocr,
    "geospatial": execute_geospatial,
    "eval_grading": execute_eval_grading,
}

__all__ = [
    "STAGE_REGISTRY",
    "execute_retrieval",
    "execute_ocr",
    "execute_geospatial",
    "execute_eval_grading",
]
