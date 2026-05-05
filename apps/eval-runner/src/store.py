"""
In-memory run store with TTL.
Production deployments should swap this for a Redis or PostgreSQL backend.
"""

from __future__ import annotations

import time
from typing import Any

_TTL_MS = 72 * 60 * 60 * 1000  # 72 hours


class RunStore:
    def __init__(self) -> None:
        self._records: dict[str, dict[str, Any]] = {}
        self._timestamps: dict[str, int] = {}

    def store(self, run_id: str, report: dict[str, Any]) -> None:
        self._records[run_id] = report
        self._timestamps[run_id] = int(time.time() * 1000)

    def get(self, run_id: str) -> dict[str, Any] | None:
        record = self._records.get(run_id)
        if record is None:
            return None
        ts = self._timestamps.get(run_id, 0)
        if int(time.time() * 1000) - ts > _TTL_MS:
            del self._records[run_id]
            del self._timestamps[run_id]
            return None
        return record

    def list(self, limit: int = 50) -> list[dict[str, Any]]:
        now_ms = int(time.time() * 1000)
        entries = [
            {
                "run_id": rid,
                "suite_id": rec.get("suite_id"),
                "model_id": rec.get("model_id"),
                "provider": rec.get("provider"),
                "status": rec.get("status"),
                "pass_rate": rec.get("pass_rate"),
                "aggregate_score": rec.get("aggregate_score"),
                "total_cases": rec.get("total_cases"),
                "passed_cases": rec.get("passed_cases"),
                "triggered_by": rec.get("triggered_by"),
                "started_at": rec.get("started_at"),
                "completed_at": rec.get("completed_at"),
                "content_hash": rec.get("content_hash"),
            }
            for rid, rec in self._records.items()
            if now_ms - self._timestamps.get(rid, 0) <= _TTL_MS
        ]
        entries.sort(key=lambda e: e.get("started_at") or 0, reverse=True)
        return entries[:limit]


run_store = RunStore()
