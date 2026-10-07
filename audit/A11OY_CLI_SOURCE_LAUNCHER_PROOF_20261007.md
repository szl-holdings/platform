# A11oy CLI source launcher proof

Workcell: `A11OY-CLI-SOURCE-LAUNCHER-20261007`

Recorded by: Codex (implementer; not an independent witness)

Objective: publish the locally tested Windows source launcher with the CLI package.

## Context and plan, recorded before implementation

Source baseline: `7d5f3d4121669f834f747a606cc96d50997763f3` on PR #887.
Authenticated fetch confirmed local and remote feature heads match (0/0 divergence);
protected-main baseline remains `f2f8df6f89056e9104587674ccec0855dd5b177a`.
The repository declares A11oy Partial. Existing provider, production browser,
durable-ledger and deployment gaps remain open. Canonical estate instruction blobs
were refreshed and unchanged from those already read. No nested CLI AGENTS file
was found. The package has no README or source-launcher entry point.

Scope: add `packages/a11oy-cli/a11oy-atelier.ps1`, its bounded Windows tests and
helper under `packages/a11oy-cli/tests/`, a package README, a `test:launcher` script,
and a narrow known-gaps note. Integrate the added tests into the existing package
test command; on non-Windows, skip only these Windows-specific new cases with an
explicit platform reason. Do not change existing tests, workflows, dependencies,
provider configuration, user terminal settings, or merge controls.

The launcher resolves the package from its own path, requires PowerShell 7.3+
and Node 24+, validates local prerequisites, defaults to help, forwards literal
arguments, preserves exit codes/current directory, and refuses dot-sourcing.
No automatic install, backend startup, inference, or global registration.

Acceptance: all added Windows cases and all existing CLI tests pass; package
typecheck is no worse than baseline; formatting, lint and whitespace checks pass;
only intended paths enter a signed commit; remote readback matches pushed source.
No UI or route changes, so screenshot/route checks are not applicable. Proof level
target: 2 (local non-UI code), not release proof. Readiness/claim/screenshot scores
were NOT MEASURED; no numerical readiness claim is introduced.

## Baseline observations

- `corepack pnpm typecheck`: exit 1 before edits; `turbo` command shim missing in
  this sparse checkout. Repository-wide typecheck evidence is UNAVAILABLE.
- `corepack pnpm --dir packages/a11oy-cli typecheck`: exit 1 before edits; `tsc`
  command shim missing. Direct installed-compiler validation is recorded below.
- `corepack pnpm --dir packages/a11oy-cli test`: exit 0; 12/12 existing CLI tests
  passed before edits. This is a scoped package result, not a platform total.
- The earlier outside-repository launcher had a retained 12/15 timeout run and
  later 15/15 local pass with unchanged assertions/15-second bound. Those are
  historical local results, not verification of the new repository paths.

## Implementation and verification

MEASURED on Windows with Node `v24.19.0` and PowerShell `7.6.6`:

- `corepack pnpm --dir packages/a11oy-cli test`: exit 0, 27 tests passed,
  0 failed, 0 skipped. This includes the original 12 cases and 15 launcher cases.
  The final run after formatting and PATH-based PowerShell discovery completed
  in 32,354.6136 ms. No timeout or assertion was relaxed.
- `node node_modules/.pnpm/typescript@6.0.3/node_modules/typescript/bin/tsc
  --noEmit -p packages/a11oy-cli/tsconfig.json`: exit 0 after implementation.
- `corepack pnpm typecheck`: exit 1 after implementation, the same missing
  `turbo` shim as baseline. Whole-repository typecheck remains UNAVAILABLE;
  the direct compiler result above applies only to the CLI package.
- `node node_modules/.pnpm/@biomejs+biome@2.4.16/node_modules/@biomejs/biome/bin/biome
  check packages/a11oy-cli/tests/launcher.test.cjs packages/a11oy-cli/package.json`:
  exit 0, two files checked, no fixes needed after the formatting pass.
- `node node_modules/.pnpm/oxlint@1.69.0/node_modules/oxlint/bin/oxlint
  --quiet packages/a11oy-cli/tests/launcher.test.cjs`: exit 0.
- `git diff --check`: exit 0.

An initial `corepack pnpm dlx @biomejs/biome@2.4.12 check ...` attempt exited 1
because its temporary package lacked an importer manifest. The installed,
lock-selected Biome 2.4.16 executable was then used successfully; package and
lockfile dependencies were not changed. No hook or security check was bypassed.

A read-only peer agent identified the initial fixed PowerShell install path as
too restrictive. Tests now resolve an absolute `pwsh.exe` through the parent's
PATH before restricting child environments. The peer found no remaining blocker
in that change. This is source review, not an independent runtime replay.

MEASURED worktree-byte SHA-256 values after the final test and formatting run
(Git line-ending normalization can yield different repository blob bytes):

| Path | SHA-256 |
| --- | --- |
| `packages/a11oy-cli/a11oy-atelier.ps1` | `f1c77250d98d03c66e634d007275d15ec88c641879f4d81b6f89459f76f349e2` |
| `packages/a11oy-cli/tests/launcher.test.cjs` | `ee7c496d5d84caba43e46234b2fd2a3152ae39d0dfee0971a8e4a0da155652f3` |
| `packages/a11oy-cli/tests/verify-location.ps1` | `348205f0e153bfaf7c0214aa5f5f77293142393c6671ef3873ba3a073d1c5c07` |
| `packages/a11oy-cli/package.json` | `bf12a1a1793fb6877da877224b87433acf0464d03956e7e2f3968e7a814a7b87` |
| `packages/a11oy-cli/README.md` | `76dd98c6c4b7ed54d57a56c6adafda4b800e39506558d95fa061d20c31a76a99` |
| `docs/operations/known-gaps.md` | `95d258e71364182b868b124bd0ab540e3a22d394e6d576b463540ddb4ec43e6e` |

## Publication and unchanged boundaries

The containing commit and its remote readback establish source publication only
after the normal signed-commit and push workflow succeeds. New exact-head CI,
protected merge, deployment, provider runtime and automatic terminal startup are
UNKNOWN at this pre-commit recording point. Screenshot and route checks: NOT RUN
(no UI or route changed). Whole-platform build/test: NOT RUN for this scoped patch.

Release remains BLOCKED by the existing dependency-security gates. A fresh
primary-source check on 2026-10-07 still found no patched version listed for
[node-forge GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
or [braces GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The proposed [braces depth-guard PR #75](https://github.com/micromatch/braces/pull/75)
is closed and unmerged; its author withdrew it on October 5. No suppression,
dependency replacement, security threshold, workflow or merge-control change is
included. Local launcher tests do not remediate these advisories.

The existing `.verification/` directory and outside-repository launcher/evidence
were preserved. No user terminal setting, shell profile, provider credential,
model weight or signing configuration was changed. The commit is not a release
or an independent proof of the broader A11oy platform.
