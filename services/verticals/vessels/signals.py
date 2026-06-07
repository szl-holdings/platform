from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_vessels_eta_drift",
            "source": "ais",
            "kind": "delay_risk",
            "summary": "ETA drift +18h on charter VL-7714 since last port call",
            "weight": 0.8,
        },
        {
            "id": "sig_vessels_route_advisory",
            "source": "weather",
            "kind": "route_risk",
            "summary": "Beaufort 8 advisory active on planned routing window",
            "weight": 0.7,
        },
        {
            "id": "sig_vessels_compliance_check",
            "source": "compliance",
            "kind": "compliance_gap",
            "summary": "Sanctions screening not refreshed in last 14 days for counterparty",
            "weight": 0.85,
        },
    ]
