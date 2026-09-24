#!/usr/bin/env python3
"""demo_acceptance.py — the 16-step demo acceptance test as a CI gate.

The demo IS the product. This harness encodes the 16 acceptance beats as
data + assertions against the observed estate state (from the fe1/fe2
audits of 2026-08-30). A step is PASS only with cited evidence; FAIL when
observed behavior contradicts the criterion; UNKNOWN when unmeasured.

Exit codes: 0 = all 16 pass, 1 = any FAIL or UNKNOWN, 2 = usage error.
First run MUST exit 1 — the demo does not yet exist as specified.

Usage: python3 tools/demo_acceptance.py
"""

from __future__ import annotations

import sys

FORBIDDEN_VOCAB = ["in-toto", "DSSE", "predicate", "envelope", "governed substrate"]

# (step, criterion, observed_state, status, evidence_or_gap)
STEPS = [
    ("S01", "Verifier page loads with no account wall and no gating modal",
     "a-11-oy.com /verify loads unauthenticated (200)", "PASS",
     "fe1 route probe 2026-08-30"),
    ("S02", "Guided spine (<=13 steps) plus sandbox mode offered up front",
     "no guided spine exists on /verify today", "FAIL",
     "fe1 A.6: /verify is a bare form; Prove It page unbuilt"),
    ("S03", "Visitor runs a governed action in the demo harness; receipt emits locally",
     "no in-browser demo harness exists", "FAIL", "fe2: Prove It spec unbuilt"),
    ("S04", "Out-of-policy action is DENIED by default (default-deny visible, not narrated)",
     "no policy evaluation in browser today", "FAIL", "fe2: Cedar runs server-side only"),
    ("S05", "Human approval records a human principal (is_service_account=false) in the receipt",
     "no approval flow in browser", "FAIL", "fe2 spec section 4"),
    ("S06", "Receipt bundle (statement + evidence + chain digests) downloads as one file",
     "/verify verifies server-side; nothing downloads", "FAIL",
     "fe1 A.5: /verify POSTs to server"),
    ("S07", "With network disconnected, verification completes and devtools shows 0 network requests",
     "current /verify REQUIRES the server", "FAIL",
     "fe1 A.5: verification is server-side; the offline claim is currently false"),
    ("S08", "Verdict renders from the 6-state taxonomy (VERIFIED/MISMATCH/INCOMPLETE/"
     "PENDING_SYNC/UNSIGNED-LOCAL/UNAVAILABLE), never a bare green check",
     "governed-receipt-verifier Space implements taxonomy but is not linked "
     "from /verify or the homepage", "FAIL", "fe2 B.2 + be2 A.4"),
    ("S09", "One-byte tamper of the payload => MISMATCH with the tamper position named",
     "not demonstrable in browser today", "FAIL", "fe2: tamper toggle is F3 frontier move, unbuilt"),
    ("S10", "Hash-chain corruption => MISMATCH naming the chain-break position",
     "not demonstrable in browser today", "FAIL", "same as S09"),
    ("S11", "Removed evidence obligation => INCOMPLETE even while every crypto leg passes",
     "verifier logic exists in this payload (lib/receipt.py L5) but not deployed to the page",
     "UNKNOWN", "payload_v11/lib/receipt.py; page unbuilt"),
    ("S12", "Missing remote ack => PENDING_SYNC rendered as a visible state, never silent sync",
     "Flight Recorder law locked; no UI surface renders it", "UNKNOWN",
     "be1 2.6; page unbuilt"),
    ("S13", "Malformed bundle => UNAVAILABLE (malformed is not forged), distinct from MISMATCH",
     "leg L0 exists in lib/receipt.py; not deployed", "UNKNOWN", "payload_v11/lib/receipt.py"),
    ("S14", "Trust-anchor paragraph present with 3-channel key check and footer: "
     "'a signature proves integrity and signer identity, not factual truth'",
     "no trust-anchor copy on any live surface", "FAIL", "fe1 A.7 copy audit"),
    ("S15", "Article 12 report export produces a 'logging conformance profile' and never "
     "says 'EU AI Act compliant'",
     "no export exists; lexicon gate enforces the phrase in copy", "FAIL",
     "fe2 spec; lexicon_gate.py"),
    ("S16", "Full run <=5 minutes, <=13 guided steps, buyer never hears any of: "
     + ", ".join(FORBIDDEN_VOCAB),
     "demo does not exist end-to-end", "FAIL", "fe2 five-minute buyer test"),
]


def main() -> int:
    passed = [s for s in STEPS if s[3] == "PASS"]
    failed = [s for s in STEPS if s[3] == "FAIL"]
    unknown = [s for s in STEPS if s[3] == "UNKNOWN"]
    print(f"DEMO ACCEPTANCE: {len(passed)}/16 PASS, {len(failed)} FAIL, "
          f"{len(unknown)} UNKNOWN")
    for step, criterion, observed, status, evidence in STEPS:
        mark = {"PASS": "PASS", "FAIL": "FAIL", "UNKNOWN": "UNKN"}[status]
        print(f"  [{mark}] {step}: {criterion}")
        print(f"         observed: {observed}")
        print(f"         basis:    {evidence}")
    if failed or unknown:
        print("\nGate fails until every step is PASS with cited evidence. "
              "UNKNOWN is a blocking state: an unmeasured acceptance step is "
              "an unshipped demo.")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
