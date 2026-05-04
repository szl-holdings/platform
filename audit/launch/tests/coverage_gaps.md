# Test Coverage Gaps
**Phase:** 8 + 11  
**Date:** April 19, 2026  
**Auditor:** growth capital Launch Readiness Program (Task #2068)

---

## Coverage Gap Summary

| Category | Estimated Coverage | Gap |
|---|---|---|
| Core domain logic (policy, proof, simulation) | ~85% | ✅ Good |
| API routes (unit) | ~70% | 🟡 Needs admin + billing coverage |
| API routes (integration) | ~60% | 🟡 Some routes smoke-only |
| Frontend components | ~50% | ⚠️ Significant gap |
| E2E golden flows | ~80% (by screen count) | 🟡 Needs auth-gate and failure-path coverage |
| Database migrations | ~90% | ✅ Good |
| Security-critical paths | ~90% | ✅ Good (post hardening sprint) |

---

## Specific Coverage Gaps

### CG001 — Admin Route Tests

| Gap | Admin routes (`/api/admin/*`) have unit coverage only; no integration tests |
|---|---|
| Risk | Admin mutations could regress silently |
| Recommended action | Add integration tests for top 5 admin routes |
| Priority | P2 |

### CG002 — Billing Route Tests

| Gap | Billing routes (`/api/billing/*`) covered by smoke only |
|---|---|
| Risk | Stripe webhook handling could break silently |
| Recommended action | Add integration tests with Stripe test-mode fixtures |
| Priority | P2 |

### CG003 — Frontend Component Coverage

| Gap | ~50% of frontend components have no Vitest component tests |
|---|---|
| Risk | Visual regressions and broken interactions go undetected |
| Recommended action | Add component tests for Decision Twin, Policy Compiler, Entity Graph |
| Priority | P2 |

### CG004 — E2E Failure-Path Coverage

| Gap | Playwright tests cover golden paths; failure paths and empty states not fully covered |
|---|---|
| Risk | Empty/error states broken in production may not be caught in CI |
| Recommended action | Add Playwright tests for: 404, auth failure, empty decision list, API error state |
| Priority | P2 |

### CG005 — Mobile E2E Tests

| Gap | No Playwright/Detox coverage for `szl-holdings-mobile` |
|---|---|
| Risk | Mobile regression goes undetected |
| Recommended action | Add Detox smoke tests for login and dashboard in Expo |
| Priority | P3 |

### CG006 — AI Route Tests (Live vs Mocked)

| Gap | AI routes tested with mocked providers only; no live provider integration tests |
|---|---|
| Risk | Real AI provider changes could break live flows |
| Recommended action | Add integration test with live Anthropic call (canary test) |
| Priority | P3 |

### CG007 — PRISM Counsel Seed Script

| Gap | `scripts/seed-prism-counsel.ts` fails for some recovery tables (DI007) |
|---|---|
| Risk | PRISM Counsel may show incomplete data after seed |
| Recommended action | Fix seed script to match current schema |
| Priority | P2 |

---

## Test Coverage Improvement Plan

| Sprint | Action | Expected Coverage Gain |
|---|---|---|
| Sprint 3 | Admin + billing integration tests | +5% API coverage |
| Sprint 3 | Playwright failure-path tests | +10% E2E coverage |
| Sprint 4 | Frontend component tests (Decision Twin, Policy Compiler) | +15% frontend coverage |
| Sprint 4 | Fix PRISM Counsel seed | Eliminates DI007 |
| Sprint 5 | Mobile smoke tests | New mobile coverage |
| Sprint 5 | AI live integration test | Canary coverage |
