# Test Matrix
**Phase:** 8 + 11  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Test Suite Overview

| Suite | Command | Framework | Count | Status |
|---|---|---|---|---|
| Unit tests | `pnpm test:api` | Vitest | ~180+ | ✅ PASS |
| Component tests | `pnpm test:components` | Vitest | ~120+ | ✅ PASS |
| Proof chain tests | `pnpm test:proof-chain` | Vitest | ~20+ | ✅ PASS |
| Integration tests | `pnpm test:integration` | Vitest | ~60+ | ✅ PASS (some DB tables pending) |
| E2E tests | `pnpm test:e2e` | Playwright | 14 suites | ✅ Suite exists; needs full green run |
| Smoke tests | `pnpm qa:routes` | Node | All routes | ✅ PASS |
| Audit scripts | `pnpm audit:all` | Node | 6 checks | ✅ PASS |

---

## E2E Test Coverage (Playwright)

All tests in `tests/e2e/`:

| Test File | Coverage |
|---|---|
| `governed-decision-loop.spec.ts` | Full 9-step loop (Signal → Outcome) + navigation |
| `auth.spec.ts` | Login, logout, auth gates |
| `lyte.spec.ts` | Lyte golden paths, Decision Twin |
| `command.spec.ts` | Command golden paths, Policy Compiler |
| `aegis.spec.ts` | Aegis golden paths, Adversary Narrative |
| `vessels.spec.ts` | Vessels golden paths, Voyage Risk Twin |
| `terra.spec.ts` | Terra golden paths, Why This Property Now |
| `carlota-jo.spec.ts` | Carlota Jo golden paths |
| `prism-counsel.spec.ts` | PRISM Counsel flows |
| `szl-holdings.spec.ts` | Corporate site, Trust Center |
| `decision-theater.spec.ts` | Decision Theater walkthrough |
| `forge.spec.ts` | Forge AI agent management |
| `a11y.spec.ts` | Accessibility spot-checks |
| `correlation-deeplinks.spec.ts` | Correlation ID deeplinks |

---

## Test Coverage by Category

### Auth Gates
| Test | Status |
|---|---|
| Unauthenticated → redirected to login | ✅ E2E covered |
| Wrong role → 403 response | ✅ Unit covered |
| Session expiry → re-auth required | ✅ Unit covered |
| Admin route requires admin role | ✅ Unit covered |

### Core Domain Logic
| Domain | Unit Tests | Integration Tests |
|---|---|---|
| Policy engine checks | ✅ | ✅ |
| Proof chain append-only | ✅ | ✅ |
| Monte Carlo simulation | ✅ | ✅ |
| Tenant isolation (RAG) | ✅ | ✅ |
| Correlation ID propagation | ✅ | ✅ |
| Workflow state machine | ✅ | ✅ |
| RBAC role checks | ✅ | ✅ |

### API Routes
| Category | Coverage | Notes |
|---|---|---|
| Health endpoints | ✅ | Unit + integration |
| Auth routes | ✅ | Unit |
| Decision routes | ✅ | Integration |
| Policy routes | ✅ | Integration |
| Admin routes | 🟡 | Unit only |
| Billing routes | 🟡 | Smoke only |
| AI routes | 🟡 | Unit only (mocked) |

### DB Tests
| Test | Status |
|---|---|
| Migration runs cleanly from fresh DB | ✅ |
| Seed is idempotent (run twice = same result) | ✅ |
| FK integrity on cascade delete | ✅ |
| Tenant scoping on all domain queries | ✅ |

---

## CI Test Configuration

Tests run on every PR via GitHub Actions:

| Workflow | Trigger | Tests Run |
|---|---|---|
| `ci.yml` | PR, push to main | Typecheck + lint + unit + integration |
| `codeql.yml` | PR + weekly | CodeQL SAST on JS/TS |
| `dependency-review.yml` | PR | High/critical CVE blocking |
| Playwright | PR (optional; on-demand) | E2E suite |

---

## Test Runner Command (Single Command)

```bash
# All tests in one command
pnpm test && pnpm test:integration && pnpm test:e2e && pnpm qa:routes

# Quick pre-commit check
pnpm typecheck && pnpm lint && pnpm test
```
