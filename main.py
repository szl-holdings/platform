# SPDX-License-Identifier: Apache-2.0
# © 2026 Lutar, Stephen P. — SZL Holdings
# ORCID: 0009-0001-0110-4173
"""
SZL Holdings Platform — Python entry point.

This file is the Replit run target. It bootstraps the substrate
inference engine and MCP server.

For the full Ouroboros substrate (32 modules), see:
  apps/substrate-inference/src/main.py
  docs/substrate/python-worker.md
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path


def main() -> int:
    """Bootstrap the SZL Holdings substrate via the inference app entry point."""
    entry = Path(__file__).parent / "apps" / "substrate-inference" / "src" / "main.py"
    if entry.exists():
        return subprocess.call([sys.executable, str(entry)] + sys.argv[1:])
    print(
        "[szl] apps/substrate-inference/src/main.py not found — "
        "run `pnpm install && pnpm build` first.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
