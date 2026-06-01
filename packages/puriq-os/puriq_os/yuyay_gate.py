# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173
"""
yuyay_gate.py — the 13-axis heart (yuyay_v3), conjunctive AND.

LOCKED (v11): 2 sacred (≥0.95) + 7 structural (≥0.90) + 4 introspection (cross-linked
to HUKLLA T03/T04/T09/T10). Replay-hash bacf5443…631fc5. No compensation: any sub-floor
axis ⇒ Yuyay₁₃ = 0 ⇒ U = 0 (algebraic root of INV-1).

The gate throws YuyayGateError if any sacred axis < 0.95 or any structural axis < 0.90 —
exactly the Phase-3 requirement ("throws if any sacred axis < 0.95 or structural < 0.90").
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List

SACRED_FLOOR = 0.95
STRUCTURAL_FLOOR = 0.90

# Canonical 13-axis layout (yuyay_v3)
SACRED_AXES = ["moral_grounding", "measurability_honesty"]                       # ≥ 0.95
STRUCTURAL_AXES = [                                                              # ≥ 0.90
    "epistemic_humility", "perspectival_flexibility", "context_sensitivity",
    "dialectical_integration", "uncertainty_calibration", "outcome_reasoning",
    "metacognition",
]
INTROSPECTION_AXES = ["t03_clear", "t04_clear", "t09_clear", "t10_clear"]        # bool gates


class YuyayGateError(Exception):
    """Raised when the 13-axis conjunctive gate fails (used by state-changing ticks)."""


@dataclass
class YuyayScores:
    """A 13-axis score vector. Introspection axes are booleans (T03/T04/T09/T10 cleared)."""
    moral_grounding: float = 1.0
    measurability_honesty: float = 1.0
    epistemic_humility: float = 1.0
    perspectival_flexibility: float = 1.0
    context_sensitivity: float = 1.0
    dialectical_integration: float = 1.0
    uncertainty_calibration: float = 1.0
    outcome_reasoning: float = 1.0
    metacognition: float = 1.0
    t03_clear: bool = True
    t04_clear: bool = True
    t09_clear: bool = True
    t10_clear: bool = True

    def as_dict(self) -> Dict[str, float]:
        return {
            **{a: getattr(self, a) for a in SACRED_AXES + STRUCTURAL_AXES},
            **{a: getattr(self, a) for a in INTROSPECTION_AXES},
        }

    def continuous_axes(self) -> List[float]:
        return [getattr(self, a) for a in SACRED_AXES + STRUCTURAL_AXES]


@dataclass
class YuyayGate:
    """13-axis conjunctive AND gate. `evaluate` returns Yuyay₁₃ ∈ {0.0, [floor,1]}."""
    sacred_floor: float = SACRED_FLOOR
    structural_floor: float = STRUCTURAL_FLOOR
    failures: List[str] = field(default_factory=list)

    def evaluate(self, scores: YuyayScores) -> float:
        """Return Yuyay₁₃(a): 0.0 if any axis sub-floor or any introspection axis not cleared;
        else the min passing score (conservative scalar). Populates self.failures."""
        self.failures = []
        for a in SACRED_AXES:
            if getattr(scores, a) < self.sacred_floor:
                self.failures.append(f"{a}={getattr(scores,a):.3f}<{self.sacred_floor} (SACRED)")
        for a in STRUCTURAL_AXES:
            if getattr(scores, a) < self.structural_floor:
                self.failures.append(f"{a}={getattr(scores,a):.3f}<{self.structural_floor} (STRUCT)")
        for a in INTROSPECTION_AXES:
            if not getattr(scores, a):
                self.failures.append(f"{a}=not-cleared (INTROSPECTION)")
        if self.failures:
            return 0.0
        return min(scores.continuous_axes())

    def gate(self, scores: YuyayScores) -> float:
        """Strict gate for state-changing actions: throws YuyayGateError on any sub-floor axis."""
        val = self.evaluate(scores)
        if val == 0.0:
            raise YuyayGateError("Yuyay-13 gate FIRED: " + "; ".join(self.failures))
        return val

    def two_person_gate(self, scores_a: YuyayScores, scores_b: YuyayScores) -> float:
        """2-person Yuyay-gate (Doctrine v12 §2): TWO independent evaluations must both clear.
        Used for any state-changing autonomous action. Returns the min of the two passing scalars."""
        va = self.gate(scores_a)
        # re-evaluate failures cleanly for the second reviewer
        g2 = YuyayGate(self.sacred_floor, self.structural_floor)
        vb = g2.gate(scores_b)
        return min(va, vb)
