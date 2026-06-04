# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
sumaq_agent.py — Sumaq as an autonomous OrganAgent.

Cadence: 12s (Nyquist-chosen, PURIQ_OS_DOCTRINE.md §2 — integer convenience, not
mysticism). Minimum viable autonomous loop: quality organ scores output quality and requests refinement.
"""
from __future__ import annotations

import random
from typing import Any, Dict, List

from ..loop import OrganAgent, Action
from ..yuyay_gate import YuyayScores


class SumaqAgent(OrganAgent):
    organ = "Sumaq"
    cadence_seconds = 12

    def observe(self, world: Any) -> Dict[str, Any]:
        q = (world or {}).get("quality", round(random.uniform(0.7, 1.0), 3))
        return {"quality": q, "aesthetics": q}

    def candidate_actions(self, x: Dict[str, Any]) -> List[Action]:
        acts = [Action(name="accept")]
        if x["quality"] < 0.9:
            acts.append(Action(name="request_refine", state_changing=True))
        return acts

    def execute(self, action: Action, x: Dict[str, Any]) -> Any:
        return {"action": action.name, "quality": x["quality"]}
