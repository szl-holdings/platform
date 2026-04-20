"""
Autoscaling policy for the Python worker fleet.

Autoscaling is claim-based: the substrate coordinator tracks queue depth
and registered worker capacity, then signals the platform (e.g. Kubernetes
HPA or a container orchestrator) to scale out/in.

This module exposes:
  - AutoscalingPolicy  — evaluates metrics and emits scale recommendations
  - WorkerCapacityReport — snapshot reported to the coordinator endpoint

The actual scale-out mechanism (spawning processes, k8s replicas) is handled
by the deployment platform; this module only produces recommendations.

Drain contract:
  - When the platform requests scale-in it sends SIGTERM to the target worker.
  - The worker's ClaimLoop.drain() is called; it stops accepting new claims
    and waits up to DRAIN_TIMEOUT_S for in-flight stages to complete.
  - The worker exits once drain completes (or times out gracefully).
  - Duplicate execution is prevented because the TypeScript engine uses
    optimistic locking on the journal (stage can only transition from
    "pending" → "running" once; a second claim on the same stageId is ignored).
"""

from __future__ import annotations

import os
import time
from dataclasses import dataclass

import psutil
import structlog

log = structlog.get_logger(__name__)

# ── Thresholds (configurable via environment) ─────────────────────────────────

SCALE_OUT_QUEUE_DEPTH = int(os.environ.get("SCALE_OUT_QUEUE_DEPTH", "3"))
SCALE_IN_IDLE_SECONDS = float(os.environ.get("SCALE_IN_IDLE_SECONDS", "120.0"))
MAX_WORKERS = int(os.environ.get("MAX_WORKERS", "10"))
MIN_WORKERS = int(os.environ.get("MIN_WORKERS", "1"))


@dataclass
class WorkerCapacityReport:
    worker_id: str
    active_claims: int
    max_concurrency: int
    available_slots: int
    draining: bool
    cpu_percent: float
    memory_percent: float
    uptime_seconds: float
    timestamp: float


@dataclass
class ScaleRecommendation:
    action: str  # "scale-out" | "scale-in" | "hold"
    reason: str
    desired_workers: int
    current_workers: int


class AutoscalingPolicy:
    """
    Evaluates fleet capacity metrics and emits a scale recommendation.

    Scale-out  — triggered when total available_slots across the fleet < SCALE_OUT_QUEUE_DEPTH
    Scale-in   — triggered when a worker has been idle for > SCALE_IN_IDLE_SECONDS
    Hold       — fleet is healthy and sized correctly
    """

    def __init__(self) -> None:
        self._last_activity: dict[str, float] = {}

    def report_activity(self, worker_id: str) -> None:
        self._last_activity[worker_id] = time.monotonic()

    def evaluate(
        self,
        reports: list[WorkerCapacityReport],
        queue_depth: int = 0,
    ) -> ScaleRecommendation:
        current_workers = len(reports)
        total_available = sum(r.available_slots for r in reports)

        if total_available < queue_depth and current_workers < MAX_WORKERS:
            desired = min(MAX_WORKERS, current_workers + max(1, queue_depth // 2))
            return ScaleRecommendation(
                action="scale-out",
                reason=f"queue_depth={queue_depth} exceeds available_slots={total_available}",
                desired_workers=desired,
                current_workers=current_workers,
            )

        now = time.monotonic()
        for report in reports:
            if report.active_claims == 0 and not report.draining:
                idle_since = self._last_activity.get(report.worker_id, now - report.uptime_seconds)
                idle_for = now - idle_since
                if idle_for > SCALE_IN_IDLE_SECONDS and current_workers > MIN_WORKERS:
                    return ScaleRecommendation(
                        action="scale-in",
                        reason=f"worker {report.worker_id!r} idle for {idle_for:.0f}s",
                        desired_workers=max(MIN_WORKERS, current_workers - 1),
                        current_workers=current_workers,
                    )

        return ScaleRecommendation(
            action="hold",
            reason="fleet is healthy",
            desired_workers=current_workers,
            current_workers=current_workers,
        )


def build_capacity_report(
    worker_id: str,
    active_claims: int,
    max_concurrency: int,
    draining: bool,
    uptime_seconds: float,
) -> WorkerCapacityReport:
    proc = psutil.Process()
    return WorkerCapacityReport(
        worker_id=worker_id,
        active_claims=active_claims,
        max_concurrency=max_concurrency,
        available_slots=max(0, max_concurrency - active_claims) if not draining else 0,
        draining=draining,
        cpu_percent=proc.cpu_percent(interval=None),
        memory_percent=proc.memory_percent(),
        uptime_seconds=uptime_seconds,
        timestamp=time.time(),
    )
