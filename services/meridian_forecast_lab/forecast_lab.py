"""Meridian Forecast Lab — deterministic calibrated baseline forecaster.

Produces calibrated prediction intervals for a set of business metrics using
a deterministic algorithm (exponential smoothing over a synthetic history)
that requires no external model or network access. This makes it suitable for
CI and for establishing a reproducible baseline that the audit gate can diff
across runs.

Usage (via pnpm):
    pnpm run meridian:forecast:baseline

Outputs ``reports/forecast-baseline.json`` with:
  - per-metric point forecast + 80% and 95% prediction intervals
  - a calibration score (coverage ratio)
  - a determinism hash so the audit gate can verify the artifact is unchanged

Research seams:
- Darts / StatsForecast: drop-in replacement for the stub forecasters below
- Arize Phoenix: hook into ``_emit_calibration_record()`` for drift detection
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[2]
OUTPUT_PATH = REPO_ROOT / "reports" / "forecast-baseline.json"

# Synthetic history length (periods).  Must be deterministic — never use
# random seeds or wall-clock time as inputs to the baseline algorithm.
HISTORY_LEN = 24
ALPHA = 0.3  # exponential-smoothing weight


METRICS: dict[str, dict[str, Any]] = {
    "revenue_pipeline_velocity": {
        "baseline_value": 1_200_000,
        "trend": 0.04,
        "volatility": 0.08,
        "unit": "USD/quarter",
        "owner": "cro@szl",
    },
    "delivery_risk": {
        "baseline_value": 0.18,
        "trend": -0.01,
        "volatility": 0.03,
        "unit": "ratio",
        "owner": "eng-vp@szl",
    },
    "incident_likelihood": {
        "baseline_value": 0.12,
        "trend": -0.005,
        "volatility": 0.025,
        "unit": "ratio",
        "owner": "cto@szl",
    },
    "customer_demand": {
        "baseline_value": 850,
        "trend": 0.06,
        "volatility": 0.10,
        "unit": "active_accounts",
        "owner": "cro@szl",
    },
    "cash_runway": {
        "baseline_value": 18.5,
        "trend": -0.02,
        "volatility": 0.05,
        "unit": "months",
        "owner": "cfo@szl",
    },
    "engineering_throughput": {
        "baseline_value": 42,
        "trend": 0.02,
        "volatility": 0.07,
        "unit": "story_points/sprint",
        "owner": "eng-vp@szl",
    },
    "market_timing": {
        "baseline_value": 0.65,
        "trend": 0.01,
        "volatility": 0.04,
        "unit": "readiness_score",
        "owner": "ceo@szl",
    },
    "platform_adoption": {
        "baseline_value": 0.28,
        "trend": 0.03,
        "volatility": 0.06,
        "unit": "adoption_rate",
        "owner": "cpo@szl",
    },
}


def _synthetic_history(baseline: float, trend: float, volatility: float, n: int) -> list[float]:
    """Generate deterministic pseudo-history via a linear-trend + fixed-cycle perturbation.

    No random numbers — the cycle is derived from the parameter hash so
    different metrics produce different histories without any seed state.
    """
    param_hash = int(hashlib.md5(f"{baseline}{trend}{volatility}".encode()).hexdigest(), 16)
    history: list[float] = []
    for i in range(n):
        cycle_component = math.sin(2 * math.pi * i / 12) * volatility * baseline
        hash_jitter = ((param_hash >> (i % 32)) & 0xFF) / 255.0 * volatility * baseline * 0.5
        value = baseline * (1 + trend * i / 12) + cycle_component + hash_jitter
        history.append(round(value, 6))
    return history


def _exp_smooth(history: list[float], alpha: float) -> float:
    """One-step-ahead exponential smoothing forecast."""
    smoothed = history[0]
    for obs in history[1:]:
        smoothed = alpha * obs + (1 - alpha) * smoothed
    return round(smoothed, 6)


def _prediction_interval(
    point: float, volatility: float, baseline: float, z80: float = 1.282, z95: float = 1.960
) -> dict[str, float]:
    """Return 80% and 95% symmetric prediction intervals."""
    sigma = abs(baseline * volatility)
    return {
        "point": round(point, 6),
        "lower80": round(point - z80 * sigma, 6),
        "upper80": round(point + z80 * sigma, 6),
        "lower95": round(point - z95 * sigma, 6),
        "upper95": round(point + z95 * sigma, 6),
    }


def _calibration_score(history: list[float], point: float, volatility: float, baseline: float) -> float:
    """Estimate calibration as the fraction of history within the 80% PI."""
    z = 1.282
    sigma = abs(baseline * volatility)
    lower = point - z * sigma
    upper = point + z * sigma
    covered = sum(1 for v in history if lower <= v <= upper)
    return round(covered / len(history), 4) if history else 0.0


def forecast_metric(metric_id: str, meta: dict[str, Any]) -> dict[str, Any]:
    baseline = float(meta["baseline_value"])
    trend = float(meta["trend"])
    volatility = float(meta["volatility"])

    history = _synthetic_history(baseline, trend, volatility, HISTORY_LEN)
    point = _exp_smooth(history, ALPHA)
    intervals = _prediction_interval(point, volatility, baseline)
    calibration = _calibration_score(history, point, volatility, baseline)

    return {
        "metric": metric_id,
        "unit": meta["unit"],
        "owner": meta["owner"],
        "horizon": "1_period",
        "method": "exp_smoothing_v1",
        "history_len": HISTORY_LEN,
        "alpha": ALPHA,
        "forecast": intervals,
        "calibration_score": calibration,
    }


def run_baseline() -> dict[str, Any]:
    """Produce a full baseline forecast for all metrics and return the artifact dict."""
    results = {mid: forecast_metric(mid, meta) for mid, meta in METRICS.items()}

    avg_calibration = round(
        sum(r["calibration_score"] for r in results.values()) / len(results), 4
    )

    # Build the stable (time-independent) payload first so the hash is
    # reproducible across runs.  generated_at is volatile and MUST be excluded
    # from the hash computation — including it would cause a hash mismatch on
    # every re-run, breaking the CI determinism guarantee.
    stable_payload: dict[str, Any] = {
        "method": "exp_smoothing_v1",
        "alpha": ALPHA,
        "history_len": HISTORY_LEN,
        "metric_count": len(results),
        "avg_calibration_score": avg_calibration,
        "metrics": results,
    }

    content_hash = hashlib.sha256(
        json.dumps(stable_payload, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()

    artifact: dict[str, Any] = {
        "generated_at": _utc_now(),
        **stable_payload,
        "determinism_hash": content_hash,
    }

    return artifact


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default=str(OUTPUT_PATH), help="Output JSON path")
    parser.add_argument("--check", action="store_true", help="Verify existing artifact hash")
    args = parser.parse_args(argv)

    output_path = Path(args.output)

    if args.check:
        if not output_path.exists():
            print(f"[forecast-lab] FAIL: artifact not found at {output_path}")
            return 1
        stored = json.loads(output_path.read_text(encoding="utf-8"))
        stored_hash = stored.pop("determinism_hash", "")
        # generated_at is volatile — exclude it from the hash before verifying
        # so the check passes on any subsequent run, not only on the same second.
        stored.pop("generated_at", None)
        recalculated = hashlib.sha256(
            json.dumps(stored, sort_keys=True, separators=(",", ":")).encode()
        ).hexdigest()
        if stored_hash != recalculated:
            print(f"[forecast-lab] FAIL: determinism hash mismatch — artifact may have been tampered with")
            return 1
        print(f"[forecast-lab] OK: artifact hash verified ({stored_hash[:16]}…)")
        return 0

    artifact = run_baseline()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, indent=2, sort_keys=True), encoding="utf-8")
    try:
        display_path = output_path.relative_to(REPO_ROOT)
    except ValueError:
        display_path = output_path
    print(f"[forecast-lab] wrote {display_path}")
    print(f"[forecast-lab] avg calibration score: {artifact['avg_calibration_score']}")
    print(f"[forecast-lab] determinism hash: {artifact['determinism_hash'][:16]}…")
    return 0


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


if __name__ == "__main__":
    sys.exit(main())
