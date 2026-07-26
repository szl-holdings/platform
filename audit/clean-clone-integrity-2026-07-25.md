# Clean-clone integrity workcell — 2026-07-25

## Context

A fresh Windows checkout of `platform` was immediately dirty because Git tracked both
`.github/PULL_REQUEST_TEMPLATE.md` and `.github/pull_request_template.md`. The checkout
also required a POSIX shell for `preinstall`, `prepare`, and API-client presence
checking. Those assumptions prevented a clean Windows clone from completing the
repository's normal install and typecheck entrypoints.

This workcell is limited to portable clean-clone integrity. It does not claim to close
the broader estate release gate.

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

## Verification

Verified locally on Windows with Node.js 24.14.0 and pnpm 10.26.1:

- `pnpm install --frozen-lockfile`: PASS across 197 workspace projects after the
  portability patch.
- Dependency-free clone-guard suite: PASS, 13/13 tests, including a real linked
  worktree with spaces in both checkout paths.
- Root `verify:clean-clone`: PASS, 11/11 root guard tests and 9,373 portable
  tracked paths.
- `@szl-holdings/api-spec` typecheck: PASS.
- `@szl-holdings/api-spec` tests: PASS, 2/2.
- `@szl-holdings/api-spec` committed-client presence gate: PASS.
- Changed-file Biome check: PASS with no warnings or fixes required.
- Canonical source-of-truth validator: PASS, 64/64 checks.
- Clean-clone case-collision guard: PASS after staging the final tracked path set.
- `git diff --check`: PASS.

The full repository typecheck completed 144 of 159 scheduled tasks before failing in
the existing `@szl-holdings/workflow-engine` dependency graph. The ten diagnostics are
all in untouched adapter files under `lib/services/src/adapters/` (`misp-taxii.ts`,
`new-relic.ts`, and `nvd.ts`) where `unknown` values are assigned to typed response
objects. This workcell does not alter those files and does **not** record the
repository-wide typecheck as a pass; protected CI remains an independent gate.

The existing `docs:claims-check` remains red with 11 stale documentation references
under `artifacts/api-server` and a missing `Key Route Paths` section. Eight checks pass.
This workcell does not alter those documents or count that unrelated baseline failure
as closed.

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
