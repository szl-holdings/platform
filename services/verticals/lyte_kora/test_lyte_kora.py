from __future__ import annotations

import unittest

from services.verticals.contracts import validate_recommendation
from services.verticals.lyte_kora import (
    brief,
    evidence,
    forecast,
    recommendations,
    signals,
)


class LyteKoraPackTests(unittest.TestCase):
    def setUp(self) -> None:
        self.signals = signals.collect()
        self.forecast = forecast.compute(self.signals)
        self.evidence = evidence.gather(self.signals)
        self.rec = recommendations.build(
            signals=self.signals, forecast=self.forecast, evidence=self.evidence
        )

    def test_recommendation_passes_contract(self) -> None:
        self.assertEqual(validate_recommendation(self.rec), [])
        self.assertEqual(self.rec.vertical, "lyte_kora")

    def test_brief_includes_stuck_decision_score(self) -> None:
        out = brief.synthesise(
            signals=self.signals,
            forecast=self.forecast,
            evidence=self.evidence,
            recommendation=self.rec,
        )
        self.assertIn("stuck_decision_score", out)


if __name__ == "__main__":
    unittest.main()
