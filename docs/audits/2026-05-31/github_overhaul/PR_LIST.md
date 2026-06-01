# PR LIST — GitHub Overhaul
**Date:** 2026-06-01 · Doctrine v11 LOCKED

## Direct-to-main commits (no PR)
All overhaul work was committed **directly to `main`** (and `gh-pages` for scenes) via the GitHub contents/git-data API, authenticated as `stephenlutar2-hash` (org owner). This is appropriate because:
- The changes are **additive and non-breaking** (new asset files + README hero injection; no code/proof changes).
- The Doctrine v11 LOCKED numbers were preserved verbatim and the only metadata changes were **fixing stale numbers** (168→163 sorries) and **stale doctrine version** (v7→v11), which are corrections, not feature changes.
- gh-pages scenes are isolated branches that do not affect source.

No new pull requests were opened by this agent. See `COMMIT_LIST.md` for every SHA.

## Pre-existing PRs — DO NOT TOUCH (verified untouched)
Per the IP-HOLD directive, these were **not modified, merged, closed, or commented on**:
| Repo | PR | Status |
|---|---|---|
| szl-holdings/a11oy | #57 | IP-HOLD — left untouched |
| szl-holdings/amaru | #46 | IP-HOLD — left untouched |
| szl-holdings/sentra | #45 | IP-HOLD — left untouched |

## If a review trail is preferred (optional follow-up)
The same commits could be replayed as PRs by branching `genius-hero/<repo>` off main and opening a PR per surface. Not done here to avoid churn, but the generators (`/tmp/gen_*.py`) and injection scripts make this a mechanical re-run if the org wants the audit trail.
