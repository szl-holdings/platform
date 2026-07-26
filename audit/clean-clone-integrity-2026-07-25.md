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
  entrypoints; retain `scripts/setup-hooks.sh` as a compatibility wrapper.
- Replace the API codegen shell expression with a tested cross-platform entrypoint.
- Keep the pre-commit hook from invoking Oxlint when a change contains only file
  types that Oxlint does not support.
- Run clean-clone guards on Ubuntu and Windows before CI lint and typecheck jobs.

## Verification

Verified locally on Windows with Node.js 24.14.0 and pnpm 10.26.1:

- `pnpm install --frozen-lockfile`: PASS across 197 workspace projects after the
  portability patch.
- Dependency-free clone-guard suite: PASS, 9/9 tests.
- `@szl-holdings/api-spec` typecheck: PASS.
- `@szl-holdings/api-spec` committed-client presence gate: PASS.
- Clean-clone case-collision guard: PASS after staging the final tracked path set.
- `git diff --check`: PASS.

The full repository `pnpm run typecheck` was attempted twice at CI concurrency and did
not finish within a 15-minute local evidence window. It emitted no type error before
termination. This is **not** recorded as a pass; the protected CI typecheck remains a
required independent gate.

The existing `docs:claims-check` also remains red with 11 stale documentation
references under `artifacts/api-server` and a missing `Key Route Paths` section. This
workcell does not alter those documents or count that unrelated baseline failure as
closed.

The combined brand pre-push checks did not complete within a three-minute local
evidence window and produced no result before termination. They remain required
protected-branch evidence rather than a local pass.

## Release posture

This change must remain a draft until protected CI completes and an independent,
currently authorized reviewer approves it. No self-approval, protection bypass, or
administrative merge is authorized.

UI screenshots are not applicable because this workcell changes only clone/build
infrastructure.
