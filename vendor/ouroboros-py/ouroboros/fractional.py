"""Fractional / GTC primitives — Python port (Primitives 77–79).

Faithful Python reimplementation of packages/fractional/src/*.ts.

Source
------
Mark Lohmeyer, "Google Cloud AI Infrastructure at NVIDIA GTC 2026,"
Google Cloud blog (2026). Techniques: vGPU partitioning, rack-scale
resiliency / fallback priorities, Dynamic Workload Scheduler.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Sequence


# ---------------------------------------------------------------------------
# Primitive 77 — Fractional-GPU receipt
# ---------------------------------------------------------------------------


@dataclass
class FractionalReceipt:
    tenant_id: str
    device_id: str
    fraction: float
    started_at: str
    released_at: str | None = None


class FractionalAllocator:
    def __init__(self) -> None:
        self._receipts: list[FractionalReceipt] = []

    def allocate(self, tenant_id: str, device_id: str, fraction: float, started_at: str) -> FractionalReceipt:
        if fraction <= 0 or fraction > 1:
            raise ValueError(f"invalid fraction {fraction} — must be (0,1]")
        used = sum(r.fraction for r in self._receipts if r.device_id == device_id and r.released_at is None)
        if used + fraction > 1 + 1e-9:
            raise ValueError(f"device {device_id} oversubscribed: {used} + {fraction} > 1")
        receipt = FractionalReceipt(tenant_id, device_id, fraction, started_at)
        self._receipts.append(receipt)
        return receipt

    def release(self, device_id: str, tenant_id: str, released_at: str) -> bool:
        for r in self._receipts:
            if r.device_id == device_id and r.tenant_id == tenant_id and r.released_at is None:
                r.released_at = released_at
                return True
        return False

    def active(self) -> list[FractionalReceipt]:
        return [r for r in self._receipts if r.released_at is None]

    def utilization(self, device_id: str) -> float:
        return sum(r.fraction for r in self.active() if r.device_id == device_id)

    def ledger(self) -> list[FractionalReceipt]:
        return list(self._receipts)


# ---------------------------------------------------------------------------
# Primitive 78 — Rack-scale resiliency / fallback priority
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ResiliencyTarget:
    id: str
    priority: int  # lower = higher priority
    healthy: bool


@dataclass(frozen=True)
class ResiliencySelection:
    selected_id: str | None
    fell_back_from_ids: tuple[str, ...]
    reason: str


def select_fallback(targets: Sequence[ResiliencyTarget]) -> ResiliencySelection:
    sorted_targets = sorted(targets, key=lambda t: t.priority)
    fell_back: list[str] = []
    for t in sorted_targets:
        if t.healthy:
            return ResiliencySelection(
                selected_id=t.id,
                fell_back_from_ids=tuple(fell_back),
                reason="primary healthy" if not fell_back else f"fell back past {len(fell_back)} unhealthy",
            )
        fell_back.append(t.id)
    return ResiliencySelection(None, tuple(fell_back), "no healthy target")


@dataclass(frozen=True)
class FaultScan:
    device_id: str
    scanned_at: str
    faults: tuple[str, ...]


def should_drain(scan: FaultScan, critical_faults: Sequence[str]) -> bool:
    return any(f in critical_faults for f in scan.faults)


# ---------------------------------------------------------------------------
# Primitive 79 — Dynamic Workload Scheduler with deadline receipt
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ScheduleVerdict:
    job_id: str
    accepted: bool
    estimated_finish_sec: float
    reason: str


def try_schedule(
    job_id: str,
    duration_sec: float,
    deadline_sec: float,
    available_slots: int,
    expected_queue_wait_sec: float,
) -> ScheduleVerdict:
    if available_slots <= 0 and expected_queue_wait_sec <= 0:
        return ScheduleVerdict(job_id, False, float("inf"), "no capacity")
    wait = 0.0 if available_slots > 0 else expected_queue_wait_sec
    finish = wait + duration_sec
    if finish > deadline_sec:
        return ScheduleVerdict(job_id, False, finish, f"cannot meet deadline {deadline_sec}s (finish={finish}s)")
    return ScheduleVerdict(job_id, True, finish, "deadline within capacity")


__all__ = [
    "FractionalReceipt",
    "FractionalAllocator",
    "ResiliencyTarget",
    "ResiliencySelection",
    "select_fallback",
    "FaultScan",
    "should_drain",
    "ScheduleVerdict",
    "try_schedule",
]
