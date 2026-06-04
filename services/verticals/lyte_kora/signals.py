from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_lyte_decision_age",
            "source": "linear",
            "kind": "decision_age",
            "summary": "Decision DEC-204 open for 19 days, owner reassigned twice",
            "weight": 0.85,
        },
        {
            "id": "sig_lyte_evidence_gap",
            "source": "notion",
            "kind": "evidence_gap",
            "summary": "Approval doc missing benchmarks for 3 of 5 alternatives",
            "weight": 0.7,
        },
        {
            "id": "sig_lyte_approval_chain",
            "source": "manual",
            "kind": "approval_bottleneck",
            "summary": "5-person approval chain; 2 approvers OOO this week",
            "weight": 0.6,
        },
    ]
