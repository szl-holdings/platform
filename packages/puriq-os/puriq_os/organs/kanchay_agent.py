# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
kanchay_agent.py — Kanchay as an autonomous OrganAgent.

Cadence: 12s (Nyquist-chosen, PURIQ_OS_DOCTRINE.md §2 — integer convenience, not
mysticism). Minimum viable autonomous loop: light/UI surface refreshes the status projection for the /agentic tab.
"""
from __future__ import annotations

import random
from typing import Any, Dict, List

from ..loop import OrganAgent, Action
from ..yuyay_gate import YuyayScores


class KanchayAgent(OrganAgent):
    organ = "Kanchay"
    cadence_seconds = 12

    def observe(self, world: Any) -> Dict[str, Any]:
        stale = (world or {}).get("ui_stale", random.choice([True, False]))
        return {"ui_stale": stale, "freshness": 0.5 if stale else 1.0}

    def candidate_actions(self, x: Dict[str, Any]) -> List[Action]:
        acts = [Action(name="idle")]
        if x["ui_stale"]:
            acts.append(Action(name="refresh_projection", state_changing=True))
        return acts

    def execute(self, action: Action, x: Dict[str, Any]) -> Any:
        return {"refreshed": action.name == "refresh_projection"}
