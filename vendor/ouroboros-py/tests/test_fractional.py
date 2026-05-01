"""Tests for ouroboros.fractional (Primitives 77–79)."""
from __future__ import annotations

import math

import pytest

from ouroboros.fractional import (
    FractionalAllocator,
    ResiliencyTarget,
    select_fallback,
    FaultScan,
    should_drain,
    try_schedule,
)


# Primitive 77


def test_allocate_basic() -> None:
    a = FractionalAllocator()
    r = a.allocate("t1", "gpu-0", 0.5, "t0")
    assert r.fraction == 0.5


def test_allocate_rejects_invalid_fraction() -> None:
    a = FractionalAllocator()
    with pytest.raises(ValueError):
        a.allocate("t1", "gpu-0", 1.5, "t0")
    with pytest.raises(ValueError):
        a.allocate("t1", "gpu-0", 0.0, "t0")


def test_allocate_rejects_oversubscription() -> None:
    a = FractionalAllocator()
    a.allocate("t1", "gpu-0", 0.75, "t0")
    with pytest.raises(ValueError, match="oversubscribed"):
        a.allocate("t2", "gpu-0", 0.5, "t0")


def test_allocate_permits_full_one() -> None:
    a = FractionalAllocator()
    a.allocate("t1", "gpu-0", 0.5, "t0")
    a.allocate("t2", "gpu-0", 0.25, "t0")
    a.allocate("t3", "gpu-0", 0.25, "t0")
    assert math.isclose(a.utilization("gpu-0"), 1.0)


def test_release_frees_capacity() -> None:
    a = FractionalAllocator()
    a.allocate("t1", "gpu-0", 0.75, "t0")
    assert a.release("gpu-0", "t1", "t1") is True
    a.allocate("t2", "gpu-0", 0.75, "t2")
    assert math.isclose(a.utilization("gpu-0"), 0.75)


def test_release_returns_false_on_no_match() -> None:
    a = FractionalAllocator()
    assert a.release("gpu-0", "ghost", "t") is False


def test_ledger_preserves_history() -> None:
    a = FractionalAllocator()
    a.allocate("t1", "gpu-0", 0.5, "t0")
    a.release("gpu-0", "t1", "t1")
    assert len(a.ledger()) == 1
    assert a.ledger()[0].released_at == "t1"


def test_active_excludes_released() -> None:
    a = FractionalAllocator()
    a.allocate("t1", "gpu-0", 0.5, "t0")
    a.release("gpu-0", "t1", "t1")
    assert a.active() == []


def test_multi_device_isolation() -> None:
    a = FractionalAllocator()
    a.allocate("t1", "gpu-0", 1.0, "t0")
    a.allocate("t2", "gpu-1", 1.0, "t0")
    assert math.isclose(a.utilization("gpu-0"), 1.0)
    assert math.isclose(a.utilization("gpu-1"), 1.0)


# Primitive 78


def test_fallback_primary_healthy() -> None:
    r = select_fallback([ResiliencyTarget("a", 1, True), ResiliencyTarget("b", 2, True)])
    assert r.selected_id == "a"
    assert r.fell_back_from_ids == ()


def test_fallback_past_unhealthy() -> None:
    r = select_fallback([ResiliencyTarget("a", 1, False), ResiliencyTarget("b", 2, True)])
    assert r.selected_id == "b"
    assert r.fell_back_from_ids == ("a",)


def test_fallback_no_healthy() -> None:
    r = select_fallback([ResiliencyTarget("a", 1, False)])
    assert r.selected_id is None


def test_fallback_priority_order() -> None:
    r = select_fallback([ResiliencyTarget("low", 5, True), ResiliencyTarget("high", 1, True)])
    assert r.selected_id == "high"


def test_fallback_empty_targets() -> None:
    r = select_fallback([])
    assert r.selected_id is None


def test_should_drain_true() -> None:
    assert should_drain(FaultScan("g", "t", ("nvlink-down",)), ["nvlink-down"]) is True


def test_should_drain_false() -> None:
    assert should_drain(FaultScan("g", "t", ("temp-warn",)), ["nvlink-down"]) is False


def test_should_drain_empty_faults() -> None:
    assert should_drain(FaultScan("g", "t", ()), ["nvlink-down"]) is False


# Primitive 79


def test_schedule_accepts_within_deadline() -> None:
    v = try_schedule("j1", 100, 200, available_slots=1, expected_queue_wait_sec=0)
    assert v.accepted is True
    assert v.estimated_finish_sec == 100


def test_schedule_refuses_no_capacity() -> None:
    v = try_schedule("j1", 100, 200, available_slots=0, expected_queue_wait_sec=0)
    assert v.accepted is False
    assert "no capacity" in v.reason


def test_schedule_refuses_when_queue_blows_deadline() -> None:
    v = try_schedule("j1", 100, 200, available_slots=0, expected_queue_wait_sec=150)
    assert v.accepted is False


def test_schedule_accepts_with_queue_within_deadline() -> None:
    v = try_schedule("j1", 100, 300, available_slots=0, expected_queue_wait_sec=150)
    assert v.accepted is True
    assert v.estimated_finish_sec == 250


def test_schedule_finish_infinity_when_no_capacity() -> None:
    v = try_schedule("j1", 1, 1, available_slots=0, expected_queue_wait_sec=0)
    assert math.isinf(v.estimated_finish_sec)


def test_schedule_deadline_equal_to_finish() -> None:
    v = try_schedule("j1", 100, 100, available_slots=1, expected_queue_wait_sec=0)
    assert v.accepted is True
