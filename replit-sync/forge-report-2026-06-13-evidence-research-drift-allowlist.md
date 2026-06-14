# forge-report — evidence_research drift cleared (R-MASTER-DEPLOY fix A) — 2026-06-13

## What
Cleared the ONE real red blocking **a11oy/killinchu main + PRs #341/#342**:
the "Shared-source drift guard" failed on `szl_evidence_research.py`
(`diverged: 3 = accepted 2 + blocking 1`).

## Diagnosis (verified, not assumed)
Byte-compared both repos NOW (raw contents API):
- a11oy   `szl_evidence_research.py` = 37799 B
- killinchu `szl_evidence_research.py` = 41936 B  (+4137 B, matches order)
- Diff is **purely additive**: killinchu ships 3 extra CLAIMS entries
  (`finance-live-feeds`, `real-estate-grounding`, `fraud-controls`) grounding its
  finance / realestate / risk vertical tabs (PR #115). a11oy's organ console has
  no such tabs. → **genuine app-only divergence**, not a transient guard race.

## Fix (per order: "sync OR allow-list")
Allow-list, NOT sync — syncing would inject claims into a11oy referencing tabs it
doesn't have. Added one documented entry to `.github/shared-file-drift-allow.txt`,
kept byte-identical in BOTH repos:
`szl_evidence_research.py   # killinchu-only finance/real-estate/risk vertical CLAIMS (PR #115) absent from a11oy's organ console`
- a11oy commit   d03f4f8
- killinchu commit 2b15d74

## Deliberately did NOT prune the 9 "stale-allow" warnings
They are WARNINGS (never fail the build). Two of them — `serve.py`,
`cathedral.html` — are in the guard's `EXCLUDE_GLOBS`, so they are reported "stale"
on EVERY run yet document genuinely different products (461KB vs 194KB server,
distinct hero pages). Blind-pruning would be wrong and risks re-reddening under
a11oy's known concurrent-edit races. Left the ratchet intact.

## Verified GREEN
Shared-source drift guard run **27464397392** on killinchu `2b15d74` = success.
a11oy main + #341/#342 unblocked.
