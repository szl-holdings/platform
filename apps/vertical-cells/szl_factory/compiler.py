"""Deterministic Packet 6 vertical-cell contract compiler.

The compiler is deliberately local and dependency-free.  It emits source-cell
manifests and modeled contracts; it does not publish, deploy, call a provider,
or establish runtime readiness.

Tree digest v1
==============

``tree_sha256`` is SHA-256 over this exact byte stream::

    b"szl-tree-sha256-v1\n" +
    for each regular file ordered by POSIX relative path:
        relative_path_utf8 + b"\0" + lowercase_file_sha256_ascii + b"\n"

The compiled tree digest includes every regular file below the output root,
including ``compiled_index.json`` and each ``build_manifest.json``.  The digest
is returned by :func:`compile_profile` rather than embedded in the index, which
avoids a self-referential digest.  Symlinks are rejected.
"""

from __future__ import annotations

import copy
import hashlib
import json
import os
import tempfile
from pathlib import Path
from typing import Any, Mapping

from .validation import (
    FORMULA_VERTICAL_ALIASES,
    ValidationError,
    load_profile,
    validate_profile,
)


COMPILER_SCHEMA = "szl.vertical-cell-compiler/v1"
COMPILER_VERSION = "1.0.0"
CANONICAL_JSON_ALGORITHM = "szl.canonical-json.sorted-keys-indent-2-lf/v1"
TREE_DIGEST_ID = "szl.tree-digest.sha256-file-map/v1"
TREE_DIGEST_DOMAIN = b"szl-tree-sha256-v1\n"
TREE_DIGEST_ALGORITHM = (
    "sha256(b'szl-tree-sha256-v1\\n' + sorted(relative_posix_utf8 + "
    "NUL + lowercase_file_sha256_ascii + LF)); all regular files included; "
    "symlinks, junctions, and reparse points rejected"
)

PEER_ARTIFACT_NAMES = (
    "README.md",
    "evaluation_plan.json",
    "investor_demo.json",
    "ontology.schema.json",
    "policy_contract.json",
    "receipt.schema.json",
    "route_contract.json",
    "space_release_plan.json",
    "ui_contract.json",
    "vertical_manifest.json",
)
CELL_ARTIFACT_NAMES = tuple(sorted((*PEER_ARTIFACT_NAMES, "build_manifest.json")))


def compile_profile(
    profile_path: str | Path,
    vertical_dir: str | Path,
    out_dir: str | Path,
    clean: bool = False,
) -> dict[str, Any]:
    """Validate and deterministically compile all seven Packet 6 cells.

    ``clean=True`` removes only the compiler's exact admitted file set. It never
    recursively deletes an output root or an unexpected file. Unexpected
    pre-existing files fail closed in every mode so stale artifacts cannot be
    hidden inside the returned tree digest.
    """

    profile_source = Path(profile_path)
    profile = load_profile(profile_source)
    issues = validate_profile(profile)
    if issues:
        raise ValidationError(issues)
    captured_at = profile["captured_at"]
    profile_sha256 = _sha256(canonical_json_bytes(profile))

    vertical_root = Path(vertical_dir)
    compiled_root = Path(out_dir)
    cells = sorted(profile["vertical_cells"], key=lambda cell: cell["vertical_id"])
    _prepare_output_roots(
        profile_source,
        vertical_root,
        compiled_root,
        cells,
        clean=clean,
    )

    vertical_root.mkdir(parents=True, exist_ok=True)
    compiled_root.mkdir(parents=True, exist_ok=True)
    formula_map = {
        formula["formula_id"]: formula for formula in profile["formula_bindings"]
    }
    index_entries: list[dict[str, Any]] = []

    for cell in cells:
        vertical_id = cell["vertical_id"]
        source_bytes = canonical_json_bytes(cell)
        source_manifest_sha256 = _sha256(source_bytes)
        _atomic_write_bytes(vertical_root / f"{vertical_id}.json", source_bytes)

        resolved_formulas = [
            _formula_projection(formula_map[formula_id])
            for formula_id in cell["formula_bindings"]
        ]
        payloads = _build_peer_payloads(
            cell=cell,
            resolved_formulas=resolved_formulas,
            captured_at=captured_at,
            profile_sha256=profile_sha256,
            source_manifest_sha256=source_manifest_sha256,
        )
        peer_bytes = {
            name: (
                payload.encode("utf-8")
                if isinstance(payload, str)
                else canonical_json_bytes(payload)
            )
            for name, payload in payloads.items()
        }
        if set(peer_bytes) != set(PEER_ARTIFACT_NAMES):
            missing = sorted(set(PEER_ARTIFACT_NAMES) - set(peer_bytes))
            extra = sorted(set(peer_bytes) - set(PEER_ARTIFACT_NAMES))
            raise RuntimeError(
                f"compiler artifact definition drift: missing={missing!r}, extra={extra!r}"
            )

        build_manifest = _build_manifest(
            vertical_id=vertical_id,
            captured_at=captured_at,
            profile_sha256=profile_sha256,
            source_manifest_sha256=source_manifest_sha256,
            peer_bytes=peer_bytes,
        )
        build_manifest_bytes = canonical_json_bytes(build_manifest)
        cell_root = compiled_root / vertical_id
        for name in sorted(peer_bytes):
            _atomic_write_bytes(cell_root / name, peer_bytes[name])
        # The marker is always published after every peer. A failed write can
        # leave partial bytes, but never a stale validity marker over them.
        _atomic_write_bytes(cell_root / "build_manifest.json", build_manifest_bytes)

        index_entries.append(
            {
                "build_manifest_sha256": _sha256(build_manifest_bytes),
                "compiled_path": vertical_id,
                "display_name": cell["display_name"],
                "hf_space_id": cell["hf_space_id"],
                "source_manifest_path": f"{vertical_id}.json",
                "source_manifest_sha256": source_manifest_sha256,
                "vertical_id": vertical_id,
            }
        )

    source_tree_sha256 = compute_tree_sha256(vertical_root)
    compiled_index = {
        "captured_at": captured_at,
        "compiled_tree_digest": {
            "algorithm": TREE_DIGEST_ALGORITHM,
            "embedded": False,
            "reason": "compiled_index.json is included in the tree; compile_profile returns the non-recursive external digest",
        },
        "compiled_verticals": len(index_entries),
        "compiler": {
            "canonical_json_algorithm": CANONICAL_JSON_ALGORITHM,
            "schema": COMPILER_SCHEMA,
            "version": COMPILER_VERSION,
        },
        "evidence_status": "MODELED",
        "formula_vertical_aliases": dict(sorted(FORMULA_VERTICAL_ALIASES.items())),
        "profile_sha256": profile_sha256,
        "schema": "szl.compiled-vertical-index/v1",
        "source_tree_sha256": source_tree_sha256,
        "tree_digest_id": TREE_DIGEST_ID,
        "verticals": index_entries,
    }
    _atomic_write_bytes(
        compiled_root / "compiled_index.json",
        canonical_json_bytes(compiled_index),
    )
    tree_sha256 = compute_tree_sha256(compiled_root)
    return {
        "captured_at": captured_at,
        "compiled_verticals": len(index_entries),
        "profile_sha256": profile_sha256,
        "source_tree_sha256": source_tree_sha256,
        "canonical_json_algorithm": CANONICAL_JSON_ALGORITHM,
        "tree_digest_id": TREE_DIGEST_ID,
        "tree_digest_algorithm": TREE_DIGEST_ALGORITHM,
        "tree_sha256": tree_sha256,
    }


def canonical_json_bytes(value: object) -> bytes:
    """Return canonical project JSON: sorted keys, two spaces, UTF-8, LF."""

    rendered = json.dumps(
        value,
        allow_nan=False,
        ensure_ascii=False,
        indent=2,
        sort_keys=True,
    )
    return (rendered + "\n").encode("utf-8")


def compute_tree_sha256(root: str | Path) -> str:
    """Compute Tree Digest v1 for ``root`` and reject unsafe symlinks."""

    tree_root = Path(root)
    if _is_link_or_reparse_point(tree_root):
        raise ValidationError(
            f"tree root: symlink, junction, or reparse point is not admitted: {tree_root}"
        )
    if not tree_root.is_dir():
        raise ValidationError(f"tree root: expected directory, found {tree_root}")
    files: list[Path] = []
    for path in tree_root.rglob("*"):
        if _is_link_or_reparse_point(path):
            raise ValidationError(
                f"tree root: symlink, junction, or reparse point {path} is not admitted into deterministic output"
            )
        if path.is_file():
            files.append(path)

    digest = hashlib.sha256()
    digest.update(TREE_DIGEST_DOMAIN)
    for path in sorted(files, key=lambda item: item.relative_to(tree_root).as_posix()):
        relative_path = path.relative_to(tree_root).as_posix()
        file_sha256 = _sha256(path.read_bytes())
        digest.update(relative_path.encode("utf-8"))
        digest.update(b"\0")
        digest.update(file_sha256.encode("ascii"))
        digest.update(b"\n")
    return digest.hexdigest()


def _build_peer_payloads(
    *,
    cell: Mapping[str, Any],
    resolved_formulas: list[dict[str, Any]],
    captured_at: str,
    profile_sha256: str,
    source_manifest_sha256: str,
) -> dict[str, object]:
    vertical_id = cell["vertical_id"]
    common = {
        "captured_at": captured_at,
        "evidence_status": "MODELED",
        "source_manifest_sha256": source_manifest_sha256,
        "vertical_id": vertical_id,
    }
    return {
        "README.md": _compiled_readme(cell, source_manifest_sha256),
        "evaluation_plan.json": {
            **common,
            "acceptance_invariants": [
                "all formula bindings resolve and grant no authority",
                "missing or stale evidence denies or escalates",
                "prohibited actions never become executable recommendations",
                "human authority remains explicit in every consequential decision",
                "scenario and receipt digests reproduce exactly",
            ],
            "negative_tests": cell["negative_tests"],
            "positive_workflows": cell["core_workflows"],
            "private_data_allowed": False,
            "schema": "szl.vertical-evaluation-plan/v1",
            "side_effects": "DISABLED",
            "synthetic_or_rights_cleared_fixtures_only": True,
        },
        "investor_demo.json": {
            **common,
            "claim_boundary": "Local modeled contracts and synthetic demonstrations are not deployment, customer-use, revenue, or runtime proof.",
            "decision_problem": cell["decision_problem"],
            "display_name": cell["display_name"],
            "required_segments": [
                "synthetic evidence and provenance",
                "bounded recommendation",
                "negative denial or abstention",
                "named human approval",
                "decision receipt and deterministic replay",
                "limitations and next evidence gate",
            ],
            "schema": "szl.vertical-investor-demo/v1",
            "target_duration_seconds": 180,
        },
        "ontology.schema.json": _ontology_schema(cell),
        "policy_contract.json": {
            **common,
            "allowed_actions": cell["allowed_actions"],
            "default_decision": "DENY",
            "formula_bindings": resolved_formulas,
            "formula_grants_authority": False,
            "human_authority": cell["human_authority"],
            "missing_context_decision": "ESCALATE_OR_DENY",
            "prohibited_actions": cell["prohibited_actions"],
            "schema": "szl.vertical-policy-contract/v1",
            "side_effect_authority": "EXTERNAL_TO_COMPILED_CONTRACT",
        },
        "receipt.schema.json": _receipt_schema(vertical_id, source_manifest_sha256),
        "route_contract.json": _route_contract(vertical_id, common),
        "space_release_plan.json": {
            **common,
            "admission_gates": [
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
            ],
            "hf_space_id": cell["hf_space_id"],
            "planned_visibility": cell["space_visibility"],
            "production_status": "SOURCE_ONLY",
            "provider_mutation_permitted": False,
            "public_launch_policy": cell["public_launch"],
            "schema": "szl.vertical-space-release-plan/v1",
        },
        "ui_contract.json": {
            **common,
            "authority_states": [
                "UNAUTHORIZED",
                "APPROVAL_REQUIRED",
                "APPROVED",
                "DENIED",
                "EXPIRED",
            ],
            "consequential_component_required_fields": [
                "evidence_class",
                "runtime_state",
                "authority_state",
                "freshness",
                "source_digest",
                "policy_revision",
                "limitations",
                "replay_url",
            ],
            "evidence_states": ["OBSERVED", "MODELED", "UNVERIFIED", "UNAVAILABLE"],
            "schema": "szl.vertical-ui-contract/v1",
            "stale_or_missing_behavior": "DEGRADE_VISIBLY_AND_BLOCK_CONSEQUENTIAL_ACTION",
        },
        "vertical_manifest.json": {
            **common,
            "compiler": {
                "profile_sha256": profile_sha256,
                "schema": COMPILER_SCHEMA,
                "version": COMPILER_VERSION,
            },
            "formula_binding_ids": cell["formula_bindings"],
            "schema": "szl.compiled-vertical-manifest/v1",
            "source_cell": copy.deepcopy(dict(cell)),
        },
    }


def _ontology_schema(cell: Mapping[str, Any]) -> dict[str, Any]:
    vertical_id = cell["vertical_id"]
    return {
        "$id": f"https://schemas.a11oy.net/verticals/{vertical_id}/evaluation-request.v2.schema.json",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": False,
        "properties": {
            "request": {
                "additionalProperties": False,
                "properties": {
                    "action": {"minLength": 1, "type": "string"},
                    "evidence": {
                        "items": {
                            "additionalProperties": False,
                            "properties": {
                                "digest": {
                                    "pattern": "^sha256:[0-9a-f]{64}$",
                                    "type": "string",
                                },
                                "evidence_class": {
                                    "enum": [
                                        "OBSERVED",
                                        "MODELED",
                                        "UNVERIFIED",
                                        "UNAVAILABLE",
                                    ]
                                },
                                "freshness": {"enum": ["CURRENT", "STALE", "UNKNOWN"]},
                                "id": {"minLength": 1, "type": "string"},
                                "limitations": {
                                    "items": {"minLength": 1, "type": "string"},
                                    "type": "array",
                                    "uniqueItems": True,
                                },
                            },
                            "required": [
                                "digest",
                                "evidence_class",
                                "freshness",
                                "id",
                                "limitations",
                            ],
                            "type": "object",
                        },
                        "type": "array",
                        "uniqueItems": True,
                    },
                    "principal": {
                        "additionalProperties": False,
                        "properties": {
                            "authority_claims": {
                                "items": {"minLength": 1, "type": "string"},
                                "type": "array",
                                "uniqueItems": True,
                            },
                            "id": {"minLength": 1, "type": "string"},
                        },
                        "required": ["authority_claims", "id"],
                        "type": "object",
                    },
                    "request_id": {
                        "pattern": "^[A-Za-z0-9._:-]{1,128}$",
                        "type": "string",
                    },
                    "workflow": {
                        "enum": cell["core_workflows"],
                        "type": "string",
                    },
                },
                "required": [
                    "action",
                    "evidence",
                    "principal",
                    "request_id",
                    "workflow",
                ],
                "type": "object",
            },
            "vertical_id": {"const": vertical_id},
        },
        "required": ["request", "vertical_id"],
        "title": f"{cell['display_name']} Evaluation Request",
        "type": "object",
    }


def _receipt_schema(vertical_id: str, manifest_sha256: str) -> dict[str, Any]:
    return {
        "$id": f"https://schemas.a11oy.net/verticals/{vertical_id}/decision-receipt.v2.schema.json",
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": False,
        "allOf": [
            {
                "if": {
                    "properties": {"receipt_kind": {"const": "INITIAL"}},
                    "required": ["receipt_kind"],
                },
                "then": {"properties": {"human_actor_id": {"type": "null"}}},
            },
            {
                "if": {
                    "properties": {"decision": {"const": "DENY"}},
                    "required": ["decision"],
                },
                "then": {"properties": {"authority_state": {"const": "DENIED"}}},
            },
            {
                "if": {
                    "properties": {"authority_state": {"const": "APPROVED"}},
                    "required": ["authority_state"],
                },
                "then": {
                    "properties": {
                        "decision": {"const": "RECOMMEND"},
                        "receipt_kind": {"const": "HUMAN_DISPOSITION"},
                    }
                },
            },
        ],
        "properties": {
            "authority_state": {"enum": ["APPROVAL_REQUIRED", "APPROVED", "DENIED"]},
            "decision": {"enum": ["RECOMMEND", "DENY", "ESCALATE"]},
            "decision_id": {
                "pattern": "^decision:[0-9a-f]{64}$",
                "type": "string",
            },
            "evidence_digests": {
                "items": {"pattern": "^[0-9a-f]{64}$", "type": "string"},
                "type": "array",
                "uniqueItems": True,
            },
            "execution_permitted": {"const": False},
            "external_side_effects": {"maxItems": 0, "type": "array"},
            "formula_receipts": {
                "maxItems": 0,
                "type": "array",
            },
            "human_actor_id": {
                "anyOf": [
                    {"type": "null"},
                    {
                        "pattern": "^[A-Za-z0-9._:@/+-]{1,128}$",
                        "type": "string",
                    },
                ]
            },
            "limitations": {
                "items": {"minLength": 1, "type": "string"},
                "minItems": 1,
                "type": "array",
                "uniqueItems": True,
            },
            "receipt_id": {
                "pattern": "^(?:receipt|human-receipt):[0-9a-f]{64}$",
                "type": "string",
            },
            "receipt_kind": {"enum": ["INITIAL", "HUMAN_DISPOSITION"]},
            "recorded_at": {"format": "date-time", "type": "string"},
            "replay_digest": {"pattern": "^[0-9a-f]{64}$", "type": "string"},
            "schema": {"const": "szl.vertical-decision-receipt/v2"},
            "source_manifest_sha256": {"const": manifest_sha256},
            "vertical_id": {"const": vertical_id},
        },
        "required": [
            "authority_state",
            "decision",
            "decision_id",
            "evidence_digests",
            "execution_permitted",
            "external_side_effects",
            "formula_receipts",
            "human_actor_id",
            "limitations",
            "receipt_id",
            "receipt_kind",
            "recorded_at",
            "replay_digest",
            "schema",
            "source_manifest_sha256",
            "vertical_id",
        ],
        "title": f"{vertical_id} Decision Receipt",
        "type": "object",
    }


def _route_contract(vertical_id: str, common: Mapping[str, Any]) -> dict[str, Any]:
    prefix = f"/v1/verticals/{vertical_id}"
    return {
        **common,
        "authentication": "PER_ROUTE",
        "default_network_binding": "LOOPBACK_ONLY",
        "external_effectors": False,
        "routes": [
            {
                "authentication": "NOT_REQUIRED",
                "method": "GET",
                "path": prefix,
                "purpose": "read the admitted source-cell identity",
                "response_contract": "vertical_manifest.source_cell",
                "side_effects": False,
            },
            {
                "authentication": "REQUIRED",
                "method": "POST",
                "path": f"{prefix}/decisions/evaluate",
                "purpose": "record a bounded recommendation, denial, or escalation receipt",
                "request_contract": "ontology.schema.json",
                "response_contract": "receipt.schema.json",
                "side_effects": "LOCAL_LEDGER_ONLY",
            },
            {
                "authentication": "REQUIRED",
                "method": "POST",
                "path": f"{prefix}/decisions/{{decision_id}}/human-disposition",
                "purpose": "append a caller-declared human disposition; no provider action",
                "request_contract": "szl.vertical-human-disposition-request/v1",
                "response_contract": "receipt.schema.json",
                "side_effects": "LOCAL_LEDGER_ONLY",
            },
            {
                "authentication": "REQUIRED",
                "method": "GET",
                "path": f"{prefix}/receipts/{{receipt_id}}",
                "purpose": "read a decision receipt",
                "response_contract": "receipt.schema.json",
                "side_effects": False,
            },
        ],
        "schema": "szl.vertical-route-contract/v2",
    }


def _formula_projection(formula: Mapping[str, Any]) -> dict[str, Any]:
    return {
        "allowed_runtime_binding": formula["allowed_runtime_binding"],
        "formula_id": formula["formula_id"],
        "grants_authority": False,
        "name": formula["name"],
        "prohibited_claim": formula["prohibited_claim"],
        "proof_class": formula["proof_class"],
        "source_url": formula["source_url"],
    }


def _compiled_readme(cell: Mapping[str, Any], manifest_sha256: str) -> str:
    workflows = "\n".join(f"- {item}" for item in cell["core_workflows"])
    authorities = "\n".join(f"- {item}" for item in cell["human_authority"])
    prohibitions = "\n".join(f"- {item}" for item in cell["prohibited_actions"])
    return (
        f"# {cell['display_name']}\n\n"
        "> **Evidence status: MODELED.** This directory is deterministic local "
        "source output, not deployment or runtime proof.\n\n"
        f"- Vertical ID: `{cell['vertical_id']}`\n"
        f"- Planned Space: `{cell['hf_space_id']}`\n"
        f"- Planned visibility: `{cell['space_visibility']}`\n"
        f"- Source manifest SHA-256: `{manifest_sha256}`\n\n"
        "## Decision problem\n\n"
        f"{cell['decision_problem']}\n\n"
        "## Modeled workflows\n\n"
        f"{workflows}\n\n"
        "## Human authority\n\n"
        f"{authorities}\n\n"
        "## Prohibited actions\n\n"
        f"{prohibitions}\n\n"
        "Formula results are advisory and grant no authority. Provider mutation "
        "and external effectors are outside this compiled contract.\n"
    )


def _build_manifest(
    *,
    vertical_id: str,
    captured_at: str,
    profile_sha256: str,
    source_manifest_sha256: str,
    peer_bytes: Mapping[str, bytes],
) -> dict[str, Any]:
    files = [
        {
            "bytes": len(peer_bytes[name]),
            "path": name,
            "sha256": _sha256(peer_bytes[name]),
        }
        for name in sorted(peer_bytes)
    ]
    return {
        "canonical_json_algorithm": CANONICAL_JSON_ALGORITHM,
        "captured_at": captured_at,
        "excluded_from_peer_digest": ["build_manifest.json"],
        "file_count": len(files),
        "files": files,
        "peer_tree_sha256": _tree_digest_for_bytes(peer_bytes),
        "profile_sha256": profile_sha256,
        "schema": "szl.vertical-build-manifest/v1",
        "source_manifest_sha256": source_manifest_sha256,
        "tree_digest_algorithm": TREE_DIGEST_ALGORITHM,
        "tree_digest_id": TREE_DIGEST_ID,
        "vertical_id": vertical_id,
    }


def _tree_digest_for_bytes(files: Mapping[str, bytes]) -> str:
    digest = hashlib.sha256()
    digest.update(TREE_DIGEST_DOMAIN)
    for name in sorted(files):
        digest.update(name.encode("utf-8"))
        digest.update(b"\0")
        digest.update(_sha256(files[name]).encode("ascii"))
        digest.update(b"\n")
    return digest.hexdigest()


def _prepare_output_roots(
    profile_path: Path,
    vertical_root: Path,
    compiled_root: Path,
    cells: list[Mapping[str, Any]],
    *,
    clean: bool,
) -> None:
    issues: list[str] = []
    for label, raw_root in (
        ("vertical_dir", vertical_root),
        ("out_dir", compiled_root),
    ):
        absolute_root = Path(os.path.abspath(raw_root))
        linked_component = next(
            (
                candidate
                for candidate in (absolute_root, *absolute_root.parents)
                if _is_link_or_reparse_point(candidate)
            ),
            None,
        )
        if linked_component is not None:
            issues.append(
                f"{label}: output path may not traverse a symlink, junction, or reparse point: {linked_component}"
            )
    if issues:
        raise ValidationError(issues)

    profile_resolved = profile_path.resolve()
    vertical_resolved = vertical_root.resolve()
    compiled_resolved = compiled_root.resolve()
    issues = []

    if _paths_overlap(vertical_resolved, compiled_resolved):
        issues.append(
            f"output roots: {vertical_resolved} and {compiled_resolved} must be distinct, non-overlapping directories"
        )
    for label, root in (
        ("vertical_dir", vertical_resolved),
        ("out_dir", compiled_resolved),
    ):
        if root.exists() and not root.is_dir():
            issues.append(f"{label}: {root} exists but is not a directory")
        if root == profile_resolved or root in profile_resolved.parents:
            issues.append(
                f"{label}: {root} contains the input profile; outputs must not overlap source data"
            )
    if issues:
        raise ValidationError(issues)

    expected_vertical_files = {f"{cell['vertical_id']}.json" for cell in cells}
    expected_compiled_files = {"compiled_index.json"}
    for cell in cells:
        expected_compiled_files.update(
            f"{cell['vertical_id']}/{name}" for name in CELL_ARTIFACT_NAMES
        )
    _reject_unexpected_files(vertical_resolved, expected_vertical_files, "vertical_dir")
    _reject_unexpected_files(compiled_resolved, expected_compiled_files, "out_dir")
    # All admission checks have completed. Invalidate the old generation before
    # cleaning can delete a peer file or a new generation can write source bytes.
    _invalidate_validity_markers(compiled_resolved, cells)
    if clean:
        _remove_expected_files(vertical_resolved, expected_vertical_files)
        _remove_expected_files(compiled_resolved, expected_compiled_files)


def _reject_unexpected_files(root: Path, expected: set[str], label: str) -> None:
    if not root.exists():
        return
    actual: set[str] = set()
    actual_directories: set[str] = set()
    symlinks: list[str] = []
    special_entries: list[str] = []
    expected_directories = {
        parent.as_posix()
        for relative in expected
        if (parent := Path(relative).parent) != Path(".")
    }
    for path in root.rglob("*"):
        relative = path.relative_to(root).as_posix()
        if _is_link_or_reparse_point(path):
            symlinks.append(relative)
        elif path.is_file():
            actual.add(relative)
        elif path.is_dir():
            actual_directories.add(relative)
        else:
            special_entries.append(relative)
    unexpected = sorted(actual - expected)
    unexpected_directories = sorted(actual_directories - expected_directories)
    issues: list[str] = []
    if symlinks:
        issues.append(
            f"{label}: symlinks are not admitted: {sorted(symlinks)!r}; remove them or use a dedicated clean output root"
        )
    if unexpected:
        issues.append(
            f"{label}: unexpected stale files {unexpected!r}; remove them from the dedicated output root"
        )
    if unexpected_directories:
        issues.append(
            f"{label}: unexpected directories {unexpected_directories!r}; use a dedicated compiler output root"
        )
    if special_entries:
        issues.append(
            f"{label}: unsupported filesystem entries {sorted(special_entries)!r}"
        )
    if issues:
        raise ValidationError(issues)


def _is_link_or_reparse_point(path: Path) -> bool:
    if path.is_symlink():
        return True
    is_junction = getattr(path, "is_junction", None)
    if callable(is_junction) and is_junction():
        return True
    try:
        attributes = getattr(path.lstat(), "st_file_attributes", 0)
    except FileNotFoundError:
        return False
    return bool(attributes & 0x400)


def _remove_expected_files(root: Path, expected: set[str]) -> None:
    if not root.exists():
        return
    for relative in sorted(expected, reverse=True):
        path = root / Path(relative)
        if path.is_file() and not path.is_symlink():
            path.unlink()
    admitted_directories = {
        root / parent
        for relative in expected
        if (parent := Path(relative).parent) != Path(".")
    }
    for directory in sorted(
        admitted_directories, key=lambda path: len(path.parts), reverse=True
    ):
        if _is_link_or_reparse_point(directory) or not directory.is_dir():
            continue
        try:
            directory.rmdir()
        except OSError:
            # Directory pruning is best effort; admitted-file deletion errors
            # above still propagate, and later writes can reuse directories.
            pass


def _invalidate_validity_markers(
    compiled_root: Path, cells: list[Mapping[str, Any]]
) -> None:
    """Remove old validity markers before mutating any compiled peer bytes."""

    markers = [compiled_root / "compiled_index.json"]
    markers.extend(
        compiled_root / str(cell["vertical_id"]) / "build_manifest.json"
        for cell in cells
    )
    for marker in markers:
        if _is_link_or_reparse_point(marker):
            raise ValidationError(
                f"out_dir: validity marker may not be a link or reparse point: {marker}"
            )
        if marker.is_file():
            marker.unlink()


def _paths_overlap(left: Path, right: Path) -> bool:
    return left == right or left in right.parents or right in left.parents


def _atomic_write_bytes(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            dir=path.parent,
            prefix=f".{path.name}.",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temporary.write(content)
            temporary.flush()
            os.fsync(temporary.fileno())
            temporary_name = temporary.name
        os.replace(temporary_name, path)
    finally:
        if temporary_name is not None:
            temporary_path = Path(temporary_name)
            if temporary_path.exists():
                temporary_path.unlink()


def _sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


__all__ = [
    "CANONICAL_JSON_ALGORITHM",
    "CELL_ARTIFACT_NAMES",
    "COMPILER_SCHEMA",
    "COMPILER_VERSION",
    "TREE_DIGEST_ALGORITHM",
    "TREE_DIGEST_ID",
    "ValidationError",
    "canonical_json_bytes",
    "compile_profile",
    "compute_tree_sha256",
    "load_profile",
    "validate_profile",
]
