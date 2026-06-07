"""Firestorm Ops recommendations stub."""

from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    return Recommendation(
        id="rec_firestorm_cascade_containment",
        vertical="firestorm-ops",
        title="Activate cascade containment protocol — isolate auth service and shed non-critical load",
        owner="oncall@szl",
        confidence=float(forecast.get("confidence", 0.82)),
        evidence_ids=[e["id"] for e in evidence],
        next_action="Enable circuit breakers on 6 downstream services; notify stakeholders.",
        rollback_path="Restore normal routing once auth service latency returns below 200ms p99.",
        input_class="firestorm_signals_v1",
        output_class="firestorm_brief_v1",
    )
