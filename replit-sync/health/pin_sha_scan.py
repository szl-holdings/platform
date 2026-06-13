#!/usr/bin/env python3
"""
pin_sha_scan.py — SZL org auto-pilot helper.

Scans workflow files for GitHub Action `uses:` pins that point at a SHORT
(truncated/abbreviated) commit SHA instead of a full 40-hex SHA. Short-SHA pins
are a supply-chain risk (ambiguous, spoofable) — SLSA/pinning best practice is a
FULL 40-char commit SHA, optionally with a ` # vX.Y.Z` trailing comment.

STRICT to avoid the historical false-positive class (resolved in lutar-lean#224):
- Only considers REAL action-pin lines: a line whose trimmed form starts with
  `- uses:` or `uses:` AND contains `@<hex>`.
- The hex token is everything after `@` up to whitespace or `#`.
- Flags ONLY when that token is fully [0-9a-f] AND length is 7..39 (i.e. it
  LOOKS like a commit SHA but is truncated). A full 40-hex SHA is GOOD (not
  flagged). A tag/branch ref like `@v4.2.2` or `@main` is NOT hex → not flagged.
- IGNORES any hex appearing in a comment (after `#`) or in prose.

Output: JSON to stdout (and optionally a file) with the list of real bad pins.
Exit code 0 always (this is a monitor; the caller decides what to do).

Usage:
    python3 pin_sha_scan.py [--root DIR] [--json OUT.json]
Defaults: --root = current working dir, prints JSON to stdout.
"""
import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone

# Matches a real action-pin `uses:` line and captures the ref token after '@'.
# Group 'ref' = everything after '@' up to whitespace or '#'.
USES_RE = re.compile(
    r"""^\s*-?\s*uses:\s*['"]?[^@'"]+@(?P<ref>[^\s#'"]+)"""
)

HEX_RE = re.compile(r"^[0-9a-f]+$")

WORKFLOW_GLOBS = (".github/workflows",)
WORKFLOW_EXT = (".yml", ".yaml")


def strip_inline_comment(line: str) -> str:
    """Remove a trailing ` # ...` comment but keep `#` inside quotes.
    Workflow `uses:` lines don't quote the ref, so a simple split is safe here,
    but we only use this for the portion we test, never to alter the pin token.
    """
    # We do NOT strip before regex match — the regex already stops the ref at '#'.
    return line


def scan_file(path: str):
    bad = []
    try:
        with open(path, "r", encoding="utf-8", errors="replace") as fh:
            for i, raw in enumerate(fh, start=1):
                # Skip fully-commented lines.
                if raw.lstrip().startswith("#"):
                    continue
                m = USES_RE.match(raw)
                if not m:
                    continue
                ref = m.group("ref")
                # A full 40-hex SHA is the GOOD state — not a finding.
                if HEX_RE.match(ref) and 7 <= len(ref) <= 39:
                    bad.append(
                        {
                            "file": path,
                            "line": i,
                            "ref": ref,
                            "ref_len": len(ref),
                            "text": raw.rstrip("\n"),
                        }
                    )
    except (OSError, UnicodeError) as e:
        return [], str(e)
    return bad, None


def find_workflow_files(root: str):
    """Find workflow files. Works whether `root` is a single repo (has
    .github/workflows directly) OR a PARENT dir containing many repo clones
    (each with its own .github/workflows) — the cron passes the parent."""
    out = []

    def _scan_repo(repo_root: str):
        for base in WORKFLOW_GLOBS:
            wfdir = os.path.join(repo_root, base)
            if not os.path.isdir(wfdir):
                continue
            for name in sorted(os.listdir(wfdir)):
                if name.endswith(WORKFLOW_EXT):
                    out.append(os.path.join(wfdir, name))

    # direct repo root
    _scan_repo(root)
    # parent-of-clones: also scan each immediate subdirectory as a repo
    try:
        for name in sorted(os.listdir(root)):
            sub = os.path.join(root, name)
            if os.path.isdir(sub):
                _scan_repo(sub)
    except (OSError, FileNotFoundError):
        pass
    # de-dupe while preserving order
    seen = set()
    deduped = []
    for f in out:
        if f not in seen:
            seen.add(f)
            deduped.append(f)
    return deduped


def main():
    ap = argparse.ArgumentParser(description="Scan workflows for short-SHA action pins.")
    ap.add_argument("--root", default=".", help="repo root to scan (default: cwd)")
    ap.add_argument("--json", default=None, help="optional path to write JSON result")
    args = ap.parse_args()

    files = find_workflow_files(args.root)
    findings = []
    errors = []
    for f in files:
        bad, err = scan_file(f)
        findings.extend(bad)
        if err:
            errors.append({"file": f, "error": err})

    result = {
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "root": os.path.abspath(args.root),
        "workflow_files_scanned": len(files),
        "real_bad_pins": findings,
        "real_bad_pin_count": len(findings),
        "errors": errors,
        "verdict": "CLEAN — 0 real short-SHA pins"
        if not findings
        else f"ACTION NEEDED — {len(findings)} short-SHA pin(s)",
    }

    out = json.dumps(result, indent=2)
    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            fh.write(out + "\n")
    print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
