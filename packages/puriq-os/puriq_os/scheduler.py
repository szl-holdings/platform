# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
scheduler.py — APScheduler-driven per-organ cadence.

Each OrganAgent gets one scheduler job firing every `cadence_seconds` (chosen via the
Shannon-Nyquist rule, PURIQ_OS_DOCTRINE.md §2). The scheduler holds each organ's slot;
a HALTED organ is skipped (halt-safe). No mystical timing — plain APScheduler intervals.

Open-source dep: APScheduler. The scheduler degrades gracefully to a SyntheticClock for
tests / environments without an event loop (the synthetic clock drives N ticks
deterministically while preserving per-organ cadence ordering).
"""
from __future__ import annotations

import heapq
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .loop import OrganAgent, LoopStatus, TickResult


class PuriqScheduler:
    """Registers each OrganAgent on its own cadence. Uses APScheduler when available."""

    def __init__(self):
        self.agents: Dict[str, OrganAgent] = {}
        self._aps = None

    def register(self, agent: OrganAgent) -> None:
        self.agents[agent.organ] = agent

    # ---- real (APScheduler) path -----------------------------------------
    def start(self, world: Any = None) -> None:
        """Start a BackgroundScheduler with one interval job per organ."""
        from apscheduler.schedulers.background import BackgroundScheduler
        self._aps = BackgroundScheduler()
        for agent in self.agents.values():
            self._aps.add_job(
                func=self._fire, trigger="interval",
                seconds=agent.cadence_seconds, id=agent.organ,
                args=[agent.organ, world], max_instances=1, coalesce=True,
            )
        self._aps.start()

    def _fire(self, organ: str, world: Any) -> Optional[TickResult]:
        agent = self.agents[organ]
        if agent.status == LoopStatus.HALTED:
            return None  # halt-safe: scheduler skips halted organs
        return agent.tick(world)

    def shutdown(self) -> None:
        if self._aps is not None:
            self._aps.shutdown(wait=False)
            self._aps = None

    # ---- synthetic clock (deterministic, no event loop) ------------------
    def run_synthetic(self, horizon_seconds: float, world: Any = None) -> List[TickResult]:
        """Drive all organs deterministically over a virtual time horizon, each ticking
        on its own cadence. Returns the ordered list of TickResults. Proves every organ
        ticks at its cadence without needing a real wall-clock or event loop."""
        # min-heap of (virtual_time, organ_name)
        pq: List[tuple] = []
        for agent in self.agents.values():
            heapq.heappush(pq, (float(agent.cadence_seconds), agent.organ))
        results: List[TickResult] = []
        while pq and pq[0][0] <= horizon_seconds:
            vt, organ = heapq.heappop(pq)
            agent = self.agents[organ]
            if agent.status != LoopStatus.HALTED:
                results.append(agent.tick(world, now=vt))
            heapq.heappush(pq, (vt + agent.cadence_seconds, organ))
        return results

    def status_table(self) -> List[Dict[str, Any]]:
        """Snapshot of every organ for the read-only /agentic tab."""
        return [a.status_dict() for a in self.agents.values()]
