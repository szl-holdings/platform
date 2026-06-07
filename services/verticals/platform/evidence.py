"""Platform / AgentOps evidence — source-traced fact bundle.

Each evidence item links back to the signal that produced it, providing
the cross-vertical proof chain.  Evidence IDs from this pack are referenced
by the cyber pack (sentra_cyber) to demonstrate cross-vertical decision
provenance.
"""

from __future__ import annotations

from typing import Any


def gather(signals: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Build evidence items from collected signals."""
    evidence: list[dict[str, Any]] = []
    for signal in signals:
        ev: dict[str, Any] = {
            "id": f"ev_platform_{signal['id']}",
            "from_signal": signal["id"],
            "source": signal["source"],
            "kind": signal["kind"],
            "claim": signal["summary"],
        }
        if "metadata" in signal:
            ev["metadata"] = signal["metadata"]
        evidence.append(ev)
    return evidence
