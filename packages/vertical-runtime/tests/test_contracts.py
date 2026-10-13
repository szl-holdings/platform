from __future__ import annotations

import hashlib
import copy
import json
import shutil
import tempfile
import unittest
from pathlib import Path

from szl_vertical_runtime.contracts import ContractError, load_catalog, validate_cell


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
APP_ROOT = REPOSITORY_ROOT / "apps" / "vertical-cells"


class ContractTests(unittest.TestCase):
    def test_checked_in_catalog_is_strict_and_complete(self) -> None:
        cells, metadata = load_catalog(APP_ROOT / "manifests")
        self.assertEqual(len(cells), 7)
        self.assertEqual(metadata["formula_count"], 10)
        self.assertRegex(metadata["catalog_digest"], r"^[0-9a-f]{64}$")
        self.assertIn("killinchu", cells)

    def test_missing_manifest_and_formula_checksum_tamper_fail(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shutil.copytree(APP_ROOT / "manifests", root / "manifests")
            shutil.copytree(APP_ROOT / "registries", root / "registries")
            (root / "manifests" / "lyte-services.json").unlink()
            with self.assertRaisesRegex(ContractError, "exactly equal"):
                load_catalog(root / "manifests")
            shutil.copy2(
                APP_ROOT / "manifests" / "lyte-services.json",
                root / "manifests" / "lyte-services.json",
            )
            with (root / "registries" / "formula_bindings.json").open(
                "a", encoding="utf-8"
            ) as handle:
                handle.write(" ")
            with self.assertRaisesRegex(ContractError, "checksum"):
                load_catalog(root / "manifests")

    def test_killinchu_effector_in_allowed_actions_fails(self) -> None:
        cell = json.loads(
            (APP_ROOT / "manifests" / "killinchu.json").read_text(encoding="utf-8")
        )
        cell["allowed_actions"].append("simulate then fire missile")
        issues = validate_cell(cell)
        self.assertTrue(any("physical-effector" in issue for issue in issues))

    def test_killinchu_launch_boundary_and_alias_swaps_fail(self) -> None:
        cell = json.loads(
            (APP_ROOT / "manifests" / "killinchu.json").read_text(encoding="utf-8")
        )
        cell["public_launch"] = "PUBLIC_EFFECTORS_ENABLED"
        self.assertTrue(
            any("simulation-only" in issue for issue in validate_cell(cell))
        )

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shutil.copytree(APP_ROOT / "manifests", root / "manifests")
            shutil.copytree(APP_ROOT / "registries", root / "registries")
            aliases_path = root / "registries" / "formula_aliases.json"
            aliases = json.loads(aliases_path.read_text(encoding="utf-8"))
            aliases["aliases"]["counsel"] = "killinchu"
            aliases["aliases"]["killinchu"] = "counsel-assurance"
            aliases_path.write_text(json.dumps(aliases), encoding="utf-8")
            with self.assertRaisesRegex(ContractError, "canonical mapping"):
                load_catalog(root / "manifests")

    def test_formula_proof_class_must_match_the_portable_enum(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shutil.copytree(APP_ROOT / "manifests", root / "manifests")
            shutil.copytree(APP_ROOT / "registries", root / "registries")
            registry_path = root / "registries" / "formula_bindings.json"
            registry = json.loads(registry_path.read_text(encoding="utf-8"))
            registry["formulas"][0]["proof_class"] = "PRODUCTION_VERIFIED"
            payload = (json.dumps(registry, indent=2, sort_keys=True) + "\n").encode(
                "utf-8"
            )
            registry_path.write_bytes(payload)
            checksum = hashlib.sha256(payload).hexdigest()
            registry_path.with_suffix(".sha256").write_bytes(
                f"{checksum}  {registry_path.name}\n".encode("ascii")
            )

            with self.assertRaisesRegex(ContractError, "proof_class"):
                load_catalog(root / "manifests")

    def test_locked_formula_inflation_demotion_and_omission_fail_startup(self) -> None:
        for mutation, diagnostic in (
            ("promote_lambda", "exact eight locked"),
            ("add_locked_formula", "exact eight locked"),
            ("demote_f1", "must remain LOCKED-PROVEN"),
            ("omit_f1", "missing locked formula IDs"),
        ):
            with (
                self.subTest(mutation=mutation),
                tempfile.TemporaryDirectory() as temporary,
            ):
                root = Path(temporary)
                shutil.copytree(APP_ROOT / "manifests", root / "manifests")
                shutil.copytree(APP_ROOT / "registries", root / "registries")
                registry_path = root / "registries" / "formula_bindings.json"
                registry = json.loads(registry_path.read_text(encoding="utf-8"))
                formulas = registry["formulas"]
                if mutation == "promote_lambda":
                    next(f for f in formulas if f["formula_id"] == "LAMBDA")[
                        "proof_class"
                    ] = "LOCKED-PROVEN"
                elif mutation == "add_locked_formula":
                    extra = copy.deepcopy(formulas[0])
                    extra["formula_id"] = "F99"
                    formulas.append(extra)
                elif mutation == "demote_f1":
                    next(f for f in formulas if f["formula_id"] == "F1")[
                        "proof_class"
                    ] = "CONJECTURE/ADVISORY"
                else:
                    registry["formulas"] = [
                        f for f in formulas if f["formula_id"] != "F1"
                    ]
                payload = (
                    json.dumps(registry, indent=2, sort_keys=True) + "\n"
                ).encode("utf-8")
                registry_path.write_bytes(payload)
                checksum = hashlib.sha256(payload).hexdigest()
                registry_path.with_suffix(".sha256").write_bytes(
                    f"{checksum}  {registry_path.name}\n".encode("ascii")
                )
                with self.assertRaisesRegex(ContractError, diagnostic):
                    load_catalog(root / "manifests")


if __name__ == "__main__":
    unittest.main()
