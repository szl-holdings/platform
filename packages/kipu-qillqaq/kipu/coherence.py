"""kipu/coherence.py — coherence validator + HUKLLA tripwire T23.

Detects contradicting cells: two receipts for the SAME subject at the SAME timestamp
(within tolerance) whose payloads conflict beyond tolerance — e.g. two Yuyay receipts at the
same timestamp with conflicting scores. On a hard conflict the validator fires HUKLLA **T23**
(`kipu_coherence_violation`, HARD-HALT, Doctrine v15 §3): the write is rejected and the
conflicting pair is rolled back.

This is the *propose -> validate -> commit* locked-blackboard discipline
(AutoGen shared-state discussion #7144).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from .cell import ReceiptCell

T23 = "T23_kipu_coherence_violation"  # HUKLLA hard-halt tripwire id (Doctrine v15)


class CoherenceViolation(Exception):
    """Raised when a proposed write would break substrate coherence (fires T23)."""

    def __init__(self, message: str, existing: ReceiptCell, proposed: ReceiptCell):
        super().__init__(message)
        self.tripwire = T23
        self.existing = existing
        self.proposed = proposed


@dataclass
class CoherenceValidator:
    ts_tolerance: float = 1e-3        # seconds: "same timestamp" window
    score_tolerance: float = 0.05     # max allowed |delta| in yuyay_score for same subject+ts
    score_keys: tuple = ("yuyay_score",)

    def _conflict(self, a: ReceiptCell, b: ReceiptCell) -> Optional[str]:
        """Return a reason string if a and b contradict, else None."""
        if a.cid and a.cid == b.cid:
            return None  # identical cell, not a conflict (dedup)
        if a.subject != b.subject or not a.subject:
            return None
        if abs(a.ts - b.ts) > self.ts_tolerance:
            return None
        # yuyay_score conflict
        if a.yuyay_score is not None and b.yuyay_score is not None:
            if abs(a.yuyay_score - b.yuyay_score) > self.score_tolerance:
                return (f"conflicting yuyay_score for subject={a.subject!r} at ts~{a.ts}: "
                        f"{a.yuyay_score} vs {b.yuyay_score}")
        # explicit gate/decision disagreement in payload
        for k in ("gate", "decision", "verdict"):
            av, bv = a.payload.get(k), b.payload.get(k)
            if av is not None and bv is not None and av != bv:
                return f"conflicting {k} for subject={a.subject!r} at ts~{a.ts}: {av} vs {bv}"
        return None

    def validate(self, proposed: ReceiptCell, existing_cells) -> None:
        """Validate a proposed write against existing cells. Raise CoherenceViolation on conflict."""
        for c in existing_cells:
            reason = self._conflict(proposed, c)
            if reason:
                raise CoherenceViolation(f"[{T23}] {reason}", existing=c, proposed=proposed)

    def coherence_factor(self, proposed: ReceiptCell, existing_cells) -> float:
        """KIPU_coherence(a) in [0,1]: 0 iff a hard conflict exists (Doctrine v15 master formula)."""
        try:
            self.validate(proposed, existing_cells)
            return 1.0
        except CoherenceViolation:
            return 0.0
