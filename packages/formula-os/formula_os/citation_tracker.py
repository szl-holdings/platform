"""
citation_tracker.py — tracks which PURIQ organs invoke which formula.

Each organ's {decide,act,reflect} interface cites the formulas it relies on.
This builds the inverse index (formula -> organs) used by the /formulas tab and
by GAP_CHECK to confirm every formula has at least one organ consumer.

Author: Yachay (CTO), SZL Holdings. 2026-06-01.
"""
from __future__ import annotations
from collections import defaultdict

# Canonical organ -> formulas it invokes (derived from PURIQ_FORMULA_SUITE.md
# "Organ" column + master-formula factor wiring). Pure metadata, additive.
ORGAN_INVOCATIONS: dict[str, list[str]] = {
    "Khipu":        ["F1", "F3", "F7", "F21"],
    "Kallpa":       ["F2", "F7", "F17"],
    "Yuyay":        ["F4", "F9"],
    "HUKLLA":       ["F6", "F8", "F12", "F16"],
    "Lambda-spine": ["F10", "F13"],
    "A/agency":     ["F5", "F11", "F14", "F18", "F20", "F22", "F23"],
    "PURIQ-core":   ["F19"],
    "compose":      ["F15"],
}


def formula_to_organs() -> dict[str, list[str]]:
    inv: dict[str, list[str]] = defaultdict(list)
    for organ, fids in ORGAN_INVOCATIONS.items():
        for fid in fids:
            inv[fid].append(organ)
    return dict(inv)


def organs_for(fid: str) -> list[str]:
    return formula_to_organs().get(fid, [])


def coverage_report() -> dict[str, int]:
    inv = formula_to_organs()
    return {fid: len(organs) for fid, organs in inv.items()}
