from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    return Recommendation(
        id="rec_fin_pricing_response",
        vertical="finance_fincept",
        title="Stage a pricing response to the entry-tier cut",
        owner="cfo@szl",
        confidence=float(forecast.get("confidence", 0.55)),
        evidence_ids=[e["id"] for e in evidence],
        next_action="Approve a 30-day pricing experiment on the entry tier with packaged-feature gating.",
        rollback_path="If win-rate worsens by >5 pts in week 2, restore prior pricing within 24h.",
        input_class="finance_signals_v1",
        output_class="capital_weather_recommendation_v1",
    )
