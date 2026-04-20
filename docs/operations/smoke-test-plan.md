# Smoke Test Plan — SZL Holdings Platform

**Last updated:** 2026-04-16  
**Owner:** Engineering / QA Lead  
**Purpose:** Minimum test suite to verify system health before and after every deployment

---

## Overview

A smoke test validates that the system is operationally alive — it does not validate correctness of business logic. The smoke suite should run in under 5 minutes and block deployments if any test fails.

---

## Smoke Test Tiers

### Tier 0 — Infrastructure Health (< 30 seconds)

These checks must pass before any other tier runs.

| Check | Method | Expected | Tool |
|-------|--------|----------|------|
| API server reachable | `GET /api/healthz` | HTTP 200, `{"status":"ok"}` | `scripts/qa/smoke-routes.js` |
| Database connection | `GET /api/healthz` DB check | No DB error in response | Health route |
| Redis connection | Internal liveness check | Ping responds | Health route |
| All artifact servers respond | HTTP GET each artifact root | HTTP 200 | `scripts/qa/smoke-routes.js` |

---

### Tier 1 — API Contract Smoke (< 2 minutes)

Verify that primary API routes respond with correct status codes and shapes.

| Route | Method | Auth | Expected Status | Shape Check |
|-------|--------|------|----------------|-------------|
| `/api/healthz` | GET | None | 200 | `{status:"ok"}` |
| `/api/v1/auth/me` | GET | Session | 200 or 401 | Has `user` or `error` |
| `/api/v1/actions` | GET | Required | 200 | Array response |
| `/api/v1/workflows` | GET | Required | 200 | Array response |
| `/api/v1/approvals` | GET | Required | 200 | Array response |
| `/api/v1/audit` | GET | Required | 200 | Array response |
| `/api/graphql` | POST (introspection) | None | 200 | Has `__schema` |
| `/api/cortex/command-feed` | GET | Required | 200 | Has `signals` |
| `/api/cortex/intelligence-feed` | GET | Required | 200 | Has `signals`, `stats` |
| `/api/vessels/fleet` | GET | Required | 200 | Array or object |
| `/api/aegis/alerts` | GET | Required | 200 | Array response |

**Tool:** `tests/api/cross-app-smoke.test.ts` (integration config)  
**Run:** `pnpm test:integration`

---

### Tier 2 — Artifact Load Smoke (< 3 minutes)

Verify each frontend artifact renders without fatal errors.

| Artifact | URL Path | Expected | Playwright Spec |
|----------|----------|---------|-----------------|
| SZL Holdings | `/` | Title set, no error boundary | `szl-holdings.spec.ts` |
| Aegis | `/aegis` | Title set, nav visible | `aegis.spec.ts` |
| Terra | `/terra` | Title set, no error boundary | `terra.spec.ts` |
| Vessels | `/vessels` | Title set, no error boundary | `vessels.spec.ts` |
| Carlota Jo | `/carlota-jo` | Title set, content loads | `carlota-jo.spec.ts` |
| Command | `/command` | Title set, nav visible | `command.spec.ts` |
| PRISM Counsel | `/prism-counsel` | Title set | `prism-counsel.spec.ts` |
| Lyte | `/lyte-command-center` | Title set | `lyte.spec.ts` |
| Imperium | `/imperium` | Title set | `imperium.spec.ts` |

**Tool:** Playwright  
**Run:** `pnpm playwright test`

---

### Tier 3 — Auth Boundary Smoke (< 1 minute)

Verify that auth barriers are enforced.

| Scenario | Expected |
|----------|---------|
| Unauthenticated `GET /api/v1/actions` | HTTP 401 |
| Unauthenticated `POST /api/v1/workflows` | HTTP 401 |
| Invalid session token on any protected route | HTTP 401 |
| Non-admin user accessing `/api/admin/tenants` | HTTP 403 |

**Tool:** `tests/api/auth.test.ts`  
**Run:** `pnpm test:api`

---

## Smoke Test Execution Order

```
1. Tier 0 — Infrastructure Health        (fail → abort deployment)
2. Tier 1 — API Contract Smoke           (fail → abort deployment)
3. Tier 3 — Auth Boundary Smoke          (fail → abort deployment)
4. Tier 2 — Artifact Load Smoke          (fail → notify team, review before release)
```

---

## Pre-Deployment Smoke Checklist

Before deploying to production:

- [ ] Run `pnpm test` → 0 failures
- [ ] Run `pnpm test:integration` → 0 failures
- [ ] Run `pnpm playwright test` → 0 failures
- [ ] Run `node scripts/qa/smoke-routes.js` against staging → all 200s
- [ ] Run `node scripts/qa/health-check.js` → all services healthy
- [ ] Check no new P0 items in KNOWN-GAPS.md
- [ ] Review LAUNCH_BLOCKERS.md for open blockers

---

## Post-Deployment Smoke Checklist

Within 10 minutes of deploying to production:

- [ ] `GET /api/healthz` → 200
- [ ] At least one protected route returns 200 with a valid session
- [ ] No error spike in logging / Sentry
- [ ] Spot-check one artifact in browser → loads correctly
- [ ] Confirm DB connection via health route

---

## Smoke Test Gaps (as of April 2026)

| Gap | Priority | Plan |
|-----|----------|------|
| No automated post-deploy smoke trigger | P1 | Wire to CI/CD deploy step |
| Billing flow smoke tests absent | P1 | Sprint 3 |
| Mobile app smoke not automated (Expo) | P2 | Sprint 4 |
| No Sentry alert validation in smoke | P2 | Sprint 4 |

---

*See also: TEST_STRATEGY.md, QA_SIGNOFF_CHECKLIST.md, RUNBOOK_COMMON_FAILURES.md*
