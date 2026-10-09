from __future__ import annotations

import json
import copy
import unittest
from pathlib import Path

from szl_factory.validation import (
    FORMULA_PROOF_CLASSES,
    LOCKED_FORMULA_IDS,
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
        "formula_bindings": registry["formulas"],
        "schema": "szl.estate-vertical-factory-profile/v6",
        "vertical_cells": cells,
    }


class StrictFormulaClassTests(unittest.TestCase):
    def test_locked_formula_set_is_exact_and_baseline_retains_other_classes(
        self,
    ) -> None:
        self.assertEqual(
            LOCKED_FORMULA_IDS,
            {"F1", "F4", "F7", "F11", "F12", "F18", "F19", "F22"},
        )
        self.assertEqual(validate_profile(checked_in_profile()), [])

    def test_inflation_demotion_and_missing_locked_formulas_fail(self) -> None:
        for mutation, diagnostic in (
            ("promote_lambda", "exact eight locked"),
            ("add_locked_formula", "exact eight locked"),
            ("demote_f1", "must remain LOCKED-PROVEN"),
            ("omit_f1", "missing locked formula IDs"),
        ):
            with self.subTest(mutation=mutation):
                profile = checked_in_profile()
                formulas = profile["formula_bindings"]
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
                    profile["formula_bindings"] = [
                        f for f in formulas if f["formula_id"] != "F1"
                    ]
                self.assertTrue(
                    any(diagnostic in issue for issue in validate_profile(profile))
                )

    def test_only_portable_proof_classes_are_admitted(self) -> None:
        self.assertEqual(
            FORMULA_PROOF_CLASSES,
            {"LOCKED-PROVEN", "SEMANTIC-VERIFIED", "CONJECTURE/ADVISORY"},
        )
        profile = checked_in_profile()
        profile["formula_bindings"][0]["proof_class"] = "PRODUCTION_VERIFIED"  # type: ignore[index]

        issues = validate_profile(profile)

        self.assertTrue(any("proof_class" in issue for issue in issues))
        self.assertTrue(any("PRODUCTION_VERIFIED" in issue for issue in issues))


if __name__ == "__main__":
    unittest.main()
