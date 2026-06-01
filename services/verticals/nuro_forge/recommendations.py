"""NuroForge recommendations stub."""

from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    return Recommendation(
        id="rec_nuro_regression_review",
        vertical="nuro-forge",
        title="Review Agent-v2.4 legal reasoning regression before promoting to production",
        owner="ml-platform@szl",
        confidence=float(forecast.get("confidence", 0.70)),
        evidence_ids=[e["id"] for e in evidence],
        next_action="Run targeted legal eval suite; compare against v2.3 baseline; approve or rollback.",
        rollback_path="Rollback to Agent-v2.3 if regression cannot be resolved within 48h.",
        input_class="nuro_signals_v1",
        output_class="nuro_brief_v1",
    )
