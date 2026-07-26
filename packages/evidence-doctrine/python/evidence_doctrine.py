# SPDX-License-Identifier: Apache-2.0
"""Fail-closed Decision-SLSA reference evaluator."""

import re
from collections.abc import Mapping
from dataclasses import asdict, dataclass
from datetime import datetime

EVIDENCE_STATES = ("VERIFIED", "UNVERIFIED", "ABSENT")
LEVEL_REQUIREMENTS = {
    "D1": ("inputs_recorded", "policy_recorded", "output_recorded"),
    "D2": ("signature_verified", "tamper_evidence_verified"),
    "D3": (
        "third_party_transparency_log_verified",
        "byte_identical_replay_verified",
        "offline_verification_verified",
    ),
    "D4": (
        "hardware_attested_execution_verified",
        "formally_specified_policy_verified",
        "machine_checked_denial_verified",
    ),
}
THEOREM_U_PREMISES = ("premise_u1", "premise_u2", "premise_u3")


@dataclass(frozen=True)
class GradeResult:
    bundle_subject: str
    bundle_sha256: str
    evaluated_at: str
    achieved_level: str
    evaluation_state: str
    satisfied_requirements: tuple[str, ...]
    blocking_requirements: tuple[str, ...]
    unverified_requirements: tuple[str, ...]
    absent_requirements: tuple[str, ...]
    note: str

    def to_dict(self) -> dict:
        return asdict(self)


def _validate_state(requirement: str, state: object) -> str:
    if state not in EVIDENCE_STATES:
        raise TypeError(
            f"{requirement} must be VERIFIED, UNVERIFIED, or ABSENT; "
            f"received {state!r}"
        )
    return str(state)


def _validate_bundle(
    bundle: Mapping[str, object],
) -> tuple[Mapping[str, object], Mapping[str, object]]:
    if not isinstance(bundle, Mapping):
        raise TypeError("decision bundle must be a mapping")
    identity = bundle.get("identity")
    evidence = bundle.get("evidence")
    if not isinstance(identity, Mapping):
        raise TypeError("decision bundle identity must be a mapping")
    subject = identity.get("subject")
    if (
        not isinstance(subject, str)
        or not subject
        or subject.strip() != subject
    ):
        raise TypeError("identity.subject must be a non-empty canonical string")
    bundle_sha256 = identity.get("bundle_sha256")
    if (
        not isinstance(bundle_sha256, str)
        or re.fullmatch(r"[0-9a-f]{64}", bundle_sha256) is None
    ):
        raise TypeError(
            "identity.bundle_sha256 must be a lowercase sha256 digest"
        )
    evaluated_at = identity.get("evaluated_at")
    if (
        not isinstance(evaluated_at, str)
        or re.search(r"(?:Z|[+-]\d{2}:\d{2})$", evaluated_at) is None
    ):
        raise TypeError(
            "identity.evaluated_at must be a timezone-qualified timestamp"
        )
    try:
        timestamp = datetime.fromisoformat(evaluated_at.replace("Z", "+00:00"))
    except ValueError as exc:
        raise TypeError(
            "identity.evaluated_at must be a timezone-qualified timestamp"
        ) from exc
    if timestamp.tzinfo is None:
        raise TypeError(
            "identity.evaluated_at must be a timezone-qualified timestamp"
        )
    if not isinstance(evidence, Mapping):
        raise TypeError("decision bundle evidence must be a mapping")
    return identity, evidence


def grade_decision(bundle: Mapping[str, object]) -> GradeResult:
    """Return the highest consecutively satisfied Decision-SLSA level."""
    identity, evidence = _validate_bundle(bundle)
    states = {}
    for requirements in LEVEL_REQUIREMENTS.values():
        for requirement in requirements:
            states[requirement] = _validate_state(
                requirement, evidence.get(requirement, "ABSENT")
            )

    achieved_level = "D0"
    blocking_requirements: tuple[str, ...] = ()
    for level, requirements in LEVEL_REQUIREMENTS.items():
        blocked = tuple(
            requirement
            for requirement in requirements
            if states[requirement] != "VERIFIED"
        )
        if blocked:
            blocking_requirements = blocked
            break
        achieved_level = level

    return GradeResult(
        bundle_subject=str(identity["subject"]),
        bundle_sha256=str(identity["bundle_sha256"]),
        evaluated_at=str(identity["evaluated_at"]),
        achieved_level=achieved_level,
        evaluation_state="EVALUATED_FROM_SUPPLIED_EVIDENCE",
        satisfied_requirements=tuple(
            name for name, state in states.items() if state == "VERIFIED"
        ),
        blocking_requirements=blocking_requirements,
        unverified_requirements=tuple(
            name for name, state in states.items() if state == "UNVERIFIED"
        ),
        absent_requirements=tuple(
            name for name, state in states.items() if state == "ABSENT"
        ),
        note=(
            "This result grades only the supplied evidence states. It is not a "
            "certification, publication, or independent audit."
        ),
    )


def assert_lambda_case_study(value: Mapping[str, object]) -> dict:
    """Reject a closed, green, or machine-checked Lambda uniqueness claim."""
    expected = {
        "claim": "CONJECTURE_1",
        "state": "OPEN",
        "display": "GRAY",
        "machine_checked": False,
    }
    if dict(value) != expected:
        raise ValueError(
            "Lambda uniqueness must remain CONJECTURE_1, OPEN, GRAY, "
            "and not machine-checked"
        )
    return expected


def evaluate_theorem_u(premises: Mapping[str, object]) -> str:
    """Return a conditional status without closing Lambda Conjecture 1."""
    if set(premises) != set(THEOREM_U_PREMISES):
        return "CONDITIONAL_OPEN"
    states = tuple(
        _validate_state(name, premises[name]) for name in THEOREM_U_PREMISES
    )
    if all(state == "VERIFIED" for state in states):
        return "CONDITIONALLY_SATISFIED"
    return "CONDITIONAL_OPEN"
