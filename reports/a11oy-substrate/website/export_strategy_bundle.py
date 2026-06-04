#!/usr/bin/env python3
"""Export the A11oy strategy bundle as a self-contained ZIP archive.

Usage:
    python3 reports/a11oy-substrate/website/export_strategy_bundle.py

Output:
    reports/a11oy-substrate/a11oy_strategy_bundle.zip
"""

import json
import os
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
SUBSTRATE_DIR = SCRIPT_DIR.parent
OUTPUT_ZIP = SUBSTRATE_DIR / "a11oy_strategy_bundle.zip"

BUNDLE_FILES = [
    ("payload.replit.json", SUBSTRATE_DIR / "payload.replit.json"),
    ("website/a11oy_web_blueprint.json", SCRIPT_DIR / "a11oy_web_blueprint.json"),
    ("website/landing_page_copy.md", SCRIPT_DIR / "landing_page_copy.md"),
    ("website/competitive_pdf_outline.md", SCRIPT_DIR / "competitive_pdf_outline.md"),
    ("website/next_week_execution_plan.md", SCRIPT_DIR / "next_week_execution_plan.md"),
]

ARTIFACT_DIR = SUBSTRATE_DIR / "artifacts"


def redact_path(text: str) -> str:
    workspace_root = str(Path(__file__).resolve().parent.parent.parent.parent)
    return text.replace(workspace_root, "<workspace>")


def main():
    missing = []
    for label, path in BUNDLE_FILES:
        if not path.exists():
            missing.append(label)
    if missing:
        print(f"  [ERROR] Missing files: {', '.join(missing)}", file=sys.stderr)
        print("  Run 'python3 reports/a11oy-substrate/cli.py --all' first.", file=sys.stderr)
        sys.exit(1)

    artifact_files = sorted(ARTIFACT_DIR.glob("*.json")) if ARTIFACT_DIR.exists() else []
    if not artifact_files:
        print("  [WARN] No artifact JSON files found. Run the CLI first for a complete bundle.", file=sys.stderr)

    manifest = {
        "bundle_version": "1.0.0",
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "engine": "a11oy-substrate",
        "contents": [],
    }

    with zipfile.ZipFile(str(OUTPUT_ZIP), "w", zipfile.ZIP_DEFLATED) as zf:
        for archive_name, source_path in BUNDLE_FILES:
            content = source_path.read_text(encoding="utf-8")
            content = redact_path(content)
            zf.writestr(f"a11oy-strategy/{archive_name}", content)
            manifest["contents"].append({
                "path": archive_name,
                "size_bytes": len(content.encode("utf-8")),
                "type": "strategy_asset",
            })
            print(f"  [OK] {archive_name}")

        for af in artifact_files:
            archive_name = f"artifacts/{af.name}"
            content = af.read_text(encoding="utf-8")
            content = redact_path(content)
            zf.writestr(f"a11oy-strategy/{archive_name}", content)
            manifest["contents"].append({
                "path": archive_name,
                "size_bytes": len(content.encode("utf-8")),
                "type": "vertical_artifact",
            })
            print(f"  [OK] {archive_name}")

        manifest_json = json.dumps(manifest, indent=2)
        zf.writestr("a11oy-strategy/BUNDLE_MANIFEST.json", manifest_json)
        print(f"  [OK] BUNDLE_MANIFEST.json")

    size_kb = OUTPUT_ZIP.stat().st_size / 1024
    print(f"\n  Bundle exported: {OUTPUT_ZIP} ({size_kb:.1f} KB)")
    print(f"  {len(manifest['contents'])} files included")


if __name__ == "__main__":
    main()
