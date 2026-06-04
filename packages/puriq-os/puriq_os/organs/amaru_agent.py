# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
amaru_agent.py — Amaru as an autonomous OrganAgent.

Cadence: 7s (Nyquist-chosen, PURIQ_OS_DOCTRINE.md §2 — integer convenience, not
mysticism). Minimum viable autonomous loop: prime orchestrator routes the next unit of work by Puriq utility.
"""
from __future__ import annotations

import random
from typing import Any, Dict, List

from ..loop import OrganAgent, Action
from ..yuyay_gate import YuyayScores


class AmaruAgent(OrganAgent):
    organ = "Amaru"
    cadence_seconds = 7

    def observe(self, world: Any) -> Dict[str, Any]:
        # queue depth normalized to [0,1]; higher => more pressure to dispatch
        q = (world or {}).get("queue_depth", random.randint(0, 5))
        return {"queue_depth_raw": q, "pressure": min(q / 5.0, 1.0), "readiness": 1.0}

    def candidate_actions(self, x: Dict[str, Any]) -> List[Action]:
        acts = [Action(name="idle")]
        if x["queue_depth_raw"] > 0:
            acts.append(Action(name="dispatch_task", state_changing=True,
                               yuyay=YuyayScores()))
        return acts

    def execute(self, action: Action, x: Dict[str, Any]) -> Any:
        if action.name == "dispatch_task":
            return {"dispatched": True, "remaining": x["queue_depth_raw"] - 1}
        return None
