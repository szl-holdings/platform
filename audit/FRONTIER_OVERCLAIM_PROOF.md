# Frontier overclaim ledger proof

**Verified:** 2026-07-25

## Implemented

- evidence-backed overclaim ledger with one uniquely identified CI incident;
- SHA-256 bindings for the retained GitHub run and commit snapshots;
- one observed correction interval, explicitly labeled as `n=1` rather than a
  statistical mean;
- separate `REPORTED / OPEN_UNVERIFIED` treatment for the R0 sovereign report;
  and
- deterministic validation with negative cases for digest tampering, duplicate
  evidence and incident counting, counted and related-incident binding drift,
  duration/display drift, and misleading metric labels;
  and
- protected source-of-truth enforcement for the validator and its negative
  tests whenever canonical-truth CI runs.

## Verification results

| Check | Result |
| --- | --- |
| Ledger and evidence validation | **passed** |
| Validator tests | **14/14 passed** |
| Canonical source-of-truth validator | **66/66 passed** |
| Git whitespace validation | **passed** |

## Claim boundary

The ledger contains a pinned evidence snapshot, not a live production counter.
Its measured incident count is one and its correction-time sample size is one.
The R0 report is excluded from both figures because the retained evidence does
not establish a Doctrine Overclaim Guard detection.

No deployment, database, user interface, repository visibility, or production
metric was changed. Protected merge-ref CI must reproduce these checks against
the current `main` tree before merge.

## Screenshot

Not applicable. No user interface was modified.
