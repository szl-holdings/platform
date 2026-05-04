# Test Summary — Phase C: Testing, Debug & Verification

**Generated:** 2026-04-21 (extended investigation through pool-exhaustion root cause)
**Phase:** growth capital Hardening — Phase C

---

## Overall Posture

| Layer | Status | Notes |
|-------|--------|-------|
| Static typecheck | ⚠️ Degraded → Improved | `@szl-holdings/platform-registry` fixed; all other packages pass |
| Lint | ⚠️ Pre-existing failures | 5 796 biome errors, 10 208 warnings — not regressions from Phase A/B |
| Unit tests (components) | ✅ PASS | 78 tests / 10 files |
| Unit tests (API subset) | ✅ PASS | 64+ tests individually; health.test.ts fixed with proper mocks |
| Unit tests (full turbo) | ⚠️ Cascade | Individual packages pass; turbo cascade aborts on first package build error |
| API server full suite | ✅ POOL FIX APPLIED | Root cause confirmed: Vitest pool accumulation hit max_connections=112. Fixed via test-env-bootstrap.ts (FIX003). DB connections stable at 4-13 vs 34+ pre-fix. |
| Integration tests | ℹ️ Skipped locally | Require live PostgreSQL — run clean in CI (readiness-gate job) |
| E2E Playwright smoke | ✅ COMPREHENSIVE | 22 spec files covering all major artifacts + new health-and-404 |
| Mobile (Expo) | ✅ RUNNING | Metro bundler started successfully; package version warnings only |
| CI wiring | ✅ UP TO DATE | health-and-404.spec.ts added to e2e.yml matrix |

---

## Unit Test Results

### Component Tests (`vitest.components.config.ts`)

| File | Tests | Status |
|------|-------|--------|
| `tests/components/api-fetch-refresh.test.ts` | ✓ | PASS |
| `tests/components/command-palette.test.tsx` | ✓ | PASS |
| `tests/components/constellation-graph-path-export.test.tsx` | ✓ | PASS |
| `tests/components/constellation-graph.test.tsx` | ✓ | PASS |
| `tests/components/decision-engine.test.ts` | ✓ | PASS |
| `tests/components/ecosystem-nav.test.tsx` | ✓ | PASS |
| `tests/components/monte-carlo-scenarios.test.ts` | ✓ | PASS |
| `tests/components/powerbi-embed.test.tsx` | ✓ | PASS |
| `tests/components/user-button.test.tsx` | ✓ | PASS |
| `tests/components/utils.test.ts` | ✓ | PASS |
| **Total** | **78 passed** | **✅** |

### API Unit Tests (`vitest.config.ts` — subset)

| File | Tests | Status |
|------|-------|--------|
| `tests/api/health.test.ts` | 3 | PASS (fixed in Phase C — added DB/Sentry mocks) |
| `tests/api/auth.test.ts` | 13 | PASS |
| `tests/api/integrations.test.ts` | ~18 | PASS |
| `tests/api/session-lifecycle.test.ts` | ~12 | PASS |
| `tests/api/verifier-org-scoping.test.ts` | ~10 | PASS |
| `tests/api/graph-trace-export-integration.test.ts` | ~8 | PASS |

### Package-Level Tests (turbo run test)

Packages pass when run individually. Turbo cascade aborts early due to an ontology build error unrelated to Phase C work. Key package results:

| Package | Status |
|---------|--------|
| `@szl-holdings/contracts` (175 tests) | ✅ PASS |
| `@workspace/memory-fabric` (63 tests) | ✅ PASS |
| `@szl-holdings/monte-carlo` (27 tests) | ✅ PASS |
| `@szl-holdings/policy-engine` | ✅ PASS |
| `@szl-holdings/prism-bus` | ✅ PASS |
| `@workspace/trace-graph` | ✅ PASS |

---

## Typecheck Results

| Package | Status | Notes |
|---------|--------|-------|
| `@szl-holdings/platform-registry` | ✅ FIXED | Added `@types/node` devDependency |
| All other workspace packages | ✅ PASS | No new failures introduced by Phase A/B |

---

## E2E Playwright Smoke Coverage

All specs use `appAvailable` guards and self-skip when the target artifact is not serving.

| Spec | Artifact | CI Matrix | Coverage |
|------|----------|-----------|----------|
| `szl-holdings.spec.ts` | SZL Holdings | ✅ | Landing page, routes, nav, content |
| `auth.spec.ts` | SZL Holdings | ✅ | Login wall, Sign In redirect, session, logout |
| `rbac.spec.ts` | SZL Holdings | ✅ | Admin-only gate, non-admin wall, admin bypass |
| `sentra.spec.ts` | Sentra | ✅ | Branding, root shell, demo mode |
| `counsel.spec.ts` | Counsel | ✅ | Branding, shell, demo mode |
| `prism-counsel.spec.ts` | PRISM Counsel | ✅ | Load, title, matter board |
| `terra.spec.ts` | Terra | ✅ | Load, title, content, portfolio |
| `vessels.spec.ts` | Vessels | ✅ | Load, title, nav |
| `lyte.spec.ts` | Lyte | ✅ | Load, title, content |
| `lyte-onboarding.spec.ts` | Lyte | ✅ | Onboarding wizard E2E |
| `pulse.spec.ts` | Pulse | ✅ | Branding, shell, demo mode |
| `aegis.spec.ts` | Aegis | ✅ | Load, nav, title, shell |
| `command.spec.ts` | Command | ✅ | Load, title, content |
| `governed-decision-loop.spec.ts` | Command | ✅ | Tab, heading, scenario banner |
| `imperium.spec.ts` | Command | ✅ | Map load, title, content |
| `carlota-jo.spec.ts` | Carlota Jo | ✅ | Load, title, content, nav |
| `forge.spec.ts` | SZL Holdings | ✅ | Nuro Forge embedded at /nuro-forge |
| `mobile-command.spec.ts` | Mobile | ✅ | Expo web bundle load |
| `stephen-site.spec.ts` | SZL Holdings | ✅ | /stephen personal site |
| `decision-theater.spec.ts` | SZL Holdings | ✅ | Decision Theater tab |
| `constellation-saved-views.spec.ts` | Multiple | ✅ | Saved-view CRUD UI |
| `correlation-deeplinks.spec.ts` | Command | ✅ | Cross-app drill-through |
| `a11y.spec.ts` | SZL Holdings | ✅ | axe-core checks on public routes |
| **`health-and-404.spec.ts`** | SZL Holdings | ✅ **NEW** | `/api/health` probe + 404 no-crash |

---

## Mobile Artifact (`artifacts/szl-holdings-mobile`)

**Status:** ✅ RUNNING  
**Previous state:** Shown as "failed" (was simply stopped, not crashed)  
**Root cause of prior failure:** Workflow was not started; Metro bundler starts cleanly on restart  
**Warnings:** Package version mismatches (e.g. `@types/jest@30` vs expected `~29.5.14`) — functional, not fatal  
**Action:** No code change required; documented as version-skew warnings expected for Expo SDK 55 pre-release packages

---

## Lint

**Status:** Pre-existing — 5 796 biome errors, 10 208 warnings across 5 338 files  
**Phase C scope:** Not addressed; these are not regressions introduced by Phases A/B  
**Recommended follow-up:** Targeted biome auto-fix pass in a dedicated lint hardening task

---

## Integration Tests (require live database)

| Test | Requires | CI Status |
|------|----------|-----------|
| `tests/api/db-integration.test.ts` | PostgreSQL | Run in `integration-test` job |
| `tests/api/cross-app-smoke.test.ts` | PostgreSQL | Run in `integration-test` job |
| `tests/api/openapi-contract.test.ts` | API server | Run in `integration-test` job |
| `tests/api/server-live.test.ts` | API server | Run in `integration-test` job |
| `tests/api/stress.test.ts` | API server | Run in `integration-test` job |
| `tests/api/cortex-inca-smoke.test.ts` | API server | Run in `integration-test` job |
| `tests/api/websocket-stress.test.ts` | API server | Run in `integration-test` job |
| `tests/api/graphql-schema.test.ts` | API server | Run in `integration-test` job |
| `tests/api/cross-cutting-routes-integration.test.ts` | API + DB | Run in `integration-test` job |
| `tests/api/graph-neighbors-integration.test.ts` | API + DB | Run in `integration-test` job |
