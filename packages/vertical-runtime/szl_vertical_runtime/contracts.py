"""Strict startup admission for the checked-in Packet 6 catalog."""

from __future__ import annotations

import hashlib
import re
from pathlib import Path
from typing import Any, Mapping
from urllib.parse import urlparse

from .canonical import digest_value, read_json


CELL_SCHEMA = "szl.vertical-cell/v1"
FORMULA_REGISTRY_SCHEMA = "szl.formula-binding-registry/v1"
ALIAS_REGISTRY_SCHEMA = "szl.formula-vertical-aliases/v1"
FORMULA_VERTICAL_ALIASES = {
    "aegis": "aegis-assurance",
    "counsel": "counsel-assurance",
    "insurance": "insurance-assurance",
    "killinchu": "killinchu",
    "lyte": "lyte-services",
    "terra": "terra-assurance",
    "vessels": "vessels-assurance",
}
CANONICAL_VERTICAL_IDS = frozenset(FORMULA_VERTICAL_ALIASES.values())
VERTICAL_ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
FORMULA_ID = re.compile(r"^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$")
SPACE_ID = re.compile(r"^SZLHOLDINGS/[A-Za-z0-9](?:[A-Za-z0-9._-]*[A-Za-z0-9])?$")
HEX_64 = re.compile(r"^[0-9a-f]{64}$")
FORMULA_PROOF_CLASSES = frozenset(
    {"LOCKED-PROVEN", "SEMANTIC-VERIFIED", "CONJECTURE/ADVISORY"}
)
LOCKED_FORMULA_IDS = frozenset({"F1", "F4", "F7", "F11", "F12", "F18", "F19", "F22"})
CELL_FIELDS = {
    "allowed_actions",
    "buyer",
    "core_workflows",
    "data_policy",
    "decision_problem",
    "display_name",
    "formula_bindings",
    "hf_space_id",
    "human_authority",
    "leaders",
    "negative_tests",
    "original_szl_design",
    "portfolio_role",
    "prohibited_actions",
    "public_launch",
    "schema",
    "space_visibility",
    "stage",
    "success_metrics",
    "vertical_id",
}
STRING_FIELDS = CELL_FIELDS - {
    "allowed_actions",
    "core_workflows",
    "data_policy",
    "formula_bindings",
    "human_authority",
    "leaders",
    "negative_tests",
    "prohibited_actions",
    "success_metrics",
}
STRING_LIST_FIELDS = {
    "allowed_actions",
    "core_workflows",
    "formula_bindings",
    "human_authority",
    "negative_tests",
    "prohibited_actions",
    "success_metrics",
}
FORMULA_FIELDS = {
    "allowed_runtime_binding",
    "formula_id",
    "grants_authority",
    "name",
    "proof_class",
    "prohibited_claim",
    "required_binding_evidence",
    "source_url",
    "verticals",
}
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


class ContractError(ValueError):
    pass


def _nonempty(value: Any) -> bool:
    return type(value) is str and bool(value.strip())


def _normalized(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", " ", value.casefold()).strip()


def _contains(left: str, right: str) -> bool:
    return _normalized(right) in _normalized(left)


def _string_list(value: Any, field: str, issues: list[str]) -> list[str]:
    if not isinstance(value, list) or not value:
        issues.append(f"{field}: expected a nonempty string array")
        return []
    items: list[str] = []
    seen: set[str] = set()
    for index, item in enumerate(value):
        if not _nonempty(item):
            issues.append(f"{field}[{index}]: expected a nonempty string")
            continue
        key = item.strip().casefold()
        if key in seen:
            issues.append(f"{field}[{index}]: duplicate value")
        seen.add(key)
        items.append(item.strip())
    return items


def validate_cell(cell: Any) -> list[str]:
    issues: list[str] = []
    if not isinstance(cell, Mapping):
        return ["cell: expected object"]
    missing = CELL_FIELDS - set(cell)
    extras = set(cell) - CELL_FIELDS
    if missing:
        issues.append(f"cell: missing fields {sorted(missing)!r}")
    if extras:
        issues.append(f"cell: unknown fields {sorted(extras)!r}")
    for field in STRING_FIELDS:
        if field in cell and not _nonempty(cell[field]):
            issues.append(f"{field}: expected a nonempty string")
    for field in STRING_LIST_FIELDS:
        _string_list(cell.get(field), field, issues)
    if cell.get("schema") != CELL_SCHEMA:
        issues.append(f"schema: expected {CELL_SCHEMA}")
    vertical_id = cell.get("vertical_id")
    if not _nonempty(vertical_id) or not VERTICAL_ID.fullmatch(vertical_id):
        issues.append("vertical_id: invalid canonical ID")
    if cell.get("space_visibility") not in {"private", "protected", "public"}:
        issues.append("space_visibility: invalid value")
    if not _nonempty(cell.get("hf_space_id")) or not SPACE_ID.fullmatch(
        cell["hf_space_id"]
    ):
        issues.append("hf_space_id: invalid SZLHOLDINGS Space ID")

    leaders = cell.get("leaders")
    if not isinstance(leaders, list) or len(leaders) < 2:
        issues.append("leaders: expected at least two leader records")
    else:
        seen_leaders: set[str] = set()
        for index, leader in enumerate(leaders):
            path = f"leaders[{index}]"
            if not isinstance(leader, Mapping) or set(leader) != {
                "name",
                "pattern",
                "url",
            }:
                issues.append(f"{path}: expected exactly name, pattern, and url")
                continue
            for field in ("name", "pattern", "url"):
                if not _nonempty(leader[field]):
                    issues.append(f"{path}.{field}: expected a nonempty string")
            name = str(leader["name"]).strip().casefold()
            if name in seen_leaders:
                issues.append(f"{path}.name: duplicate leader")
            seen_leaders.add(name)
            parsed = urlparse(str(leader["url"]))
            if parsed.scheme != "https" or not parsed.netloc or parsed.username:
                issues.append(
                    f"{path}.url: expected an absolute credential-free HTTPS URL"
                )

    policy = cell.get("data_policy")
    if not isinstance(policy, Mapping) or set(policy) != {
        "protected",
        "public",
        "training_use",
    }:
        issues.append(
            "data_policy: expected exactly protected, public, and training_use"
        )
    else:
        _string_list(policy["protected"], "data_policy.protected", issues)
        _string_list(policy["public"], "data_policy.public", issues)
        if not _nonempty(policy["training_use"]):
            issues.append("data_policy.training_use: expected a nonempty string")

    if vertical_id == "killinchu":
        if cell.get("space_visibility") != "public":
            issues.append(
                "killinchu: visibility must remain public for the declared simulation surface"
            )
        if cell.get("hf_space_id") != "SZLHOLDINGS/killinchu":
            issues.append("killinchu: Space identity must remain SZLHOLDINGS/killinchu")
        if cell.get("public_launch") != "KEEP_PUBLIC_ONLY_AS_SIMULATED_PROPOSAL_SYSTEM":
            issues.append(
                "killinchu: public_launch must preserve the simulation-only boundary"
            )
        allowed = [str(item) for item in cell.get("allowed_actions", [])]
        prohibited = [str(item) for item in cell.get("prohibited_actions", [])]
        if {_normalized(action) for action in allowed} != {
            _normalized(action) for action in KILLINCHU_ALLOWED_ACTIONS
        }:
            issues.append(
                "killinchu.allowed_actions: must exactly equal the canonical simulation-only action set"
            )
        for action in allowed:
            if any(_contains(action, term) for term in KILLINCHU_EFFECTOR_TERMS):
                issues.append(
                    f"killinchu.allowed_actions: physical-effector term is forbidden: {action!r}"
                )
        for term in KILLINCHU_REQUIRED_BOUNDARY_TERMS:
            if not any(_contains(rule, term) for rule in prohibited):
                issues.append(
                    f"killinchu.prohibited_actions: missing explicit {term!r} boundary"
                )
    return issues


def _load_formula_registry(path: Path) -> tuple[dict[str, Mapping[str, Any]], str]:
    if path.is_symlink() or not path.is_file():
        raise ContractError("formula registry must be a regular file")
    registry = read_json(path)
    if not isinstance(registry, Mapping) or set(registry) != {
        "captured_at",
        "formulas",
        "schema",
    }:
        raise ContractError(
            "formula registry must contain exactly captured_at, formulas, and schema"
        )
    if registry.get("schema") != FORMULA_REGISTRY_SCHEMA or not isinstance(
        registry.get("formulas"), list
    ):
        raise ContractError("formula registry schema or formulas array is invalid")
    raw_digest = hashlib.sha256(path.read_bytes()).hexdigest()
    sidecar_path = path.with_suffix(".sha256")
    if sidecar_path.is_symlink() or not sidecar_path.is_file():
        raise ContractError("formula registry checksum must be a regular file")
    sidecar = sidecar_path.read_text(encoding="ascii").strip().split()
    if len(sidecar) != 2 or sidecar[1] != path.name or not HEX_64.fullmatch(sidecar[0]):
        raise ContractError("formula registry checksum sidecar is malformed")
    if sidecar[0] != raw_digest:
        raise ContractError("formula registry checksum does not match checked-in bytes")
    formulas: dict[str, Mapping[str, Any]] = {}
    for index, formula in enumerate(registry["formulas"]):
        if not isinstance(formula, Mapping) or set(formula) != FORMULA_FIELDS:
            raise ContractError(f"formula[{index}] has an invalid strict shape")
        formula_id = formula.get("formula_id")
        if not _nonempty(formula_id) or not FORMULA_ID.fullmatch(formula_id):
            raise ContractError(f"formula[{index}] has an invalid formula_id")
        if formula_id in formulas:
            raise ContractError(f"duplicate formula_id: {formula_id}")
        if formula.get("grants_authority") is not False:
            raise ContractError(f"formula {formula_id} must not grant authority")
        for field in FORMULA_FIELDS - {"grants_authority"}:
            if not _nonempty(formula.get(field)):
                raise ContractError(
                    f"formula {formula_id}.{field} must be a nonempty string"
                )
        if formula["proof_class"] not in FORMULA_PROOF_CLASSES:
            raise ContractError(
                f"formula {formula_id}.proof_class must be one of "
                f"{sorted(FORMULA_PROOF_CLASSES)!r}"
            )
        if (
            formula_id in LOCKED_FORMULA_IDS
            and formula["proof_class"] != "LOCKED-PROVEN"
        ):
            raise ContractError(
                f"locked formula {formula_id} must remain LOCKED-PROVEN"
            )
        if (
            formula["proof_class"] == "LOCKED-PROVEN"
            and formula_id not in LOCKED_FORMULA_IDS
        ):
            raise ContractError(
                f"formula {formula_id} is not in the exact eight locked formula IDs"
            )
        source = urlparse(str(formula["source_url"]))
        if source.scheme != "https" or not source.netloc or source.username:
            raise ContractError(
                f"formula {formula_id}.source_url must be credential-free HTTPS"
            )
        formulas[formula_id] = formula
    if not formulas:
        raise ContractError("formula registry must not be empty")
    missing_locked = sorted(LOCKED_FORMULA_IDS - set(formulas))
    if missing_locked:
        raise ContractError(
            f"formula registry is missing locked formula IDs: {missing_locked!r}"
        )
    return formulas, raw_digest


def load_catalog(
    manifest_dir: str | Path,
) -> tuple[dict[str, dict[str, Any]], dict[str, Any]]:
    directory = Path(manifest_dir)
    registry_dir = directory.parent / "registries"
    if directory.is_symlink() or not directory.is_dir():
        raise ContractError("manifest directory must be a regular directory")
    manifest_entries = list(directory.iterdir())
    if any(
        entry.is_symlink() or not entry.is_file() or entry.suffix != ".json"
        for entry in manifest_entries
    ):
        raise ContractError("manifest directory may contain only regular JSON files")
    if registry_dir.is_symlink() or not registry_dir.is_dir():
        raise ContractError("registry directory must be a regular directory")
    expected_registry_files = {
        "formula_aliases.json",
        "formula_bindings.json",
        "formula_bindings.sha256",
    }
    if {
        entry.name for entry in registry_dir.iterdir()
    } != expected_registry_files or any(
        entry.is_symlink() or not entry.is_file() for entry in registry_dir.iterdir()
    ):
        raise ContractError(
            "registry directory has missing, extra, or non-regular files"
        )
    formulas, formula_digest = _load_formula_registry(
        registry_dir / "formula_bindings.json"
    )
    alias_registry = read_json(registry_dir / "formula_aliases.json")
    if not isinstance(alias_registry, Mapping) or set(alias_registry) != {
        "aliases",
        "captured_at",
        "global_scope",
        "schema",
    }:
        raise ContractError("formula alias registry has an invalid strict shape")
    if (
        alias_registry.get("schema") != ALIAS_REGISTRY_SCHEMA
        or alias_registry.get("global_scope") != "all"
    ):
        raise ContractError("formula alias registry identity is invalid")
    formula_registry = read_json(registry_dir / "formula_bindings.json")
    if alias_registry.get("captured_at") != formula_registry.get("captured_at"):
        raise ContractError("formula and alias registry capture times do not match")
    aliases = alias_registry.get("aliases")
    if not isinstance(aliases, Mapping) or not aliases:
        raise ContractError("formula aliases must be a nonempty object")
    normalized_aliases: dict[str, str] = {}
    for alias, target in aliases.items():
        if (
            not _nonempty(alias)
            or not VERTICAL_ID.fullmatch(alias)
            or not _nonempty(target)
            or not VERTICAL_ID.fullmatch(target)
        ):
            raise ContractError("formula aliases and targets must be canonical IDs")
        if alias in normalized_aliases:
            raise ContractError(f"duplicate formula alias: {alias}")
        normalized_aliases[alias] = target
    aliases = normalized_aliases
    if aliases != FORMULA_VERTICAL_ALIASES:
        raise ContractError(
            "formula aliases must exactly equal the Packet 6 canonical mapping"
        )
    if len(set(aliases.values())) != len(aliases):
        raise ContractError(
            "formula aliases must map one-to-one to canonical vertical IDs"
        )

    cells: dict[str, dict[str, Any]] = {}
    for path in sorted(manifest_entries):
        cell = read_json(path)
        issues = validate_cell(cell)
        if issues:
            raise ContractError(
                f"invalid vertical cell {path.name}: {'; '.join(issues)}"
            )
        vertical_id = cell["vertical_id"]
        if path.name != f"{vertical_id}.json":
            raise ContractError(
                f"manifest filename does not match vertical_id: {path.name}"
            )
        if vertical_id in cells:
            raise ContractError(f"duplicate vertical_id: {vertical_id}")
        cells[vertical_id] = dict(cell)
    if set(cells) != set(aliases.values()):
        raise ContractError(
            "manifest IDs must exactly equal the canonical formula-alias targets"
        )
    if set(cells) != CANONICAL_VERTICAL_IDS:
        raise ContractError(
            "manifest IDs must exactly equal the seven Packet 6 vertical IDs"
        )

    known_scopes = {"all"} | set(aliases) | set(cells)
    formula_scopes: dict[str, tuple[str, ...]] = {}
    for formula_id, formula in formulas.items():
        scopes = tuple(token.strip() for token in str(formula["verticals"]).split(","))
        if (
            not scopes
            or any(not token for token in scopes)
            or len(scopes) != len(set(scopes))
        ):
            raise ContractError(f"formula {formula_id}: invalid or duplicate scopes")
        if "all" in scopes and scopes != ("all",):
            raise ContractError(
                f"formula {formula_id}: all must be the only global scope"
            )
        unknown = set(scopes) - known_scopes
        if unknown:
            raise ContractError(
                f"formula {formula_id}: unknown scopes {sorted(unknown)!r}"
            )
        formula_scopes[formula_id] = scopes

    for vertical_id, cell in cells.items():
        applicable_tokens = {vertical_id} | {
            str(alias) for alias, target in aliases.items() if target == vertical_id
        }
        for formula_id in cell["formula_bindings"]:
            formula = formulas.get(formula_id)
            if formula is None:
                raise ContractError(
                    f"{vertical_id}: unknown formula binding {formula_id}"
                )
            scopes = formula_scopes[formula_id]
            if scopes != ("all",) and not applicable_tokens.intersection(scopes):
                raise ContractError(
                    f"{vertical_id}: formula {formula_id} scope is incompatible"
                )
    metadata = {
        "alias_registry_schema": ALIAS_REGISTRY_SCHEMA,
        "catalog_digest": digest_value(
            {
                "aliases": aliases,
                "cells": cells,
                "formulas": {key: dict(value) for key, value in formulas.items()},
                "schema": "szl.vertical-catalog-identity/v1",
            }
        ),
        "formula_count": len(formulas),
        "formula_registry_sha256": formula_digest,
        "vertical_count": len(cells),
    }
    return cells, metadata
