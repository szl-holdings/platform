# CI TRIAGE — pre-existing failures deferred from PR #77

PR #77 closed every gap that was mechanically fixable on a single branch. The items below are pre-existing failures that predate PR #75 and require product decisions or infrastructure investment, not just code edits.

## High priority (CI gates that may still flake)

### Integration Tests
- Vitest integration suite (`pnpm run test:integration`) requires Postgres + Redis + a seeded test database.
- Current CI has no service containers wired to these — every integration test fails on connect.
- Fix: add `services:` block to the workflow with `postgres:14` and `redis:7`, point `DATABASE_URL` and `REDIS_URL` at them, and run migrations + seed before tests.

### CORTEX Security Tests
- Several red-team fixtures intentionally feed prompt-injection payloads through the agent runtime to assert that policy gates block them.
- A subset of these have started passing (the agent now refuses earlier in the pipeline) and the test asserts the wrong status code.
- Fix: per-test review by security author. Not a CI infra fix.

### Route Security Matrix
- The matrix file in `docs/security/route-matrix.md` enumerates expected auth/role gates per route.
- Several newer routes (mostly `/imperium/*`, `/prism-counsel/*`, `/operations/*`) added in the last quarter are missing entries.
- Fix: add rows for each undeclared route. Owner per route is in the corresponding handler file's header comment.

## Medium priority (E2E / Lighthouse)

### E2E suite per app (19 apps)
- Playwright suites exist for szl-holdings, forge, terra, vessels, carlota-jo, command, lyte-command-center, sentra, a11oy, conduit, counsel, pulse, governed-decision-loop, auth, rbac, stephen-site, billing, correlation-deeplinks, decision-theater, health-and-404.
- Each requires the corresponding artifact to boot in the CI runner and survive Playwright traffic.
- Most fail on missing `VITE_*` env vars at boot or on stub data not seeding correctly. The env vars are now documented in PR #77 — a follow-up PR should populate values for CI from a sealed-secret store.

### Lighthouse CI
- Per-app perf budgets defined in `.lighthouserc.json`.
- Many apps regressed on bundle size after the design-system migration.
- Fix: re-baseline budgets or add code-splitting for heavy routes.

### A11y axe per app
- Same as Lighthouse — runs against booted apps, blocked on env-var population in CI.

## Low priority (runtime audit / PRAXIS)

### Runtime Audit Harness (`audit:full`)
- The P0-abort pipeline that runs `audit:full` fails on a missing artifact (`audit/baseline.json`) that should be checked into the repo or generated at start of run.
- Fix: commit a baseline file or change the pipeline to bootstrap one.

### PRAXIS Visual Regression
- Snapshot comparison against committed PNGs.
- Many snapshots are stale after recent UI changes.
- Fix: regenerate snapshots in a focused PR after running each affected app once.

## Process changes recommended

1. **Run heavy CI on master pushes too.** The CI workflow only runs on `pull_request:` — every PR drowns in latent failures because nobody sees them between PRs. Add `push: { branches: [master] }` so master regressions surface immediately.
2. **Make `lint:ci` part of the pre-commit hook.** Husky already runs `docs:claims-check`; add biome and oxlint with `--max-warnings 0` to catch lint errors before they reach CI.
3. **Add a `commit-msg` hook for commitlint.** Currently commit-message issues are only caught after push, by which time fixing them requires a force-push.

## Owner notes

- Each item above lives in CI, not product. If the inbox flood was the driver, PR #77 is enough to stop the bleeding (lint/env/build gates flip green for new PRs).
- Items marked High require real engineering time — figure 1–3 days each if scoped tightly.
- Items marked Medium require either CI infra or environment-variable plumbing.
- Items marked Low are housekeeping.
