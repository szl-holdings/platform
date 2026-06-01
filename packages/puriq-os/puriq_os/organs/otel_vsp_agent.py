# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
otel_vsp_agent.py — OTel-VSP as an autonomous OrganAgent.

Cadence: 7s (Nyquist-chosen, PURIQ_OS_DOCTRINE.md §2 — integer convenience, not
mysticism). Minimum viable autonomous loop: observability samples telemetry and flags anomalies.
"""
from __future__ import annotations

import random
from typing import Any, Dict, List

from ..loop import OrganAgent, Action
from ..yuyay_gate import YuyayScores


class OtelVspAgent(OrganAgent):
    organ = "OTel-VSP"
    cadence_seconds = 7

    def observe(self, world: Any) -> Dict[str, Any]:
        z = (world or {}).get("anomaly_z", round(random.uniform(0.0, 2.0), 3))
        return {"anomaly_z": z, "signal_clarity": max(0.0, 1.0 - z / 5.0)}

    def candidate_actions(self, x: Dict[str, Any]) -> List[Action]:
        acts = [Action(name="sample_telemetry")]
        if x["anomaly_z"] > 1.5:
            acts.append(Action(name="flag_anomaly", state_changing=True))
        return acts

    def execute(self, action: Action, x: Dict[str, Any]) -> Any:
        return {"action": action.name, "anomaly_z": x["anomaly_z"]}
