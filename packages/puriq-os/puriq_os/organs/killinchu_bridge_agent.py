# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
killinchu_bridge_agent.py — Killinchu-bridge as an autonomous OrganAgent.

Cadence: 7s (Nyquist-chosen, PURIQ_OS_DOCTRINE.md §2 — integer convenience, not
mysticism). Minimum viable autonomous loop: external bridge gates inbound/outbound messages.
"""
from __future__ import annotations

import random
from typing import Any, Dict, List

from ..loop import OrganAgent, Action
from ..yuyay_gate import YuyayScores


class KillinchuBridgeAgent(OrganAgent):
    organ = "Killinchu-bridge"
    cadence_seconds = 7

    def observe(self, world: Any) -> Dict[str, Any]:
        inbox = (world or {}).get("inbox", random.randint(0, 2))
        return {"inbox": inbox, "bridge_health": 1.0}

    def candidate_actions(self, x: Dict[str, Any]) -> List[Action]:
        acts = [Action(name="idle")]
        if x["inbox"] > 0:
            # outbound to an external party is irreversible => needs 2-person gate
            acts.append(Action(name="relay_message", state_changing=True,
                               irreversible=True, two_person_gated=True))
        return acts

    def execute(self, action: Action, x: Dict[str, Any]) -> Any:
        return {"relayed": action.name == "relay_message", "remaining": x["inbox"]}
