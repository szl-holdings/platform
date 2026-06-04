from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    return Recommendation(
        id="rec_lyte_collapse_approval_chain",
        vertical="lyte_kora",
        title="Collapse the DEC-204 approval chain to 3 named approvers",
        owner="ops@szl",
        confidence=float(forecast.get("confidence", 0.6)),
        evidence_ids=[e["id"] for e in evidence],
        next_action="Reduce approver list and require benchmark-backed alternatives before next sync.",
        rollback_path="Restore the 5-person chain and reschedule decision if quality regresses.",
        input_class="lyte_decision_signals_v1",
        output_class="decision_debt_recommendation_v1",
    )
