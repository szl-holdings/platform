#!/usr/bin/env python3
"""release_gate.py — CI gate over the ledgers.

Blocks a raise/release while:
  * any COMMERCIAL_LEDGER row is UNKNOWN (all 24 are, by design), and/or
  * any CLAIMS_LEDGER public claim sits at UNKNOWN (evidence missing), and/or
  * any seeded estate contradiction is open.

Exit codes: 0 = all clear, 1 = gate failures, 2 = usage/parse error.
First run MUST exit 1 — the failures are the Week 1 checklist.

Usage: python3 tools/release_gate.py [ledgers_dir]
"""

from __future__ import annotations

import pathlib
import re
import sys

# Seeded estate contradictions (traceable to the four specialist reports).
# Each row: id, statement, severity. BLOCKER forces blocks_release — the
# mapping cannot drift because release_gate reads severity directly.
CONTRADICTIONS = [
    # Open as of the 2026-08-31 audit — each row is a live gate.
    ("B-02", "szl.dev (locked receipt namespace szl.dev/GovernedAction/v1) is NXDOMAIN", "BLOCKER"),
    ("B-03", "a11oy /pricing CTAs say 'Contact us' but /contact is HTTP 404", "HIGH"),
    ("B-05", "Solo founder: 12.9% vs 23.7% Series A graduation; no second named owner", "BLOCKER"),
    ("B-09", "Receipt-cannot-lie claim has never been adversarially attacked (S2.6 unrun)", "HIGH"),
    ("B-10", "Replit-era credentials never rotated; hardware-key enforcement Sep 1 2026", "HIGH"),
    ("B-11", "docs.szlholdings.com referenced as docs destination but NXDOMAIN", "HIGH"),
    ("B-12", "szl-lake references Rekor v1 anchors; v2 is GA and v1 is maintenance mode", "MEDIUM"),
]
RESOLVED = [
    ("B-01", "Collection/'Canonical public Spaces (7)' drift — org README + prove-it Space created; needs 2-min HF-UI reconcile"),
    ("B-04", "Pricing published (a11oy-net#81): Control $75-250K, Assurance $250K+ — GM/CAC residual now in COMMERCIAL_LEDGER CL-01..05"),
    ("B-06", "a11oy 'HF Space module-drift guard' — was the check doing its job against the rename; lexicon PRs merged (#1529, #1548, #1578)"),
    ("B-07", "killinchu CI 'API Health' — green since 2026-08-30 (4 consecutive passes); earlier failure was the estate's own drift signal, not a defect"),
    ("B-08", "Hand-rolled DSSE/ECDSA → in-toto-attestation 0.9.3 — szl-receipt#20 + governed-receipt-spec#5 both MERGED 2026-08-30"),
]  
# RESOLVED on 2026-08-30 (kept as history, not gating rows):
#   B-01 handled materially: org card README + prove-it Space created; collections
#       UI reconcile is a 2-min HF-UI action (connector has no collection-edit tool).
#   B-04 pricing published (a11oy-net#81): Control $75-250K, Assurance $250K+
#   B-06 a11oy drift-guard red lane was the check doing its job; renames merged.
#   B-08 BOTH migration PRs merged (szl-receipt#20, governed-receipt-spec#5).


def parse_rows(text: str) -> list[dict]:
    """Minimal parser for our own emitted YAML rows (grep-based, stdlib)."""
    rows = []
    current: dict | None = None
    for line in text.splitlines():
        m = re.match(r"^\s*-\s+id:\s*(\S+)", line)
        if m:
            if current:
                rows.append(current)
            current = {"id": m.group(1)}
            continue
        if current is None:
            continue
        for key in ("state", "value", "evidence_uri", "verified_at", "blocks_raise", "public_allowed"):
            m = re.match(rf"^\s+{key}:\s*(.+)$", line)
            if m:
                current[key] = m.group(1).strip().strip('"')
    if current:
        rows.append(current)
    return rows


def main() -> int:
    ledgers_dir = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else (
        pathlib.Path(__file__).resolve().parent.parent / "ledgers"
    )
    claims_path = ledgers_dir / "CLAIMS_LEDGER.yaml"
    commercial_path = ledgers_dir / "COMMERCIAL_LEDGER.yaml"
    for p in (claims_path, commercial_path):
        if not p.is_file():
            print(f"release_gate: missing {p} — run tools/emit_ledgers.py first", file=sys.stderr)
            return 2

    failures: list[str] = []

    commercial = parse_rows(commercial_path.read_text())
    unknown_commercial = [r for r in commercial if r.get("state") == "UNKNOWN"]
    if unknown_commercial:
        failures.append(
            f"COMMERCIAL_LEDGER: {len(unknown_commercial)}/{len(commercial)} rows UNKNOWN "
            f"(every row blocks the raise)")
        for r in unknown_commercial:
            failures.append(f"  {r['id']}: UNKNOWN — blocks_raise={r.get('blocks_raise')}")

    claims = parse_rows(claims_path.read_text())
    unknown_public = [r for r in claims
                      if r.get("state") == "UNKNOWN" and r.get("public_allowed") == "true"]
    if unknown_public:
        failures.append(f"CLAIMS_LEDGER: {len(unknown_public)} public claims at UNKNOWN")
        for r in unknown_public:
            failures.append(f"  {r['id']}: public claim without evidence")

    blockers = [c for c in CONTRADICTIONS if c[2] == "BLOCKER"]
    open_high = [c for c in CONTRADICTIONS if c[2] == "HIGH"]
    failures.append(f"CONTRADICTION LEDGER: {len(blockers)} BLOCKER + "
                    f"{len(open_high)} HIGH open")
    for cid, stmt, sev in CONTRADICTIONS:
        failures.append(f"  {cid} [{sev}]: {stmt}")
    failures.append("RESOLVED on 2026-08-30/31 (kept as history, not gating):")
    for cid, note in RESOLVED:
        failures.append(f"  {cid} RESOLVED: {note}")

    if failures:
        print(f"RELEASE GATE: FAIL — {len(blockers)} blockers, "
              f"{len(unknown_commercial)} UNKNOWN commercial rows, "
              f"{len(unknown_public)} UNKNOWN public claims")
        for line in failures:
            print(line)
        return 1
    print("RELEASE GATE: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
