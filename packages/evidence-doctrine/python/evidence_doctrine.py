# SPDX-License-Identifier: Apache-2.0
"""Fail-closed Decision-SLSA reference evaluator."""

from dataclasses import asdict, dataclass
from typing import Mapping

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
THEOREM_U_PREMISES = ("u1", "u2", "u3")


@dataclass(frozen=True)
class GradeResult:
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


def grade_decision(evidence: Mapping[str, object]) -> GradeResult:
    """Return the highest consecutively satisfied Decision-SLSA level."""
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
