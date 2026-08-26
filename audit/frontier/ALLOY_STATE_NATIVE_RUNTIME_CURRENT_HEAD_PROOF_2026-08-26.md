# Proof Packet - State-Native Runtime Current-Head Hardening

**Workcell:** A11OY-STATE-001-D
**Date:** 2026-08-26
**Repository:** szl-holdings/platform
**Current protected head:** `7383a30fffeb44c7e8a3fa2c27e176ee450607fd`
**Current protected-head commit:** `chore(deps): refresh pinned workflow actions (#666)`
**Predecessor review head:** `414d9096c95d707df5d71075faeb18949831980d`
**Stale successor PR:** #590, closed unmerged, draft, failed checks
**Source claim level:** current protected source and hosted checks observed

## Context

The prior claimed successor commit `59a6da194c28aeabe2228567f379e0bf5282ae1f`
was not present in the canonical `szl-holdings/platform` repository during the
2026-08-26 recovery pass. The stale successor pull request #590 remained closed,
unmerged, behind `main`, and had failed checks. It is retained as historical
attempt evidence only, not as merge or qualification evidence.

Protected `main` is now at `7383a30fffeb44c7e8a3fa2c27e176ee450607fd`. The
state-native runtime hardening from the unresolved review findings is present on
that current source tree and is stricter than the old #590 head in the same
files.

## Source Verification

- `packages/a11oy-runtime/src/state-native/kernel-runtime.ts` snapshots kernel
  definitions at registration by reading each admitted field once, validating the
  local values, binding callable methods to the admitted receiver, and freezing
  the normalized definition.
- `packages/a11oy-runtime/src/state-native/kernel-runtime.ts` snapshots verifier
  results by reading `passed`, `reason`, and `evidenceDigests` once, copying the
  evidence array once, validating lowercase SHA-256 digests, and freezing the
  result before mandatory verification policy or receipt construction.
- `packages/a11oy-runtime/src/state-native/epoch-manager.ts` snapshots
  cognitive-epoch specs before validation, hashing, lookup, storage, and
  activation. It rejects each malformed digest field before the epoch is stored.
- `packages/a11oy-runtime/test/state-native-runtime-security.test.mjs` includes
  direct adversarial regressions for retained-object mutation, one-read kernel
  definition accessors, verifier result getter flips, mutable verifier evidence,
  malformed verifier evidence, validation-check accessors, and malformed
  cognitive-epoch digests.

## Hosted Checks

Exact protected head `7383a30fffeb44c7e8a3fa2c27e176ee450607fd` had 80 check
runs observed through the GitHub Checks API on 2026-08-26:

- 74 completed successfully.
- 6 completed as skipped.
- 0 completed with failure, cancellation, timeout, or action required in the
  observed check-run page.

This is hosted current-main check evidence. It is not a deployment, runtime, or
external witness claim.

## Local Validation

Completed in
`C:\Users\steph\Documents\Codex\2026-08-26\prior-conversation-with-codex-conversation-role-7\work\platform-runtime-hardening-20260826`
on branch `codex/state-native-runtime-hardening-v4-20260826`:

- `pnpm --filter @workspace/a11oy-runtime... install --ignore-scripts --offline`
  exited 0. Scope was 9 of 202 workspace projects; 786 packages were linked
  from the local pnpm store with no downloads.
- `pnpm --filter @workspace/a11oy-runtime typecheck` exited 0.
- `pnpm --filter @workspace/a11oy-runtime test` exited 0. Vitest reported
  2 files passed and 35 tests passed. The state-native Node test suite reported
  47 tests total, 45 passed, 0 failed, and 2 skipped. The passing cases include
  retained-object mutation, kernel-definition accessor mutation, stateful
  verifier receiver binding, verifier getter flips, mutable verifier evidence,
  malformed verifier evidence, malformed cognitive-epoch digests, and one-read
  validation-check accessors.

## Truth Boundary

This packet records current protected source, hosted check state, and focused
local validation for the state-native runtime. No UI surface, route, deployment,
database, DNS, secret, branch-protection setting, or external account is changed
by this workcell. No production, customer-runtime, or independent human-review
claim is made. For the solo-build boundary, automated review and exact-head
checks may be used as enforcement evidence, but they are not represented as
independent human approval.
