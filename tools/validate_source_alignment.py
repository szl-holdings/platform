#!/usr/bin/env python3
"""Validate the SZL GitHub to Hugging Face source-alignment registry."""

from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "docs" / "source-alignment" / "estate-source-map.json"

ALLOWED_TYPES = {"model", "dataset", "space"}
REQUIRED_PATH_GROUPS = {"backend", "frontend", "tests"}


def _is_safe_repo_path(value: str) -> bool:
    path = Path(value)
    return bool(value) and not path.is_absolute() and ".." not in path.parts


def validate(registry: dict) -> list[str]:
    errors: list[str] = []

    if registry.get("schema") != "szl.github-hf-source-alignment/v1":
        errors.append("unexpected schema")
    if registry.get("organization") != {
        "github": "szl-holdings",
        "huggingface": "SZLHOLDINGS",
    }:
        errors.append("organization names must be szl-holdings and SZLHOLDINGS")

    policy = registry.get("policy")
    if not isinstance(policy, dict):
        errors.append("policy is required")
    else:
        if policy.get("github_role") != "canonical_source":
            errors.append("GitHub must be the canonical source")
        if policy.get("source_ref") != "protected_main":
            errors.append("source_ref must be protected_main")
        if policy.get("publication_authority") != "repository_owned_workflow_only":
            errors.append("publication must remain workflow-owned")

    components = registry.get("components")
    if not isinstance(components, list) or not components:
        errors.append("components must be a non-empty list")
        return errors

    seen_ids: set[str] = set()
    for component in components:
        component_id = component.get("id")
        if not isinstance(component_id, str) or not component_id:
            errors.append("every component needs a non-empty id")
            continue
        if component_id in seen_ids:
            errors.append(f"duplicate component id: {component_id}")
        seen_ids.add(component_id)

        github = component.get("github")
        if not isinstance(github, dict):
            errors.append(f"{component_id}: github block is required")
            continue
        repo = github.get("repository")
        if not isinstance(repo, str) or not repo.startswith("szl-holdings/"):
            errors.append(f"{component_id}: repository must be under szl-holdings")
        if github.get("ref") != "main":
            errors.append(f"{component_id}: source ref must be main")

        source_paths = github.get("source_paths")
        if not isinstance(source_paths, dict):
            errors.append(f"{component_id}: source_paths is required")
        else:
            missing = REQUIRED_PATH_GROUPS - set(source_paths)
            errors.extend(
                f"{component_id}: missing source path group {name}"
                for name in sorted(missing)
            )
            for group, paths in source_paths.items():
                if not isinstance(paths, list) or not paths:
                    errors.append(f"{component_id}: {group} paths must be non-empty")
                for path in paths if isinstance(paths, list) else []:
                    if not isinstance(path, str) or not _is_safe_repo_path(path):
                        errors.append(f"{component_id}: unsafe source path {path!r}")

        huggingface = component.get("huggingface")
        if not isinstance(huggingface, dict):
            errors.append(f"{component_id}: huggingface block is required")
            continue
        targets = huggingface.get("targets")
        if not isinstance(targets, list):
            errors.append(f"{component_id}: huggingface.targets must be a list")
            continue
        for target in targets:
            if not isinstance(target, dict):
                errors.append(f"{component_id}: invalid Hugging Face target")
                continue
            target_id = target.get("id")
            if not isinstance(target_id, str) or "/" not in target_id:
                errors.append(f"{component_id}: Hugging Face target needs org/name")
            if target.get("type") not in ALLOWED_TYPES:
                errors.append(f"{component_id}: invalid Hugging Face target type")
            if target.get("role") not in {
                "runtime_mirror",
                "release_artifact",
                "evidence_artifact",
                "bounded_public_data_artifact",
            }:
                errors.append(f"{component_id}: target role is missing or invalid")

    return errors


def main() -> int:
    try:
        registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"source-alignment: cannot read registry: {exc}", file=sys.stderr)
        return 2

    errors = validate(registry)
    if errors:
        for error in errors:
            print(f"FAIL: {error}", file=sys.stderr)
        return 1

    print(f"source-alignment: valid ({len(registry['components'])} components)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
