from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def synthesise(
    *,
    signals: list[dict[str, Any]],
    forecast: dict[str, Any],
    evidence: list[dict[str, Any]],
    recommendation: Recommendation,
) -> dict[str, Any]:
    proof = next((s for s in signals if s["kind"] == "proof_asset"), None)
    channel = next((s for s in signals if s["kind"] == "channel_signal"), None)
    return {
        "headline": recommendation.title,
        "campaign_thesis": forecast.get("campaign_thesis"),
        "proof_asset": proof["summary"] if proof else None,
        "channel": channel["summary"] if channel else None,
        "cta": "Book a 20-minute demo with the Vessels team",
        "hyperframes_video_brief_placeholder": {
            "duration_seconds": 45,
            "scenes": ["proof_intro", "metric_callout", "cta"],
            "ready_for_render": False,
        },
        "evidence_count": len(evidence),
    }
