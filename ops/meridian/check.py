"""Meridian Python audit gate — chains all substrate validators.

This is the Python-layer gate invoked by ``pnpm run meridian:check``. It runs
in CI and locally, requiring no live API server. The gate chains:

1. Model policy validation  (ops/a11oy/model-policy.json)
2. MCP registry validation  (ops/mcp/mcp_registry.json)
3. Vertical pack validation (all live packs against the recommendation schema)
4. Forecast lab artifact    (reports/forecast-baseline.json — re-generated if absent)

All four must pass for the gate to exit 0. The gate does NOT replace the
existing ``ops/audit/meridian-check.mjs`` live-server audit; it is a
complementary offline CI check.
"""

from __future__ import annotations

import importlib
import json
import sys
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def _section(title: str) -> None:
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print(f"{'─' * 60}")


def _ok(msg: str) -> None:
    print(f"  ✓ {msg}")


def _fail(msg: str) -> None:
    print(f"  ✗ {msg}", file=sys.stderr)


def check_model_policy() -> bool:
    _section("1/4  Model Policy")
    try:
        from services.meridian_control_plane.model_policy import ModelPolicy, POLICY_PATH
        if not POLICY_PATH.exists():
            _fail(f"model policy file not found: {POLICY_PATH}")
            return False
        policy = ModelPolicy.from_file(POLICY_PATH)
        _ok(f"default model: {policy.default_model}")
        _ok(f"critical-path model: {policy.critical_path_model}")
        _ok(f"API key env: {policy.api_key_env}")
        _ok("policy schema valid, no hardcoded secrets detected")
        return True
    except Exception as exc:
        _fail(f"model policy validation failed: {exc}")
        return False


def check_mcp_registry() -> bool:
    _section("2/4  MCP Registry")
    try:
        from ops.mcp.validate_mcp_registry import (
            load_registry,
            validate_registry,
            check_orphan_capabilities,
            REGISTRY_PATH,
        )
        from services.verticals import registry as vert_registry

        if not REGISTRY_PATH.exists():
            _fail(f"MCP registry not found: {REGISTRY_PATH}")
            return False
        registry = load_registry(REGISTRY_PATH)
        errors = validate_registry(registry)

        declared_caps: list[str] = [
            cap_id
            for spec in vert_registry.REGISTRY
            for cap_id in spec.mcp_capabilities
        ]
        orphan_errors = check_orphan_capabilities(registry, declared_caps)
        errors.extend(orphan_errors)

        if errors:
            for err in errors:
                _fail(err)
            return False
        server_count = len(registry.get("servers", []))
        cap_count = sum(len(s.get("capabilities", [])) for s in registry.get("servers", []))
        _ok(f"{server_count} servers, {cap_count} capabilities")
        _ok("all servers signed, governance policy enforced")
        _ok(f"{len(declared_caps)} vertical-pack capability references, no orphans")
        return True
    except Exception as exc:
        _fail(f"MCP registry check failed: {exc}")
        return False


def check_vertical_packs() -> bool:
    _section("3/4  Vertical Packs")
    try:
        from services.verticals import registry
        from services.verticals.contracts import validate_recommendation
        import importlib as _il

        live_packs = registry.live()
        failures: dict[str, list[str]] = {}

        for spec in live_packs:
            try:
                signals_mod = _il.import_module(f"{spec.module}.signals")
                forecast_mod = _il.import_module(f"{spec.module}.forecast")
                evidence_mod = _il.import_module(f"{spec.module}.evidence")
                recommendations_mod = _il.import_module(f"{spec.module}.recommendations")
                brief_mod = _il.import_module(f"{spec.module}.brief")

                sigs = signals_mod.collect()
                fc = forecast_mod.compute(sigs)
                ev = evidence_mod.gather(sigs)
                rec = recommendations_mod.build(signals=sigs, forecast=fc, evidence=ev)
                brief_mod.synthesise(signals=sigs, forecast=fc, evidence=ev, recommendation=rec)

                errs = validate_recommendation(rec)
                if errs:
                    failures[spec.id] = errs
                else:
                    approval_note = " [requires human approval]" if rec.requires_human_approval else ""
                    _ok(f"{spec.id}: confidence={rec.confidence:.2f}{approval_note}")
            except Exception as exc:
                failures[spec.id] = [str(exc)]

        if failures:
            for vid, errs in failures.items():
                for err in errs:
                    _fail(f"{vid}: {err}")
            return False

        stub_count = len(registry.stubs())
        print(f"\n  {len(live_packs)} live packs validated ({stub_count} stubs skipped)")
        return True

    except Exception as exc:
        _fail(f"vertical pack check failed: {exc}")
        return False


def check_forecast_lab() -> bool:
    _section("4/4  Forecast Lab")
    try:
        from services.meridian_forecast_lab.forecast_lab import run_baseline, main, OUTPUT_PATH

        if not OUTPUT_PATH.exists():
            print(f"  (no cached artifact — generating now)")
            main([])

        if OUTPUT_PATH.exists():
            exit_code = main(["--check"])
            if exit_code != 0:
                _fail("forecast baseline artifact failed hash check")
                return False
            artifact = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
            _ok(f"{artifact['metric_count']} metrics forecasted")
            _ok(f"avg calibration score: {artifact['avg_calibration_score']}")
            _ok(f"determinism hash: {artifact.get('determinism_hash', '?')[:16]}…")
        else:
            _fail("forecast artifact not generated")
            return False

        return True
    except Exception as exc:
        _fail(f"forecast lab check failed: {exc}")
        return False


def main(argv: list[str] | None = None) -> int:
    print("\n⚡ Meridian Python Audit Gate")

    results = {
        "model_policy": check_model_policy(),
        "mcp_registry": check_mcp_registry(),
        "vertical_packs": check_vertical_packs(),
        "forecast_lab": check_forecast_lab(),
    }

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    print(f"\n{'═' * 60}")
    print(f"  Gate results: {passed}/{total} checks passed")
    for check_name, ok in results.items():
        status = "✓" if ok else "✗"
        print(f"    {status}  {check_name}")
    print(f"{'═' * 60}\n")

    if passed < total:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
