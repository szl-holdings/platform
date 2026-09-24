#!/usr/bin/env python3
"""lexicon_gate.py — CI gate enforcing the canonical SZL lexicon.

One name, one category, one sentence. Banned strings fail the build.

  Canonical name:      a11oy            (never "Alloy" as a product name)
  Canonical sentence:  "SZL Holdings builds a11oy: AI that can demonstrate
                        its work through governed execution and
                        offline-verifiable receipts."
  Locked positioning:  "Codex auto-review decides. a11oy proves."
  Compliance phrase:   "Article 12 logging conformance profile"
                       (never "EU AI Act compliant")

Exit codes: 0 = clean, 1 = lexicon violations found, 2 = usage error.
On first run against the captured estate copy this gate FAILS — that is
correct; the findings are the Week 1 checklist.

Usage:
  python3 tools/lexicon_gate.py                 # scan embedded estate sample
  python3 tools/lexicon_gate.py FILE [FILE...]  # scan real files
"""

from __future__ import annotations

import pathlib
import re
import sys

# Banned patterns. Each entry: (regex, why-banned note).
BANNED: list[tuple[str, str]] = [
    (r"\bAlloy\b(?! by the)", "product name drift: the product is 'a11oy'; 'Alloy' persists in a11oy.net <title>"),
    (r"\bGoverned Inference\b", "category drift: one of five competing category labels"),
    (r"\bAgentic Orchestrator\b", "category drift: a11oy.net-era label"),
    (r"\bGoverned AI OS\b", "category drift"),
    (r"\bgoverned substrate\b", "category drift (LinkedIn-era label)"),
    (r"\bEU AI Act compliant\b", "compliance overclaim: say 'Article 12 logging conformance profile'"),
    (r"\bfully compliant\b", "unbounded compliance claim"),
    (r"\bCodex has no logs\b", "competitive overclaim: say 'not its stated purpose'"),
    (r"\bguaranteed (?:secure|safe|correct)\b", "unprovable absolute"),
    (r"\bmilitary[- ]grade\b", "unverifiable marketing absolute"),
]

# Embedded sample of live estate copy captured 2026-08-30 (sources in
# fe1_surfaces_design.md). Used when no files are passed. This is real
# observed copy, not a strawman.
ESTATE_SAMPLE = {
    "a11oy.net <title> (captured 2026-08-30)":
        "a11oy Proof Registry | Alloy by SZL Holdings",
    "a-11-oy.com <title> (captured 2026-08-30)":
        "a11oy — Governed Inference · AI that proves its receipt state and refuses to lie",
    "holdings.a-11-oy.com hero (captured 2026-08-30)":
        "Cryptographic proof infrastructure for consequential AI decisions",
}


def scan(label: str, text: str) -> list[dict]:
    findings = []
    for pattern, note in BANNED:
        for m in re.finditer(pattern, text, flags=re.IGNORECASE if "Alloy" not in pattern else 0):
            line = text.count("\n", 0, m.start()) + 1
            findings.append({
                "target": label,
                "line": line,
                "matched": m.group(0),
                "rule": pattern,
                "note": note,
            })
    return findings


def main() -> int:
    args = sys.argv[1:]
    findings: list[dict] = []
    if args:
        for name in args:
            p = pathlib.Path(name)
            if not p.is_file():
                print(f"lexicon_gate: no such file: {name}", file=sys.stderr)
                return 2
            findings.extend(scan(str(p), p.read_text(errors="replace")))
    else:
        for label, text in ESTATE_SAMPLE.items():
            findings.extend(scan(label, text))

    if findings:
        print(f"LEXICON GATE: FAIL — {len(findings)} violation(s)")
        for f in findings:
            print(f"  {f['target']}:{f['line']}: {f['matched']!r} — {f['note']}")
        print("Canonical sentence: \"SZL Holdings builds a11oy: AI that can "
              "demonstrate its work through governed execution and "
              "offline-verifiable receipts.\"")
        return 1
    print("LEXICON GATE: PASS — no banned terms")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
