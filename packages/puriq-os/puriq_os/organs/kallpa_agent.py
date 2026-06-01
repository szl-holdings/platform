# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
kallpa_agent.py — Kallpa as an autonomous OrganAgent.

Cadence: 49s (Nyquist-chosen, PURIQ_OS_DOCTRINE.md §2 — integer convenience, not
mysticism). Minimum viable autonomous loop: energy/resource manager rebalances the compute budget.
"""
from __future__ import annotations

import random
from typing import Any, Dict, List

from ..loop import OrganAgent, Action
from ..yuyay_gate import YuyayScores


class KallpaAgent(OrganAgent):
    organ = "Kallpa"
    cadence_seconds = 49

    def observe(self, world: Any) -> Dict[str, Any]:
        util = (world or {}).get("cpu_util", round(random.uniform(0.2, 0.8), 3))
        return {"cpu_util": util, "headroom": max(0.0, 1.0 - util)}

    def candidate_actions(self, x: Dict[str, Any]) -> List[Action]:
        acts = [Action(name="idle")]
        if x["cpu_util"] > 0.7:
            acts.append(Action(name="shed_load", state_changing=True))
        else:
            acts.append(Action(name="grant_budget", state_changing=True))
        return acts

    def execute(self, action: Action, x: Dict[str, Any]) -> Any:
        return {"action": action.name, "cpu_util": x["cpu_util"]}
