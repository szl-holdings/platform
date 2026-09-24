#!/usr/bin/env python3
"""spaces_gate.py — CI gate over the HF Spaces estate tiering.

Encodes the locked rules:
  * every public Space must carry a tier
    (FLAGSHIP / SUPPORTING / LAB / ARCHIVE / REDIRECTED / ORG_CARD)
  * FLAGSHIP count must be <= 5
  * every FLAGSHIP must pass the 8 admission tests with evidence;
    UNKNOWN evidence on a FLAGSHIP test blocks
  * the org card is a Space and must be inventoried as ORG_CARD
  * the collection titled "Canonical public Spaces (7)" holding 4 items
    is an open contradiction row

Exit codes: 0 = pass, 1 = violations, 2 = usage error.
First run MUST exit 1 — the findings are the Week 1 checklist.

Usage: python3 tools/spaces_gate.py
"""

from __future__ import annotations

import sys

TIERS = ["FLAGSHIP", "SUPPORTING", "LAB", "ARCHIVE", "REDIRECTED", "ORG_CARD"]
FLAGSHIP_CAP = 5

# Registry built from the two live audits (fe1 A.4 / be2 A.4), 2026-08-30.
# admission values: True (evidence) / False (fails) / None (UNKNOWN —
# never guessed; UNKNOWN on a flagship blocks).
SPACES = [
    {"id": "SZLHOLDINGS/a11oy", "sdk": "docker", "runtime": "RUNNING",
     "tier": "FLAGSHIP",
     "admission": {
         "current_source_revision": True,
         "attested_deployment_revision": None,   # no deploy attestation on record
         "mobile_smoke_test": None,              # UNKNOWN per fe1 A.6
         "conversion_event": False,              # /contact 404; pricing CTAs dead-end
         "declared_truth_state": True,
         "links_real_verifier_artifact": True,   # /verify live
         "no_stale_metric": False,               # hero 'Overclaims caught by CI' SNAPSHOT 2026-07-25
         "buyer_legible_cta": False,             # no demo CTA in hero
     }},
    {"id": "SZLHOLDINGS/killinchu", "sdk": "docker", "runtime": "RUNNING",
     "tier": "FLAGSHIP",
     "admission": {
         "current_source_revision": True,
         "attested_deployment_revision": None,
         "mobile_smoke_test": False,             # maximum-scale=1 disables pinch zoom
         "conversion_event": False,
         "declared_truth_state": True,           # SIMULATED actuation label
         "links_real_verifier_artifact": None,
         "no_stale_metric": False,               # CI 'API Health' failing 2026-08-30
         "buyer_legible_cta": None,
     }},
    {"id": "SZLHOLDINGS/governed-receipt-verifier", "sdk": "static", "runtime": "RUNNING",
     "tier": "FLAGSHIP",
     "admission": {
         "current_source_revision": True,
         "attested_deployment_revision": True,   # static Space: served files == repo files
         "mobile_smoke_test": None,
         "conversion_event": False,              # not linked from org card or homepage yet
         "declared_truth_state": True,
         "links_real_verifier_artifact": True,   # it IS the verifier
         "no_stale_metric": True,
         "buyer_legible_cta": None,
     }},
    {"id": "SZLHOLDINGS/immune", "sdk": "docker", "runtime": "RUNNING",
     "tier": "SUPPORTING", "admission": {}},
    {"id": "SZLHOLDINGS/szl-khipu", "sdk": "docker", "runtime": "RUNNING",
     "tier": "SUPPORTING", "admission": {}},
    {"id": "SZLHOLDINGS/szl-atelier", "sdk": "static", "runtime": "RUNNING",
     "tier": "SUPPORTING", "admission": {}},
    {"id": "SZLHOLDINGS/README", "sdk": "static", "runtime": "ORG-CARD",
     "tier": "ORG_CARD", "admission": {}},
]

# Open contradiction rows carried by this gate.
CONTRADICTIONS = [
    ("SP-01", "Collection 'Canonical public spaces-7' (titled 7) holds 4 items; "
              "title must drop the count or contents must be reconciled", "BLOCKER"),
    ("SP-02", "Org card Space (README) absent from the '6 KEEP' registry copy on "
              "a-11-oy.com/spaces — public surface count is 7 (6 product + 1 org card)", "HIGH"),
    ("SP-03", "governed-receipt-verifier (the moat asset) missing from every Spaces "
              "collection; chaski (top model) in no collection", "HIGH"),
]


def main() -> int:
    failures: list[str] = []
    notes: list[str] = []

    untiered = [s["id"] for s in SPACES if s.get("tier") not in TIERS]
    if untiered:
        failures.append(f"untiered public Spaces: {untiered}")

    flagships = [s for s in SPACES if s.get("tier") == "FLAGSHIP"]
    if len(flagships) > FLAGSHIP_CAP:
        failures.append(f"FLAGSHIP count {len(flagships)} exceeds cap {FLAGSHIP_CAP}")
    notes.append(f"flagship count {len(flagships)} <= cap {FLAGSHIP_CAP}: ok")

    for s in flagships:
        for test, val in s["admission"].items():
            if val is None:
                failures.append(f"{s['id']}: admission test '{test}' is UNKNOWN — "
                                f"a flagship cannot attest what it has not measured")
            elif val is False:
                failures.append(f"{s['id']}: admission test '{test}' FAILS")

    for cid, stmt, sev in CONTRADICTIONS:
        failures.append(f"{cid} [{sev}]: {stmt}")

    if failures:
        print(f"SPACES GATE: FAIL — {len(failures)} finding(s) across "
              f"{len(SPACES)} public surfaces ({len(flagships)} flagship)")
        for n in notes:
            print(f"  ok: {n}")
        for f in failures:
            print(f"  {f}")
        return 1
    print("SPACES GATE: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
