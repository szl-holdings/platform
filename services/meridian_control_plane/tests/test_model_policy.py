"""Unit tests for the model policy loader and validator."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from services.meridian_control_plane.model_policy import ModelPolicy, PolicyError, load_policy

VALID_POLICY = {
    "_schema_version": "1.0.0",
    "default_model": "gpt-5.5-2026-04-23",
    "critical_path_model": "gpt-5.5-pro-2026-04-23",
    "api_key_env": "OPENAI_API_KEY",
    "critical_path_input_classes": ["legal", "board", "cyber", "capital_allocation", "production_deploy"],
    "requires_human_approval_output_classes": ["board_recommendation", "legal_filing"],
    "model_capabilities": {},
    "audit": {
        "log_all_calls": True,
        "flight_recorder_dir": "reports/flight-recorder",
    },
}


def _write_policy(d: dict, suffix: str = ".json") -> Path:
    tmp = tempfile.NamedTemporaryFile(mode="w", suffix=suffix, delete=False, encoding="utf-8")
    json.dump(d, tmp)
    tmp.flush()
    return Path(tmp.name)


class TestLoadPolicy(unittest.TestCase):
    def test_valid_policy_loads(self) -> None:
        path = _write_policy(VALID_POLICY)
        policy = load_policy(path)
        self.assertEqual(policy["default_model"], "gpt-5.5-2026-04-23")

    def test_missing_file_raises(self) -> None:
        with self.assertRaises(PolicyError):
            load_policy(Path("/nonexistent/path.json"))

    def test_invalid_json_raises(self) -> None:
        tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8")
        tmp.write("{not: valid json}")
        tmp.flush()
        with self.assertRaises(PolicyError):
            load_policy(Path(tmp.name))

    def test_missing_required_key_raises(self) -> None:
        bad = {k: v for k, v in VALID_POLICY.items() if k != "api_key_env"}
        path = _write_policy(bad)
        with self.assertRaises(PolicyError):
            load_policy(path)

    def test_same_default_and_critical_path_raises(self) -> None:
        bad = {**VALID_POLICY, "critical_path_model": VALID_POLICY["default_model"]}
        path = _write_policy(bad)
        with self.assertRaises(PolicyError):
            load_policy(path)

    def test_hardcoded_api_key_raises(self) -> None:
        import json as _json
        raw = _json.dumps(VALID_POLICY)
        raw = raw + ' "extra": "sk-abcdef1234567890abcdef1234567890ab"'
        tmp = tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8")
        tmp.write(raw)
        tmp.flush()
        with self.assertRaises(PolicyError):
            load_policy(Path(tmp.name))

    def test_empty_critical_path_classes_raises(self) -> None:
        bad = {**VALID_POLICY, "critical_path_input_classes": []}
        path = _write_policy(bad)
        with self.assertRaises(PolicyError):
            load_policy(path)


class TestModelPolicy(unittest.TestCase):
    def setUp(self) -> None:
        path = _write_policy(VALID_POLICY)
        self.policy = ModelPolicy.from_file(path)

    def test_default_model(self) -> None:
        self.assertEqual(self.policy.default_model, "gpt-5.5-2026-04-23")

    def test_critical_path_model(self) -> None:
        self.assertEqual(self.policy.critical_path_model, "gpt-5.5-pro-2026-04-23")

    def test_standard_input_class_routes_default(self) -> None:
        self.assertEqual(self.policy.resolve_model("operator_signals_v1"), "gpt-5.5-2026-04-23")

    def test_legal_input_class_routes_critical_path(self) -> None:
        self.assertEqual(self.policy.resolve_model("legal"), "gpt-5.5-pro-2026-04-23")

    def test_board_input_class_routes_critical_path(self) -> None:
        self.assertEqual(self.policy.resolve_model("board"), "gpt-5.5-pro-2026-04-23")

    def test_cyber_input_class_routes_critical_path(self) -> None:
        self.assertEqual(self.policy.resolve_model("cyber"), "gpt-5.5-pro-2026-04-23")

    def test_capital_allocation_routes_critical_path(self) -> None:
        self.assertEqual(self.policy.resolve_model("capital_allocation"), "gpt-5.5-pro-2026-04-23")

    def test_production_deploy_routes_critical_path(self) -> None:
        self.assertEqual(self.policy.resolve_model("production_deploy"), "gpt-5.5-pro-2026-04-23")

    def test_requires_human_approval_for_board_rec(self) -> None:
        self.assertTrue(self.policy.requires_human_approval("board_recommendation"))

    def test_does_not_require_approval_for_standard_output(self) -> None:
        self.assertFalse(self.policy.requires_human_approval("operator_recommendation_v1"))

    def test_api_key_reads_from_env(self) -> None:
        import os
        os.environ.pop("OPENAI_API_KEY", None)
        key = self.policy.get_api_key()
        self.assertIsNone(key)

    def test_real_policy_file_is_valid(self) -> None:
        from services.meridian_control_plane.model_policy import POLICY_PATH
        if POLICY_PATH.exists():
            real_policy = ModelPolicy.from_file(POLICY_PATH)
            self.assertEqual(real_policy.default_model, "gpt-5.5-2026-04-23")
            self.assertEqual(real_policy.critical_path_model, "gpt-5.5-pro-2026-04-23")
            self.assertEqual(real_policy.api_key_env, "OPENAI_API_KEY")


if __name__ == "__main__":
    unittest.main()
