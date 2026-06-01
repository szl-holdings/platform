"""Unit tests for the Platform / AgentOps vertical pack.

Run via:
    pnpm run verticals:validate
or directly:
    python3 -m unittest services.verticals.platform.test_platform
"""

from __future__ import annotations

import unittest

from services.verticals.contracts import validate_recommendation
from services.verticals.platform import brief, evidence, forecast, recommendations, signals


class PlatformSignalsTests(unittest.TestCase):
    def test_signals_are_non_empty(self) -> None:
        sigs = signals.collect()
        self.assertGreater(len(sigs), 0)

    def test_signals_are_deterministic(self) -> None:
        self.assertEqual(signals.collect(), signals.collect())

    def test_all_signals_have_required_fields(self) -> None:
        for sig in signals.collect():
            self.assertIn("id", sig)
            self.assertIn("source", sig)
            self.assertIn("kind", sig)
            self.assertIn("summary", sig)
            self.assertIn("weight", sig)
            self.assertIsInstance(sig["weight"], float)
            self.assertGreaterEqual(sig["weight"], 0.0)
            self.assertLessEqual(sig["weight"], 1.0)

    def test_signal_ids_are_unique(self) -> None:
        sigs = signals.collect()
        ids = [s["id"] for s in sigs]
        self.assertEqual(len(ids), len(set(ids)))

    def test_mcp_registry_signal_present(self) -> None:
        kinds = {s["kind"] for s in signals.collect()}
        self.assertIn("mcp_registry_health", kinds)

    def test_model_policy_signal_present(self) -> None:
        kinds = {s["kind"] for s in signals.collect()}
        self.assertIn("model_policy_health", kinds)


class PlatformForecastTests(unittest.TestCase):
    def setUp(self) -> None:
        self.signals = signals.collect()
        self.forecast = forecast.compute(self.signals)

    def test_forecast_has_required_keys(self) -> None:
        for key in ("horizon", "method", "platform_health_score", "confidence", "summary"):
            self.assertIn(key, self.forecast)

    def test_confidence_in_range(self) -> None:
        c = self.forecast["confidence"]
        self.assertGreaterEqual(c, 0.0)
        self.assertLessEqual(c, 1.0)

    def test_forecast_is_deterministic(self) -> None:
        f1 = forecast.compute(self.signals)
        f2 = forecast.compute(self.signals)
        self.assertEqual(f1, f2)

    def test_empty_signals_handled(self) -> None:
        result = forecast.compute([])
        self.assertIn("summary", result)
        self.assertEqual(result["platform_health_score"], 0.0)


class PlatformEvidenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.signals = signals.collect()
        self.evidence = evidence.gather(self.signals)

    def test_evidence_count_matches_signals(self) -> None:
        self.assertEqual(len(self.evidence), len(self.signals))

    def test_evidence_ids_are_unique(self) -> None:
        ids = [ev["id"] for ev in self.evidence]
        self.assertEqual(len(ids), len(set(ids)))

    def test_evidence_links_back_to_signals(self) -> None:
        signal_ids = {s["id"] for s in self.signals}
        for ev in self.evidence:
            self.assertIn(ev["from_signal"], signal_ids)

    def test_evidence_ids_prefixed_with_platform(self) -> None:
        for ev in self.evidence:
            self.assertTrue(ev["id"].startswith("ev_platform_"))


class PlatformRecommendationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.signals = signals.collect()
        self.forecast_data = forecast.compute(self.signals)
        self.evidence_data = evidence.gather(self.signals)
        self.rec = recommendations.build(
            signals=self.signals,
            forecast=self.forecast_data,
            evidence=self.evidence_data,
        )

    def test_recommendation_passes_contract(self) -> None:
        errors = validate_recommendation(self.rec)
        self.assertEqual(errors, [], f"Contract errors: {errors}")

    def test_recommendation_vertical_is_platform(self) -> None:
        self.assertEqual(self.rec.vertical, "platform")

    def test_recommendation_requires_human_approval(self) -> None:
        self.assertTrue(
            self.rec.requires_human_approval,
            "Platform release gate must always require human approval",
        )

    def test_recommendation_input_class_is_production_deploy(self) -> None:
        self.assertEqual(self.rec.input_class, "production_deploy")

    def test_evidence_ids_reference_gathered_evidence(self) -> None:
        ev_ids = {ev["id"] for ev in self.evidence_data}
        for eid in self.rec.evidence_ids:
            self.assertIn(eid, ev_ids)

    def test_recommendation_is_deterministic(self) -> None:
        rec2 = recommendations.build(
            signals=self.signals,
            forecast=self.forecast_data,
            evidence=self.evidence_data,
        )
        self.assertEqual(self.rec.to_dict(), rec2.to_dict())


class PlatformBriefTests(unittest.TestCase):
    def setUp(self) -> None:
        self.signals = signals.collect()
        self.forecast_data = forecast.compute(self.signals)
        self.evidence_data = evidence.gather(self.signals)
        self.rec = recommendations.build(
            signals=self.signals,
            forecast=self.forecast_data,
            evidence=self.evidence_data,
        )
        self.brief = brief.synthesise(
            signals=self.signals,
            forecast=self.forecast_data,
            evidence=self.evidence_data,
            recommendation=self.rec,
        )

    def test_brief_has_headline(self) -> None:
        self.assertIn("headline", self.brief)
        self.assertIsInstance(self.brief["headline"], str)

    def test_brief_has_top_decision(self) -> None:
        self.assertIn("top_decision", self.brief)

    def test_brief_evidence_count_matches(self) -> None:
        self.assertEqual(self.brief["evidence_count"], len(self.evidence_data))

    def test_brief_requires_human_approval_propagated(self) -> None:
        self.assertTrue(self.brief["requires_human_approval"])


if __name__ == "__main__":
    unittest.main()
