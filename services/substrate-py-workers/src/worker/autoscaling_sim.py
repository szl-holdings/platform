"""
Autoscaling simulation test — validates that the AutoscalingPolicy emits
scale-out signals at the correct queue depth threshold.

This is a pure in-process simulation; it makes no cloud API calls.
Run it directly:
    python -m worker.autoscaling_sim

Or via pytest:
    pytest services/substrate-py-workers/tests/test_autoscaling_sim.py
"""

from __future__ import annotations

import os
import time

from .autoscaling import AutoscalingPolicy, WorkerCapacityReport

SCALE_OUT_QUEUE_DEPTH = int(os.environ.get("SCALE_OUT_QUEUE_DEPTH", "3"))
MAX_WORKERS = int(os.environ.get("MAX_WORKERS", "10"))
MIN_WORKERS = int(os.environ.get("MIN_WORKERS", "1"))


def _make_report(
    worker_id: str,
    active_claims: int,
    max_concurrency: int = 4,
    draining: bool = False,
    uptime: float = 300.0,
) -> WorkerCapacityReport:
    return WorkerCapacityReport(
        worker_id=worker_id,
        active_claims=active_claims,
        max_concurrency=max_concurrency,
        available_slots=max(0, max_concurrency - active_claims) if not draining else 0,
        draining=draining,
        cpu_percent=0.0,
        memory_percent=0.0,
        uptime_seconds=uptime,
        timestamp=time.time(),
    )


def run_scale_out_simulation() -> bool:
    """
    Simulate a queue-depth surge and verify scale-out fires.

    Scenario:
      - 1 worker running at full capacity (4/4 claims)
      - External queue depth = SCALE_OUT_QUEUE_DEPTH
      - Expected: AutoscalingPolicy recommends "scale-out"

    Returns True if the simulation passes.
    """
    policy = AutoscalingPolicy()

    # Single worker at full capacity
    full_worker = _make_report("py-worker-sim-0", active_claims=4, max_concurrency=4)
    reports = [full_worker]
    policy.report_activity("py-worker-sim-0")

    # Queue depth is exactly at the threshold
    queue_depth = SCALE_OUT_QUEUE_DEPTH
    rec = policy.evaluate(reports, queue_depth=queue_depth)

    assert rec.action == "scale-out", (
        f"Expected scale-out at queue_depth={queue_depth}, available_slots=0, "
        f"got action={rec.action!r} reason={rec.reason!r}"
    )
    assert rec.desired_workers > rec.current_workers, (
        f"desired_workers={rec.desired_workers} must exceed current_workers={rec.current_workers}"
    )
    assert rec.desired_workers <= MAX_WORKERS, (
        f"desired_workers={rec.desired_workers} exceeds MAX_WORKERS={MAX_WORKERS}"
    )
    return True


def run_scale_in_simulation() -> bool:
    """
    Simulate a period of idleness and verify scale-in fires.

    Scenario:
      - 2 workers, one idle for > SCALE_IN_IDLE_SECONDS
      - Expected: AutoscalingPolicy recommends "scale-in"
    """
    import os
    scale_in_idle = float(os.environ.get("SCALE_IN_IDLE_SECONDS", "120.0"))

    policy = AutoscalingPolicy()

    # Worker 0: active, recently used
    worker0 = _make_report("py-worker-sim-0", active_claims=1)
    policy.report_activity("py-worker-sim-0")

    # Worker 1: idle for > scale_in_idle seconds
    worker1 = _make_report("py-worker-sim-1", active_claims=0, uptime=scale_in_idle + 60)
    # Don't call report_activity for worker1 — it has no recent activity

    # Backdate the last_activity timestamp for worker1 by injecting into _last_activity
    policy._last_activity["py-worker-sim-1"] = time.monotonic() - (scale_in_idle + 10)

    reports = [worker0, worker1]
    rec = policy.evaluate(reports, queue_depth=0)

    assert rec.action == "scale-in", (
        f"Expected scale-in for idle worker, got action={rec.action!r} reason={rec.reason!r}"
    )
    assert rec.desired_workers < rec.current_workers
    assert rec.desired_workers >= MIN_WORKERS
    return True


def run_hold_simulation() -> bool:
    """
    Simulate a healthy fleet and verify hold is returned.
    """
    policy = AutoscalingPolicy()

    worker0 = _make_report("py-worker-sim-0", active_claims=2)
    policy.report_activity("py-worker-sim-0")

    reports = [worker0]
    rec = policy.evaluate(reports, queue_depth=1)

    # available_slots = 2, queue_depth = 1 → no scale-out
    # worker is active → no scale-in
    assert rec.action == "hold", (
        f"Expected hold for healthy fleet, got {rec.action!r} reason={rec.reason!r}"
    )
    return True


def run_all() -> None:
    """Run all simulation scenarios and print results."""
    results = [
        ("scale-out fires at queue depth threshold", run_scale_out_simulation),
        ("scale-in fires after idle timeout", run_scale_in_simulation),
        ("hold when fleet is healthy", run_hold_simulation),
    ]

    all_passed = True
    for name, fn in results:
        try:
            fn()
            print(f"  PASS  {name}")
        except AssertionError as e:
            print(f"  FAIL  {name}: {e}")
            all_passed = False

    if all_passed:
        print("\nAutoscaling simulation: all scenarios PASSED")
    else:
        raise SystemExit("Autoscaling simulation: FAILED — see above")


if __name__ == "__main__":
    run_all()
