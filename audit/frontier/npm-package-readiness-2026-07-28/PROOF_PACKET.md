# npm artifact semantic-binding proof packet

Date: 2026-07-28

## Scope

This patch strengthens the preserved-artifact verifier. It does not rebuild or
publish either package and does not change the preserved tarball bytes.

## Contract

- The exact source and packed manifest bytes remain SHA-256 bound.
- The exact source `prepack` command is independently SHA-256 bound.
- Source and packed manifests must match after normalizing only the two
  documented pnpm transforms: resolved development-only catalog dependencies
  and removal of the preparation-only `prepack` hook.
- All remaining manifest metadata is part of the publication contract,
  including `bin`, `files`, `exports`, `type`, `license`, `engines`, scripts,
  and runtime dependencies.
- Tarball digests and complete file inventories remain fail-closed.

## Regression proof

`pnpm verify:npm-artifacts` runs dependency-free Node regression tests before
checking the preserved artifacts. The regressions refresh the source manifest
digest after changing (1) a publish-relevant field and (2) the `prepack`
command, while leaving the tarball unchanged. Both stale-artifact cases must be
rejected.

The repository-wide pre-edit `pnpm typecheck` baseline was attempted and timed
out without output. The focused artifact verifier is the executable proof for
this documentation-and-release-tooling patch.

## Truth boundary

Registry publication is `UNEXECUTED`. No npm credential or authenticated
registry session was available or used. No UI surface changed, so screenshot
evidence does not apply.
