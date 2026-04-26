"""Constellation Graph signals stub."""

from __future__ import annotations


def collect() -> list[dict[str, object]]:
    return [
        {
            "id": "sig_constellation_cross_domain_pattern",
            "source": "graph-engine",
            "kind": "cross_domain_pattern",
            "summary": "Maritime + Legal entity cluster shows correlated risk — 3 common counterparties",
            "weight": 0.68,
        },
        {
            "id": "sig_constellation_causal_chain",
            "source": "causal-store",
            "kind": "causal_chain_detected",
            "summary": "Revenue decline causally linked to 2 upstream contract delays in Counsel",
            "weight": 0.72,
        },
    ]
