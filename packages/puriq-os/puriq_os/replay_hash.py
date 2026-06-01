# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
replay_hash.py — honest yuyay_v3 replay-hash check.

The LOCKED canonical replay hash (carried from Doctrine v11) is:
    bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5

HONESTY NOTE (read this): that 64-hex value was computed by the v11 build over the
ORIGINAL yuyay_v3 Lean/replay artifact, which is NOT present in this PURIQ-OS workspace.
We therefore CANNOT re-derive it from the artifact here, and we refuse to fabricate a
recomputation that "happens to match" — that would be dishonest.

What this module DOES do, honestly:
  1. computes a *local* canonical hash over THIS runtime's gate definition
     (axis names + floors), called `local_gate_hash`;
  2. compares it to the locked constant;
  3. if they differ (they will, because this is a different artifact), it returns
     verified=False with reason="artifact_not_present" and the caller MUST BLOCK any
     action that depends on a verified replay match.

This makes the gap visible and auditable instead of papering over it. When the real
yuyay_v3 artifact is mounted, point `compute_artifact_hash()` at it; if the result
equals the locked constant, verified flips to True legitimately.
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

LOCKED_REPLAY_HASH = "bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5"

from .yuyay_gate import (
    SACRED_AXES, STRUCTURAL_AXES, INTROSPECTION_AXES,
    SACRED_FLOOR, STRUCTURAL_FLOOR,
)


def local_gate_hash() -> str:
    """Deterministic sha256 over THIS runtime's gate definition. NOT the v11 artifact
    hash — a local fingerprint only."""
    canonical = json.dumps({
        "sacred_axes": SACRED_AXES,
        "structural_axes": STRUCTURAL_AXES,
        "introspection_axes": INTROSPECTION_AXES,
        "sacred_floor": SACRED_FLOOR,
        "structural_floor": STRUCTURAL_FLOOR,
        "scheme": "yuyay_v3-conjunctive-AND",
    }, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(canonical).hexdigest()


def compute_artifact_hash(artifact_path: Optional[str] = None) -> Optional[str]:
    """sha256 of the real yuyay_v3 replay artifact, if mounted. Returns None if absent."""
    if not artifact_path:
        return None
    p = Path(artifact_path)
    if not p.exists():
        return None
    return hashlib.sha256(p.read_bytes()).hexdigest()


@dataclass
class ReplayCheck:
    verified: bool
    reason: str
    expected: str
    actual: Optional[str]
    block: bool  # True => caller MUST block replay-dependent actions

    def as_dict(self):
        return {
            "verified": self.verified, "reason": self.reason,
            "expected": self.expected, "actual": self.actual, "block": self.block,
        }


def check_replay_hash(artifact_path: Optional[str] = None) -> ReplayCheck:
    """Honest replay-hash gate. BLOCKs (verified=False) unless the real artifact is
    present AND its sha256 equals the locked constant."""
    actual = compute_artifact_hash(artifact_path)
    if actual is None:
        return ReplayCheck(
            verified=False, reason="artifact_not_present",
            expected=LOCKED_REPLAY_HASH, actual=None, block=True,
        )
    if actual == LOCKED_REPLAY_HASH:
        return ReplayCheck(
            verified=True, reason="match", expected=LOCKED_REPLAY_HASH,
            actual=actual, block=False,
        )
    return ReplayCheck(
        verified=False, reason="hash_mismatch", expected=LOCKED_REPLAY_HASH,
        actual=actual, block=True,
    )


if __name__ == "__main__":
    import sys
    path = sys.argv[1] if len(sys.argv) > 1 else None
    chk = check_replay_hash(path)
    print(json.dumps({**chk.as_dict(), "local_gate_hash": local_gate_hash()}, indent=2))
    sys.exit(0 if chk.verified else 2)  # nonzero exit signals BLOCK
