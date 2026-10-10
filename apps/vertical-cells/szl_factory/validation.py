"""Fail-closed semantic validation for Packet 6 vertical-factory profiles.

The portable JSON Schemas under ``apps/vertical-cells/schemas`` describe
individual records.  This module enforces the cross-record invariants that a
schema cannot express conveniently: the canonical seven-cell set, identifier
uniqueness, explicit formula-scope aliases, binding resolution, and the rule
that formulas never grant authority.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable, Mapping
from urllib.parse import urlsplit


PROFILE_SCHEMA = "szl.estate-vertical-factory-profile/v6"
CELL_SCHEMA = "szl.vertical-cell/v1"
EXPECTED_CELL_COUNT = 7

# Formula scope names in the Packet 6 registry intentionally use short domain
# names.  Keeping the mapping explicit prevents heuristic prefix matching from
# silently binding a formula to a future, similarly named vertical.
FORMULA_VERTICAL_ALIASES: dict[str, str] = {
    "aegis": "aegis-assurance",
    "counsel": "counsel-assurance",
    "insurance": "insurance-assurance",
    "killinchu": "killinchu",
    "lyte": "lyte-services",
    "terra": "terra-assurance",
    "vessels": "vessels-assurance",
}
EXPECTED_VERTICAL_IDS = frozenset(FORMULA_VERTICAL_ALIASES.values())

VERTICAL_ID_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
HF_SPACE_ID_RE = re.compile(r"^SZLHOLDINGS/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$")
FORMULA_ID_RE = re.compile(r"^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$")
SCOPE_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
FORMULA_PROOF_CLASSES = frozenset(
    {"LOCKED-PROVEN", "SEMANTIC-VERIFIED", "CONJECTURE/ADVISORY"}
)
LOCKED_FORMULA_IDS = frozenset({"F1", "F4", "F7", "F11", "F12", "F18", "F19", "F22"})
KILLINCHU_EFFECTOR_TERMS = (
    "autonomous interdiction",
    "engage target",
    "missile",
    "munition",
    "navigation control",
    "operational targeting",
    "physical effector",
    "target engagement",
    "weapon",
)
KILLINCHU_REQUIRED_BOUNDARY_TERMS = (
    "autonomous interdiction",
    "navigation control",
    "operational targeting",
    "physical effector",
    "target engagement",
    "weapon command",
)
KILLINCHU_ALLOWED_ACTIONS = frozenset(
    {
        "classify synthetic observation",
        "deny",
        "escalate",
        "recommend",
        "record human decision",
        "replay",
        "simulate",
    }
)

CELL_REQUIRED_FIELDS = (
    "schema",
    "vertical_id",
    "display_name",
    "portfolio_role",
    "stage",
    "space_visibility",
    "public_launch",
    "buyer",
    "decision_problem",
    "core_workflows",
    "leaders",
    "original_szl_design",
    "data_policy",
    "human_authority",
    "allowed_actions",
    "prohibited_actions",
    "formula_bindings",
    "success_metrics",
    "negative_tests",
    "hf_space_id",
)
CELL_STRING_FIELDS = (
    "schema",
    "vertical_id",
    "display_name",
    "portfolio_role",
    "stage",
    "space_visibility",
    "public_launch",
    "buyer",
    "decision_problem",
    "original_szl_design",
    "hf_space_id",
)
CELL_STRING_LIST_FIELDS = (
    "core_workflows",
    "human_authority",
    "allowed_actions",
    "prohibited_actions",
    "formula_bindings",
    "success_metrics",
    "negative_tests",
)
FORMULA_REQUIRED_FIELDS = (
    "formula_id",
    "name",
    "proof_class",
    "source_url",
    "allowed_runtime_binding",
    "prohibited_claim",
    "required_binding_evidence",
    "verticals",
    "grants_authority",
)
FORMULA_STRING_FIELDS = tuple(
    field for field in FORMULA_REQUIRED_FIELDS if field != "grants_authority"
)
DATA_POLICY_REQUIRED_FIELDS = ("public", "protected", "training_use")


class ValidationError(ValueError):
    """A fail-closed error retaining machine-consumable issue strings."""

    def __init__(self, issues: str | Iterable[str]) -> None:
        normalized = (issues,) if isinstance(issues, str) else tuple(map(str, issues))
        if not normalized:
            normalized = ("validation failed without a diagnostic",)
        self.issues = normalized
        super().__init__(
            "profile validation failed:\n"
            + "\n".join(f"- {issue}" for issue in normalized)
        )


def load_profile(path: str | Path) -> dict[str, Any]:
    """Load strict UTF-8 JSON, rejecting duplicate object keys."""

    profile_path = Path(path)
    try:
        raw = profile_path.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        raise ValidationError(
            f"profile: cannot read UTF-8 JSON from {profile_path}: {exc}"
        ) from exc

    def reject_duplicate_keys(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                raise ValidationError(
                    f"profile: duplicate JSON object key {key!r}; remove the duplicate"
                )
            result[key] = value
        return result

    try:
        parsed = json.loads(raw, object_pairs_hook=reject_duplicate_keys)
    except ValidationError:
        raise
    except json.JSONDecodeError as exc:
        raise ValidationError(
            f"profile: invalid JSON at line {exc.lineno}, column {exc.colno}: {exc.msg}"
        ) from exc
    if not isinstance(parsed, dict):
        raise ValidationError(
            f"profile: expected a JSON object, found {_type_name(parsed)}"
        )
    return parsed


def validate_profile(profile: object) -> list[str]:
    """Return deterministic semantic issues; an empty list is the only pass."""

    issues: list[str] = []
    if not isinstance(profile, dict):
        return [f"profile: expected object, found {_type_name(profile)}"]

    _validate_profile_identity(profile, issues)
    formula_map, formula_scopes = _validate_formulas(
        profile.get("formula_bindings"), issues
    )

    cells_value = profile.get("vertical_cells")
    cells = cells_value if isinstance(cells_value, list) else []
    if not isinstance(cells_value, list):
        issues.append(
            "vertical_cells: required nonempty array of exactly seven cell objects"
        )
    elif len(cells_value) != EXPECTED_CELL_COUNT:
        issues.append(
            f"vertical_cells: expected exactly {EXPECTED_CELL_COUNT} cells, found "
            f"{len(cells_value)}; add or remove manifests before compiling"
        )

    _validate_cells(cells, formula_map, formula_scopes, issues)
    _validate_declared_cell_count(profile.get("counts"), cells_value, issues)
    return issues


def _validate_profile_identity(profile: Mapping[str, Any], issues: list[str]) -> None:
    schema = profile.get("schema")
    if schema != PROFILE_SCHEMA:
        issues.append(
            f"schema: expected {PROFILE_SCHEMA!r}, found {schema!r}; use the Packet 6 profile schema"
        )

    captured_at = profile.get("captured_at")
    if not _is_nonempty_string(captured_at):
        issues.append(
            "captured_at: required nonempty ISO-8601 timestamp; it is the deterministic build time"
        )
        return
    try:
        parsed = datetime.fromisoformat(captured_at.replace("Z", "+00:00"))
    except ValueError:
        issues.append(f"captured_at: {captured_at!r} is not a valid ISO-8601 timestamp")
        return
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        issues.append(
            "captured_at: timezone offset is required for a stable, unambiguous build time"
        )


def _validate_formulas(
    value: object, issues: list[str]
) -> tuple[dict[str, Mapping[str, Any]], dict[str, tuple[str, ...]]]:
    formula_map: dict[str, Mapping[str, Any]] = {}
    formula_scopes: dict[str, tuple[str, ...]] = {}
    if not isinstance(value, list) or not value:
        issues.append(
            "formula_bindings: required nonempty array of formula contract objects"
        )
        return formula_map, formula_scopes

    seen_ids: dict[str, int] = {}
    allowed_fields = set(FORMULA_REQUIRED_FIELDS)
    for index, formula in enumerate(value):
        path = f"formula_bindings[{index}]"
        if not isinstance(formula, dict):
            issues.append(f"{path}: expected object, found {_type_name(formula)}")
            continue

        _require_fields(formula, FORMULA_REQUIRED_FIELDS, path, issues)
        unexpected = sorted(set(formula) - allowed_fields)
        if unexpected:
            issues.append(
                f"{path}: unexpected fields {unexpected!r}; formula contracts are strict"
            )
        for field in FORMULA_STRING_FIELDS:
            if field in formula and not _is_nonempty_string(formula[field]):
                issues.append(
                    f"{path}.{field}: required nonempty string, found {_type_name(formula[field])}"
                )

        formula_id = formula.get("formula_id")
        if _is_nonempty_string(formula_id):
            if not FORMULA_ID_RE.fullmatch(formula_id):
                issues.append(
                    f"{path}.formula_id: {formula_id!r} must match {FORMULA_ID_RE.pattern}"
                )
            if formula_id in seen_ids:
                issues.append(
                    f"{path}.formula_id: duplicate {formula_id!r}; first declared at "
                    f"formula_bindings[{seen_ids[formula_id]}].formula_id"
                )
            else:
                seen_ids[formula_id] = index
                formula_map[formula_id] = formula

        if formula.get("grants_authority") is not False:
            issues.append(
                f"{path}.grants_authority: must be boolean false; formulas are advisory and never grant authority"
            )

        proof_class = formula.get("proof_class")
        if (
            _is_nonempty_string(proof_class)
            and proof_class not in FORMULA_PROOF_CLASSES
        ):
            issues.append(
                f"{path}.proof_class: {proof_class!r} must be one of "
                f"{sorted(FORMULA_PROOF_CLASSES)!r}"
            )
        if _is_nonempty_string(formula_id):
            if formula_id in LOCKED_FORMULA_IDS and proof_class != "LOCKED-PROVEN":
                issues.append(
                    f"{path}.proof_class: locked formula {formula_id} must remain LOCKED-PROVEN"
                )
            elif (
                proof_class == "LOCKED-PROVEN" and formula_id not in LOCKED_FORMULA_IDS
            ):
                issues.append(
                    f"{path}.proof_class: {formula_id} is not in the exact eight locked formula IDs"
                )

        source_url = formula.get("source_url")
        if _is_nonempty_string(source_url) and not _is_https_url(source_url):
            issues.append(
                f"{path}.source_url: {source_url!r} must be an absolute https URL"
            )

        scopes = _parse_formula_scopes(formula.get("verticals"), path, issues)
        if _is_nonempty_string(formula_id) and formula_id not in formula_scopes:
            formula_scopes[formula_id] = scopes

    missing_locked = sorted(LOCKED_FORMULA_IDS - set(formula_map))
    if missing_locked:
        issues.append(
            f"formula_bindings: missing locked formula IDs {missing_locked!r}; all exact eight are required"
        )
    _validate_formula_scope_tokens(formula_scopes, issues)
    return formula_map, formula_scopes


def _parse_formula_scopes(
    value: object, path: str, issues: list[str]
) -> tuple[str, ...]:
    if not _is_nonempty_string(value):
        issues.append(
            f"{path}.verticals: required nonempty comma-separated scope string"
        )
        return ()
    tokens = tuple(token.strip() for token in value.split(","))
    if any(not token for token in tokens):
        issues.append(
            f"{path}.verticals: contains an empty scope token; remove extra commas"
        )
    nonempty = tuple(token for token in tokens if token)
    for duplicate in _duplicates(nonempty, casefold=True):
        issues.append(
            f"{path}.verticals: duplicate scope token {duplicate!r}; list each scope once"
        )
    for token in nonempty:
        if token != "all" and not SCOPE_RE.fullmatch(token):
            issues.append(
                f"{path}.verticals: scope {token!r} must be 'all' or match {SCOPE_RE.pattern}"
            )
    if "all" in nonempty and len(nonempty) != 1:
        issues.append(f"{path}.verticals: 'all' must be the only token when present")
    return nonempty


def _validate_formula_scope_tokens(
    formula_scopes: Mapping[str, tuple[str, ...]], issues: list[str]
) -> None:
    valid_tokens = set(FORMULA_VERTICAL_ALIASES) | EXPECTED_VERTICAL_IDS | {"all"}
    for formula_id, scopes in formula_scopes.items():
        for token in scopes:
            if token not in valid_tokens:
                issues.append(
                    f"formula {formula_id}.verticals: unknown vertical scope {token!r}; "
                    f"use one of {sorted(valid_tokens)!r}"
                )


def _validate_cells(
    cells: list[object],
    formula_map: Mapping[str, Mapping[str, Any]],
    formula_scopes: Mapping[str, tuple[str, ...]],
    issues: list[str],
) -> None:
    seen_vertical_ids: dict[str, int] = {}
    seen_hf_ids: dict[str, int] = {}
    seen_display_names: dict[str, int] = {}
    allowed_cell_fields = set(CELL_REQUIRED_FIELDS)

    for index, cell in enumerate(cells):
        path = f"vertical_cells[{index}]"
        if not isinstance(cell, dict):
            issues.append(f"{path}: expected object, found {_type_name(cell)}")
            continue

        _require_fields(cell, CELL_REQUIRED_FIELDS, path, issues)
        unexpected = sorted(set(cell) - allowed_cell_fields)
        if unexpected:
            issues.append(
                f"{path}: unexpected fields {unexpected!r}; vertical-cell manifests are strict"
            )
        for field in CELL_STRING_FIELDS:
            if field in cell and not _is_nonempty_string(cell[field]):
                issues.append(
                    f"{path}.{field}: required nonempty string, found {_type_name(cell[field])}"
                )

        if cell.get("schema") != CELL_SCHEMA:
            issues.append(
                f"{path}.schema: expected {CELL_SCHEMA!r}, found {cell.get('schema')!r}"
            )

        vertical_id = cell.get("vertical_id")
        if _is_nonempty_string(vertical_id):
            if not VERTICAL_ID_RE.fullmatch(vertical_id):
                issues.append(
                    f"{path}.vertical_id: {vertical_id!r} must match {VERTICAL_ID_RE.pattern}"
                )
            _record_unique(
                vertical_id,
                index,
                seen_vertical_ids,
                f"{path}.vertical_id",
                "vertical_id",
                issues,
            )

        hf_space_id = cell.get("hf_space_id")
        if _is_nonempty_string(hf_space_id):
            if not HF_SPACE_ID_RE.fullmatch(hf_space_id):
                issues.append(
                    f"{path}.hf_space_id: {hf_space_id!r} must match {HF_SPACE_ID_RE.pattern}"
                )
            _record_unique(
                hf_space_id,
                index,
                seen_hf_ids,
                f"{path}.hf_space_id",
                "hf_space_id",
                issues,
            )

        display_name = cell.get("display_name")
        if _is_nonempty_string(display_name):
            if len(display_name.strip()) < 3:
                issues.append(
                    f"{path}.display_name: must contain at least 3 characters"
                )
            _record_unique(
                display_name.strip().casefold(),
                index,
                seen_display_names,
                f"{path}.display_name",
                "display_name",
                issues,
            )

        visibility = cell.get("space_visibility")
        if _is_nonempty_string(visibility) and visibility not in {
            "public",
            "protected",
            "private",
        }:
            issues.append(
                f"{path}.space_visibility: {visibility!r} must be public, protected, or private"
            )

        for field in CELL_STRING_LIST_FIELDS:
            _validate_unique_string_list(cell.get(field), f"{path}.{field}", issues)
        _validate_leaders(cell.get("leaders"), f"{path}.leaders", issues)
        _validate_data_policy(cell.get("data_policy"), f"{path}.data_policy", issues)
        _validate_cell_formula_bindings(cell, path, formula_map, formula_scopes, issues)
        _validate_killinchu_boundary(cell, path, issues)

    actual_ids = set(seen_vertical_ids)
    missing_ids = sorted(EXPECTED_VERTICAL_IDS - actual_ids)
    unexpected_ids = sorted(actual_ids - EXPECTED_VERTICAL_IDS)
    if missing_ids:
        issues.append(f"vertical_cells: missing canonical vertical IDs {missing_ids!r}")
    if unexpected_ids:
        issues.append(
            f"vertical_cells: unexpected vertical IDs {unexpected_ids!r}; update the explicit alias registry before admitting a new cell"
        )


def _validate_cell_formula_bindings(
    cell: Mapping[str, Any],
    path: str,
    formula_map: Mapping[str, Mapping[str, Any]],
    formula_scopes: Mapping[str, tuple[str, ...]],
    issues: list[str],
) -> None:
    bindings = cell.get("formula_bindings")
    vertical_id = cell.get("vertical_id")
    if not isinstance(bindings, list):
        return
    aliases = {
        alias
        for alias, target in FORMULA_VERTICAL_ALIASES.items()
        if target == vertical_id
    }
    if _is_nonempty_string(vertical_id):
        aliases.add(vertical_id)

    for binding_index, formula_id in enumerate(bindings):
        binding_path = f"{path}.formula_bindings[{binding_index}]"
        if not _is_nonempty_string(formula_id):
            continue
        if formula_id not in formula_map:
            issues.append(
                f"{binding_path}: unknown formula_id {formula_id!r}; add it to the "
                "profile formula_bindings registry or remove the cell binding"
            )
            continue
        scopes = formula_scopes.get(formula_id, ())
        if scopes == ("all",):
            continue
        if not scopes or not aliases.intersection(scopes):
            issues.append(
                f"{binding_path}: formula {formula_id!r} scope {list(scopes)!r} is "
                f"incompatible with vertical {vertical_id!r}; update the explicit alias registry, formula scope, or cell binding"
            )


def _validate_killinchu_boundary(
    cell: Mapping[str, Any], path: str, issues: list[str]
) -> None:
    if cell.get("vertical_id") != "killinchu":
        return
    if cell.get("space_visibility") != "public":
        issues.append(f"{path}: Killinchu must remain a public simulation surface")
    if cell.get("hf_space_id") != "SZLHOLDINGS/killinchu":
        issues.append(
            f"{path}: Killinchu Space identity must remain SZLHOLDINGS/killinchu"
        )
    if cell.get("public_launch") != "KEEP_PUBLIC_ONLY_AS_SIMULATED_PROPOSAL_SYSTEM":
        issues.append(
            f"{path}: Killinchu public_launch must preserve the simulation-only boundary"
        )
    allowed = [str(item) for item in cell.get("allowed_actions", [])]
    prohibited = [str(item) for item in cell.get("prohibited_actions", [])]
    if {_normalized(action) for action in allowed} != {
        _normalized(action) for action in KILLINCHU_ALLOWED_ACTIONS
    }:
        issues.append(
            f"{path}.allowed_actions: must exactly equal the canonical simulation-only action set"
        )
    for action in allowed:
        if any(
            _normalized(term) in _normalized(action)
            for term in KILLINCHU_EFFECTOR_TERMS
        ):
            issues.append(
                f"{path}.allowed_actions: physical-effector action is forbidden: {action!r}"
            )
    for term in KILLINCHU_REQUIRED_BOUNDARY_TERMS:
        if not any(_normalized(term) in _normalized(rule) for rule in prohibited):
            issues.append(
                f"{path}.prohibited_actions: missing explicit {term!r} boundary"
            )


def _validate_leaders(value: object, path: str, issues: list[str]) -> None:
    if not isinstance(value, list) or not value:
        issues.append(
            f"{path}: required nonempty array with at least two leader objects"
        )
        return
    if len(value) < 2:
        issues.append(f"{path}: expected at least two leaders, found {len(value)}")

    seen_names: dict[str, int] = {}
    seen_urls: dict[str, int] = {}
    allowed_keys = {"name", "pattern", "url"}
    for index, leader in enumerate(value):
        leader_path = f"{path}[{index}]"
        if not isinstance(leader, dict):
            issues.append(f"{leader_path}: expected object, found {_type_name(leader)}")
            continue
        _require_fields(leader, ("name", "pattern", "url"), leader_path, issues)
        unexpected = sorted(set(leader) - allowed_keys)
        if unexpected:
            issues.append(
                f"{leader_path}: unexpected fields {unexpected!r}; allowed fields are name, pattern, url"
            )
        for field in ("name", "pattern", "url"):
            if field in leader and not _is_nonempty_string(leader[field]):
                issues.append(
                    f"{leader_path}.{field}: required nonempty string, found {_type_name(leader[field])}"
                )

        name = leader.get("name")
        if _is_nonempty_string(name):
            _record_local_unique(
                name.strip().casefold(),
                index,
                seen_names,
                f"{leader_path}.name",
                "leader name",
                issues,
            )
        url = leader.get("url")
        if _is_nonempty_string(url):
            if not _is_https_url(url):
                issues.append(
                    f"{leader_path}.url: {url!r} must be an absolute https URL"
                )
            _record_local_unique(
                url.strip().casefold(),
                index,
                seen_urls,
                f"{leader_path}.url",
                "leader URL",
                issues,
            )


def _validate_data_policy(value: object, path: str, issues: list[str]) -> None:
    if not isinstance(value, dict) or not value:
        issues.append(f"{path}: required nonempty object")
        return
    _require_fields(value, DATA_POLICY_REQUIRED_FIELDS, path, issues)
    unexpected = sorted(set(value) - set(DATA_POLICY_REQUIRED_FIELDS))
    if unexpected:
        issues.append(
            f"{path}: unexpected fields {unexpected!r}; data policy is strict"
        )
    _validate_unique_string_list(value.get("public"), f"{path}.public", issues)
    _validate_unique_string_list(value.get("protected"), f"{path}.protected", issues)
    if not _is_nonempty_string(value.get("training_use")):
        issues.append(f"{path}.training_use: required nonempty string")


def _validate_unique_string_list(value: object, path: str, issues: list[str]) -> None:
    if not isinstance(value, list) or not value:
        issues.append(f"{path}: required nonempty array of unique nonempty strings")
        return
    normalized: list[str] = []
    for index, item in enumerate(value):
        if not _is_nonempty_string(item):
            issues.append(
                f"{path}[{index}]: expected nonempty string, found {_type_name(item)}"
            )
        else:
            normalized.append(item.strip())
    for duplicate in _duplicates(normalized, casefold=True):
        issues.append(f"{path}: duplicate value {duplicate!r}; list each value once")


def _validate_declared_cell_count(
    counts: object, cells: object, issues: list[str]
) -> None:
    if counts is None:
        return
    if not isinstance(counts, dict):
        issues.append(
            f"counts: expected object when present, found {_type_name(counts)}"
        )
        return
    declared = counts.get("vertical_cells")
    if type(declared) is not int:
        issues.append(
            "counts.vertical_cells: expected integer matching vertical_cells length"
        )
    elif isinstance(cells, list) and declared != len(cells):
        issues.append(
            f"counts.vertical_cells: declares {declared} but profile contains {len(cells)}; update the count"
        )


def _require_fields(
    value: Mapping[str, Any],
    fields: Iterable[str],
    path: str,
    issues: list[str],
) -> None:
    missing = [field for field in fields if field not in value]
    if missing:
        issues.append(
            f"{path}: missing required fields {missing!r}; supply every required contract field"
        )


def _record_unique(
    value: str,
    index: int,
    seen: dict[str, int],
    path: str,
    field_name: str,
    issues: list[str],
) -> None:
    if value in seen:
        issues.append(
            f"{path}: duplicate {value!r}; first declared at vertical_cells[{seen[value]}].{field_name}"
        )
    else:
        seen[value] = index


def _record_local_unique(
    value: str,
    index: int,
    seen: dict[str, int],
    path: str,
    label: str,
    issues: list[str],
) -> None:
    if value in seen:
        issues.append(
            f"{path}: duplicate {label}; first declared at index {seen[value]}"
        )
    else:
        seen[value] = index


def _duplicates(values: Iterable[str], *, casefold: bool) -> list[str]:
    seen: set[str] = set()
    duplicate_keys: set[str] = set()
    result: list[str] = []
    for value in values:
        key = value.casefold() if casefold else value
        if key in seen and key not in duplicate_keys:
            duplicate_keys.add(key)
            result.append(value)
        seen.add(key)
    return result


def _is_https_url(value: str) -> bool:
    try:
        parsed = urlsplit(value)
        parsed.port  # Access validates malformed ports.
    except (ValueError, AttributeError):
        return False
    return (
        parsed.scheme == "https"
        and bool(parsed.hostname)
        and parsed.username is None
        and parsed.password is None
    )


def _is_nonempty_string(value: object) -> bool:
    return type(value) is str and bool(value.strip())


def _normalized(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()


def _type_name(value: object) -> str:
    if value is None:
        return "null"
    if type(value) is bool:
        return "boolean"
    return type(value).__name__


__all__ = [
    "CELL_REQUIRED_FIELDS",
    "CELL_SCHEMA",
    "EXPECTED_CELL_COUNT",
    "EXPECTED_VERTICAL_IDS",
    "FORMULA_PROOF_CLASSES",
    "FORMULA_VERTICAL_ALIASES",
    "HF_SPACE_ID_RE",
    "PROFILE_SCHEMA",
    "VERTICAL_ID_RE",
    "ValidationError",
    "load_profile",
    "validate_profile",
]
