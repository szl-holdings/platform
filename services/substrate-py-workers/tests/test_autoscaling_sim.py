"""
Autoscaling simulation tests — validates AutoscalingPolicy scale signals.
No cloud calls; pure in-process simulation.
"""
import pytest
from worker.autoscaling_sim import (
    run_scale_out_simulation,
    run_scale_in_simulation,
    run_hold_simulation,
)


def test_scale_out_fires_at_queue_depth_threshold():
    assert run_scale_out_simulation() is True


def test_scale_in_fires_after_idle_timeout():
    assert run_scale_in_simulation() is True


def test_hold_when_fleet_is_healthy():
    assert run_hold_simulation() is True
