from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    return Recommendation(
        id="rec_growth_proof_to_pipeline",
        vertical="marketing_growth",
        title="Run a 2-week proof-to-pipeline campaign on founder LinkedIn",
        owner="growth@szl",
        confidence=float(forecast.get("confidence", 0.55)),
        evidence_ids=[e["id"] for e in evidence],
        next_action="Approve a 2-week founder-LinkedIn cadence anchored on the Vessels 41% proof point.",
        rollback_path="If demo book rate drops vs baseline by week 2, pause cadence and re-cut creative.",
        input_class="growth_signals_v1",
        output_class="proof_to_pipeline_brief_v1",
    )
