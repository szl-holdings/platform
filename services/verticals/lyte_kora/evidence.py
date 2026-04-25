from __future__ import annotations

from typing import Any


def gather(signals: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "id": f"ev_lyte_{s['id']}",
            "from_signal": s["id"],
            "source": s["source"],
            "claim": s["summary"],
        }
        for s in signals
    ]
