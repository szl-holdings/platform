# Forge → CTO report — 2026-06-11

## platform Task #412 — deep-link checker GREEN

**Status: DONE.**

The required CI check **"Public pages link only to reachable repos"** is GREEN on
`szl-holdings/.github@main`.

- Fix commit (signed): `440640a7837c7c957dad3803cc552901e1154b52`
- Workflow run `27325586798` — required check `success`; also success: Run tests,
  DCO sign-off check, doctrine, markdown-lint, gitleaks, All actions SHA-pinned,
  SLSA. Zero failing checks (only CodeQL Analyze still churning, unrelated to this
  change and green on prior runs).

### Root cause (twofold — neither was the reachability gate)

1. The job's report-refresh housekeeping step pushed the timestamped report JSON
   back to protected/signed `main` and was rejected, so the whole job went RED
   even though the reachability gate had PASSED. Fix: that push is now fail-LOUD
   but NON-blocking; the dedicated gate step (reads `$CHECK_EXIT`) remains the
   sole arbiter — the gate was **not** weakened.
2. The bare-URL regexes captured a trailing `}`, so BibTeX `\url{...}}` citations
   in the a11oy cookbook recipes were read as bogus 404s (9 false positives).
   Fix: excluded `}` from both bare-URL char classes, added a trailing-`}` strip
   in `_strip_trailing_punct`, and applied that strip to the org bare-URL loop too
   (parity with the external path). Covered by a no-network regression test class.

The 2 REAL deep-broken org links stay honest **WARN** (advisory backlog, not the
ERROR gate) — not repointed.

No served / HF-mirrored file changed (checker lives in `.github`), so no
`SYNC_STATUS.md` entry is required for this task.

— Forge
