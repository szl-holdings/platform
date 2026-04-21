# Fixes Applied — Phase C: Testing, Debug & Verification

**Generated:** 2026-04-21  
**Phase:** Series A Hardening — Phase C

---

## Summary

| Fix ID | Type | File | Impact |
|--------|------|------|--------|
| FIX-001 | Typecheck regression | `packages/config/package.json` | Unblocks CI typecheck for platform-registry |
| FIX-002 | Unit test hang | `tests/api/health.test.ts` | Unblocks API unit test suite — health tests now run in ~1 s instead of timing out |
| FIX-003 | E2E spec gap | `tests/e2e/health-and-404.spec.ts` | NEW — adds Phase C required coverage for /health and 404 |
| FIX-004 | CI matrix gap | `.github/workflows/e2e.yml` | Wires health-and-404.spec.ts into the E2E CI matrix |

---

## Detail

### FIX-001 — `@szl-holdings/platform-registry` typecheck

**Problem:** `packages/config/tsconfig.json` declared `"types": ["node"]` but `@types/node` was absent from the package's `devDependencies`. TypeScript could not locate the type definition file and failed the typecheck step.

**Fix:** Added `@types/node` to `devDependencies` in `packages/config/package.json` via `pnpm --filter @szl-holdings/platform-registry add -D @types/node`.

**Verification:** `pnpm --filter @szl-holdings/platform-registry run typecheck` exits 0.

---

### FIX-002 — `tests/api/health.test.ts` hang / timeout

**Problem:** The health unit test imported the live health route (`artifacts/api-server/src/routes/health`), which transitively imported:
- `pool` from `@szl-holdings/db` → attempted a real PostgreSQL connection
- `getBackupHealthStatus` from `../lib/backup-service` → also imports `pool`
- `Sentry` from `../lib/sentry`
- `verifyInternalHeader` / `tokenHasScope` from `../lib/internal-tokens`
- `adminGuard` from `../middlewares/admin-guard`

Without mocks, the pool connection attempt hung indefinitely, causing a 15-second timeout on every test.

**Fix:** Added `vi.mock()` declarations at module level for all transitive dependencies that attempt real I/O. Updated test assertions to match realistic route output (status field present; 'ok' when SESSION_SECRET is set and DB mock resolves).

**Verification:** `pnpm vitest run --config vitest.config.ts tests/api/health.test.ts` → 3 passed in ~1.2 s.

---

### FIX-003 — New E2E spec: `tests/e2e/health-and-404.spec.ts`

**Problem:** The Phase C testing matrix required Playwright smoke coverage for:
1. `/api/health` endpoint — not covered by any E2E spec (only by API unit test)
2. 404 / unknown route — not covered (no spec verified that an unknown path doesn't trigger an error boundary)

**Fix:** Created `tests/e2e/health-and-404.spec.ts` with:
- **Health probe** — uses `page.request.get()` against the API server URL; self-skips with a clear reason when no API server is reachable (safe for static-serve CI jobs; live assertion is covered by `readiness-gate` in `ci.yml`)
- **404 no-crash** — navigates to a guaranteed-unknown path and asserts no "Something went wrong" error boundary is visible, and the page body is non-empty
- Both describe blocks use `appAvailable` / API availability guards to skip cleanly when targets are not serving

---

### FIX-004 — CI matrix: `health-and-404` added to e2e.yml

**Problem:** The new `health-and-404.spec.ts` was not wired into `.github/workflows/e2e.yml`, so it would not run in CI.

**Fix:** Added a new matrix entry to the `e2e-app` job:
```yaml
- app: health-and-404
  filter: "@workspace/szl-holdings"
  dist: artifacts/szl-holdings/dist/public
  port: 3000
  spec: health-and-404.spec.ts
```
The entry runs against the SZL Holdings static build. The health probe self-skips (no API server in the static-serve job); the 404 no-crash test runs against the SPA's client-side routing.

---

## Mobile Workflow (Diagnosis)

The `artifacts/szl-holdings-mobile: expo` workflow had been shown as "failed" in the project state. Investigation found:

- Metro bundler starts cleanly when restarted
- Web server listens on port 8085
- Expo Go QR code is generated and ready
- Package version warnings are present (e.g. `@types/jest@30` vs expected `~29.5.14`) but do not prevent the app from running
- **Root cause of "failed" state:** The workflow was simply stopped/not running, not crashed. It requires a restart after environment initialization.

**Action taken:** Restarted the workflow; confirmed RUNNING.  
**Follow-up:** Align Expo SDK package versions in a dedicated mobile update pass.

---

### FIX-005 — DB Pool Connection Overflow (`test-env-bootstrap.ts`)

**Problem (root cause confirmed):**
Vitest 4 reuses worker subprocesses across test files (`forks` pool mode). Each test file
and each `vi.resetModules()` call imports `@szl-holdings/db` fresh, creating a new
`node-postgres` `Pool`. With the production defaults (`DB_POOL_MIN=1`,
`DB_IDLE_TIMEOUT_MS=60000`) every pool eagerly holds **1 idle connection for 60 s** after
its test file finishes. After 30–40 test files across 4 workers the total connection count
accumulated and regularly hit Postgres `max_connections=112`. Subsequent
`pool.connect()` calls retried for exactly `connectionTimeoutMillis=30000 ms`, matching
the `hookTimeout` — producing a cascade of "all hooks failed at exactly 30s" across
14+ test files (guardian-tool-mesh-persistence ×12, vessels-bol ×2,
atlas-execution-persistence ×3, atlas-run-persistence ×1, etc.).

A secondary effect: when a test times out (describe-level `{timeout: 30_000}`), any
in-flight `supertest` HTTP request is abandoned but continues holding an active DB
connection. Because that connection is never idle it won't be released by
`idleTimeoutMillis`. These "ghost" connections compound pool exhaustion for the next
test file (soft deadlock: the next file's `pool.connect()` waits 30 s, matching the
describe timeout).

**Evidence:**
- DB connections grew from 24 → 34+ during previous test runs (monitored live)
- After fix: connections dropped to 4–5 and stayed stable throughout the run
- Every failure occurred at exactly 30 s — matching `connectionTimeoutMillis` + `hookTimeout`

**Fix applied** — `artifacts/api-server/src/__tests__/helpers/test-env-bootstrap.ts`:
```ts
process.env.DB_POOL_MIN ??= '0';           // no eager connections
process.env.DB_POOL_MAX ??= '10';          // bounded concurrency per pool
process.env.DB_IDLE_TIMEOUT_MS ??= '8000'; // release idle connections after 8 s
process.env.DB_CONNECT_TIMEOUT_MS ??= '5000'; // fail-fast, breaks deadlock cascade
```
`??=` ensures any explicitly-supplied environment value takes precedence.

**Prerequisite applied earlier:**
- `vitest.config.ts`: added `fileParallelism: false` to run test files one at a time
  (limits the worst-case rate of pool accumulation).

**Verification:** DB connection count ≤ 5 throughout subsequent test run; failures under
investigation for any remaining pre-existing issues not caused by connection exhaustion.

---

## What Was NOT Fixed (Out of Scope)

| Issue | Reason not fixed |
|-------|-----------------|
| Biome lint 5796 errors | Pre-existing; not regression from Phase A/B; would require a dedicated lint pass |
| Turbo cascade abort (ontology build) | Pre-existing build configuration issue; individual packages pass |
| lyte-metrics-store Python structlog | Pre-existing Nix environment gap |
| Integration tests requiring live DB | By design; run in CI with postgres service container |
| Expo package version mismatches | Functional, not fatal; planned for mobile update task |
