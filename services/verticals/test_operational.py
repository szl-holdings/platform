from __future__ import annotations

import unittest
from datetime import datetime, timezone

from services.verticals.operational import (
    AnatomyBinding,
    AnatomyOrganBinding,
    DataSourceBinding,
    DeploymentEvidence,
    EvidenceState,
    FormulaBinding,
    FormulaProofState,
    ReadinessState,
    SecondBrainBinding,
    VerticalOperationalManifest,
    audit_manifests,
    manifest_from_dict,
    validate_manifest,
)
from services.verticals.operational_registry import (
    BLUEPRINTS,
    by_id,
    canonical_ids,
    snapshot_manifest,
    snapshot_manifests,
    validate_blueprints,
)
from services.verticals.source_catalog import validate_catalog


NOW = datetime(2026, 9, 3, 23, 30, tzinfo=timezone.utc)
NOW_ISO = NOW.isoformat()


def _anatomy(*, degraded: bool = False) -> AnatomyBinding:
    states = {
        "EYES_EARS": "DEGRADED" if degraded else "OPERATIONAL",
        "IMMUNE": "OPERATIONAL",
        "BRAIN": "OPERATIONAL",
        "SKELETON": "OPERATIONAL",
        "HEART": "OPERATIONAL",
        "HANDS": "HUMAN_LOCK",
        "MEMORY": "HASHED_NOT_SIGNED",
    }
    return AnatomyBinding(
        organs=tuple(
            AnatomyOrganBinding(
                organ=organ,
                state=state,
                evidence=f"evidence:{organ.lower()}",
            )
            for organ, state in states.items()
        )
    )


def _valid_manifest(*, degraded: bool = False) -> VerticalOperationalManifest:
    return VerticalOperationalManifest(
        vertical_id="terra",
        title="Terra",
        repository="szl-holdings/platform",
        domains=("real_estate",),
        runtime_routes=("/api/terra/v1/vertical/runtime",),
        data_sources=(
            DataSourceBinding(
                id="nws_alerts",
                kind="current alerts",
                authority="NOAA National Weather Service",
                state=EvidenceState.LIVE,
                source_url="https://api.weather.gov/alerts/active",
                fetched_at=NOW_ISO,
                provenance="NWS JSON response normalized without changing truth state.",
                record_count=2,
                live_record_count=2,
            ),
        ),
        formulas=(
            FormulaBinding(
                name="lambda_aggregate",
                role="Aggregate measured runtime proxies.",
                proof_state=FormulaProofState.EMPIRICAL,
                measured_input_count=7,
                total_input_count=13,
                output_name="partial_operational_lambda",
            ),
            FormulaBinding(
                name="lambda_bounded",
                role="Bound guard.",
                proof_state=FormulaProofState.LOCKED_PROVEN,
                measured_input_count=1,
                total_input_count=1,
            ),
        ),
        second_brain=SecondBrainBinding(
            state=EvidenceState.OBSERVED,
            endpoint="local://second_brain",
            retrieved_at=NOW_ISO,
            handle_count=3,
            evidence_count=3,
        ),
        anatomy=_anatomy(degraded=degraded),
        requires_human_approval=True,
        rollback_path="Return to monitor-only mode.",
        evidence_digest="a" * 64,
        receipt_state="HASHED_NOT_SIGNED",
        deployment=DeploymentEvidence(
            exact_source_sha="b" * 40,
            deployment_receipt="receipt:test",
            live_probe_at=NOW_ISO,
            probed_routes=("/api/terra/v1/vertical/runtime",),
            source_bytes_match=True,
        ),
        implementation_state="DEPLOYED",
    )


class OperationalContractTests(unittest.TestCase):
    def test_valid_manifest_can_be_operational(self) -> None:
        manifest = _valid_manifest()
        self.assertEqual(validate_manifest(manifest, now=NOW), [])
        readiness = manifest.readiness(now=NOW)
        self.assertEqual(readiness["state"], ReadinessState.OPERATIONAL.value)
        self.assertTrue(readiness["operational"])

    def test_degraded_mandatory_organ_blocks_operational_state(self) -> None:
        readiness = _valid_manifest(degraded=True).readiness(now=NOW)
        self.assertEqual(readiness["state"], ReadinessState.DEPLOYED_DEGRADED.value)
        self.assertFalse(readiness["operational"])

    def test_sample_snapshot_never_becomes_operational(self) -> None:
        terra = snapshot_manifest(by_id("terra"))
        readiness = terra.readiness(now=NOW)
        self.assertEqual(readiness["state"], ReadinessState.SAMPLE_ONLY.value)
        self.assertFalse(readiness["operational"])
        self.assertIn("terra_deterministic_pack", readiness["sample_source_ids"])

    def test_open_conjecture_cannot_be_claimed_as_theorem(self) -> None:
        formula = FormulaBinding(
            name="lambda_uniqueness",
            role="Uniqueness claim",
            proof_state=FormulaProofState.CONJECTURE_OPEN,
            measured_input_count=13,
            total_input_count=13,
            theorem_claimed=True,
            full_yuyay13_claimed=True,
        )
        self.assertTrue(any("open conjecture" in error for error in formula.errors()))

    def test_partial_axes_cannot_claim_full_yuyay13(self) -> None:
        formula = FormulaBinding(
            name="lambda_aggregate",
            role="Aggregate",
            proof_state=FormulaProofState.EMPIRICAL,
            measured_input_count=7,
            total_input_count=13,
            output_name="full_yuyay13",
            full_yuyay13_claimed=True,
        )
        errors = formula.errors()
        self.assertTrue(any("all 13 measured" in error for error in errors))

    def test_second_brain_cannot_label_retrieval_score_correctness(self) -> None:
        brain = SecondBrainBinding(
            state=EvidenceState.OBSERVED,
            endpoint="local://second_brain",
            retrieved_at=NOW_ISO,
            handle_count=1,
            evidence_count=1,
            score_semantics="CORRECTNESS_PROBABILITY",
        )
        self.assertTrue(any("correctness" in error for error in brain.errors()))

    def test_live_source_requires_timestamp_provenance_and_records(self) -> None:
        source = DataSourceBinding(
            id="bad",
            kind="test",
            authority="test",
            state=EvidenceState.LIVE,
            source_url="http://example.test",
        )
        errors = source.errors(now=NOW)
        self.assertGreaterEqual(len(errors), 4)

    def test_round_trip_preserves_truth_states(self) -> None:
        original = _valid_manifest()
        restored = manifest_from_dict(original.to_dict())
        self.assertEqual(restored, original)

    def test_catalog_and_blueprints_are_self_consistent(self) -> None:
        self.assertEqual(validate_catalog(), [])
        self.assertEqual(validate_blueprints(), [])
        self.assertEqual(len(canonical_ids()), len(set(canonical_ids())))
        self.assertEqual(len(BLUEPRINTS), 15)

    def test_vessels_and_killinchu_resolve_to_one_canonical_blueprint(self) -> None:
        self.assertIs(by_id("vessels"), by_id("killinchu"))
        self.assertEqual(by_id("vessels").vertical_id, "killinchu")
        self.assertEqual(by_id("killinchu").repository, "szl-holdings/killinchu")
        self.assertIn("vessels", by_id("killinchu").legacy_ids)

    def test_source_tree_snapshot_audit_is_honest_but_not_operational(self) -> None:
        report = audit_manifests(snapshot_manifests(), now=NOW)
        self.assertTrue(report["ok"])
        self.assertEqual(report["vertical_count"], 15)
        self.assertTrue(
            all(not row["readiness"]["operational"] for row in report["verticals"])
        )


if __name__ == "__main__":
    unittest.main()
