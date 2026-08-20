# P0 Series A Product Wiring - Review Repair Proof Packet

Recorded: `2026-08-20T13:27:31Z`

## Verdict

`SOURCE_REPAIR_VERIFIED / HOSTED_RECAPTURE_REQUIRED / FINAL_HEAD_GATES_PENDING`

This append-only correction supersedes the screenshot-proof conclusion in
`P0_SERIES_A_PRODUCT_WIRING_LOCAL_SUCCESSOR_PROOF_2026-08-11.md`. It does not
modify or delete the earlier packet. The imported images remain audit history,
but they are not current proof.

## Required proof fields

| Field | Value |
|---|---|
| `workcell_id` | `P0-SERIES-A-PRODUCT-WIRING-20260811` |
| `agent` | Codex |
| `objective` | Repair every actionable PR #656 review finding and the Truth drift failure without weakening a gate or overstating screenshot evidence. |
| `plan_summary` | Remove the stale claim, wire the contract suite into normal CI, fail closed on non-origin capture state, complete per-capture metadata, and supersede invalid imports pending recapture. |
| `proof_level` | Level 2 - source repair proof; release proof remains pending a valid hosted recapture and final-head gates. |
| `recorded_at` | `2026-08-20T13:27:31Z` |
| `recorded_by` | Codex |

## Exact audit boundary

| Field | Evidence |
|---|---|
| Repository | `szl-holdings/platform` |
| Pull request | #656 |
| Protected base | `48b0ea169de75990e44b6ec924e59fe7d76e6020` |
| Audited PR head | `83479fc52eb1ca6a5e4a7e6fe44cd0cb88340eec` |
| Audited PR tree | `7d48f551e51cc56ba5343cc9036620e70806b7ac` |
| Review submission | `4982734166` (`COMMENTED`) |

The three actionable review comments were:

- `PRRC_kwDORxaH7M7jyLK2`: every capture needs its own complete doctrine metadata;
- `PRRC_kwDORxaH7M7jyLK_`: tab interaction must not leave full-page capture below
  the scroll origin; and
- `PRRC_kwDORxaH7M7jyLLE`: the package contract suite must be reachable through
  the normal `test` task used by CI.

## Red-gate diagnosis

Truth drift job `96416421439` in run
[`32366296646`](https://github.com/szl-holdings/platform/actions/runs/32366296646)
failed on one stale workflow-count phrase in
`.codex/tasks/P0_SERIES_A_PRODUCT_WIRING_20260811.md`. The generator,
canonical artifacts, validation, allowlist coverage, and Truth unit suite were
otherwise clean. The repair changes only that stale phrase; it does not change
the gate or canonical count.

Lighthouse job `96416422182` for Vessels in run
[`32366296671`](https://github.com/szl-holdings/platform/actions/runs/32366296671)
also failed. The PR changes no Vessels source, Lighthouse configuration,
dependency lockfile, or shared runtime used by that surface. No unrelated code
change is made for that external-only red job.

## Patch summary

- `scripts/qa/capture-series-a-proof.mjs` now resets the page to `(0, 0)` after
  tab exercise, waits until the browser reports the origin, waits two animation
  frames for layout stability, verifies origin again at capture time, and records
  `scroll_origin: true` only on passing captures.
- `artifacts/a11oy/package.json` exposes the Series A contract suite as `test`,
  so the repository's normal Turbo test graph discovers it.
- `artifacts/a11oy/test/series-a-contract.test.mjs` protects normal test wiring,
  scroll-reset ordering and fail-closed assertions, and complete per-capture
  catalog fields.
- `audit/screenshot-catalog.md` gives each imported PNG every required doctrine
  field and marks it `superseded` with the visual defect stated explicitly.
- `.codex/tasks/P0_SERIES_A_PRODUCT_WIRING_20260811.md` and
  `docs/operations/known-gaps.md` reopen hosted screenshot proof until a repaired
  exact-head artifact is visually inspected and imported.

## Test results

| Command | Exit | Result |
|---|---:|---|
| `pnpm --filter @workspace/a11oy test` with package-manager switching and dependency auto-repair disabled | 0 | All Series A contract cases passed. |
| `turbo run test --filter @workspace/a11oy --only --force --env-mode=loose` | 0 | The normal package `test` task was discovered and passed. |
| `tsc -p artifacts/a11oy/tsconfig.json --noEmit` | 0 | A11oy typecheck passed. |
| `vite build --config vite.config.ts` from `artifacts/a11oy` | 0 | Production build completed. |
| `biome check` on the changed JSON and JavaScript files | 0 | Formatting and lint checks passed with no changed-file diagnostics. |
| `biome lint ./src` from `artifacts/a11oy` | 0 | Package lint completed; existing informational and warning debt remains outside this repair. |
| `node --check` on the capture script and contract test | 0 | JavaScript syntax passed. |
| `generate-public-surfaces.ts --check` | 0 | Deterministic public-surface manifest passed. |
| `generate-truth.ts --verify-local` with the pinned pnpm CLI and offline bootstrap controls | 0 | Deterministic local Truth passed. |
| `validate-truth.ts` | 0 | Truth schema and evidence validation passed. |
| `generate-allowlist-justifications.ts --check` | 0 | Active suppression coverage passed. |
| Complete Truth unit command from `truth:test`, run through `node --import tsx --test` | 0 | All Truth cases passed. |
| `claims-drift.ts` | 0 | Canonical claim drift check passed. |
| `check-claims.ts --base 48b0ea169de75990e44b6ec924e59fe7d76e6020` | 0 | No newly introduced claim drift remained. |
| `git diff --exit-code -- artifacts/SOURCE_OF_TRUTH.json artifacts/PUBLIC_SURFACES.json` | 0 | Canonical generated artifacts were unchanged. |
| `git diff --check` | 0 | No whitespace errors. |

## Environment-limited checks

- The filtered dependency bootstrap populated the A11oy closure but pnpm v11
  exited on its ignored-builds policy and proposed an unrelated workspace
  manifest normalization. No workspace-manifest change is retained. Final
  focused checks use the installed closure without weakening dependency policy.
- The repository-wide `pnpm typecheck` baseline could not complete in this
  restricted worktree because out-of-scope package tasks entered implicit pnpm
  installation instead of TypeScript. Exact audited-head hosted Typecheck was
  green; the focused A11oy typecheck above passed locally.
- A standalone `tsc -p packages/omnia-shell/tsconfig.json --noEmit` reproduces
  existing DOM-library configuration errors across unchanged Omnia files. This
  PR repair does not alter that package configuration. The A11oy typecheck that
  consumes the changed provider contract passed.
- Initial local Turbo and Truth invocations exposed pnpm version-switching and
  restricted state-directory behavior. Reruns with the pinned CLI, offline
  bootstrap controls, and loose Turbo environment propagation passed as recorded
  above.
- The first Vite build attempt used an incorrect relative binary path and exited
  before starting. The corrected package-local Vite invocation passed as recorded
  above.
- No local screenshot is promoted. The GitHub Actions capture workflow is the
  declared hosted environment, and a new exact-head run is intentionally left as
  a post-publication gate.

## Screenshot references

No new screenshot was captured by this source repair. The five imported files
for `/a11oy/start` remain listed in `audit/screenshot-catalog.md` as
`superseded`. They contribute to no current proof level. A fresh hosted capture
must be inspected for stable top-of-page composition before import.

## Verification notes

The repaired capture path cannot record PASS unless the page returns to the
scroll origin after all tabs are exercised and remains there after two animation
frames. The regression suite also fails if normal CI wiring disappears, capture
ordering regresses, or any required catalog field or superseded status is
removed. This closes the review findings without treating an invalid image as
evidence.

## Public claim check

No new production, deployment, customer, revenue, compliance, or runtime claim
is introduced. Truth generation, validation, drift, and incremental scanning all
pass. The stale workflow-count phrase is removed rather than allowlisted.

## Security check

No credential, token, environment value, dependency, workflow permission, or
remote mutation is introduced. The patch changes source validation, tests, and
audit documentation only.

## Known gaps update

`docs/operations/known-gaps.md` now states that current screenshot proof remains
open. Required promotion sequence: publish the repair through normal review,
run the exact-head hosted capture, inspect every viewport, import the new artifact
with complete per-file metadata, rerun final-head gates, and merge only through
protected controls.
