# Clean-clone integrity workcell — 2026-07-25

## Context

A fresh Windows checkout of `platform` was immediately dirty because Git tracked both
`.github/PULL_REQUEST_TEMPLATE.md` and `.github/pull_request_template.md`. The checkout
also required a POSIX shell for `preinstall`, `prepare`, and API-client presence
checking. Those assumptions prevented a clean Windows clone from completing the
repository's normal install and typecheck entrypoints.

This workcell is limited to portable clean-clone integrity. Its current exact head
also incorporates the independently merged upstream-adapter validation change from
`main`, because the branch was refreshed before release. The verification below
therefore covers both the portability patch and the adapter files present in the
reviewed branch. It does not claim to close the broader estate release gate.

## Operator authorization

The active task explicitly authorizes consolidating and removing stale duplicates
across the estate. This workcell applies that authorization narrowly: it removes only
the case-colliding lowercase `.github/pull_request_template.md` duplicate and retains
the doctrine-rich canonical `.github/PULL_REQUEST_TEMPLATE.md`. No other template or
history is removed.

## Patch

- Keep the doctrine-rich uppercase pull-request template and remove its case-only
  duplicate.
- Add a dependency-free tracked-path collision guard that normalizes slash style,
  Unicode NFC, and case.
- Replace the shell-only package-manager gate and hook installer with tested Node.js
  entrypoints; resolve the hooks directory with `git rev-parse --git-path hooks`
  so installation is correct in primary and linked worktrees; retain
  `scripts/setup-hooks.sh` as a compatibility wrapper.
- Invoke the dependency-free documentation claim check directly with Node and make
  the generated pre-push hook call the installed TypeScript and Python entrypoints
  directly, avoiding POSIX-vs-Windows package-manager shim differences.
- Normalize repository-relative paths before brand-policy comparisons and enumerate
  tracked source files through Git instead of recursively entering dependency trees
  or Windows reparse points.
- Scope the pre-push banned-brand regression check to files changed from the
  `origin/main` merge base. The full-repository audit remains available and continues
  to report pre-existing baseline drift without blocking unrelated portability work.
- Scope the pre-commit documentation check to its documentation, schema, and API
  inputs so an unrelated commit is not blocked by an already-recorded baseline
  documentation failure.
- Replace the API codegen shell expression with a tested cross-platform entrypoint.
- Keep the pre-commit hook from invoking Oxlint when a change contains only file
  types that Oxlint does not support.
- Run clean-clone guards on Ubuntu and Windows before CI lint and typecheck jobs.
- Include staged deletions in the documentation-claims pre-commit trigger so removing
  a schema, route, or claim-bearing document cannot bypass the claims check.
- Treat hook installation as visible best-effort setup when Git resolves a read-only
  or externally managed hooks directory; package installation continues after an
  explicit warning instead of failing for optional local hooks.
- Preserve each raw NUL-delimited Git path for filesystem access and use a separate
  NFC/slash-normalized representation only for policy comparisons and reporting.
- Validate MISP/TAXII, New Relic, and NVD payloads before admitting external values
  into typed adapter state. At the New Relic adapter boundary, HTTP 200 GraphQL error
  payloads and invalid response shapes preserve the established demo fallback rather
  than escaping as an unhandled parsing error.

## Verification

Verified locally on Windows with Node.js 24.14.0 and pnpm 10.26.1:

- `pnpm install --frozen-lockfile`: PASS across 198 workspace projects after the
  portability patch.
- Dependency-free clone-guard suite: PASS, 13/13 tests, including a real linked
  worktree with spaces in both checkout paths.
- Root `verify:clean-clone`: PASS, 17/17 root guard tests and 9,408 portable
  tracked paths.
- Focused follow-up regressions: PASS, 10/10 tests covering claims-input
  deletion detection, external and unavailable hook directories, and raw
  Unicode Git paths.
- Normalized tracked-source `brand:check`: PASS.
- Changed-file banned-brand check from the `origin/main` merge base: PASS with
  no new violations beyond the audit baseline.
- `@szl-holdings/api-spec` typecheck: PASS.
- `@szl-holdings/api-spec` tests: PASS, 2/2.
- `@szl-holdings/api-spec` committed-client presence gate: PASS.
- `@szl-holdings/services` payload-boundary tests: PASS, 18/18, including live-mode
  adapter regressions for HTTP 200 NerdGraph error payloads across APM,
  infrastructure, and alert operations.
- `@szl-holdings/services` typecheck: PASS.
- Repository-wide `pnpm run test`: PASS in the protected GitHub Actions
  `Unit tests (vitest)` job for PR #479 at head
  `af6344025992591a25be2fe9a7a4d3bd4ddfbf0b` (113/113 tasks successful,
  exit code 0). Receipt:
  `https://github.com/szl-holdings/platform/actions/runs/30183117037/job/89743031505`.
- Changed-file Biome check: PASS with no warnings or fixes required.
- Canonical source-of-truth validator: PASS, 64/64 checks.
- `docs:claims-check`: PASS, 19/19 current claims verified.
- Clean-clone case-collision guard: PASS after staging the final tracked path set.
- `git diff --check`: PASS.

The earlier typecheck limitation in `misp-taxii.ts`, `new-relic.ts`, and `nvd.ts` no
longer applies to this exact head: those adapter boundaries are part of the reviewed
branch and the focused services typecheck passes. Protected full-repository CI
remains an independent release gate.

The normalized `brand:check` scans only tracked source files and passes locally. The
pre-push changed-file banned-brand check also passes for this branch. Its explicit
full-repository mode correctly reports 42 pre-existing `TENAX` occurrences outside
the configured audit baseline; this workcell neither blesses nor rewrites those
unrelated product-surface strings.

## Release posture

This change must remain a draft until protected CI completes and an independent,
currently authorized reviewer approves it. No self-approval, protection bypass, or
administrative merge is authorized.

UI screenshots are not applicable because this workcell changes only clone/build
infrastructure.
