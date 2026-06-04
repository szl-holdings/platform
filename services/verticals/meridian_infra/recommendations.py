"""Meridian Infra recommendations stub."""

from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    return Recommendation(
        id="rec_meridian_gpu_rightsizing",
        vertical="meridian-infra",
        title="Rightsize GPU cluster and release $28k/month in unused reserved capacity",
        owner="infra@szl",
        confidence=float(forecast.get("confidence", 0.74)),
        evidence_ids=[e["id"] for e in evidence],
        next_action="Convert 4 reserved GPU instances to on-demand; archive idle training jobs.",
        rollback_path="Re-purchase reserved capacity if GPU demand spikes above p95 baseline.",
        input_class="meridian_signals_v1",
        output_class="meridian_brief_v1",
    )
