# Automation Coverage Plan
**Generated:** 2026-04-03
**Phase:** Post-Payload Phase 6-7 — Readiness Gates + Automation Coverage

---

## Purpose

This document defines the complete automation strategy for the SZL Holdings platform — what is covered today, what gaps remain, and the path to full automation coverage before each maturity gate.

---

## Current Coverage State

### Static Analysis (CI)
| Check | Tool | Status | Runs On |
|-------|------|--------|---------|
| TypeScript typecheck | `tsc --noEmit` | Active | Every PR/push |
| Lint | ESLint | Active | Every PR/push |
| Build verification (all web apps) | `pnpm build` | Active | Every PR/push |
| Build verification (API server) | `pnpm build` | Active | Every PR/push |
| Unit / integration tests | Vitest | Active | Every PR/push |
| Coverage upload | v8 coverage | Active | Every PR/push |

### E2E Tests (E2E CI Job)
| App | Smoke | Routes | Journey | Mobile | Status |
|-----|-------|--------|---------|--------|--------|
| SZL Holdings | 5 tests | 4 routes | 2 tests | 2 tests | Active |
| Lyte Command Center | 5 tests | 5 routes | 3 tests | 2 tests | Active |
| Aegis | 5 tests | 7 routes | 4 tests | 2 tests | Active |
| Terra | 5 tests | 7 routes | 4 tests | 3 tests | Active |
| Vessels | 5 tests | 7 routes | 4 tests | 2 tests | Active |
| Carlota Jo | 5 tests | 6 routes | 4 tests | 2 tests | Active |
| Stephen Lutar | 5 tests | 3 routes | 2 tests | 2 tests | Active |

### API Testing
| Area | Tool | Status |
|------|------|--------|
| Unit tests for API handlers | Vitest | Partial |
| Integration tests (DB layer) | Vitest | Partial |
| Contract tests (Zod schema validation) | Vitest + api-zod | Partial |
| Load / stress testing | None | Gap |
| Security scan (SAST) | None | Gap |
| Dependency audit | None | Gap |

---

## Coverage Gaps

### Gap 1: API Integration Test Coverage
**Current:** Unit tests exist for some API handlers. No systematic integration test coverage.
**Target:** 80% of API endpoints have integration tests verifying request/response contracts.
**Priority:** P1 — Required for Beta Candidate
**Estimated effort:** 3–5 days

### Gap 2: Load / Performance Testing
**Current:** No load testing configured.
**Target:** Each app survives 2x expected peak concurrent users.
**Priority:** P1 — Required for Production-Ready
**Tool:** k6 or Artillery
**Estimated effort:** 2–3 days setup + 1 day per app

### Gap 3: Dependency Vulnerability Audit (Automated)
**Current:** No automated dependency scanning in CI.
**Target:** `pnpm audit` (or Snyk/Trivy) runs on every PR, blocks on critical CVEs.
**Priority:** P1 — Required for Beta Candidate
**Estimated effort:** 1 day

### Gap 4: SAST (Static Application Security Testing)
**Current:** No SAST in CI.
**Target:** CodeQL or Semgrep runs on every PR, reports are reviewed.
**Priority:** P2 — Required for Production-Ready
**Estimated effort:** 1 day

### Gap 5: Accessibility Automated Testing
**Current:** No automated a11y testing.
**Target:** `axe-core` or `@axe-core/playwright` checks on main pages.
**Priority:** P2 — Required for Production-Ready
**Estimated effort:** 2–3 days

### Gap 6: Scheduled / Canary E2E Runs
**Current:** E2E runs only on push/PR.
**Target:** Scheduled E2E run every 4h against staging to catch regressions.
**Priority:** P2 — Required for Production-Ready
**Estimated effort:** 0.5 days (add cron trigger to e2e.yml)

### Gap 7: Visual Regression Testing
**Current:** No visual regression tests.
**Target:** Chromatic or Percy for key UI components.
**Priority:** P2 — Nice-to-have before GA
**Estimated effort:** 2–3 days

### Gap 8: Mobile E2E (Real Device / Expo)
**Current:** Mobile viewport tests in Playwright (browser simulation).
**Target:** Detox or EAS test for Expo apps on real device emulators.
**Priority:** P2 — Required for Production-Ready (mobile apps)
**Estimated effort:** 3–5 days

---

## Automation Roadmap

### Phase A: Beta Candidate Gate (Next 2–4 weeks)
1. Add `pnpm audit` step to `ci.yml` — blocks on critical CVEs
2. Add API integration test suite for top 20 endpoints
3. Expand E2E journey tests to cover authenticated flows (client portal, booking confirmation)
4. Add `@axe-core/playwright` snapshot to E2E runs for P0 a11y violations

### Phase B: Beta Hardening (Weeks 4–8)
1. Implement k6 load test baselines (10 concurrent users per app)
2. Add CodeQL SAST workflow
3. Add scheduled E2E cron job (every 6h against staging)
4. Expand mobile viewport E2E to cover all critical flows

### Phase C: Production-Ready Gate (Weeks 8–12)
1. Visual regression baseline with Chromatic
2. Full accessibility audit with automated + manual pass
3. Real device mobile E2E for Expo apps (EAS Test)
4. Disaster recovery drill (backup restore) — manual, documented

---

## CI Pipeline Health Targets

| Metric | Current | Target (Beta) | Target (Prod-Ready) |
|--------|---------|--------------|---------------------|
| CI pass rate | ~90% | 95%+ | 99%+ |
| E2E pass rate | ~85% | 95%+ | 99%+ |
| Average CI run time | ~12 min | < 15 min | < 15 min |
| Critical CVEs in deps | Unknown | 0 | 0 |
| API endpoint test coverage | < 20% | 50% | 80% |

---

## Artifact Capture Summary

All failures automatically capture:
- HTML test reports (always, 14-day retention)
- Screenshots on failure (7-day retention)
- Playwright traces on failure (7-day retention, replay with `show-trace`)
- JUnit XML reports (for CI dashboard integration)
- Coverage reports from Vitest (always)
