"""
Claim loop — concurrency management, leasing, and graceful drain.

The claim loop tracks active stage executions, enforces the per-worker
concurrency limit (maxConcurrency), and provides a drain signal so that
in-flight stages can complete before the process exits.

Design:
  - Each POST /claim increments active_claims atomically.
  - On SIGTERM the worker sets _draining = True; /ready begins returning
    503 so the load-balancer stops sending new claims.
  - Active claims are awaited; the process exits once the count reaches 0.
  - Heartbeats are emitted on a background task at HEARTBEAT_INTERVAL_S.
"""

from __future__ import annotations

import asyncio
import os
import signal
import time
import uuid
from dataclasses import dataclass, field

import structlog

log = structlog.get_logger(__name__)

MAX_CONCURRENCY = int(os.environ.get("WORKER_MAX_CONCURRENCY", "4"))
HEARTBEAT_INTERVAL_S = float(os.environ.get("WORKER_HEARTBEAT_INTERVAL_S", "5.0"))
DRAIN_TIMEOUT_S = float(os.environ.get("WORKER_DRAIN_TIMEOUT_S", "60.0"))

WORKER_ID = os.environ.get("WORKER_ID", f"py-worker-{uuid.uuid4().hex[:8]}")


@dataclass
class ClaimState:
    run_id: str
    stage_id: str
    claimed_at: float = field(default_factory=time.monotonic)
    progress: float = 0.0
    note: str = ""


class ClaimLoop:
    def __init__(self, worker_id: str = WORKER_ID, max_concurrency: int = MAX_CONCURRENCY) -> None:
        self.worker_id = worker_id
        self.max_concurrency = max_concurrency
        self._active: dict[str, ClaimState] = {}
        self._lock = asyncio.Lock()
        self._draining = False
        self._started_at = time.monotonic()

    # ── Public API ────────────────────────────────────────────────────────────

    @property
    def active_claims(self) -> int:
        return len(self._active)

    @property
    def draining(self) -> bool:
        return self._draining

    @property
    def uptime_seconds(self) -> float:
        return time.monotonic() - self._started_at

    async def try_claim(self, run_id: str, stage_id: str) -> bool:
        """
        Attempt to claim a stage slot. Returns False if at capacity or draining.
        Thread-safe (asyncio lock).
        """
        async with self._lock:
            if self._draining:
                return False
            if len(self._active) >= self.max_concurrency:
                return False
            claim_key = f"{run_id}:{stage_id}"
            if claim_key in self._active:
                log.warning("duplicate_claim", run_id=run_id, stage_id=stage_id)
                return False
            self._active[claim_key] = ClaimState(run_id=run_id, stage_id=stage_id)
            log.info("stage_claimed", run_id=run_id, stage_id=stage_id,
                     active_claims=len(self._active))
            return True

    async def release(self, run_id: str, stage_id: str) -> None:
        """Release a stage slot after completion or error."""
        async with self._lock:
            claim_key = f"{run_id}:{stage_id}"
            self._active.pop(claim_key, None)
            log.info("stage_released", run_id=run_id, stage_id=stage_id,
                     active_claims=len(self._active))

    async def update_progress(self, run_id: str, stage_id: str, percent: float, note: str = "") -> None:
        async with self._lock:
            claim = self._active.get(f"{run_id}:{stage_id}")
            if claim:
                claim.progress = percent
                claim.note = note

    def list_claims(self) -> list[ClaimState]:
        return list(self._active.values())

    # ── Drain ─────────────────────────────────────────────────────────────────

    async def drain(self) -> None:
        """
        Signal graceful drain: stop accepting new claims, wait for in-flight
        stages to complete (up to DRAIN_TIMEOUT_S), then return.
        """
        log.info("drain_started", active_claims=self.active_claims,
                 drain_timeout_s=DRAIN_TIMEOUT_S)
        async with self._lock:
            self._draining = True

        deadline = time.monotonic() + DRAIN_TIMEOUT_S
        while self.active_claims > 0 and time.monotonic() < deadline:
            await asyncio.sleep(0.5)

        remaining = self.active_claims
        if remaining:
            log.warning("drain_timeout", remaining_claims=remaining)
        else:
            log.info("drain_complete")


# ─── Module-level singleton ───────────────────────────────────────────────────

_loop = ClaimLoop()


def get_claim_loop() -> ClaimLoop:
    return _loop


# ─── SIGTERM handler — initiates graceful drain ───────────────────────────────

def _install_sigterm_handler() -> None:
    loop = asyncio.get_event_loop()

    def _handle_sigterm() -> None:
        log.info("sigterm_received")
        asyncio.ensure_future(_loop.drain())

    try:
        loop.add_signal_handler(signal.SIGTERM, _handle_sigterm)
    except (NotImplementedError, RuntimeError):
        pass


try:
    _install_sigterm_handler()
except Exception:
    pass
