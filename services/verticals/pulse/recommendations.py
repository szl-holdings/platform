"""Pulse recommendation stub — emits one deterministic Recommendation."""

from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    return Recommendation(
        id="rec_pulse_release_freeze_review",
        vertical="pulse",
        title="Resolve the release-freeze decision before EOD",
        owner="founder@szl",
        confidence=float(forecast.get("confidence", 0.6)),
        evidence_ids=[e["id"] for e in evidence],
        next_action="Hold a 15-minute Phase 7 sign-off review with eng + design owners.",
        rollback_path="If sign-off slips, extend the freeze by 24h and re-run Pulse tomorrow.",
        input_class="pulse_signals_v1",
        output_class="pulse_daily_brief_v1",
    )
