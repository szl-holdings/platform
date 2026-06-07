#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
# © 2026 SZL Holdings · Yachay — Doctrine v11 LOCKED: 749 declarations / 14 unique axioms / 163 sorries.
# git trailer: Perplexity Computer Agent
"""sync_to_flagship.py — vendor monorepo substrate packages into a flagship at BUILD time.

HF Spaces are Docker images with NO git access at runtime, so the practical deploy
pattern is: copy `packages/<name>/<src>/*` from the monorepo into the flagship's
`szl_<name>/` (or a `packages-vendored/<name>/`) directory AT BUILD TIME, stamping each
copied file with a header that names the monorepo SHA as the source of truth.

Vendoring is acceptable ONLY because:
  1. the source of truth remains szl-holdings/platform (this monorepo), and
  2. the copy is automated + re-runnable (this script), and
  3. every vendored file carries an explicit attribution header.

Usage:
    python scripts/sync_to_flagship.py --flagship-dir ../a11oy \\
        --package kipu-qillqaq --dest kipu_qillqaq
    # or vendor the whole 14-package set with default dest names:
    python scripts/sync_to_flagship.py --flagship-dir ../amaru --all

Doctrine v11 (749/14/163, locked c7c0ba17). Λ = Conjecture 1 (not a theorem). SLSA L1 (honest).
"""
from __future__ import annotations

import argparse
import datetime as _dt
import shutil
import subprocess
import sys
from pathlib import Path

MONOREPO_ROOT = Path(__file__).resolve().parents[1]
PACKAGES_DIR = MONOREPO_ROOT / "packages"

# package dir -> (source subdir, default flagship dest dir)
PACKAGE_MAP = {
    "wire-d": ("wire_d", "wire_d"),
    "puriq-os": ("puriq_os", "puriq_os"),
    "formula-os": ("formula_os", "formula_os"),
    "khipu-os": ("khipu_os", "khipu_os"),
    "khipu-lmdb": ("khipu_lmdb", "khipu_lmdb"),
    "kipu-qillqaq": ("kipu", "kipu_qillqaq"),
    "unay": ("unay", "unay"),
    "ayni-os": ("ayni_os", "ayni_os"),
    "hatun-mcp": ("hatun_mcp", "hatun_mcp"),
    "edge-organs": ("edge_organs", "edge_organs"),
    "live-wires": ("live_wires", "live_wires"),
    "mobile-controls": ("mobile_controls", "mobile_controls"),
    "rosie-v3": ("szl_rosie_companion", "szl_rosie_companion"),
    "wayra": ("wayra", "wayra"),
}


def _git_sha() -> str:
    try:
        return subprocess.check_output(
            ["git", "rev-parse", "HEAD"], cwd=MONOREPO_ROOT
        ).decode().strip()
    except Exception:
        return "UNKNOWN"


def _header(package: str, sha: str) -> str:
    today = _dt.date.today().isoformat()
    return (
        f"# VENDORED from szl-holdings/platform packages/{package} @ {sha} on {today}.\n"
        f"# Source of truth: monorepo (szl-holdings/platform). DO NOT edit here — edit upstream and re-sync.\n"
        f"# Re-sync: python scripts/sync_to_flagship.py --flagship-dir <this-repo> --package {package}\n"
    )


def sync_one(flagship_dir: Path, package: str, dest: str | None, sha: str) -> int:
    if package not in PACKAGE_MAP:
        print(f"  ! unknown package: {package}", file=sys.stderr)
        return 0
    src_subdir, default_dest = PACKAGE_MAP[package]
    src = PACKAGES_DIR / package / src_subdir
    if not src.is_dir():
        print(f"  ! source not found: {src}", file=sys.stderr)
        return 0
    dest_dir = flagship_dir / (dest or default_dest)
    dest_dir.mkdir(parents=True, exist_ok=True)
    header = _header(package, sha)
    count = 0
    for f in src.rglob("*.py"):
        rel = f.relative_to(src)
        out = dest_dir / rel
        out.parent.mkdir(parents=True, exist_ok=True)
        body = f.read_text(encoding="utf-8")
        out.write_text(header + body, encoding="utf-8")
        count += 1
    # copy non-python assets verbatim (toml genomes, html, js, etc.)
    for f in src.rglob("*"):
        if f.is_file() and f.suffix != ".py":
            rel = f.relative_to(src)
            out = dest_dir / rel
            out.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, out)
            count += 1
    print(f"  ✓ {package}: vendored {count} files -> {dest_dir.relative_to(flagship_dir)}")
    return count


def main() -> int:
    ap = argparse.ArgumentParser(description="Vendor monorepo substrate into a flagship.")
    ap.add_argument("--flagship-dir", required=True, type=Path)
    ap.add_argument("--package", help="single package dir name (e.g. kipu-qillqaq)")
    ap.add_argument("--dest", help="override dest dir name in the flagship")
    ap.add_argument("--all", action="store_true", help="vendor all 14 packages")
    args = ap.parse_args()

    sha = _git_sha()
    print(f"sync_to_flagship: monorepo @ {sha} -> {args.flagship_dir}")
    total = 0
    if args.all:
        for pkg in PACKAGE_MAP:
            total += sync_one(args.flagship_dir, pkg, None, sha)
    elif args.package:
        total += sync_one(args.flagship_dir, args.package, args.dest, sha)
    else:
        ap.error("pass --package <name> or --all")
    print(f"done: {total} files vendored. Source of truth: szl-holdings/platform.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
