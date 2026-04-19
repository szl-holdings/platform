#!/usr/bin/env python3
"""Build the @terra_re subaccount X launch kit."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.append(str(ROOT.parent))

from _subkit_lib import KitConfig, build_kit  # noqa: E402

PARENT_KIT = ROOT.parent / "szl-x-launch-kit"

CONFIG = KitConfig(
    handle="terra_re",
    wordmark="TERRA",
    parent_wordmark="SZL",
    parent_tag="× SZL HOLDINGS",
    monogram="TRA",
    eyebrow="TERRA  ·  REAL ESTATE INTELLIGENCE",
    headline="One operating surface\nfor serious real estate.",
    subline="Distress · portfolio · broker · investor — six intelligence domains, one console.",
    accent=(96, 196, 132),       # Terra green
    accent_soft=(170, 220, 188),
    bg_top=(4, 12, 8),
    bg_bottom=(8, 22, 16),
    chips=["DISTRESS", "PORTFOLIO", "BROKER", "INVESTOR"],
    operating_loop="·  SOURCE  ·  SCORE  ·  GOVERN  ·  CLOSE",
    raw_screenshots_dir=PARENT_KIT / "screenshots" / "raw",
    screenshots=[
        ("terra-intelligence.jpg", "terra-16x9.png", "terra-1x1.png"),
        ("terra-platform.jpg", "terra-platform-16x9.png", "terra-platform-1x1.png"),
        ("command-overview.jpg", "command-16x9.png", None),
        ("szl-operating-doctrine.jpg", "doctrine-16x9.png", None),
    ],
    profile_name="Terra (SZL)",
    bio_lines=[
        "Real estate intelligence platform — distress,",
        "portfolio, broker and investor on one surface.",
        "A SZL Holdings product · Source → Score → Close.",
    ],
)


if __name__ == "__main__":
    build_kit(CONFIG, ROOT)
