#!/usr/bin/env python3
"""One-shot canonical count reconciliation for screenshot-proof workflow."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JSON_PATH = ROOT / "audit" / "source-of-truth.json"
SOURCE_MD = ROOT / "SOURCE_OF_TRUTH.md"
AUDIT_MD = ROOT / "audit" / "README.md"

payload = json.loads(JSON_PATH.read_text(encoding="utf-8"))
workflows = payload["ci"]["workflows"]
workflows["count"] = 46
workflows["computed"] = "2026-08-18"
workflows["note"] = (
    "Counts the 46 permanent protected-source workflows after adding the hosted "
    "observability proof, public npm release, and provider-neutral exact-source "
    "screenshot-proof paths and retiring obsolete mutation one-shots."
)
JSON_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

source_text = SOURCE_MD.read_text(encoding="utf-8")
if "| CI workflows | **46** |" not in source_text:
    source_text = source_text.replace(
        "| CI workflows | **45** | Permanent tracked `.github/workflows/*.yml` and `*.yaml`",
        "| CI workflows | **46** | Permanent tracked `.github/workflows/*.yml` and `*.yaml`",
    )
SOURCE_MD.write_text(source_text, encoding="utf-8")

audit_text = AUDIT_MD.read_text(encoding="utf-8")
if "| CI workflows | 46 |" not in audit_text:
    audit_text = audit_text.replace(
        "| CI workflows | 45 | Permanent workflows",
        "| CI workflows | 46 | Permanent workflows",
    )
AUDIT_MD.write_text(audit_text, encoding="utf-8")

for path in (
    ROOT / "scripts" / "qa" / "apply-screenshot-workflow-truth-count.py",
    ROOT / ".github" / "workflows" / "apply-screenshot-workflow-truth-count.yml",
):
    path.unlink(missing_ok=True)

print("canonical workflow count reconciled to 46")
