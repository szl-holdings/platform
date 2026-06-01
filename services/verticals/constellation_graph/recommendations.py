"""Constellation Graph recommendations stub."""

from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    return Recommendation(
        id="rec_constellation_counterparty_review",
        vertical="constellation-graph",
        title="Initiate cross-domain counterparty review for 3 entities shared between Maritime and Legal",
        owner="risk@szl",
        confidence=float(forecast.get("confidence", 0.65)),
        evidence_ids=[e["id"] for e in evidence],
        next_action="Pull entity profiles, cross-reference exposure levels, and flag for compliance review.",
        rollback_path="If no additional risk found, archive pattern and recalibrate graph weights.",
        input_class="constellation_signals_v1",
        output_class="constellation_brief_v1",
    )
