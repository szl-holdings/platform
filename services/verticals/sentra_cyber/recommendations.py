"""Sentra Cyber recommendations stub."""

from __future__ import annotations

from typing import Any

from services.verticals.contracts import Recommendation


def build(
    *, signals: list[dict[str, Any]], forecast: dict[str, Any], evidence: list[dict[str, Any]]
) -> Recommendation:
    return Recommendation(
        id="rec_sentra_cve_remediation",
        vertical="sentra-cyber",
        title="Remediate CVE-2026-0142 across all production services within 24h",
        owner="ciso@szl",
        confidence=float(forecast.get("confidence", 0.78)),
        evidence_ids=[e["id"] for e in evidence],
        next_action="Patch affected dependencies and redeploy; validate via DAST scan.",
        rollback_path="If patch breaks functionality, pin to last-known-good version and re-escalate.",
        input_class="sentra_signals_v1",
        output_class="sentra_brief_v1",
    )
