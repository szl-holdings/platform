# Test Matrix — SZL Holdings Platform

**Date:** April 18, 2026  
**Auditor:** Platform Engineering  
**Source:** `docs/audit/test-gap-analysis.md`, CI configuration, codebase scan

---

## Test Infrastructure Overview

| Layer | Tool | Location | Status |
|-------|------|---------|--------|
| Unit / Integration | Vitest | `*/src/**/*.test.ts` | Active |
| E2E | Playwright | `artifacts/*/e2e/` | Active (Chromium only) |
| API smoke tests | Custom JS | `scripts/qa/smoke-test-integrations.js` | Active |
| Deprecated link check | Custom JS | `scripts/qa/check-deprecated-links.js` | Active |
| Slide validation | `scripts/validate-slides.ts` | Aegis slides | Active |
| Zod coverage enforcement | `scripts/check-zod-coverage.sh` | CI gate at 80% | Active |
| Security (SAST) | None (gap) | N/A | Not configured |

---

## Unit / Integration Test Coverage

| Artifact / Package | Test Files | Route Files | Coverage % | Status |
|-------------------|-----------|-------------|-----------|--------|
| api-server | ~27 | 173 | ~16% | POOR |
| lib/ai-engine | 3 | — | Partial | |
| lib/analytics | 2 | — | Partial | |
| lib/audit | 2 | — | Partial | |
| lib/covenant-policy | 2 | — | Partial | |
| lib/monte-carlo | 2 | — | Partial | |
| lib/outcome-graph | 2 | — | Partial | |
| lib/proof-chain | 2 | — | Partial | |
| lib/prism-bus | 2 | — | Partial | |
| lib/shared-ui | 2 | — | Partial | |
| lib/workflow-engine | 2 | — | Partial | |
| lib/services | 2 | — | Partial | |
| lib/forge-runtime | 1 | — | Partial | |
| packages/atlas-core | 3 | — | Partial | |
| packages/ai-control-plane | 2 | — | Partial | |
| packages/policy-engine | 2 | — | Partial | |
| packages/observability-core | 2 | — | Partial | |

**Overall unit/integration coverage: ~16% route coverage (27 test files vs 173 route files)**

---

## E2E Test Coverage (Playwright)

| Artifact | E2E Tests | Key Flows Covered | Status |
|---------|-----------|------------------|--------|
| szl-holdings | Yes | Landing, Trust Center, Lyte, Nuro Forge, Decision Center | ✅ |
| command | Yes | Strategy, Operations, Approvals, Infrastructure | ✅ |
| vessels | Yes | Fleet, Intelligence, Ports | Partial |
| terra | Yes | Properties, Portfolio, Market | Partial |
| aegis | Yes | Threats, Vulnerabilities, Compliance | Partial |
| carlota-jo | Yes | Landing, Services, Contact | ✅ |
| pulse | None | — | ❌ |
| api-server | None (covered by smoke tests) | Health endpoints | ✅ via smoke |
| szl-holdings-mobile | None (manual only) | — | Manual |

---

## Smoke Test Coverage

| Test Name | Location | Scope | Status |
|-----------|---------|-------|--------|
| Platform health | `scripts/qa/smoke-test-integrations.js` | `GET /api/health` variants | ✅ |
| Auth endpoints | Same | Login, callback | ✅ |
| GraphQL | Same | Apollo health | ✅ |
| Key routes | Same | Spot check per artifact | Partial |

---

## Zod Validation Coverage

| Metric | Value |
|--------|-------|
| Route files scanned | 285 |
| Routes with Zod validation | 242 |
| Coverage | 84% |
| CI floor | 80% |
| Status | ✅ PASSING |

---

## Test Gaps by Severity

| ID | Gap | Severity | Affected Area |
|----|-----|---------|--------------|
| TM-001 | No unit tests for 16 of 173 API route files | HIGH | API Server — security regression risk |
| TM-002 | No E2E tests for Pulse | MEDIUM | Pulse briefing flows |
| TM-003 | No E2E tests for mobile (Expo) | MEDIUM | Mobile CORTEX command |
| TM-004 | Playwright targets Chromium only — no Firefox/Safari | MEDIUM | Browser compat |
| TM-005 | No load / stress tests | MEDIUM | Unknown capacity limits |
| TM-006 | No mutation testing | LOW | Test quality confidence |
| TM-007 | No visual regression tests | LOW | UI regressions undetected |
| TM-008 | SAST (static analysis security testing) not configured in CI | HIGH | Security — missing OWASP checks |
| TM-009 | No API contract tests (Pact or similar) | LOW | Client/server drift |

---

## CI Configuration

| CI Check | File | Status |
|----------|------|--------|
| Lint | `.github/workflows/ci.yml` | ✅ |
| Type check | `.github/workflows/ci.yml` | ✅ |
| Unit tests (Vitest) | `.github/workflows/ci.yml` | ✅ |
| E2E tests (Playwright) | `.github/workflows/ci.yml` | ✅ |
| Zod coverage gate (80%) | `scripts/check-zod-coverage.sh` in CI | ✅ |
| Deprecated link check | `check-deprecated-links` workflow | ✅ |
| Container publish | `.github/workflows/container-publish.yml` | ✅ (after GAP-008 fix) |
| Integration test node/pnpm version | `.github/workflows/ci.yml` | ✅ (after GAP-009 fix) |
| SAST | Not configured | ❌ |
| Dependency audit | Not configured | ❌ |

---

## Test Run Command Reference

```bash
# Unit tests
pnpm test

# E2E tests
pnpm --filter @workspace/szl-holdings run test:e2e

# Smoke tests (against running dev server)
node scripts/qa/smoke-test-integrations.js

# Deprecated link check
node scripts/qa/check-deprecated-links.js

# Zod coverage check
bash scripts/check-zod-coverage.sh

# All CI checks locally
pnpm lint && pnpm typecheck && pnpm test
```

---

## Recommendations

1. **Priority 1:** Add E2E for Pulse (5 test cases covers critical demo paths)
2. **Priority 2:** Expand unit test coverage for API routes to 30%+ (focus on write paths)
3. **Priority 3:** Configure SAST (ESLint security rules + npm audit) in CI
4. **Priority 4:** Add Firefox to Playwright matrix for cross-browser compat

---

*See also: `docs/audit/GAP_MATRIX.md` (TM-001 through TM-009 tracked as GAP-018/019/020)*
