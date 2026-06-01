"""Sentra Cyber evidence — source-traced fact bundle.

Evidence items link each cyber signal back to its source and provide the
cross-vertical proof chain.  At least one evidence item references a signal
from the Platform pack to demonstrate cross-vertical decision provenance.
"""

from __future__ import annotations

from typing import Any


def gather(signals: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Build evidence items from collected signals, plus cross-vertical reference."""
    evidence: list[dict[str, Any]] = []

    for signal in signals:
        ev: dict[str, Any] = {
            "id": f"ev_sentra_{signal['id']}",
            "from_signal": signal["id"],
            "source": signal["source"],
            "kind": signal["kind"],
            "claim": signal["summary"],
        }
        evidence.append(ev)

    # Cross-vertical proof-chain: reference the concrete platform evidence
    # item (not just its underlying signal) so the proof chain is
    # signal → platform-evidence → cyber-evidence, not signal → cyber-evidence.
    # ev_platform_sig_platform_mcp_registry is produced by platform/evidence.py
    # for signal sig_platform_mcp_registry.
    evidence.append({
        "id": "ev_sentra_cross_platform_mcp_health",
        "from_signal": "sig_platform_mcp_registry",
        "referenced_evidence_id": "ev_platform_sig_platform_mcp_registry",
        "source": "platform-vertical/mcp-registry",
        "kind": "cross_vertical_provenance",
        "claim": (
            "Platform MCP registry health evidence (ev_platform_sig_platform_mcp_registry) "
            "referenced by Cyber pack — expanded attack surface includes MCP server endpoints."
        ),
        "cross_vertical": True,
        "referenced_vertical": "platform",
    })

    return evidence
