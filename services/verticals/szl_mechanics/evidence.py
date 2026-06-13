# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Doctrine v11 LOCKED
"""evidence — turn signals into substrate evidence rows for the FE-NO vertical."""

from __future__ import annotations

from typing import Any


def gather(signals: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "id": f"ev_mech_{s['id']}",
            "from_signal": s["id"],
            "source": s["source"],
            "claim": s["summary"],
        }
        for s in signals
    ]
