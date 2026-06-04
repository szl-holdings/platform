# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
lambda_agent.py — Lambda as an autonomous OrganAgent.

Cadence: 49s (Nyquist-chosen, PURIQ_OS_DOCTRINE.md §2 — integer convenience, not
mysticism). Minimum viable autonomous loop: spine aggregator recomputes Lambda(x) trust scale and watches drift.
"""
from __future__ import annotations

import random
from typing import Any, Dict, List

from ..loop import OrganAgent, Action
from ..yuyay_gate import YuyayScores


class LambdaAgent(OrganAgent):
    organ = "Lambda"
    cadence_seconds = 49

    def observe(self, world: Any) -> Dict[str, Any]:
        from ..lambda_aggregator import lambda_aggregate
        axes = (world or {}).get("axes", [round(random.uniform(0.85, 1.0), 3)
                                           for _ in range(4)])
        lam = lambda_aggregate(axes)
        prev = getattr(self, "_prev_lambda", lam)
        drift = abs(lam - prev)
        self._prev_lambda = lam
        return {"lambda": lam, "drift": min(drift, 1.0), "stability": 1.0 - min(drift, 1.0)}

    def candidate_actions(self, x: Dict[str, Any]) -> List[Action]:
        acts = [Action(name="reaggregate", state_changing=True)]
        return acts

    def execute(self, action: Action, x: Dict[str, Any]) -> Any:
        return {"lambda": x["lambda"], "drift": x["drift"]}
