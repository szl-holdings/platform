"""Compatibility launcher for the recovered Packet 6 compiler."""

from __future__ import annotations

import sys
from pathlib import Path


APP_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(APP_ROOT))

from szl_factory.__main__ import main  # noqa: E402


if __name__ == "__main__":
    raise SystemExit(main())
