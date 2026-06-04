# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings — Yachay (Perplexity Computer Agent)
"""
szl-puriq-os — the PURIQ-OS agentic loop runtime (additive layer built on Doctrine v11 LOCKED).

PURIQ-OS adds a scheduler + loop runtime that turns the 12 canonical organs into
autonomous agents. Each organ runs a Wiener (1948) feedback loop —
observe -> decide -> act -> sign-khipu-receipt -> loop — on a cadence chosen via the
Shannon-Nyquist (1948) sampling rule. It introduces NO new math primitive: Lambda,
the 13-axis Yuyay gate, HUKLLA T01-T10, and the Khipu ledger are reused verbatim.

NO "ancient codes", NO "Bible numerics", NO "Inca prior art" — those are explicitly
disclaimed. Integer cadences (7s/12s/49s) are engineering conveniences, not mysticism.

LOCKED numbers preserved verbatim as cited values: 749/14/163 · 13-axis yuyay_v3 ·
replay-hash bacf5443... · A2=IsHomogeneous · A4=IsBounded · SLSA L1 (honest) ·
Lambda-uniqueness Conjecture 1.

Open-source deps only: APScheduler, FastAPI, pydantic, sqlite (stdlib).
"""
from __future__ import annotations

__version__ = "1.0.0"
DOCTRINE_LAYER = "PURIQ-OS (additive over Doctrine v11 LOCKED — v12 not yet promoted)"

LOCKED = {
    "declarations": 749,
    "unique_axioms": 14,
    "tracked_sorries": 163,
    "yuyay_axes": 13,
    "replay_hash": "bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5",
    "A2": "IsHomogeneous",
    "A4": "IsBounded",
    "slsa": "L1",
    "lambda_uniqueness": "Conjecture 1",
    "hukulla_tripwires": 10,  # T01-T10 (sole halt-authority)
}

from .loop import OrganAgent, Action, LoopStatus, TickResult, utility_U  # noqa: E402
from .scheduler import PuriqScheduler  # noqa: E402
from .khipu_emit import KhipuLedger, KhipuReceipt  # noqa: E402
from .yuyay_gate import YuyayGate, YuyayScores, YuyayGateError  # noqa: E402
from .hukulla_tripwires import HukullaTripwires, TripwireResult  # noqa: E402
from .lambda_aggregator import lambda_aggregate  # noqa: E402
from .replay_hash import check_replay_hash, LOCKED_REPLAY_HASH  # noqa: E402

__all__ = [
    "check_replay_hash", "LOCKED_REPLAY_HASH",
    "OrganAgent", "Action", "LoopStatus", "TickResult", "utility_U",
    "PuriqScheduler",
    "KhipuLedger", "KhipuReceipt",
    "YuyayGate", "YuyayScores", "YuyayGateError",
    "HukullaTripwires", "TripwireResult",
    "lambda_aggregate",
    "LOCKED", "DOCTRINE_LAYER", "__version__",
]
