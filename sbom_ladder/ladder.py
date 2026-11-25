"""SBOM integrity ladder (propose-only).

Doctrine (leader-study card r1, #1098 read-only): an SBOM claim is only
as strong as its weakest pin. Strict ladder levels:
L1_INVENTORY     nonempty validated name + version
L2_DIGEST_PINNED  additionally a well-formed 64-lowercase-hex sha256
                  content digest
L3_BUILD_PINNED   additionally BOTH a well-formed build-recipe digest
                  AND a nonempty provenance reference
L4_SIGNED         owner-minted signature reference (OWNER_GATED)
Missing higher-level evidence downgrades to the highest fully
evidenced lower level (honest downgrade, never a guess); malformed
evidence for any supplied field raises fail-closed rather than being
silently ignored. The owner signing mint does not exist in the
unsigned estate, so L4 is never attained structurally and a signature
claim raises SignatureClaimError whether presented alone or alongside
lower-level evidence.

Honest limitation, verbatim: ladder evaluation is STRUCTURAL bookkeeping
over DECLARED evidence only; it is not a scanner, not a security
certification, not vulnerability analysis, and not SLSA certification.
Signature validation is owner-gated and cannot be manufactured.

Propose-only, unsigned; merges are owned by the estate signature wall.
No status claims are made about any other pull request.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Dict, List, Optional

SCHEMA_VERSION = "szl.sbom_ladder/v1"
BANNER = "PROPOSAL_ONLY_UNSIGNED"

L1_INVENTORY = "L1_INVENTORY"
L2_DIGEST_PINNED = "L2_DIGEST_PINNED"
L3_BUILD_PINNED = "L3_BUILD_PINNED"
L4_SIGNED = "L4_SIGNED"
LEVEL_ORDER = [L1_INVENTORY, L2_DIGEST_PINNED, L3_BUILD_PINNED, L4_SIGNED]

HEX64 = re.compile(r"^[0-9a-f]{64}$")
STRUCTURAL_ONLY_DISCLOSURE = ("STRUCTURAL_ONLY: levels reflect declared "
                              "evidence pins, not verification; not a "
                              "scanner, not security certification, not "
                              "vulnerability analysis, not SLSA certification")


class ComponentError(ValueError):
    """A component declaration is malformed, duplicated, or claims
    owner-gated trust."""


class SignatureClaimError(ComponentError):
    """A signature reference was declared; signature validation is
    OWNER_GATED and cannot be manufactured in the unsigned estate."""


@dataclass
class Component:
    name: str
    version: str
    content_digest: Optional[str] = None
    build_digest: Optional[str] = None
    provenance_ref: Optional[str] = None
    signature_ref: Optional[str] = None

    @property
    def identifier(self) -> str:
        return self.name + "@" + self.version

    def __post_init__(self):
        if not self.name or not isinstance(self.name, str):
            raise ComponentError("name must be a non-empty string")
        if not self.version or not isinstance(self.version, str):
            raise ComponentError("version must be a non-empty string")
        for field, dig in (("content_digest", self.content_digest),
                           ("build_digest", self.build_digest)):
            if dig is not None and not (isinstance(dig, str) and HEX64.match(dig)):
                raise ComponentError(field + " must be 64-char lowercase hex sha256")
        if self.provenance_ref is not None:
            if not isinstance(self.provenance_ref, str):
                raise ComponentError("provenance_ref must be a string when supplied")
            if not self.provenance_ref.strip():
                raise ComponentError("provenance_ref must be nonempty when supplied")
        # Signature claims fail closed FIRST, whether alone or alongside
        # lower-level evidence.
        if self.signature_ref is not None:
            raise SignatureClaimError(
                "signature_ref declared but the owner signing mint does not "
                "exist in the unsigned estate; signature validation is "
                "owner-gated and cannot be manufactured")


def _downgrade_reasons(c: Component) -> List[str]:
    reasons = []
    if c.content_digest is None:
        reasons.append("missing content_digest: L2 not evidenced")
    if c.content_digest is not None and (c.build_digest is None or not c.provenance_ref):
        reasons.append("missing build_digest and/or provenance_ref: L3 not evidenced")
    reasons.append("L4_SIGNED owner-gated: unsigned estate, signature mint absent")
    return reasons


def attained_level(component: Component) -> str:
    """Highest FULLY evidenced level; weakest pin governs; never a guess."""
    if not isinstance(component, Component):
        raise ComponentError("attained_level requires a Component")
    if component.content_digest is None:
        return L1_INVENTORY
    if component.build_digest is None or not component.provenance_ref:
        return L2_DIGEST_PINNED
    return L3_BUILD_PINNED
    # L4_SIGNED is unreachable by design in the unsigned estate.


@dataclass
class LadderRow:
    identifier: str
    attained_level: str
    declared_evidence: Dict[str, bool]
    downgrade_reasons: List[str]

    def as_dict(self) -> dict:
        return {"identifier": self.identifier,
                "attained_level": self.attained_level,
                "declared_evidence": self.declared_evidence,
                "downgrade_reasons": self.downgrade_reasons}


def ladder_report(components: List[Component]) -> Dict[str, object]:
    """Per-component structural ladder with explicit downgrade disclosure.

    Duplicate component identifiers (name@version) are rejected; an empty
    collection is rejected fail-closed. There is no single merged status
    key: the report is per-component structure only.
    """
    if not isinstance(components, list) or not components:
        raise ComponentError("component collection must be a non-empty list")
    rows = []
    seen = set()
    counts: Dict[str, int] = {lvl: 0 for lvl in LEVEL_ORDER}
    for c in components:
        if not isinstance(c, Component):
            raise ComponentError("ladder_report requires Component instances")
        if c.identifier in seen:
            raise ComponentError("duplicate component identifier rejected: " + c.identifier)
        seen.add(c.identifier)
        lvl = attained_level(c)
        counts[lvl] += 1
        rows.append(LadderRow(
            identifier=c.identifier,
            attained_level=lvl,
            declared_evidence={
                "content_digest": c.content_digest is not None,
                "build_digest": c.build_digest is not None,
                "provenance_ref": bool(c.provenance_ref),
                "signature_ref": c.signature_ref is not None,
            },
            downgrade_reasons=_downgrade_reasons(c),
        ).as_dict())
    return {"schema_version": SCHEMA_VERSION,
            "banner": BANNER,
            "per_component": rows,
            "level_counts": counts,
            "l4_signed_count": 0,
            "disclosure": STRUCTURAL_ONLY_DISCLOSURE,
            "no_merged_status": True}
