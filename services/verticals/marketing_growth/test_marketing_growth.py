from __future__ import annotations

import unittest

from services.verticals.contracts import validate_recommendation
from services.verticals.marketing_growth import (
    brief,
    evidence,
    forecast,
    recommendations,
    signals,
)


class MarketingGrowthPackTests(unittest.TestCase):
    def setUp(self) -> None:
        self.signals = signals.collect()
        self.forecast = forecast.compute(self.signals)
        self.evidence = evidence.gather(self.signals)
        self.rec = recommendations.build(
            signals=self.signals, forecast=self.forecast, evidence=self.evidence
        )

    def test_recommendation_passes_contract(self) -> None:
        self.assertEqual(validate_recommendation(self.rec), [])
        self.assertEqual(self.rec.vertical, "marketing_growth")

    def test_brief_includes_hyperframes_placeholder(self) -> None:
        out = brief.synthesise(
            signals=self.signals,
            forecast=self.forecast,
            evidence=self.evidence,
            recommendation=self.rec,
        )
        self.assertIn("hyperframes_video_brief_placeholder", out)
        self.assertFalse(out["hyperframes_video_brief_placeholder"]["ready_for_render"])


if __name__ == "__main__":
    unittest.main()
