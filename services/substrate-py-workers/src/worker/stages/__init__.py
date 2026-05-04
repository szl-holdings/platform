"""
Heavy-compute stage implementations for the Python worker fleet.

Registered stages:
  - retrieval      Large-context retrieval and re-rank (Opportunity Audit, Executive Brief)
  - ocr            Document chunking, OCR, clause extraction (PRISM Counsel)
  - geospatial     Geospatial intersection and anomaly detection (Vessels, Terra)
  - eval_grading   Eval grading and scoring sweeps (Eval Console)
  - model_route    Model/provider selection (delegates to model_router.py)
  - evidence_rank  Evidence ranking (delegates to evidence_ranker.py)
"""

from .retrieval import execute as execute_retrieval
from .ocr import execute as execute_ocr
from .geospatial import execute as execute_geospatial
from .eval_grading import execute as execute_eval_grading
from ..model_router import select_model
from ..evidence_ranker import handle_evidence_rank_claim
from typing import Any


async def _execute_model_route(claim: dict[str, Any]) -> dict[str, Any]:
    """
    Stage handler for stageType='model_route'.
    Returns the Python-side model selection so the TS bridge stays thin.

    Fail-closed contract (live mode):
      When mode='live' and the result would be is_demo=True (mock/stub), this
      handler raises ValueError — which the dispatcher converts to stage.error.
      This enforces the guarantee that live inference calls never silently fall
      back to synthetic responses without an explicit error surfaced to the caller.

    Non-live modes (dry-run, replay, counterfactual):
      Demo/mock results are permitted — they are expected for local development
      and CI environments where GPU inference is not available.
    """
    inp = claim.get("input", {}) or {}
    role = inp.get("role", "reasoning")
    requested_model = inp.get("model")
    mode = claim.get("mode", "live")

    selection = select_model(role=role, requested_model=requested_model)

    if mode == "live" and selection.is_demo:
        raise ValueError(
            f"model_route fail-closed: live mode requested but no real provider is available "
            f"(substrate gate: SUBSTRATE_INFERENCE_URL/SUBSTRATE_API_KEY not configured; "
            f"failed_gates={selection.failed_gates!r}). "
            f"Set SUBSTRATE_INFERENCE_URL + SUBSTRATE_API_KEY, or a cloud provider key, "
            f"or use mode='dry-run' for local development."
        )

    return {
        "provider": selection.provider,
        "model": selection.model,
        "is_demo": selection.is_demo,
        "reason": selection.reason,
        "failed_gates": selection.failed_gates,
        "confidence": 1.0,
    }


STAGE_REGISTRY: dict[str, Any] = {
    "retrieval": execute_retrieval,
    "ocr": execute_ocr,
    "geospatial": execute_geospatial,
    "eval_grading": execute_eval_grading,
    "model_route": _execute_model_route,
    "evidence_rank": handle_evidence_rank_claim,
}

__all__ = [
    "STAGE_REGISTRY",
    "execute_retrieval",
    "execute_ocr",
    "execute_geospatial",
    "execute_eval_grading",
]
