from __future__ import annotations

import unittest

from services.verticals.contracts import validate_recommendation
from services.verticals.finance_fincept import (
    brief,
    evidence,
    forecast,
    recommendations,
    signals,
)


class FinanceFinceptPackTests(unittest.TestCase):
    def setUp(self) -> None:
        self.signals = signals.collect()
        self.forecast = forecast.compute(self.signals)
        self.evidence = evidence.gather(self.signals)
        self.rec = recommendations.build(
            signals=self.signals, forecast=self.forecast, evidence=self.evidence
        )

    def test_recommendation_passes_contract(self) -> None:
        self.assertEqual(validate_recommendation(self.rec), [])
        self.assertEqual(self.rec.vertical, "finance_fincept")

    def test_brief_includes_pressure_indicators(self) -> None:
        out = brief.synthesise(
            signals=self.signals,
            forecast=self.forecast,
            evidence=self.evidence,
            recommendation=self.rec,
        )
        self.assertIn("runway_pressure", out)
        self.assertIn("pricing_pressure", out)


if __name__ == "__main__":
    unittest.main()
