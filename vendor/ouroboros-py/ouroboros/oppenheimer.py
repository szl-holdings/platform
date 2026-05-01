"""Oppenheimer primitives — Python port (Primitives 25–28).

Faithful Python reimplementation of packages/oppenheimer/src/*.ts.

Sources
-------
J. Robert Oppenheimer Papers, Library of Congress, MSS35188.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Literal


# ---------------------------------------------------------------------------
# Primitive 25 — Security-clearance trust ledger
# ---------------------------------------------------------------------------

ClearanceLevel = Literal[
    "NONE", "PUBLIC", "CONFIDENTIAL", "SECRET", "TOP_SECRET", "RESTRICTED_DATA"
]

CLEARANCE_RANK: dict[str, int] = {
    "NONE": 0,
    "PUBLIC": 1,
    "CONFIDENTIAL": 2,
    "SECRET": 3,
    "TOP_SECRET": 4,
    "RESTRICTED_DATA": 5,
}

ClearanceAction = Literal["GRANT", "REVOKE", "SUSPEND", "RESTORE"]


@dataclass
class ClearanceEntry:
    principal_id: str
    action: str  # ClearanceAction
    level: str  # ClearanceLevel
    basis_citation: str
    timestamp: float


@dataclass
class ClearanceLedgerResult:
    principal_id: str
    current: str  # ClearanceLevel
    history: list[ClearanceEntry]

    def is_cleared_for(self, level: str) -> bool:
        return CLEARANCE_RANK[self.current] >= CLEARANCE_RANK[level]


class ClearanceLedger:
    """Append-only clearance ledger."""

    def __init__(self) -> None:
        self._entries: list[ClearanceEntry] = []

    def append(self, entry: ClearanceEntry) -> None:
        if not entry.basis_citation or not entry.basis_citation.strip():
            raise ValueError("Clearance change requires a basis citation.")
        if not math.isfinite(entry.timestamp):
            raise ValueError("Clearance change requires a timestamp.")
        if self._entries:
            last = self._entries[-1]
            if entry.timestamp < last.timestamp:
                raise ValueError("Ledger is append-only by timestamp.")
        self._entries.append(ClearanceEntry(**entry.__dict__))

    def for_principal(self, principal_id: str) -> ClearanceLedgerResult:
        history = [e for e in self._entries if e.principal_id == principal_id]
        current: str = "NONE"
        for e in history:
            if e.action in ("GRANT", "RESTORE"):
                current = e.level
            elif e.action == "REVOKE":
                current = "NONE"
            elif e.action == "SUSPEND":
                current = "NONE"
        return ClearanceLedgerResult(
            principal_id=principal_id,
            current=current,
            history=history,
        )

    def size(self) -> int:
        return len(self._entries)


# ---------------------------------------------------------------------------
# Primitive 26 — Classification ladder
# ---------------------------------------------------------------------------

ClassLevel = Literal[
    "UNCLASSIFIED", "CONFIDENTIAL", "SECRET", "TOP_SECRET", "RESTRICTED_DATA"
]

CLASS_RANK: dict[str, int] = {
    "UNCLASSIFIED": 0,
    "CONFIDENTIAL": 1,
    "SECRET": 2,
    "TOP_SECRET": 3,
    "RESTRICTED_DATA": 4,
}

_CLEARANCE_FOR_CLASS: dict[str, str] = {
    "UNCLASSIFIED": "PUBLIC",
    "CONFIDENTIAL": "CONFIDENTIAL",
    "SECRET": "SECRET",
    "TOP_SECRET": "TOP_SECRET",
    "RESTRICTED_DATA": "RESTRICTED_DATA",
}

_CLEARANCE_LEVEL_RANK: dict[str, int] = {
    "NONE": 0,
    "PUBLIC": 1,
    "CONFIDENTIAL": 2,
    "SECRET": 3,
    "TOP_SECRET": 4,
    "RESTRICTED_DATA": 5,
}


@dataclass
class DowngradeOrder:
    from_level: str  # ClassLevel
    to_level: str    # ClassLevel
    basis_citation: str
    authorized_by: str


@dataclass
class ClassificationDecision:
    artifact_id: str
    declared: str   # ClassLevel
    effective: str  # ClassLevel
    downgrades: list[DowngradeOrder]
    reason: str


def downgrade(
    artifact_id: str,
    declared: str,
    orders: list[DowngradeOrder],
) -> ClassificationDecision:
    """Apply a sequence of downgrade orders to an artifact."""
    effective = declared
    applied: list[DowngradeOrder] = []
    for o in orders:
        if CLASS_RANK[o.from_level] != CLASS_RANK[effective]:
            raise ValueError(
                f"Downgrade chain broken: order from={o.from_level} but current effective={effective}."
            )
        if CLASS_RANK[o.to_level] >= CLASS_RANK[o.from_level]:
            raise ValueError(
                f"Downgrade must go strictly lower: {o.from_level} → {o.to_level}."
            )
        if not o.basis_citation or not o.authorized_by:
            raise ValueError("Each downgrade order requires basisCitation and authorizedBy.")
        effective = o.to_level
        applied.append(o)
    return ClassificationDecision(
        artifact_id=artifact_id,
        declared=declared,
        effective=effective,
        downgrades=applied,
        reason=(
            f"No downgrades; effective level = declared ({declared})."
            if not applied
            else f"Downgraded {len(applied)} step(s): {declared} → {effective}."
        ),
    )


def can_read(decision: ClassificationDecision, reader_clearance: str) -> bool:
    """Check whether a reader's clearance permits reading the artifact."""
    required = _CLEARANCE_FOR_CLASS[decision.effective]
    return _CLEARANCE_LEVEL_RANK[reader_clearance] >= _CLEARANCE_LEVEL_RANK[required]


# ---------------------------------------------------------------------------
# Primitive 27 — Dual-use review (Bohr "open world" test)
# ---------------------------------------------------------------------------

DualUseVerdict = Literal["OPEN_PUBLISH", "PUBLISH_GUARDED", "HOLD", "SUPPRESS"]


@dataclass(frozen=True)
class DualUseInput:
    artifact_id: str
    benign_benefit: float
    harm_potential: float
    reproducibility: float
    verifiability: float
    sunset_days: int = 365


@dataclass(frozen=True)
class DualUseResult:
    artifact_id: str
    verdict: str  # DualUseVerdict
    bohr_score: float
    rationale: str


def dual_use_review(input: DualUseInput) -> DualUseResult:
    """Compute the Bohr dual-use verdict for an artifact."""
    for attr in ("benign_benefit", "harm_potential", "reproducibility", "verifiability"):
        v = getattr(input, attr)
        if not math.isfinite(v) or v < 0 or v > 1:
            raise ValueError(f"{attr} must be in [0,1]; got {v}.")

    bohr = (
        (input.benign_benefit + input.reproducibility + input.verifiability) / 3
        - input.harm_potential
    )

    if bohr >= 0.4:
        verdict = "OPEN_PUBLISH"
        rationale = "Bohr-positive: benefit/reproducibility/verifiability dominate; secrecy is performative."
    elif bohr >= 0.0:
        verdict = "PUBLISH_GUARDED"
        rationale = "Mixed: release with redaction or staged delivery."
    elif bohr >= -0.4:
        verdict = "HOLD"
        rationale = f"Hold with sunset ({input.sunset_days} days). Re-review required."
    else:
        verdict = "SUPPRESS"
        rationale = "Harm potential dominates; suppression authorised, cause auditable."

    return DualUseResult(
        artifact_id=input.artifact_id,
        verdict=verdict,
        bohr_score=bohr,
        rationale=rationale,
    )


# ---------------------------------------------------------------------------
# Primitive 28 — Moral-responsibility ledger
# ---------------------------------------------------------------------------


@dataclass
class MoralEntry:
    entry_id: str
    actor_id: str
    action_id: str
    foreseen_harms: list[str]
    unforeseen_harms: list[str]
    counterfactual: str
    causality: float  # [0,1]
    authority_claim: str
    accountability_witness: str | None  # None = anonymous; refused
    timestamp: float


@dataclass(frozen=True)
class MoralLedgerSummary:
    entry_count: int
    anonymous_count: int
    mean_causality: float
    mean_accountability: float
    accepted_entries: list[MoralEntry]
    refused_entries: list[MoralEntry]


class MoralLedger:
    """Append-only moral responsibility ledger."""

    def __init__(self) -> None:
        self._accepted: list[MoralEntry] = []
        self._refused: list[MoralEntry] = []

    def record(self, entry: MoralEntry) -> dict[str, Any]:
        if entry.accountability_witness is None:
            self._refused.append(entry)
            return {
                "accepted": False,
                "reason": "Anonymous moral cost refused; entry stored in refused log only.",
            }
        if entry.causality < 0 or entry.causality > 1:
            raise ValueError("causality must be in [0,1].")
        self._accepted.append(entry)
        return {"accepted": True, "reason": "Entry recorded with named witness."}

    def summary(self) -> MoralLedgerSummary:
        total = len(self._accepted) + len(self._refused)
        mean_causality = (
            0.0
            if not self._accepted
            else sum(e.causality for e in self._accepted) / len(self._accepted)
        )
        mean_accountability = (
            1.0
            if total == 0
            else (len(self._accepted) / total) * (0.5 + 0.5 * mean_causality)
        )
        return MoralLedgerSummary(
            entry_count=total,
            anonymous_count=len(self._refused),
            mean_causality=mean_causality,
            mean_accountability=mean_accountability,
            accepted_entries=list(self._accepted),
            refused_entries=list(self._refused),
        )

    def moral_grounding_axis(self) -> float:
        return self.summary().mean_accountability
