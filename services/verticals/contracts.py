"""Shared substrate contracts for Alloy Meridian vertical packs.

This module is the single source of truth for the recommendation envelope
emitted by every vertical pack (``services/verticals/<vertical_id>/``). The
envelope is intentionally JSON-serialisable using the Python stdlib only —
no pydantic, no third-party validators — so the substrate works on any
Python 3.11+ install without dependency churn.

Acceptance criteria sourced from the Vertical Gap Closure payload:

    {
      "id": "string",
      "vertical": "string",
      "title": "string",
      "owner": "string",
      "confidence": 0.0,
      "evidence_ids": ["string"],
      "next_action": "string",
      "rollback_path": "string",
      "requires_human_approval": true,
      "model": "gpt-5.5-2026-04-23",
      "input_class": "string",
      "output_class": "string"
    }

Validation is enforced by :func:`validate_recommendation`, which returns a list
of human-readable error strings (empty list = valid). Callers can also use
:meth:`Recommendation.to_dict` to obtain the canonical JSON shape.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from typing import Any, Iterable

# Default canonical model token. Bumping this value MUST be paired with a
# regression in test_contracts so anyone touching the contract is aware.
DEFAULT_MODEL: str = "gpt-5.5-2026-04-23"

# Locked, ordered set of fields. Adding a field is a breaking change for the
# substrate; any addition must update the registered version below and the
# corresponding tests.
CONTRACT_VERSION: str = "1.0.0"

REQUIRED_FIELDS: tuple[str, ...] = (
    "id",
    "vertical",
    "title",
    "owner",
    "confidence",
    "evidence_ids",
    "next_action",
    "rollback_path",
    "requires_human_approval",
    "model",
    "input_class",
    "output_class",
)


@dataclass(frozen=True)
class Recommendation:
    """Substrate recommendation envelope.

    All vertical packs return one of these from ``recommendations.build()``.
    """

    id: str
    vertical: str
    title: str
    owner: str
    confidence: float
    evidence_ids: list[str]
    next_action: str
    rollback_path: str
    requires_human_approval: bool = True
    model: str = DEFAULT_MODEL
    input_class: str = "operator_signals_v1"
    output_class: str = "operator_recommendation_v1"

    def to_dict(self) -> dict[str, Any]:
        """Return the canonical JSON-serialisable dict shape."""
        return asdict(self)


@dataclass(frozen=True)
class VerticalArtifact:
    """Artifact bundle written by ``vertical_moats.py --brief``.

    A single artifact captures everything a downstream UI or operator needs
    to render the vertical's current state without re-running the pack.
    """

    vertical: str
    generated_at: str  # ISO-8601 UTC
    signals: list[dict[str, Any]] = field(default_factory=list)
    forecast: dict[str, Any] = field(default_factory=dict)
    evidence: list[dict[str, Any]] = field(default_factory=list)
    recommendation: dict[str, Any] = field(default_factory=dict)
    brief: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def validate_recommendation(rec: Recommendation | dict[str, Any]) -> list[str]:
    """Return a list of error strings for ``rec``. Empty list = valid.

    Accepts either a :class:`Recommendation` instance or a raw dict so the
    validator can also lint deserialised JSON from disk.
    """
    errors: list[str] = []
    payload = rec.to_dict() if isinstance(rec, Recommendation) else dict(rec)

    for f in REQUIRED_FIELDS:
        if f not in payload:
            errors.append(f"missing required field: {f}")

    if errors:
        return errors  # bail early; type checks below assume keys exist

    if not isinstance(payload["id"], str) or not payload["id"]:
        errors.append("id must be a non-empty string")
    if not isinstance(payload["vertical"], str) or not payload["vertical"]:
        errors.append("vertical must be a non-empty string")
    if not isinstance(payload["title"], str) or not payload["title"]:
        errors.append("title must be a non-empty string")
    if not isinstance(payload["owner"], str) or not payload["owner"]:
        errors.append("owner must be a non-empty string")

    confidence = payload["confidence"]
    if not isinstance(confidence, (int, float)) or isinstance(confidence, bool):
        errors.append("confidence must be a float in [0.0, 1.0]")
    elif not (0.0 <= float(confidence) <= 1.0):
        errors.append(f"confidence {confidence} out of range [0.0, 1.0]")

    evidence_ids = payload["evidence_ids"]
    if not isinstance(evidence_ids, list) or not all(
        isinstance(e, str) and e for e in evidence_ids
    ):
        errors.append("evidence_ids must be a list of non-empty strings")

    if not isinstance(payload["next_action"], str) or not payload["next_action"]:
        errors.append("next_action must be a non-empty string")
    if not isinstance(payload["rollback_path"], str) or not payload["rollback_path"]:
        errors.append("rollback_path must be a non-empty string")
    if not isinstance(payload["requires_human_approval"], bool):
        errors.append("requires_human_approval must be a bool")
    if not isinstance(payload["model"], str) or not payload["model"]:
        errors.append("model must be a non-empty string")
    elif payload["model"] != DEFAULT_MODEL:
        errors.append(f"model must equal {DEFAULT_MODEL!r}, got {payload['model']!r}")
    if not isinstance(payload["input_class"], str) or not payload["input_class"]:
        errors.append("input_class must be a non-empty string")
    if not isinstance(payload["output_class"], str) or not payload["output_class"]:
        errors.append("output_class must be a non-empty string")

    return errors


def validate_many(recs: Iterable[Recommendation | dict[str, Any]]) -> dict[str, list[str]]:
    """Validate a batch and return ``{rec_id: [errors]}`` for any with issues."""
    out: dict[str, list[str]] = {}
    for idx, rec in enumerate(recs):
        errs = validate_recommendation(rec)
        if errs:
            payload = rec.to_dict() if isinstance(rec, Recommendation) else dict(rec)
            key = str(payload.get("id") or f"index_{idx}")
            out[key] = errs
    return out


__all__ = [
    "CONTRACT_VERSION",
    "DEFAULT_MODEL",
    "REQUIRED_FIELDS",
    "Recommendation",
    "VerticalArtifact",
    "validate_recommendation",
    "validate_many",
]
