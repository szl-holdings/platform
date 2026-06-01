from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_growth_proof_asset",
            "source": "customer_proof",
            "kind": "proof_asset",
            "summary": "Vessels customer cut compliance review time 41%",
            "weight": 0.85,
        },
        {
            "id": "sig_growth_channel_signal",
            "source": "posthog",
            "kind": "channel_signal",
            "summary": "Founder LinkedIn posts driving 3.2x demo book rate vs paid",
            "weight": 0.7,
        },
        {
            "id": "sig_growth_funnel_drop",
            "source": "amplitude",
            "kind": "funnel_drop",
            "summary": "Pricing page → demo book conversion down 1.8 pts WoW",
            "weight": 0.6,
        },
    ]
