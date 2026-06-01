from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_fin_runway_months",
            "source": "manual",
            "kind": "runway",
            "summary": "Cash runway: 14.3 months at current burn",
            "weight": 0.9,
        },
        {
            "id": "sig_fin_arr_growth",
            "source": "stripe",
            "kind": "revenue",
            "summary": "Net-new ARR up 7.4% MoM",
            "weight": 0.55,
        },
        {
            "id": "sig_fin_pricing_pressure",
            "source": "competitive",
            "kind": "pricing",
            "summary": "Champion competitor cut entry-tier price by 18%",
            "weight": 0.7,
        },
    ]
