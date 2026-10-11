"""Minimal strict runtime fixtures."""

from __future__ import annotations

from typing import Any


def cell(vertical_id: str = "lyte-services") -> dict[str, Any]:
    killinchu = vertical_id == "killinchu"
    return {
        "allowed_actions": (
            [
                "simulate",
                "classify synthetic observation",
                "recommend",
                "deny",
                "escalate",
                "record human decision",
                "replay",
            ]
            if killinchu
            else ["recommend a reconciled service option"]
        ),
        "buyer": "service operator",
        "core_workflows": ["reconcile evidence"],
        "data_policy": {
            "protected": ["minimum necessary operator data"],
            "public": ["synthetic fixtures"],
            "training_use": "none without explicit opt-in",
        },
        "decision_problem": "Which evidenced service option should be reviewed?",
        "display_name": vertical_id.replace("-", " ").title(),
        "formula_bindings": ["F1", "LAMBDA"],
        "hf_space_id": f"SZLHOLDINGS/{vertical_id}",
        "human_authority": ["operator approval"],
        "leaders": [
            {
                "name": "Example One",
                "pattern": "evidence-first recommendation",
                "url": "https://example.com/one",
            },
            {
                "name": "Example Two",
                "pattern": "human approval before action",
                "url": "https://example.com/two",
            },
        ],
        "negative_tests": ["no evidence must deny"],
        "original_szl_design": "recommendation-only test fixture",
        "portfolio_role": "vertical recommendation cell",
        "prohibited_actions": (
            [
                "autonomous interdiction",
                "engage target",
                "missile or munition launch",
                "navigation control",
                "operational targeting",
                "physical effector",
                "target engagement",
                "weapon command",
            ]
            if killinchu
            else ["execute a payment"]
        ),
        "public_launch": (
            "KEEP_PUBLIC_ONLY_AS_SIMULATED_PROPOSAL_SYSTEM"
            if killinchu
            else "BLOCKED_UNTIL_PILOT_EVIDENCE"
        ),
        "schema": "szl.vertical-cell/v1",
        "space_visibility": "public" if killinchu else "protected",
        "stage": "source-only",
        "success_metrics": ["decision receipts recorded"],
        "vertical_id": vertical_id,
    }


def request(
    action: str = "recommend a reconciled service option",
    *,
    evidence_class: str = "OBSERVED",
    freshness: str = "CURRENT",
    workflow: str = "reconcile evidence",
) -> dict[str, Any]:
    return {
        "action": action,
        "evidence": [
            {
                "digest": "sha256:" + "a" * 64,
                "evidence_class": evidence_class,
                "freshness": freshness,
                "id": "evidence-1",
                "limitations": [],
            }
        ],
        "principal": {"authority_claims": [], "id": "operator-1"},
        "request_id": "request-1",
        "workflow": workflow,
    }
