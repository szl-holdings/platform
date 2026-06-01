"""
evaluator.py — live numeric evaluation of a PURIQ formula against current
empire state (or sampled synthetic inputs).

The evaluator (1) samples inputs from the formula's registered sampler or accepts
an explicit input dict mapped from receipt/state, (2) computes the formula's
current value where a scalar value is meaningful, and (3) checks the formula's
claimed identity. Returns a structured EvalResult.

Author: Yachay (CTO), SZL Holdings. 2026-06-01.
"""
from __future__ import annotations
import random
import time
from dataclasses import dataclass, field

from .registry import FormulaSpec
from . import formulas as F


# Map each formula to a representative scalar "current value" for the dashboard.
def _scalar_value(fid: str, args: tuple):
    try:
        if fid == "F1":
            return F.f1_euler_char(*args)
        if fid == "F4":
            return round(F.f4_yuyay_lower_bound(*args), 6)
        if fid == "F7":
            return round(F.f7_provenance_partial(args[0], 5000), 6)
        if fid == "F10":
            return 577 / 408
        if fid == "F11":
            a, h = args
            return round(F.f11_frustum_volume(a, a / 2, h), 6)
        if fid == "F13":
            return round(2 * 3.141592653589793 * args[0], 6)
        if fid == "F14":
            return F.f14_partitions(args[0])
        if fid == "F16":
            lo, _ = F.f16_game_value_2x2([[args[0], args[1]], [args[2], args[3]]])
            return round(lo, 6)
        if fid == "F17":
            p = args[0]
            s = sum(p)
            if s > 0:
                return round(F.f17_entropy([x / s for x in p]), 6)
            return 0.0
        if fid == "F18":
            return F.f18_num_programs_up_to(args[0])
        if fid == "F23":
            return round(F.f23_bekenstein_cap(abs(args[0]), abs(args[1]), args[2]), 4)
    except Exception:
        return None
    return None


@dataclass
class EvalResult:
    formula_id: str
    ts: float
    args_repr: str
    value: object
    identity_holds: bool
    error: str | None = None


def evaluate(spec: FormulaSpec, rng: random.Random,
             explicit_args: tuple | None = None) -> EvalResult:
    args = explicit_args if explicit_args is not None else spec.sampler(rng)
    err = None
    holds = False
    val = None
    try:
        holds = bool(spec.identity(*args))
        val = _scalar_value(spec.fid, args)
    except Exception as e:  # honest: capture, never hide
        err = f"{type(e).__name__}: {e}"
    return EvalResult(
        formula_id=spec.fid, ts=time.time(),
        args_repr=repr(args)[:200], value=val, identity_holds=holds, error=err,
    )
