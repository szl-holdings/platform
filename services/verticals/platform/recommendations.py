"""Platform / AgentOps recommendations — substrate contract output.

The primary recommendation requires human approval because deploying a model
policy change to production is a critical-path action (production_deploy
input class).  This exercises the approval gate path of the flight recorder.
"""

from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *,
    signals: list[dict[str, Any]],
    forecast: dict[str, Any],
    evidence: list[dict[str, Any]],
) -> Recommendation:
    """Build the primary platform recommendation from the pipeline outputs."""
    confidence = float(forecast.get("confidence", 0.80))
    risk_factors = forecast.get("risk_factors", [])
    gates_ok = forecast.get("gates_ok", False)
    policy_valid = forecast.get("policy_valid", False)

    if risk_factors:
        title = f"Resolve platform risk factors before next release: {'; '.join(risk_factors)}"
        next_action = (
            "Remediate identified risk factors, re-run `pnpm run meridian:check`, "
            "and gate the release on a clean audit output."
        )
        rollback_path = "Revert last merge, restore previous model-policy.json, re-validate."
        requires_human_approval = True
    else:
        title = "Platform substrate healthy — approve for release cycle advancement"
        next_action = (
            "Advance to release cycle — all meridian gates are green. "
            "Run `pnpm run release:check` to confirm end-to-end readiness."
        )
        rollback_path = "If post-release anomalies appear, re-run `pnpm run meridian:check` and escalate."
        requires_human_approval = True

    return Recommendation(
        id="rec_platform_release_gate",
        vertical="platform",
        title=title,
        owner="cto@szl",
        confidence=confidence,
        evidence_ids=[ev["id"] for ev in evidence],
        next_action=next_action,
        rollback_path=rollback_path,
        requires_human_approval=requires_human_approval,
        input_class="production_deploy",
        output_class="operator_recommendation_v1",
    )
