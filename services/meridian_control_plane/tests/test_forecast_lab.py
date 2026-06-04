"""Unit tests for the Forecast Lab baseline forecaster."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from services.meridian_forecast_lab.forecast_lab import (
    METRICS,
    forecast_metric,
    run_baseline,
)


class TestForecastLabDeterminism(unittest.TestCase):
    def test_run_baseline_is_deterministic(self) -> None:
        a1 = run_baseline()
        a2 = run_baseline()
        a1.pop("generated_at", None)
        a2.pop("generated_at", None)
        a1.pop("determinism_hash", None)
        a2.pop("determinism_hash", None)
        self.assertEqual(a1, a2)

    def test_forecast_metric_is_deterministic(self) -> None:
        mid = "revenue_pipeline_velocity"
        r1 = forecast_metric(mid, METRICS[mid])
        r2 = forecast_metric(mid, METRICS[mid])
        self.assertEqual(r1, r2)

    def test_all_eight_metrics_present(self) -> None:
        expected = {
            "revenue_pipeline_velocity",
            "delivery_risk",
            "incident_likelihood",
            "customer_demand",
            "cash_runway",
            "engineering_throughput",
            "market_timing",
            "platform_adoption",
        }
        self.assertEqual(set(METRICS.keys()), expected)


class TestForecastLabPredictionIntervals(unittest.TestCase):
    def test_each_metric_has_prediction_intervals(self) -> None:
        artifact = run_baseline()
        for mid, result in artifact["metrics"].items():
            fc = result["forecast"]
            self.assertIn("lower80", fc, f"{mid} missing lower80")
            self.assertIn("upper80", fc, f"{mid} missing upper80")
            self.assertIn("lower95", fc, f"{mid} missing lower95")
            self.assertIn("upper95", fc, f"{mid} missing upper95")
            self.assertIn("point", fc, f"{mid} missing point")

    def test_80_interval_narrower_than_95(self) -> None:
        artifact = run_baseline()
        for mid, result in artifact["metrics"].items():
            fc = result["forecast"]
            width80 = fc["upper80"] - fc["lower80"]
            width95 = fc["upper95"] - fc["lower95"]
            self.assertLess(width80, width95, f"{mid}: 80% interval should be narrower than 95%")

    def test_calibration_score_in_range(self) -> None:
        artifact = run_baseline()
        for mid, result in artifact["metrics"].items():
            score = result["calibration_score"]
            self.assertGreaterEqual(score, 0.0, f"{mid}: calibration score below 0")
            self.assertLessEqual(score, 1.0, f"{mid}: calibration score above 1")

    def test_avg_calibration_score_present(self) -> None:
        artifact = run_baseline()
        self.assertIn("avg_calibration_score", artifact)
        self.assertGreater(artifact["avg_calibration_score"], 0.0)


class TestForecastLabArtifact(unittest.TestCase):
    def test_artifact_has_determinism_hash(self) -> None:
        artifact = run_baseline()
        self.assertIn("determinism_hash", artifact)
        self.assertIsInstance(artifact["determinism_hash"], str)
        self.assertEqual(len(artifact["determinism_hash"]), 64)

    def test_artifact_metric_count_matches_metrics_dict(self) -> None:
        artifact = run_baseline()
        self.assertEqual(artifact["metric_count"], len(METRICS))

    def test_cli_write_and_check(self) -> None:
        from services.meridian_forecast_lab.forecast_lab import main
        with tempfile.TemporaryDirectory() as tmpdir:
            out_path = Path(tmpdir) / "forecast-baseline.json"
            exit_code = main(["--output", str(out_path)])
            self.assertEqual(exit_code, 0)
            self.assertTrue(out_path.exists())

            check_code = main(["--output", str(out_path), "--check"])
            self.assertEqual(check_code, 0)

    def test_cli_check_fails_on_missing_file(self) -> None:
        from services.meridian_forecast_lab.forecast_lab import main
        exit_code = main(["--output", "/nonexistent/path.json", "--check"])
        self.assertNotEqual(exit_code, 0)


if __name__ == "__main__":
    unittest.main()
