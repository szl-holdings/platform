# PR Draft - A11oy GitHub Alignment

**Branch:** `codex/a11oy-github-alignment-2026-04-26`
**Target:** `main`
**Date:** 2026-04-26
**Purpose:** Align GitHub with the current Replit export without rewriting `main`.

## Summary

This PR brings the current Replit export into a reviewable GitHub branch while keeping public investor-facing claims tied to audited, reproducible proof.

The local Replit export is `2091` commits ahead of `origin/main`; `origin/main` has one unique GitHub-only commit. This branch preserves that GitHub-only archived workflow and adds a small proof cleanup on top of the export so the PR can be reviewed safely.

## What Changed

- Restored `artifacts/szl-holdings/src/data/capability-manifest.json` as a real public capability manifest.
- Added A11oy to the product readiness matrix and fixed the zero-capability score guard.
- Updated Trust Center and Investor Overview copy to use current source-of-truth counts:
  - 15 registered deployable artifacts
  - 146 workspace packages/libraries
  - 385 API route files
  - 730 provisioned PostgreSQL tables
  - 24 GitHub Actions workflows
- Preserved GitHub-only archived workflow `.github/workflows/prism-counsel-ci.yml`.
- Updated README platform scale and current-status language.
- Updated GitHub push/audit packet for the current branch and repository state.

## GitHub Audit Snapshot

- Open PRs: none reported by the GitHub connector.
- Open issues: none reported by the GitHub connector.
- Prior PR #37: closed and not merged.
- Main branch status: behind the Replit export by 2091 commits, with 1 GitHub-only commit that is preserved here.
- Remote token hygiene: embedded GitHub token was removed from local git remotes before this branch was prepared.

## Safety / Compliance Posture

- No secrets added.
- No `.env` files added.
- No autonomous live trading or high-risk execution added.
- Finance and consequential AI action remain policy/approval-gated.
- Public claims now point to manifest or `audit/source-of-truth.json`.
- Replit project URL was not publicly fetchable during this audit; local export is treated as the Replit source of record.

## Validation

Run before merge:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm brand:check
node scripts/audit/validate-source-of-truth.js
```

If repository secrets or `DATABASE_URL` are required for full CI, treat those failures as environment configuration blockers, not proof that the source tree is aligned.
