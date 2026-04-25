"""Alloy Meridian vertical-moats CLI.

Two modes:

* ``--validate`` — runs the substrate-contract unittests and validates the
  deterministic recommendation emitted by every registered pack. Exits non-zero
  on any failure. Used by ``pnpm run verticals:validate``.

* ``--brief`` — invokes each pack's ``brief.synthesise()``, validates the
  resulting recommendation, and writes one JSON artifact per vertical to
  ``reports/vertical-artifacts/<vertical_id>.json`` plus an aggregate
  ``reports/vertical-artifacts/_index.json``. Used by ``pnpm run
  verticals:brief``.

Neither mode talks to the network or pulls in third-party Python deps.
"""

from __future__ import annotations

import argparse
import importlib
import json
import sys
import unittest
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from services.verticals import registry
from services.verticals.contracts import VerticalArtifact, validate_recommendation

REPO_ROOT = Path(__file__).resolve().parents[2]
ARTIFACTS_DIR = REPO_ROOT / "reports" / "vertical-artifacts"


def _load_pack(spec: registry.VerticalSpec) -> Any:
    return importlib.import_module(spec.module)


def _build_artifact(spec: registry.VerticalSpec) -> tuple[VerticalArtifact, list[str]]:
    pack = _load_pack(spec)
    signals_mod = importlib.import_module(f"{spec.module}.signals")
    forecast_mod = importlib.import_module(f"{spec.module}.forecast")
    recommendations_mod = importlib.import_module(f"{spec.module}.recommendations")
    evidence_mod = importlib.import_module(f"{spec.module}.evidence")
    brief_mod = importlib.import_module(f"{spec.module}.brief")

    signals = signals_mod.collect()
    forecast = forecast_mod.compute(signals)
    evidence = evidence_mod.gather(signals)
    rec = recommendations_mod.build(signals=signals, forecast=forecast, evidence=evidence)
    brief = brief_mod.synthesise(
        signals=signals, forecast=forecast, evidence=evidence, recommendation=rec
    )

    errors = validate_recommendation(rec)

    artifact = VerticalArtifact(
        vertical=spec.id,
        generated_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        signals=list(signals),
        forecast=dict(forecast),
        evidence=list(evidence),
        recommendation=rec.to_dict(),
        brief=dict(brief),
    )
    return artifact, errors


def cmd_validate() -> int:
    # 1) Real unittest discovery so any new test_*.py under services/verticals
    # is picked up automatically — no need to thread it through the registry.
    loader = unittest.TestLoader()
    discovered = loader.discover(
        start_dir=str(REPO_ROOT / "services" / "verticals"),
        pattern="test_*.py",
        top_level_dir=str(REPO_ROOT),
    )

    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(discovered)
    if not result.wasSuccessful():
        return 1

    # Belt-and-braces: every registered pack must also load cleanly. If a pack
    # was added to the registry without a matching test file, fail loudly.
    for vertical_id in registry.ids():
        test_module = f"services.verticals.{vertical_id}.test_{vertical_id}"
        try:
            __import__(test_module)
        except ImportError as exc:  # pragma: no cover - explicit failure path
            print(f"[verticals:validate] missing test module {test_module}: {exc}")
            return 1

    # 2) Sanity-check every pack's deterministic recommendation against the contract.
    failures: dict[str, list[str]] = {}
    for spec in registry.REGISTRY:
        try:
            _, errs = _build_artifact(spec)
            if errs:
                failures[spec.id] = errs
        except Exception as exc:  # pragma: no cover - explicit failure path
            failures[spec.id] = [f"build raised {type(exc).__name__}: {exc}"]

    if failures:
        print("\n[verticals:validate] contract failures:")
        for vid, errs in failures.items():
            for err in errs:
                print(f"  - {vid}: {err}")
        return 1

    print(f"\n[verticals:validate] OK — {len(registry.REGISTRY)} verticals pass the substrate contract")
    return 0


def cmd_brief() -> int:
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    index: dict[str, Any] = {
        "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "verticals": [],
    }
    failures = 0
    for spec in registry.REGISTRY:
        artifact, errors = _build_artifact(spec)
        if errors:
            failures += 1
            print(f"[verticals:brief] CONTRACT FAIL {spec.id}: {errors}")
            continue
        out_path = ARTIFACTS_DIR / f"{spec.id}.json"
        out_path.write_text(json.dumps(artifact.to_dict(), indent=2, sort_keys=True), encoding="utf-8")
        index["verticals"].append(
            {
                "id": spec.id,
                "title": spec.title,
                "purpose": spec.purpose,
                "artifact_path": str(out_path.relative_to(REPO_ROOT)),
                "recommendation_id": artifact.recommendation["id"],
                "confidence": artifact.recommendation["confidence"],
                "requires_human_approval": artifact.recommendation["requires_human_approval"],
            }
        )
        print(f"[verticals:brief] wrote {out_path.relative_to(REPO_ROOT)}")

    (ARTIFACTS_DIR / "_index.json").write_text(
        json.dumps(index, indent=2, sort_keys=True), encoding="utf-8"
    )
    print(f"[verticals:brief] wrote {(ARTIFACTS_DIR / '_index.json').relative_to(REPO_ROOT)}")

    if failures:
        return 1
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--validate", action="store_true", help="Run substrate contract checks")
    group.add_argument("--brief", action="store_true", help="Generate vertical-artifact JSON briefs")
    args = parser.parse_args(argv)

    if args.validate:
        return cmd_validate()
    return cmd_brief()


if __name__ == "__main__":
    sys.exit(main())
