from __future__ import annotations

import unittest

from services.verticals.contracts import validate_recommendation
from services.verticals.pulse import brief, evidence, forecast, recommendations, signals


class PulsePackTests(unittest.TestCase):
    def setUp(self) -> None:
        self.signals = signals.collect()
        self.forecast = forecast.compute(self.signals)
        self.evidence = evidence.gather(self.signals)
        self.rec = recommendations.build(
            signals=self.signals, forecast=self.forecast, evidence=self.evidence
        )

    def test_signals_are_deterministic_and_non_empty(self) -> None:
        self.assertEqual(self.signals, signals.collect())
        self.assertGreater(len(self.signals), 0)

    def test_recommendation_passes_contract(self) -> None:
        self.assertEqual(validate_recommendation(self.rec), [])
        self.assertEqual(self.rec.vertical, "pulse")
        self.assertTrue(self.rec.requires_human_approval)

    def test_brief_includes_top_decision(self) -> None:
        out = brief.synthesise(
            signals=self.signals,
            forecast=self.forecast,
            evidence=self.evidence,
            recommendation=self.rec,
        )
        self.assertIn("top_decision", out)
        self.assertEqual(out["evidence_count"], len(self.evidence))


if __name__ == "__main__":
    unittest.main()
