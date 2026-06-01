"""kipu/subscribe.py — pattern-matched subscriptions.

Linda-style associative addressing (antituples): an organ subscribes to any cell matching a
template, e.g. {"organ_origin": "Yuyay", "yuyay_score": "< 0.5"}. Fixed fields must match;
operator strings (< <= > >= == != in) express comparisons. This is the KIPU analogue of Linda's
`rd`/`in` templates (https://en.wikipedia.org/wiki/Linda_(coordination_language)).
"""
from __future__ import annotations

import operator
import re
from dataclasses import dataclass, field
from typing import Any, Callable

from .cell import ReceiptCell

_OPS: dict[str, Callable[[Any, Any], bool]] = {
    "<": operator.lt, "<=": operator.le, ">": operator.gt, ">=": operator.ge,
    "==": operator.eq, "!=": operator.ne,
}
_CMP_RE = re.compile(r"^\s*(<=|>=|==|!=|<|>)\s*(.+)\s*$")


def _coerce(v: str):
    try:
        return float(v)
    except (TypeError, ValueError):
        return v


def _match_field(cell_val: Any, want: Any) -> bool:
    # operator string e.g. "< 0.5"
    if isinstance(want, str):
        m = _CMP_RE.match(want)
        if m:
            op, rhs = m.group(1), _coerce(m.group(2))
            if cell_val is None:
                return False
            try:
                return _OPS[op](cell_val, rhs)
            except TypeError:
                return False
    # membership: {"organ_subscribers": {"in": "Yuyay"}}
    if isinstance(want, dict) and "in" in want:
        try:
            return want["in"] in (cell_val or [])
        except TypeError:
            return False
    # plain equality
    return cell_val == want


def match_pattern(cell: ReceiptCell, pattern: dict) -> bool:
    """True iff every field in `pattern` matches the cell (associative addressing)."""
    d = cell.to_dict()
    for key, want in pattern.items():
        if key in ("payload_contains",):  # nested payload key/value presence
            for pk, pv in (want or {}).items():
                if cell.payload.get(pk) != pv:
                    return False
            continue
        if key not in d:
            # allow dotted payload access e.g. "payload.gate"
            if key.startswith("payload."):
                pk = key.split(".", 1)[1]
                if not _match_field(cell.payload.get(pk), want):
                    return False
                continue
            return False
        if not _match_field(d.get(key), want):
            return False
    return True


@dataclass
class Subscription:
    """A registered subscription: organ + pattern + callback."""
    organ: str
    pattern: dict
    callback: Callable[[ReceiptCell], None] = field(default=lambda c: None)
    patterns_label: str = ""  # human label e.g. "score_request"

    def matches(self, cell: ReceiptCell) -> bool:
        return match_pattern(cell, self.pattern)

    def deliver(self, cell: ReceiptCell) -> None:
        self.callback(cell)
