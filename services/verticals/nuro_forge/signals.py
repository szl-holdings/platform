"""NuroForge signals stub."""

from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_nuro_eval_regression",
            "source": "eval-harness",
            "kind": "eval_regression",
            "summary": "Agent-v2.4 shows 3.2% MirrorEval regression on legal reasoning benchmark",
            "weight": 0.75,
        },
        {
            "id": "sig_nuro_training_complete",
            "source": "forge-runner",
            "kind": "training_complete",
            "summary": "Fine-tune run #847 completed — maritime domain adapter ready for review",
            "weight": 0.60,
        },
    ]
