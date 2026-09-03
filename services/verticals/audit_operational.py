"""Audit the canonical SZL vertical operational contracts.

By default this validates the source-tree snapshot and prints the computed
readiness for every canonical vertical.  It intentionally does not require all
verticals to be operational: SAMPLE_ONLY, UNAVAILABLE, and
IMPLEMENTED_UNVERIFIED are truthful states.

Use ``--require-operational`` only against request/deployment manifests that
have real timestamps, source provenance, exact-source deployment receipts, and
live probes.  It will fail for the source-tree snapshot by design.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from services.verticals.operational import audit_manifests
from services.verticals.operational_registry import (
    by_id,
    snapshot_manifest,
    snapshot_manifests,
    validate_blueprints,
)
from services.verticals.source_catalog import validate_catalog


def build_report(
    *,
    vertical_id: str | None = None,
    require_operational: bool = False,
) -> dict[str, object]:
    setup_errors = [*validate_catalog(), *validate_blueprints()]
    if vertical_id:
        manifests = (snapshot_manifest(by_id(vertical_id)),)
    else:
        manifests = snapshot_manifests()
    report = audit_manifests(
        manifests,
        require_operational=require_operational,
    )
    report["catalog_errors"] = setup_errors
    report["ok"] = bool(report["ok"]) and not setup_errors
    report["failure_count"] = int(report["failure_count"]) + len(setup_errors)
    return report


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--vertical",
        help="Audit one canonical id or legacy alias (for example vessels or killinchu).",
    )
    parser.add_argument(
        "--require-operational",
        action="store_true",
        help="Fail unless the selected manifest is verified OPERATIONAL.",
    )
    parser.add_argument(
        "--out",
        type=Path,
        help="Optional JSON output path.",
    )
    args = parser.parse_args(argv)

    try:
        report = build_report(
            vertical_id=args.vertical,
            require_operational=args.require_operational,
        )
    except KeyError as exc:
        print(str(exc), file=sys.stderr)
        return 2

    rendered = json.dumps(report, indent=2, sort_keys=True)
    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(rendered + "\n", encoding="utf-8")
    print(rendered)
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
