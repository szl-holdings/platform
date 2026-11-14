#!/usr/bin/env python3
"""Emit a deterministic CycloneDX SBOM from one or more exact pip locks."""

from __future__ import annotations

import argparse
import hashlib
import json
import tomllib
from pathlib import Path
from urllib.parse import quote

from verify_dependency_locks import LockedRequirement, parse_lock


ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lock", action="append", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--variant", required=True)
    args = parser.parse_args()

    merged: dict[str, LockedRequirement] = {}
    lock_digests: list[tuple[str, str]] = []
    indexes: set[str] = set()
    for lock_path in args.lock:
        entries, lock_indexes = parse_lock(lock_path)
        for name, entry in entries.items():
            existing = merged.get(name)
            if existing and existing != entry:
                raise SystemExit(
                    f"{lock_path}: {name} conflicts with an earlier lock: "
                    f"{existing.version} != {entry.version}"
                )
            merged[name] = entry
        lock_digests.append(
            (lock_path.name, hashlib.sha256(lock_path.read_bytes()).hexdigest())
        )
        indexes.update(lock_indexes)

    project = tomllib.loads((ROOT / "pyproject.toml").read_text())["project"]
    components = []
    for name in sorted(merged):
        entry = merged[name]
        purl = f"pkg:pypi/{quote(name)}@{quote(entry.version)}"
        components.append(
            {
                "type": "library",
                "bom-ref": purl,
                "name": name,
                "version": entry.version,
                "purl": purl,
                "properties": [
                    {"name": "szl:pip:allowed-sha256", "value": digest}
                    for digest in entry.hashes
                ],
            }
        )

    properties = [
        {"name": "szl:substrate:variant", "value": args.variant},
        *[
            {"name": f"szl:pip:lock-sha256:{name}", "value": digest}
            for name, digest in sorted(lock_digests)
        ],
        *[
            {"name": "szl:pip:index", "value": index}
            for index in sorted(indexes)
        ],
    ]
    document = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "version": 1,
        "metadata": {
            "component": {
                "type": "application",
                "name": project["name"],
                "version": project["version"],
            },
            "properties": properties,
        },
        "components": components,
    }
    args.output.write_text(json.dumps(document, indent=2, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
