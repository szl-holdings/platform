from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    return Recommendation(
        id="rec_vessels_refresh_sanctions_screen",
        vertical="vessels",
        title="Refresh sanctions screening for counterparty before bunkering",
        owner="vessels-ops@szl",
        confidence=float(forecast.get("confidence", 0.6)),
        evidence_ids=[e["id"] for e in evidence],
        next_action="Re-run sanctions screen and document refresh in voyage flight recorder.",
        rollback_path="If counterparty fails refreshed screen, hold bunkering and escalate to compliance.",
        input_class="vessels_voyage_signals_v1",
        output_class="voyage_risk_recommendation_v1",
    )
