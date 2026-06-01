# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
organs/ — the 12 canonical organs as autonomous OrganAgent subclasses.

Each module defines one organ: its cadence (Nyquist-chosen integer seconds), its
observe(), its candidate_actions(), and its execute(). build_all() wires them onto a
shared KhipuLedger so the receipt chain is global (forks detectable, INV-3).
"""
from __future__ import annotations

from typing import Dict, List

from ..khipu_emit import KhipuLedger
from ..loop import OrganAgent
from .amaru_agent import AmaruAgent
from .yuyay_agent import YuyayAgent
from .yawar_agent import YawarAgent
from .hukulla_agent import HukullaAgent
from .kallpa_agent import KallpaAgent
from .khipu_agent import KhipuAgent
from .lambda_agent import LambdaAgent
from .otel_vsp_agent import OtelVspAgent
from .kanchay_agent import KanchayAgent
from .hatun_agent import HatunAgent
from .sumaq_agent import SumaqAgent
from .killinchu_bridge_agent import KillinchuBridgeAgent

ORGAN_CLASSES = [
    AmaruAgent, YuyayAgent, YawarAgent, HukullaAgent, KallpaAgent, KhipuAgent,
    LambdaAgent, OtelVspAgent, KanchayAgent, HatunAgent, SumaqAgent,
    KillinchuBridgeAgent,
]
CANONICAL_ORGANS = [c.organ for c in ORGAN_CLASSES]  # 12 names


def build_all(ledger: KhipuLedger | None = None) -> Dict[str, OrganAgent]:
    """Instantiate all 12 organs on a shared ledger. Returns {organ_name: agent}."""
    ledger = ledger or KhipuLedger()
    return {cls.organ: cls(ledger) for cls in ORGAN_CLASSES}
