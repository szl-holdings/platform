# AEF evals offline opt-in proof

Workcell: `AEF-EVALS-OFFLINE-OPT-IN-20261102`

## Plan

Keep `@workspace/aef-evals` default tests offline, retain a separately invocable
real-vector suite, and prove that the backend module loader cannot run without
an exact operator opt-in.

## Source boundary

- Reviewed and based the remote candidate on current main:
  `590e0c9f279d7ec2083c31581499825416a647a7`.
- The pre-change test, package manifest, README, and Vitest configuration blobs
  matched the local source snapshot exactly.
- The prior `beforeAll` constructed `LocalCpuBackend` and called `embed()` before
  deciding whether a model-fetch failure should be skipped.
- Merged PR #1002 changed nine `lib/ai-engine` and proof files; this workcell
  changes none of those paths.

## Change

- Only literal `AEF_EVALS_REQUIRE_REAL=1` admits the real-vector suite.
- The vector-worker import is dynamic and behind the opt-in loader.
- Default tests cover missing and false-like values and assert that the injected
  backend loader has zero calls.
- An opted-in model-load failure is a test failure, not a skip.

## Validation

- `node --experimental-strip-types --check` passes for the gate module, its
  regression test, and the real-vector test.
- A dependency-free Node 24.19.0 gate matrix covers six missing or false-like
  values with zero loader calls and the literal value `1` with one loader call.
- `git diff --check` passes.
- Baseline and final `pnpm typecheck` are blocked before test execution: this
  runner exposes pnpm 11.19.0 while the repository requires 10.26.1, and the
  isolated worktree has no installed dependencies.
- Vitest is therefore delegated to fresh exact-head hosted checks. No dependency
  or model download was attempted locally.

## Limits

This patch establishes default-run network admission only. It does not execute
the real model, measure retrieval quality, qualify cached artifacts, publish a
package, deploy a service, or establish runtime readiness.
