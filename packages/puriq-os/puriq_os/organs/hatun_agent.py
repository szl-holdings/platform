# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
hatun_agent.py — Hatun as an autonomous OrganAgent.

Cadence: 49s (Nyquist-chosen, PURIQ_OS_DOCTRINE.md §2 — integer convenience, not
mysticism). Minimum viable autonomous loop: governance evaluates bounded doctrine/config proposals.
"""
from __future__ import annotations

import random
from typing import Any, Dict, List

from ..loop import OrganAgent, Action
from ..yuyay_gate import YuyayScores


class HatunAgent(OrganAgent):
    organ = "Hatun"
    cadence_seconds = 49

    def observe(self, world: Any) -> Dict[str, Any]:
        prop = (world or {}).get("config_proposals", random.randint(0, 1))
        return {"proposals": prop, "governance_health": 1.0}

    def candidate_actions(self, x: Dict[str, Any]) -> List[Action]:
        acts = [Action(name="idle")]
        if x["proposals"] > 0:
            # bounded proposal => keep within HUKLLA bound (no tripwire)
            acts.append(Action(name="evaluate_proposal", state_changing=True))
        return acts

    def execute(self, action: Action, x: Dict[str, Any]) -> Any:
        return {"evaluated": action.name == "evaluate_proposal", "bounded": True}
