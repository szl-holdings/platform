#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Apply the exact behavior-neutral cleanup tracked by platform#685."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TARGET = ROOT / "tools" / "a11oy_frontier.py"

IMPORT_OLD = "from dataclasses import dataclass, field, asdict"
IMPORT_NEW = "from dataclasses import dataclass, asdict"
NUM_OLD = '''\n_NUM = re.compile(r"([0-9][0-9_,]*\\.?[0-9]*)\\s*(GB/s|MB/s|tokens/s|tok/s)", re.I)\n'''


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"expected exactly one {label} anchor, found {count}")
    return text.replace(old, new, 1)


def main() -> int:
    text = TARGET.read_text(encoding="utf-8")
    text = replace_once(text, IMPORT_OLD, IMPORT_NEW, "dataclasses import")
    text = replace_once(text, NUM_OLD, "\n", "unused _NUM declaration")
    TARGET.write_text(text, encoding="utf-8")

    updated = TARGET.read_text(encoding="utf-8")
    if "from dataclasses import dataclass, field, asdict" in updated:
        raise RuntimeError("unused field import remains")
    if "_NUM = re.compile" in updated:
        raise RuntimeError("unused _NUM declaration remains")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
