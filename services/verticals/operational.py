"""Fail-closed operational contract for SZL vertical runtimes.

The existing vertical packs produce deterministic demonstration artifacts.  This
module adds the separate contract required to call a vertical *operational*.

Truth states are deliberately narrow:

- LIVE: a current upstream observation returned and carries provenance.
- MIXED: current observations coexist with explicitly labelled sample/model data.
- CACHED: a previously live observation is still inside a declared freshness TTL.
- OBSERVED: a sourced point-in-time observation without a continuous-live claim.
- HISTORICAL_SAMPLE: a real historical row used for replay or demonstration.
- SAMPLE: synthetic/bundled demonstration data.
- MODELED: derived output, never promoted to observed truth.
- UNAVAILABLE: no defensible observation.

Readiness is computed.  A caller cannot set ``status="operational"`` and bypass
the evidence, Anatomy, Second Brain, formula, deployment, and human-lock gates.
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Iterable, Mapping, Sequence
from urllib.parse import urlparse

SCHEMA = "szl.vertical-operational-contract/v1"
YUYAY_AXIS_COUNT = 13
MANDATORY_ANATOMY_ORGANS = (
    "EYES_EARS",
    "IMMUNE",
    "BRAIN",
    "SKELETON",
    "HEART",
    "HANDS",
    "MEMORY",
)
HEX64 = re.compile(r"^[0-9a-f]{64}$")
CURRENT_EVIDENCE_STATES = frozenset({"LIVE", "MIXED", "CACHED", "OBSERVED"})


class EvidenceState(str, Enum):
    LIVE = "LIVE"
    MIXED = "MIXED"
    CACHED = "CACHED"
    OBSERVED = "OBSERVED"
    HISTORICAL_SAMPLE = "HISTORICAL_SAMPLE"
    SAMPLE = "SAMPLE"
    MODELED = "MODELED"
    UNAVAILABLE = "UNAVAILABLE"


class ReadinessState(str, Enum):
    INVALID = "INVALID"
    UNAVAILABLE = "UNAVAILABLE"
    SAMPLE_ONLY = "SAMPLE_ONLY"
    IMPLEMENTED_UNVERIFIED = "IMPLEMENTED_UNVERIFIED"
    DEPLOYED_DEGRADED = "DEPLOYED_DEGRADED"
    OPERATIONAL = "OPERATIONAL"


class FormulaProofState(str, Enum):
    LOCKED_PROVEN = "LOCKED_PROVEN"
    EMPIRICAL = "EMPIRICAL"
    CONJECTURE_OPEN = "CONJECTURE_OPEN"
    UNAVAILABLE = "UNAVAILABLE"


@dataclass(frozen=True)
class DataSourceBinding:
    id: str
    kind: str
    authority: str
    state: EvidenceState
    source_url: str | None = None
    fetched_at: str | None = None
    provenance: str | None = None
    record_count: int = 0
    live_record_count: int = 0
    sample_record_count: int = 0
    max_age_seconds: int | None = None
    credential: str = "none"
    coverage: str | None = None
    notes: str | None = None

    def errors(self, *, now: datetime | None = None) -> list[str]:
        errors: list[str] = []
        prefix = f"data_sources[{self.id}]"
        if not self.id.strip():
            errors.append(f"{prefix}: id is required")
        if not self.kind.strip():
            errors.append(f"{prefix}: kind is required")
        if not self.authority.strip():
            errors.append(f"{prefix}: authority is required")
        if self.record_count < 0 or self.live_record_count < 0 or self.sample_record_count < 0:
            errors.append(f"{prefix}: record counts must be non-negative")
        if self.live_record_count + self.sample_record_count > self.record_count:
            errors.append(f"{prefix}: live+sample record counts exceed record_count")

        if self.state.value in CURRENT_EVIDENCE_STATES:
            if not _is_https(self.source_url):
                errors.append(f"{prefix}: current evidence requires an HTTPS source_url")
            if not self.fetched_at:
                errors.append(f"{prefix}: current evidence requires fetched_at")
            elif _parse_time(self.fetched_at) is None:
                errors.append(f"{prefix}: fetched_at must be an ISO-8601 timestamp")
            if not self.provenance:
                errors.append(f"{prefix}: current evidence requires provenance")
            if self.record_count <= 0:
                errors.append(f"{prefix}: current evidence requires record_count > 0")

        if self.state is EvidenceState.LIVE:
            if self.live_record_count <= 0:
                errors.append(f"{prefix}: LIVE requires live_record_count > 0")
            if self.sample_record_count:
                errors.append(f"{prefix}: LIVE cannot contain sample records; use MIXED")

        if self.state is EvidenceState.MIXED:
            if self.live_record_count <= 0:
                errors.append(f"{prefix}: MIXED requires at least one live record")
            if self.sample_record_count <= 0:
                errors.append(f"{prefix}: MIXED requires at least one sample record")

        if self.state is EvidenceState.CACHED:
            if not self.max_age_seconds or self.max_age_seconds <= 0:
                errors.append(f"{prefix}: CACHED requires max_age_seconds > 0")
            observed = _parse_time(self.fetched_at)
            current = now or datetime.now(timezone.utc)
            if observed and self.max_age_seconds and (current - observed).total_seconds() > self.max_age_seconds:
                errors.append(f"{prefix}: cached evidence is stale")

        if self.state in {EvidenceState.SAMPLE, EvidenceState.HISTORICAL_SAMPLE}:
            if self.live_record_count:
                errors.append(f"{prefix}: sample evidence cannot contain live records")

        if self.state is EvidenceState.UNAVAILABLE and self.record_count:
            errors.append(f"{prefix}: UNAVAILABLE must not advertise records")
        return errors

    @property
    def has_current_evidence(self) -> bool:
        return self.state.value in CURRENT_EVIDENCE_STATES and self.record_count > 0


@dataclass(frozen=True)
class FormulaBinding:
    name: str
    role: str
    proof_state: FormulaProofState
    measured_input_count: int = 0
    total_input_count: int = 0
    output_name: str | None = None
    theorem_claimed: bool = False
    full_yuyay13_claimed: bool = False
    receipt_id: str | None = None
    notes: str | None = None

    def errors(self) -> list[str]:
        errors: list[str] = []
        prefix = f"formulas[{self.name}]"
        if not self.name.strip():
            errors.append(f"{prefix}: name is required")
        if not self.role.strip():
            errors.append(f"{prefix}: role is required")
        if self.measured_input_count < 0 or self.total_input_count < 0:
            errors.append(f"{prefix}: input counts must be non-negative")
        if self.measured_input_count > self.total_input_count:
            errors.append(f"{prefix}: measured_input_count exceeds total_input_count")
        if self.proof_state is FormulaProofState.CONJECTURE_OPEN and self.theorem_claimed:
            errors.append(f"{prefix}: open conjecture cannot be presented as a theorem")
        if self.full_yuyay13_claimed:
            if self.total_input_count != YUYAY_AXIS_COUNT:
                errors.append(f"{prefix}: full Yuyay-13 requires total_input_count=13")
            if self.measured_input_count != YUYAY_AXIS_COUNT:
                errors.append(f"{prefix}: full Yuyay-13 requires all 13 measured inputs")
        if self.output_name == "full_yuyay13" and not self.full_yuyay13_claimed:
            errors.append(f"{prefix}: full_yuyay13 output requires the full claim gate")
        return errors


@dataclass(frozen=True)
class SecondBrainBinding:
    state: EvidenceState
    contract: str = "szl.brain.navigator-context/v1"
    content_access: str = "HANDLES_ONLY"
    endpoint: str | None = None
    retrieved_at: str | None = None
    handle_count: int = 0
    evidence_count: int = 0
    score_semantics: str = "LEXICAL_OVERLAP_NOT_CORRECTNESS"
    notes: str | None = None

    def errors(self) -> list[str]:
        errors: list[str] = []
        if self.content_access != "HANDLES_ONLY":
            errors.append("second_brain: content_access must be HANDLES_ONLY")
        if self.score_semantics != "LEXICAL_OVERLAP_NOT_CORRECTNESS":
            errors.append("second_brain: retrieval score must not be labelled correctness")
        if self.handle_count < 0 or self.evidence_count < 0:
            errors.append("second_brain: counts must be non-negative")
        if self.state.value in CURRENT_EVIDENCE_STATES:
            if not _is_https(self.endpoint) and self.endpoint != "local://second_brain":
                errors.append("second_brain: current state requires HTTPS or local://second_brain endpoint")
            if not self.retrieved_at:
                errors.append("second_brain: current state requires retrieved_at")
            elif _parse_time(self.retrieved_at) is None:
                errors.append("second_brain: retrieved_at must be an ISO-8601 timestamp")
            if self.handle_count <= 0:
                errors.append("second_brain: current state requires at least one handle")
            if self.evidence_count <= 0:
                errors.append("second_brain: current state requires at least one evidence digest")
        if self.state is EvidenceState.UNAVAILABLE and (self.handle_count or self.evidence_count):
            errors.append("second_brain: UNAVAILABLE must not advertise handles or evidence")
        return errors


@dataclass(frozen=True)
class AnatomyOrganBinding:
    organ: str
    state: str
    evidence: str | None = None
    notes: str | None = None

    def errors(self) -> list[str]:
        errors: list[str] = []
        if not self.organ.strip():
            errors.append("anatomy: organ is required")
        if self.state not in {"OPERATIONAL", "DEGRADED", "HUMAN_LOCK", "HASHED_NOT_SIGNED", "UNAVAILABLE", "HALT"}:
            errors.append(f"anatomy[{self.organ}]: unsupported state {self.state!r}")
        if self.state in {"OPERATIONAL", "DEGRADED", "HUMAN_LOCK", "HASHED_NOT_SIGNED"} and not self.evidence:
            errors.append(f"anatomy[{self.organ}]: state {self.state} requires evidence")
        return errors


@dataclass(frozen=True)
class AnatomyBinding:
    organs: tuple[AnatomyOrganBinding, ...]

    def errors(self) -> list[str]:
        errors: list[str] = []
        seen: set[str] = set()
        for organ in self.organs:
            errors.extend(organ.errors())
            if organ.organ in seen:
                errors.append(f"anatomy: duplicate organ {organ.organ}")
            seen.add(organ.organ)
        missing = sorted(set(MANDATORY_ANATOMY_ORGANS) - seen)
        if missing:
            errors.append(f"anatomy: missing mandatory organs {', '.join(missing)}")
        return errors

    @property
    def degraded(self) -> bool:
        lookup = {organ.organ: organ.state for organ in self.organs}
        return any(
            lookup.get(name) in {None, "DEGRADED", "UNAVAILABLE", "HALT"}
            for name in MANDATORY_ANATOMY_ORGANS
        )


@dataclass(frozen=True)
class DeploymentEvidence:
    exact_source_sha: str | None = None
    deployment_receipt: str | None = None
    live_probe_at: str | None = None
    probed_routes: tuple[str, ...] = ()
    source_bytes_match: bool = False
    notes: str | None = None

    def errors(self) -> list[str]:
        errors: list[str] = []
        if self.exact_source_sha and not re.fullmatch(r"[0-9a-f]{40}", self.exact_source_sha):
            errors.append("deployment: exact_source_sha must be a 40-character lowercase git SHA")
        if self.source_bytes_match and not self.exact_source_sha:
            errors.append("deployment: source_bytes_match requires exact_source_sha")
        if self.live_probe_at and _parse_time(self.live_probe_at) is None:
            errors.append("deployment: live_probe_at must be an ISO-8601 timestamp")
        if self.live_probe_at and not self.probed_routes:
            errors.append("deployment: live_probe_at requires at least one probed route")
        return errors

    @property
    def verified(self) -> bool:
        return bool(
            self.exact_source_sha
            and self.deployment_receipt
            and self.live_probe_at
            and self.probed_routes
            and self.source_bytes_match
        )


@dataclass(frozen=True)
class VerticalOperationalManifest:
    vertical_id: str
    title: str
    repository: str
    domains: tuple[str, ...]
    runtime_routes: tuple[str, ...]
    data_sources: tuple[DataSourceBinding, ...]
    formulas: tuple[FormulaBinding, ...]
    second_brain: SecondBrainBinding
    anatomy: AnatomyBinding
    requires_human_approval: bool
    rollback_path: str | None
    automation_authority: str = "NONE"
    evidence_digest: str | None = None
    receipt_state: str = "UNAVAILABLE"
    deployment: DeploymentEvidence = field(default_factory=DeploymentEvidence)
    legacy_ids: tuple[str, ...] = ()
    implementation_state: str = "UNVERIFIED"
    notes: str | None = None
    schema: str = SCHEMA

    def errors(self, *, now: datetime | None = None) -> list[str]:
        errors: list[str] = []
        if self.schema != SCHEMA:
            errors.append(f"schema: expected {SCHEMA}, got {self.schema}")
        if not self.vertical_id.strip():
            errors.append("vertical_id is required")
        if not re.fullmatch(r"[a-z0-9][a-z0-9_-]*", self.vertical_id):
            errors.append("vertical_id must be a lowercase stable identifier")
        if not re.fullmatch(r"[^/]+/[^/]+", self.repository):
            errors.append("repository must be owner/name")
        if not self.domains:
            errors.append("domains must not be empty")
        if len(set(self.domains)) != len(self.domains):
            errors.append("domains must be unique")
        if len(set(self.runtime_routes)) != len(self.runtime_routes):
            errors.append("runtime_routes must be unique")
        if not self.runtime_routes:
            errors.append("runtime_routes must not be empty")
        for route in self.runtime_routes:
            if not route.startswith("/"):
                errors.append(f"runtime route must start with '/': {route}")

        source_ids: set[str] = set()
        for source in self.data_sources:
            if source.id in source_ids:
                errors.append(f"data_sources: duplicate id {source.id}")
            source_ids.add(source.id)
            errors.extend(source.errors(now=now))
        if not self.data_sources:
            errors.append("data_sources must not be empty")

        formula_names: set[str] = set()
        for formula in self.formulas:
            if formula.name in formula_names:
                errors.append(f"formulas: duplicate name {formula.name}")
            formula_names.add(formula.name)
            errors.extend(formula.errors())
        if not self.formulas:
            errors.append("formulas must not be empty")

        errors.extend(self.second_brain.errors())
        errors.extend(self.anatomy.errors())
        errors.extend(self.deployment.errors())

        if not self.requires_human_approval:
            errors.append("governance: public vertical recommendations require human approval")
        if not self.rollback_path:
            errors.append("governance: rollback_path is required")
        if self.automation_authority != "NONE":
            errors.append("governance: public runtime automation_authority must be NONE")
        if self.evidence_digest and not HEX64.fullmatch(self.evidence_digest):
            errors.append("evidence_digest must be a lowercase SHA-256 hex digest")
        if self.receipt_state not in {"UNAVAILABLE", "HASHED_NOT_SIGNED", "DSSE_SIGNED"}:
            errors.append("receipt_state must be UNAVAILABLE, HASHED_NOT_SIGNED, or DSSE_SIGNED")
        return errors

    def readiness(self, *, now: datetime | None = None) -> dict[str, Any]:
        errors = self.errors(now=now)
        current = [source for source in self.data_sources if source.has_current_evidence]
        sample = [
            source
            for source in self.data_sources
            if source.state in {EvidenceState.SAMPLE, EvidenceState.HISTORICAL_SAMPLE}
        ]
        blockers: list[str] = list(errors)

        if errors:
            state = ReadinessState.INVALID
        elif not current:
            state = ReadinessState.SAMPLE_ONLY if sample else ReadinessState.UNAVAILABLE
            blockers.append("no current sourced observation is attached")
        elif not self.deployment.verified:
            state = ReadinessState.IMPLEMENTED_UNVERIFIED
            blockers.append("exact-source deployment receipt and live route probes are incomplete")
        elif self.second_brain.state is EvidenceState.UNAVAILABLE or self.anatomy.degraded:
            state = ReadinessState.DEPLOYED_DEGRADED
            if self.second_brain.state is EvidenceState.UNAVAILABLE:
                blockers.append("Second Brain is unavailable")
            if self.anatomy.degraded:
                blockers.append("one or more mandatory Anatomy organs are degraded")
        else:
            state = ReadinessState.OPERATIONAL

        return {
            "schema": self.schema,
            "vertical_id": self.vertical_id,
            "state": state.value,
            "operational": state is ReadinessState.OPERATIONAL,
            "implementation_state": self.implementation_state,
            "current_source_ids": [source.id for source in current],
            "sample_source_ids": [source.id for source in sample],
            "blockers": _dedupe(blockers),
            "deployment_verified": self.deployment.verified,
            "human_lock": self.requires_human_approval,
            "automation_authority": self.automation_authority,
        }

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        return _enum_values(payload)


def validate_manifest(
    manifest: VerticalOperationalManifest,
    *,
    require_operational: bool = False,
    now: datetime | None = None,
) -> list[str]:
    errors = manifest.errors(now=now)
    readiness = manifest.readiness(now=now)
    if require_operational and not readiness["operational"]:
        errors.append(f"readiness: expected OPERATIONAL, got {readiness['state']}")
        errors.extend(f"readiness: {item}" for item in readiness["blockers"])
    return _dedupe(errors)


def manifest_from_dict(payload: Mapping[str, Any]) -> VerticalOperationalManifest:
    data_sources = tuple(
        DataSourceBinding(
            **{
                **dict(item),
                "state": EvidenceState(str(item["state"])),
            }
        )
        for item in payload.get("data_sources", ())
    )
    formulas = tuple(
        FormulaBinding(
            **{
                **dict(item),
                "proof_state": FormulaProofState(str(item["proof_state"])),
            }
        )
        for item in payload.get("formulas", ())
    )
    brain_payload = dict(payload.get("second_brain", {}))
    brain_payload["state"] = EvidenceState(str(brain_payload["state"]))
    second_brain = SecondBrainBinding(**brain_payload)
    anatomy_payload = payload.get("anatomy", {})
    anatomy = AnatomyBinding(
        organs=tuple(
            AnatomyOrganBinding(**dict(item))
            for item in anatomy_payload.get("organs", ())
        )
    )
    deployment_payload = dict(payload.get("deployment", {}))
    deployment_payload["probed_routes"] = tuple(
        deployment_payload.get("probed_routes", ())
    )
    deployment = DeploymentEvidence(**deployment_payload)
    return VerticalOperationalManifest(
        vertical_id=str(payload["vertical_id"]),
        title=str(payload["title"]),
        repository=str(payload["repository"]),
        domains=tuple(payload.get("domains", ())),
        runtime_routes=tuple(payload.get("runtime_routes", ())),
        data_sources=data_sources,
        formulas=formulas,
        second_brain=second_brain,
        anatomy=anatomy,
        requires_human_approval=bool(payload.get("requires_human_approval")),
        rollback_path=payload.get("rollback_path"),
        automation_authority=str(payload.get("automation_authority", "NONE")),
        evidence_digest=payload.get("evidence_digest"),
        receipt_state=str(payload.get("receipt_state", "UNAVAILABLE")),
        deployment=deployment,
        legacy_ids=tuple(payload.get("legacy_ids", ())),
        implementation_state=str(payload.get("implementation_state", "UNVERIFIED")),
        notes=payload.get("notes"),
        schema=str(payload.get("schema", SCHEMA)),
    )


def audit_manifests(
    manifests: Iterable[VerticalOperationalManifest],
    *,
    require_operational: bool = False,
    now: datetime | None = None,
) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    seen: set[str] = set()
    failures = 0
    for manifest in manifests:
        errors = validate_manifest(
            manifest,
            require_operational=require_operational,
            now=now,
        )
        if manifest.vertical_id in seen:
            errors.append(f"duplicate vertical_id: {manifest.vertical_id}")
        seen.add(manifest.vertical_id)
        readiness = manifest.readiness(now=now)
        if errors:
            failures += 1
        rows.append(
            {
                "vertical_id": manifest.vertical_id,
                "readiness": readiness,
                "errors": _dedupe(errors),
            }
        )
    return {
        "schema": "szl.vertical-operational-audit/v1",
        "generated_at": (now or datetime.now(timezone.utc)).isoformat(),
        "require_operational": require_operational,
        "vertical_count": len(rows),
        "failure_count": failures,
        "ok": failures == 0,
        "verticals": rows,
    }


def _is_https(value: str | None) -> bool:
    if not value:
        return False
    parsed = urlparse(value)
    return parsed.scheme == "https" and bool(parsed.netloc)


def _parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _dedupe(values: Sequence[str]) -> list[str]:
    return list(dict.fromkeys(value for value in values if value))


def _enum_values(value: Any) -> Any:
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, dict):
        return {key: _enum_values(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_enum_values(item) for item in value]
    return value


__all__ = [
    "AnatomyBinding",
    "AnatomyOrganBinding",
    "DataSourceBinding",
    "DeploymentEvidence",
    "EvidenceState",
    "FormulaBinding",
    "FormulaProofState",
    "MANDATORY_ANATOMY_ORGANS",
    "ReadinessState",
    "SCHEMA",
    "SecondBrainBinding",
    "VerticalOperationalManifest",
    "audit_manifests",
    "manifest_from_dict",
    "validate_manifest",
]
