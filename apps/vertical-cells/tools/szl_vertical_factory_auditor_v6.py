"""Offline structural and deterministic auditor for Packet 6 source.

The auditor never connects to GitHub, Hugging Face, DNS, or a deployed runtime.
It binds an optional supplied profile to the checked-in catalog and, outside
``--validate-only`` mode, compiles twice into temporary directories to prove
local byte reproducibility.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any, Mapping, Sequence


APP_ROOT = Path(__file__).resolve().parents[1]
TOOLS_ROOT = Path(__file__).resolve().parent
EXPECTED_COMPILER = TOOLS_ROOT / "szl_vertical_cell_compiler_v6.py"
MANIFEST_ROOT = APP_ROOT / "manifests"
REGISTRY_ROOT = APP_ROOT / "registries"
TREE_DIGEST_DOMAIN = b"szl-tree-sha256-v1\n"
sys.path.insert(0, str(APP_ROOT))

from szl_factory import (  # noqa: E402
    CELL_ARTIFACT_NAMES,
    FORMULA_VERTICAL_ALIASES,
    canonical_json_bytes,
    compile_profile,
    compute_tree_sha256,
    validate_profile,
)


def _sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()


def _parse_strict_json(raw: str, label: str | Path) -> Any:
    def reject_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
        result: dict[str, Any] = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f"duplicate JSON object key in {label}: {key}")
            result[key] = value
        return result

    return json.loads(raw, object_pairs_hook=reject_duplicates)


def _read_strict_json(path: Path) -> Any:
    return _parse_strict_json(path.read_text(encoding="utf-8"), path)


def _file_bytes(root: Path) -> dict[str, bytes]:
    return {
        path.relative_to(root).as_posix(): path.read_bytes()
        for path in sorted(root.rglob("*"))
        if path.is_file()
    }


def _peer_tree_digest(files: Mapping[str, bytes]) -> str:
    digest = hashlib.sha256()
    digest.update(TREE_DIGEST_DOMAIN)
    for name in sorted(files):
        digest.update(name.encode("utf-8"))
        digest.update(b"\0")
        digest.update(_sha256(files[name]).encode("ascii"))
        digest.update(b"\n")
    return digest.hexdigest()


def _checked_in_catalog() -> tuple[
    dict[str, Any],
    dict[str, Any],
    dict[str, dict[str, Any]],
    dict[str, str],
    list[str],
]:
    issues: list[str] = []
    registry_path = REGISTRY_ROOT / "formula_bindings.json"
    alias_path = REGISTRY_ROOT / "formula_aliases.json"
    registry = _read_strict_json(registry_path)
    aliases = _read_strict_json(alias_path)
    if not isinstance(registry, dict):
        raise ValueError("formula registry must be a JSON object")
    if not isinstance(aliases, dict):
        raise ValueError("formula alias registry must be a JSON object")

    registry_digest = _sha256(registry_path.read_bytes())
    sidecar_path = REGISTRY_ROOT / "formula_bindings.sha256"
    sidecar = sidecar_path.read_text(encoding="ascii").strip().split()
    if sidecar != [registry_digest, registry_path.name]:
        issues.append(
            "formula registry checksum sidecar does not match checked-in bytes"
        )

    manifest_entries = sorted(MANIFEST_ROOT.iterdir())
    if any(
        path.is_symlink() or not path.is_file() or path.suffix != ".json"
        for path in manifest_entries
    ):
        issues.append("manifest directory must contain only regular JSON files")
    cells: dict[str, dict[str, Any]] = {}
    manifest_digests: dict[str, str] = {}
    for path in manifest_entries:
        if path.suffix != ".json" or not path.is_file():
            continue
        cell = _read_strict_json(path)
        if not isinstance(cell, dict):
            issues.append(f"checked-in manifest {path.name} must be a JSON object")
            continue
        vertical_id = cell.get("vertical_id")
        if not isinstance(vertical_id, str):
            issues.append(f"checked-in manifest {path.name} has no vertical_id")
            continue
        if path.name != f"{vertical_id}.json":
            issues.append(
                f"checked-in manifest filename {path.name} does not match {vertical_id}"
            )
        if vertical_id in cells:
            issues.append(f"duplicate checked-in vertical_id {vertical_id}")
            continue
        cells[vertical_id] = cell
        manifest_digests[vertical_id] = _sha256(path.read_bytes())

    expected_registry_files = {
        "formula_aliases.json",
        "formula_bindings.json",
        "formula_bindings.sha256",
    }
    actual_registry_files = {path.name for path in REGISTRY_ROOT.iterdir()}
    if actual_registry_files != expected_registry_files:
        issues.append("registry directory has missing or unexpected files")
    return registry, aliases, cells, manifest_digests, issues


def _checked_in_profile(
    registry: Mapping[str, Any], cells: Mapping[str, Mapping[str, Any]]
) -> dict[str, Any]:
    return {
        "captured_at": registry.get("captured_at"),
        "counts": {"vertical_cells": len(cells)},
        "formula_bindings": registry.get("formulas"),
        "schema": "szl.estate-vertical-factory-profile/v6",
        "vertical_cells": [dict(cells[key]) for key in sorted(cells)],
    }


def _binding_issues(
    profile: Mapping[str, Any],
    registry: Mapping[str, Any],
    alias_registry: Mapping[str, Any],
    cells: Mapping[str, Mapping[str, Any]],
) -> list[str]:
    issues: list[str] = []
    if set(registry) != {"captured_at", "formulas", "schema"}:
        issues.append("checked-in formula registry has an invalid strict shape")
    if registry.get("schema") != "szl.formula-binding-registry/v1":
        issues.append("checked-in formula registry schema is invalid")

    expected_alias_keys = {"aliases", "captured_at", "global_scope", "schema"}
    if set(alias_registry) != expected_alias_keys:
        issues.append("checked-in formula alias registry has an invalid strict shape")
    if alias_registry.get("schema") != "szl.formula-vertical-aliases/v1":
        issues.append("checked-in formula alias registry schema is invalid")
    if alias_registry.get("global_scope") != "all":
        issues.append("checked-in formula alias global scope must equal 'all'")
    if alias_registry.get("aliases") != FORMULA_VERTICAL_ALIASES:
        issues.append("checked-in formula aliases differ from the canonical mapping")

    captured_at = profile.get("captured_at")
    if captured_at != registry.get("captured_at"):
        issues.append("supplied profile capture time differs from the formula registry")
    if captured_at != alias_registry.get("captured_at"):
        issues.append("supplied profile capture time differs from the alias registry")
    if profile.get("formula_bindings") != registry.get("formulas"):
        issues.append("supplied profile formulas differ from the checked-in registry")

    counts = profile.get("counts")
    if not isinstance(counts, Mapping) or counts.get("vertical_cells") != len(cells):
        issues.append(
            "supplied profile vertical count differs from the checked-in catalog"
        )

    supplied_cells = profile.get("vertical_cells")
    supplied_by_id: dict[str, Mapping[str, Any]] = {}
    if not isinstance(supplied_cells, list):
        issues.append("supplied profile vertical_cells must be an array")
        return issues
    for index, cell in enumerate(supplied_cells):
        if not isinstance(cell, Mapping) or not isinstance(
            cell.get("vertical_id"), str
        ):
            issues.append(
                f"supplied profile vertical_cells[{index}] has no vertical_id"
            )
            continue
        vertical_id = str(cell["vertical_id"])
        if vertical_id in supplied_by_id:
            issues.append(f"supplied profile has duplicate vertical_id {vertical_id}")
            continue
        supplied_by_id[vertical_id] = cell
    if set(supplied_by_id) != set(cells):
        issues.append("supplied profile vertical IDs differ from checked-in manifests")
    for vertical_id in sorted(set(supplied_by_id) & set(cells)):
        if dict(supplied_by_id[vertical_id]) != dict(cells[vertical_id]):
            issues.append(
                f"supplied profile cell {vertical_id} differs from its checked-in manifest"
            )
    return issues


def _verify_compiled_tree(
    source_root: Path,
    compiled_root: Path,
    result: Mapping[str, Any],
    expected_ids: set[str],
) -> list[str]:
    issues: list[str] = []
    source_files = _file_bytes(source_root)
    compiled_files = _file_bytes(compiled_root)
    expected_compiled_count = 1 + len(expected_ids) * len(CELL_ARTIFACT_NAMES)
    if set(source_files) != {f"{vertical_id}.json" for vertical_id in expected_ids}:
        issues.append("compiled source tree has missing or unexpected files")
    if len(compiled_files) != expected_compiled_count:
        issues.append(
            f"compiled tree expected {expected_compiled_count} files, found {len(compiled_files)}"
        )
    if result.get("compiled_verticals") != len(expected_ids):
        issues.append("compiler result has an incorrect vertical count")
    if result.get("source_tree_sha256") != compute_tree_sha256(source_root):
        issues.append("compiler result source tree digest does not match output bytes")
    if result.get("tree_sha256") != compute_tree_sha256(compiled_root):
        issues.append(
            "compiler result compiled tree digest does not match output bytes"
        )

    index_path = compiled_root / "compiled_index.json"
    if not index_path.is_file():
        issues.append("compiled index marker is missing")
        return issues
    index = _read_strict_json(index_path)
    if not isinstance(index, Mapping):
        issues.append("compiled index marker is not an object")
        return issues
    if index.get("schema") != "szl.compiled-vertical-index/v1":
        issues.append("compiled index schema is invalid")
    if index.get("evidence_status") != "MODELED":
        issues.append("compiled index must retain MODELED evidence status")
    if index.get("compiled_verticals") != len(expected_ids):
        issues.append("compiled index vertical count is invalid")
    if index.get("profile_sha256") != result.get("profile_sha256"):
        issues.append("compiled index profile digest differs from compiler result")
    if index.get("source_tree_sha256") != result.get("source_tree_sha256"):
        issues.append("compiled index source digest differs from compiler result")

    entries = index.get("verticals")
    index_by_id: dict[str, Mapping[str, Any]] = {}
    if not isinstance(entries, list):
        issues.append("compiled index vertical entries must be an array")
        return issues
    for entry in entries:
        if not isinstance(entry, Mapping) or not isinstance(
            entry.get("vertical_id"), str
        ):
            issues.append("compiled index contains an invalid vertical entry")
            continue
        index_by_id[str(entry["vertical_id"])] = entry
    if set(index_by_id) != expected_ids:
        issues.append("compiled index vertical IDs differ from the admitted seven")

    for vertical_id in sorted(expected_ids):
        cell_root = compiled_root / vertical_id
        names = (
            {path.name for path in cell_root.iterdir()} if cell_root.is_dir() else set()
        )
        if names != set(CELL_ARTIFACT_NAMES):
            issues.append(f"{vertical_id}: compiled artifact set is incomplete")
            continue
        build_path = cell_root / "build_manifest.json"
        build = _read_strict_json(build_path)
        if not isinstance(build, Mapping):
            issues.append(f"{vertical_id}: build manifest is not an object")
            continue
        if build.get("schema") != "szl.vertical-build-manifest/v1":
            issues.append(f"{vertical_id}: build manifest schema is invalid")
        if build.get("vertical_id") != vertical_id:
            issues.append(f"{vertical_id}: build manifest identity is invalid")
        if build.get("profile_sha256") != result.get("profile_sha256"):
            issues.append(f"{vertical_id}: build manifest profile digest is invalid")
        if build.get("excluded_from_peer_digest") != ["build_manifest.json"]:
            issues.append(f"{vertical_id}: build manifest exclusion is invalid")

        peers = {
            name: (cell_root / name).read_bytes()
            for name in CELL_ARTIFACT_NAMES
            if name != "build_manifest.json"
        }
        declared_files = build.get("files")
        declared_by_path: dict[str, Mapping[str, Any]] = {}
        if isinstance(declared_files, list):
            for item in declared_files:
                if isinstance(item, Mapping) and isinstance(item.get("path"), str):
                    declared_by_path[str(item["path"])] = item
        if set(declared_by_path) != set(peers):
            issues.append(f"{vertical_id}: build manifest peer set is invalid")
        for name, content in peers.items():
            declared = declared_by_path.get(name, {})
            if declared.get("bytes") != len(content) or declared.get(
                "sha256"
            ) != _sha256(content):
                issues.append(f"{vertical_id}: build manifest digest drift for {name}")
        if build.get("file_count") != len(peers):
            issues.append(f"{vertical_id}: build manifest file count is invalid")
        if build.get("peer_tree_sha256") != _peer_tree_digest(peers):
            issues.append(f"{vertical_id}: build manifest peer tree digest is invalid")

        index_entry = index_by_id.get(vertical_id, {})
        if index_entry.get("build_manifest_sha256") != _sha256(build_path.read_bytes()):
            issues.append(f"{vertical_id}: index build-manifest digest is invalid")
        source_path = source_root / f"{vertical_id}.json"
        source_digest = _sha256(source_path.read_bytes())
        if build.get("source_manifest_sha256") != source_digest:
            issues.append(f"{vertical_id}: build source-manifest digest is invalid")
        if index_entry.get("source_manifest_sha256") != source_digest:
            issues.append(f"{vertical_id}: index source-manifest digest is invalid")
    return issues


def _run_determinism(
    profile: Mapping[str, Any],
    expected_ids: set[str],
) -> tuple[dict[str, Any], list[str]]:
    issues: list[str] = []
    snapshot_bytes = canonical_json_bytes(profile)
    snapshot_sha256 = _sha256(snapshot_bytes)
    with tempfile.TemporaryDirectory(prefix="szl-packet6-audit-") as temporary:
        root = Path(temporary)
        # Compile exactly the loaded and validated snapshot. Re-reading the
        # caller's path here could audit a different profile after binding.
        compile_profile_path = root / "validated-profile-snapshot.json"
        compile_profile_path.write_bytes(snapshot_bytes)

        first = compile_profile(
            compile_profile_path,
            root / "source-a",
            root / "compiled-a",
        )
        second = compile_profile(
            compile_profile_path,
            root / "source-b",
            root / "compiled-b",
        )
        for result in (first, second):
            if result.get("profile_sha256") != snapshot_sha256:
                issues.append(
                    "compiler profile digest differs from the validated snapshot"
                )
        if first != second:
            issues.append("compiler result digests differ across two clean roots")
        if _file_bytes(root / "source-a") != _file_bytes(root / "source-b"):
            issues.append("compiled source files differ across two clean roots")
        if _file_bytes(root / "compiled-a") != _file_bytes(root / "compiled-b"):
            issues.append("compiled artifact files differ across two clean roots")
        issues.extend(
            _verify_compiled_tree(
                root / "source-a", root / "compiled-a", first, expected_ids
            )
        )
        issues.extend(
            _verify_compiled_tree(
                root / "source-b", root / "compiled-b", second, expected_ids
            )
        )
        evidence = {
            "compiled_file_count": len(_file_bytes(root / "compiled-a")),
            "compiled_tree_sha256": first.get("tree_sha256"),
            "compiled_verticals": first.get("compiled_verticals"),
            "profile_sha256": first.get("profile_sha256"),
            "source_file_count": len(_file_bytes(root / "source-a")),
            "source_tree_sha256": first.get("source_tree_sha256"),
            "status": "PASS" if not issues else "BLOCKED",
        }
    return evidence, issues


def audit(
    profile_path: Path | None = None,
    *,
    compiler_path: Path | None = None,
    validate_only: bool = False,
) -> dict[str, Any]:
    registry, aliases, cells, manifest_digests, issues = _checked_in_catalog()
    if profile_path is not None:
        # One read binds the raw file identity to the parsed snapshot identity.
        profile_bytes = profile_path.read_bytes()
        profile = _parse_strict_json(profile_bytes.decode("utf-8"), profile_path)
        if not isinstance(profile, dict):
            raise ValueError("supplied profile must be a JSON object")
    else:
        profile = _checked_in_profile(registry, cells)
        profile_bytes = canonical_json_bytes(profile)
    issues.extend(validate_profile(profile))
    issues.extend(_binding_issues(profile, registry, aliases, cells))

    compiler_binding: dict[str, Any] = {
        "execution": "IN_PROCESS_OFFLINE",
        "launcher_sha256": _sha256(EXPECTED_COMPILER.read_bytes()),
        "status": "PASS",
    }
    if compiler_path is not None:
        if compiler_path.is_symlink() or not compiler_path.is_file():
            issues.append("supplied compiler must be a regular local file")
            compiler_binding["status"] = "BLOCKED"
        elif compiler_path.resolve() != EXPECTED_COMPILER.resolve():
            issues.append("supplied compiler is not the admitted Packet 6 launcher")
            compiler_binding["status"] = "BLOCKED"

    determinism: dict[str, Any] = {"status": "NOT_RUN"}
    if not validate_only and not issues:
        determinism, determinism_issues = _run_determinism(profile, set(cells))
        issues.extend(determinism_issues)
    elif not validate_only:
        determinism = {"status": "BLOCKED"}

    snapshot_issues: list[str] = []
    snapshot_status = "GENERATED_FROM_CHECKED_IN_CATALOG"
    if profile_path is not None:
        try:
            if profile_path.read_bytes() != profile_bytes:
                snapshot_issues.append(
                    "supplied profile changed during the audit; source binding is blocked"
                )
        except OSError:
            snapshot_issues.append(
                "supplied profile became unavailable during the audit; source binding is blocked"
            )
        snapshot_status = (
            "BLOCKED_INPUT_CHANGED_OR_UNAVAILABLE"
            if snapshot_issues
            else "UNCHANGED_AT_READBACK"
        )
    issues.extend(snapshot_issues)
    issues = list(dict.fromkeys(issues))
    status = "PASS" if not issues else "BLOCKED"
    binding_status = (
        "PASS"
        if not _binding_issues(profile, registry, aliases, cells)
        and not snapshot_issues
        else "BLOCKED"
    )
    return {
        "alias_registry_sha256": _sha256(
            (REGISTRY_ROOT / "formula_aliases.json").read_bytes()
        ),
        "captured_at": profile.get("captured_at"),
        "compiler_binding": compiler_binding,
        "compiler_determinism": determinism,
        "connected_estate_audit": {
            "availability": "UNAVAILABLE",
            "reason": "This auditor is deliberately offline and has no provider credentials or network client.",
            "status": "NOT_RUN",
        },
        "evidence_scope": "LOCAL_SOURCE_AND_DETERMINISM_ONLY",
        "formula_count": len(registry.get("formulas", [])),
        "formula_registry_sha256": _sha256(
            (REGISTRY_ROOT / "formula_bindings.json").read_bytes()
        ),
        "issues": issues,
        "manifest_sha256": dict(sorted(manifest_digests.items())),
        "mode": "VALIDATE_ONLY" if validate_only else "FULL_DETERMINISM",
        "network_calls": 0,
        "profile_binding_status": binding_status,
        "profile_canonical_sha256": _sha256(canonical_json_bytes(profile)),
        "profile_file_sha256": _sha256(profile_bytes),
        "profile_snapshot_status": snapshot_status,
        "provider_mutations": 0,
        "schema": "szl.vertical-factory-audit/v2",
        "status": status,
        "vertical_count": len(cells),
    }


def _write_receipt(output_root: Path, report: Mapping[str, Any]) -> None:
    if output_root.is_symlink() or (output_root.exists() and not output_root.is_dir()):
        raise ValueError("--out must be a regular local directory")
    output_root.mkdir(parents=True, exist_ok=True)
    target = output_root / "run_receipt.json"
    if target.is_symlink():
        raise ValueError("run_receipt.json may not be a symlink")
    temporary_name: str | None = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="wb",
            dir=output_root,
            prefix=".run_receipt.",
            suffix=".tmp",
            delete=False,
        ) as temporary:
            temporary.write(canonical_json_bytes(report))
            temporary.flush()
            os.fsync(temporary.fileno())
            temporary_name = temporary.name
        os.replace(temporary_name, target)
    finally:
        if temporary_name is not None:
            temporary_path = Path(temporary_name)
            if temporary_path.exists():
                temporary_path.unlink()


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="szl-estate-vertical-auditor-v6")
    parser.add_argument("--profile", type=Path)
    parser.add_argument("--compiler", type=Path)
    parser.add_argument("--validate-only", action="store_true")
    parser.add_argument("--out", type=Path)
    args = parser.parse_args(argv)
    try:
        report = audit(
            args.profile,
            compiler_path=args.compiler,
            validate_only=args.validate_only,
        )
        if args.out is not None:
            _write_receipt(args.out, report)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        report = {
            "connected_estate_audit": {
                "availability": "UNAVAILABLE",
                "status": "NOT_RUN",
            },
            "evidence_scope": "LOCAL_SOURCE_AND_DETERMINISM_ONLY",
            "issues": [str(error)],
            "network_calls": 0,
            "provider_mutations": 0,
            "schema": "szl.vertical-factory-audit/v2",
            "status": "BLOCKED",
        }
    sys.stdout.buffer.write(canonical_json_bytes(report))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
