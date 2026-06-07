from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    return Recommendation(
        id="rec_terra_close_diligence_gap",
        vertical="terra",
        title="Close the Phase-II environmental diligence gap before close",
        owner="terra-deal-lead@szl",
        confidence=float(forecast.get("confidence", 0.55)),
        evidence_ids=[e["id"] for e in evidence],
        next_action="Commission Phase-II environmental and re-price downside contingency by 4%.",
        rollback_path="If Phase-II is clean, restore original price and reduce contingency.",
        input_class="terra_acquisition_signals_v1",
        output_class="terra_acquisition_recommendation_v1",
    )
