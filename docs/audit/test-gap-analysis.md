# Test Gap Analysis — SZL Holdings Platform

**Date:** April 16, 2026  
**Scope:** All test suites — unit, integration, E2E, component  
**Platform:** Vitest (unit/integration/component), Playwright (E2E)

---

## Executive Summary

The platform has a working, multi-layered test infrastructure with deterministic CI execution. The main gap is coverage breadth: approximately 27 test files cover 173 route files (~16% route test ratio). The highest-risk surfaces (auth, health, smoke routes, core API contracts) are covered. The remaining gap is systematic coverage of individual domain API routes.

Flaky test isolation: no known flaky tests at time of writing. Tests run deterministically with `pool: forks` and `isolate: true` for integration tests.

---

## 1. Test Suite Inventory

### 1.1 Unit Tests (`vitest.config.ts`)

| Suite | Files | Status |
|-------|-------|--------|
| API version | `tests/unit/api-version/` | ✅ Running |
| Config library | `tests/unit/config/` | ✅ Running |
| Observability / telemetry | `tests/unit/observability/` | ✅ Running |

**Total: ~3 test directories, estimated 8–12 test files**

### 1.2 Integration Tests (`vitest.integration.config.ts`)

| Test File | Purpose | Status |
|-----------|---------|--------|
| `tests/api/cross-app-smoke.test.ts` | Smoke test for all public-facing API routes | ✅ Running |
| `tests/api/openapi-contract.test.ts` | OpenAPI schema contract validation | ✅ Running |
| `tests/api/db-integration.test.ts` | Database integration — real DB queries | ✅ Running |
| `tests/api/graphql-schema.test.ts` | GraphQL schema validation | ✅ Running |
| `tests/api/server-live.test.ts` | Live server startup and basic response validation | ✅ Running |
| `tests/api/stress.test.ts` | API stress test — concurrency and load | ✅ Running |
| `tests/api/cortex-inca-smoke.test.ts` | CORTEX/INCA module smoke tests | ✅ Running |
| `tests/api/websocket-stress.test.ts` | WebSocket connection stress test | ✅ Running |
| `tests/api/auth.test.ts` | Auth endpoint testing | ✅ Running |
| `tests/api/health.test.ts` | Health endpoint validation | ✅ Running |
| `tests/api/integrations.test.ts` | Third-party integration connectivity | ✅ Running |

**Total: 11 integration test files**

### 1.3 Component Tests (`vitest.components.config.ts`)

| Test File | Component | Status |
|-----------|-----------|--------|
| `tests/components/command-palette.test.tsx` | Command palette | ✅ Running |
| `tests/components/powerbi-embed.test.tsx` | PowerBI embed component | ✅ Running |
| `tests/components/ecosystem-nav.test.tsx` | Ecosystem navigation | ✅ Running |
| `tests/components/user-button.test.tsx` | User button | ✅ Running |
| `tests/components/utils.test.ts` | Shared component utilities | ✅ Running |

**Total: 5 component test files**

### 1.4 E2E Tests (Playwright)

| Spec File | App | Routes Covered | Status |
|-----------|-----|----------------|--------|
| `tests/e2e/szl-holdings.spec.ts` | SZL Holdings Dashboard | Dashboard, nav, modules | ✅ Running |
| `tests/e2e/aegis.spec.ts` | Aegis / Firestorm | Security modules, overview | ✅ Running |
| `tests/e2e/terra.spec.ts` | Terra | Real estate intelligence modules | ✅ Running |
| `tests/e2e/vessels.spec.ts` | Vessels | Maritime intelligence modules | ✅ Running |
| `tests/e2e/carlota-jo.spec.ts` | Carlota Jo | Consulting site | ✅ Running |
| `tests/e2e/command.spec.ts` | Command Portal | Unified command dashboard | ✅ Running |
| `tests/e2e/lyte.spec.ts` | Lyte | Business observability | ✅ Running |
| `tests/e2e/forge.spec.ts` | Forge | Deal management | ✅ Running |
| `tests/e2e/prism-counsel.spec.ts` | Counsel | Legal intelligence | ✅ Running |
| `tests/e2e/stephen-site.spec.ts` | Stephen Site | Personal/portfolio site | ✅ Running |
| `tests/e2e/imperium.spec.ts` | IMPERIUM | Enterprise management | ✅ Running |
| `tests/e2e/a11y.spec.ts` | SZL Holdings (public routes) | WCAG 2.0/2.1 A/AA axe-core checks | ✅ Running |

**Total: 12 E2E spec files**

---

## 2. Coverage Gaps

### 2.1 Route Coverage Gap (HIGH)

**Metric:** ~27 test files for ~173 route files ≈ **16% route test ratio**

**What is covered:**
- Health endpoints (`/api/health`, `/api/healthz`, `/api/health/*`)
- Auth endpoints (`/api/auth/*`)
- Public-facing API contract (OpenAPI validation)
- Cross-app smoke tests (all route prefixes get a basic connectivity check)
- All major frontend apps (E2E)

**What is not covered by dedicated tests:**
- Individual domain route handlers (CRUD operations per entity)
- POST/mutation paths for most domain APIs
- Error response shapes from domain endpoints
- Rate limiter behavior
- WebSocket message protocol beyond stress tests

**Remediation:** See existing backlog items — "Extend integration tests to cover POST/mutation paths for Vessels and Firestorm"

### 2.2 POST/Mutation Path Coverage (HIGH)

**Gap:** Integration tests focus primarily on GET/read paths. POST, PUT, PATCH, DELETE paths for domain entities (Vessels fleet records, Aegis threats, Terra properties, etc.) are not systematically tested.

**Risk:** Regressions in write paths may not be caught until E2E or manual QA.

**Remediation:** Active backlog item. Priority: Vessels and Firestorm first (per existing task).

### 2.3 Component Test Coverage (MEDIUM)

**Covered:** 5 shared-ui components  
**Not covered:** ~50+ domain-specific components in individual apps

**Risk:** Component regressions not caught at unit level; fall through to E2E which is slower and harder to debug.

### 2.4 a11y Test Coverage ✅ RESOLVED

**Previous state:** No automated axe-core scan in CI.

**Current state:** `@axe-core/playwright` integrated and running in CI.

- `tests/e2e/a11y.spec.ts` — axe-core WCAG 2.0/2.1 A/AA checks on all 5 critical public routes of SZL Holdings (`/`, `/about`, `/contact`, `/trust-center`, `/ecosystem`)
- Separate `a11y` job in `e2e.yml` — blocks the E2E gate on failure
- Checks for critical and serious violations; fails immediately on any critical violation
- Reports uploaded as `playwright-report-a11y` artifact on every run

**Remaining scope:** Other apps (Carlota Jo, Stephen Site) do not yet have dedicated a11y spec files. These are tracked in the backlog (Task #912).

---

## 3. Test Configuration Assessment

### 3.1 Unit (`vitest.config.ts`)

| Setting | Value | Assessment |
|---------|-------|-----------|
| Environment | `node` | ✅ Correct |
| Globals | `true` | ✅ Standard |
| Timeout | `15000ms` | ✅ Appropriate |
| Coverage provider | `v8` | ✅ Standard |
| Coverage reporters | `text`, `json`, `html` | ✅ Good |
| Integration tests excluded | ✅ | ✅ Correct separation |

### 3.2 Integration (`vitest.integration.config.ts`)

| Setting | Value | Assessment |
|---------|-------|-----------|
| Pool | `forks` | ✅ Isolation — prevents cross-test contamination |
| Isolate | `true` | ✅ Deterministic execution |
| Timeout | `30000ms` | ✅ Appropriate for DB/network tests |
| Parallel execution | No | ✅ Avoids DB race conditions |

### 3.3 E2E (Playwright)

| Setting | Value | Assessment |
|---------|-------|-----------|
| `trace` | `retain-on-failure` | ✅ Set |
| `screenshot` | `only-on-failure` | ✅ Set |
| `video` | `retain-on-failure` | ✅ Set |
| `retries` in CI | `2` | ✅ Handles transient failures |
| `forbidOnly` in CI | `true` | ✅ Prevents `.only` from blocking CI |
| `workers` | `1` | ✅ Sequential — avoids port conflicts |
| Artifact upload on failure | ✅ | ✅ Traces, screenshots uploaded |

---

## 4. Known Flaky Tests

**None identified at time of analysis.**

Test stabilization measures in place:
- Integration tests use `pool: forks` + `isolate: true`
- E2E tests use `retries: 2` in CI
- E2E tests run sequentially (`workers: 1`)
- All tests use explicit `testTimeout` values

**If flaky tests emerge:** quarantine immediately using `test.skip()` with a comment linking to the tracking issue. Do not let flaky tests remain in the active test suite masquerading as confidence.

---

## 5. CI Integration Assessment

### Current CI Split

**Required gates (ci.yml) — block merge on failure:**
- Lint
- Typecheck
- Unit tests (`pnpm run test`)
- Build (all packages)
- Integration tests (`pnpm test:integration`) — added April 16, 2026; runs with Postgres 16 service container

**E2E gate (e2e.yml) — block merge on failure:**
- App-level smoke tests across all 11 artifacts
- Accessibility checks via axe-core (`tests/e2e/a11y.spec.ts`) — added April 16, 2026; fails E2E gate on critical violations

**Security gate (security.yml) — block merge on failure:**
- Dependency vulnerability scan + SBOM generation
- Secret scan (`scripts/qa/scan-secrets.js`) — added April 16, 2026
- Lockfile integrity check

**Optional/informational (separate workflows):**
- Lighthouse performance (`lighthouse.yml`) — informational gate
- CodeQL (`codeql.yml`) — security informational
- Dependency review (`dependency-review.yml`) — blocks on high-severity new deps for PRs

---

## 6. Recommendations (Priority Order)

| Priority | Recommendation | Effort | Status |
|----------|---------------|--------|--------|
| HIGH | Add integration test step to `ci.yml` (run `pnpm test:integration`) | Small | ✅ Done — April 16, 2026 |
| HIGH | Extend POST/mutation tests for Vessels and Firestorm APIs | Medium | ⚠️ Active backlog |
| MEDIUM | Add axe-core a11y checks to critical E2E specs | Small | ✅ Done — April 16, 2026 |
| MEDIUM | Add component tests for 10 most-used domain components | Medium | ⚠️ Active backlog |
| LOW | Add a11y smoke route checks to other public apps | Small | ⚠️ Active backlog (Task #912) |

---

*Analysis performed: April 16, 2026. Re-run this analysis quarterly or after major new feature additions.*
