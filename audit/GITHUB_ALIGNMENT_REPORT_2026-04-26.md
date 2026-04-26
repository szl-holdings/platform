# GitHub Alignment Report - 2026-04-26

## Scope

Audit and prepare the GitHub repository so it can be aligned with the current Replit export for A11oy / SZL Holdings.

## Repository

- Local workspace: `C:\Users\bette\Downloads\ReplitExport-stephenlutar2 (2)\Project-Overview`
- GitHub repository: `szl-holdings/szl-holdings-platform`
- Working branch: `codex/a11oy-github-alignment-2026-04-26`
- Intended PR base: `main`

## GitHub Connector Findings

- Open PRs: none returned.
- Open issues: none returned.
- Recent relevant PRs:
  - #37 `chore(audit): A11oy public-readiness - audit suite, investor proof pack, repo hygiene` - closed, not merged.
  - #36 README metrics - merged.
  - #27 security and quality gate workflows - merged to `main`.

## Local vs GitHub Delta

Command:

```bash
git rev-list --left-right --count master...origin/main
```

Result:

```text
2091    1
```

Interpretation:

- The Replit export is far ahead of GitHub `main`.
- GitHub `main` has one unique commit not present in the local Replit branch.
- The GitHub-only commit contains `.github/workflows/prism-counsel-ci.yml`, an archived manual-only workflow. It is preserved in this branch.

## Replit Comparison

The user-provided Replit URL was checked:

```text
https://replit.com/@stephenlutar2/Project-Overview
```

Public fetch/search did not expose project contents. The local Replit export is therefore treated as the Replit source of record for this audit.

## Public Proof Fixes

- Restored the missing capability manifest at `artifacts/szl-holdings/src/data/capability-manifest.json`.
- Added A11oy to the product-readiness product display map.
- Updated readiness, Trust Center, Investor Overview, README, and PR/push docs to use current proof paths and audited source-of-truth counts.
- Preserved screenshots already present under `docs/assets/screenshots/current/`, including A11oy desktop, social, LinkedIn square, LinkedIn portrait, and wide variants.
- Captured live verification screenshots:
  - `audit/screenshots/a11oy-product-readiness-2026-04-26.png`
  - `audit/screenshots/a11oy-trust-status-2026-04-26.png`

## Canonical Counts Used

From `audit/source-of-truth.json`:

- Registered deployable artifacts: 15
- Total artifact directories on disk: 17
- Unregistered artifact directories for review: 2 (`artifacts/helios`, `artifacts/pluginmesh`)
- Workspace packages/libraries: 146
- API route files: 385
- Schema files: 182
- Provisioned PostgreSQL tables: 730
- GitHub Actions workflows: 24
- Declared environment variables: 276
- Active domain packs: 7

## Security Notes

- No secrets were added.
- `.config/` was added to `.gitignore` to avoid committing local Replit/runtime metadata.
- Previously embedded GitHub credentials were removed from local remotes. Any token that was present in local config should be rotated.
- The PR path is branch-based. Do not force-push or rewrite `main`.

## Validation Results

- `pnpm install --frozen-lockfile`: pass after adding Git for Windows `sh` and Node 24 to PATH.
- `pnpm run audit:source-of-truth`: pass, 27/27 checks.
- `pnpm run validate:markdown-assets`: pass, 239 link/image checks, 0 failures.
- `git diff --check`: pass.
- Changed-file secret pattern scan: pass, no matches.
- Changed-file retired-name scan (`bo11y|bolly|boss`): pass, no matches.
- `pnpm --filter @workspace/szl-holdings run build`: pass.
- `pnpm --filter @workspace/szl-holdings run typecheck`: fails on existing unrelated TS issues in `admin-billing.tsx`, `changelog-highlights.tsx`, `lyte-page.tsx`, `signal-fusion.tsx`, and `treasury.tsx`.
- `pnpm --filter @workspace/szl-holdings run lint`: fails on existing lint debt in admin/alloy files outside this patch.
- `pnpm run test`: starts successfully; 24 tasks completed before `@workspace/aef-sdk` fails because its configured test include pattern finds no files.
- `pnpm run build`: fails in `@szl-holdings/sdk` due pre-existing `PaginationOptions` assignability errors.
- Dev server live page checks: `GET /product-readiness` and `GET /trust-center/status` both returned HTTP 200 from Vite.

## Manual GitHub UI Items

These still require GitHub web UI access:

- Repository About description
- Repository topics
- Website link
- Social preview image
- Organization profile repository sync
- Pinned repository
- Branch protection/ruleset confirmation
- Public/private visibility decision

## Recommended PR Title

```text
chore(github): align A11oy Replit export with public proof surfaces
```

## Recommended Merge Policy

Open as a draft PR, run CI, document any environment-only failures, and require CODEOWNER review before merge.
