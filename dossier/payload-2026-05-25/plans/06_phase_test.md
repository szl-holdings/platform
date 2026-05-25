# Phase 6 — Test pass + smoke

## Goal
Every phase's deliverable is verifiable from CI in one command.

## Coverage matrix

| Surface                            | Tool        | Command                                                  |
|------------------------------------|-------------|----------------------------------------------------------|
| Phase 2 TS shims                   | Vitest      | `pnpm --filter @platform/agi-forecast test`              |
| Phase 2 Lean lemmas                | Lake        | `lake -d packages/lean-formulas build`                   |
| Phase 3 UDS payload build          | bash        | `bash artifacts/a11oy-uds/scripts/build.sh`              |
| Phase 3 payload integrity          | node script | `node artifacts/a11oy-uds/scripts/verify-manifest.mjs`   |
| Phase 4 API routes                 | Vitest      | `pnpm --filter @artifact/api-server test`                |
| Phase 4 frontend wiring            | Vitest      | `pnpm --filter @artifact/vessels test`                   |
| Phase 4 + 5 end-to-end             | Playwright  | testing skill `runTest({ scope: 'vessels' })`            |
| Repo-wide static check             | tsc         | `pnpm -r typecheck`                                      |

Each command above is registered as a named validation step via the
`validation` skill, so `runValidation()` runs them in order and stops on the
first failure.

## Smoke checklist (manual, after CI green)
- AGI-forecast page: 12-gauge status panel visible, refresh button hits POST.
- Vessels: fleet list, click a vessel, plan a route, view a coexistence
  report — all backed by DB, none by fixtures.
- A11oy UDS: `zarf package inspect dist/a11oy-uds/*.tar.zst` lists 3
  components with matching sha256s.

## Done looks like
- `runValidation()` exits 0.
- Smoke checklist signed off in the PR description.
