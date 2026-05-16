# Fly-High V7 — Apply Runbook

**Source:** `packages/payload/raw_v7/05_apply_scripts/`
**Surfaced via:** `@szl-holdings/payload` → `V7.manifest.executionOrder`
**Date:** 2026-05-16
**Status:** propose-only — every script is a one-way door against the live
`szl-holdings` GitHub org and requires explicit per-batch sign-off from
Stephen before execution.

This runbook is the **only** document that should be consulted before any
of the V7 shell scripts are invoked. It encodes:

1. The mandatory execution order (PM-decision gates first).
2. The token-scope prerequisites for each script.
3. The expected one-way-door flips (what cannot be undone after).
4. The post-condition that each script's success must demonstrate.

Nothing in this task — and nothing in `packages/payload/` — actually runs
these scripts. They live in `raw_v7/` only.

## Execution order (from V7 manifest)

The V7 specialist's recommended order, mirrored from
`V7.manifest.executionOrder`:

1. **Resolve PM decisions** — see `docs/audit/v7-pm-decisions.md`. Until
   the three pending items are decided, every downstream script either
   creates work that will be rejected or risks deadlocking merges. **Do not
   skip this step.**
2. **Close violation PRs** — `01_close_violation_prs.sh` — closes the 18
   `CLOSE`-tier PRs from `V7_PRS`. No merges, no force-pushes, no branch
   deletions.
3. **Open hygiene PRs** — `03_open_hygiene_prs.sh` — opens SECURITY.md /
   CONTRIBUTING.md / CODE_OF_CONDUCT.md PRs against `vsp-otel` and
   `agi-forecast` (the two repos lacking these files per V7 hygiene scan).
4. **Open citation PRs** — `04_open_citation_prs.sh` — opens
   CITATION.cff updates against the 13 repos drafted by the V7 citation
   specialist. The single field change is the `email` addition.
5. **Patch display name** — `06_patch_display_name.sh` — updates the
   operator display-name field consistently across the org. Idempotent.
6. **Merge Dependabot** — `02_merge_dependabot.sh` — merges the 12 MERGE-
   tier PRs. Each merge still respects per-repo branch-protection rules.
7. **Apply BP** — `05_apply_bp.sh` — runs the 6 branch-protection PUTs
   for `lutar-lean`, `szl-trust`, `szl-cookbook`, `szl-brand`, `vsp-otel`,
   `agi-forecast`. **PM decision #2 (review-count deadlock) MUST be resolved
   before this step or merges will block immediately.**

## Token scopes required

The scripts assume a GitHub PAT or fine-grained token with:

- `repo` (full) — close/merge PRs, push branches for hygiene + citation PRs
- `admin:org` (read) — enumerate repos in `szl-holdings`
- `admin:repo_hook` — N/A here, listed for completeness
- For `05_apply_bp.sh` only: the token's user must be a repo admin on each
  of the 6 targeted repos. The token MUST hold `Administration: write`
  fine-grained permission per repo.

A token missing `Administration: write` will fail `05_apply_bp.sh` with a
404 (GitHub returns 404 rather than 403 on missing admin scope, which is
the most common confusion point).

## One-way-door inventory

These are the irreversible effects each script produces. Once executed,
revert requires a separate explicit task and (in some cases) cannot be
fully undone via the GitHub API.

| Script                       | One-way-door effect                                                                                  | Revert cost                    |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------ |
| `01_close_violation_prs.sh`  | PR `state: closed`, comment posted. Reopen restores state but the closure comment stays in the log. | low (reopen + delete comment)  |
| `02_merge_dependabot.sh`     | 12 commits land on `main` across the org. SHAs change.                                              | high (revert PRs)              |
| `03_open_hygiene_prs.sh`     | 2 new branches + 2 new PRs in `vsp-otel`, `agi-forecast`.                                            | low (close PR, delete branch)  |
| `04_open_citation_prs.sh`    | 13 new branches + 13 new PRs across the 13 CFF-drafted repos.                                       | low (close + delete)           |
| `05_apply_bp.sh`             | Branch-protection rules updated on 6 repos. Old config is **not preserved** by GitHub.              | **medium** — needs prior snapshot |
| `06_patch_display_name.sh`   | Author display-name updated. Re-runnable, no destructive effect.                                    | trivial                        |

Before running `05_apply_bp.sh`, snapshot current BP config:

```bash
for repo in lutar-lean szl-trust szl-cookbook szl-brand vsp-otel agi-forecast; do
  gh api "repos/szl-holdings/$repo/branches/main/protection" \
    > "bp-snapshot-$repo-$(date -u +%Y%m%dT%H%M%SZ).json" || true
done
```

## Post-condition checks

After each script, verify the post-condition before proceeding to the next:

- `01_close_violation_prs.sh` → `gh pr list --search 'is:open is:pr label:hygiene-sweep'` returns 0 rows.
- `02_merge_dependabot.sh` → `gh pr list --search 'is:open is:pr author:app/dependabot'` shows zero MERGE-tier candidates.
- `03_open_hygiene_prs.sh` → `vsp-otel` and `agi-forecast` each show an open PR with the 3 hygiene files.
- `04_open_citation_prs.sh` → 13 repos each show an open `doctrine(citation)` PR.
- `05_apply_bp.sh` → for each of the 6 repos, `gh api repos/szl-holdings/$repo/branches/main/protection | jq .required_status_checks.strict` returns `true`.
- `06_patch_display_name.sh` → idempotent re-run produces no diff.

## What this task explicitly does NOT do

- Run any of the 6 scripts.
- Modify `raw_v7/` byte contents.
- Flip `submission_one_way_door` (arXiv) or `mint_one_way_door` (Zenodo) — both remain gated on Stephen.
- Resolve any of the 3 PM-decision items in `v7-pm-decisions.md`.

## Cross-references

- `docs/audit/v7-pr-triage.md` — the 68-PR register the close/merge scripts operate on.
- `docs/audit/v7-pm-decisions.md` — the 3 blocking PM decisions.
- `packages/payload/raw_v7/05_apply_scripts/` — the actual shell scripts (read-only).
- `@szl-holdings/payload` exports `V7.manifest.executionOrder` for programmatic access.
