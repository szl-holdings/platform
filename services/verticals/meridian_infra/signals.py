"""Meridian Infra signals stub."""

from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_meridian_cost_spike",
            "source": "cloud-billing",
            "kind": "cost_anomaly",
            "summary": "GPU cluster spend 47% above budget — unused reserved capacity",
            "weight": 0.80,
        },
        {
            "id": "sig_meridian_capacity_forecast",
            "source": "capacity-planner",
            "kind": "capacity_warning",
            "summary": "Database storage projected to reach 90% in 18 days at current growth",
            "weight": 0.70,
        },
    ]
