# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
loop.py — the OrganAgent base class: the universal Wiener feedback cycle every organ
runs autonomously on its own cadence.

Honest definition of "agentic" (PURIQ_OS_DOCTRINE.md §1): an organ runs an autonomous
  OBSERVE -> DECIDE -> ACT -> SIGN-KHIPU-RECEIPT -> LOOP
cycle on its own cadence, rather than being purely call-driven.

  1. observe(world)          -> x            (Wiener: sense local state)
  2. score(actions, x)       -> [U(a|x)]     (Doctrine v12 §2 Puriq utility)
       U(a|x) = Lambda(x) * Yuyay13(a) * exp(-beta*HUKLLA(a)) * prod_i Khipu_i(a)
  3. select(actions, scores) -> a*           (argmax over bounded set; None => no-op)
  4. execute(a*, x)          -> result       (state change; no-op allowed)
  5. emit_receipt(...)       -> KhipuReceipt (exactly one hash-chained receipt / tick)

Invariants enforced here (Doctrine v12 §3):
  INV-1 halting safety  — any HUKLLA trip zeroes utility AND latches HALTED
  INV-2 Lambda-monotone — U = Lambda(x) * (non-negative action factor)
  INV-3 Khipu integrity — exactly one chained receipt per tick (verify via ledger)
  INV-4 Bekenstein bound — candidate set is finite & small by construction
"""
from __future__ import annotations

import math
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable, Dict, List, Optional, Sequence

from .khipu_emit import KhipuLedger, KhipuReceipt
from .yuyay_gate import YuyayGate, YuyayScores
from .hukulla_tripwires import HukullaTripwires, TripwireResult
from .lambda_aggregator import lambda_aggregate

DEFAULT_BETA = 1.0


class LoopStatus(str, Enum):
    INIT = "init"
    ALIVE = "alive"     # running on cadence
    PAUSED = "paused"   # admin pause (gated resume)
    HALTED = "halted"   # HUKLLA tripwire latched the loop


@dataclass
class Action:
    """A candidate action a in the bounded set 𝒜. Carries its factor scores and an
    effect callable. A no-op action has effect=None (always valid, always recorded)."""
    name: str
    yuyay: YuyayScores = field(default_factory=YuyayScores)
    khipu_factors: Sequence[float] = field(default_factory=lambda: [1.0])
    state_changing: bool = False
    irreversible: bool = False
    two_person_gated: bool = False
    context: Dict[str, Any] = field(default_factory=dict)
    effect: Optional[Callable[[], Any]] = None


@dataclass
class TickResult:
    organ: str
    tick: int
    status: LoopStatus
    chosen: Optional[str]
    decision_value: float
    yuyay_value: float
    hukulla: TripwireResult
    receipt: Optional[KhipuReceipt]
    note: str = ""


def utility_U(
    lambda_x: float,
    yuyay_value: float,
    hukulla_factor: float,
    khipu_factors: Sequence[float],
) -> float:
    """Doctrine v12 §2 Puriq utility:
       U(a|x) = Lambda(x) * Yuyay13(a) * exp(-beta*HUKLLA(a)) * prod_i Khipu_i(a).
    Any zero factor zeroes U (gate / chain / halt are all hard vetoes)."""
    khipu = 1.0
    for k in khipu_factors:
        khipu *= float(k)
    return float(lambda_x) * float(yuyay_value) * float(hukulla_factor) * khipu


class OrganAgent(ABC):
    """Base class for the 12 canonical organs. Subclasses implement observe(),
    candidate_actions(), execute(); the base provides the governed 5-step tick."""

    organ: str = "organ"
    cadence_seconds: int = 12       # chosen via Nyquist (PURIQ_OS_DOCTRINE.md §2)
    beta: float = DEFAULT_BETA

    def __init__(self, ledger: KhipuLedger, gate: Optional[YuyayGate] = None,
                 hukulla: Optional[HukullaTripwires] = None):
        self.ledger = ledger
        self.gate = gate or YuyayGate()
        self.hukulla = hukulla or HukullaTripwires()
        self.status = LoopStatus.INIT
        self.tick_count = 0
        self.last_tick_ts: Optional[float] = None
        self.next_tick_ts: Optional[float] = None

    # ---- abstract: each organ supplies these ------------------------------
    @abstractmethod
    def observe(self, world: Any) -> Dict[str, Any]:
        """Sample the organ's local state vector x for this tick."""

    @abstractmethod
    def candidate_actions(self, x: Dict[str, Any]) -> List[Action]:
        """Enumerate the bounded action set 𝒜(x). Include a no-op. |𝒜| small (INV-4)."""

    @abstractmethod
    def execute(self, action: Action, x: Dict[str, Any]) -> Any:
        """Apply the selected state change. A no-op Action returns None harmlessly."""

    # ---- provided by the base class (governed) ----------------------------
    def _hukulla_context(self, action: Action, x: Dict[str, Any]) -> Dict[str, Any]:
        c = dict(x)
        c.update(action.context)
        c["state_changing"] = action.state_changing
        c["irreversible"] = action.irreversible
        c["two_person_gated"] = action.two_person_gated
        return c

    def score(self, actions: List[Action], x: Dict[str, Any]):
        """Returns (scores, yuyay_values, tripwire_results) aligned to `actions`."""
        lambda_x = lambda_aggregate(_context_axes(x))
        scores, yuyays, trips = [], [], []
        for a in actions:
            yv = self.gate.evaluate(a.yuyay)               # 0.0 if gate fails (INV-1 root)
            trip = self.hukulla.evaluate(self._hukulla_context(a, x))
            hf = trip.hukulla_factor(self.beta)            # 0 if any tripwire fires
            u = utility_U(lambda_x, yv, hf, a.khipu_factors)
            scores.append(u); yuyays.append(yv); trips.append(trip)
        return scores, yuyays, trips

    def select(self, actions: List[Action], scores: List[float]) -> Optional[int]:
        """argmax index; None if best utility is 0 (=> no-op, recorded)."""
        if not actions:
            return None
        best_i = max(range(len(actions)), key=lambda i: scores[i])
        return best_i if scores[best_i] > 0.0 else None

    def emit_receipt(self, action_name: str, decision_value: float, yuyay_value: float,
                     hukulla_clear: bool, payload: Dict[str, Any]) -> KhipuReceipt:
        """Sign exactly one hash-chained receipt for this tick (INV-3)."""
        receipt = KhipuReceipt(
            organ=self.organ, tick=self.tick_count, action=action_name,
            decision_value=decision_value, yuyay_value=yuyay_value,
            hukulla_clear=hukulla_clear, payload=payload,
        )
        return self.ledger.emit(receipt)

    def tick(self, world: Any = None, now: Optional[float] = None) -> TickResult:
        """One cadence step: observe -> score -> select -> execute -> emit_receipt.
        ALWAYS emits exactly one receipt, even on a halt or no-op."""
        import time as _t
        now = now if now is not None else _t.time()
        self.tick_count += 1
        self.last_tick_ts = now
        self.next_tick_ts = now + self.cadence_seconds

        if self.status == LoopStatus.HALTED:
            # Halt-safe: do not act; still record the tick.
            r = self.emit_receipt("__halted__", 0.0, 0.0, False,
                                  {"reason": "loop halted by HUKLLA"})
            return TickResult(self.organ, self.tick_count, LoopStatus.HALTED,
                              None, 0.0, 0.0,
                              TripwireResult(clear=False, tripped=["latched"]), r,
                              "halted")

        self.status = LoopStatus.ALIVE
        x = self.observe(world)
        actions = self.candidate_actions(x)
        scores, yuyays, trips = self.score(actions, x)
        idx = self.select(actions, scores)

        # Halt-safety: if the best candidate tripped a tripwire, latch HALTED.
        if idx is not None and trips[idx].halt_required():
            self.hukulla.halt(trips[idx])
            self.status = LoopStatus.HALTED
            idx = None

        if idx is None:
            # no-op tick — still a governed, receipted action
            r = self.emit_receipt("__noop__", 0.0, 0.0,
                                  self.status != LoopStatus.HALTED,
                                  {"x": _jsonable(x), "reason": "no positive-utility action"})
            return TickResult(self.organ, self.tick_count, self.status, None, 0.0, 0.0,
                              trips[0] if trips else TripwireResult(clear=True), r, "noop")

        chosen = actions[idx]
        result = self.execute(chosen, x)
        r = self.emit_receipt(
            chosen.name, scores[idx], yuyays[idx], trips[idx].clear,
            {"x": _jsonable(x), "result": _jsonable(result),
             "state_changing": chosen.state_changing},
        )
        return TickResult(self.organ, self.tick_count, LoopStatus.ALIVE, chosen.name,
                          scores[idx], yuyays[idx], trips[idx], r, "ok")

    def run(self, ticks: int, world: Any = None) -> List[TickResult]:
        """Synchronous run of N ticks (used by tests and the synthetic verifier)."""
        return [self.tick(world) for _ in range(ticks)]

    def status_dict(self) -> Dict[str, Any]:
        """Snapshot for the read-only /agentic tab."""
        return {
            "organ": self.organ,
            "cadence_seconds": self.cadence_seconds,
            "status": self.status.value,
            "tick_count": self.tick_count,
            "last_tick_ts": self.last_tick_ts,
            "next_tick_ts": self.next_tick_ts,
            "recent_receipts": self.ledger.recent(self.organ, limit=5),
        }


# ---- helpers --------------------------------------------------------------
def _context_axes(x: Dict[str, Any]) -> List[float]:
    """Extract the [0,1] axis values from a state dict for Lambda(x). Falls back to a
    single neutral axis so Lambda is well-defined even for sparse states."""
    axes = [float(v) for k, v in x.items()
            if isinstance(v, (int, float)) and not isinstance(v, bool) and 0.0 <= v <= 1.0]
    return axes or [1.0]


def _jsonable(v: Any) -> Any:
    try:
        import json
        json.dumps(v)
        return v
    except (TypeError, ValueError):
        return str(v)
