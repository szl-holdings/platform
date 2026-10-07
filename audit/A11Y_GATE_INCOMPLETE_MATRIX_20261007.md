# A11y aggregate gate: incomplete matrix receipt

- `workcell_id`: platform-a11y-gate-20261007 / PR #907
- `agent`: SZL Codex
- `recorded_at`: 2026-10-07T18:36:15Z
- `recorded_by`: SZL Codex
- `proof_level`: 2, source and local contract evidence only; hosted exact-head CI pending

## Objective and plan

Require the `A11y Gate` fan-in job to pass only when every axe matrix job completes successfully. Edit the workflow and the existing dependency-free workflow contract test. No product UI, route, dependency, or provider deployment is in scope.

## Observation and patch

**MEASURED:** [PR #905 run 37664304396](https://github.com/szl-holdings/platform/actions/runs/37664304396) at `502d861ec18719fc5f242c25651fe4e56d8e4462` reported four `A11y axe` jobs `CANCELLED` while `A11y Gate` was `SUCCESS`. Protected `main@f2f8df6f89056e9104587674ccec0855dd5b177a` checked only whether the matrix result was `failure`.

**DECLARED source candidate:** commit `36492fdd239c89a72a02a935486c145d4044b9f7` requires `needs.a11y-axe.result` to equal `success`; any other result exits 1 and reports an incomplete matrix. Its test in `scripts/ci/lighthouse-workflow.test.mjs` asserts the success-only condition and fail-closed fan-in wiring.

## Tests and verification

| Command | Exit | Result |
|---|---:|---|
| `node --test scripts/ci/lighthouse-workflow.test.mjs` | 0 | Five workflow contract tests pass |
| `node -e` YAML parse using repository `yaml` package | 0 | `a11y-gate` job parses and exists |
| Extracted gate condition under Git Bash | 0 harness | `success` exits 0; `failure`, `cancelled`, `skipped`, and empty exit 1 |
| `git diff --check` | 0 | No whitespace errors |
| Local commit and push hooks | 0 | Biome, Oxlint, brand checks passed |
| `pnpm typecheck` before patch | 1 | Local fallback pnpm 11 stopped during dependency setup on ignored builds |
| `corepack pnpm typecheck` after patch | 1 | Nested package scripts invoked fallback pnpm 11 and failed; no TypeScript pass claimed |

The source and test diff contains no credentials, environment files, public-facing product copy, UI, or routes. Screenshots and route QA have no changed surface to capture. No named item in `docs/operations/known-gaps.md` changed status; protected admission and hosted typecheck remain pending. A passing local contract test is not a completed hosted axe scan or a release.
