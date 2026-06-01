# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
hukulla_tripwires.py — HUKLLA, the immune system and SOLE HALT-AUTHORITY.

LOCKED (v11): HUKLLA = 10 tripwires T01-T10, sole halt-authority. PURIQ-OS uses these
VERBATIM and invents NO new tripwires (no T11-T20 in this honest runtime). Any tripped
tripwire forces the action's utility to 0 and latches the OrganAgent to HALTED — the
runtime expression of Doctrine v12 INV-1 (halting safety). Agents are halt-safe by
construction.

No mysticism: every tripwire is a pure boolean predicate over observable state.
"""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional, Tuple

# Canonical tripwire registry — T01-T10 LOCKED (v11), sole halt-authority.
TRIPWIRE_NAMES: Dict[str, str] = {
    "T01": "moral_grounding_breach",     # sacred axis below floor
    "T02": "measurability_dishonesty",   # claimed metric not measurable
    "T03": "self_deception",             # introspection axis (heart-linked)
    "T04": "goal_drift",                 # introspection axis (heart-linked)
    "T05": "unbounded_resource",         # resource use exceeds bound (A4)
    "T06": "external_harm",              # action harms outside party
    "T07": "irreversibility_unsigned",   # irreversible act without 2-person gate
    "T08": "provenance_gap",             # missing Khipu / broken chain
    "T09": "deceptive_alignment",        # introspection axis (heart-linked)
    "T10": "capability_overhang",        # introspection axis (heart-linked) / STOP
}
LOCKED_TRIPWIRES = [f"T{n:02d}" for n in range(1, 11)]   # T01-T10


@dataclass
class TripwireResult:
    """Aggregate result of evaluating all tripwires for one candidate action/tick."""
    clear: bool
    tripped: List[str] = field(default_factory=list)
    reasons: Dict[str, str] = field(default_factory=dict)

    def halt_required(self) -> bool:
        return not self.clear

    def hukulla_count(self) -> int:
        """HUKLLA(a) = number of fired tripwires among T01-T10."""
        return len(self.tripped)

    def hukulla_factor(self, beta: float = 1.0) -> float:
        """e^(-beta*HUKLLA(a)); collapses toward 0 as tripwires fire (soft halt)."""
        import math
        return math.exp(-beta * self.hukulla_count())


# A predicate takes the candidate context dict and returns (tripped: bool, reason: str).
Predicate = Callable[[Dict[str, Any]], Tuple[bool, str]]


def _default_predicates() -> Dict[str, Predicate]:
    """Conservative, observable predicates. Context keys are optional; absent => not
    tripped, EXCEPT provenance/chain which fail-safe (absent integrity evidence => trip
    only when explicitly marked False)."""
    def t01(c):
        v = c.get("moral_grounding", 1.0)
        return (v < 0.95, f"moral_grounding={v}<0.95")

    def t02(c):
        return (c.get("measurable", True) is False, "claimed metric not measurable")

    def t03(c):
        return (c.get("t03_clear", True) is False, "self-deception introspection failed")

    def t04(c):
        return (c.get("t04_clear", True) is False, "goal-drift introspection failed")

    def t05(c):
        used, bound = c.get("resource_used", 0.0), c.get("resource_bound", float("inf"))
        return (used > bound, f"resource {used}>{bound} (A4 unbounded)")

    def t06(c):
        return (c.get("external_harm", False) is True, "external harm flagged")

    def t07(c):
        irr = c.get("irreversible", False)
        gated = c.get("two_person_gated", False)
        return (irr and not gated, "irreversible action without 2-person gate")

    def t08(c):
        return (c.get("provenance_ok", True) is False, "missing Khipu / broken chain")

    def t09(c):
        return (c.get("t09_clear", True) is False, "deceptive-alignment introspection failed")

    def t10(c):
        # T10 is the STOP/undo/revert absorbing halt.
        stop = c.get("stop_directive", False) is True
        overhang = c.get("t10_clear", True) is False
        return (stop or overhang, "STOP directive / capability-overhang (absorbing halt)")

    return {
        "T01": t01, "T02": t02, "T03": t03, "T04": t04, "T05": t05,
        "T06": t06, "T07": t07, "T08": t08, "T09": t09, "T10": t10,
    }


@dataclass
class HukullaTripwires:
    """The sole halt-authority. Evaluates T01-T10 over a candidate context."""
    predicates: Dict[str, Predicate] = field(default_factory=_default_predicates)
    halted: bool = False
    last_trip: Optional[TripwireResult] = None
    halt_ts: Optional[float] = None

    def evaluate(self, context: Dict[str, Any]) -> TripwireResult:
        tripped: List[str] = []
        reasons: Dict[str, str] = {}
        for name, pred in self.predicates.items():
            try:
                fired, why = pred(context)
            except Exception as e:  # a misbehaving predicate fails SAFE (trips)
                fired, why = True, f"predicate {name} raised {e!r}"
            if fired:
                tripped.append(name)
                reasons[name] = why
        result = TripwireResult(clear=not tripped, tripped=tripped, reasons=reasons)
        self.last_trip = result
        return result

    def halt(self, result: TripwireResult) -> None:
        """Latch the halt. Only HUKLLA may set this."""
        self.halted = True
        self.halt_ts = time.time()

    def reset(self) -> None:
        """Admin-only resume (2-person gated upstream in the loop)."""
        self.halted = False
        self.halt_ts = None
        self.last_trip = None

    @property
    def active_count(self) -> int:
        return len(self.predicates)
