"""Unit tests for the Sentra Cyber vertical pack.

Run via:
    pnpm run verticals:validate
or directly:
    python3 -m unittest services.verticals.sentra_cyber.test_sentra_cyber
"""

from __future__ import annotations

import unittest

from services.verticals.contracts import validate_recommendation
from services.verticals.sentra_cyber import brief, evidence, forecast, recommendations, signals


class SentraCyberSignalsTests(unittest.TestCase):
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

    def test_critical_cve_signal_present(self) -> None:
        kinds = {s["kind"] for s in signals.collect()}
        self.assertIn("critical_cve", kinds)


class SentraCyberForecastTests(unittest.TestCase):
    def setUp(self) -> None:
        self.signals = signals.collect()
        self.forecast = forecast.compute(self.signals)

    def test_forecast_has_required_keys(self) -> None:
        for key in ("horizon", "method", "confidence", "summary"):
            self.assertIn(key, self.forecast)

    def test_confidence_in_range(self) -> None:
        c = self.forecast["confidence"]
        self.assertGreaterEqual(c, 0.0)
        self.assertLessEqual(c, 1.0)

    def test_forecast_is_deterministic(self) -> None:
        self.assertEqual(
            forecast.compute(self.signals),
            forecast.compute(self.signals),
        )


class SentraCyberEvidenceTests(unittest.TestCase):
    def setUp(self) -> None:
        self.signals = signals.collect()
        self.evidence = evidence.gather(self.signals)

    def test_evidence_is_non_empty(self) -> None:
        self.assertGreater(len(self.evidence), 0)

    def test_evidence_ids_are_unique(self) -> None:
        ids = [ev["id"] for ev in self.evidence]
        self.assertEqual(len(ids), len(set(ids)))

    def test_cross_vertical_evidence_present(self) -> None:
        cross_items = [ev for ev in self.evidence if ev.get("cross_vertical")]
        self.assertGreater(len(cross_items), 0, "Must have at least one cross-vertical evidence item")

    def test_cross_vertical_references_platform(self) -> None:
        cross_items = [ev for ev in self.evidence if ev.get("cross_vertical")]
        referenced_verticals = {ev.get("referenced_vertical") for ev in cross_items}
        self.assertIn("platform", referenced_verticals)

    def test_cross_vertical_references_platform_signal_id(self) -> None:
        cross_items = [ev for ev in self.evidence if ev.get("cross_vertical")]
        from_signals = {ev["from_signal"] for ev in cross_items}
        self.assertIn("sig_platform_mcp_registry", from_signals)


class SentraCyberRecommendationTests(unittest.TestCase):
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

    def test_recommendation_vertical_is_sentra_cyber(self) -> None:
        self.assertEqual(self.rec.vertical, "sentra-cyber")

    def test_recommendation_is_deterministic(self) -> None:
        rec2 = recommendations.build(
            signals=self.signals,
            forecast=self.forecast_data,
            evidence=self.evidence_data,
        )
        self.assertEqual(self.rec.to_dict(), rec2.to_dict())

    def test_evidence_ids_reference_gathered_evidence(self) -> None:
        ev_ids = {ev["id"] for ev in self.evidence_data}
        for eid in self.rec.evidence_ids:
            self.assertIn(eid, ev_ids)


class SentraCyberBriefTests(unittest.TestCase):
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

    def test_brief_has_top_decision(self) -> None:
        self.assertIn("top_decision", self.brief)

    def test_brief_evidence_count_matches(self) -> None:
        self.assertEqual(self.brief["evidence_count"], len(self.evidence_data))


if __name__ == "__main__":
    unittest.main()
