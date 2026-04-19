#!/usr/bin/env python3
"""Build the @aegis_soc subaccount X launch kit.

Forks the parent SZL kit with the Aegis amber accent, defense / SOC focus, and
the SZL affiliate badge so the subaccount stays visibly tied to @szlholdings.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT.parent))

from _subkit_lib import KitConfig, build_kit  # noqa: E402

PARENT_KIT = ROOT.parent / "szl-x-launch-kit"

CONFIG = KitConfig(
    handle="aegis_soc",
    wordmark="AEGIS",
    parent_wordmark="SZL",
    parent_tag="× SZL HOLDINGS",
    monogram="AGS",
    eyebrow="AEGIS  ·  DEFENSE + INTELLIGENCE",
    headline="Four workspaces.\nOne intelligence layer.",
    subline="SOC · Legal · Command · Labs — one correlation engine, one operating model.",
    accent=(249, 165, 78),       # Aegis amber
    accent_soft=(245, 200, 130),
    bg_top=(8, 6, 4),
    bg_bottom=(22, 14, 6),
    chips=["SOC", "LEGAL", "COMMAND", "LABS"],
    operating_loop="·  DETECT  ·  CORRELATE  ·  GOVERN  ·  ACT",
    raw_screenshots_dir=PARENT_KIT / "screenshots" / "raw",
    screenshots=[
        ("aegis-dashboard.jpg", "aegis-16x9.png", "aegis-1x1.png"),
        ("aegis-command-center.jpg", "aegis-command-16x9.png", "aegis-command-1x1.png"),
        ("command-overview.jpg", "command-16x9.png", "command-1x1.png"),
        ("szl-operating-doctrine.jpg", "doctrine-16x9.png", None),
    ],
    profile_name="Aegis (SZL)",
    bio_lines=[
        "Unified defense & intelligence — SOC, Legal,",
        "Command, Labs on one correlation engine.",
        "A SZL Holdings product · Detect → Govern → Act.",
    ],
)


if __name__ == "__main__":
    build_kit(CONFIG, ROOT)
