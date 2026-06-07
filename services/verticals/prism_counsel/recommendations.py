from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    return Recommendation(
        id="rec_counsel_lock_response_brief",
        vertical="prism_counsel",
        title="Lock the response-brief outline and assign drafting today",
        owner="lead-counsel@szl",
        confidence=float(forecast.get("confidence", 0.65)),
        evidence_ids=[e["id"] for e in evidence],
        next_action="Approve outline, assign sections to two associates, confirm preservation notices.",
        rollback_path="If outline changes, re-cut assignments and notify the matter team within 12h.",
        input_class="counsel_matter_signals_v1",
        output_class="matter_flight_recorder_v1",
    )
