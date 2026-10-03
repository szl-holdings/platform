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
  no failures, with POSIX-only cases skipped on Windows. The new executable
  Bash binding test is among those Windows skips, so this does not claim that
  test passed in CI.
- `node --check scripts/ci/exact-head-screenshot-evidence.test.mjs` passed.
- `python -c ... yaml.safe_load(...)` parsed the workflow and found all three
  jobs (`contract`, `capture`, `publish`).
- Ubuntu WSL `bash -n` passed on all workflow `run` blocks extracted from
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

## Initial PR check disposition

At the first [controller PR](https://github.com/szl-holdings/platform/pull/886)
head, the capture contract and clean-clone checks passed. `truth-drift` rejected
hardcoded local test and shell-block totals in this packet as canonical platform
metrics; this follow-up replaces only that ambiguous prose, without weakening
the gate or changing the measured local command outcomes. The blocking Security
Gate also failed because its dependency scan failed: the hosted vulnerability
report command exited nonzero, while Grype separately reported vulnerabilities
at HIGH severity or above. These security findings are not waived by this
controller repair. Typecheck and the remaining checks require fresh-head
readback. Hosted capture on protected `main` remains **NOT RUN** for this repair.

## Additive dependency compatibility repair (2026-10-03)

Evidence class: **MEASURED** for the local commands below. This addition starts
from exact PR #886 head `3dd0fb3e80e91103ee395ec3920a27f45b69d16c`, with protected
`main` still `f2f8df6f89056e9104587674ccec0855dd5b177a`. The original product PR
#601 is already merged; its deleted branch is not recreated. Owner-authorized
coordination is recorded in [the PR comment](https://github.com/szl-holdings/platform/pull/886#issuecomment-5967974460).
Cross-chat message delivery was **UNAVAILABLE** (transport closed), not assumed
successful. The separate Atelier repair remains assigned to PR #885.

The frozen baseline installs successfully, but the real legacy minimatch
consumers throw `expand is not a function` with the blanket brace-expansion v5
override. The retained compatibility harness reproduces this at the current
head. Its Git blob is `7d601cc6801e6dc1c1a94bc1074abf71e814bef8`, matching the
preserved local work, not a claim to recover unavailable historical commit
`8243029`.

Only minimatch majors 3, 5, and 9 receive API-compatible brace-expansion
backports (1.1.21, 2.1.7, and 2.1.7 respectively). Modern consumers retain
5.0.12. Lockfile regeneration's unrelated Metro/Babel changes were removed;
the resulting frozen install succeeds. The compatibility command is added to
the existing blocking dependency job. The audit's `always()` condition,
security-gate dependencies, severity thresholds, release-age admission,
controller isolation, and publication checks are unchanged.

All pnpm commands here invoke the repository-pinned pnpm 10.26.1 JavaScript
entrypoint with Node v24.19.0 (`node <pnpm-10.26.1>/bin/pnpm.cjs ...`), because
pnpm is not directly on the initial shell PATH. These are scoped command
outcomes, not canonical platform totals or hosted qualification:

| Command | Outcome |
| --- | --- |
| `pnpm typecheck` before dependency linking | Exit 1: turbo unavailable; no TypeScript diagnostics reached. |
| `pnpm install --frozen-lockfile --ignore-scripts` at the baseline | Exit 0. |
| `node --test scripts/qa/security-overrides-compat.test.mjs` before repair | Exit 1: legacy consumer API errors and lockfile-contract failure. |
| `pnpm install --lockfile-only --ignore-scripts`, then `pnpm install --frozen-lockfile --ignore-scripts` after scoped regeneration | Both exit 0; existing peer warnings remain. |
| `node --test scripts/qa/security-overrides-compat.test.mjs scripts/qa/check-fflate-resolution.test.mjs scripts/qa/generate-sbom.test.mjs scripts/qa/generate-vuln-report.test.js` | Exit 0, no failures or skips. |
| `node --test scripts/ci/exact-head-screenshot-evidence.test.mjs` | Exit 0; POSIX-only cases skipped on Windows, not claimed as passed. |
| `pnpm --filter @workspace/alloy-embedding-api test --maxWorkers=1` | Exit 0. Uses local fixtures, not provider execution. |
| `pnpm --filter @workspace/alloy-runtime-api test src/routes/v1/index.test.ts --maxWorkers=1` | Exit 0. |
| `pnpm --filter @workspace/alloy-runtime-api typecheck`, `pnpm --filter @workspace/alloy-embedding-api typecheck`, `pnpm --filter @workspace/a11oy typecheck` | Each exit 0. |
| `pnpm --filter @szl/substrate-mcp-gateway typecheck` | Initially exits 2 with TS2339 for `ImportMeta.env` in unchanged `packages/aef-sdk/src/config.ts:20`. After the normal prerequisite `pnpm --filter @workspace/aef-sdk build` exits 0, the identical MCP typecheck exits 0. No source/config workaround was applied. |
| `pnpm typecheck --concurrency=1` with `NODE_OPTIONS=--max-old-space-size=1536` | Initial post-install attempt exits 1 on a Windows path error during decision-engine's prerequisite build. Direct `pnpm --filter @szl-holdings/decision-engine build` subsequently exits 0. The aggregate retry fails during api-client-react's prerequisite build with heap exhaustion (child exit 134). No aggregate pass is claimed. |
| `pnpm exec biome check scripts/qa/security-overrides-compat.test.mjs`, `node --check scripts/qa/security-overrides-compat.test.mjs`, `node scripts/qa/check-fflate-resolution.mjs` | Each exit 0; no formatter fixes applied. |
| `pnpm brand:check`, `pnpm docs:claims-check`, `git diff --check` | Each exit 0. |
| `pnpm claims:drift` with `TRUTH_ALLOWLIST_BASE_SHA=f2f8df6f89056e9104587674ccec0855dd5b177a`, `pnpm truth:test` | Each exit 0, with no gate or allowlist changes. |
| `pnpm audit --json --audit-level=high` | Exit 1: high-severity node-forge and braces advisories remain; low-severity DOMPurify finding also remains. |

The current high findings are [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
and [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
The audit response lists no patched version for either. `braces` is a different
dependency from `brace-expansion`; this repair does not fix or waive those
findings. The earlier September clean audit is historical, not current evidence.

The aggregate command generated an untracked evidence-doctrine lockfile while
honoring that nested package's pnpm declaration; it was retained under ignored
local output, not added to this change. No existing user work was deleted.
An independent read-only diff review found no actionable compatibility or
gate-weakening issue; that review is not independent runtime certification.

GitHub REST policy/signature refresh became **UNAVAILABLE** due to HTTP 403
rate limiting. No alternate credential or policy bypass was attempted. Normal
Git transport still reads the exact branch heads. A normal additive branch
push, if accepted, is source durability only: merge and release remain
**BLOCKED** by the unresolved security findings and fresh-head qualification.
New screenshots, hosted capture, merge, deployment, HF publication, and model
evaluation are **NOT RUN** for this compatibility addition. Existing capture
evidence binds its historical source and does not qualify this changed lockfile.
