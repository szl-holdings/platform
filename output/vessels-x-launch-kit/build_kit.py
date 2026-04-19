#!/usr/bin/env python3
"""Build the @vessels_maritime subaccount X launch kit."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT.parent))

from _subkit_lib import KitConfig, build_kit  # noqa: E402

PARENT_KIT = ROOT.parent / "szl-x-launch-kit"

CONFIG = KitConfig(
    handle="vessels_maritime",
    wordmark="VESSELS",
    parent_wordmark="SZL",
    parent_tag="× SZL HOLDINGS",
    monogram="VSL",
    eyebrow="VESSELS  ·  MARITIME COMMAND",
    headline="Fleet operations,\ndecided faster.",
    subline="Live AIS · voyage economics · exceptions triage · compliance — one command surface.",
    accent=(46, 196, 220),       # Vessels cyan
    accent_soft=(140, 220, 232),
    bg_top=(4, 10, 16),
    bg_bottom=(8, 22, 32),
    chips=["AIS", "VOYAGE", "EXCEPTIONS", "COMPLIANCE"],
    operating_loop="·  TRACK  ·  TRIAGE  ·  ROUTE  ·  REPORT",
    raw_screenshots_dir=PARENT_KIT / "screenshots" / "raw",
    screenshots=[
        ("vessels-maritime.jpg", "vessels-16x9.png", "vessels-1x1.png"),
        ("vessels-platform.jpg", "vessels-platform-16x9.png", "vessels-platform-1x1.png"),
        ("command-overview.jpg", "command-16x9.png", None),
        ("szl-operating-doctrine.jpg", "doctrine-16x9.png", None),
    ],
    profile_name="Vessels (SZL)",
    bio_lines=[
        "Maritime intelligence platform — AIS,",
        "voyage economics, exceptions, compliance.",
        "A SZL Holdings product · Track → Triage → Route.",
    ],
)


if __name__ == "__main__":
    build_kit(CONFIG, ROOT)
