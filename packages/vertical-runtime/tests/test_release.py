from __future__ import annotations

import unittest
from pathlib import Path

from fixtures import cell
from szl_vertical_runtime.canonical import digest_value, read_json
from szl_vertical_runtime.release import (
    ALLOWED_KEYS,
    COMPILED_RELEASE_ADMISSION_GATES,
    EVIDENCE_KEYS,
    OBSERVATION_KEYS,
    RELEASE_SCHEMA,
    RELEASE_STATES,
    REQUIRED_KEYS,
    RUNTIME_KEYS,
    build_source_only_release,
    validate_compiled_release_plan,
    validate_release,
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[3]
PACKAGE_SCHEMA = (
    Path(__file__).resolve().parents[1]
    / "schemas"
    / "space_release_manifest.schema.json"
)
APP_SCHEMA = (
    REPOSITORY_ROOT
    / "apps"
    / "vertical-cells"
    / "schemas"
    / "space_release_manifest.schema.json"
)
CAPTURED_AT = "2026-08-28T23:59:00-04:00"
SOURCE_MANIFEST_SHA256 = "9" * 64


def source_release() -> dict[str, object]:
    vertical = cell()
    return {
        "data_revisions": [
            {
                "digest": "sha256:" + "c" * 64,
                "id": "dataset-1",
                "revision": "d" * 40,
                "rights_status": "APPROVED",
            }
        ],
        "evaluation_revision": "e" * 64,
        "image_digest": "sha256:" + "b" * 64,
        "manifest_digest": digest_value(vertical),
        "model_revisions": [
            {
                "digest": "sha256:" + "f" * 64,
                "id": "model-1",
                "revision": "1" * 40,
            }
        ],
        "observed_at": "2026-08-29T12:00:00Z",
        "policy_revision": "2" * 64,
        "production_status": "SOURCE_ONLY",
        "release_evidence": {},
        "runtime_readback": {},
        "schema": "szl.vertical-space-release/v2",
        "source_repository": "https://github.com/szl-holdings/platform",
        "source_revision": "a" * 40,
        "space_id": vertical["hf_space_id"],
        "vertical_id": vertical["vertical_id"],
        "visibility": vertical["space_visibility"],
    }


def compiled_release_plan() -> dict[str, object]:
    vertical = cell()
    return {
        "admission_gates": list(COMPILED_RELEASE_ADMISSION_GATES),
        "captured_at": CAPTURED_AT,
        "evidence_status": "MODELED",
        "hf_space_id": vertical["hf_space_id"],
        "planned_visibility": vertical["space_visibility"],
        "production_status": "SOURCE_ONLY",
        "provider_mutation_permitted": False,
        "public_launch_policy": vertical["public_launch"],
        "schema": "szl.vertical-space-release-plan/v1",
        "source_manifest_sha256": SOURCE_MANIFEST_SHA256,
        "vertical_id": vertical["vertical_id"],
    }


def source_only_build_inputs() -> dict[str, object]:
    return {
        "captured_at": CAPTURED_AT,
        "data_revisions": [
            {
                "digest": "sha256:" + "c" * 64,
                "id": "dataset-1",
                "revision": "d" * 40,
                "rights_status": "APPROVED",
            }
        ],
        "evaluation_revision": "e" * 64,
        "image_digest": "sha256:" + "b" * 64,
        "model_revisions": [
            {
                "digest": "sha256:" + "f" * 64,
                "id": "model-1",
                "revision": "1" * 40,
            }
        ],
        "observed_at": "2026-08-29T12:00:00Z",
        "policy_revision": "2" * 64,
        "source_manifest_sha256": SOURCE_MANIFEST_SHA256,
        "source_repository": "https://github.com/szl-holdings/platform",
        "source_revision": "a" * 40,
    }


class ReleaseTests(unittest.TestCase):
    def test_compiled_release_plan_passes_only_local_source_scope(self) -> None:
        report = validate_compiled_release_plan(
            compiled_release_plan(),
            cell=cell(),
            source_manifest_sha256=SOURCE_MANIFEST_SHA256,
            captured_at=CAPTURED_AT,
        )
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["claimed_status"], "SOURCE_ONLY")
        self.assertEqual(report["admission_scope"], "LOCAL_SOURCE_PLAN_ONLY")
        self.assertFalse(report["operational_claim_verified"])
        self.assertFalse(report["provider_mutation_permitted"])

    def test_compiled_release_plan_identity_and_authority_drift_block(self) -> None:
        mutations = {
            "admission_gates": list(reversed(COMPILED_RELEASE_ADMISSION_GATES)),
            "captured_at": "2026-08-29T04:00:00Z",
            "evidence_status": "VERIFIED",
            "hf_space_id": "SZLHOLDINGS/other-space",
            "planned_visibility": "public",
            "production_status": "PRODUCTION_READY",
            "provider_mutation_permitted": True,
            "public_launch_policy": "LAUNCH",
            "source_manifest_sha256": "8" * 64,
            "vertical_id": "other-vertical",
        }
        for field, value in mutations.items():
            with self.subTest(field=field):
                plan = compiled_release_plan()
                plan[field] = value
                report = validate_compiled_release_plan(
                    plan,
                    cell=cell(),
                    source_manifest_sha256=SOURCE_MANIFEST_SHA256,
                    captured_at=CAPTURED_AT,
                )
                self.assertEqual(report["status"], "BLOCKED")
                self.assertFalse(report["operational_claim_verified"])
                self.assertFalse(report["provider_mutation_permitted"])

        plan = compiled_release_plan()
        plan["surprise"] = True
        del plan["schema"]
        report = validate_compiled_release_plan(
            plan,
            cell=cell(),
            source_manifest_sha256=SOURCE_MANIFEST_SHA256,
        )
        codes = {finding["code"] for finding in report["findings"]}
        self.assertTrue({"REQUIRED", "UNKNOWN_FIELD"}.issubset(codes))

    def test_source_only_builder_rejects_missing_or_invalid_caller_identity(
        self,
    ) -> None:
        invalid_values = {
            "data_revisions": None,
            "evaluation_revision": "",
            "image_digest": "",
            "model_revisions": None,
            "observed_at": "",
            "policy_revision": "",
            "source_repository": "",
            "source_revision": "0" * 40,
        }
        for field, value in invalid_values.items():
            with self.subTest(field=field):
                inputs = source_only_build_inputs()
                inputs[field] = value
                with self.assertRaisesRegex(ValueError, "source-only release inputs"):
                    build_source_only_release(
                        compiled_release_plan(),
                        cell=cell(),
                        **inputs,
                    )

    def test_source_only_builder_produces_valid_v2_without_runtime_claims(self) -> None:
        release = build_source_only_release(
            compiled_release_plan(),
            cell=cell(),
            **source_only_build_inputs(),
        )
        report = validate_release(release, cell=cell())
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(release["schema"], RELEASE_SCHEMA)
        self.assertEqual(release["production_status"], "SOURCE_ONLY")
        self.assertEqual(release["release_evidence"], {})
        self.assertEqual(release["runtime_readback"], {})
        self.assertFalse(report["operational_claim_verified"])

    def test_built_release_cannot_admit_operational_states_locally(self) -> None:
        release = build_source_only_release(
            compiled_release_plan(),
            cell=cell(),
            **source_only_build_inputs(),
        )
        for status in RELEASE_STATES - {"BLOCKED", "SOURCE_ONLY"}:
            with self.subTest(status=status):
                candidate = {**release, "production_status": status}
                report = validate_release(candidate, cell=cell())
                self.assertEqual(report["status"], "BLOCKED")
                self.assertFalse(report["operational_claim_verified"])
                self.assertIn(
                    "EXTERNAL_VERIFIER_REQUIRED",
                    {finding["code"] for finding in report["findings"]},
                )

    def test_source_only_can_pass_structure_without_claiming_runtime(self) -> None:
        report = validate_release(source_release(), cell=cell())
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["claimed_status"], "SOURCE_ONLY")
        self.assertEqual(report["admission_scope"], "LOCAL_SOURCE_STRUCTURE_ONLY")
        self.assertEqual(report["evidence_verification"], "NOT_PERFORMED")
        self.assertFalse(report["operational_claim_verified"])

    def test_unknown_field_mutable_revision_and_declared_blocked_fail(self) -> None:
        release = source_release()
        release["surprise"] = True
        release["data_revisions"][0]["revision"] = "main"  # type: ignore[index]
        release["production_status"] = "BLOCKED"
        report = validate_release(release, cell=cell())
        codes = {finding["code"] for finding in report["findings"]}
        self.assertIn("UNKNOWN_FIELD", codes)
        self.assertIn("IMMUTABLE_REVISION", codes)
        self.assertIn("DECLARED_BLOCKED", codes)

    def test_caller_declared_receipts_cannot_admit_production_ready(self) -> None:
        release = source_release()
        release["production_status"] = "PRODUCTION_READY"
        manifest_digest = release["manifest_digest"]
        receipt_names = (
            "tests_passed",
            "negative_tests_passed",
            "access_control_verified",
            "backup_verified",
            "restart_recovery_verified",
            "rollback_verified",
            "authorization_verified",
            "receipt_signature_verified",
            "witness_verified",
        )
        receipts = {
            name: "sha256:" + format(index, "x") * 64
            for index, name in enumerate(receipt_names, start=1)
        }
        release["release_evidence"] = {
            **{name: True for name in receipt_names},
            "receipts": receipts,
            "witness": {"digest": "sha256:" + "a" * 64},
        }
        first_observation = {
            "image_digest": release["image_digest"],
            "manifest_digest": manifest_digest,
            "observed_at": "2026-08-29T12:05:00Z",
            "provider_revision": "3" * 40,
            "receipt_digest": "sha256:" + "a" * 64,
            "source_revision": release["source_revision"],
        }
        second_observation = {
            **first_observation,
            "observed_at": "2026-08-29T12:10:00Z",
            "receipt_digest": "sha256:" + "b" * 64,
        }
        release["runtime_readback"] = {
            "durability_state": "DURABLE",
            "health_status": "HEALTHY",
            "identity_converged": True,
            "image_digest": release["image_digest"],
            "manifest_digest": manifest_digest,
            "provider_revision": "3" * 40,
            "readiness_status": "READY",
            "source_revision": release["source_revision"],
            "stable_observations": [first_observation, second_observation],
        }
        report = validate_release(release, cell=cell())
        self.assertEqual(report["status"], "BLOCKED")
        self.assertFalse(report["admissible"])
        self.assertFalse(report["operational_claim_verified"])
        self.assertIn(
            "EXTERNAL_VERIFIER_REQUIRED",
            {finding["code"] for finding in report["findings"]},
        )

    def test_cell_identity_mismatch_blocks(self) -> None:
        release = source_release()
        release["space_id"] = "SZLHOLDINGS/other-space"
        report = validate_release(release, cell=cell())
        self.assertIn("IDENTITY", {finding["code"] for finding in report["findings"]})

    def test_nested_unknown_fields_block(self) -> None:
        release = source_release()
        release["runtime_readback"] = {"unexpected": True}
        release["release_evidence"] = {"unexpected": True}
        report = validate_release(release, cell=cell())
        codes = {finding["code"] for finding in report["findings"]}
        self.assertIn("UNKNOWN_FIELD", codes)

    def test_source_only_nested_values_must_satisfy_the_v2_schema(self) -> None:
        release = source_release()
        release["release_evidence"] = {
            "tests_passed": "yes",
            "witness": {},
        }
        release["runtime_readback"] = {
            "health_status": "BOGUS",
            "identity_converged": "yes",
            "stable_observations": ["not-an-object"],
        }
        report = validate_release(release, cell=cell())
        self.assertEqual(report["status"], "BLOCKED")
        self.assertFalse(report["admissible"])
        codes = {finding["code"] for finding in report["findings"]}
        self.assertTrue({"ENUM", "TYPE", "WITNESS"}.issubset(codes))

    def test_repository_space_and_nonzero_revision_match_portable_constraints(
        self,
    ) -> None:
        release = source_release()
        release["source_repository"] += "?ref=main"
        release["space_id"] = "SZLHOLDINGS/.hidden"
        release["source_revision"] = "0" * 40
        report = validate_release(release, cell=cell())
        codes = {finding["code"] for finding in report["findings"]}
        self.assertIn("SOURCE_REPOSITORY", codes)
        self.assertIn("SOURCE_REVISION", codes)
        self.assertIn("FORMAT", codes)

    def test_portable_schemas_match_the_executable_v2_contract(self) -> None:
        package_schema = read_json(PACKAGE_SCHEMA)
        app_schema = read_json(APP_SCHEMA)
        self.assertEqual(app_schema, package_schema)
        properties = package_schema["properties"]
        self.assertFalse(package_schema["additionalProperties"])
        self.assertEqual(set(properties), ALLOWED_KEYS)
        self.assertEqual(set(package_schema["required"]), REQUIRED_KEYS)
        self.assertEqual(properties["schema"]["const"], RELEASE_SCHEMA)
        self.assertEqual(set(properties["production_status"]["enum"]), RELEASE_STATES)
        self.assertEqual(
            set(properties["release_evidence"]["properties"]), EVIDENCE_KEYS
        )
        self.assertEqual(
            set(properties["runtime_readback"]["properties"]), RUNTIME_KEYS
        )
        observation = package_schema["$defs"]["stableObservation"]
        self.assertEqual(set(observation["properties"]), OBSERVATION_KEYS)
        self.assertEqual(
            set(package_schema["$defs"]["modelRevision"]["properties"]),
            {"digest", "id", "revision"},
        )
        self.assertEqual(
            set(package_schema["$defs"]["dataRevision"]["properties"]),
            {"digest", "id", "revision", "rights_status"},
        )


if __name__ == "__main__":
    unittest.main()
