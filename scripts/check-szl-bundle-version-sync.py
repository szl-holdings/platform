#!/usr/bin/env python3
"""Verify that each SZL package's zarf.yaml `version:` matches the corresponding
`ref:` entry in the top-level uds-bundle.yaml.

Exits non-zero (and prints a clear message naming every mismatched package)
when any version is out of sync. Run from the repo root.

Why this exists: SZL releases require bumping the version in four files in
lockstep (a11oy/sentra/amaru zarf.yaml + uds-bundle.yaml). If any one drifts,
the bundle ships a `ref:` that points at a package version that doesn't exist.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SZL = ROOT / "docs" / "proposals" / "defense-unicorns" / "szl-holdings"

PACKAGES = ["a11oy", "sentra", "amaru"]
BUNDLE = SZL / "uds-mesh" / "uds-bundle.yaml"


def read_zarf_version(pkg: str) -> str:
    path = SZL / pkg / "deploy" / "zarf.yaml"
    text = path.read_text(encoding="utf-8")
    # metadata: → name: <pkg> → version: <v>
    m = re.search(
        r"^metadata:\s*\n(?:[ \t]+.*\n)*?[ \t]+version:\s*([^\s#]+)",
        text,
        flags=re.MULTILINE,
    )
    if not m:
        sys.exit(f"ERROR: could not find metadata.version in {path}")
    return m.group(1).strip()


def read_bundle_refs() -> dict[str, str]:
    text = BUNDLE.read_text(encoding="utf-8")
    refs: dict[str, str] = {}
    # Each package block: `- name: <pkg>` ... `ref: <v>` (uncommented).
    pattern = re.compile(
        r"-\s*name:\s*(\S+)\s*\n"
        r"(?:[ \t]+(?!-\s*name:).*\n)*?"
        r"[ \t]+ref:\s*([^\s#]+)",
        flags=re.MULTILINE,
    )
    for name, ref in pattern.findall(text):
        refs[name] = ref.strip()
    return refs


def main() -> int:
    bundle_refs = read_bundle_refs()
    mismatches: list[str] = []
    missing: list[str] = []

    print(f"Checking SZL package/bundle version sync ({BUNDLE.relative_to(ROOT)})")
    for pkg in PACKAGES:
        pkg_version = read_zarf_version(pkg)
        bundle_ref = bundle_refs.get(pkg)
        if bundle_ref is None:
            missing.append(pkg)
            print(f"  {pkg:8s} zarf={pkg_version}  bundle=<missing>")
            continue
        status = "OK" if pkg_version == bundle_ref else "DRIFT"
        print(f"  {pkg:8s} zarf={pkg_version}  bundle.ref={bundle_ref}  [{status}]")
        if pkg_version != bundle_ref:
            mismatches.append(
                f"{pkg}: zarf.yaml version={pkg_version} but uds-bundle.yaml ref={bundle_ref}"
            )

    if missing:
        print()
        print("ERROR: uds-bundle.yaml is missing entries for: " + ", ".join(missing))
    if mismatches:
        print()
        print("ERROR: SZL package versions are out of sync with the bundle:")
        for m in mismatches:
            print(f"  - {m}")
        print()
        print(
            "Fix: bump every package's zarf.yaml `metadata.version` and the matching "
            "`ref:` in uds-mesh/uds-bundle.yaml in the same commit."
        )

    return 1 if (mismatches or missing) else 0


if __name__ == "__main__":
    sys.exit(main())
