"""Local source-structure gate for declared vertical release records.

Operational evidence is intentionally not admitted here: this package has no
independent trust root, receipt bytes, signer authorization, or witness channel.
"""

from __future__ import annotations

from copy import deepcopy
import re
from datetime import datetime
from typing import Any, Mapping

from .canonical import digest_value


RELEASE_SCHEMA = "szl.vertical-space-release/v2"
COMPILED_RELEASE_PLAN_SCHEMA = "szl.vertical-space-release-plan/v1"
COMPILED_RELEASE_PLAN_KEYS = {
    "admission_gates",
    "captured_at",
    "evidence_status",
    "hf_space_id",
    "planned_visibility",
    "production_status",
    "provider_mutation_permitted",
    "public_launch_policy",
    "schema",
    "source_manifest_sha256",
    "vertical_id",
}
COMPILED_RELEASE_ADMISSION_GATES = (
    "exact source revision",
    "signed vertical manifest",
    "immutable image digest",
    "policy, model, data, and evaluation revisions",
    "negative-test evidence",
    "durability and restart evidence",
    "rollback and incident evidence",
    "provider and runtime readback",
    "authorized human approval",
    "independent runtime witness where required",
)
RELEASE_STATES = {
    "BLOCKED",
    "PILOT_READY",
    "PRODUCTION_READY",
    "PROTECTED_CANDIDATE",
    "PUBLIC_DEMO",
    "ROLLED_BACK",
    "SOURCE_ONLY",
}
ALLOWED_KEYS = {
    "data_revisions",
    "evaluation_revision",
    "image_digest",
    "manifest_digest",
    "model_revisions",
    "observed_at",
    "policy_revision",
    "production_status",
    "release_evidence",
    "runtime_readback",
    "schema",
    "source_repository",
    "source_revision",
    "space_id",
    "vertical_id",
    "visibility",
}
REQUIRED_KEYS = ALLOWED_KEYS
HEX_64 = re.compile(r"^[0-9a-f]{64}$")
SOURCE_REVISION = re.compile(r"^[0-9a-f]{40}$")
VERTICAL_ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
SPACE_ID = re.compile(r"^SZLHOLDINGS/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$")
SOURCE_REPOSITORY = re.compile(r"^https://github\.com/szl-holdings/[A-Za-z0-9._-]+$")
IMMUTABLE_REVISION = re.compile(r"^[0-9a-f]{40}(?:[0-9a-f]{24})?$")
EVIDENCE_KEYS = {
    "access_control_verified",
    "authorization_verified",
    "backup_verified",
    "negative_tests_passed",
    "physical_effectors_absent",
    "receipt_signature_verified",
    "receipts",
    "restart_recovery_verified",
    "rollback_verified",
    "tests_passed",
    "witness",
    "witness_verified",
}
RUNTIME_KEYS = {
    "durability_state",
    "health_status",
    "identity_converged",
    "image_digest",
    "manifest_digest",
    "provider_revision",
    "readiness_status",
    "source_revision",
    "stable_observations",
}
OBSERVATION_KEYS = {
    "image_digest",
    "manifest_digest",
    "observed_at",
    "provider_revision",
    "receipt_digest",
    "source_revision",
}
EVIDENCE_BOOLEAN_KEYS = EVIDENCE_KEYS - {"receipts", "witness"}
DURABILITY_STATES = {"DURABLE", "DURABLE_LOCAL", "UNAVAILABLE"}
HEALTH_STATES = {"HEALTHY", "UNHEALTHY", "UNAVAILABLE"}
READINESS_STATES = {"READY", "NOT_READY", "UNAVAILABLE"}


def _issue(code: str, message: str, field: str) -> dict[str, str]:
    return {"code": code, "field": field, "message": message}


def _https_github_repository(value: Any) -> bool:
    return isinstance(value, str) and bool(SOURCE_REPOSITORY.fullmatch(value))


def _utc_timestamp(value: Any) -> bool:
    if not isinstance(value, str) or not value.endswith("Z") or "T" not in value:
        return False
    try:
        datetime.fromisoformat(value.removesuffix("Z") + "+00:00")
    except ValueError:
        return False
    return True


def _aware_timestamp(value: Any) -> bool:
    if not isinstance(value, str) or "T" not in value:
        return False
    normalized = value.removesuffix("Z") + "+00:00" if value.endswith("Z") else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return False
    return parsed.tzinfo is not None and parsed.utcoffset() is not None


def _sha256_digest(value: Any) -> bool:
    return isinstance(value, str) and bool(re.fullmatch(r"sha256:[0-9a-f]{64}", value))


def _plain_digest(value: Any) -> bool:
    return isinstance(value, str) and bool(HEX_64.fullmatch(value))


def _validate_evidence_shape(evidence: Mapping[str, Any]) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    extras = set(evidence) - EVIDENCE_KEYS
    if extras:
        findings.append(
            _issue(
                "UNKNOWN_FIELD",
                f"unknown fields: {sorted(extras)}",
                "release_evidence",
            )
        )
    for key in sorted(EVIDENCE_BOOLEAN_KEYS & set(evidence)):
        if type(evidence[key]) is not bool:
            findings.append(
                _issue("TYPE", "must be a boolean", f"release_evidence.{key}")
            )
    receipts = evidence.get("receipts")
    if receipts is not None:
        if not isinstance(receipts, Mapping):
            findings.append(
                _issue("TYPE", "must be an object", "release_evidence.receipts")
            )
        else:
            for name, receipt_digest in receipts.items():
                if not re.fullmatch(
                    r"^[a-z][a-z0-9_]*$", str(name)
                ) or not _sha256_digest(receipt_digest):
                    findings.append(
                        _issue(
                            "EVIDENCE_RECEIPT",
                            "receipt names and content digests are malformed",
                            f"release_evidence.receipts.{name}",
                        )
                    )
    witness = evidence.get("witness")
    if witness is not None and (
        not isinstance(witness, Mapping)
        or set(witness) != {"digest"}
        or not _sha256_digest(witness.get("digest"))
    ):
        findings.append(
            _issue(
                "WITNESS",
                "must contain exactly one sha256 digest",
                "release_evidence.witness",
            )
        )
    return findings


def _validate_runtime_shape(runtime: Mapping[str, Any]) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    extras = set(runtime) - RUNTIME_KEYS
    if extras:
        findings.append(
            _issue(
                "UNKNOWN_FIELD",
                f"unknown fields: {sorted(extras)}",
                "runtime_readback",
            )
        )
    enum_fields = {
        "durability_state": DURABILITY_STATES,
        "health_status": HEALTH_STATES,
        "readiness_status": READINESS_STATES,
    }
    for key, allowed in enum_fields.items():
        if key in runtime and runtime[key] not in allowed:
            findings.append(
                _issue(
                    "ENUM",
                    f"must be one of {sorted(allowed)}",
                    f"runtime_readback.{key}",
                )
            )
    if (
        "identity_converged" in runtime
        and type(runtime["identity_converged"]) is not bool
    ):
        findings.append(
            _issue("TYPE", "must be a boolean", "runtime_readback.identity_converged")
        )
    digest_fields = {
        "image_digest": _sha256_digest,
        "manifest_digest": _plain_digest,
        "provider_revision": lambda value: (
            isinstance(value, str) and bool(IMMUTABLE_REVISION.fullmatch(value))
        ),
        "source_revision": lambda value: (
            isinstance(value, str) and bool(SOURCE_REVISION.fullmatch(value))
        ),
    }
    for key, validator in digest_fields.items():
        if key in runtime and not validator(runtime[key]):
            findings.append(
                _issue(
                    "FORMAT",
                    "has an invalid immutable identity",
                    f"runtime_readback.{key}",
                )
            )
    observations = runtime.get("stable_observations")
    if observations is not None:
        if not isinstance(observations, list):
            findings.append(
                _issue(
                    "TYPE", "must be an array", "runtime_readback.stable_observations"
                )
            )
        else:
            seen: set[str] = set()
            for index, observation in enumerate(observations):
                field = f"runtime_readback.stable_observations[{index}]"
                if not isinstance(observation, Mapping):
                    findings.append(_issue("TYPE", "must be an object", field))
                    continue
                if set(observation) != OBSERVATION_KEYS:
                    findings.append(
                        _issue(
                            "REQUIRED",
                            "must contain exactly the v2 observation identity fields",
                            field,
                        )
                    )
                checks = {
                    "image_digest": _sha256_digest(observation.get("image_digest")),
                    "manifest_digest": _plain_digest(
                        observation.get("manifest_digest")
                    ),
                    "observed_at": _utc_timestamp(observation.get("observed_at")),
                    "provider_revision": isinstance(
                        observation.get("provider_revision"), str
                    )
                    and bool(
                        IMMUTABLE_REVISION.fullmatch(
                            str(observation.get("provider_revision"))
                        )
                    ),
                    "receipt_digest": _sha256_digest(observation.get("receipt_digest")),
                    "source_revision": isinstance(
                        observation.get("source_revision"), str
                    )
                    and bool(
                        SOURCE_REVISION.fullmatch(
                            str(observation.get("source_revision"))
                        )
                    ),
                }
                for key, valid in checks.items():
                    if not valid:
                        findings.append(
                            _issue(
                                "FORMAT", "has an invalid v2 value", f"{field}.{key}"
                            )
                        )
                observation_digest = digest_value(dict(observation))
                if observation_digest in seen:
                    findings.append(_issue("DUPLICATE", "must be unique", field))
                seen.add(observation_digest)
    return findings


def _revision_items(
    value: Any, field: str, *, require_rights: bool
) -> list[dict[str, str]]:
    findings: list[dict[str, str]] = []
    if not isinstance(value, list):
        return [_issue("TYPE", "must be an array", field)]
    seen: set[str] = set()
    for index, item in enumerate(value):
        location = f"{field}[{index}]"
        if not isinstance(item, Mapping):
            findings.append(_issue("TYPE", "must be an object", location))
            continue
        allowed = {"digest", "id", "revision"}
        if require_rights:
            allowed.add("rights_status")
        extras = set(item) - allowed
        if extras:
            findings.append(
                _issue("UNKNOWN_FIELD", f"unknown fields: {sorted(extras)}", location)
            )
        identifier = item.get("id")
        if not isinstance(identifier, str) or not identifier.strip():
            findings.append(_issue("REQUIRED", "id is required", f"{location}.id"))
        elif identifier in seen:
            findings.append(_issue("DUPLICATE", "id must be unique", f"{location}.id"))
        else:
            seen.add(identifier)
        if (
            not isinstance(item.get("revision"), str)
            or not str(item.get("revision", "")).strip()
        ):
            findings.append(
                _issue("REQUIRED", "revision is required", f"{location}.revision")
            )
        elif not IMMUTABLE_REVISION.fullmatch(str(item["revision"])):
            findings.append(
                _issue(
                    "IMMUTABLE_REVISION",
                    "revision must be an exact 40- or 64-character lowercase hexadecimal ID",
                    f"{location}.revision",
                )
            )
        digest = item.get("digest")
        if not isinstance(digest, str) or not re.fullmatch(
            r"sha256:[0-9a-f]{64}", digest
        ):
            findings.append(
                _issue("DIGEST", "digest must be sha256:<64 lowercase hex>", location)
            )
        if require_rights and item.get("rights_status") not in {
            "APPROVED",
            "NOT_APPLICABLE",
        }:
            findings.append(
                _issue(
                    "DATA_RIGHTS",
                    "rights_status must be APPROVED or NOT_APPLICABLE",
                    location,
                )
            )
    return findings


def validate_compiled_release_plan(
    plan: Mapping[str, Any],
    *,
    cell: Mapping[str, Any],
    source_manifest_sha256: str,
    captured_at: str | None = None,
) -> dict[str, Any]:
    """Validate a compiler v1 plan without admitting an operational release."""

    findings: list[dict[str, str]] = []
    if not isinstance(plan, Mapping):
        findings.append(_issue("TYPE", "release plan must be an object", "$"))
        return _compiled_plan_report({}, findings)

    missing = COMPILED_RELEASE_PLAN_KEYS - set(plan)
    extras = set(plan) - COMPILED_RELEASE_PLAN_KEYS
    for key in sorted(missing):
        findings.append(_issue("REQUIRED", "required field is missing", key))
    for key in sorted(extras):
        findings.append(_issue("UNKNOWN_FIELD", "field is not admitted", key))

    if plan.get("schema") != COMPILED_RELEASE_PLAN_SCHEMA:
        findings.append(
            _issue(
                "SCHEMA",
                f"must equal {COMPILED_RELEASE_PLAN_SCHEMA}",
                "schema",
            )
        )
    if not _aware_timestamp(plan.get("captured_at")):
        findings.append(
            _issue(
                "TIMESTAMP",
                "captured_at must be an ISO-8601 timestamp with an explicit offset",
                "captured_at",
            )
        )
    if captured_at is not None and plan.get("captured_at") != captured_at:
        findings.append(
            _issue(
                "IDENTITY",
                "captured_at does not match the compiled catalog",
                "captured_at",
            )
        )
    if plan.get("evidence_status") != "MODELED":
        findings.append(
            _issue("EVIDENCE_STATE", "must equal MODELED", "evidence_status")
        )

    expected_identity = {
        "hf_space_id": cell.get("hf_space_id"),
        "planned_visibility": cell.get("space_visibility"),
        "public_launch_policy": cell.get("public_launch"),
        "vertical_id": cell.get("vertical_id"),
    }
    for field, expected in expected_identity.items():
        if plan.get(field) != expected:
            findings.append(
                _issue(
                    "IDENTITY",
                    f"does not match compiled cell value {expected!r}",
                    field,
                )
            )

    plan_source_digest = plan.get("source_manifest_sha256")
    if not isinstance(plan_source_digest, str) or not HEX_64.fullmatch(
        plan_source_digest
    ):
        findings.append(
            _issue(
                "DIGEST",
                "must be 64 lowercase hexadecimal characters",
                "source_manifest_sha256",
            )
        )
    if plan_source_digest != source_manifest_sha256:
        findings.append(
            _issue(
                "IDENTITY",
                "does not match the compiled source manifest digest",
                "source_manifest_sha256",
            )
        )
    if plan.get("production_status") != "SOURCE_ONLY":
        findings.append(
            _issue(
                "RELEASE_STATE",
                "compiled plans must remain SOURCE_ONLY",
                "production_status",
            )
        )
    if plan.get("provider_mutation_permitted") is not False:
        findings.append(
            _issue(
                "PROVIDER_MUTATION",
                "compiled plans must prohibit provider mutation",
                "provider_mutation_permitted",
            )
        )
    if plan.get("admission_gates") != list(COMPILED_RELEASE_ADMISSION_GATES):
        findings.append(
            _issue(
                "ADMISSION_GATES",
                "must exactly equal the ordered Packet 6 admission gates",
                "admission_gates",
            )
        )
    return _compiled_plan_report(plan, findings)


def _compiled_plan_report(
    plan: Mapping[str, Any], findings: list[dict[str, str]]
) -> dict[str, Any]:
    admissible = not findings and plan.get("production_status") == "SOURCE_ONLY"
    return {
        "admission_scope": "LOCAL_SOURCE_PLAN_ONLY",
        "admissible": admissible,
        "claimed_status": plan.get("production_status", "UNKNOWN"),
        "evidence_verification": "NOT_PERFORMED",
        "findings": findings,
        "operational_claim_verified": False,
        "plan_digest": digest_value(dict(plan)) if plan else None,
        "provider_mutation_permitted": False,
        "schema": "szl.vertical-release-plan-gate-result/v1",
        "status": "PASS" if admissible else "BLOCKED",
    }


def validate_release(
    manifest: Mapping[str, Any],
    *,
    cell: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Validate v2 structure while refusing to attest operational readiness."""

    findings: list[dict[str, str]] = []
    if not isinstance(manifest, Mapping):
        findings.append(_issue("TYPE", "release must be an object", "$"))
        return _report({}, findings)

    missing = REQUIRED_KEYS - set(manifest)
    extras = set(manifest) - ALLOWED_KEYS
    for key in sorted(missing):
        findings.append(_issue("REQUIRED", "required field is missing", key))
    for key in sorted(extras):
        findings.append(_issue("UNKNOWN_FIELD", "field is not admitted", key))

    if manifest.get("schema") != RELEASE_SCHEMA:
        findings.append(_issue("SCHEMA", f"must equal {RELEASE_SCHEMA}", "schema"))
    if not _utc_timestamp(manifest.get("observed_at")):
        findings.append(
            _issue(
                "TIMESTAMP",
                "observed_at must be an ISO-8601 UTC timestamp ending Z",
                "observed_at",
            )
        )
    vertical_id = manifest.get("vertical_id")
    if not isinstance(vertical_id, str) or not VERTICAL_ID.fullmatch(vertical_id):
        findings.append(_issue("FORMAT", "invalid vertical_id", "vertical_id"))
    if cell is not None and vertical_id != cell.get("vertical_id"):
        findings.append(
            _issue(
                "IDENTITY", "vertical_id does not match compiled cell", "vertical_id"
            )
        )
    if not _https_github_repository(manifest.get("source_repository")):
        findings.append(
            _issue(
                "SOURCE_REPOSITORY",
                "must be an exact https://github.com/szl-holdings/<repo> URL",
                "source_repository",
            )
        )
    source_revision = manifest.get("source_revision")
    if (
        not isinstance(source_revision, str)
        or not SOURCE_REVISION.fullmatch(source_revision)
        or source_revision == "0" * 40
    ):
        findings.append(
            _issue(
                "SOURCE_REVISION",
                "must be a nonzero 40-hex Git revision",
                "source_revision",
            )
        )
    space_id = manifest.get("space_id")
    if not isinstance(space_id, str) or not SPACE_ID.fullmatch(space_id):
        findings.append(_issue("FORMAT", "invalid SZLHOLDINGS Space ID", "space_id"))
    if cell is not None and space_id != cell.get("hf_space_id"):
        findings.append(_issue("IDENTITY", "space_id does not match cell", "space_id"))
    visibility = manifest.get("visibility")
    if visibility not in {"private", "protected", "public"}:
        findings.append(_issue("ENUM", "invalid visibility", "visibility"))
    if cell is not None and visibility != cell.get("space_visibility"):
        findings.append(
            _issue("IDENTITY", "visibility does not match cell", "visibility")
        )

    image_digest = manifest.get("image_digest")
    if not isinstance(image_digest, str) or not re.fullmatch(
        r"sha256:[0-9a-f]{64}", image_digest
    ):
        findings.append(
            _issue("DIGEST", "must be sha256:<64 lowercase hex>", "image_digest")
        )
    for field in ("manifest_digest", "policy_revision", "evaluation_revision"):
        value = manifest.get(field)
        if not isinstance(value, str) or not HEX_64.fullmatch(value):
            findings.append(_issue("DIGEST", "must be 64 lowercase hex", field))
    if cell is not None and isinstance(manifest.get("manifest_digest"), str):
        if manifest["manifest_digest"] != digest_value(dict(cell)):
            findings.append(
                _issue(
                    "MANIFEST_DIGEST",
                    "does not match canonical cell",
                    "manifest_digest",
                )
            )

    findings.extend(
        _revision_items(
            manifest.get("data_revisions"), "data_revisions", require_rights=True
        )
    )
    findings.extend(
        _revision_items(
            manifest.get("model_revisions"), "model_revisions", require_rights=False
        )
    )

    production_status = manifest.get("production_status")
    if production_status not in RELEASE_STATES:
        findings.append(
            _issue("ENUM", "invalid production_status", "production_status")
        )
        production_status = "BLOCKED"
    runtime = manifest.get("runtime_readback")
    evidence = manifest.get("release_evidence")
    if not isinstance(runtime, Mapping):
        findings.append(_issue("TYPE", "must be an object", "runtime_readback"))
        runtime = {}
    else:
        findings.extend(_validate_runtime_shape(runtime))
    if not isinstance(evidence, Mapping):
        findings.append(_issue("TYPE", "must be an object", "release_evidence"))
        evidence = {}
    else:
        findings.extend(_validate_evidence_shape(evidence))
    evidence_receipts = evidence.get("receipts")
    if not isinstance(evidence_receipts, Mapping):
        evidence_receipts = {}

    def require_receipt(name: str, field: str) -> None:
        value = evidence_receipts.get(name)
        if not isinstance(value, str) or not re.fullmatch(
            r"sha256:[0-9a-f]{64}", value
        ):
            findings.append(
                _issue(
                    "EVIDENCE_RECEIPT",
                    f"content-addressed receipt {name!r} is required",
                    field,
                )
            )

    if production_status in {
        "PILOT_READY",
        "PRODUCTION_READY",
        "PROTECTED_CANDIDATE",
        "PUBLIC_DEMO",
    }:
        for key in ("tests_passed", "negative_tests_passed"):
            if evidence.get(key) is not True:
                findings.append(
                    _issue(
                        "RELEASE_EVIDENCE", "must be true", f"release_evidence.{key}"
                    )
                )
            require_receipt(key, f"release_evidence.receipts.{key}")

    if production_status in {"PILOT_READY", "PRODUCTION_READY", "PUBLIC_DEMO"}:
        expected_runtime = {
            "health_status": "HEALTHY",
            "identity_converged": True,
            "image_digest": image_digest,
            "manifest_digest": manifest.get("manifest_digest"),
            "readiness_status": "READY",
            "source_revision": source_revision,
        }
        for key, expected in expected_runtime.items():
            if runtime.get(key) != expected:
                findings.append(
                    _issue(
                        "RUNTIME_READBACK",
                        f"must equal {expected!r}",
                        f"runtime_readback.{key}",
                    )
                )
        if not str(runtime.get("provider_revision", "")).strip():
            findings.append(
                _issue(
                    "RUNTIME_READBACK",
                    "provider_revision is required",
                    "runtime_readback",
                )
            )
        elif not IMMUTABLE_REVISION.fullmatch(str(runtime["provider_revision"])):
            findings.append(
                _issue(
                    "IMMUTABLE_REVISION",
                    "provider_revision must be an exact immutable revision",
                    "runtime_readback.provider_revision",
                )
            )

    if production_status in {"PILOT_READY", "PRODUCTION_READY"}:
        for key in (
            "access_control_verified",
            "backup_verified",
            "restart_recovery_verified",
            "rollback_verified",
        ):
            if evidence.get(key) is not True:
                findings.append(
                    _issue("PILOT_EVIDENCE", "must be true", f"release_evidence.{key}")
                )
            require_receipt(key, f"release_evidence.receipts.{key}")
        if runtime.get("durability_state") != "DURABLE":
            findings.append(
                _issue(
                    "DURABILITY",
                    "must equal DURABLE",
                    "runtime_readback.durability_state",
                )
            )

    if production_status == "PUBLIC_DEMO":
        if visibility != "public":
            findings.append(
                _issue("VISIBILITY", "PUBLIC_DEMO must be public", "visibility")
            )
        if (
            vertical_id == "killinchu"
            and evidence.get("physical_effectors_absent") is not True
        ):
            findings.append(
                _issue(
                    "EFFECTOR_BOUNDARY",
                    "Killinchu requires verified absence of physical effectors",
                    "release_evidence.physical_effectors_absent",
                )
            )
        if vertical_id == "killinchu":
            require_receipt(
                "physical_effectors_absent",
                "release_evidence.receipts.physical_effectors_absent",
            )

    if production_status == "PRODUCTION_READY":
        for key in (
            "authorization_verified",
            "receipt_signature_verified",
            "witness_verified",
        ):
            if evidence.get(key) is not True:
                findings.append(
                    _issue(
                        "PRODUCTION_EVIDENCE", "must be true", f"release_evidence.{key}"
                    )
                )
            require_receipt(key, f"release_evidence.receipts.{key}")
        observations = runtime.get("stable_observations")
        if not isinstance(observations, list) or len(observations) < 2:
            findings.append(
                _issue(
                    "STABLE_OBSERVATIONS",
                    "at least two immutable runtime observations are required",
                    "runtime_readback.stable_observations",
                )
            )
        else:
            expected = (
                runtime.get("provider_revision"),
                source_revision,
                manifest.get("manifest_digest"),
                image_digest,
            )
            observation_receipts: set[str] = set()
            observation_times: set[str] = set()
            for index, observation in enumerate(observations):
                actual = (
                    observation.get("provider_revision")
                    if isinstance(observation, Mapping)
                    else None,
                    observation.get("source_revision")
                    if isinstance(observation, Mapping)
                    else None,
                    observation.get("manifest_digest")
                    if isinstance(observation, Mapping)
                    else None,
                    observation.get("image_digest")
                    if isinstance(observation, Mapping)
                    else None,
                )
                if actual != expected:
                    findings.append(
                        _issue(
                            "STABLE_OBSERVATIONS",
                            "observation identity does not match release",
                            f"runtime_readback.stable_observations[{index}]",
                        )
                    )
                if not isinstance(observation, Mapping):
                    continue
                if set(observation) != OBSERVATION_KEYS:
                    findings.append(
                        _issue(
                            "UNKNOWN_FIELD",
                            "stable observation must contain exactly the v2 identity fields",
                            f"runtime_readback.stable_observations[{index}]",
                        )
                    )
                observed_at = observation.get("observed_at")
                if not _utc_timestamp(observed_at):
                    findings.append(
                        _issue(
                            "STABLE_OBSERVATIONS",
                            "observation requires an ISO-8601 UTC observed_at",
                            f"runtime_readback.stable_observations[{index}].observed_at",
                        )
                    )
                elif str(observed_at) in observation_times:
                    findings.append(
                        _issue(
                            "STABLE_OBSERVATIONS",
                            "observation timestamps must be distinct",
                            f"runtime_readback.stable_observations[{index}].observed_at",
                        )
                    )
                else:
                    observation_times.add(str(observed_at))
                receipt_digest = observation.get("receipt_digest")
                if not isinstance(receipt_digest, str) or not re.fullmatch(
                    r"sha256:[0-9a-f]{64}", receipt_digest
                ):
                    findings.append(
                        _issue(
                            "STABLE_OBSERVATIONS",
                            "observation requires a content-addressed receipt_digest",
                            f"runtime_readback.stable_observations[{index}].receipt_digest",
                        )
                    )
                elif receipt_digest in observation_receipts:
                    findings.append(
                        _issue(
                            "STABLE_OBSERVATIONS",
                            "observation receipt digests must be distinct",
                            f"runtime_readback.stable_observations[{index}].receipt_digest",
                        )
                    )
                else:
                    observation_receipts.add(receipt_digest)
        witness = evidence.get("witness")
        if (
            not isinstance(witness, Mapping)
            or set(witness) != {"digest"}
            or not re.fullmatch(r"sha256:[0-9a-f]{64}", str(witness.get("digest", "")))
        ):
            findings.append(
                _issue(
                    "WITNESS",
                    "a content-addressed verifier witness is required",
                    "release_evidence.witness",
                )
            )

    if production_status not in {"SOURCE_ONLY", "BLOCKED"}:
        findings.append(
            _issue(
                "EXTERNAL_VERIFIER_REQUIRED",
                "operational release claims require verified receipt bytes, authorized signer keys, and independent witness provenance outside this local package",
                "production_status",
            )
        )

    if production_status == "BLOCKED":
        findings.append(
            _issue(
                "DECLARED_BLOCKED", "release is explicitly blocked", "production_status"
            )
        )
    return _report(manifest, findings)


def build_source_only_release(
    plan: Mapping[str, Any],
    *,
    cell: Mapping[str, Any],
    source_manifest_sha256: str,
    source_repository: str,
    source_revision: str,
    image_digest: str,
    policy_revision: str,
    evaluation_revision: str,
    data_revisions: list[Mapping[str, Any]],
    model_revisions: list[Mapping[str, Any]],
    observed_at: str,
    captured_at: str | None = None,
) -> dict[str, Any]:
    """Build a v2 SOURCE_ONLY record from explicit caller-supplied identities."""

    plan_report = validate_compiled_release_plan(
        plan,
        cell=cell,
        source_manifest_sha256=source_manifest_sha256,
        captured_at=captured_at,
    )
    if plan_report["status"] != "PASS":
        summary = "; ".join(
            f"{finding['code']}:{finding['field']}"
            for finding in plan_report["findings"]
        )
        raise ValueError(f"compiled release plan is invalid: {summary}")

    release = {
        "data_revisions": deepcopy(data_revisions),
        "evaluation_revision": evaluation_revision,
        "image_digest": image_digest,
        "manifest_digest": digest_value(dict(cell)),
        "model_revisions": deepcopy(model_revisions),
        "observed_at": observed_at,
        "policy_revision": policy_revision,
        "production_status": "SOURCE_ONLY",
        "release_evidence": {},
        "runtime_readback": {},
        "schema": RELEASE_SCHEMA,
        "source_repository": source_repository,
        "source_revision": source_revision,
        "space_id": plan["hf_space_id"],
        "vertical_id": plan["vertical_id"],
        "visibility": plan["planned_visibility"],
    }
    release_report = validate_release(release, cell=cell)
    if release_report["status"] != "PASS":
        summary = "; ".join(
            f"{finding['code']}:{finding['field']}"
            for finding in release_report["findings"]
        )
        raise ValueError(f"source-only release inputs are invalid: {summary}")
    return release


def _report(
    manifest: Mapping[str, Any],
    findings: list[dict[str, str]],
) -> dict[str, Any]:
    admissible = not findings and manifest.get("production_status") == "SOURCE_ONLY"
    return {
        "admission_scope": "LOCAL_SOURCE_STRUCTURE_ONLY",
        "admissible": admissible,
        "claimed_status": manifest.get("production_status", "UNKNOWN"),
        "evidence_verification": "NOT_PERFORMED",
        "findings": findings,
        "manifest_digest": digest_value(dict(manifest)) if manifest else None,
        "operational_claim_verified": False,
        "schema": "szl.vertical-release-gate-result/v1",
        "status": "PASS" if admissible else "BLOCKED",
    }


def blocked_release_registry(cells: Mapping[str, Mapping[str, Any]]) -> dict[str, Any]:
    entries = []
    for vertical_id in sorted(cells):
        cell = cells[vertical_id]
        entries.append(
            {
                "blockers": [
                    "MISSING_EXACT_SOURCE_REVISION",
                    "MISSING_IMAGE_DIGEST",
                    "MISSING_PROVIDER_RUNTIME_READBACK",
                    "MISSING_DURABILITY_AND_ROLLBACK_EVIDENCE",
                ],
                "manifest_digest": digest_value(dict(cell)),
                "production_status": "BLOCKED",
                "space_id": cell.get("hf_space_id"),
                "vertical_id": vertical_id,
                "visibility": cell.get("space_visibility"),
            }
        )
    result = {"entries": entries, "schema": "szl.vertical-release-registry/v1"}
    result["registry_digest"] = digest_value(result)
    return result
