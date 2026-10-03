# Exact-head controller runtime repair — Proof Packet

- Workcell ID: `exact-head-controller-runtime-repair-2026-10-03`
- Actor: Codex / BuildWarden
- Recorded at: 2026-10-03T07:42:21Z
- Base controller revision: `f2f8df6f89056e9104587674ccec0855dd5b177a` (protected `main`)
- Source PR under capture: [#884](https://github.com/szl-holdings/platform/pull/884)

## Objective and plan (recorded before patch)

Repair the protected controller's candidate runtime path so an isolated OS identity can execute the pinned pnpm runtime and use its private dependency home without gaining write access to controller source, candidate source, pnpm binaries, or evidence. Keep the exact-PR-head checks, script suppression, byte verification, and publication gate intact.

1. Change only `.github/workflows/exact-head-screenshot-evidence.yml` to place the per-run pnpm runtime and candidate home/cache/store under the protected workspace as siblings of `controller` and `candidate`. Keep the `0700` evidence root under `runner.temp`.
2. Keep the pnpm action's declared `bin_dest` as the source of the executable path, and explicitly verify workspace traversal, non-writability of every lexical and resolved workspace ancestor, executable access as the candidate identity, and pnpm tree immutability.
3. Update the matching workflow contract test and `docs/standards/exact-head-screenshot-evidence.md` for the new layout. Use this packet for command results and the blocked hosted state.
4. Verify syntax, focused contract tests, no weakened guards or secret diff, then push a separate protected-controller PR. An actual hosted capture remains required before claiming the repair operational.

## Pre-patch observation

[Workflow run 37106028221](https://github.com/szl-holdings/platform/actions/runs/37106028221) was dispatched on `main` controller `f2f8df6f89056e9104587674ccec0855dd5b177a` for PR #884 candidate `bc06fa733ad0cb000e1c4cfd5eda00aa9daba348`. The capture contract succeeded; capture failed in `Prepare isolated candidate dependency roots` with exit 1. Publication was skipped and no artifact or issue receipt was produced. The log does not expose which silent `test` predicate returned 1, so the precise failed predicate is `UNKNOWN`.

The logged `.../node_modules/.bin/bin/pnpm` path is expected: pinned `pnpm/action-setup@ea17c68df8912ef543352723c149a84f56e3d413` returns `PNPM_HOME/bin` in its `bin_dest` output after a self-update. This is documented in its [official source](https://github.com/pnpm/action-setup/blob/ea17c68df8912ef543352723c149a84f56e3d413/src/install-pnpm/run.ts). The controller's runner-side admission of that path passed; the first candidate-side checks occurred in the failed step.

The required pre-edit `pnpm typecheck` returned exit 1 because `pnpm` is not on this workstation's `PATH`. No repository TypeScript diagnostics were reached. This is the baseline for the same command after patch.

## Post-patch verification

Recorded at 2026-10-03T08:00:39Z. Evidence class: **MEASURED local** for
the commands below; hosted capture and runtime outcome remain **UNKNOWN**.

- `git ls-remote origin refs/heads/main` returned the base SHA
  `f2f8df6f89056e9104587674ccec0855dd5b177a`; the repair was based on
  current protected `main` at this check.
- `node --test scripts/ci/exact-head-screenshot-evidence.test.mjs` passed:
  19 tests, 14 pass, 5 Windows POSIX-only skips, 0 fail. The new executable
  Bash binding test is among the Windows skips, so this does not claim that
  test passed in CI.
- `node --check scripts/ci/exact-head-screenshot-evidence.test.mjs` passed.
- `python -c ... yaml.safe_load(...)` parsed the workflow and found all three
  jobs (`contract`, `capture`, `publish`).
- Ubuntu WSL `bash -n` passed on all 16 workflow `run` blocks extracted from
  that YAML. The initial text-mode stdin attempt produced CRLF parser noise;
  binary stdin produced a clean exit 0. No workflow code was changed for that
  harness artifact.
- Ubuntu WSL executed the extracted `Bind isolated controller paths` block:
  the intended workspace-runtime/runner-temp-evidence layout exited 0, a pnpm
  root placed under runner temp exited 1, and an evidence root placed under the
  workspace exited 1. The latter two emitted their specific fail-closed
  diagnostics.
- `git diff --check` passed. `pnpm typecheck` returned exit 1 again because
  `pnpm` is not on the workstation `PATH`; no typecheck diagnostics ran. No
  install was attempted under the low-disk condition.

The source checkouts remain separate children of `GITHUB_WORKSPACE`; new
per-run home and runtime siblings are not inside either checkout. Thus they do
not alter tracked-status readbacks of `controller` or `candidate`. Artifact
upload remains bound exclusively to the evidence subtree under `runner.temp`;
runtime/home siblings are not packaged. The candidate identity can write only
its enumerated home/cache/store and dependency directories, not the workspace
or any lexical or resolved ancestor, source checkout, admitted pnpm tree, or
evidence root. The
workflow reads back `test -x` on the exact action-output pnpm executable as
that candidate identity and emits a diagnostic on failure. These are source
contract assertions until a hosted run exercises them.

Screenshot applicability: **NOT RUN** (workflow-only controller repair).
No screenshot, artifact identity, issue receipt, signed promotion, deployment,
or production/customer observation is claimed. A protected-main merge followed
by a fresh exact-head dispatch and independent review remains necessary.
