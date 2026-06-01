from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_terra_flood_zone",
            "source": "geo",
            "kind": "property_risk",
            "summary": "Asset within FEMA AE flood zone (1% annual probability)",
            "weight": 0.75,
        },
        {
            "id": "sig_terra_capex_overrun",
            "source": "manual",
            "kind": "capex_risk",
            "summary": "Phase-1 capex tracking 12% above bid",
            "weight": 0.65,
        },
        {
            "id": "sig_terra_diligence_gap",
            "source": "diligence",
            "kind": "diligence_gap",
            "summary": "Environmental Phase-II report still outstanding",
            "weight": 0.8,
        },
    ]
