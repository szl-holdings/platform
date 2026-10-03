from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


APP_ROOT = Path(__file__).resolve().parents[1]
TOOLS_ROOT = APP_ROOT / "tools"
COMPILER = TOOLS_ROOT / "szl_vertical_cell_compiler_v6.py"
AUDITOR = TOOLS_ROOT / "szl_estate_vertical_auditor_v6.py"
sys.path.insert(0, str(TOOLS_ROOT))

from szl_vertical_factory_auditor_v6 import audit  # noqa: E402
import szl_vertical_factory_auditor_v6 as auditor_module  # noqa: E402


def checked_in_profile() -> dict[str, object]:
    registry = json.loads(
        (APP_ROOT / "registries" / "formula_bindings.json").read_text(encoding="utf-8")
    )
    cells = [
        json.loads(path.read_text(encoding="utf-8"))
        for path in sorted((APP_ROOT / "manifests").glob("*.json"))
    ]
    return {
        "captured_at": registry["captured_at"],
        "counts": {"vertical_cells": len(cells)},
        "formula_bindings": registry["formulas"],
        "schema": "szl.estate-vertical-factory-profile/v6",
        "vertical_cells": cells,
    }


def run_script(script: Path, *arguments: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-B", str(script), *arguments],
        check=False,
        capture_output=True,
        text=True,
    )


class CapturedCompatibilityTests(unittest.TestCase):
    def _profile(self, root: Path, *, divergent: bool = False) -> Path:
        profile = checked_in_profile()
        if divergent:
            profile["vertical_cells"][0]["display_name"] += " Divergent"  # type: ignore[index]
        path = root / "profile.json"
        path.write_text(json.dumps(profile), encoding="utf-8")
        return path

    def test_compiler_supports_subcommands_and_captured_flags(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            profile = self._profile(root)

            current = run_script(COMPILER, "validate", str(profile))
            self.assertEqual(current.returncode, 0, current.stderr)
            self.assertEqual(json.loads(current.stdout)["status"], "PASS")

            captured = run_script(
                COMPILER, "--profile", str(profile), "--validate-only"
            )
            self.assertEqual(captured.returncode, 0, captured.stderr)
            self.assertEqual(json.loads(captured.stdout)["status"], "PASS")

            compiled = run_script(
                COMPILER,
                "--profile",
                str(profile),
                "--vertical-dir",
                str(root / "source"),
                "--out",
                str(root / "compiled"),
                "--clean",
            )
            self.assertEqual(compiled.returncode, 0, compiled.stderr)
            result = json.loads(compiled.stdout)
            self.assertEqual(result["compiled_verticals"], 7)
            self.assertTrue((root / "compiled" / "compiled_index.json").is_file())

    def test_captured_auditor_validate_and_full_modes_are_offline(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            profile = self._profile(root)
            output = root / "audit-output"
            validated = run_script(
                AUDITOR,
                "--profile",
                str(profile),
                "--compiler",
                str(COMPILER),
                "--validate-only",
                "--out",
                str(output),
            )
            self.assertEqual(validated.returncode, 0, validated.stderr)
            report = json.loads(validated.stdout)
            self.assertEqual(report["status"], "PASS")
            self.assertEqual(report["profile_binding_status"], "PASS")
            self.assertEqual(report["compiler_determinism"]["status"], "NOT_RUN")
            self.assertEqual(report["connected_estate_audit"]["status"], "NOT_RUN")
            self.assertEqual(
                report["connected_estate_audit"]["availability"], "UNAVAILABLE"
            )
            self.assertEqual(report["network_calls"], 0)
            self.assertEqual(report["provider_mutations"], 0)
            self.assertEqual(
                json.loads((output / "run_receipt.json").read_text(encoding="utf-8")),
                report,
            )

            full = run_script(
                AUDITOR,
                "--profile",
                str(profile),
                "--compiler",
                str(COMPILER),
            )
            self.assertEqual(full.returncode, 0, full.stderr)
            full_report = json.loads(full.stdout)
            self.assertEqual(full_report["status"], "PASS")
            self.assertEqual(full_report["compiler_determinism"]["status"], "PASS")
            self.assertEqual(
                full_report["compiler_determinism"]["compiled_file_count"], 78
            )
            self.assertEqual(full_report["connected_estate_audit"]["status"], "NOT_RUN")

    def test_valid_but_divergent_profile_blocks_binding(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            profile_path = self._profile(Path(temporary), divergent=True)
            report = audit(profile_path, validate_only=True)
        self.assertEqual(report["status"], "BLOCKED")
        self.assertEqual(report["profile_binding_status"], "BLOCKED")
        self.assertTrue(
            any(
                "differs from its checked-in manifest" in issue
                for issue in report["issues"]
            )
        )
        self.assertEqual(report["network_calls"], 0)
        self.assertEqual(report["provider_mutations"], 0)

    def test_source_swap_cannot_change_the_validated_compiler_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            profile_path = self._profile(Path(temporary))
            real_compile = auditor_module.compile_profile
            compiled_snapshots: list[Path] = []

            def swap_source_then_compile(
                snapshot: Path, *args: object, **kwargs: object
            ) -> dict[str, object]:
                if not compiled_snapshots:
                    changed = json.loads(profile_path.read_text(encoding="utf-8"))
                    changed["vertical_cells"][0]["display_name"] = (
                        "Concurrent source swap"
                    )
                    profile_path.write_text(json.dumps(changed), encoding="utf-8")
                compiled_snapshots.append(snapshot)
                return real_compile(snapshot, *args, **kwargs)

            with mock.patch.object(
                auditor_module, "compile_profile", swap_source_then_compile
            ):
                report = audit(profile_path)

        self.assertEqual(report["status"], "BLOCKED")
        self.assertEqual(report["profile_binding_status"], "BLOCKED")
        self.assertEqual(
            report["profile_snapshot_status"], "BLOCKED_INPUT_CHANGED_OR_UNAVAILABLE"
        )
        self.assertEqual(report["compiler_determinism"]["status"], "PASS")
        self.assertEqual(
            report["profile_canonical_sha256"],
            report["compiler_determinism"]["profile_sha256"],
        )
        self.assertEqual(len(compiled_snapshots), 2)
        self.assertTrue(
            all(snapshot != profile_path for snapshot in compiled_snapshots)
        )
        self.assertTrue(
            any("changed during the audit" in issue for issue in report["issues"])
        )

    def test_compiler_result_must_be_bound_to_the_validated_snapshot(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            profile_path = self._profile(Path(temporary))
            real_compile = auditor_module.compile_profile

            def compile_with_wrong_identity(
                *args: object, **kwargs: object
            ) -> dict[str, object]:
                result = real_compile(*args, **kwargs)
                result["profile_sha256"] = "0" * 64
                return result

            with mock.patch.object(
                auditor_module, "compile_profile", compile_with_wrong_identity
            ):
                report = audit(profile_path)

        self.assertEqual(report["status"], "BLOCKED")
        self.assertEqual(report["compiler_determinism"]["status"], "BLOCKED")
        self.assertTrue(
            any("validated snapshot" in issue for issue in report["issues"])
        )


if __name__ == "__main__":
    unittest.main()
