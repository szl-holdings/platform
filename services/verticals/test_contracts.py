"""Substrate-contract regression tests.

Run via:

    pnpm run verticals:validate

…or directly:

    python3 -m unittest discover -s services/verticals -p 'test_*.py'
"""

from __future__ import annotations

import unittest

from services.verticals import registry
from services.verticals.contracts import (
    ALLOWED_MODELS,
    CONTRACT_VERSION,
    DEFAULT_MODEL,
    REQUIRED_FIELDS,
    Recommendation,
    validate_many,
    validate_recommendation,
)


def _good() -> Recommendation:
    return Recommendation(
        id="rec_test_001",
        vertical="pulse",
        title="Test recommendation",
        owner="ops@szl",
        confidence=0.7,
        evidence_ids=["ev_001", "ev_002"],
        next_action="Approve and ship",
        rollback_path="Revert via owner",
    )


class ContractTests(unittest.TestCase):
    def test_default_model_is_locked(self) -> None:
        self.assertEqual(DEFAULT_MODEL, "gpt-5.5-2026-04-23")

    def test_contract_version_is_locked(self) -> None:
        self.assertEqual(CONTRACT_VERSION, "1.0.0")

    def test_required_fields_match_payload(self) -> None:
        expected = {
            "id",
            "vertical",
            "title",
            "owner",
            "confidence",
            "evidence_ids",
            "next_action",
            "rollback_path",
            "requires_human_approval",
            "model",
            "input_class",
            "output_class",
        }
        self.assertEqual(set(REQUIRED_FIELDS), expected)

    def test_valid_recommendation_passes(self) -> None:
        self.assertEqual(validate_recommendation(_good()), [])

    def test_dict_form_also_validates(self) -> None:
        self.assertEqual(validate_recommendation(_good().to_dict()), [])

    def test_missing_field_fails(self) -> None:
        bad = _good().to_dict()
        del bad["next_action"]
        errs = validate_recommendation(bad)
        self.assertTrue(any("next_action" in e for e in errs))

    def test_confidence_out_of_range_fails(self) -> None:
        bad = _good().to_dict()
        bad["confidence"] = 1.7
        errs = validate_recommendation(bad)
        self.assertTrue(any("confidence" in e for e in errs))

    def test_confidence_must_not_be_bool(self) -> None:
        bad = _good().to_dict()
        bad["confidence"] = True  # type: ignore[assignment]
        errs = validate_recommendation(bad)
        self.assertTrue(any("confidence" in e for e in errs))

    def test_evidence_ids_must_be_strings(self) -> None:
        bad = _good().to_dict()
        bad["evidence_ids"] = ["ok", 7]  # type: ignore[list-item]
        errs = validate_recommendation(bad)
        self.assertTrue(any("evidence_ids" in e for e in errs))

    def test_model_must_be_in_allowed_set(self) -> None:
        bad = _good().to_dict()
        bad["model"] = "gpt-4o"
        errs = validate_recommendation(bad)
        self.assertTrue(any("allowed models" in e for e in errs))

    def test_critical_path_model_is_valid(self) -> None:
        rec = _good().to_dict()
        rec["model"] = "gpt-5.5-pro-2026-04-23"
        self.assertIn(rec["model"], ALLOWED_MODELS)
        errs = validate_recommendation(rec)
        self.assertEqual(errs, [])

    def test_allowed_models_contains_default(self) -> None:
        self.assertIn(DEFAULT_MODEL, ALLOWED_MODELS)

    def test_validate_many_indexes_by_id(self) -> None:
        bad = _good().to_dict()
        bad["id"] = "rec_bad"
        bad["confidence"] = -0.1
        result = validate_many([_good(), bad])
        self.assertIn("rec_bad", result)
        self.assertNotIn("rec_test_001", result)


class RegistryTests(unittest.TestCase):
    def test_registry_is_non_empty(self) -> None:
        self.assertGreater(len(registry.REGISTRY), 0)

    def test_reference_vertical_packs_are_live(self) -> None:
        live_ids = {spec.id for spec in registry.live()}
        self.assertIn("platform", live_ids, "platform reference pack must be live")
        self.assertIn("sentra_cyber", live_ids, "sentra_cyber reference pack must be live")

    def test_ids_are_unique(self) -> None:
        ids = registry.ids()
        self.assertEqual(len(ids), len(set(ids)))

    def test_lookup_by_id(self) -> None:
        spec = registry.by_id("pulse")
        self.assertEqual(spec.title, "Pulse")
        self.assertEqual(spec.purpose, "Founder Operating Channel")

    def test_lookup_platform_by_id(self) -> None:
        spec = registry.by_id("platform")
        self.assertEqual(spec.pack_status, "live")

    def test_unknown_id_raises(self) -> None:
        with self.assertRaises(KeyError):
            registry.by_id("does_not_exist")

    def test_every_pack_has_research_seams(self) -> None:
        for spec in registry.REGISTRY:
            self.assertGreater(len(spec.research_seams), 0, f"{spec.id} missing research seams")

    def test_live_and_stub_are_disjoint(self) -> None:
        live_ids = {spec.id for spec in registry.live()}
        stub_ids = {spec.id for spec in registry.stubs()}
        self.assertTrue(live_ids.isdisjoint(stub_ids))


if __name__ == "__main__":
    unittest.main()
