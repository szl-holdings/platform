# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings · ORCID 0009-0001-0110-4173 · Doctrine v11
"""
szl-rosie-companion — Rosie as the cross-flagship reasoning co-pilot.

Founder directive (2026-06-01 ~02:52 EDT):
    "Make sure Rosie is wired in the backend of each flag and wherever needed to be."

Rosie is the SZL ecosystem-evolve + brain-jack + 162-endpoint flagship (the nervous
system). This library lets EVERY other flagship instantiate a per-flagship
`RosieShadow` that calls Rosie's `/v1/brain/jack-<flagship>` endpoint and gets back
real reasoning plus a Khipu cross-flagship receipt.

Design principle (inherited from ROSIE_COMPANION_IN_KILLINCHU.md):
    Rosie is co-pilot, NOT pilot. It PROPOSES; the flagship's own logic and the
    2-person Yuyay gate DECIDE. Rosie cannot actuate. Every cross-flagship call
    emits a Khipu receipt recording the link (flagship -> Rosie -> response -> flagship).

Public API:
    RosieShadow(flagship_name)            — per-flagship co-pilot handle
        .ponder(context)                  — Rosie ponders the flagship's current state
        .synthesize(events)               — Rosie synthesizes from a Khipu-receipt sequence
        .evolve(strategy)                 — Rosie proposes evolution (2-person Yuyay gate REQUIRED)
        .brain_jack(query, depth)         — depth-limited recursive brain-jack reasoning
"""
from __future__ import annotations

from .companion import (
    RosieShadow,
    RosieResponse,
    EvolveProposal,
    RosieUnavailable,
    DOCTRINE,
    WIRE,
    ROSIE_BASE_URL,
    FLAGSHIPS,
    make_khipu_receipt,
    cross_link_receipt,
    lambda_signal,
    AXIS_NAMES,
)

__all__ = [
    "RosieShadow",
    "RosieResponse",
    "EvolveProposal",
    "RosieUnavailable",
    "make_khipu_receipt",
    "cross_link_receipt",
    "lambda_signal",
    "AXIS_NAMES",
    "DOCTRINE",
    "WIRE",
    "ROSIE_BASE_URL",
    "FLAGSHIPS",
]

__version__ = "1.0.0"
