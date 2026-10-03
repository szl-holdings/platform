from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import szl_factory.compiler as compiler_module
from szl_factory import (
    CELL_ARTIFACT_NAMES,
    ValidationError,
    canonical_json_bytes,
    compile_profile,
    compute_tree_sha256,
    validate_profile,
)


APP_ROOT = Path(__file__).resolve().parents[1]


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


def file_bytes(root: Path) -> dict[str, bytes]:
    return {
        path.relative_to(root).as_posix(): path.read_bytes()
        for path in sorted(root.rglob("*"))
        if path.is_file()
    }


class CompilerValidationTests(unittest.TestCase):
    def test_checked_in_contract_bytes_are_canonical_after_repository_formatting(
        self,
    ) -> None:
        runtime_root = APP_ROOT.parents[1] / "packages" / "vertical-runtime"
        roots = [
            APP_ROOT / "manifests",
            APP_ROOT / "registries",
            APP_ROOT / "schemas",
            runtime_root / "schemas",
            runtime_root / "examples",
        ]
        for root in roots:
            for source in sorted(root.glob("*.json")):
                with self.subTest(source=source.relative_to(APP_ROOT.parents[1])):
                    raw = source.read_bytes()
                    self.assertEqual(raw, canonical_json_bytes(json.loads(raw)))

    def test_checked_in_graph_validates(self) -> None:
        self.assertEqual(validate_profile(checked_in_profile()), [])

    def test_compilation_is_byte_deterministic_and_complete(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            profile = root / "profile.json"
            profile.write_text(json.dumps(checked_in_profile()), encoding="utf-8")
            first = compile_profile(profile, root / "source-a", root / "compiled-a")
            second = compile_profile(profile, root / "source-b", root / "compiled-b")
            self.assertEqual(first, second)
            self.assertEqual(first["compiled_verticals"], 7)
            self.assertEqual(
                file_bytes(root / "compiled-a"), file_bytes(root / "compiled-b")
            )
            for vertical in checked_in_profile()["vertical_cells"]:  # type: ignore[index]
                cell_root = root / "compiled-a" / vertical["vertical_id"]
                self.assertEqual(
                    {path.name for path in cell_root.iterdir()},
                    set(CELL_ARTIFACT_NAMES),
                )

    def test_formula_authority_unknown_binding_and_unknown_field_block(self) -> None:
        profile = checked_in_profile()
        profile["formula_bindings"][0]["grants_authority"] = True  # type: ignore[index]
        profile["vertical_cells"][0]["formula_bindings"].append("UNKNOWN")  # type: ignore[index]
        profile["vertical_cells"][0]["surprise"] = True  # type: ignore[index]
        issues = validate_profile(profile)
        self.assertTrue(any("never grant authority" in issue for issue in issues))
        self.assertTrue(any("unknown formula_id" in issue for issue in issues))
        self.assertTrue(any("unexpected fields" in issue for issue in issues))

    def test_killinchu_effector_allowance_blocks(self) -> None:
        profile = checked_in_profile()
        killinchu = next(
            cell
            for cell in profile["vertical_cells"]
            if cell["vertical_id"] == "killinchu"  # type: ignore[index]
        )
        killinchu["allowed_actions"].append("simulate then fire missile")
        self.assertTrue(
            any("physical-effector" in issue for issue in validate_profile(profile))
        )
        killinchu["allowed_actions"][-1] = "simulate then fire rocket"
        self.assertTrue(
            any(
                "canonical simulation-only" in issue
                for issue in validate_profile(profile)
            )
        )

    def test_linked_output_root_is_rejected_before_cleaning(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            profile = root / "profile.json"
            profile.write_text(json.dumps(checked_in_profile()), encoding="utf-8")
            target = root / "target"
            target.mkdir()
            linked = root / "linked"
            created = False
            try:
                if os.name == "nt":
                    result = subprocess.run(
                        ["cmd.exe", "/c", "mklink", "/J", str(linked), str(target)],
                        check=False,
                        capture_output=True,
                        text=True,
                    )
                    if result.returncode != 0:
                        self.skipTest(
                            f"directory junctions are unavailable: {result.stderr.strip()}"
                        )
                else:
                    linked.symlink_to(target, target_is_directory=True)
                created = True
                with self.assertRaisesRegex(
                    ValidationError, "symlink, junction, or reparse"
                ):
                    compile_profile(profile, root / "source", linked, clean=True)
                with self.assertRaisesRegex(
                    ValidationError, "symlink, junction, or reparse"
                ):
                    compute_tree_sha256(linked)
            finally:
                if created:
                    linked.rmdir()

    def test_stale_output_file_fails_closed(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            profile = root / "profile.json"
            profile.write_text(json.dumps(checked_in_profile()), encoding="utf-8")
            output = root / "compiled"
            output.mkdir()
            (output / "stale.txt").write_text("stale", encoding="utf-8")
            with self.assertRaisesRegex(ValidationError, "unexpected stale files"):
                compile_profile(profile, root / "source", output)
            with self.assertRaisesRegex(ValidationError, "unexpected stale files"):
                compile_profile(profile, root / "source", output, clean=True)
            self.assertEqual(
                (output / "stale.txt").read_text(encoding="utf-8"), "stale"
            )

    def test_clean_replaces_only_known_compiler_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            profile = root / "profile.json"
            profile.write_text(json.dumps(checked_in_profile()), encoding="utf-8")
            first = compile_profile(profile, root / "source", root / "compiled")
            second = compile_profile(
                profile, root / "source", root / "compiled", clean=True
            )
            self.assertEqual(first, second)

    def test_clean_rejects_and_preserves_unexpected_empty_directory(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            profile = root / "profile.json"
            profile.write_text(json.dumps(checked_in_profile()), encoding="utf-8")
            output = root / "compiled"
            unexpected = output / "caller-owned-empty"
            unexpected.mkdir(parents=True)
            with self.assertRaisesRegex(ValidationError, "unexpected directories"):
                compile_profile(profile, root / "source", output, clean=True)
            self.assertTrue(unexpected.is_dir())

    def test_interrupted_compile_invalidates_every_old_validity_marker(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            profile = root / "profile.json"
            profile.write_text(json.dumps(checked_in_profile()), encoding="utf-8")
            source = root / "source"
            compiled = root / "compiled"
            compile_profile(profile, source, compiled)
            self.assertTrue((compiled / "compiled_index.json").is_file())

            real_write = compiler_module._atomic_write_bytes
            write_count = 0

            def fail_during_first_cell(path: Path, content: bytes) -> None:
                nonlocal write_count
                write_count += 1
                if write_count == 2:
                    raise OSError("injected mid-build failure")
                real_write(path, content)

            with mock.patch.object(
                compiler_module, "_atomic_write_bytes", fail_during_first_cell
            ):
                with self.assertRaisesRegex(OSError, "injected mid-build failure"):
                    compile_profile(profile, source, compiled)

            self.assertFalse((compiled / "compiled_index.json").exists())
            for vertical in checked_in_profile()["vertical_cells"]:  # type: ignore[index]
                marker = compiled / vertical["vertical_id"] / "build_manifest.json"
                self.assertFalse(marker.exists())

    def test_interrupted_clean_has_no_old_validity_markers_over_missing_peers(
        self,
    ) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            profile = root / "profile.json"
            profile.write_text(json.dumps(checked_in_profile()), encoding="utf-8")
            source = root / "source"
            compiled = root / "compiled"
            compile_profile(profile, source, compiled)
            original_unlink = Path.unlink

            def fail_mid_clean(path: Path, *args: object, **kwargs: object) -> None:
                if path == compiled / "vessels-assurance" / "ui_contract.json":
                    raise OSError("injected cleanup failure")
                original_unlink(path, *args, **kwargs)

            with mock.patch.object(Path, "unlink", fail_mid_clean):
                with self.assertRaisesRegex(OSError, "injected cleanup failure"):
                    compile_profile(profile, source, compiled, clean=True)

            self.assertFalse((compiled / "compiled_index.json").exists())
            self.assertFalse(
                (compiled / "vessels-assurance" / "vertical_manifest.json").exists()
            )
            for vertical in checked_in_profile()["vertical_cells"]:  # type: ignore[index]
                marker = compiled / vertical["vertical_id"] / "build_manifest.json"
                self.assertFalse(marker.exists())

    def test_generated_wire_contract_matches_versioned_runtime_surface(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            profile = root / "profile.json"
            profile.write_text(json.dumps(checked_in_profile()), encoding="utf-8")
            compile_profile(profile, root / "source", root / "compiled")
            cell_root = root / "compiled" / "lyte-services"
            ontology = json.loads(
                (cell_root / "ontology.schema.json").read_text(encoding="utf-8")
            )
            request = ontology["properties"]["request"]
            self.assertNotIn("enum", request["properties"]["action"])
            evidence = request["properties"]["evidence"]["items"]["properties"]
            self.assertEqual(
                set(evidence["freshness"]["enum"]),
                {"CURRENT", "STALE", "UNKNOWN"},
            )

            receipt = json.loads(
                (cell_root / "receipt.schema.json").read_text(encoding="utf-8")
            )
            self.assertEqual(
                set(receipt["properties"]["decision"]["enum"]),
                {"RECOMMEND", "DENY", "ESCALATE"},
            )
            self.assertEqual(
                receipt["properties"]["schema"]["const"],
                "szl.vertical-decision-receipt/v2",
            )

            routes = json.loads(
                (cell_root / "route_contract.json").read_text(encoding="utf-8")
            )
            self.assertEqual(routes["schema"], "szl.vertical-route-contract/v2")
            self.assertEqual(
                [(route["method"], route["path"]) for route in routes["routes"]],
                [
                    ("GET", "/v1/verticals/lyte-services"),
                    ("POST", "/v1/verticals/lyte-services/decisions/evaluate"),
                    (
                        "POST",
                        "/v1/verticals/lyte-services/decisions/{decision_id}/human-disposition",
                    ),
                    (
                        "GET",
                        "/v1/verticals/lyte-services/receipts/{receipt_id}",
                    ),
                ],
            )
            self.assertEqual(
                [route["authentication"] for route in routes["routes"]],
                ["NOT_REQUIRED", "REQUIRED", "REQUIRED", "REQUIRED"],
            )
            self.assertEqual(routes["routes"][1]["side_effects"], "LOCAL_LEDGER_ONLY")


if __name__ == "__main__":
    unittest.main()
